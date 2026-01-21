'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This singleton pattern ensures Firebase is initialized only once.
// The firebaseConfig object is validated in `config.ts` and will throw an error if essential variables are missing.
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize services.
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
