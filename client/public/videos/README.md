# Hero promo video

`hero.mp4` in this folder is the client's promo clip. It plays (muted, looping,
autoplay) in the hero cockpit's **Flagship Studio** frame — the tall media box on
the right of the homepage hero — in place of the studio photograph.

To swap it or point at another file, use Admin → Settings → Homepage Hero →
**"Homepage Video URL"**: paste a direct `.mp4` link, or a site path such as
`/videos/hero.mp4`. Clearing the field puts the studio photograph back.

## Why the frame crops instead of letterboxing

The bundled recording is landscape (1920×1080) exported into a vertical
1080×1920 canvas with pure-black bars top and bottom (footage sits at rows
660–1260). Rendering that file with plain `object-cover` would show the bars
inside the hero frame, so the `<video>` element is shaped 9:5 — the exact shape
of the footage between the bars — and centred; the frame then crops the sides and
never shows letterboxing. Prefer a landscape clip with no baked-in bars.

## File budget

Keep it small (under ~10 MB, H.264). It plays muted, so no audio track is needed,
and `preload="auto"` means it is fetched as soon as the hero renders — this file
is on the critical path of the homepage.
