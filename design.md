# Design

Design tokens and rules for this app. The visual language is based on a brand extraction of capitecbank.co.za (via dembrandt), mapped onto Bootstrap 5.3 so components inherit it through CSS variables and Sass overrides instead of one-off CSS.

Notes on provenance:
- **Extracted** values come straight from the site. **Decided** values are my choices where the extraction was empty or noisy (marked below).
- This is a candidate project, not a Capitec product. The header uses Capitec's logo (`src/assets/capitec-logo.svg`, copied from capitecbank.co.za) with a divider and "Branch finder", because this assessment is for Capitec. The logo is Capitec's trademark: it is used only to present this assessment, is not covered by any licence for this repository, and should be removed if the project is reused. Their favicon and imagery are not used.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| `--app-primary` | `#2f70ef` | Primary actions, links, active states, focus ring accent |
| `--app-primary-strong` | `#2259d0` | Pressed state, high-emphasis text on light backgrounds |
| `--app-primary-deep` | `#0033a0` | Headings on tint, chart anchor color |
| `--app-primary-soft` | `#557fdb` | Secondary chart series, icons |
| `--app-primary-tint` | `#cfdefb` | Selected rows, badges, subtle fills |
| `--app-surface` | `#ffffff` | Page and card background |
| `--app-text` | `#3a3a3a` | Body text |
| `--app-text-muted` | `#4e6066` | Secondary text, captions |
| `--app-text-subtle` | `#5d737e` | Table headers, tertiary text |
| `--app-ink` | `#000000` | Card headings, focus outline |
| `--app-border` | `#ededed` | Card and divider borders |

Extracted but unused by default: `#4d5c65`, `#495057` (near-duplicates of muted text), `#255ed7` and `#437fff` (near-duplicates of primary).

Rules:
- Blue is the only brand hue. Status colors (success, warning, danger) are **decided**, not extracted: use Bootstrap's defaults, adjusted only to pass contrast.
- The palette is Capitec's own, unchanged, and the component behavior below was verified on the live site (capitecbank.co.za, October 2026).
- Known accessibility trade-off inherited from Capitec: `#2f70ef` is 4.48:1 on white, a hair under the 4.5:1 AA threshold for small text. This applies to white 16px button labels and to links. Other measured pairs on white: `#3a3a3a` 11.4, `#4e6066` 6.6, `#5d737e` 5.0, `#565656` 7.3, `#2259d0` 6.2.
- For new body copy that is not a button or link, do not use `#2f70ef`; use `#3a3a3a` or `#4e6066`.
- Never rely on color alone for meaning (for example, over/under budget needs an icon or label as well).

## Typography

- **Primary family: Nunito Sans** (weights 400, 500, 600, 700). Free on Google Fonts, self-host it for performance and privacy.
- **Display family on the source site: Flama**, used for the 72px hero. It is a commercial typeface. **Decided:** do not use it; the display style falls back to Nunito Sans 600.
- Stack: `"Nunito Sans", Arial, Helvetica, sans-serif`.

| Style | Size | Weight | Line height |
| --- | --- | --- | --- |
| Display | 72px (4.5rem) | 500–600 | 1.28 |
| H1 | 42px (2.625rem) | 600 | 1.25 |
| H2 | 32px (2rem) | 700 | 1.25 |
| H3 | 24px (1.5rem) | 600 | 1.33 |
| H4 | 18px (1.125rem) | 600 | 1.5 |
| Body | 16px (1rem) | 400 | 1.5 |
| Body strong | 16px | 600 | 1.5 |
| Button | 16–18px | 600 | 1 (set via padding) |
| Caption | 12px (0.75rem) | 500 | 1.5 |

Rules:
- Keep line length under 80 characters.
- Display size is for marketing-style hero content only. On app screens, H1 is the top level, and Display drops to H1 below the `md` breakpoint.
- Use tabular numerals (`font-variant-numeric: tabular-nums`) for all currency and table figures so columns align.
- Format currency as South African rand: `R 12 345,67` (`Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })`).

## Spacing

Base unit **8px**. Use this scale and avoid the odd values the extraction found (6.5px, 8.5px, 14.5px and similar):

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` px

Map to Bootstrap spacers: `0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem, 4rem` (`$spacer: 1rem` with the default scale already matches).

## Shape

Radius is large and soft, which is the strongest visual signature of the source.

| Token | Value | Use |
| --- | --- | --- |
| `--app-radius-sm` | 8px | Small buttons, tags, inline links with backgrounds |
| `--app-radius-md` | 16px | Cards, panels, dropdowns |
| `--app-radius-lg` | 24px | Primary buttons, feature cards |
| `--app-radius-pill` | 30px | Pill buttons, chips |
| `--app-radius-xl` | 40px | Modals, large inputs, hero containers |

Rules:
- Radius follows hierarchy: bigger containers get bigger radius. Do not apply one radius to everything.
- Borders are rare. When used: `1px solid #ededed` on cards, `1px solid #2f70ef` on outline buttons. White 2–4px borders on the source are decorative over imagery, so skip them.

