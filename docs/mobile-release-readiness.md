# Mobile release readiness

## Automated checks

Run `npm run test:mobile-readiness`, `npm run build`, and `npm run native:sync`. Build Android debug output with `npm run android:build:debug`.

The web release gate also runs a touch-enabled Playwright matrix at 320×568,
390×844, 844×390, 768×1024, 820×1180, and 1024×768. It covers the RewardMe
public, authentication, recovery, invitation, and legal routes in both portrait
and landscape layouts. The broader screenshot audit currently covers 240
route/viewport combinations with `npm run test:responsive`.

## External release inputs

- Apple Developer and Google Play Console accounts
- Final bundle identifiers and signing identities
- Store names, descriptions, screenshots, privacy labels, support URLs, and age ratings
- Universal Links and Android App Links for every approved tenant domain
- A decision whether the shared application selects a program or each tenant receives a separately branded binary

## Acceptance

- Authentication, password recovery, invitations, tenant selection, QR scanning, deep links, offline messaging, and push-notification consent are tested on physical devices.
- No secret or service-role key is included in either binary.
- Production Supabase browser credentials are supplied through the approved build environment.
- Store builds are generated from the same commit that passed web and hosted acceptance.
