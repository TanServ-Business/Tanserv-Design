# Evidence verification

- Current-run date: 7 September 2026.
- 33 distinct Admin destinations are represented.
- 103 numbered paired states, with 206 original JPEG files.
- Each original has a corresponding note, encoded dimensions, byte count and SHA-256 hash in `evidence.json`.
- All 206 image URLs returned successfully from the local report server; returned byte counts matched the files.
- Gallery Module Configuration filtering returned the expected 17 paired states.
- Two side-by-side comparison boards were browser-rendered, saved and visually inspected: `comparison-configuration.jpg` and `comparison-reallocation.jpg`. These present the original screenshots proportionally; they are not replacement evidence.
- SMTP Edit distributed screenshot was visually rechecked: Client ID, Client Secret and Tenant ID contain `[redacted for audit]`. These were unsaved input changes, not portal updates.
- No app files were edited for this audit. Existing working-tree changes were preserved.

## Severity interpretation

- P1: substantial design-parity gap, missing interaction/state, significant readability issue or separately identified reference-side risk. This is a prototype audit priority, not a claim of a production outage.
- P2: visible layout, hierarchy, wording, control-treatment or consistency mismatch.
- P3: minor polish.
- Close: the inspected state is comparatively aligned, not a complete module or accessibility pass.

See `audit-report.md` for the full limitations and untested states. Original capture DOM and deep-state URL metadata were not retained; the manifest clearly labels the URLs as landing-route mappings rather than exact capture URLs.
