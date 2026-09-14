# CareerPilot-CN

**Explainable job ranking and AI-assisted resume workflow for Chinese engineering and AI job seekers.**

[简体中文](README.zh-CN.md) · [Architecture](ARCHITECTURE.md) · [Setup details](SETUP.md) · [Modifications](MODIFICATIONS.md)

CareerPilot-CN helps a candidate turn a resume and a batch of job descriptions into an auditable application plan. Its new Job Radar runs locally without an API key; the inherited AI workflow can optionally tailor resumes, draft cover letters, prepare interviews, and track applications.

## Why this fork exists

Many job assistants hide ranking behind a model call or jump directly to unsafe browser automation. CareerPilot-CN separates the workflow into two layers:

1. **Deterministic decision layer:** rank jobs, expose every score component, flag education/experience gaps, and never invent experience.
2. **Optional generative layer:** use a configured LLM only after the candidate chooses a job, with human review before any application action.

## Added in CareerPilot-CN

- Chinese Job Radar for both engineering/construction and AI/data roles.
- Batch CSV import with Chinese or English column names.
- Five explainable dimensions: skills, domain, evidence, requirements, and location.
- Matched skills, missing skills, hard-requirement warnings, and ranked recommendations.
- Offline demo data and API path requiring no account or API key.
- Typed frontend client plus backend unit/integration and frontend parser/API tests.
- Cobalt workbench UI designed for dense comparison on desktop and mobile.

The upstream workflow remains available: resume parsing, job storage, LLM-based tailoring, cover-letter generation, interview preparation, PDF export, and an application board.

## Quick start

### Docker

```bash
docker compose up --build
```

Open <http://localhost:3000/radar>. The bundled demo works without an API key.

### Development

Backend (Python 3.13 recommended):

```bash
cd apps/backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

Frontend (Node.js 22+):

```bash
cd apps/frontend
npm ci
npm run dev
```

Open <http://localhost:3000/radar>. For provider configuration and the full upstream setup guide, see [`SETUP.md`](SETUP.md).

## CSV format

Use [`sample_data/jobs_zh.csv`](sample_data/jobs_zh.csv), or provide:

```csv
job_id,title,company,location,description,source_url
1,工程技术管理岗,示例单位,长沙,负责施工管理和工程测量,https://example.com/job/1
```

Required columns are `title`, `company`, and `description`. `job_id`, `location`, and `source_url` are optional. Chinese aliases are accepted by the browser parser.

## API example

```bash
curl -X POST http://localhost:8000/api/v1/radar/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "candidate": {
      "text": "Civil engineering master with Python, monitoring and FastAPI experience",
      "target_domains": ["工程建设", "AI/数据"],
      "preferred_locations": ["长沙"]
    },
    "jobs": [{
      "job_id": "demo-1",
      "title": "工程技术管理岗",
      "company": "示例单位",
      "location": "长沙",
      "description": "负责施工管理、工程测量和数据分析"
    }]
  }'
```

## Verification

```bash
cd apps/frontend
npm test
npm run lint
npm run typecheck
npm run build

cd ../backend
python -m pytest tests/unit/test_job_radar.py tests/integration/test_job_radar_api.py
```

## Safety boundary

CareerPilot-CN does not ask for recruitment-site passwords, bypass captchas, or click a final submission button. It prepares and tracks applications while keeping the candidate responsible for factual review and submission.

## Attribution and license

CareerPilot-CN is a modified distribution of [srbhr/Resume-Matcher](https://github.com/srbhr/Resume-Matcher), licensed under Apache-2.0. The original license is retained in [`LICENSE`](LICENSE); attribution and material changes are recorded in [`NOTICE.md`](NOTICE.md) and [`MODIFICATIONS.md`](MODIFICATIONS.md).
