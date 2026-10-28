# Hangman figure

`hangman-person.webp` is an AI-generated, fully dressed adult character created for this site. The transparent cutout is stored locally and reused by all six drawing stages; it does not contact an external image service.

The reveal regions in `js/site/hangman-view.js` use the original 1024 × 1536 image coordinates. If the asset is replaced, review all six masks together before changing those coordinates.
