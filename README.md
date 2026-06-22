# Phoenix Precision Drones Website - V9 AI Chat

This package adds a floating **Ask PPD AI** website chat window.

## What was added

- `components/ChatWidget.tsx`
- `app/api/chat/route.ts`
- Chat widget imported into `app/layout.tsx`
- Chat UI styles appended to `app/globals.css`
- `.env.example` showing required Vercel environment variables

## Backend expected

The Supabase SQL function already tested successfully:

```sql
public.website_chat_message(...)
```

## Required Vercel environment variables

Add these in Vercel Project Settings → Environment Variables:

```text
SUPABASE_URL=https://emxgkftxbpoqnmzxwcop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service_role key>
```

Important: the service role key is used only inside `/api/chat/route.ts`, which runs server-side. Do not put it in a client component and do not prefix it with `NEXT_PUBLIC_`.

## Deploy

Upload/replace the files in this package to the GitHub repository and commit to `main`. Vercel should redeploy automatically.

## Test after deployment

Open the website, click **Ask PPD AI**, and ask:

```text
Do you do cell tower inspections?
```

You should receive the Supabase-powered company response.
