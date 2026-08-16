# Trash Pandas — launch package

## Files
- `22web.html` — main one-page website.
- `assets.js` — one connected asset registry. It contains the processed raccoon artwork as a base64 WebP plus the custom Trash Pandas / 2222 SVG logo, so you do not need a separate image folder for the site.
- `form.html` — Noctix-inspired multi-step whitelist / allowlist flow.
- `Code.gs` — Google Apps Script backend that appends entries to a Google Sheet.

## Recommended backend
For this launch-stage whitelist, **Google Sheets + Apps Script** is the fastest simple option: easy to inspect, no server to maintain, and the form can POST directly to a deployed Apps Script web app. For a larger public mint/production system, move the source of truth to **Supabase/Postgres** and keep Sheets only as an export/reporting layer.

## Connect the whitelist to Google Sheets
1. Create a Google Sheet named anything you want.
2. Open **Extensions → Apps Script**.
3. Replace the default script with `Code.gs`.
4. Save and run `setup()` once to create the `Whitelist` tab and header row. Authorize the script.
5. Click **Deploy → New deployment → Web app**.
6. Execute as: **Me**. Who has access: **Anyone** (or the narrowest access your launch flow supports).
7. Copy the Web App URL.
8. Open `form.html` and replace `PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with that URL.
9. Host `22web.html`, `assets.js`, and `form.html` on the same domain.

### Data captured
- Timestamp
- X username
- Quote tweet URL
- EVM wallet
- Source

The form intentionally does **not** claim that it verifies X actions automatically. If you later add X API verification, add that server-side rather than trusting the browser.

## Main site
Open `22web.html` directly. The main page links to `form.html` for whitelist entry.

## Important content note
The supplied project facts were used as follows: **Trash Pandas**, crypto/Web3, **2,222 supply**, art collection, launching on **Robinhood Chain**, and the positioning **“Robinhood’s blue chip.”** No mint price, mint date, utility promise, or other unsupported project facts were invented.

## Deployment
You can upload these files to any static host. The main site itself is static HTML/CSS/JS. If you use the exact filenames above, no build step is required.
