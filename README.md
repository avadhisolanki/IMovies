# 🎬 iMovies — Prime Video Theatrical Ticket Booking Web Application

A fully responsive, production-ready Movie Ticket Booking platform built with an **Amazon Prime Video dark aesthetic** (`#0f171e` deep blue-black surfaces, `#1a242f` containers, crisp white typography, and vibrant `#00a8e1` cyan/blue highlights).

Powered by **React.js (Vite)**, **Tailwind CSS**, **Node.js + Express.js**, and **MongoDB (Mongoose ODM)** with real-time seat locking, 5-minute TTL expirations, and interactive tier-based cinema maps.

---

## 🌟 Key Features

1. **Official TMDB (The Movie Database) API v3 Integration**:
   - **Trending Feeds**: Streams weekly trending releases via `GET /trending/movie/week`.
   - **Now Showing in Theatres**: Fetches current box office titles via `GET /movie/now_playing`.
   - **Movie Details & Deep Enrichment**: Fetches runtimes, high-res posters (`w500`), backdrops (`original`), certification, and YouTube trailers via `GET /movie/{movie_id}?append_to_response=credits,videos`.
   - **Top Billing Cast Avatars**: Displays actor profile photos (`https://image.tmdb.org/t/p/w185{profile_path}`) with character credits.
   - **Live Search Auto-complete**: Real-time debounce searching via `GET /search/movie`.
   - **Discovery & Multi-Faceted Filters**: Dynamic filtering by genre IDs (`GET /discover/movie?with_genres=`), audio language, release year, and sorting.
   - **Robust Fallback System**: Seamlessly falls back to local cinema catalog if offline, rate-limited, or unconfigured.
   - **In-App TMDB Modal**: Interactive modal in the navigation bar to view API status, test connectivity, or configure a custom API key.

2. **Amazon Prime Video Dark Aesthetic**:
   - Deep obsidian `#0f171e` backgrounds with `#1a242f` cards and `#00a8e1` cyan highlights.
   - Cinematic hero billboard carousel with multi-directional gradients and backdrop scaling.
   - Horizontal movie carousels with smooth left/right navigation and hover card zoom (`scale-105`).
   - Cinema screen curve (`cinema-screen-curve`) with glowing blue acoustic light projection.

2. **Real-Time Seat Locking with 5-Minute TTL**:
   - Interactive seat selector categorized by tiers:
     - 💎 **Balcony Club Lounge** (Premium pricing, rows A–B)
     - ⭐ **Prime Executive Tier** (Mid-range pricing, rows C–E)
     - 🎟️ **Lower Standard Saver** (Economy pricing, rows F–G)
   - Dynamic 4-state visual indicators: **Available**, **Selected**, **Locked (TTL)**, **Booked**.
   - 5-minute countdown timer (`05:00` down to `00:00`) with auto-release watchdog and conflict rejection (HTTP 409).

3. **Production-Grade Razorpay Payment Gateway (Test Mode)**:
   - Official Razorpay SDK integration (`POST /api/payment/create-order` and `POST /api/payment/verify`).
   - Cryptographic HMAC-SHA256 signature verification to prevent tampering.
   - Dynamic Checkout modal supporting UPI (Google Pay, PhonePe, Paytm, BHIM, QR), Cards (Visa, MasterCard, RuPay), and NetBanking.
   - Synchronized with real-time seat lock state and automatic seat release on failure or cancellation.

4. **Brevo (Sendinblue) Transactional Email & OTP Authentication**:
   - Mandatory Email Verification for new registrations with a high-contrast **6-Digit Numerical OTP** and 1-Click activation link.
   - Working **Forgot Password** recovery on the Login page with OTP and secure reset links.
   - **Automated Digital Cinema Passes** delivered to user's inbox upon ticket confirmation featuring booking reference, theater layout, showtime, and entrance barcode.
   - Real-time booking status change alerts (confirmations, reschedules, cancellations).

5. **Digital Ticket Pass & Printing**:
   - Perforated cinema boarding pass design with barcode, scannable QR code visual, and booking reference ID.
   - Full print and save pass support (`window.print()`).
   - One-click reservation cancellation with instant seat release back to inventory.

6. **Audience Reviews & Community Ratings**:
   - 10-star rating system with reviewer feedback.
   - Prime watchlist toggle with instant bookmarking.

7. **Full Administrative Control Center (`/admin`)**:
   - Live revenue analytics, total bookings, movie catalog counters, and active theatre metrics.
   - Comprehensive CRUD for movies (`/addmovie`), venues & tier pricing (`/addtheatre`), and show scheduling (`/addshow`).
   - Moderation dashboard with all platform reservations and instant cancellation/refund tools (`/adminbookings`).
   - 1-Click "Re-seed Prime Catalog" button to populate blockbusters anytime.

---

## 🚀 Quick Start & Access

