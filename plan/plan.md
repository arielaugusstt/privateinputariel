# AMK Daily Input — Cleanup Before Publish

A personal app for recording daily sales per stand (Omset, QRIS, Sisa Tunai, cups, SPG), with a WhatsApp report, OMSET/QRIS/SISA TUNAI/SAL pivots and Excel export.
This plan gets it ready for the live version first, then publishes it.

## Who it's for
Just the owner (arielaug78@gmail.com), on a phone, every day.

## About revisions after publishing
- Any revision made after publishing only goes live after you tap **Republish**. There are no extra credits per republish.
- Production data stays safe during a republish. The live database and the preview database are separate: data you enter in the live app won't show up in preview, and the other way round.

## Core features and experience (Phase 1 — done now)
1. **No dummy data in the live version**
   - The live app starts with an empty database. It still has the stands, cup items, the 50 omset.pdf rows and the 39 SPG names from sal.pdf.
   - The 7 days of sample data are no longer created automatically. The "Buat 7 Hari" and "Hapus Semua Dummy" buttons stay in Settings in case you want to try things out.
2. **Change password from Settings**
   - A new "Ganti Password" form in the Akun section: current password, new password (at least 8 characters) and repeat new password.
   - Once it's changed, the old password no longer works.
3. **Publish**
   - Once the cleanup is done, the app is published and you get the live link.
   - The first publish uses credits, per the platform's rules. You confirm the cost before it starts.

## User flow
1. Open the live link, then log in with the owner email and the starting password.
2. Settings → Akun → Ganti Password, and set your own password.
3. Start filling in Input Harian with real data. The pivots, WA report and Excel use real data from day one.
4. Want a revision later? Ask in chat, check it in preview, then tap Republish.

## UI/UX feel
No changes: Apple Monochrome black/white, mobile-first. The Ganti Password form uses the same style as the other Settings sections.

## Implementation phases
- **Phase 1 (now):** turn off automatic dummy data on a new database, add Ganti Password, publish.
- **Phase 2:** password reset if you forget it (link sent to your email), and the app can still open with no internet at all.
- **Phase 3:** bold the rows that are shaded blue in omset.pdf, and a quick button for the SAL payroll period from the 21st to the 20th.

## Assumptions
- The dummy data in **preview** is left as it is. Only the live version starts empty.
- The starting password in the live version is the same as in preview (AmkOwner2026!). You change it yourself right after the first login.
- No password reset by email in Phase 1. If you forget the password, it's reset through chat with the agent.
- Mapping from the last revision stays as is: the PTC stand goes into the "AMKopi PTC" row, and the second "delta" row is the delta stand.
- There is only one owner account. No other users get added.
