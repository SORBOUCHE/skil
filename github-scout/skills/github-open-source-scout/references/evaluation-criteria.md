# Open-Source Evaluation Framework

When recommending open-source software, evaluate candidate repositories across these four pillars:

### 1. Project Vitality & Maintenance
- **Last Commit (`pushed_at`)**: Active within the last 1–3 months is ideal. Repos inactive for >12 months may be abandonware.
- **Release Cadence**: Regular tagged releases with semantic versioning.
- **Issue Resolution Ratio**: Check open vs. closed issues. High closed issue count signals responsive maintainers.

### 2. Architectural Cleanliness
- **Modularity**: Separation of concerns, clear folder structures (`src`, `tests`, `docs`).
- **Dependencies**: Lean dependency tree. Avoid packages bringing in bloated or deprecated dependencies.
- **TypeScript / Type Hints**: Strong typing prevents runtime errors and enhances maintainability.

### 3. Community Adoption & Trust
- **Stars & Watchers**: Indicative of popularity, though vitality is more important than raw star count.
- **Forks**: Active network of contributors submitting improvements.
- **Documentation**: Comprehensive README, getting started guides, and API documentation.

### 4. License Suitability
- **Permissive (Green light for most uses)**: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC.
- **Weak Copyleft (File-level copyleft)**: MPL-2.0, LGPL.
- **Strong Copyleft (Requires caution)**: GPL-3.0, AGPL-3.0 (forces derivatives to be open-source under same terms).
