# Google Sign-In Setup & Current Status

## 1. Current Implementation Status

> [!IMPORTANT]
> **Status: CODE INTEGRATED & PRODUCTION-READY**
>
> CareerAI client-side code is fully configured:
> - **Continue with Google** action is active in `src/components/AuthModal.tsx` for both Sign In and Sign Up modes;
> - **OAuth Handshake & Session Sync** is wired in `src/context/CareerContext.tsx` via `supabase.auth.signInWithOAuth({ provider: 'google', ... })`;
> - **Automatic Profile Sync**: User metadata (`full_name`, `avatar_url`, `email`) from Google is automatically populated into `UserProfile`;
> - **Deterministic Local Guest Fallback**: If Supabase credentials are not present, clicking Continue with Google safely initializes a local learner session without crashes.
>
> To activate live Google authentication, configure your Google Cloud OAuth Client ID & Secret in your Supabase Dashboard as detailed in Section 3 below.

---

## 2. Security Boundaries

In accordance with CareerAI's non-negotiable security principles:
1. **Never commit Google Client Secrets**: Client secrets must **never** be placed in client-side code, `VITE_*` environment variables, or public repositories.
2. **Supabase Handles OAuth Handshake**: When Google Sign-In is enabled, Supabase Auth handles the OAuth token exchange server-side.
3. **No OAuth Tokens in Client Logs**: OAuth access and refresh tokens are strictly handled by Supabase SDK session management and never logged to analytics or telemetry.

---

## 3. Step-by-Step Setup Guide (When Enabling Google Sign-In)

Follow these steps when you are ready to configure live Google Sign-In for CareerAI:

### Step 1: Create Google Cloud OAuth Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project or create a new one (e.g., `CareerAI-Auth`).
3. Navigate to **APIs & Services** → **OAuth consent screen**:
   - Choose **External** user type.
   - Fill in app name (`CareerAI`), user support email, and developer contact email.
   - Under **Scopes**, ensure `.../auth/userinfo.email` and `.../auth/userinfo.profile` are requested.
4. Navigate to **APIs & Services** → **Credentials**:
   - Click **Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `CareerAI Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (local development)
     - `https://<your-production-domain>.com` (production deployment)
   - **Authorized redirect URIs**:
     - Copy the callback URL from your Supabase dashboard:
       `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
5. Save your **Client ID** and **Client Secret**.

### Step 2: Configure Supabase Auth Provider
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** → **Providers** → **Google**.
3. Toggle Google to **Enabled**.
4. Paste your **Client ID** and **Client Secret** into Supabase.
5. Click **Save**.

### Step 3: Configure URL Configuration in Supabase
1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**.
2. Set **Site URL**: `http://localhost:5173` (or your production URL).
3. Add **Redirect URLs**:
   - `http://localhost:5173/dashboard`
   - `http://localhost:5173/settings`
   - `https://<your-production-domain>.com/dashboard`
   - `https://<your-production-domain>.com/settings`

### Step 4: Verification Checklist Before Launch
- [ ] Sign in with a real Google account completes the redirect and establishes a valid session.
- [ ] Account profile row is provisioned in `profiles` table via Supabase Auth trigger.
- [ ] Sign-out cleanly clears the session without leaving orphaned state.
- [ ] No client secret is visible in browser network requests or bundle output.
