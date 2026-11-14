# Ship artwork

The 31 ships offered by sailing setup each have matching official Royal Caribbean artwork. The source is the [Royal Caribbean fleet page](https://www.royalcaribbean.com/cruise-ships), retrieved November 14, 2026. The source uses a mix of photography and promotional renderings; the UI credits it accordingly rather than presenting every image as a photograph. Artwork remains © Royal Caribbean; no open license is claimed.

Exact source URLs and local filenames are recorded in `src/data/ship-artwork.json`. `scripts/download-ship-artwork.py` downloads 800px WebP renditions from the source CDN, validates their format, and stores them in `public/ships`. The fleet adds approximately 2.8 MB to the offline cache. All 31 assets are precached with the app, with no runtime requests to the cruise line.

`ShipArtwork` supplies a neutral ship icon for imported ships without a match or for failed images. The active sailing selector, saved sailing cards, sailing setup preview, and Sailing & crew detail share this artwork. A visible source credit accompanies the expanded cards and previews. Existing saved ship names and identifiers are unchanged.

The sailing picker uses a native modal dialog with large card buttons, selected-state announcements, full dates including years, keyboard dismissal, and focus restoration. A failed sailing switch leaves the picker open and shows the save error. Changes to the active sailing still pass through the journal’s normal persistence path.

Verify with `npm run build` and `npm run test:browser -- tests/browser/sailing-picker.spec.ts tests/browser/mobile.spec.ts`. The browser coverage switches and reloads trips, creates a sailing through the picker, checks four viewport sizes, and decodes all 31 image files after taking the browser offline.
