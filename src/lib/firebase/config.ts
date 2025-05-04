
// Updated Firebase config
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBwjNds1rq_drJuA17xIo6QkNhPwHW36LQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "darijascript.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "darijascript",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "darijascript.appspot.com", // Corrected default placeholder
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "2914439659",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:2914439659:web:7805824c1e63d262cfc9ae",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LTPD2ED859" // Made measurementId required
};

// Ensure environment variables are set or placeholders are replaced before deployment.
// Updated the check to use the actual placeholder provided by the user initially,
// or a default known placeholder if environment variables are not set.
const defaultApiKeyPlaceholder = "AIzaSyBwjNds1rq_drJuA17xIo6QkNhPwHW36LQ"; // Use the provided key as the default check
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && firebaseConfig.apiKey === defaultApiKeyPlaceholder) {
  console.warn("Firebase config is using placeholder values. Update src/lib/firebase/config.ts or set environment variables.");
}
