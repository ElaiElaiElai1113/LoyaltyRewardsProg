# Figma Homepage Rebuild Design

## Goal

Replace the current root early-access page with a faithful, responsive React recreation of the supplied Figma landing-page export. The exported full-page image and the five supplied photographic assets are the visual and copy source of truth.

## Scope

- Make the recreated landing page the main `/` homepage.
- Keep `/landing-page` rendering the same landing page for compatibility.
- Preserve the rest of the application, authentication, portals, and public routes.
- Reproduce the export's wording exactly, including capitalization, punctuation, prices, percentages, FAQ copy, and footer copy.
- Reproduce the visible desktop composition, colors, typography hierarchy, spacing, borders, cards, image crops, pills, and decorative details as closely as practical in the existing React/Tailwind codebase.
- Provide a responsive mobile layout that stacks the same content without changing its wording or order.

## Implementation Approach

Build the page as semantic React sections rather than displaying the full-page screenshot as a single image. Use the five supplied photos as local assets and recreate the surrounding interface with HTML and CSS. This keeps text selectable, links usable, accessibility intact, and layouts responsive while retaining close visual fidelity.

## Page Structure

1. Header with the Medellin Rewards wordmark, anchor navigation, and `Join now` CTA.
2. Hero with the rewards headline, exact explanatory copy, primary and secondary CTAs, benefit pills, circular coffee-shop image, and `+50% REWARD` badge.
3. `Every purchase becomes a Reward` section with three value propositions and the five-image category collage.
4. Membership section with Free Membership and Regular Membership pricing cards.
5. `How it works` section with Join, Spend & earn, and Redeem steps.
6. Full-width vacation reward banner with its CTA.
7. Frequently asked questions section matching the expanded state shown in the reference.
8. Suggest-a-business strip.
9. Footer with brand description, policy/contact links, copyright, and location copy.

## Navigation and Interactions

- `How it works` and `FAQ` scroll to their matching homepage sections.
- `Businesses` uses the existing public business route.
- Membership and join CTAs use the existing member join route.
- The FAQ behaves as an accessible accordion, with the second item initially expanded to match the export.
- `Suggest a business` links to the closest existing business/contact destination rather than introducing a new form or backend workflow.

## Assets and Styling

- Copy the five supplied images into the app's source assets with stable, URL-safe filenames.
- Use the existing icon library for small supporting symbols and chevrons.
- Define landing-specific visual tokens for the warm off-white backgrounds, charcoal text, muted body text, mustard-gold accent, borders, shadows, and radii.
- Match the export's editorial serif headline treatment and compact sans-serif supporting type using locally available or web-safe font fallbacks; do not add a network dependency solely for typography.
- Keep landing styles scoped so authenticated application screens are unaffected.

## Responsive Behavior

- Preserve the desktop layout at the reference's effective wide-screen proportion.
- Collapse multi-column sections into a single readable sequence on narrow screens.
- Keep imagery prominent while preventing overflow and unintended cropping.
- Convert the desktop navigation into a compact mobile header without inventing new page content.
- Keep interactive targets at least 44 pixels high and provide visible keyboard focus states.

## Verification

- Add or update focused public-page tests for the root route, exact key copy, section anchors, CTA destinations, and FAQ behavior.
- Run the targeted tests and production build.
- Capture the implemented homepage at desktop and mobile viewport sizes.
- Compare the desktop capture against the supplied Figma export section by section and adjust spacing, sizing, image crops, and typography where the difference is visible.

## Non-Goals

- No backend, database, authentication, membership-pricing logic, or checkout changes.
- No copy editing or content invention.
- No redesign of authenticated screens or other public pages.
- No deployment or publishing unless requested separately.
