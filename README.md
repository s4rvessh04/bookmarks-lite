# Smart Bookmarks Lite

A real-time smart bookmarking application built with **Next.js 14 (App Router)**, **Supabase**, and **Tailwind CSS**. Save URLs, search them instantly, and keep everything in sync across tabs and devices — in real time.

🔗 **Live Demo**: [bookmarks-lite.vercel.app](https://bookmarks-lite.vercel.app)

## Features

- **Google OAuth Authentication** — Secure login via Supabase Auth
- **Real-time Sync** — Bookmarks update instantly across all tabs/devices without refreshing
- **Instant Search** _(Bonus)_ — Filter bookmarks by title or URL as you type
- **Add & Delete** — Manage bookmarks with optimistic UI and smooth Framer Motion animations
- **Modern UI** — Clean, responsive interface with dark mode support

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Backend & Database | Supabase (PostgreSQL, Auth, Realtime) |
| Styling | Tailwind CSS + tailwindcss-animate |
| Animations | Framer Motion |
| Language | TypeScript |

---

## Supabase Auth & Row Level Security (RLS)

### Authentication Flow

1. User clicks **"Sign in with Google"** on the login page
2. The server action calls `supabase.auth.signInWithOAuth({ provider: "google" })`, which redirects to Google's consent screen
3. After consent, Google redirects back to `/auth/callback` with an authorization code
4. The `GET` handler in `app/auth/callback/route.ts` calls `supabase.auth.exchangeCodeForSession(code)`, which sets a secure HTTP-only cookie containing the session
5. A `middleware.ts` runs on every request, calling `supabase.auth.getUser()` to refresh the session cookie before it expires

The Supabase client is created differently for server vs. client contexts:
- **Server** (`@supabase/ssr` with `createServerClient`): reads/writes cookies via Next.js `cookies()` API
- **Client** (`@supabase/ssr` with `createBrowserClient`): uses browser cookies automatically
- **Middleware** (`@supabase/ssr` with `createServerClient`): manipulates `request` and `response` cookies to keep the session in sync

### Row Level Security Policies

RLS is enabled on the `bookmarks` table. Three policies ensure complete data isolation per user:

| Policy | Operation | Rule | Purpose |
|---|---|---|---|
| `Users can view their own bookmarks` | `SELECT` | `auth.uid() = user_id` | Prevents users from reading other users' bookmarks |
| `Users can insert their own bookmarks` | `INSERT` | `auth.uid() = user_id` | Ensures the `user_id` column matches the authenticated user — you cannot insert a bookmark "as" another user |
| `Users can delete their own bookmarks` | `DELETE` | `auth.uid() = user_id` | Prevents a user from deleting another user's bookmarks |

**Why these are correct:**
- `auth.uid()` is Supabase's server-side function that extracts the user ID from the JWT in the request. It cannot be spoofed from the client.
- Every policy checks the **same condition** (`auth.uid() = user_id`), guaranteeing a user can only ever touch their own rows.
- Even if someone bypassed the UI and called the Supabase REST API directly, RLS would reject any cross-user operation at the database level.
- The `DELETE` server action additionally matches on `{ id, user_id: user.id }` as a defence-in-depth measure.

---

## Real-time Sync Implementation

### Supabase Realtime Channel

In `BookmarkList.tsx`, a Realtime subscription is created inside a `useEffect`:

```ts
const channel = supabase
    .channel("realtime bookmarks")
    .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        (payload) => {
            if (payload.eventType === "INSERT") {
                setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
            } else if (payload.eventType === "DELETE") {
                setBookmarks((prev) =>
                    prev.filter((b) => b.id !== payload.old.id)
                );
            } else if (payload.eventType === "UPDATE") {
                setBookmarks((prev) =>
                    prev.map((b) =>
                        b.id === payload.new.id ? (payload.new as Bookmark) : b
                    )
                );
            }
        }
    )
    .subscribe();
```

**Key decisions:**
- `event: "*"` subscribes to all change types (`INSERT`, `DELETE`, `UPDATE`) in a single listener, rather than creating separate channels per event type
- `INSERT` events prepend the new bookmark to maintain reverse-chronological order
- `DELETE` events filter out the removed bookmark by ID
- `UPDATE` events replace the matching bookmark in-place
- The local user's own actions (e.g., adding a bookmark via server action) are reflected through Realtime too, so the UI stays consistent whether the change originated locally or from another tab

### Subscription Cleanup

The `useEffect` returns a cleanup function:

```ts
return () => {
    supabase.removeChannel(channel);
};
```

`removeChannel` unsubscribes from the Realtime channel and closes the WebSocket connection, preventing memory leaks on component unmount or when navigating away.

### Optimistic Updates

For the `handleDelete` action, the bookmark is removed from local state **before** the server action completes:

```ts
setBookmarks((prev) => prev.filter((b) => b.id !== id));
await deleteBookmark(id);
```

This makes the UI feel instant — the card disappears immediately with a Framer Motion exit animation, without waiting for the network round-trip.

---

## Bonus Feature: Instant Search

### What It Does

A search bar appears above the bookmark grid. As you type, bookmarks are filtered in real-time by **title** and **URL** (case-insensitive). A clear button (✕) resets the search. The empty state differentiates between "no bookmarks at all" and "no bookmarks match your query."

### Why I Chose It

A bookmarking app's value is directly proportional to how fast you can **find** what you saved. Without search, even 15-20 bookmarks require scrolling and visually scanning — which defeats the purpose of saving them in the first place. I considered other features (drag-to-reorder, tag categories, dark mode toggle), but instant search delivers the highest usability impact with the smallest scope:

- **Zero latency** — `useMemo` filters the existing state array; no network requests
- **Zero schema changes** — purely client-side, no new columns or migrations
- **Works with real-time** — new bookmarks arriving via Realtime are immediately searchable
- **Universal need** — every bookmark tool has search; its absence is noticeable

### Implementation

- `SearchBar.tsx`: controlled input component with `Search` and `X` icons from `lucide-react`
- `BookmarkList.tsx`: added `searchQuery` state and a `useMemo` that filters `bookmarks` by title/URL before rendering

---

## Problems I Ran Into and How I Solved Them

### 1. Project Initialization Failures
**Problem**: `create-next-app` failed because the target directory was not empty, then stalled during dependency installation.
**Solution**: Manually cleaned the directory and created `package.json`, `tsconfig.json`, and `next.config.js` by hand, then ran `npm install` for a clean setup.

### 2. Real-time Duplication Risk
**Problem**: When a user adds a bookmark, the server action calls `revalidatePath("/")`, which re-fetches the page data. Meanwhile, the Realtime subscription also fires an `INSERT` event, potentially adding the bookmark twice.
**Solution**: The component syncs `initialBookmarks` (from SSR) into local state via a `useEffect([initialBookmarks])`. Since the Realtime `INSERT` fires first (before the page revalidation), and the subsequent SSR refetch replaces the entire `bookmarks` state, duplicates are avoided. The Realtime approach handles the "instant" feedback while SSR ensures consistency on hard reloads.

### 3. Auth Redirect URL on Vercel
**Problem**: The OAuth redirect URL (`/auth/callback`) must use the correct origin — `localhost:3000` in dev, the Vercel deployment URL in production.
**Solution**: The `signIn` server action reads `headers().get("origin")` first, falls back to `NEXT_PUBLIC_SITE_URL`, then to the Vercel system environment variable `NEXT_PUBLIC_VERCEL_URL`. The Google OAuth redirect callback URL is also added to Supabase's Auth allowed redirect list.

### 4. Missing `tailwindcss-animate` Dependency
**Problem**: After configuring `tailwindcss-animate` in `tailwind.config.ts`, the build failed because the package wasn't installed.
**Solution**: Installed it via `npm install tailwindcss-animate`.

---

## One Thing I'd Improve with More Time

**Tag / folder categorization with color-coded badges.** Currently every bookmark sits in a flat list. With tags (e.g., "Work", "Reading List", "Tools"), users could organize bookmarks by context and filter by tag — working perfectly alongside the existing search. This would require:
- A new `tags` table (or a `tags text[]` column on `bookmarks`)
- Updated RLS policies for the new table
- A tag picker component in the add-bookmark form
- Filter chips above the grid
- Extended Realtime subscriptions for tag changes

This turns the app from a simple link saver into a lightweight personal knowledge base.

---

## Getting Started

1. **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd bookmarks-lite
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Environment Setup** — create a `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4. **Database Setup** — run this SQL in the Supabase SQL Editor:
    ```sql
    create table public.bookmarks (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references auth.users not null,
      title text not null,
      url text not null,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    alter table public.bookmarks enable row level security;

    create policy "Users can view their own bookmarks"
      on public.bookmarks for select
      using (auth.uid() = user_id);

    create policy "Users can insert their own bookmarks"
      on public.bookmarks for insert
      with check (auth.uid() = user_id);

    create policy "Users can delete their own bookmarks"
      on public.bookmarks for delete
      using (auth.uid() = user_id);
    ```

5. **Enable Realtime** — go to the Supabase Dashboard → Database → Replication, and enable Realtime for the `bookmarks` table.

6. **Run locally**:
    ```bash
    npm run dev
    ```

## Deployment (Vercel)

1. Push code to GitHub
2. Import the project in Vercel
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables
4. Deploy — Vercel auto-detects Next.js and handles everything else
