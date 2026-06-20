# Phoenix Precision Drones Website

Vercel-ready Next.js website for Phoenix Precision Drones.

## Current Version

Version 1 includes:

- Public homepage
- Services page
- Industries page
- Pilot network page
- About page
- Contact page
- Login preview
- Dashboard preview
- Brand assets placed in `/public/images`

## Deployment Steps

1. Create a GitHub repository named:

   `phoenix-precision-drones-web`

2. Upload all files from this folder to that GitHub repository.

3. Go to Vercel.

4. Choose:

   `Add New` → `Project` → import the GitHub repo.

5. Use these Vercel settings:

   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: leave blank/default

6. Deploy.

7. Add the custom domain:

   `phoenixprecisiondrones.com`

8. In GoDaddy DNS, point the domain to Vercel using the DNS records Vercel gives you.

## Next Build Phase

- Connect Supabase Auth.
- Connect contact form to Supabase/Resend.
- Protect `/dashboard`.
- Add customer, employee, pilot, and admin dashboard modes.
- Connect live PPD tables and AI workflows.
