# Quiet sailor close-ups

The Overview sailing banner is a passive portrait, with no links, buttons, venue selector, speech bubbles, ambient effects, or automatic scene changes. It shows the selected sailor and at most one crewmate, framed at face/upper-body scale. The existing “Your sailors” section below the banner still selects which sailor is featured. Each expression comes from the existing `sailorReaction` selected-day calculation; the banner does not calculate or imply intoxication.

`SailingScene.tsx` combines the original transparent character sheets with a tightly cropped, softened poolside background. `SailorBlink.tsx` adds vector eyelids aligned separately for all six characters and all four expression cells. Existing winking eyes stay closed. The overlay is visible for approximately 130–170ms every 7.4–9.3 seconds, staggered between characters. Bodies, mouths, hats, and background remain completely still. All blinking pauses offscreen or in background tabs, and system reduced motion leaves the open-eye artwork static.

## Artwork

`public/scenes/pool-deck.jpg` is an original generated Caribbean pool-deck illustration inspired by Royal Caribbean's **The Lime & Coconut**, including its colorful two-story bar, striped awnings, palms, and ocean railings. Venue reference: [Royal Caribbean, Wonder of the Seas](https://www.royalcaribbean.com/cruise-ships/wonder-of-the-seas/restaurants-bars/the-lime-and-coconut), checked November 14, 2026. This is a stylized setting, not a photograph or an exact ship layout.

The 1536 × 1024 image was generated with the built-in image tool, then converted to JPEG at quality 85 (about 505 KB). The original brief requested a softly rounded miniature clay scene, front-facing slightly elevated camera, turquoise water, cream coping, pastel sky, aqua/coral bar, striped yellow awnings, palms, and no text or characters. The app crops into the bar and ocean area, reduces saturation, softens focus, and blends the background into the banner. The unused earlier Schooner Bar image is retained in the ignored `work/scene-art/` directory, outside the shipped asset bundle.

The background and character sheets are precached for offline use. No external image requests, video assets, journal fields, or saved preferences are introduced.

## Verification

`tests/browser/characters.spec.ts` checks the absence of banner controls, two-person close-ups even with larger crews, all character assignments, individual moods, lack of body animation, blink overlays, reduced motion, narrow layouts, and offline background loading. Desktop, phone, and closed-eyelid screenshots support visual review. Existing character, save-feedback, and mobile tests exercise integration.
