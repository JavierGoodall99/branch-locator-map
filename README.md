# Branch Locator

Find a bank branch, ATM or Smart ID service near you, on a map or in a list, with opening hours and
directions. A React + TypeScript single-page app.

> **The data is a demo sample.** `public/branches.json` holds 195 sites (120 branches, 67 ATMs, 8 business
> centres) chosen from an export of public branch-locator data by `scripts/build-sample-data.mjs`. It is not
> live, and the raw export is not in this repository.

> **This is an independent demo project.** It is not a bank's service, and is not affiliated with or
> endorsed by the bank whose branches and brand styling it uses as a worked example.

**Live demo: https://javiergoodall99.github.io/branch-locator-map/**
(published by CI from `main`; see [Deployment](#deployment)).

## Quick start

You need **Node 24** (see `.nvmrc`; `engines` allows 22.12 or newer, the oldest Vite 8 supports) and npm.

```bash
npm ci
npm run dev          # http://localhost:5173
```

| Command                  | What it does                                                                |
| ------------------------ | --------------------------------------------------------------------------- |
| `npm run dev`            | Start the dev server                                                        |
| `npm run build`          | Type-check, then build to `dist/`                                           |
| `npm run preview`        | Serve the production build locally                                          |
| `npm test`               | Unit and component tests (Vitest, Testing Library)                          |
| `npm run test:e2e`       | End-to-end tests (Playwright), on a desktop and a phone, with accessibility scans |
| `npm run lint`           | oxlint, including the accessibility rules                                   |
| `npm run format:check`   | Prettier (`npm run format` fixes)                                           |
| `npm run typecheck`      | TypeScript only                                                             |

The first time you run the end-to-end tests, install the browser: `npx playwright install chromium`.
They build the app and test the production build, not the dev server.

Unit tests sit next to the code they test (`BranchCard.test.tsx` beside `BranchCard.tsx`). A few small leaf
components have no test file of their own because the component that renders them covers them: `ServiceList`
through `BranchCard`, `DetailHero` through `BranchDetail`, `FilterButton` through `LocatorControls`, and
`LazyBranchMap` through the end-to-end tests.

## Run it in Docker

```bash
docker build -t branch-locator .
docker run --rm -p 8080:8080 branch-locator     # http://localhost:8080
```

A multi-stage build: Node builds the app, and the `nginx-unprivileged` image (a normal user, not root)
serves the result on port 8080. nginx sends a Content-Security-Policy and the other security headers
(`docker/security-headers.conf`), caches the build's named files for a year and makes the page check
every time, compresses text, and answers `/healthz` for the container's health check.

Two optional checks:

```bash
docker build --target test .                    # lint, formatting and unit tests, inside the build
docker run -d -p 8080:8080 branch-locator
CONTAINER_URL=http://localhost:8080 npx playwright test --project=container
```

The second opens the running container in a browser and checks the headers, caching, compression, that
there are no policy violations, and that the map's worker and vector tiles load. It exists because the
other end-to-end tests use `vite preview`, which cannot see mistakes in the nginx configuration (it
caught one: nginx served `.mjs` files as `application/octet-stream`, which browsers refuse for a worker).

CI (`.github/workflows/ci.yml`) runs lint, formatting, types, unit tests, the build and the end-to-end
tests, and in a second job builds the image and runs the container checks.

## Deployment

Every push to `main` that passes all the checks is published to GitHub Pages by the `deploy` job in
`.github/workflows/ci.yml`. The job builds the app with `BASE_PATH` set, because Pages serves a project at
`/<repository>/` and not at the root; everywhere else (the dev server, the Docker image) the base is `/`.

GitHub Pages cannot send HTTP headers, so the live demo does **not** have the Content-Security-Policy and the
other security headers. The Docker image is the production artifact: it has them, and the container tests
check them. Behind a real host, run that image.

## What it does

- A map and a list that always agree. Pins cluster; a branch is a blue square with a building, an ATM is a
  white circle with a card, so the two never depend on colour alone.
- **Near me:** the page asks for your location when it opens and starts with what is within 25 km,
  nearest first, with distances. The 5, 10, 25, 50 and 100 km pills change that, and pressing one also
  asks for the location if it was refused or turned off. If the browser has blocked the site the page says
  what helps and finds you by itself as soon as you allow it.
- Search with suggestions (places, then branches and ATMs), the Both / Branches / ATMs switch, and a
  Filters window: open now, open 24 hours, services, province, and sort by distance or name.
- Hovering a card shows that place on the map. Opening one gives its details: address, status,
  Get directions, Call, opening hours and services.
- Works from a 360px phone (the results are a sheet that a handle lowers to show the whole map) to a
  wide desktop (a side panel beside the map).

## Decisions and trade-offs

The full record, with the reasons, is in [`design.md`](design.md). The ones to talk about:

- **MapLibre GL with OpenFreeMap, loaded lazily.** It needs no API key and no billing account, uses real
  vector tiles and is open source. It is about 1 MB, so it loads on its own after the page: the list is
  usable first, and still complete if the map cannot load (WebGL missing, tiles offline), which is tested.
  The cost: tiles come from a third party (`tiles.openfreemap.org`), so a visitor's IP address reaches
  them, and the page's Content-Security-Policy names that one host.
- **A static `branches.json` behind a `branchesApi` layer.** There was no API to build against. `branchesApi.ts`
  fetches the data and checks every record, so bad data is an error the page explains, not a crash.
  Swapping in a real service means changing that one file; everything else works with the validated
  `Branch` type.
- **Logic is pure and separate from the screen.** Filtering, sorting, distance, opening hours, suggestions
  and the filters themselves are plain functions in `features/branches/lib` and `model`, tested without a
  browser. Components stay thin. There is no router or state library: one page, state in `App`.
- **Accessibility is part of the design, not a pass at the end.** The search is an ARIA combobox, the
  whole card opens its details through one real button (a stretched link, so keyboard and screen reader
  users get one stop), focus is managed when details open and close, status and counts are announced, and
  the Playwright suite scans every main screen with axe. The brand blue is 4.48:1 on white, a hair under
  4.5:1; that is a known trade-off to match the brand's blue, which `design.md` records, and the scans allow
  only that exact case.
- **Asking for the location on arrival.** It saves a tap, but it is a prompt before the user has chosen
  anything. The page never stores or sends the location, falls back to the whole list by name, and treats a
  refusal as a normal state, not an error.
- **Bootstrap 5.3 through react-bootstrap and Sass variables**, not a custom CSS system, with the theme in
  `src/styles/_variables.scss`. No Bootstrap JavaScript.
- **What the data cannot do.** Every site has one set of hours for every day, so there are no
  Open Saturday or Open Sunday filters: they would be guesses.

### What I deliberately did not test

- **The map's pixels.** jsdom has no WebGL, so unit tests use a fake MapLibre to check what the app asks
  of it (layers, filters, camera moves). The end-to-end tests check that a real map loads, and the
  container test that vector tiles arrive. Nothing checks that a pin looks right: no visual regression.
- **The browser's location prompt.** The browser owns it. Tests stub geolocation and the permission state.
- **Browsers other than Chromium** (desktop and a Pixel 5 profile), and real devices.
- **Performance budgets and load.** The map is lazy and the images are optimised, but nothing fails the
  build if they regress.
- **Third-party servers.** The end-to-end tests replace the map style with a tiny one, so they do not
  depend on OpenFreeMap being up.

### With more time

- A real API, with search and distance done on the server, so the page does not load every branch.
- Opening hours per weekday, and the Open Saturday and Sunday filters that need them.
- Firefox and WebKit in the end-to-end tests, visual regression for the map, and a Lighthouse budget in CI.
- Error reporting (for example Sentry) behind the error boundary, and a scan of the image for known
  vulnerabilities in CI.
- Offline support for the list, and translations.

## Project layout

```
src/
  features/branches/
    api/         fetching and validating the data
    components/
      controls/  search, Near me, the show switch, distances, the Filters window
      list/      the results list and its cards
      detail/    one place's details
      common/    pieces the list and the details share: status, services, type badge
      layout/    the page layout, and the panel that shows the list or the details
    lib/         pure logic: filtering, sorting, distance, hours, suggestions
    map/         the map component, and MapLibre layers, pins, camera, attribution
    model/       filters and hooks: useBranches, useLocation
  shared/        hooks and UI used by more than one place
  styles/        Sass: Bootstrap theme variables and the app's own styles
e2e/             Playwright tests
docker/          nginx configuration for the container
scripts/         builds the sample data and the icons
```

Imports from another folder use the `@/` alias, which means `src/`.

## Tools used

I built this with **Claude Code** (Anthropic's AI coding assistant) for implementation, tests and
documentation, and **Claude Design** for the first layout prototype. The decisions are written down in
`design.md`, and `CLAUDE.md` holds the working rules the assistant followed, including the commit style:
small commits, each leaving the project working.

## Notes

- **The brand name, logo and symbol shown belong to their owner.** They are used here only as an
  illustration, in the header and as the tab icon, and are not covered by any licence for this repository.
- The browser console may show warnings from OpenFreeMap's own map style about road shields. They are not
  from this app.