The server is currently running live on:
- Primary / Active Port: **[http://localhost:5001](http://localhost:5001)** *(Automatically selected when port 5000 is occupied by other tools)*
- Fallback / Default Port: **[http://localhost:5000](http://localhost:5000)**

### Running the Application
From the project root (`imovies/`):
```bash
# Option A: Start production unified server (Serves both API + Client UI)
npm start
# OR: node server.js

# Option B: Run Frontend Vite Dev server with HMR
npm run client
```
- **Prime Viewer**: `user@imovies.com` / `user123`
- **Cinema Administrator**: `admin@imovies.com` / `admin123`
*(Both available via 1-click fill buttons on the login screen)*

---

## 🛠️ Tech Stack & Architecture

- **Client**: React 18, Vite, React Router DOM (Lazy loading with Suspense), Tailwind CSS, Lucide Icons, Axios, React-Toastify.
- **Server**: Node.js, Express.js REST API, JWT authentication, bcrypt password hashing.
- **Database**: MongoDB (Mongoose ODM) with high-resiliency fallback embedded store.

---

## 📂 Project Directory Structure

```
imovies/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Prime top navigation with search & city selector
│   │   │   ├── Footer.jsx             # Prime cinema footer
│   │   │   ├── HeroBanner.jsx         # Featured billboard carousel
│   │   │   ├── MovieCard.jsx          # Hover zoom poster card
│   │   │   ├── MovieCarousel.jsx      # Horizontal row carousel
│   │   │   ├── DigitalTicket.jsx      # Perforated pass with QR/barcode
│   │   │   ├── TrailerModal.jsx       # Embedded YouTube player
│   │   │   ├── UserProtection.jsx     # Route protection for users
│   │   │   └── AdminProtection.jsx    # Route protection for admins
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx        # Public hero with Prime perks
│   │   │   ├── LoginPage.jsx          # Dark card with 1-click demo fill
│   │   │   ├── RegisterPage.jsx       # Registration form
│   │   │   ├── HomePage.jsx           # Carousels, genre pills, language filters
│   │   │   ├── MovieDetailsPage.jsx   # Backdrop, cast chips, review submission
│   │   │   ├── MovieShowsPage.jsx     # Date selector tabs & theatre show slots
│   │   │   ├── SeatSlugPage.jsx       # Interactive tier seat map & 5m TTL lock
│   │   │   ├── BookingsPage.jsx       # User passes & print view
│   │   │   ├── WatchlistPage.jsx      # Saved movies grid
│   │   │   ├── AdminDashboard.jsx     # KPIs, revenue metrics, recent reservations
│   │   │   ├── AddMoviePage.jsx       # Movie publishing form
│   │   │   ├── AddTheatrePage.jsx     # Venue & tier pricing form
│   │   │   ├── AddShowPage.jsx        # Showtime scheduling form
│   │   │   └── AdminBookingsPage.jsx  # Platform reservations moderation
│   │   ├── context/AuthContext.jsx    # JWT auth provider
│   │   ├── services/api.js            # Axios interceptor instance
│   │   ├── App.jsx                    # Lazy router configuration
│   │   └── main.jsx                   # Entry point
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                  # Mongoose MongoDB connection & fallback
│   │   │   └── memoryStore.js         # Fallback in-memory database store
│   │   ├── models/
│   │   │   ├── userModel.js           # User schema
│   │   │   ├── adminModel.js          # Admin schema
│   │   │   ├── movieModel.js          # Movie schema
│   │   │   ├── theatreModel.js        # Theatre & tier pricing schema
│   │   │   ├── showModel.js           # Show & dynamic seat layout schema
│   │   │   ├── bookingModel.js        # Reservation schema
│   │   │   ├── favoriteModel.js       # Watchlist schema
│   │   │   └── reviewModel.js         # Reviews schema
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── movieController.js
│   │   │   ├── theatreController.js
│   │   │   ├── showController.js
│   │   │   ├── bookingController.js   # Real-time TTL seat locking & checkout
│   │   │   ├── favoriteController.js
│   │   │   └── reviewController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js      # JWT token & admin role authorization
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── movieRoutes.js
│   │   │   ├── theatreRoutes.js
│   │   │   ├── showRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── favoriteRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   └── seedRoutes.js
│   │   ├── utils/
│   │   │   ├── ttlCleaner.js          # Background expiration cleaner
│   │   │   ├── seedData.js            # Blockbuster catalog data
│   │   │   └── initDB.js              # Automatic database seeder
│   │   └── server.js                  # Express bootstrap with static client host
│   ├── test-runner.js                 # 14-point automated test suite
│   └── package.json
└── README.md
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login user / admin | Public |
| `GET` | `/api/movie` | List movies with search/genre filters | Public |
| `GET` | `/api/movie/:id` | Get movie details & reviews | Public |
| `POST` | `/api/movie` | Publish new movie | Admin |
| `GET` | `/api/theatre` | List theatres & tier pricing | Public |
| `POST` | `/api/theatre` | Register theatre venue | Admin |
| `GET` | `/api/shows/movie/:movieId` | Shows for a movie filtered by date | Public |
| `GET` | `/api/shows/:showId` | Show details & dynamic seat map | Public |
| `POST` | `/api/shows` | Schedule showtime | Admin |
| `POST` | `/api/bookings/lock-seats` | Lock selected seats (5-min TTL) | User |
| `POST` | `/api/bookings/unlock-seats` | Release held seats | User |
| `POST` | `/api/bookings/confirm-booking`| Complete checkout & issue ticket | User |
| `GET` | `/api/bookings/my-bookings` | Retrieve user digital passes | User |
| `GET` | `/api/bookings/all-bookings` | Platform reservations feed | Admin |
| `PUT` | `/api/bookings/cancel/:id` | Cancel reservation & release seats | User / Admin |
| `GET` | `/api/favorite` | Get saved movies | User |
| `POST` | `/api/favorite/toggle` | Toggle watchlist bookmark | User |
| `POST` | `/api/review` | Submit audience review & rating | User |

---

## 🧪 Automated Verification

To run the automated 14-point verification suite:
```bash
cd server
node test-runner.js
```
All tests verify connection health, user/admin authentication, catalog indexing, tier-based seat allocation, real-time lock conflict prevention, ticket generation, and moderation.
