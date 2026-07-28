# Tenant Launch Gates

## Repository-Controlled Gates

1. Generate a migration package with `npm run ops:tenant:package -- <slug>`.
2. Populate `tenant-config.json` and place the frozen export in `source-export.json`.
3. Run `npm run validate:tenant-import -- <export>`.
4. Run `npm run ops:tenant:dry-run -- <export> <dry-run-directory>`.
5. Import only into a draft program through the tenant import workbench.
6. Export the destination and run `npm run ops:tenant:reconcile -- <source> <destination> <report>`.
7. Run unit, build, hosted-safe, tenant-security, load, and responsive checks.
8. Run `npm run ops:email:preview -- <tenant-config>`.
9. Run `npm run ops:domain:check -- <hostname>` after DNS and deployment exist.
10. Complete `SIGN-OFF.md`; keep every generated report with the migration record.

## External Gates

- Source exports, branding assets, legal content, business rules, and approved totals come from each site owner.
- Domain ownership, DNS changes, and email sender authentication require the corresponding account owner.
- Monitoring forwarding requires `VITE_MONITORING_ENDPOINT`; console events work without it.
- A real restore rehearsal requires an isolated Supabase project and `RESTORE_DATABASE_URL`.
- Hosted migrations require an explicit approval naming the project and migration filenames.

## Required Evidence

- Import validation output and dry-run manifest
- Source/destination SHA-256 hashes
- Zero-difference reconciliation report
- Playwright reports for every supported role
- Domain, TLS, metadata, manifest, health, and email-link results
- Backup validation and restore rehearsal report
- Named launch approver, rollback owner, cutover time, and decision window
