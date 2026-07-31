# GitHub OAuth App Setup

SponsorChain uses a GitHub OAuth App to verify repo ownership during the project
listing flow. This app is **never used as a platform login** — it only grants
temporary read access to your public repositories so you can pick one to list.

## Register the OAuth App

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:

| Field | Value |
|-------|-------|
| Application name | `SponsorChain` |
| Homepage URL | `https://sponsorchain.vercel.app` (or your production URL) |
| Application description | `Verify repo ownership for the SponsorChain open-source funding platform.` |
| Authorization callback URL | See table below |

### Callback URLs

| Environment | Callback URL |
|-------------|-------------|
| Local development | `http://localhost:3000/api/auth/callback/github` |
| Vercel production | `https://your-app.vercel.app/api/auth/callback/github` |

> You can set **both** by adding each as a separate line in the callback URL
> field (GitHub allows multiple URLs, one per line).

4. Click **Register application**
5. On the next page, click **Generate a new client secret** and copy it immediately

## Permissions Requested

SponsorChain requests these scopes:

- `read:user` — read your GitHub username and public profile (so we know _who_ is
  listing the project)
- `public_repo` — read your public repositories and their metadata (so you can
  pick one to list)

> **These scopes provide read-only access.** We cannot read your code (the `public_repo`
> scope does not include repository contents), create commits, open issues, or modify
> anything on your GitHub account. We cannot see your private repositories.

## Environment Variables

After creating the app, copy the Client ID and Client Secret into your environment:

**For local development** (`.env.local`):

```env
GITHUB_CLIENT_ID="your_client_id_here"
GITHUB_CLIENT_SECRET="your_client_secret_here"
```

**For production** (GitHub Actions Secrets / Vercel env vars):

| Secret | GitHub path |
|--------|-------------|
| `GITHUB_CLIENT_ID` | Repo → Settings → Secrets and variables → Actions |
| `GITHUB_CLIENT_SECRET` | Same as above |

Also set in Vercel: **Project Settings → Environment Variables**.

## What Happens When a User Clicks "Link GitHub"

1. User visits `/list-project` and clicks "Connect with GitHub"
2. GitHub shows an OAuth consent screen listing the two scopes (`read:user`,
   `public_repo`)
3. After approval, the user returns to `/list-project` with a JWT session cookie
4. The listing page fetches the user's public repos from GitHub's API
5. Forks are filtered out; only non-fork repos owned by the authenticated user appear
6. The user selects a repo, reviews the on-chain data, and signs the
   `ProjectRegistry.create_project()` contract call with their Stellar wallet

**The GitHub session is ephemeral.** The JWT cookie exists only for the duration
of the listing flow. Nothing is stored server-side — no user table, no repo cache,
no database. The wallet public key is the user's identity.
