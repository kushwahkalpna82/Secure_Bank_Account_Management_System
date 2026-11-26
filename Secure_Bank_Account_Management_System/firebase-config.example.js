// ============================================================
// Firebase & EmailJS Configuration Template
// Secure Bank Account Management System
// ============================================================
// INSTRUCTIONS:
// 1. Copy this file to `firebase-config.js`
// 2. Replace the placeholder values with your keys from `.env`
//    (Firebase Console > Project Settings & EmailJS Dashboard)
// ============================================================

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

// Set session persistence (clears when browser tab closes)
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

// EmailJS Configuration (for sending OTP via email)
const emailjsConfig = {
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
    serviceId: "YOUR_EMAILJS_SERVICE_ID",
    templateId: "YOUR_EMAILJS_TEMPLATE_ID"
};
