# GIWU Systems, Inc. — Website

A fast, responsive, single-page marketing site for GIWU Systems, Inc., built from the
Claude Design mockup. Plain HTML + CSS + JavaScript — **no build step, no dependencies.**
Works on any static host.

## Structure

```
GIWU website/
├── index.html              # the page (semantic HTML)
├── assets/
│   ├── css/styles.css      # all styles + light/dark theming
│   ├── js/main.js          # theme toggle, scroll reveal, counters, menu, form
│   └── img/
│       ├── logo-full.png   # full blue logo (hero, light-mode header/footer, favicon)
│       └── logo-mark.png   # white mark (dark-mode header/footer)
└── README.md
```

## Preview locally

Just open `index.html` in a browser. For a proper local server (recommended, so paths
and fonts behave exactly like production):

```bash
# any one of these, from inside the project folder:
npx serve .
python -m http.server 8000      # then visit http://localhost:8000
```

## Features

- **Light / dark mode** — toggle in the header; the choice is saved (localStorage).
  You can also force a theme with `?theme=light` or `?theme=dark` in the URL.
- **Responsive** — desktop → tablet → mobile, with a hamburger menu under 1020px.
- **Motion** — subtle hero entrance, scroll-reveal, and animated stat counters, all
  disabled automatically for visitors with "reduce motion" turned on.
- **Accessible** — semantic landmarks, keyboard-friendly menu, visible focus, skip link.

## Customize

| What | Where |
|------|-------|
| Headlines & body copy | `index.html` (edit the text directly) |
| Contact details (email, phone, Viber, Messenger) | search `info@giwusystems.com` / `639171234567` in `index.html` |
| Social links | footer `<a href="#" class="social-link">` — replace `#` with real URLs |
| Colors / theme | the `:root` (dark) and `html.light` blocks at the top of `styles.css` |
| Logo | replace the files in `assets/img/` (keep the same names) |

### Swap the placeholders

The design ships with tasteful placeholders where real assets go. Each is marked with an
HTML comment:

- **Client logos** (Trusted By): replace each `<div class="logo-slot">…</div>` with
  `<img src="assets/img/client-x.png" alt="Client name">`.
- **Team headshots**: replace each `<span class="avatar">…</span>` with
  `<img class="avatar" src="assets/img/person.jpg" alt="Full name">`.
- **Testimonial**: update the quote text and the `Client Name — Operations Director` line.

## Make the contact form actually send

The form currently validates input and shows a success message, but does **not** deliver
anywhere yet. Pick one:

- **Formspree** (easiest): create a form, then in `index.html` set
  `<form id="quote-form" action="https://formspree.io/f/XXXX" method="POST">` and remove
  the simulated-success block in `assets/js/main.js` (it's marked with a comment).
- **Netlify Forms** (if hosting on Netlify): add `netlify` and a `name` attribute to the
  `<form>`, and a hidden `form-name` field.
- **Your own endpoint**: `fetch()` the form data to your API in the submit handler.

## Deploy

It's a static site, so anything works:

- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the folder, or connect a repo.
- **GitHub Pages** — push to a repo and enable Pages.
- **Any web host** — upload the folder via FTP.

## Notes

- Fonts (Manrope, Orbitron, Space Grotesk) load from Google Fonts. To self-host for offline
  use / privacy, download the woff2 files and replace the `<link>` in `index.html` with
  local `@font-face` rules.
- Before going live, add a proper Open Graph image and set `<meta property="og:url">` to
  your real domain for nice link previews.
