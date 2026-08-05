import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Make sure we only initialize once
if (getApps().length === 0) {
  try {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (clientEmail && privateKey && projectId) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin Initialized');
    } else {
      console.warn('Firebase Admin credentials missing, cannot initialize.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const adminMessaging = getApps().length > 0 ? getMessaging() : null;

export { adminMessaging };
