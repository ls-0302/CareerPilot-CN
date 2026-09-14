"""Request and response contracts for the explainable job radar."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class CandidateProfile(BaseModel):
    """Candidate evidence used by the deterministic ranking engine."""

    text: str = Field(min_length=20, max_length=80_000)
    target_domains: list[str] = Field(default_factory=list, max_length=8)
    preferred_locations: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("target_domains", "preferred_locations")
    @classmethod
    def _strip_list_values(cls, values: list[str]) -> list[str]:
        return [value.strip() for value in values if value.strip()]


class RadarJobPosting(BaseModel):
    """A normalized job posting from CSV, paste, or a future source adapter."""

    job_id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=300)
    company: str = Field(default="未填写公司", max_length=300)
    description: str = Field(min_length=20, max_length=80_000)
    location: str = Field(default="", max_length=300)
    source_url: str | None = Field(default=None, max_length=2_000)


class RadarAnalyzeRequest(BaseModel):
    """Batch ranking request; intentionally works without an LLM key."""

    candidate: CandidateProfile
    jobs: list[RadarJobPosting] = Field(min_length=1, max_length=100)


class RadarDimensionScores(BaseModel):
    """Auditable components of one overall match score."""

    skills: int = Field(ge=0, le=100)
    domain: int = Field(ge=0, le=100)
    evidence: int = Field(ge=0, le=100)
    requirements: int = Field(ge=0, le=100)
    location: int = Field(ge=0, le=100)


class RadarJobResult(BaseModel):
    """Ranked job with evidence and gaps rather than an opaque percentage."""

    job_id: str
    title: str
    company: str
    location: str
    source_url: str | None = None
    detected_domain: Literal["工程建设", "AI/数据", "综合"]
    score: int = Field(ge=0, le=100)
    recommendation: Literal["优先申请", "补强后申请", "谨慎申请"]
    dimensions: RadarDimensionScores
    matched_keywords: list[str]
    missing_keywords: list[str]
    evidence_lines: list[str]
    hard_requirement_gaps: list[str]
    explanation: str


class RadarSummary(BaseModel):
    """Portfolio-friendly aggregate counts derived from the batch."""

    total_jobs: int
    strong_matches: int
    needs_work: int
    cautious_matches: int
    top_score: int


class RadarAnalyzeResponse(BaseModel):
    """Sorted batch response."""

    mode: Literal["offline-explainable"] = "offline-explainable"
    summary: RadarSummary
    results: list[RadarJobResult]
