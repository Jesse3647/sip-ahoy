# SipAhoy visual identity

The revised identity uses electric cobalt (`#3156f5`), fizzy aqua (`#38cfcc`), tangerine (`#ff8549`), lemon (`#f8d55e`), and lilac (`#ba9dff`) on white/lavender surfaces. Rounded system typography keeps the app self-contained and available offline.

## Assets

- [Skipper mascot](../public/brand/skipper.png): original transparent octopus captain, generated with the built-in image-generation tool, then resized to a 640px maximum edge for the app. No third-party asset requests are needed at runtime.
- [Logo source](../public/icon.svg): code-native vector mark combining a drink glass, aqua wave, sunset, and straw. Used by the shared wordmark and browser favicon.
- [192px app icon](../public/icon-192.png) and [512px app icon](../public/icon-512.png): rasterized from the vector source for installation and home-screen use.

## Character and behavior

The current crew contains Skipper, Sunny, Pip, Finn, Clawdia, and Pearl. Each sailor can choose a character in their editor. Four distinct expression poses and short gestures respond to that sailor’s selected-day logs. There is no in-app pause control; system reduced-motion settings are respected. [Current expression sheets and prompts](character-art.md) replace the original single-pose mascot in the app. The original Skipper image is retained as a design artifact.

A new drink or explicit repeat triggers a brief pop-up using that sailor’s own character and daily expression, only after IndexedDB persistence succeeds. Bubbles/confetti accompany ordinary saves; the water-break pose uses quieter feedback. Editing a drink uses a plain confirmation. Failures keep the draft open and never celebrate. The celebration does not intercept journal interactions, can be dismissed, and disappears automatically after 4.2 seconds. Opening an editor clears any previous celebration. The reduced-motion version retains the confirmation without animated particles.

## Final mascot generation prompt

Generated using the built-in image-generation tool with a transparent background.

> Use case: stylized-concept. Asset type: transparent mascot for SipAhoy, a playful modern cruise drink journal app. Create one original character named Skipper: a charismatic little tangerine-orange octopus sea captain with large expressive dark ink eyes, a happy cheeky smile, a small ivory sailor cap with a simple cobalt-blue wave emblem (no letters), and a cobalt neckerchief. Rounded sculptural toy-like 3D illustration with soft matte clay surfaces, polished editorial character design, gentle studio lighting and subtle dimensional shadows. One curled tentacle raises a small clear glass of sparkling lemonade with a lemon slice and tiny aqua paper umbrella; another tentacle waves hello. Compact charming silhouette, all tentacles and accessories fully within frame, generous transparent margin, front three-quarter view. Saturated cobalt, tangerine, lemon and aqua accents; avoid desaturated sage/navy aesthetics. Character must read beautifully at 100 pixels. One character only, no scene, no floor, no background, no typography, no watermark. Genuinely transparent background.
