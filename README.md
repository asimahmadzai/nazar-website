# Nazar — Full-stack platform (Node/Express + SQLite + React/TypeScript)
Needs **Node.js 22.13+ (LTS or newer)**. No paid services or API keys.
## Run (VS Code terminal)
```
npm install
npm run dev        # API on :3001 + website on http://localhost:5173
npm test           # backend tests (roles, first-admin race, funding rules, double-booking) + fee tests
npm start          # production-style: builds the site, serves everything from http://localhost:3001
```
## Database
SQLite file `server/nazar.db`, created automatically on first start (schema in `server/app.ts`, 8 sample opportunities seeded). To reset everything: stop the server and delete `server/nazar.db*`.
## First Admin
The first account registered at `/signup` becomes Admin (decided inside one `BEGIN IMMEDIATE` transaction, plus a unique database index allowing only one admin). Everyone after is a Customer; role is never read from the request. **Register yourself first on a fresh database.**
Recovery (needs access to the machine): `npm run reset-admin -- you@email.com NewPassword123`
## Admin Panel (`/admin`)
Opportunities (add/edit/delete/publish/feature, image upload, single- vs multi-investor, Draft→Closed statuses, **record verified funding**), Interests (status + notes), Appointments (confirm/complete/cancel/reschedule, block dates), Customers, Settings (office address, contacts, social URLs, business hours/slots).
## Rules enforced on the server
$3,000 / $5,000 / $6,000 samples are single-investor (interest must equal the full target). Multi-investor: min $500, never above remaining funding. Verified funding comes only from Admin-recorded funding records and cannot exceed the target. Interest/appointments never count as money. Slots can't be double-booked (unique DB index).
## Not implemented / needs work before real use
Email notifications (none sent; the UI says so) · document uploads (images only, stored in the DB) · customer detail pages & per-customer follow-up history · calendar view · customer reschedule request (cancel and rebook instead) · editable legal pages (static text) · password reset by email · HTTPS/hosting config (set NODE_ENV=production behind HTTPS) · rate limiting is basic and in-memory · full Dari/Pashto translations · legal/regulatory review and independent Shariah review. Sample opportunities are fictional.
