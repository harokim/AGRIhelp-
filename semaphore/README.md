# Optional Semaphore SMS bridge

AGRIhelp does not store the Semaphore API key in the React application.

The included `worker.js` is designed for a free Cloudflare Worker. The Worker keeps the Semaphore key server-side and accepts only POST requests containing a Philippine mobile number and message.

Set these Worker environment variables:

`SEMAPHORE_API_KEY` = your Semaphore API key

`ALLOWED_ORIGIN` = your AGRIhelp Firebase Hosting origin, for example `https://your-project.web.app`

After deploying the Worker, put its HTTPS URL in the AGRIhelp `.env` file as:

`VITE_SEMAPHORE_PROXY_URL=https://your-worker.example.workers.dev`

Semaphore SMS itself is not free. The Worker and Firebase hosting can be used without a paid server, but Semaphore credits are required for real outgoing SMS.
