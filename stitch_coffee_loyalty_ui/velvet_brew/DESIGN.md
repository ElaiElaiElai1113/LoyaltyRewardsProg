# Design System: The Artisanal Digital Experience

## 1. Overview & Creative North Star
**Creative North Star: "The Sensory Atrium"**

This design system rejects the cold, rigid efficiency of traditional SaaS platforms in favor of a tactile, editorial experience that mirrors the atmosphere of a premium boutique café. Our goal is to evoke the aroma of a slow-pour brew and the comfort of a velvet armchair.

We break the "template" look through **Intentional Asymmetry** and **Organic Weighting**. By utilizing generous whitespace and overlapping elements (e.g., a product image breaking the container edge), we create a layout that feels curated rather than generated. This system moves away from "alignment-to-grid" as the primary goal, focusing instead on "visual rhythm" and "tonal depth."

---

### 2. Colors & Surface Architecture

The palette is rooted in organic, earth-derived tones. We avoid pure blacks and clinical grays, opting instead for a spectrum of creams, coffees, and caramels.

#### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts or tonal transitions. To separate a hero section from a features list, shift from `surface` to `surface-container-low`.

#### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like fine weighted paper stacked on a wooden table.
*   **Base:** `surface` (#fdf9f3) – The foundation.
*   **Secondary Sections:** `surface-container-low` (#f7f3ed) – For subtle differentiation of content blocks.
*   **Elevated Elements:** `surface-container-lowest` (#ffffff) – Used for high-priority cards to create a "lifted" feel against the cream background.
*   **Interactive Containers:** `surface-container-highest` (#e6e2dc) – For recessed elements like search bars or inactive states.

#### The "Glass & Gradient" Rule
To add "soul" to the digital interface:
*   **Signature Gradients:** Use a subtle linear gradient from `primary` (#33210d) to `primary_container` (#4b3621) for hero backgrounds or high-impact CTAs. This adds a "roast" depth that flat hex codes cannot achieve.
*   **Glassmorphism:** For floating navigation bars or loyalty progress overlays, use `surface` at 80% opacity with a `20px` backdrop-blur. This ensures the warm background tones bleed through, softening the interface.

---

### 3. Typography: The Editorial Voice

Our typography is an interplay between the academic elegance of a serif and the modern clarity of a sans-serif.

*   **Display & Headlines (`notoSerif`):** These are our "statement" pieces. Used for titles and hero sections, the serif conveys craftsmanship and heritage. High-contrast sizing (e.g., `display-lg` at 3.5rem) should be used to create focal points.
*   **Body & Titles (`plusJakartaSans`):** This is our "utility" voice. It is clean, highly legible, and modern. It provides the necessary balance to the serif, ensuring the platform feels like a contemporary digital tool, not a dusty book.
*   **Labels:** Always use `plusJakartaSans` with increased letter-spacing (0.05rem) for a premium, tagged-product feel.

---

### 4. Elevation & Depth

We convey hierarchy through **Tonal Layering** rather than structural scaffolding.

*   **The Layering Principle:** Avoid shadows where color shifts can do the work. A `surface-container-low` card sitting on a `surface` background creates a soft, natural lift.
*   **Ambient Shadows:** When a floating effect is required (e.g., a "Redeem" modal), use an ultra-diffused shadow:
    *   *Y: 20px, Blur: 40px, Color: rgba(75, 54, 33, 0.06)* (A coffee-tinted shadow).
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-contrast modes), use `outline_variant` (#d2c4ba) at **15% opacity**. Never use 100% opaque borders.
*   **Roundedness:** Adhere strictly to the **xl (3rem)** or **lg (2rem)** radius for cards and buttons. This "squircle" aesthetic removes the aggression of sharp corners, reinforcing the "warm and inviting" mandate.

---

### 5. Components

#### Buttons
*   **Primary:** `primary_container` (#4b3621) background with `on_primary` text. **Radius: full**. Padding: `1rem 2.5rem`.
*   **Secondary:** `secondary_container` (#fdbe49) background. This provides the "Caramel" highlight for loyalty-related actions (e.g., "Earn Points").
*   **Tertiary:** No background. `primary` text with a subtle `tertiary_fixed` (#dce7c5) underline or soft background glow on hover.

#### Cards & Lists
*   **The Divider Rule:** Forbid the use of horizontal divider lines. Separate list items using `1.5rem` of vertical whitespace or by alternating `surface` and `surface-container-low` backgrounds.
*   **Loyalty Progress:** Use `secondary` (#7d5700) for progress bars to mimic the golden hue of honey or amber.

#### Input Fields
*   **Style:** Minimalist. No bottom line or box. Use a `surface-container-highest` fill with a `md` (1.5rem) corner radius. Label text should sit above the field in `label-md` using `on_surface_variant`.

#### Additional Component: The "Ritual" Chip
*   A specialized selection chip for coffee preferences (e.g., "Oat Milk," "Extra Shot"). Use `tertiary_fixed` (#dce7c5) for the background to provide a muted green "organic" accent that signals health and freshness.

---

### 6. Do's and Don'ts

#### Do
*   **Do** use asymmetrical margins (e.g., a wider left margin than right) for editorial layouts.
*   **Do** use high-quality, warm-toned photography with soft-focus backgrounds.
*   **Do** prioritize the "Caramel" (`secondary`) and "Amber" highlights for moments of reward and delight.
*   **Do** leave "uncomfortable" amounts of whitespace to let the typography breathe.

#### Don't
*   **Don't** use 1px borders or dividers. They shatter the premium boutique feel.
*   **Don't** use standard blue or "SaaS Purple" for links; use `primary` or `tertiary`.
*   **Don't** use sharp corners (0-8px radius). Every element must feel soft to the touch.
*   **Don't** use pure black (#000000) for text; always use `on_surface` (#1c1c18) to maintain the warmth of the palette.