# ShopWise — Smart Multi-Store Price Comparison & Deal Intelligence

> **A modern, full-stack MERN application for transparent e-commerce price discovery, deal authenticity verification, and AI-driven review summarization.**

---

## 📌 Overview

Online shoppers routinely lose time and money comparing identical items across scattered e-commerce storefronts, navigating deceptive "flash sales", and sifting through bot-manipulated 5-star customer reviews.

**ShopWise** unifies fragmented online shopping into a single intelligent platform:
1. **Aggregates landed prices** across major Indian retailers (Amazon, Flipkart, Croma, Reliance Digital).
2. **Detects genuine deals** through time-series price history tracking.
3. **Calculates a proprietary Smart Value Score (SVS)** using Multi-Criteria Decision Analysis (MCDA).
4. **Protects shoppers against fake reviews** via a mathematical Review Trust Score (RTS).
5. **Summarizes sentiment** into high-signal pros, cons, and buyer verdicts.
6. **Enables personalized price drop alerts** linked to secure user accounts.

Built with a custom **Lavender Glassmorphic Design System**, ShopWise delivers a clean, responsive, high-contrast visual experience optimized for both mobile and desktop screens.

---

## ✨ Key Features

- **Multi-Store Price Matrix**: Computes total landed cost including base price, store-specific delivery fees, and instant bank discounts to identify the true lowest offer.
- **Interactive Price History (SVG)**: Smooth historical bezier curve plotting price fluctuations over time with genuine-deal detection flags.
- **Proprietary Smart Value Score (SVS)**: Evaluates products through a weighted sum of price competitiveness (35%), user ratings (25%), review trust (20%), and hardware specifications (20%).
- **Review Trust Score (RTS)**: Heuristic scoring engine calculating verified buyer percentage, review volume anomalies, and rating dispersion to assess review credibility.
- **AI Review Summarizer**: Distills sentiment into categorized pros, drawbacks, and an actionable buyer verdict.
- **User Authentication & Accounts**: Full JWT-based authentication with bcrypt password hashing (10 salt rounds), password visibility toggles, and session persistence.
- **Price Drop Alerts**: Set target thresholds on monitored products with active/triggered status tracking directly in user profiles.
- **Dual-Mode Enterprise Data Store**: Seamlessly connects to MongoDB when available, and automatically activates a zero-crash in-memory fallback store if MongoDB is offline.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Lucide React, Canvas-Confetti, Vanilla CSS (Design Tokens, Glassmorphism) |
| **Backend** | Node.js, Express.js, Mongoose, bcryptjs, jsonwebtoken, cors, morgan, dotenv |
| **Database** | MongoDB (Production) / In-Memory & JSON Hybrid Store (Zero-Crash Fallback) |
| **Architecture** | RESTful API, Dual-Mode Data Access Layer (DAL), Component-Driven Architecture |

---

## 📁 Project Structure

```
Shopwise/
├── .gitignore                     # Root Git ignore rules (node_modules, .env, dist, logs)
├── ARCHITECTURE.md                # System design & architecture specification
├── package.json                   # Root workspace scripts & orchestrator dependencies
├── README.md                      # Comprehensive project documentation
├── run-app.js                     # Concurrent launcher for frontend and backend
│
├── client/                        # React 18 + Vite Frontend Application
│   ├── .env.example               # Frontend environment template
│   ├── .gitignore                 # Client-specific Git ignore rules
│   ├── index.html                 # HTML5 entrypoint with Google Fonts
│   ├── package.json               # Client dependencies & scripts
│   ├── vite.config.js             # Vite bundler configuration
│   ├── public/                    # Static brand assets & category imagery
│   └── src/
│       ├── App.jsx                # Main application state & routing controller
│       ├── index.css              # Global Lavender design system tokens & utilities
│       ├── main.jsx               # React DOM entrypoint
│       ├── components/            # UI components (Navbar, Modals, ProductCards, Filters)
│       ├── context/               # Global state context (ShopwiseContext)
│       └── data/                  # Client-side fallback dataset
│
└── server/                        # Express.js REST API Backend
    ├── .env.example               # Backend environment template (placeholders only)
    ├── .gitignore                 # Server-specific Git ignore rules
    ├── package.json               # Server dependencies & scripts
    └── src/
        ├── server.js              # Express app bootstrap, middleware & route definitions
        ├── config/
        │   └── db.js              # MongoDB connection & hybrid memory fallback manager
        ├── controllers/           # Request controllers (products, auth, alerts, analytics)
        ├── data/
        │   ├── seedData.json      # Base product catalog & store offer dataset
        │   └── seeder.js          # MongoDB database seeder script
        ├── middleware/
        │   └── auth.js            # JWT verification & route guard middleware
        ├── models/
        │   └── schema.js          # Mongoose schemas & Unified Data Access Layer (DAL)
        └── services/              # Pure algorithmic services (SVS, RTS, Sentiment)
```

