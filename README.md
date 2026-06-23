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


## V10 chat form visibility fix

This version fixes the chat window layout so the typed prompt/input area stays visible after long AI responses. The chat message history scrolls, while the quick buttons, lead fields, input box, and Send button stay accessible.


## V11 weather forecast chat upgrade

This version updates `app/api/chat/route.ts` so the website chat can answer weather questions for a city before routing normal business questions to Supabase.

Weather examples:
- What is the weather in Phoenix?
- Forecast for Dallas, TX
- Is it windy in Tucson?
- What is the temperature in Denver?

Weather data is fetched server-side using Open-Meteo geocoding and forecast APIs. No weather API key is required. Forecast replies include current conditions, 3-day forecast, wind, gusts, rain chance, and a drone-flight safety disclaimer.

Changed file:
- `app/api/chat/route.ts`

Existing Supabase environment variables are still required for all non-weather PPD AI questions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
