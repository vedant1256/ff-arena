# 🎮 FF Arena — Free Fire Tournament Platform

A full-stack esports tournament platform for Free Fire (India-focused).
Players join tournaments by paying via UPI, admin manages everything via dashboard.

---

## 📁 Project Structure

```
ff-arena/
├── backend/        → Node.js + Express + MongoDB API
└── frontend/       → Next.js 14 + TypeScript + Tailwind CSS
```

---

## ⚡ Quick Start

### Step 1 — Clone / Extract
Extract this zip to a folder on your computer.

---

### Step 2 — Setup Backend

```bash
cd ff-arena/backend
npm install
```

Copy the env file and fill in your values:
```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGODB_URI` → your MongoDB Atlas connection string (free at cloud.mongodb.com)
- `JWT_SECRET` → any long random string
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` → from razorpay.com (free test account)

Start backend:
```bash
npm run dev
```

Backend runs at: **http://localhost:5000**
Test it: http://localhost:5000/api/health

---

### Step 3 — Setup Frontend

```bash
cd ff-arena/frontend
npm install
```

Copy the env file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_API_URL` → http://localhost:5000/api
- `NEXT_PUBLIC_SOCKET_URL` → http://localhost:5000
- `NEXT_PUBLIC_UPI_ID` → your UPI ID (already set to yours)

Start frontend:
```bash
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🔐 Admin Setup

After starting, create an admin user via MongoDB or use this script:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@ffarena.com',
    phone: '9999999999',
    password: 'FreeFire@Admin2024',
    role: 'admin',
    ffUID: 'ADMIN'
  });
  console.log('Admin created:', admin.email);
  process.exit(0);
});
"
```

Then login at http://localhost:3000/login with:
- Email: `admin@ffarena.com`
- Password: `FreeFire@Admin2024`

---

## 🌐 Pages

| Route | Description |
|-------|-------------|
| `/` | Home — tournament listing with countdowns |
| `/tournaments` | All tournaments with filters |
| `/tournaments/[id]` | Tournament detail + join + UPI payment |
| `/signup` | Create account |
| `/login` | Login |
| `/dashboard` | User panel — joined tournaments, room IDs, withdraw |
| `/admin` | Admin panel (admin role only) |

---

## 💳 How Payment Works

1. Player clicks "Join Tournament"
2. UPI QR code is shown (auto-generated for the exact entry fee amount)
3. Player pays via any UPI app (GPay, PhonePe, Paytm, etc.)
4. Player enters their UTR / Transaction ID
5. **You (admin) see the request in Admin → Payments**
6. You verify UTR in your UPI app and click **Approve**
7. Player is automatically added to the tournament

---

## 🔑 Room ID Flow

1. Go to **Admin → Room IDs**
2. Find the tournament
3. Enter Room ID and Password
4. Click **Release to Players**
5. All joined players instantly see it on their Dashboard

---

## 💸 Prize & Withdrawal Flow

1. After match, go to **Admin → Prize Credits**
2. Enter cash (₹) and diamonds for each winner, click Credit
3. Player's wallet is updated instantly
4. Player goes to Dashboard → Withdraw → enters their UPI ID
5. You see request in **Admin → Withdrawals**
6. You send money via UPI manually, then click **Mark as Paid**

---

## 💎 Diamond Rates

| Diamonds | Cash Value |
|----------|-----------|
| 1,000 | ₹500 |
| 5,000 | ₹1,000 |
| 10,000 | ₹1,800 |

---

## 🚀 Deployment

### Frontend → Vercel (Free)
1. Push `frontend/` to GitHub
2. Go to vercel.com → New Project → Import repo
3. Set environment variables from `.env.local`
4. Deploy!

### Backend → Railway or Render (Free)
1. Push `backend/` to GitHub
2. Go to railway.app or render.com → New Web Service
3. Set environment variables from `.env`
4. Deploy!

### Database → MongoDB Atlas (Free)
1. Go to cloud.mongodb.com
2. Create free cluster
3. Get connection string → paste in backend `.env`

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT, bcryptjs

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Zustand, Framer Motion

---

## 📞 UPI Details

- **UPI ID:** shrikrishnadevkar60@oksbi
- **Name:** Shrikrishna Devkar

---

## 🎯 Tournament Types Supported

- Solo (12 players)
- Duo (10 teams)
- Squad (12 squads)
- Clash Squad (8 teams)
- BR Kill Race (20 players, per-kill prize)

---

Made with ❤️ for Indian Free Fire players
