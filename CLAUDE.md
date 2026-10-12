# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project

Production React + TypeScript single-page app built with Vite and styled with Bootstrap.

## Stack

- React 19, TypeScript 6, Vite 8
- Bootstrap 5.3.x (stable). Do not upgrade to Bootstrap 6 until it has a stable release; only alphas exist.
- `@types/bootstrap` for Bootstrap's JavaScript API
- Lint: oxlint

## Commands

- `npm run dev` – start the dev server
- `npm run build` – type-check (`tsc -b`) and build for production
- `npm run lint` – run oxlint
- `npm run preview` – serve the production build locally

Run `npm run lint` and `npm run build` before considering a change done.

## Structure

- `src/main.tsx` – entry point; imports Bootstrap CSS and JS bundle
- `src/App.tsx` – root component
- `src/index.css` – app-level style overrides (loaded after Bootstrap)
- `postcss.config.js` – intentionally empty. It stops Vite from picking up an unrelated `postcss.config.mjs` in the parent folder (`D:\Coding Projects`). Do not delete it.

## Conventions

- Function components and hooks only; keep TypeScript strict, no `any`.
- Use Bootstrap utility classes and components first; add custom CSS in `src/index.css` only when needed.
- Use Bootstrap's JS API through typed imports (`import { Modal } from 'bootstrap'`), not global `window.bootstrap`.
- Pin dependency changes deliberately; this is a production app, so avoid alpha/beta/`next` packages.
