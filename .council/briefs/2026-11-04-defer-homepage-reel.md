---
slug: defer-homepage-reel
tier: T2
vertical: homepage
chairman-status: approved
chairman-direction: '“Keep the homepage looking the same, just load the video when people start scrolling. Test it on mobile and make it live.” — in-session, 4 November 2026.'
---

# Load the existing homepage reel after scroll

Keep the original opening artwork, headline, calls to action, scrim, motion, and all three video renditions. A fresh visit loads the original poster but does not request an MP4 until the reader scrolls while the reel is still in view. Jumping straight to content below the reel does not require it. The poster and actions remain visible while the first frame is unavailable, including if the video fails. Reduced-motion and no-JavaScript visits keep their static screen. No analytics, imagery sourcing, copy, or deployment settings change.

Verify the opening view against the previous production build, touch scroll on narrow screens, desktop keyboard scroll, responsive rendition selection, seek in both directions, and the static/failure paths. Require executed Council and Linux validation before the protected merge; confirm Cloudflare production and repeat a public mobile-browser check.
