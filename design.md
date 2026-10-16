# Design

Design tokens and rules for this app. The visual language is based on a brand extraction of capitecbank.co.za (via dembrandt), mapped onto Bootstrap 5.3 so components inherit it through CSS variables and Sass overrides instead of one-off CSS.

Notes on provenance:
- **Extracted** values come straight from the site. **Decided** values are my choices where the extraction was empty or noisy (marked below).
- This is a candidate project, not a Capitec product. Do not ship Capitec's logo, favicon or imagery. Use a neutral wordmark.

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
- Focus: 2px `#2f70ef` border plus a 2px black outline offset; never remove the outline.
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
| Kept | Map with list, search, filters, nearest-first sorting, open-now status, branch detail, location permission with a fallback, loading, empty and error states. |
| Map | MapLibre GL with OpenFreeMap tiles in its colourful "liberty" style, which is the closest free look to the maps people know (Google's own tiles are proprietary and need a billed API key). Branches are teardrop pins with a white dot, ATMs are white pins with a dark ring, the chosen branch is a larger pin with a black outline, groups are numbered dark discs, and the user is the familiar blue dot with a halo. Zoom buttons are a white rounded group with a soft shadow. |
| Open status | Open, Closing soon (under 60 minutes) and Closed, each shown with an icon and a word, never color alone. |
| Layout | Below 768px: full-bleed map with a bottom sheet. From 768px: side panel (360px, 400px from 1200px) beside the map. |

Everything cut or deferred can be added later without reworking the data layer.
