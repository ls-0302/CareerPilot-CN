# Architecture

```text
CSV / pasted resume
        |
        v
Next.js 16 workbench (/radar)
        |
        | typed JSON
        v
FastAPI (/api/v1/radar/analyze)
        |
        +--> deterministic taxonomy extraction
        +--> five-dimension weighted scoring
        +--> hard-requirement checks
        +--> ranked explanations and skill gaps

Existing workflow: resume parsing -> LLM tailoring -> document export -> application board
```

The Job Radar path is deliberately offline-first: it requires no API key, stores no recruitment-site password, and performs no final submission. The existing LLM workflow remains optional and supports configured cloud providers or a local Ollama endpoint.

## Job Radar scoring

Each job receives a 0–100 score assembled from five bounded dimensions:

| Dimension | Weight | Purpose |
|---|---:|---|
| Skills | 35% | Direct overlap between candidate evidence and the job description |
| Domain | 20% | Engineering/construction or AI/data domain fit |
| Evidence | 20% | Strength of project and delivery evidence in the profile |
| Requirements | 20% | Education and experience constraints |
| Location | 5% | Candidate location preference |

The API returns the components, matched keywords, missing keywords, hard gaps, and a natural-language explanation. This makes the rank auditable and keeps an LLM from silently inventing candidate experience.
