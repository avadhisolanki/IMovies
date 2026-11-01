# 📊 Entity-Relationship (ER) Diagram

This document models the database entities, attributes, constraints, and relationships for the **iMovies** cinema ticket booking platform. The system operates on **MongoDB (Mongoose ODM)** with an automated in-memory store fallback.

---

## 📐 Mermaid ER Diagram

```mermaid
erDiagram
    USER ||--o{ BOOKING : "places"
    USER ||--o{ FAVORITE : "bookmarks"
    USER ||--o{ REVIEW : "writes"
    
    ADMIN ||--o{ SHOW : "schedules"
    
    MOVIE ||--o{ SHOW : "screened_in"
    MOVIE ||--o{ FAVORITE : "favorited_in"
    MOVIE ||--o{ REVIEW : "receives"
    
    THEATRE ||--o{ SHOW : "hosts"
    SHOW ||--o{ BOOKING : "generates"

    USER {
        ObjectId _id PK
        string username "unique, min 3, max 20"
        string email "unique, indexed"
        string password "bcrypt hash"
        string role "default: 'user'"
        boolean isVerified "email verification flag"
        string verificationOTP "6-digit temporary code"
        string verificationToken "1-click token"
        date otpExpires "15-minute TTL"
        string resetPasswordOTP "recovery 6-digit code"
        string resetPasswordToken "recovery link token"
        date resetPasswordExpires "recovery TTL"
        date createdAt
        date updatedAt
    }

    ADMIN {
        ObjectId _id PK
        string username "unique"
        string email "unique, indexed"
        string password "bcrypt hash"
        string role "default: 'admin'"
        date createdAt
        date updatedAt
    }

    MOVIE {
        ObjectId _id PK
        string movieName "required, trimmed"
        string description "required"
        string_array genres "e.g. Action, Sci-Fi"
        date releaseDate "theatrical launch"
        string language "audio language"
        string duration "runtime in mins or string"
        string certification "e.g. U/A, R, PG-13"
        string posterUrl "high-res poster link"
        string backdropUrl "cinematic hero banner"
        string trailerUrl "YouTube embed URL"
        number rating "average community score"
        date createdAt
        date updatedAt
    }

    THEATRE {
        ObjectId _id PK
        string theatreName "venue branding"
        string location "city, mall, auditorium"
        number balconySeatPrice "tier 1 premium price"
        number middleSeatPrice "tier 2 standard price"
        number lowerSeatPrice "tier 3 economy price"
        object balconySeats "rows and column layout"
        object middleSeats "rows and column layout"
        object lowerSeats "rows and column layout"
        date createdAt
        date updatedAt
    }

    SHOW {
        ObjectId _id PK
        string showId "unique identifier string"
        string adminEmail "FK -> ADMIN.email"
        string movieId "FK -> MOVIE._id or TMDB ID"
        string movieName "snapshot of title"
        string theatreName "snapshot of venue"
        string location "snapshot of address"
        date showDate "calendar date"
        string showTime "e.g. 07:30 PM"
        string screenType "IMAX Laser, Dolby Atmos 4K"
        object pricing "balcony, middle, lower rates"
        object tickets "dynamic seat map key-value store"
        date createdAt
        date updatedAt
    }

    BOOKING {
        ObjectId _id PK
        string bookingId "unique reference: PRIME-XXXXXX-XXXX"
        string userEmail "FK -> USER.email"
        string showId "FK -> SHOW.showId"
        string movieId "FK -> MOVIE._id"
        string movieName "title at reservation"
        string theatreName "venue at reservation"
        string location "hall & screen"
        date showDate "showtime calendar date"
        string showTime "showtime slot"
        string_array selectedSeats "e.g. ['BA1', 'BA2']"
        array seatDetails "seat numbers, tiers, individual prices"
        number totalAmount "grand total paid in INR"
        string paymentStatus "Pending | Completed | Cancelled"
        string paymentMethod "Razorpay | Prime Cinema Pay"
        string razorpayOrderId "order_id from Razorpay"
        string razorpayPaymentId "pay_id from Razorpay"
        string razorpaySignature "HMAC-SHA256 signature"
        date bookingDate "timestamp of issuance"
        date createdAt
        date updatedAt
    }

    FAVORITE {
        ObjectId _id PK
        string userEmail "FK -> USER.email"
        string movieId "FK -> MOVIE._id or TMDB ID"
        date createdAt
        date updatedAt
    }

    REVIEW {
        ObjectId _id PK
        string userEmail "FK -> USER.email"
        string movieId "FK -> MOVIE._id or TMDB ID"
        number rating "1 to 10 scale"
        string reviewText "feedback body"
        date createdAt
        date updatedAt
    }
```

---

## 📋 Entity Descriptions & Cardinality Summary

| Parent Entity | Relationship | Child Entity | Cardinality | Business Rule / Description |
| :--- | :--- | :--- | :--- | :--- |
| **`USER`** | Places | **`BOOKING`** | `1 : N` | A registered user can make zero, one, or multiple cinema reservations. Each booking belongs strictly to one verified user. |
| **`USER`** | Bookmarks | **`FAVORITE`** | `1 : N` | Users can curate an Amazon Prime style watchlist. Composite uniqueness ensures no duplicate movie entries per user. |
| **`USER`** | Writes | **`REVIEW`** | `1 : N` | Users can post audience feedback and 1–10 star ratings on any feature film. |
| **`ADMIN`** | Schedules | **`SHOW`** | `1 : N` | Administrators manage screening timetables, screen formats (IMAX, Dolby Atmos), and auditorium pricing tiers. |
| **`MOVIE`** | Screened In | **`SHOW`** | `1 : N` | A single movie title can be scheduled across multiple auditoriums, cities, and time slots simultaneously. |
| **`THEATRE`** | Hosts | **`SHOW`** | `1 : N` | Physical multiplex venues host multiple scheduled shows with specific tier seating geometry. |
| **`SHOW`** | Generates | **`BOOKING`** | `1 : N` | Each scheduled show maintains real-time seat lock state (`available`, `locked`, `booked`) and yields confirmed booking passes. |

---

## 🔒 Dynamic Key-Value Seat Map (`SHOW.tickets`)

Instead of storing hundreds of individual database documents per seat, each `Show` document embeds a dynamic, memory-efficient dictionary structure indexable in $O(1)$ time:

```json
{
  "BA1": {
    "seatNumber": "BA1",
    "tier": "Balcony Club Lounge",
    "price": 300,
    "status": "available",
    "lockedBy": null,
    "lockedUntil": null
  },
  "MB1": {
    "seatNumber": "MB1",
    "tier": "Prime Executive Tier",
    "price": 220,
    "status": "locked",
    "lockedBy": "user@example.com",
    "lockedUntil": "2026-11-01T17:45:00.000Z"
  },
  "LA1": {
    "seatNumber": "LA1",
    "tier": "Lower Standard Saver",
    "price": 150,
    "status": "booked",
    "lockedBy": null,
    "lockedUntil": null
  }
}
```

- **5-Minute TTL Watchdog**: Background intervals sweep through active shows and revert seats whose `lockedUntil < Date.now()` back to `"available"`.
- **Concurrency Protection**: During order initiation and payment verification, atomic checks ensure locked seats cannot be hijacked by competing requests.
