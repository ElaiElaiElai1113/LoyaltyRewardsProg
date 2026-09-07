# Spanish translation QA — 8 September 2026

The English/Spanish picker works in local browser checks. Missing Spanish content has been completed in the RewardMe/Wondertown public application, calculator, homepage plan descriptions, signup prices, and information-request pages. Shared dialog, notification, program invitation, footer, and tenant loading/error labels follow the selected language.

Business application checks cover both models, full agreement text, translated options and placeholders, required-field messages, server-error and success states, reload persistence, navigation, and switching back to English. Requests are intercepted locally; no real applications were submitted. Translated labels submit the API's canonical values, including the minimum reward rate and the high-value category option. Business names, contact details, plan names, and currencies retain their identity.

The calculator now fits Spanish text at 320px. Tests check text overflow within individual elements as well as page overflow. Final mobile screenshots were visually reviewed.

Validation:

- 371 unit tests passed across 67 files, including customer/admin/business dictionary checks, all literal `t()` calls, every business agreement section, and named-value preservation.
- 43 language browser tests passed across the six relevant suites. The final application-handler type correction and both canonical option values were then rechecked with all 3 application/calculator tests passing.
- English-to-Spanish rendered-copy comparisons passed across 14 public routes each for RewardMe and Wondertown. A separate 36-page audit also checked Loyality public pages; remaining unchanged text consisted of brand/plan names, example contact data, identifiers, and a valid points abbreviation.
- Production build/typecheck, full lint, and final lint of the corrected handler/tests passed. Build emits the existing PWA `inlineDynamicImports` deprecation notice.
- New browser tests are included in `test:e2e:ci`.

Scope: local browser runs used disconnected backend data. Live authenticated customer, business, and admin workflows were not exercised. Their static translation checks passed. Business-provided catalog descriptions and other user-entered content are not automatically translated. No deployment or cloud data change was made during QA.

Existing content limitation: both business agreements contain a jurisdiction placeholder. Its meaning was preserved in translation; no jurisdiction was invented.

Local visual evidence: `artifacts/spanish-audit/application-es-mobile.png`, `artifacts/spanish-audit/calculator-es-mobile.png`. The rendered audit and production-build log are in the same directory.
