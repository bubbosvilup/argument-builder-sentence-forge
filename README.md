# Argument Builder — Sentence Forge

An interactive English-speaking lesson tool that turns a simple opinion into a structured argument, one reusable language module at a time.

**Live site:** https://bubbosvilup.github.io/argument-builder-sentence-forge/

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`, then preview it with `npm run preview`.

## What students can do

- Choose from ten curated discussion topics.
- Add, remove, drag, and undo stance, precision, reasoning, evidence, nuance, and conclusion modules.
- Watch a transparent A1–C1 practice estimate and four argument-quality meters change.
- Compare the core claim with the expanded version.
- Use challenges, Teacher Mode, sentence anatomy labels, speech synthesis, and prompt-only speaking practice.
- Continue from the most recent topic and build through local browser storage.

The CEFR badge is an educational practice estimate based on the range of communicative functions in the answer; it is not a formal assessment.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the site whenever `master` is updated. Vite uses the repository subpath as its production base, while local development continues to work normally.

## Stack

React, TypeScript, Vite, and plain CSS. There is no backend, external API, or runtime dependency beyond React.
