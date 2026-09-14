# CareerPilot-CN modifications

This repository is a substantial derivative of Resume-Matcher, prepared on 2026-09-14.

## Added

- Offline, deterministic Job Radar API at `POST /api/v1/radar/analyze`.
- Explainable five-dimension scoring: skills, domain, evidence, hard requirements, and location.
- Chinese engineering/construction and AI/data skill taxonomies.
- Batch CSV import and a responsive Chinese workbench at `/radar`.
- Unit, integration, frontend API, and CSV parser tests.
- Bilingual project documentation, architecture notes, sample inputs, and a concise resume entry.

## Changed

- Rebranded application metadata and package identifiers as CareerPilot-CN.
- Updated the landing-page repository link to this distribution.
- Scoped container publishing to version tags/manual runs and the fork owner's registry namespace.
- Added Job Radar to the dashboard and FastAPI router registry.
- Added shared design tokens and responsive overflow safeguards.
- Corrected the backend requirements file to include `pdfminer.six`, which the upstream `pyproject.toml` already declared.
- Allowed loopback sockets in the test network guard so ASGI integration tests work on Windows while external networking remains blocked.

No upstream copyright or license notice has been removed.
