import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Messaging and get a reference to the service
const messaging = async (): Promise<Messaging | null> => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const isSupported = await import('firebase/messaging').then(
        (m) => m.isSupported()
      );
      if (isSupported) {
        return getMessaging(app);
      }
    } catch (err) {
      console.error('Firebase messaging is not supported', err);
      return null;
    }
  }
  return null;
};

export const requestFirebaseNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const msg = await messaging();
      if (!msg) return null;

      const token = await getToken(msg, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      return token;
    } else {
      console.error('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while requesting permission. ', error);
    return null;
  }
};

export const onMessageListener = async () => {
  const msg = await messaging();
  if (!msg) return;

  return new Promise((resolve) => {
    onMessage(msg, (payload) => {
      resolve(payload);
    });
  });
};

export { app, messaging };
