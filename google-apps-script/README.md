# AAPD 2026 automatic photo feed

This small Google Apps Script lets `eventGallery.html` display a clean native photo grid while the event team uploads photographs to the existing Google Drive folders.

## One-time setup

1. Open [Google Apps Script](https://script.google.com/) using the Google account that owns the AAPD gallery folders.
2. Create a **New project** and name it `AAPD 2026 Gallery Feed`.
3. Replace the default `Code.gs` contents with this folder's `Code.gs` file and save it.
4. Run `refreshGalleryIndex` once. Approve the requested Google Drive permission.
5. Select **Deploy → New deployment → Web app**.
6. Set **Execute as** to `Me` and **Who has access** to `Anyone`, then deploy.
7. Copy the `/exec` web-app URL.
8. Paste that URL into `assets/data/event-gallery.json` as the value of `photoFeedUrl`.

The site will then check for newly uploaded images automatically. The feed refreshes at most once every five minutes, avoiding a full Drive scan for each visitor. Until the endpoint is configured, the gallery page automatically shows Google's public folder view instead.

## Event workflow

- The event media person uploads original photos to the correct date's `Photos` folder in Google Drive.
- The event media person uploads videos to the matching unlisted YouTube playlist.
- Visitors use `eventGallery.html`; no delegate sign-in is required.
- No website or JSON file needs to be edited during the event.

Only the four configured public `Photos` folders are indexed. The Drive `Videos` folders and the private gallery root are not exposed by this script.
