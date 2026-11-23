# AMK Daily Input & Pivot Engine — PRD

## Original problem statement
Personal Daily Sales & Inventory Input Web App ("AMK Daily Input & Pivot Engine"), requested in Laravel 11 / SQLite-MySQL / Tailwind / Alpine.js / SheetJS (user also mentioned PHP 8.5). Apple Monochrome mobile-first design; sticky frosted header with date picker, sync pill (Tersimpan di HP (Draft Lokal) / Tersinkronisasi Server), filter chips Semua/AMK/AMKopi/Belum Diisi; vertical stand cards (Omset Rp, 12oz/22oz/16oz cups, spg1-3 with datalist); bottom nav: Input Harian, WA Generator, Pivot & Export, Settings. localStorage draft amk_draft_{date} on every keystroke, 1.5s debounced POST /api/daily-input + "Simpan Sekarang". Seed 3 items + 28 stands + TRANS (inactive input, WA group 2). Exact WA report template (SUM only, Total AMK, Total Kurma 0, Total AMKopi + Ck). Pivot Omset/Percup/SPG by date range + Excel.
User choices: owner-only password login, Bahasa Indonesia, single Excel file with 3 sheets, dummy data + button to clear all dummy data.

## Architecture
Platform runs React + FastAPI + MongoDB (not Laravel/PHP). Backend: /app/backend/server.py (JWT Bearer auth, master CRUD, daily-input per-stand merge upsert, dummy generate/clear, seed on startup). Frontend: React + Tailwind, SheetJS (xlsx). Hooks: useDaily (local draft, debounce, serialized saves, retry every 30s/online, beforeunload guard).

## Implemented (2026-11-13)
- November import: Settings → "Impor Data November 2026" (GET/POST /api/import/nov-2026) writes 2026-11-03..21 from backend/data/import_nov_2026.json (omset, cups, SPG, QRIS 0), never touches 11-01/11-02, AMKopi SPG left to inherit, adds new SPG names (DAFFA, MARTHA, SUDAR, DODIK, ADIT) to Master SPG; safe to run again
- Pre-publish cleanup: no automatic dummy data on a new database (Buat 7 Hari / Hapus Semua Dummy buttons stay); Ganti Password in Settings → Akun (POST /api/auth/change-password, min 8 chars)
- v3 (from uploaded omset.pdf / sal.pdf): 50 pivot rows in exact omset.pdf order (PTC stand mapped to row "AMKopi PTC"; first "delta" row is placeholder, second "delta" = delta stand), columns 1..31, no totals, blank cells without data; Master SPG seeded with 39 names in sal.pdf column order (duplicate SHELA merged); SAL empty cell "-"; dummy data uses those names
- v2 revision: QRIS + Sisa Tunai per stand & daily totals bar (WA unchanged); Pivot OMSET/QRIS/SISA TUNAI on 50 editable fixed rows (provisional list, omset.pdf not provided), TSV copy per tab, Excel sheets OMSET, QRIS, SISA TUNAI, PERCUP, SAL, SPG PER STAND; AMKopi SPG inherits parent stand (locked badge); SPG names UPPERCASE+trimmed; SAL/GAJI payroll matrix (SPG columns, date rows, WA-name cells, TOTAL HADIR (SHIFT) = days worked) + Per Stand view; Settings: Master Daftar SPG, pivot rows editor, stand parent select; new stands auto-added as pivot rows; SPG rename updates history
- Owner login (arielaug78@gmail.com), brute-force lockout
- Input Harian cards, filters, live totals, autosave + local draft restore
- WA Generator with exact template, copy + open WhatsApp
- Pivot Omset/Percup/SPG, Excel export (3 sheets)
- Settings: items & stands CRUD, generate 7-day dummy, clear all dummy (owner-saved days are kept)

## Backlog
- P1: Password reset / change password
- P1: Offline app shell (service worker) so app opens without internet
- P2: Percup matrix as item columns; stand search; remember last tab
