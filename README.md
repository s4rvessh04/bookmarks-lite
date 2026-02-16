# Smart Bookmarks Lite

A real-time smart bookmarking application built with Next.js (App Router), Supabase, and Tailwind CSS.

## Features

- **Google OAuth Authentication**: Secure login using Supabase Auth.
- **Real-time Updates**: Bookmarks sync instantly across devices and tabs without refreshing.
- **Manage Bookmarks**: Add and delete bookmarks easily.
- **Modern UI**: Clean, minimal interface with responsiveness.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd bookmarks-lite
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file with your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**:
    Run the SQL commands in `supabase_setup.sql` in your Supabase SQL Editor to create tables and policies.

5.  **Run Locally**:
    ```bash
    npm run dev
    ```

## Development Log & Challenges

### 1. Project Initialization Issues
**Problem**: The initial `create-next-app` command failed because the directory was not empty (it contained a log file created by a previous attempt).
**Solution**: I manually cleaned the directory. When `create-next-app` stalled/hung during dependency installation, I manually created the `package.json`, `tsconfig.json`, `next.config.js`, and installed dependencies via `npm install` to ensure a clean setup.

### 2. Real-time Synchronization
**Problem**: Ensuring the bookmark list updates in real-time across different tabs without a page refresh.
**Solution**: Implemented Supabase Realtime subscription in the `BookmarkList` component.
- Used `supabase.channel(...).on('postgres_changes', ...).subscribe()` to listen for `INSERT` and `DELETE` events on the `bookmarks` table.
- Updated the local React state based on these events to reflect changes instantly.

### 3. Authentication Flow
**Problem**: Integrating Google OAuth with Next.js App Router and handling session management.
**Solution**:
- Used `@supabase/ssr` for robust server-side auth handling.
- Implemented a `middleware.ts` to refresh the session on every request.
- Created a server-side route handler `app/auth/callback/route.ts` to exchange the auth code for a session cookie.

### 4. Row Level Security (RLS)
**Problem**: Ensuring users can only access their own bookmarks.
**Solution**: Enabled RLS on the `bookmarks` table and added policies for `SELECT`, `INSERT`, and `DELETE` that check `auth.uid() = user_id`. This secures the data at the database level.

### 5. Dependency Error on UI Polish
**Problem**: After adding `tailwindcss-animate` to `tailwind.config.ts`, the app crashed or failed to build because the package wasn't installed.
**Solution**: Installed the missing dependency `tailwindcss-animate`.

## Deployment

The app is ready for deployment on Vercel.
1.  Push code to GitHub.
2.  Import project in Vercel.
3.  Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel Environment Variables.
4.  Deploy!