## Elevation

One shadow was found: `rgba(0, 0, 0, 0.1) 40px 30px 30px 0` (a long, offset drop). **Decided:** use it only for floating layers (modals, popovers, the map info card). Static cards rely on the `#ededed` border or a flat tinted background instead of a shadow.

## Components

### Buttons

Measured live on capitecbank.co.za (`.btn.button--v2`):

| State | Style |
| --- | --- |
| Default | bg `#2f70ef`, text `#ffffff`, 48px tall, min-width 144px, padding 14px 24px, radius 24px, 1.5px solid `#2f70ef`, Nunito Sans 16px / 600 |
| Hover and pressed | bg and border `#2259d0`, white text. No lift, no opacity change |
| Focus-visible | 2px solid `#000000` outline, 2px offset |
| Disabled | 50% opacity, `aria-disabled` |

The scrape reported a cyan hover (`#1eaedb`), a 2px lift and a blue-on-tint pressed state. Checking the live stylesheet showed none of those exist, so they were scraper noise and are not used.

Button labels use sentence case and say what happens ("Check eligibility", not "Submit").
### Inputs

The extraction found no styled inputs, so this is **decided**:
- Height 48px minimum, radius 16px, 1px `#ededed` border, white background, `#3a3a3a` text.
- Focus: one clear indicator in the brand blue, never a stack of rings. Selects and text fields get Bootstrap's blue border and soft glow; the search box gets a single 2px blue ring. Never remove the indicator. (Buttons and links keep the black 2px keyboard-focus outline measured on capitecbank.co.za.)
- Visible label above every field. Placeholder text is a hint, not a label.
- Errors: message below the field in the danger color with an icon, linked via `aria-describedby`.

### Links

- Default `#2f70ef`, no underline (measured live).
- Hover `#565656`, no underline.
- Because links are not underlined, never style plain text in the same blue, so links stay distinguishable.
- Visible focus ring same as buttons.
### Cards

- White background, 16px radius, `1px solid #ededed`, 24px padding.
- Heading `#000000` at H3/H4; supporting text `#4e6066`.

### Icons

SVG only, inline, `currentColor` fill, 24px default. No icon fonts. Decorative icons get `aria-hidden="true"`; meaningful ones get an accessible name.

## Layout and breakpoints

The source declares 32 breakpoints, which is too many to maintain. Use Bootstrap's standard set:

| Name | Min width |
| --- | --- |
| `sm` | 576px |
| `md` | 768px |
| `lg` | 992px |
| `xl` | 1200px |
| `xxl` | 1400px |

- Mobile-first. Design at 360px wide first, since most banking traffic is on phones.
- Container max width 1200px from 1400px up, 1140px between 1200px and 1399px (Bootstrap needs ascending widths), with 10px side padding (measured on capitecbank.co.za at 1440px). Content columns: 12-column Bootstrap grid.
- Touch targets at least 44×44px.

## Data visualization

Applies if the chosen project includes charts (spending insights especially).
- Series colors, in order: `#2f70ef`, `#0033a0`, `#557fdb`, `#cfdefb`, then neutral greys. With more than 5 categories, group the tail into "Other".
- Every chart has a text or table alternative and labelled axes. Do not depend on color alone to tell series apart (use direct labels or patterns).
- Money values are right-aligned, tabular, and in rand.

## Accessibility

- Target WCAG 2.2 AA.
- Visible keyboard focus on every interactive element.
- Semantic landmarks (`header`, `nav`, `main`), one H1 per view.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (dark mode is out of scope unless added deliberately).
- Test with keyboard only and a screen reader before calling a view done.

## Implementation with Bootstrap 5.3

Implemented in `src/styles/`:

- `_variables.scss`: all tokens above as Sass variables, imported after Bootstrap's `functions` and before its `variables`.
- `main.scss`: imports only the Bootstrap modules in use.
- `_custom.scss`: button hover lift (disabled under `prefers-reduced-motion`), `tabular-nums`, and the extra brand CSS variables.

Components come from `react-bootstrap`; Bootstrap's own JavaScript is not loaded. The source site themes with override classes (`btn button--v2`); this app gets the same look from variables instead, so no second class is needed on buttons.

