# MockCall PH

A mobile-first booking-request website for one-on-one interview practice. Built with React, TypeScript, and Vite.

## What’s included

- Four interview stages and two multi-stage bundles. The selected package price appears after the visitor chooses a job category and package.
- 15- and 30-minute Initial Screening options, a 30-minute Hiring Manager Interview, a Technical Interview of up to 45 minutes, and a 45-minute Final Interview, with prices configured in `src/config.ts`.
- A live mock interview, performance feedback, written recap, and practical recommendations included with every package.
- A guided booking request with validation, Back navigation, schedule summary, privacy notice, and explicit request-not-confirmation messaging.
- An optional Google Apps Script endpoint that writes requests to a private Google Sheet. No credentials or spreadsheet IDs are stored in the website.
- No local browser storage for booking data. If the endpoint is not configured, submission fails with a clear message and nothing is saved.

## Pricing

Job category is used to tailor practice questions and does not change the price. Stage prices are centralized in `src/config.ts`:

| Interview stage | Price | Duration |
| --- | ---: | --- |
| Initial Screening | ₱100 | 15 or 30 minutes |
| Hiring Manager Interview | ₱100 | 30 minutes |
| Technical Interview | ₱200 | Up to 45 minutes |
| Final Interview | ₱250 | 45 minutes |

| Bundle | Included stages | Price |
| --- | --- | ---: |
| Corporate Track | Initial Screening + Hiring Manager Interview | ₱200 |
| Executive Track | All four stages | ₱500 (save ₱150 when purchased individually) |

The Technical Interview is priced at ₱200 and scheduled as a 45-minute block (up to 45 minutes). Executive Track uses that same maximum duration; its ₱500 price saves ₱150 compared with buying all four stages individually. Corporate Track uses the 30-minute Initial Screening default and is priced at the combined cost of its individual stages. Booking summaries show the full scheduled time across all included stages. Prices are displayed only after the visitor selects a job category and a stage or bundle. Update the frontend configuration and matching package validation in `google-apps-script/Code.gs` together if pricing changes.

## Run locally

1. Install Node.js (the project was scaffolded with Vite 8).
2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Build and lint:

   ```sh
   npm run build
   npm run lint
   ```

## Configure private Google Sheets submissions

Booking requests are sent only to a Google Apps Script web app. The spreadsheet stays private; the browser receives only the success/failure result and never reads the sheet.

1. Create a Google Sheet owned by the service operator. Do not share the spreadsheet with customers or publish it to the web.
2. Create a standalone Google Apps Script project and copy `google-apps-script/Code.gs` into its `Code.gs` file.
3. In Apps Script **Project Settings → Script properties**, add `SPREADSHEET_ID` with the ID from the Sheet URL. Do not put this ID in frontend environment variables or source code.
4. In the same Script properties, add `TURNSTILE_SECRET_KEY` with the Turnstile secret key and `TURNSTILE_ALLOWED_HOSTNAMES` with the exact hostname(s) allowed to submit, comma-separated (for example, `example.com,www.example.com`). Do not put the secret key in frontend code, a `VITE_` variable, or the repository. Configure the same production hostnames in the Turnstile widget settings.
5. Deploy the script as a web app that **executes as the owner** and accepts requests from **Anyone**. This is necessary for visitors who are not signed into the owner’s Google account. The public endpoint is write-only, validates the booking, price, Turnstile token, and hostname, and does not expose a sheet-reading route. Keep the spreadsheet’s own sharing settings restricted to the owner.
6. Copy the deployed web app URL (the `https://script.google.com/macros/s/.../exec` URL) to a local `.env` file for local testing:

   ```dotenv
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/REPLACE_WITH_DEPLOYMENT_ID/exec
   ```

   `.env.example` includes the public Turnstile site key. A site key is safe to embed; the secret key is not. Never put Google account credentials, an API key, the Turnstile secret, or the spreadsheet ID in a `VITE_` variable. The web app URL and site key are public and embedded in the built website.
7. Restart Vite after changing `.env`. The GitHub Pages workflow sets the production endpoint and Turnstile site key in its build environment; update those values in `.github/workflows/deploy.yml` if they change.
8. Submit a test request, confirm it appears in the private `Bookings` tab, then remove the test row.

If you already deployed the earlier version of this Apps Script, update the script and deploy a new version. The HTML response must post the result to `window.top` with the request's `responseToken`; otherwise the site cannot receive confirmation through Apps Script's sandboxed iframe. The booking columns now include package type, included stages, total duration, and the selected technical duration. Preserve any existing booking rows; if the current tab has the older columns, back it up and configure `SHEET_NAME` to use a new tab before accepting new requests.

The endpoint URL is public and anonymous submission can attract spam. The script validates values, requires successful Turnstile Siteverify validation, uses a honeypot, and prevents spreadsheet formula injection. Turnstile tokens are single-use and expire after five minutes. Keep Apps Script access, Sheet sharing, and account security restricted. If a key has been shared in chat or committed, rotate it in Cloudflare and update the Apps Script property.

If the endpoint is absent or misconfigured, the site does **not** show a success state. It does not silently store requests in the browser or send them to a placeholder contact.

## Owner setup before launch

- Confirm stage and bundle prices, durations, and bundle savings in both configuration files.
- Review the Google Analytics disclosure, privacy notice, and applicable Philippine data-protection requirements. Set and clearly disclose a real retention/deletion period for booking data.
- Confirm which meeting platform will be used with each customer. Explain any AI note-taking or transcription method before the call and ask for separate permission then; a booking request is not recording consent.
- Add a real business contact channel only if the owner wants one displayed. No contact details, payment instructions, or calendar integrations are invented by this site.

## Deployment

Run `npm run build` and deploy the generated `dist/` folder to any static host that supports single-page applications. Set `VITE_GOOGLE_APPS_SCRIPT_URL` and `VITE_TURNSTILE_SITE_KEY` in the host’s build environment before building. For GitHub Pages, the deployed Apps Script URL and site key are configured in `.github/workflows/deploy.yml`. The Apps Script web app must be deployed separately.

The canonical URL, social-sharing URLs, structured-data URL, and sitemap are set for `https://pantinpo.github.io/MockPH/` in `index.html` and `public/sitemap.xml`. Vite’s base path is also set to `/MockPH/` for the project’s GitHub Pages deployment. Update those URLs, the sitemap reference in `public/robots.txt`, and Vite’s base path if the production domain or hosting path changes.
