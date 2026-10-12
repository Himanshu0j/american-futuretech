# Hero promo video

`hero.mp4` in this folder is the client's promo clip. It plays (muted, looping,
autoplay) in the hero cockpit's **Flagship Studio** frame — the tall media box on
the right of the homepage hero — in place of the studio photograph.
`hero-poster.jpg` is the clip's own **first frame**, used as the `poster` so the
frame is never black while the file is still arriving.

To point the hero at another file, use Admin → Settings → Homepage Hero →
**"Homepage Video URL"**: paste a direct `.mp4` link, or a site path such as
`/videos/hero.mp4`. Clearing the field puts the studio photograph back. A URL
pasted there gets no poster (the bundled first frame would be a different clip).

## Encoding rules (why the file looks odd in the source)

The recording we were given is landscape (1920×1080) exported into a **vertical
1080×1920 canvas with pure-black bars** top and bottom, and it is **HEVC** — which
Chrome and Firefox only play with hardware support. Both are fixed by re-encoding:

```bash
# 1. Find the footage inside the bars (prints something like crop=1080:608:0:656)
ffmpeg -i source.mp4 -vf cropdetect=24:2:0 -t 10 -f null -

# 2. Crop the bars away and encode H.264 with the metadata at the front
ffmpeg -y -i source.mp4 \
  -vf "crop=1080:608:0:656,hqdn3d=1.2:1.2:5:5" \
  -c:v libx264 -preset slow -crf 31 -pix_fmt yuv420p \
  -profile:v high -level 4.0 -g 48 -movflags +faststart -an -r 24 \
  hero.mp4

# 3. Poster = the clip's own first frame (t=0 keeps poster → playback seamless)
ffmpeg -y -ss 0 -i source.mp4 -vf "crop=1080:608:0:656" -frames:v 1 -q:v 4 \
  hero-poster.jpg
```

Current file: 1080×608, H.264 High, 507 kbit/s, 24 fps, 14 s, **~873 KB**
(SSIM 0.974 against the source). The original HEVC master was 2.9 MB at
1443 kbit/s, i.e. this is ~3.3× smaller and plays everywhere. `faststart` matters:
without it the browser has to fetch the tail of the file before the first frame.

## Why the frame crops instead of letterboxing

The bars are cropped out of the file itself, so plain playback fills the 9:5
frame. The `<video>` element is still shaped 9:5 and centred, which means an
admin can paste a normal landscape clip later and the frame crops the sides
instead of showing letterboxing. A clip whose own black bars are baked in still
works — the 9:5 window crops them away.

## File budget

Keep it under ~1 MB and under 10 MB at the absolute most. The clip autoplays on
the homepage hero, so it is on the critical path for every visitor.
