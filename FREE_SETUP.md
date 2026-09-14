# AGRIhelp free setup

This version removes Firebase Storage. Authentication and application data use Firebase Authentication and Cloud Firestore. Small uploaded documents are saved as data inside separate Firestore documents, so the upload limit is intentionally 600KB per file.

Semaphore SMS is optional. Real Semaphore SMS requires Semaphore credits. The React app never contains the Semaphore API key. The optional `semaphore/worker.js` is a server-side bridge that can be deployed separately to a free Cloudflare Worker.

## 1. Install

Open a terminal in the AGRIhelp folder:

`npm install`

## 2. Firebase

Create or select your Firebase project.

Enable:

- Authentication > Sign-in method > Email/Password
- Firestore Database
- Hosting

Do not enable Firebase Storage for this version.

## 3. Environment file

Copy `.env.example` to `.env`.

Put your Firebase web app values in `.env`:

`VITE_FIREBASE_API_KEY=`

`VITE_FIREBASE_AUTH_DOMAIN=`

`VITE_FIREBASE_PROJECT_ID=`

``

`VITE_FIREBASE_MESSAGING_SENDER_ID=`

`VITE_FIREBASE_APP_ID=`

Leave `VITE_SEMAPHORE_PROXY_URL` blank until the optional SMS bridge is deployed.

## 4. Firestore rules

Install the Firebase CLI if needed, then run:

`firebase login`

Make sure `.firebaserc` contains your Firebase project ID.

Deploy rules and indexes:

`firebase deploy --only firestore`

## 5. Run AGRIhelp

`npm run dev`

Open the local address shown by Vite.

## 6. Create the first engineer

Use the Engineer Account link on the login page. After creating the account, sign in as the engineer.

## 7. Client registration

Use Create a Client Account. The client profile is saved in Firestore and authentication is handled by Firebase Authentication.

## 8. SMS

The application creates an in-app notification whenever an engineer approves an appointment or changes a request decision. If `VITE_SEMAPHORE_PROXY_URL` is configured, it also attempts to send an SMS through the Semaphore bridge.

The SMS bridge is optional because Semaphore SMS itself is not free.

## 9. Firebase Hosting

Build:

`npm run build`

Deploy:

`firebase deploy --only hosting`

## Important

This project is designed to avoid paid Firebase services. Firestore and Hosting still have usage quotas. Large files should not be uploaded because this version intentionally avoids Firebase Storage.
