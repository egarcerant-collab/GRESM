// IMPORTANT: These values are populated by Firebase App Hosting.
// When running locally, you must create a `.env.local` file with these values.

function mustEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Firebase configuration is incomplete: The environment variable ${name} is missing or empty. Please set it in your App Hosting backend settings.`);
    }
    return value;
}

export const firebaseConfig = {
  apiKey: mustEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: mustEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: mustEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: mustEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: mustEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: mustEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  // measurementId is optional for many use cases
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
