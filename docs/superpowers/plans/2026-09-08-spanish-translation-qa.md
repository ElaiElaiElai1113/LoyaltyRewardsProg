# Spanish Translation QA

**Goal:** Keep the existing English/Spanish picker and make the business application, calculator, and shared controls consistently follow it.

**Approach:** Use the existing `useLanguage` provider and complete sentence templates with named values. Preserve names, submitted business data, currency, and agreement meaning. Keep changes local for review.

- [x] Run the four existing public language browser suites (38 passed).
- [x] Audit literal translation calls and JSX text; identify the untranslated application and calculator.
- [x] Add failing browser checks in `tests/e2e/spanish-business-completion.spec.ts` and agreement coverage in `src/lib/spanish-translation-completeness.test.ts`.
- [x] Route `business-application-page.tsx`, `cost-calculator-page.tsx`, and `cost-calculator.tsx` through `useLanguage`. Translate agreement content through the same dictionary.
- [x] Translate shared dialog, invitation, switcher, picker, and footer labels.
- [x] Keep translated reward option labels separate from the API's canonical values.
- [x] Verify Spanish errors, confirmation, reloads, language switching, dynamic amounts, and 320px layout with intercepted application requests.
- [x] Run unit tests, typecheck, lint, production build, and the public language browser suites. Report the verified scope and any remaining limits.
