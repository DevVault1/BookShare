# 📚 Adopt A Book — Full Stack Platform

> A platform where people donate books they no longer need and students/users can request those books. Helping reuse books and support education.

![Adopt A Book](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![React Native](https://img.shields.io/badge/React%20Native-Expo-blue)

---

## 📁 Project Structure

```
adopt_a_book/
├── backend/          # Node.js + Express API
│   ├── controllers/  # Route handlers
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API routes
│   ├── middleware/   # Auth middleware
│   ├── config/       # Cloudinary config
│   └── server.js     # Entry point
│
├── web/              # Next.js 14 web app
│   ├── app/          # App router pages
│   ├── components/   # Reusable components
│   ├── lib/          # API client, stores, utils
│   └── styles/       # Global CSS
│
├── mobile/           # React Native (Expo) app
│   ├── screens/      # App screens
│   ├── components/   # Shared components
│   ├── navigation/   # React Navigation
│   ├── store/        # Zustand state
│   └── lib/          # API client
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **Cloudinary** account (free tier works)
- **Expo CLI** (`npm install -g expo-cli`)

---

## ⚙️ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (see below)
npm run dev
```

### Backend `.env` variables

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/adopt_a_book
JWT_SECRET=your_super_secret_key_change_this
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Get Cloudinary credentials:** Sign up free at [cloudinary.com](https://cloudinary.com) → Dashboard → copy Cloud Name, API Key, API Secret.

The server runs on **http://localhost:5001**

---

## 🌐 Web App Setup

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

### Web `.env.local` variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

The web app runs on **http://localhost:3000**

---

## 📱 Mobile App Setup

```bash
cd mobile
npm install

# Start Expo development server
npm start
# or for specific platform:
npm run android
npm run ios
```

### Configure API URL for mobile

Edit `mobile/lib/api.ts` and change the `API_URL` to your machine's local IP:

```ts
const API_URL = 'http://192.168.1.X:5001/api'  // Your local IP
```

> **Note:** Use your machine's actual local IP (not `localhost`) when testing on physical devices. Use `localhost` for emulators.

---

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/register` | Register new user | ❌ |
| POST | `/api/login` | Login | ❌ |
| GET | `/api/me` | Get current user | ✅ |
| PUT | `/api/profile` | Update profile | ✅ |

### Books
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/books` | Browse books (with filters) | ❌ |
| GET | `/api/books/:id` | Get book details | ❌ |
| POST | `/api/books` | Donate a book | ✅ |
| PUT | `/api/books/:id` | Update book | ✅ |
| DELETE | `/api/books/:id` | Delete book | ✅ |
| GET | `/api/books/my-books` | Get user's books | ✅ |
| GET | `/api/books/recommendations` | AI-powered suggestions | ✅ |

### Requests
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/requests` | Request a book | ✅ |
| GET | `/api/requests/user` | My sent requests | ✅ |
| GET | `/api/requests/donor` | Requests on my books | ✅ |
| PUT | `/api/requests/:id/respond` | Approve/reject | ✅ |

### Donations
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/donations` | My donation history | ✅ |
| PUT | `/api/donations/:id/status` | Update status | ✅ |

### Messages
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/messages` | Send message | ✅ |
| GET | `/api/messages` | Get all conversations | ✅ |
| GET | `/api/messages/:userId` | Get conversation | ✅ |

### Admin (Admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/books` | All books |
| GET | `/api/admin/requests` | All requests |

---

## 📊 Database Models

### User
```js
{ name, email, password (hashed), role: ['donor','student','admin'],
  location, profileImage, interests, bio, isActive, createdAt }
```

### Book
```js
{ title, author, category, condition, description, image,
  donorId, status: ['available','requested','adopted'],
  location, isbn, language, pages, tags, views, createdAt }
```

### Request
```js
{ bookId, requesterId, donorId,
  status: ['pending','approved','rejected'],
  message, requestDate, responseDate, responseNote }
```

### Donation
```js
{ bookId, donorId, receiverId, requestId,
  donationDate, deliveryMethod, status, notes }
```

### Message
```js
{ senderId, receiverId, message, isRead, bookId, createdAt }
```

### Notification
```js
{ userId, message, type, isRead, link, relatedId, createdAt }
```

---

## 🎨 Features Overview

### Web App Pages
| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, stats, how it works |
| Browse Books | `/books` | Search, filter, paginate |
| Book Detail | `/books/:id` | Full info + request |
| Donate Book | `/books/donate` | Upload + list a book |
| Login | `/auth/login` | Email + password |
| Register | `/auth/register` | With role selection |
| Dashboard | `/dashboard` | Stats, books, requests |
| Chat | `/dashboard/chat` | Real-time messaging |
| Admin | `/admin` | Full platform management |

### Mobile App Screens
- **Splash Screen** — Animated intro
- **Login / Register** — Beautiful auth flow
- **Home** — Hero, categories, featured books
- **Browse** — Search + filter with infinite scroll
- **Book Detail** — Full info + request + message
- **Chat** — Real-time Socket.IO messaging
- **Profile** — User info + navigation hub
- **Donation History** — Complete donation log

---

## 🛡️ Creating an Admin User

After registering normally, update the user role in MongoDB:

```js
// MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

---

## 🔌 Real-time Features

The platform uses **Socket.IO** for real-time chat:
- Users join a unique room based on their combined IDs
- Messages are broadcast in real-time
- Connection managed per session

---

## 🤖 AI Recommendations

The recommendation engine works by:
1. Reading the user's `interests` array (set in profile)
2. Querying books where `category` or `tags` match interests
3. Sorting by view count for popularity
4. Falls back to most popular books if no interests set

---

## 🔧 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Mobile | React Native, Expo, React Navigation |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT + bcrypt |
| Images | Cloudinary |
| Real-time | Socket.IO |
| State | Zustand |
| UI Components | Shadcn UI, Radix UI |

---

## 📝 License

MIT © 2024 Adopt A Book
