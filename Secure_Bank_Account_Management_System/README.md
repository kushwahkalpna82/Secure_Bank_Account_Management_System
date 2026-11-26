# 🏦 Secure Bank Account Management System

A web-based banking application built with **HTML, CSS, JavaScript, and Firebase** (Authentication + Cloud Firestore). This system provides secure account management with Multi-Factor Authentication (MFA), role-based access control, and comprehensive audit logging.

## 📋 Features

- **User Registration & Login** — Email/password authentication via Firebase Auth
- **Multi-Factor Authentication (MFA)** — 6-digit OTP verification with 5-minute expiry
- **Customer Dashboard** — Account overview with balance, stats, and recent transactions
- **Deposit Funds** — Add money with quick-select amounts and confirmation
- **Withdraw Funds** — Balance-validated withdrawals with confirmation
- **Fund Transfer** — Real-time recipient account lookup and atomic transfers
- **Transaction History** — Filterable and searchable transaction records
- **Admin Panel** — View all customers, accounts, transactions, and audit logs
- **Audit Logging** — Records every user action with timestamps
- **Role-Based Access Control** — Separate customer and admin permissions
- **Responsive Design** — Works on desktop and mobile devices

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Icons | Font Awesome 6 |
| Fonts | Google Fonts (Poppins) |

## 🚀 Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** and follow the steps
3. Give your project a name (e.g., "SecureBankSystem")

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Select **Start in test mode** (for development)
3. Choose a region close to you
4. Click **Enable**

### 4. Get Firebase Config

1. Go to **Project Settings** (gear icon) → **General**
2. Under **Your apps**, click the web icon (`</>`) to add a web app
3. Register the app with a nickname
4. Copy the `firebaseConfig` object

### 5. Update Configuration

Open `firebase-config.js` and replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

### 6. Create Firestore Indexes

The app uses compound queries that require Firestore indexes. When you first use the app, check the browser console for index creation links, or manually create these indexes:

- **transactions** collection: `accountId` (Ascending) + `date` (Descending)
- **audit_logs** collection: `customerId` (Ascending) + `timestamp` (Descending)

### 7. Set Firestore Security Rules

In Firebase Console → Firestore → Rules, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 8. Run the Application

Simply open `index.html` in a web browser, or use a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .
```

Then open `http://localhost:8080` in your browser.

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@securebank.com | Admin@123 |
| Customer | (Register a new account) | (Your password) |

> **Note:** You must register the admin account first through the registration page using exactly `admin@securebank.com` as the email.

## 📁 Project Structure

```
Secure_Bank_Account_Management_System/
├── index.html          # Login page with MFA
├── register.html       # User registration
├── dashboard.html      # Customer dashboard
├── deposit.html        # Deposit funds
├── withdraw.html       # Withdraw funds
├── transfer.html       # Transfer funds
├── history.html        # Transaction history
├── admin.html          # Admin panel
├── styles.css          # Global styles (dark navy & gold theme)
├── app.js              # Core business logic modules
├── firebase-config.js  # Firebase configuration
├── database.sql        # SQL schema reference
└── README.md           # This file
```

## 🏗️ System Architecture

```
USER → PRESENTATION LAYER (HTML/CSS Pages)
     → BUSINESS LOGIC LAYER (app.js modules)
     → DATABASE LAYER (Firebase Firestore)
```

### Module Structure (app.js)

| Module | Purpose |
|--------|---------|
| `Auth` | Registration, login, logout, session management |
| `MFA` | OTP generation, verification, expiry management |
| `AccountOps` | Deposit, withdraw, transfer, balance management |
| `TxnOps` | Transaction record creation and retrieval |
| `CustomerOps` | Customer data retrieval |
| `AuditLog` | Activity logging and retrieval |
| `Utils` | Formatting, notifications, modals, loading states |
| `UI` | Sidebar initialization, badges, UI helpers |

## 🔒 Security Features

- Firebase Authentication for secure login
- Multi-Factor Authentication (OTP with 5-min expiry)
- Session-based persistence (clears on tab close)
- Role-based access control (customer vs admin)
- Input validation on all forms
- Balance verification before withdrawals/transfers
- Comprehensive audit logging
- Self-transfer prevention

## ⚠️ Disclaimer

This is an **academic prototype** for educational purposes. It should NOT be used as a real banking system. In production, additional security measures are required including server-side validation, password hashing, HTTPS enforcement, rate limiting, and regulatory compliance.

## 📝 License

This project is created for academic/educational purposes.
