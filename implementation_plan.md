# St. John de Britto's Church — Full-Stack Platform Implementation Plan

## Overview

A premium, modern, multilingual (English + Tamil) Roman Catholic Church Management Website and Community Platform for **St. John de Britto's Church**, Kalayarkoil, Tamil Nadu.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS v3, Framer Motion, React Router DOM v6 |
| Internationalisation | i18next + react-i18next |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| HTTP | Axios |
| Icons | React Icons (+ Lucide) |
| Backend | Node.js + Express.js |
| Auth | JWT + bcrypt + OTP (Nodemailer) |
| File Uploads | Multer |
| Notifications | Nodemailer (email) + Twilio (SMS/WhatsApp) |
| Database | MongoDB + Mongoose |
| Dev Tools | concurrently, dotenv, morgan, helmet, express-rate-limit |

---

## User Review Required

> [!IMPORTANT]
> The following decisions need your confirmation before full execution:

1. **Twilio**: Real Twilio SMS/WhatsApp requires a paid account. The code will be scaffolded with environment variables — you'll need to add your `TWILIO_ACCOUNT_SID`, `AUTH_TOKEN`, and phone numbers.
2. **Google Maps**: Will use an `<iframe>` embed with the provided coordinates (`RJWM+XQ4`). A Google Maps API key is optional for advanced features.
3. **YouTube/Facebook Live**: Will embed iframes with placeholder stream IDs — you'll need to update with your actual channel links.
4. **Payment/UPI**: Will show UPI QR code as a static image + manual UPI ID display. Real payment gateway (Razorpay/Stripe) integration requires API keys.
5. **Google OAuth**: Will scaffold the button but actual Google login requires a Google Cloud OAuth client ID.
6. **Images**: Will use programmatically generated placeholder images and gradients for church photos. You can replace them with real photos later.

> [!WARNING]
> This is a very large project (~150+ files). Execution will be done in organized phases. The full output may take significant time to generate.

---

## Open Questions

> [!IMPORTANT]
> Please clarify if you have preferences on:
> - **Color theme priority**: Gold + Royal Blue vs. Maroon + Beige as primary gradient?
> - **Default language**: English or Tamil on first load?
> - **Parish Priest name**: Who is the current parish priest to populate the priests page?
> - **MongoDB connection**: Local MongoDB Compass or Atlas cloud URI?

---

## Proposed File Structure

```
rc/
├── frontend/                    # React + Vite app
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── common/          # Navbar, Footer, Loader, etc.
│   │   │   ├── home/            # Hero, EventSlider, BibleVerse, etc.
│   │   │   ├── admin/           # Admin dashboard widgets
│   │   │   └── user/            # User dashboard widgets
│   │   ├── pages/               # Route-level pages
│   │   │   ├── public/          # Home, About, Priests, Mass, Events, Gallery...
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── user/            # User dashboard
│   │   │   └── admin/           # Admin dashboard + modules
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # Axios API service calls
│   │   ├── context/             # Auth context, Theme context, Lang context
│   │   ├── i18n/                # i18next config + translation JSON files
│   │   ├── utils/               # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Node.js + Express
│   ├── src/
│   │   ├── config/              # DB, mailer, twilio config
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Auth, role, rate-limit, upload
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # Express routers
│   │   ├── services/            # Business logic (OTP, mail, SMS)
│   │   ├── utils/               # Validators, helpers
│   │   └── server.js
│   ├── uploads/                 # Multer upload directory
│   ├── .env.example
│   └── package.json
│
├── README.md
└── API_DOCS.md
```

---

## Phased Execution Plan

### Phase 1 — Backend Foundation
- [x] Initialize Node/Express project
- [x] MongoDB + Mongoose setup
- [x] All 12 Mongoose schemas
- [x] JWT + bcrypt auth system
- [x] OTP service (Nodemailer)
- [x] All REST API routes + controllers
- [x] Multer file upload middleware
- [x] Rate limiting + helmet security
- [x] `.env.example`

### Phase 2 — Frontend Foundation
- [x] Vite + React + Tailwind setup
- [x] i18next config (English + Tamil)
- [x] Global design tokens (colors, fonts, animations)
- [x] Auth context + Theme context
- [x] Axios service layer
- [x] Core layout: Navbar, Footer, Loader

### Phase 3 — Public Pages (13 pages)
- [x] Home page (hero, events slider, bible verse, countdown, etc.)
- [x] About Church
- [x] Priests
- [x] Mass Timings
- [x] Events
- [x] Gallery (lightbox + filters)
- [x] Live Stream
- [x] Contact (Google Maps embed)
- [x] Donations (UPI QR)
- [x] Daily Bible Verse
- [x] Prayer Requests
- [x] Announcements
- [x] Login / Register

### Phase 4 — Role-Based Dashboards
- [x] User Dashboard (profile, bookings, requests, notifications)
- [x] Admin Dashboard (analytics, CRUD panels, notifications)
- [x] Mass Booking module
- [x] Document Request module
- [x] Anbiyam Meeting Booking
- [x] Ticket / Enquiry System

### Phase 5 — Extra Features
- [x] Rosary Prayers page
- [x] Catholic Calendar
- [x] Parish Council page
- [x] FAQ page
- [x] Volunteer registration
- [x] Dark/Light mode toggle
- [x] SEO meta tags

### Phase 6 — Documentation
- [x] README.md
- [x] API_DOCS.md
- [x] .env.example

---

## Database Collections & Key Schemas

| Collection | Key Fields |
|---|---|
| `users` | name, familyName, dob, gender, phone, email, address, parishMemberId, role, passwordHash, isVerified |
| `priests` | name, designation, photo, period, startDate, endDate, phone, email, bio |
| `events` | title, description, date, time, venue, organizer, category, registrations[] |
| `announcements` | title, content, type (feast/funeral/marriage/emergency), publishedBy, date |
| `bookings` | userId, massDate, intentionType, familyDetails, status (pending/approved) |
| `documents` | userId, type, status, uploadedFile, requestedAt |
| `donations` | userId, amount, type, paymentMethod, transactionId, date |
| `prayerRequests` | userId, intention, isPublic, status (pending/approved) |
| `anbiyamMeetings` | hostFamily, date, prayerIntentions, attendees[], notified |
| `tickets` | userId, subject, message, status (open/in-progress/resolved), replies[] |
| `gallery` | title, imageUrl, category, album, uploadedAt |
| `notifications` | userId, message, type, isRead, sentVia (email/sms/push) |

---

## Verification Plan

### Automated
- `npm run dev` in both `frontend/` and `backend/` — confirm both start without errors
- All API routes tested via the browser subagent

### Manual Verification
- All 13+ public pages render correctly
- Auth flow: Register → OTP → Login → Dashboard
- Admin CRUD for users, events, gallery
- Mass booking end-to-end
- Document request workflow
- Dark/light mode toggle
- Tamil/English language switch
- Mobile responsiveness (browser DevTools)
