# AGRIhelp white screen fix

The previous version could show a blank page when Firebase environment variables were not configured. This version prevents Firebase from crashing the React app when `.env` is missing.

## Start the project

1. Open this folder in VS Code.
2. Open Terminal.
3. Run:

```bash
npm install
npm run dev
```

The login page should now display even before Firebase is configured.

## Connect Firebase

1. Copy `.env.example`.
2. Rename the copy to `.env`.
3. Open `.env`.
4. Paste the Firebase Web App values into the six Firebase fields.
5. Save the file.
6. Stop Vite with `Ctrl + C`.
7. Run `npm run dev` again.

Do not put a Semaphore API key in the React `.env` file. Semaphore must be accessed through the proxy/worker endpoint.

## Important

This version does not use Firebase Storage. Uploaded documents are stored as small Base64 data in Firestore. Keep each document within the configured small-file limit.
