"""Explainable offline job-radar endpoint."""

from fastapi import APIRouter

from app.schemas.job_radar import RadarAnalyzeRequest, RadarAnalyzeResponse
from app.services.job_radar import analyze_job_batch

router = APIRouter(prefix="/radar", tags=["Job Radar"])


@router.post("/analyze", response_model=RadarAnalyzeResponse)
async def analyze_jobs(request: RadarAnalyzeRequest) -> RadarAnalyzeResponse:
    """Rank up to 100 jobs without network access or an LLM API key."""
    return analyze_job_batch(request.candidate, request.jobs)
