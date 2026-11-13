from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import time
import uuid
import random
import logging
import asyncio
from contextlib import suppress
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, field_validator
from pymongo import ASCENDING, IndexModel

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
JWT_ALG = "HS256"
DATE_RE = r"^\d{4}-\d{2}-\d{2}$"
logger = logging.getLogger(__name__)

INDEXES: dict[str, list[IndexModel]] = {
    "users": [IndexModel([("email", ASCENDING)], name="email", unique=True)],
    "login_attempts": [IndexModel([("identifier", ASCENDING)], name="identifier")],
    "daily_inputs": [IndexModel([("date", ASCENDING)], name="date", unique=True)],
    "items": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "stands": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
}

app = FastAPI()
api = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return uuid.uuid4().hex[:12]


# ---------- Auth ----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())


def create_token(uid: str, email: str) -> str:
    payload = {"sub": uid, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALG)


async def current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Belum login")
    try:
        payload = jwt.decode(auth[7:], os.environ["JWT_SECRET"], algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sesi berakhir, silakan login lagi")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token tidak valid")
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User tidak ditemukan")
    return user


class LoginIn(BaseModel):
    email: str
    password: str


@api.post("/auth/login")
async def login(body: LoginIn, request: Request):
    email = body.email.strip().lower()
    ident = f"{request.client.host if request.client else 'x'}:{email}"
    att = await db.login_attempts.find_one({"identifier": ident})
    if att and time.time() - att.get("last", 0) > 900:
        await db.login_attempts.delete_one({"identifier": ident})
        att = None
    if att and att.get("count", 0) >= 5:
        raise HTTPException(429, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": ident}, {"$inc": {"count": 1}, "$set": {"last": time.time()}}, upsert=True)
        raise HTTPException(401, "Email atau password salah")
    await db.login_attempts.delete_one({"identifier": ident})
    return {"token": create_token(user["id"], email),
            "user": {"id": user["id"], "email": email, "name": user.get("name"), "role": user.get("role")}}


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return user


# ---------- Master data ----------
class ItemIn(BaseModel):
    name: str = Field(min_length=1)
    code_wa: str = ""
    sort_order: int = 0
    is_active: bool = True


class StandIn(BaseModel):
    form_name: str = Field(min_length=1)
    wa_name: str = ""
    omset_name: str = ""
    percup_name: str = ""
    category: Literal["AMK", "AMKOPI"]
    is_active_input: bool = True
    input_order: int = 0
    wa_group: Optional[int] = None
    wa_order: int = 0
    show_csedang_wa: bool = False
    extra_wa_suffix: Optional[str] = None

    @field_validator("wa_group")
    @classmethod
    def check_group(cls, v):
        if v is not None and v not in (1, 2, 3):
            raise ValueError("wa_group harus 1, 2, 3 atau kosong")
        return v


def stand_doc(body: StandIn) -> dict:
    d = body.model_dump()
    for k in ("wa_name", "omset_name", "percup_name"):
        d[k] = d[k].strip() or d["form_name"]
    return d


@api.get("/master")
async def get_master(user: dict = Depends(current_user)):
    items = await db.items.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    stands = await db.stands.find({}, {"_id": 0}).sort("input_order", 1).to_list(500)
    return {"items": items, "stands": stands}


@api.post("/items")
async def create_item(body: ItemIn, user: dict = Depends(current_user)):
    doc = {"id": new_id(), **body.model_dump()}
    await db.items.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/items/{item_id}")
async def update_item(item_id: str, body: ItemIn, user: dict = Depends(current_user)):
    r = await db.items.update_one({"id": item_id}, {"$set": body.model_dump()})
    if not r.matched_count:
        raise HTTPException(404, "Item tidak ditemukan")
    return {"id": item_id, **body.model_dump()}


@api.delete("/items/{item_id}")
async def delete_item(item_id: str, user: dict = Depends(current_user)):
    await db.items.delete_one({"id": item_id})
    return {"ok": True}


@api.post("/stands")
async def create_stand(body: StandIn, user: dict = Depends(current_user)):
    doc = {"id": new_id(), **stand_doc(body)}
    await db.stands.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/stands/{stand_id}")
async def update_stand(stand_id: str, body: StandIn, user: dict = Depends(current_user)):
    d = stand_doc(body)
    r = await db.stands.update_one({"id": stand_id}, {"$set": d})
    if not r.matched_count:
        raise HTTPException(404, "Stand tidak ditemukan")
    return {"id": stand_id, **d}


@api.delete("/stands/{stand_id}")
async def delete_stand(stand_id: str, user: dict = Depends(current_user)):
    await db.stands.delete_one({"id": stand_id})
    return {"ok": True}


# ---------- Daily input ----------
class Entry(BaseModel):
    omset: int = Field(0, ge=0)
    cups: Dict[str, int] = {}
    spg: List[str] = []


class DailyIn(BaseModel):
    date: str = Field(pattern=DATE_RE)
    entries: Dict[str, Entry]


@api.get("/daily-input/{day}")
async def get_daily(day: str, user: dict = Depends(current_user)):
    doc = await db.daily_inputs.find_one({"date": day}, {"_id": 0})
    return doc or {"date": day, "entries": {}, "updated_at": None, "is_dummy": False}


@api.post("/daily-input")
async def save_daily(body: DailyIn, user: dict = Depends(current_user)):
    entries = {k: v.model_dump() for k, v in body.entries.items()}
    ts = now_iso()
    await db.daily_inputs.update_one(
        {"date": body.date},
        {"$set": {"entries": entries, "updated_at": ts}, "$setOnInsert": {"is_dummy": False}},
        upsert=True)
    return {"ok": True, "date": body.date, "updated_at": ts}


@api.get("/daily-inputs")
async def list_daily(start: str = Query(pattern=DATE_RE), end: str = Query(pattern=DATE_RE),
                     user: dict = Depends(current_user)):
    return await db.daily_inputs.find(
        {"date": {"$gte": start, "$lte": end}}, {"_id": 0}).sort("date", 1).to_list(400)


@api.get("/spg-names")
async def spg_names(user: dict = Depends(current_user)):
    docs = await db.daily_inputs.find({}, {"_id": 0, "entries": 1}).sort("date", -1).to_list(120)
    names = set()
    for d in docs:
        for e in d.get("entries", {}).values():
            names.update(s.strip() for s in e.get("spg", []) if s and s.strip())
    return sorted(names)


# ---------- Dummy data ----------
SPG_POOL = ["Rina", "Dewi", "Sari", "Ayu", "Putri", "Lina", "Maya", "Indah", "Nisa", "Wulan",
            "Fitri", "Rani", "Tari", "Yuni", "Eka"]


async def generate_dummy(days: int = 7) -> int:
    stands = await db.stands.find({"is_active_input": True}, {"_id": 0}).to_list(500)
    items = await db.items.find({}, {"_id": 0}).to_list(100)
    by_code = {i.get("code_wa"): i["id"] for i in items}
    today = datetime.now(timezone(timedelta(hours=7))).date()
    created = 0
    for n in range(days):
        day = (today - timedelta(days=n)).isoformat()
        existing = await db.daily_inputs.find_one({"date": day}, {"is_dummy": 1})
        if existing and not existing.get("is_dummy"):
            continue
        entries = {}
        for s in stands:
            amkopi = s["category"] == "AMKOPI"
            cups = {}
            if by_code.get("Ck"):
                cups[by_code["Ck"]] = random.randint(5, 40) if amkopi else random.randint(10, 80)
            if by_code.get("Cb"):
                cups[by_code["Cb"]] = 0 if amkopi else random.randint(5, 60)
            if by_code.get("Csdng"):
                cups[by_code["Csdng"]] = random.randint(3, 30) if s.get("show_csedang_wa") else 0
            entries[s["id"]] = {
                "omset": random.randint(150, 2500) * 1000,
                "cups": cups,
                "spg": (random.sample(SPG_POOL, random.randint(1, 3)) + ["", ""])[:3],
            }
        await db.daily_inputs.update_one(
            {"date": day}, {"$set": {"entries": entries, "updated_at": now_iso(), "is_dummy": True}},
            upsert=True)
        created += 1
    return created


@api.post("/dummy/generate")
async def dummy_generate(user: dict = Depends(current_user)):
    return {"created_days": await generate_dummy(7)}


@api.delete("/dummy")
async def dummy_clear(user: dict = Depends(current_user)):
    r = await db.daily_inputs.delete_many({"is_dummy": True})
    return {"deleted_days": r.deleted_count}


@api.get("/dummy/status")
async def dummy_status(user: dict = Depends(current_user)):
    dates = await db.daily_inputs.distinct("date", {"is_dummy": True})
    return {"dummy_days": len(dates), "dates": sorted(dates)}


# ---------- Seed ----------
ITEMS_SEED = [("12oz", "Ck", 1), ("22oz", "Cb", 2), ("16oz", "Csdng", 3)]

# form_name, category, wa_group, wa_order, wa_name, extras
STANDS_SEED = [
    ("R-1", "AMK", 2, 1, "R-1", {"extra_wa_suffix": ", PTT 0"}),
    ("R-2", "AMK", 2, 2, "R-2", {}),
    ("R-4", "AMK", 2, 6, "R-4", {}),
    ("Lippo", "AMK", 2, 4, "LIPPO", {}),
    ("PA-1", "AMK", 1, 3, "PA 1", {}),
    ("ITC-UG", "AMK", 1, 4, "ITC UG", {}),
    ("BG-L2", "AMK", 1, 5, "BG-L2", {}),
    ("ITC-FC2", "AMK", 1, 6, "ITC FC 2", {}),
    ("TP", "AMK", 1, 8, "TP 1", {"omset_name": "TP-1", "percup_name": "TP"}),
    ("AMK PREMIUM", "AMK", 1, 9, "TP 2", {"omset_name": "TP-2", "percup_name": "AMK PREMIUM", "show_csedang_wa": True}),
    ("TP-3", "AMK", 1, 10, "TP 3", {}),
    ("PTC", "AMK", 3, 1, "PTC", {}),
    ("BG-LL", "AMK", 1, 11, "BG LL", {}),
    ("WTC", "AMK", 1, 1, "WTC", {"show_csedang_wa": True}),
    ("SUNCITY", "AMK", 2, 3, "SUNCITY", {}),
    ("KAZA", "AMK", 1, 7, "KAZA", {"show_csedang_wa": True}),
    ("delta", "AMK", 1, 2, "Delta", {}),
    ("gc", "AMK", 1, 12, "GC", {}),
    ("AMKopi R-1", "AMKOPI", 3, 2, "AMKopi R-1", {}),
    ("AMKopi R-2", "AMKOPI", 3, 3, "AMKopi R-2", {}),
    ("AMKopi R-4", "AMKOPI", 3, 4, "AMKopi R-4", {}),
    ("AMKopi TP-1", "AMKOPI", 3, 5, "AMKopi TP-1", {}),
    ("AMKopi TP-2", "AMKOPI", 3, 6, "AMKopi TP-2", {}),
    ("AMKopi TP-3", "AMKOPI", 3, 7, "AMKopi TP-3", {}),
    ("AMKopi GC", "AMKOPI", 3, 8, "AMKopi GC", {}),
    ("AMKopi Delta", "AMKOPI", 3, 9, "AMKopi Delta", {}),
    ("AMKopi BG-LL", "AMKOPI", 3, 10, "AMKopi BG-LL", {}),
    ("AMKopi BG-L2", "AMKOPI", 3, 11, "AMKopi BG-L2", {}),
]


async def seed():
    admin_email = os.environ["ADMIN_EMAIL"].strip().lower()
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({"id": new_id(), "email": admin_email, "name": "Owner", "role": "admin",
                                   "password_hash": hash_password(os.environ["ADMIN_PASSWORD"]),
                                   "created_at": now_iso()})
    if await db.items.count_documents({}) == 0:
        await db.items.insert_many([{"id": new_id(), "name": n, "code_wa": c, "sort_order": o, "is_active": True}
                                    for n, c, o in ITEMS_SEED])
    if await db.stands.count_documents({}) == 0:
        docs = []
        rows = STANDS_SEED + [("TRANS", "AMK", 2, 5, "TRANS", {"is_active_input": False, "show_csedang_wa": True})]
        for idx, (form, cat, grp, order, wa, extra) in enumerate(rows, start=1):
            d = {"id": new_id(), "form_name": form, "wa_name": wa, "omset_name": form, "percup_name": form,
                 "category": cat, "is_active_input": True, "input_order": idx, "wa_group": grp,
                 "wa_order": order, "show_csedang_wa": False, "extra_wa_suffix": None}
            d.update(extra)
            docs.append(d)
        await db.stands.insert_many(docs)
    if not await db.meta.find_one({"key": "dummy_seeded"}):
        await generate_dummy(7)
        await db.meta.insert_one({"key": "dummy_seeded", "at": now_iso()})


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("startup")
async def startup():
    await ensure_indexes()
    await seed()


@app.on_event("shutdown")
async def shutdown():
    client.close()