## Open questions

- Dark mode: skipped for now (Bootstrap's `data-bs-theme` can be added later).
- Which of the three assessment projects this system is applied to.
## Branch locator: scope and decisions

Source design: `design/branch-locator/` (exported from Claude Design; view the `.dc.html` files there for layouts at 375, 834 and 1440px). It is a reference for layout and behavior. Where it differs from this file, this file wins.

| Topic | Decision |
| --- | --- |
| Button color | Our theme: `#2f70ef` default, `#2259d0` hover and pressed, white label. The design's `#2259d0` default is not used. |
| Services | Only what the sample data has: Branch, ATM, SmartID Services, Cash Accepting ATM, Business Banking Centre. No wheelchair, parking or forex until the data has them. |
| Hours | One daily open and close time per site, computed in South African time. No weekly schedules or holiday overrides yet. |
| Cut from scope | Saved and home branch, language switcher, offline caching, "report incorrect info". |
| Kept | Map with list, search with suggestions, a Branches / ATMs / Both switch and distance filter, nearest-first sorting, open-now status on each branch, branch detail, location permission with a fallback, loading, empty and error states. |
| Cards | Each card leads with a badge for its kind (the same shapes and icons as the map pins: a blue square with a building for a branch, a white ring with a card for an ATM), then the name, then a line such as "Branch · 3,0 km away · Wynberg" (the distance appears once the location is known; the place is the suburb, or the town if there is no suburb). The icons are `src/assets/branch-icon.svg` and `atm-icon.svg`, which every screen and the map draw from. The full address is not on the card, only on the details. The whole card opens the details (there is no Details button): the name is the real button and is stretched over the card, so a click anywhere works and keyboard and screen reader users get one stop. Directions and Call sit above it as their own controls. |
| Details | The details take the whole sidebar: the logo, search and filters are hidden (not removed, so the search keeps what was typed) and come back with Back to results. On a phone the map then fills the space above the sheet. Beside the map the top is a photo (`src/assets/capitec-atm.jpg`, decorative, so it has empty alt text; not shown on a phone, see Phone layout) with a round white back arrow over its top left, then a grey summary panel: the kind badge, the name, the full address, the distance at the right once the location is known, the open status, and Get directions (primary) beside Call (a plain blue link as on the cards, in the next shade down, `$blue-strong`, because the brand blue is 4.5:1 on white but fails the contrast check on the grey panel). The photo is served by `vite-imagetools` as a `<picture>` of AVIF, WebP and JPEG at 480, 800 and 1200 px wide, with its width and height set so the page does not jump as it loads; the 256 KB original becomes about 15 to 100 KB per file. |
| Phone layout | Below 768px the map fills the screen, the controls float over it and the results sit in a sheet over the bottom 42%. The controls and the cards are a step smaller and tighter on a phone (a 46px search bar, a 36px switch, 34px distance pills; cards about 175px instead of 235px, with a smaller badge, text and buttons), so more of the screen is map; wider screens keep the larger sizes. A handle on the sheet's top edge (a button, so it works with a keyboard and a screen reader; its name says what it does next, "Hide results" or "Show results") lowers the sheet to a strip so the whole map shows, and raises it again. While one place is open the controls are hidden, and its details keep the same sheet as the list (the bottom 42%), so nothing jumps when a place is opened and the map does not resize; the details are compact enough (each section is its heading with the content beside it, and the hours note is one short line) that the hours and the services fit in it without scrolling, even on a 360 by 640 phone, and scroll only if the text is made larger. There is no photo on a phone, and it is not downloaded either (it is only rendered from 768px wide, using a media-query hook): the round back arrow sits in the top left corner of the screen, over the map, and stays put as the details scroll; the name, address, status, buttons and sections are a step smaller, so the name, address and Get directions are in view in that sheet; the map keeps the pin in the strip above. The zoom buttons and the attribution move with the sheet so they stay visible. The map credit starts closed on a phone, behind its info button, instead of a wide white pill over the map (MapLibre opens it at the start and only closes it after the map is moved, so it is closed once, when it is filled in; the credit is still one tap away). When the map moves to fit the results (for example after choosing a distance), the space kept clear on a phone is measured from the real controls and sheet instead of fixed shares of the screen, so the map uses all the visible strip and the move is as clear as on a desktop. The search placeholder is short ("Search name or place") so it is not cut off at 360px; the full wording is the field's label. |
| Search | One bar. Suggestions appear from two characters: places (towns, suburbs, provinces and postcodes found in the addresses), then branches and ATMs by name. Typing does not change the results: the list and map update on Enter, the Search button or a chosen suggestion, and emptying the field resets them. Choosing a place searches for it; choosing a branch opens it. Near me is an icon at the right end of the bar. The page also asks for the location by itself as it opens, so nobody has to find the button first; the browser shows its own permission prompt, and the answer is never stored or sent. If it is refused, the list stays by name and a note says how to carry on. Near me still turns the location off and on. What it does (sorts by distance, and the location stays on the device) is its tooltip and its description for screen readers, not text on the page; while it is finding the location the icon itself turns, in the brand colour, instead of being swapped for a spinner (with a hidden message for screen readers; the turn slows down for people who ask for less motion), and a message appears under the bar only when it fails, saying what to do next. The message has two parts: a short one ("Location is turned off for this site.", with Try again) and what to do next ("Turn it on in your browser settings, or search by name, suburb or postcode."). Beside the map both show, as plain text. On a phone, where the message floats over the map, it is a slim white pill with only the short part and Try again, one line high, so it does not take the map's room; the second part is kept for screen readers, so nothing is lost. Browsers show their location prompt only while the user has not decided; once a site is blocked, no code can open it again. So Try again (and the distance pills) do re-ask, which opens the prompt when the user only dismissed it; and when the browser reports the site as blocked (Permissions API) the message changes to what helps ("Location is blocked. Allow it in your browser.", with the lock icon beside the address in the longer text) and Try again goes, because it could not do anything. The page then watches the permission and finds the user by itself as soon as they allow it in the browser's site settings, with no button pressed. |
| Filters | Under the search bar: the Branches / ATMs / Both switch, with Both first and chosen to begin with, then one row of distance pills (5, 10, 25, 50, 100 km). The selected switch option uses the same blue as the Directions button (`$primary`), and so does the Closing soon chip. The page asks for the location as soon as it opens (see Search), and 25 km is chosen as soon as it is found; before that, or if it is refused, none of the pills shows as chosen, but they stay on: choosing one asks for the location (so it is also a way back after a refusal, or after Near me was turned off) and the distance applies as soon as the location arrives. A screen reader is told that choosing a distance asks for the location; there is no visible hint text. Pressing the chosen pill again goes to any distance, turning Near me off drops the limit, and searching sets the distance aside, because a search for somewhere else would otherwise find nothing. The results count reads, for example, "5 locations within 10 km, nearest first". A round Filters button beside the search opens a window of pills in titled groups, as in the reference: When (Open now, Open 24 hours), Services (the services found in the data, minus "Branch" and "ATM", which only repeat the kind), Province, and Sort by (Distance, which needs the location, or Name). The reference also had Open Saturday and Open Sunday; our data has one set of hours for every day, so those are left out rather than faked. The choices apply together when the user presses the button, which says how many places they leave ("Show 12 results") and is off when they leave none; Clear all resets them, and closing the window any other way changes nothing. A badge on the button counts the filters chosen in the window (the sort order is not one). Choosing a branch from the search suggestions clears every filter, so that branch is certain to be in the list. |
| Removed | The Open now and province controls on the page itself (they now live in the Filters window), the "Sample data" tag, and the visible "Branches and ATMs" heading and result count. The heading and the count stay in the page for screen reader users (the page heading, and a live update of how many results there are) but are not shown. The README says the data is a demo sample. |
| Map | MapLibre GL with OpenFreeMap tiles in its colourful "liberty" style, which is the closest free look to the maps people know (Google's own tiles are proprietary and need a billed API key). Branches are blue rounded squares with a pointed tail and the building icon, ATMs are white circles with a dark ring and the card icon, the chosen branch or ATM is a larger pin with a soft halo (and the chosen ATM is tinted), groups are numbered dark discs, and the user is the familiar blue dot with a halo. Zoom buttons are a white rounded group with a soft shadow. The base map is recoloured toward Google's palette (pale land, light blue water, green parks, yellow motorways, white streets, dark grey labels) and points of interest are hidden so our pins carry the focus; see `src/features/branches/map/basemap.ts`. Hovering a card in the list (or tabbing to it) draws that place on the map as the larger pin with a halo, on its own unclustered layer so it shows even inside a cluster. The map does not move, so it does not jump as the pointer crosses cards; the chosen place keeps its own pin. |
| Open status | Open, Closing soon (under 60 minutes) and Closed, each shown with an icon and a word, never color alone. |
| Layout | Below 768px: full-bleed map with a bottom sheet. From 768px: side panel (360px, 400px from 1200px) beside the map. |

Everything cut or deferred can be added later without reworking the data layer.
