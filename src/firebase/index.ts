'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This singleton pattern ensures Firebase is initialized only once.
if (getApps().length === 0) {
  // Check for the essential config values to prevent client-side errors from missing env vars.
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  ) {
    app = initializeApp(firebaseConfig);
  } else {
    // This log is crucial for debugging missing environment variables.
    console.error(
      'Firebase configuration is incomplete. Please check your .env.local file or App Hosting environment variables (NEXT_PUBLIC_FIREBASE_*).'
    );
    // Assign a dummy object to prevent the server from crashing.
    // Client-side errors will be caught by the `error.tsx` boundary.
    app = {} as FirebaseApp;
  }
} else {
  app = getApp();
}

// Initialize services. If the app is a dummy object, these will also be dummy objects,
// preventing server-side crashes and letting the client-side error boundary handle the issue.
auth = getAuth(app);
firestore = getFirestore(app);

// This function is now a simple getter for the singleton instances.
function initializeFirebase() {
  return { firebaseApp: app, auth, firestore };
}

// Re-export the initialize function for the provider, and other utilities.
export { initializeFirebase };
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
