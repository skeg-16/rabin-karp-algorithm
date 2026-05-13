# Rabin-Karp Algorithm: Deployment Handover Guide

Hello! I've already configured the system for a seamless deployment on Vercel. Here are the simple steps you need to follow:

### 1. Push to GitHub
Make sure the latest code (with the `vercel.json` file in the root) is pushed to your GitHub repository.

### 2. Import to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New"** > **"Project"**.
2. Import the repository.
3. **Framework Preset**: Select **"Other"** (Vercel will automatically detect the settings based on the `vercel.json` I created).
4. **Root Directory**: Leave it as the root (`./`).

### 3. Environment Variables (CRITICAL)
In the Vercel project settings, you **MUST** add these two Environment Variables:

| Key | Value | Description |
| :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | `https://your-project-name.vercel.app` | Put the actual URL Vercel gives you here. |
| `VITE_API_URL` | `https://your-project-name.vercel.app/api` | Same as above but add `/api` at the end. |

### 4. Deploy!
Click **"Deploy"**. Vercel will build both the FastAPI backend and the React frontend automatically.

**Note:** The backend uses the `@vercel/python` runtime. If you see any errors during the build, double-check the Environment Variables first!


