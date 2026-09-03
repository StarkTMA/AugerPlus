# Auger Plus

> A Chrome extension to tidy up your offers and hide the clutter.

[![Latest Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/StarkTMA/AugerPlus/releases)
[![CI & Release](https://github.com/StarkTMA/AugerPlus/actions/workflows/ci-release.yml/badge.svg)](https://github.com/StarkTMA/AugerPlus/actions/workflows/ci-release.yml)

---

## What is Auger Plus?

**Auger Plus** is a simple Chrome extension built to help you clean up the offers page. This was a quick vibecoded tool created for personal productivity only, shared to help anyone who wants a cleaner, distraction-free workflow.

---

## How It Works

- **Inline Hiding**: Each offer gets a handy **"Hide"** button right in the table row.
- **Easy Recovery**: Need to bring something back? A new **UNHIDE** button appears right next to the "Create new" button that lets you view hidden offers, search through them, and unhide them individually or all at once.
- **Infinite Continuous Browsing**: Automatically renders all pages into one continuous view, so you never have to flip between pages or deal with pagination controls.
- **Instant CSS Filtering**: Uses high-performance dynamic CSS rules to instantly hide rows without altering React state or table internals.
- **Lightweight & Hassle-Free**: Everything is stored directly in Chrome storage, keeping it fast, private, and seamlessly synchronized across tabs.

---

## Download & Install

Getting started with Auger Plus is quick and easy:

### 1. Download the Extension

Grab the latest release from the [GitHub Releases](https://github.com/StarkTMA/AugerPlus/releases) page.

### 2. Install in Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle in the top right corner.
3. Click **Load unpacked** and select the extracted `dist` folder.

### 3. Start Using

1. Visit your offers page.
2. Use the new **Hide** button on any unwanted offer.
3. Access your hidden offers anytime with the **UNHIDE** button next to "Create new".

---

## Development

Built with modern TypeScript, Vite, and Vitest.

```bash
# Install dependencies
npm install

# Run unit & integration tests
npm test

# Type check TypeScript
npm run typecheck

# Build and package extension zip into dist/
npm run build
```

---

## Feedback & Community

Got suggestions, ideas, or found a bug?

- Join our [Discord Server](https://discord.com/invite/qKsKWbB) to chat with us.
- Send an email to [contact@starktma.net](mailto:contact@starktma.net).
- Open an issue or discussion on [GitHub](https://github.com/StarkTMA/AugerPlus/issues).

---

### License

Distributed under the [GPL-3.0 License](LICENSE). Copyright © 2026 [StarkTMA](https://starktma.net/).