---

## ⚙️ Environment Variables Setup

Environment variables are managed independently for the frontend and backend. Copy the `.env.example` templates to `.env` files.

> **IMPORTANT:** Never commit real credentials or production secret keys to version control. Keep `.env` listed in `.gitignore`.

### 1. Server Environment (`server/.env`)

Create `server/.env` based on `server/.env.example`:

```bash
cp server/.env.example server/.env
```

| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `PORT` | Network port for Express API server | `5000` |
| `NODE_ENV` | Runtime environment mode | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/shopwise` |
| `JWT_SECRET` | Secret key used for signing JWT auth tokens | `<your-secure-random-jwt-key>` |

### 2. Client Environment (`client/.env.local`)

Optional. If hosting the backend on a remote URL, create `client/.env.local`:

```bash
cp client/.env.example client/.env.local
```

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the ShopWise backend API | `http://localhost:5000/api` |

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher; v20 LTS recommended)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Optional: local daemon or MongoDB Atlas cluster URI)

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/Shopwise.git
cd Shopwise

# Install root orchestrator dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to project root
cd ..
```

### Step 2: Seed the Database (Optional)

If running a local MongoDB instance or connecting to MongoDB Atlas:

```bash
# From project root:
npm run seed

# Or directly within server folder:
cd server
npm run seed
```

*(If MongoDB is not running, ShopWise automatically boots using its built-in in-memory fallback store with zero setup required.)*

### Step 3: Run the Application

You can launch both the backend server and frontend client concurrently with a single command from the root directory:

```bash
npm start
```

This launches:
- 🚀 **Backend REST API**: [`http://localhost:5000`](http://localhost:5000)
- 📡 **API Health Status**: [`http://localhost:5000/api/health`](http://localhost:5000/api/health)
- ⚛️ **Frontend Client**: [`http://localhost:5173`](http://localhost:5173)

#### Running in Separate Terminals

If you prefer individual terminal logs:

```bash
# Terminal 1: Backend Server
cd server
npm start

# Terminal 2: Frontend Client
cd client
npm run dev
```

---

## 📡 REST API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | Public | System status, database connection mode, and uptime |
| `GET` | `/api/stats` | Public | Platform-wide aggregation metrics |
| `POST` | `/api/auth/register` | Public | Register new user account (returns JWT token) |
| `POST` | `/api/auth/login` | Public | Authenticate existing user credentials (returns JWT token) |
| `GET` | `/api/auth/me` | Bearer Token | Fetch authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Public | Request account password reset |
| `GET` | `/api/products` | Public | List, search, filter, and sort product catalog |
| `GET` | `/api/products/:id` | Public | Single product deep-dive with offers, history, and reviews |
| `POST` | `/api/products/compare` | Public | Multi-product comparison matrix with AI comparative verdict |
| `POST` | `/api/products/smart-rank` | Public | Re-rank products with custom user MCDA priority weights |
| `GET` | `/api/alerts` | Optional | Retrieve alerts (scoped to user when authenticated) |
| `POST` | `/api/alerts` | Optional | Create new target price drop alert |
| `DELETE`| `/api/alerts/:id` | Optional | Remove an active price drop alert |

---

## ⚠️ Current Project Limitations & Roadmap

ShopWise is currently in **v1.0 (MVP/Capstone Prototype)**. To ensure complete technical transparency, please note the current operational boundaries:

1. **Product Catalog Scope**: The catalog is currently initialized with a curated seed dataset of 9 multi-category electronics and lifestyle products in `server/src/data/seedData.json`.
2. **Store Price Feeds**: Multi-store prices, delivery fees, and bank discounts are simulated via seed data. Live scraping pipelines and official affiliate integrations (Amazon PA-API, Flipkart Affiliate API) are planned for v2.0.
3. **Price History Tracking**: Historical price points and deal authenticity calculations use 7-point historical records from seed data. Continuous automated time-series price recording is in active development.
4. **Alert Notification Delivery**: Price alerts are stored in the database and monitored in the UI. Background dispatch via email (Nodemailer / SendGrid) or WhatsApp/SMS is scheduled for the next release.
5. **AI Sentiment Engine**: Review pros, cons, and buyer verdicts use curated sentiment models. Integration with live LLM APIs (Gemini 1.5 Flash / OpenAI) for real-time review parsing is planned.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use and adapt it for educational and commercial purposes.
