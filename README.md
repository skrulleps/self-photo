# Studio Jepret

A cute photo booth that runs in the browser. Pick a frame, take or choose your photos, and save or share the finished print.

Photos are processed on the device. Nothing is uploaded to a server.

## Features

- **Ready-made frames:** 12 presets across three categories, including Halloween, Graduation Day, Valentine, and Happy New Year.
- **Photo per slot:** fill each slot from the camera or from a file on the device, and mix both in one print. If camera access is denied, device files still work.
- **Guided capture:** live camera preview, a 3-second countdown after each click, and a photo that lands in its slot right away.
- **Sound effects:** countdown beeps, a shutter click, and a short jingle when the print is ready, with a button to mute them.
- **Frame editor:** choose from 7 layouts, 7 photo shapes, and 5 background patterns, then set colors and text.
- **Characters:** add built-in characters or import your own images, then move, resize, rotate, flip, and reorder them, up to 12 per frame.
- **Save and share:** download a PNG, use the device share sheet, or send by email.

Custom frames are stored in the browser's `localStorage`, so they stay on that browser and device.

## Getting started

You need Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Add `?fast=1` to the URL for a shorter countdown.

Browsers only allow camera and share features on `localhost` or HTTPS. To test on a phone over your local network, run:

```bash
npx next dev --experimental-https
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm run build` | Creates a static site in `out/` |
| `npm run lint` | Runs ESLint |
| `npm test` | Runs the unit tests with Vitest |
| `npm run test:e2e` | Runs the end-to-end tests with Playwright |
| `npx tsc --noEmit` | Checks types |
| `npm run check:version` | Checks that the version matches across files |
| `npm run log <type> "<text>"` | Adds a changelog entry to `[Unreleased]` |
| `npm run bump <major\|minor\|patch>` | Bumps the version and turns `[Unreleased]` into a dated release |

The end-to-end tests use a fake Chromium camera. Install the browser once before the first run:

```bash
npx playwright install chromium
```

## Contributing

Changes reach `main` only through a pull request. Each pull request must pass these GitHub Actions checks:

- **Version:** `package.json`, `package-lock.json`, and `CHANGELOG.md` agree, and the version isn't lower than the one on `main`
- **Lint, types, unit, build:** ESLint, TypeScript, Vitest, and a production build
- **E2E:** Playwright against the static build, with a fake camera

If E2E fails, download the `playwright-report` artifact from the workflow run to see what went wrong.

### Releasing

The release commands are inspired by [Cider](https://github.com/f3ath/cider), a similar tool for Dart.

```bash
npm run log added "Share button for WhatsApp"   # types: added, changed, fixed, removed, deprecated, security
npm run bump minor                              # also: major, patch
```

These commands only edit files. Open a pull request with the changes, then tag the release on `main` after it's merged.

## Deployment

The app is a static site hosted on Cloudflare Pages:

- Merging to `main` deploys to production.
- Each pull request gets its own preview URL.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npx next build` |
| Build output directory | `out` |
| Production branch | `main` |

To preview a build locally, run `npm run build`, then `npx serve@latest out`.

Because the site is static, server features such as API routes aren't available. Planned backend and payment features will need different hosting.

## Project structure

```text
app/                 Routing, global styles
components/          Booth flow, frame picker, frame editor, print preview
lib/template/        Template types, schema, presets, layers, storage
lib/render/          renderPrint, shapes, geometry
lib/booth/           Booth state machine (reducer)
lib/camera/          Camera hook, frame capture, file loading
lib/export/          PNG export, sharing, fonts, image cache
lib/sound/           Sound effect notes and Web Audio player
public/characters/   Built-in character art
public/samples/      Sample photos for frame thumbnails
tests/unit/          Vitest tests
tests/e2e/           Playwright tests
docs/                Product requirements and decision log
```

## How it works

Every print comes from one JSON `Template` drawn by one function, `renderPrint()`. The preview, thumbnails, editor, and export all call it, so they always match.

- Template coordinates are normalized to `0..1` and converted to pixels only when drawing.
- The booth flow lives in a pure reducer in `lib/booth/machine.ts`. Timers and the camera stay in the component.
- Any template from outside the code, such as `localStorage`, is validated with the Zod schema in `lib/template/schema.ts`.

More detail is in [docs/PRD.md](docs/PRD.md) and [docs/decisions.md](docs/decisions.md). Contributor rules are in [CLAUDE.md](CLAUDE.md), and release notes are in [CHANGELOG.md](CHANGELOG.md).

## Known limitations

- **Email on desktop:** `mailto:` links can't carry attachments, so the photo is downloaded and you attach it yourself. On phones, the share sheet attaches it.
- **No access control:** anyone using the booth can edit custom frames on that device.
- **Device testing:** end-to-end tests run in Chromium with a fake camera. Check Safari on iOS and Chrome on Android on real devices.

## Roadmap

Planned work from the [PRD](docs/PRD.md):

- Remaining editor features: background photos, photo filters, PNG overlays, business watermark, and JSON import/export
- Automatic cut-out of people from photos with MediaPipe
- Backend, gallery, and QR download with Supabase
- Payments with Midtrans or Xendit

## Troubleshooting

**`Cannot find native binding` when running tests.** npm can drop the platform-specific `rolldown` binary during install. Windows x64 and Linux x64 bindings are listed in `optionalDependencies` for this reason. On another platform, add the matching `@rolldown/binding-*` package at the same version as `rolldown`. When `rolldown` is upgraded, upgrade these packages too.

## License

This is a private project and no license has been chosen yet.
