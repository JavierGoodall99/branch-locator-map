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

## Assessment context

This repo is a Capitec Frontend Engineer technical assessment. The commit history is part of what reviewers evaluate, so work and history must read like a real-world engineering team's.

- Deliver one of the three briefs (Customer Spending Insights Dashboard, Loan Eligibility Simulator, Branch Locator Map) using mocked data.
- Required: production-grade code, a runnable multi-stage Dockerfile, and a README explaining how to build, run and test.
- The GitHub repo must be public and submitted by 26 October.
- Be able to explain every decision in an interview. Only document what has been verified; do not claim things about Capitec's internal stack.

## Git workflow

- Commit regularly: one logical change per commit, never a large batch of unrelated work.
- Every commit must leave the project working. Before committing, run `npm run lint` and `npm run build`, plus the tests once they exist.
- Write tests in the same commit as the code they cover, or in the commit right after it.
- Use Conventional Commit messages: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`, `style:`, `build:`. Use an imperative summary under about 72 characters, and add a short body when the reason is not obvious.
- Commit messages are a conventional subject plus an optional body. Do not append trailers.
- Stage files explicitly by name. Never commit secrets, `node_modules`, `dist` or scratch files.
- Commit locally only. Do not push, force-push or rewrite history unless the user asks.
- Keep `README.md`, `design.md` and this file in step with the code in the same commit that changes behavior.
