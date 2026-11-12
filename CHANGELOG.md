# Changelog

All notable changes to Studio Jepret are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- App icon, and a link preview image for WhatsApp and social media.

## [0.2.0] - 2026-11-03

The full visitor flow, a frame editor, themed frames, and a new look.

### Added

- **Frame picker:** thumbnails with Semua, Acara, Romantis, and Umum filters.
- **Presets:** 12 frames, including Halloween, Graduation Day, Valentine, and Happy New Year.
- **Frame editor:** create, edit, and delete custom frames from the booth page. Frames are saved in the browser.
- **Layouts:** strip, zigzag, grid, trio, mosaic, duo, and single photo.
- **Photo shapes:** rounded, circle, heart, star, flower, arch, and cloud, with a colored outline.
- **Background patterns:** dots, hearts, stars, and stripes.
- **Characters:** 12 original built-in characters, plus image import from the device. Characters can be moved, resized, rotated, flipped, and reordered, up to 12 per frame.
- **Device photos:** each slot can use the camera or an image from the device, and one print can mix both.
- **Guest text:** a main line of up to 32 characters and a small line that defaults to today's date. Text shrinks to fit.
- **Save and share:** PNG download, device share sheet, and email. On desktop, the email button downloads the photo and opens your email app, and you attach the file yourself.
- **Sound effects:** countdown beeps, a shutter sound, and a jingle when the print is ready, with a mute button.
- **Tests:** Playwright end-to-end tests with a fake camera, and more unit tests.
- **CI:** GitHub Actions checks on every pull request, a ruleset that protects `main`, and a pull request template.
- **Releases:** `npm run log` and `npm run bump` commands, inspired by [Cider](https://github.com/f3ath/cider), and an automatic version bump, tag, and GitHub Release after each merge.

### Changed

- **Capture flow:** the camera preview stays visible, each photo starts with a click and a 3-second countdown, and the finished photo appears in its slot right away.
- **Design:** new pastel look with the Fredoka font, a step indicator, and dark mode.
- **Result screen:** the print is centered and highlighted, with the action buttons below it.
- **Print text:** now uses the Fredoka font instead of the system font.
- **`renderPrint`:** now takes `renderPrint(ctx, input)`, so preview, thumbnails, editor, and export share one input shape.
- **Hosting:** the app now builds as a static site for Cloudflare Pages, so `npm start` is gone. Use `npx serve@latest out` to preview a build.

### Fixed

- **Empty slots:** they now stay empty until filled, instead of repeating the last photo.
- **Older browsers:** photos with rounded corners now work without `roundRect` support.
- **Install:** all `rolldown` binaries and `fsevents` are now listed as optional dependencies, because npm could drop them from the lockfile and break `npm ci`.

### Known limitations

- Safari on iOS, Chrome on Android, the real share sheet, and touch dragging have not been tested on real devices.
- Anyone using the booth can edit custom frames on that device.
- Custom frames don't move between browsers or devices.

## [0.1.0] - 2026-11-03

First working version of the booth.

### Added

- Template model and `renderPrint`, with photos cropped to fit each slot.
- Camera capture with a countdown, using a reducer for the booth flow.
- Unit tests for geometry and the reducer.
- Product requirements, a decision log, and project guidelines.
