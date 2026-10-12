# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project

Production React + TypeScript single-page app built with Vite and styled with Bootstrap.

## Stack

- React 19, TypeScript 6, Vite 8
- Bootstrap 5.3.x (stable). Do not upgrade to Bootstrap 6 until it has a stable release; only alphas exist.
- `react-bootstrap` for components (no Bootstrap JavaScript, no jQuery)
- Sass (`sass`) for theming; Nunito Sans self-hosted via `@fontsource-variable/nunito-sans`
- Lint: oxlint

## Commands

- `npm run dev` – start the dev server
- `npm run build` – type-check (`tsc -b`) and build for production
- `npm run lint` – run oxlint
- `npm run preview` – serve the production build locally

Run `npm run lint` and `npm run build` before considering a change done.

## Structure

- `src/main.tsx` – entry point; imports the font and `src/styles/main.scss`
- `src/App.tsx` – root component
- `src/styles/_variables.scss` – theme overrides (Sass variables, imported before Bootstrap); tokens are documented in `design.md`
- `src/styles/_custom.scss` – small app-level additions, loaded after Bootstrap
- `src/styles/main.scss` – entry; imports only the Bootstrap modules the app uses
- `vite.config.ts` – silences Bootstrap 5.3's own Sass deprecation warnings only
- `postcss.config.js` – intentionally empty. It stops Vite from picking up an unrelated `postcss.config.mjs` in the parent folder (`D:\Coding Projects`). Do not delete it.

## Conventions

- Function components and hooks only; keep TypeScript strict, no `any`.
- Theme through Sass variables in `_variables.scss` first, then `--bs-*` CSS variables, then `_custom.scss`. Never edit `node_modules` and avoid `!important`.
- Use `react-bootstrap` components. Do not import Bootstrap's JavaScript bundle or use `window.bootstrap`.
- When a new Bootstrap component is used, add its module to `main.scss`.
- Use theme tokens, not hard-coded hex values. Format money with `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })` and the `tabular-nums` class.
- Pin dependency changes deliberately; this is a production app, so avoid alpha/beta/`next` packages.
