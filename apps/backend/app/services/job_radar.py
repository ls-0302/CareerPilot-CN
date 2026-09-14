"""Deterministic, bilingual job-ranking engine for CareerPilot-CN.

The radar deliberately complements LLM tailoring: it ranks a batch locally,
exposes every scoring dimension, and never invents candidate experience.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.job_radar import (
    CandidateProfile,
    RadarAnalyzeResponse,
    RadarDimensionScores,
    RadarJobPosting,
    RadarJobResult,
    RadarSummary,
)


@dataclass(frozen=True)
class SkillTerm:
    """Canonical skill and the phrases that count as evidence for it."""

    name: str
    aliases: tuple[str, ...]


DOMAIN_TERMS: dict[str, tuple[SkillTerm, ...]] = {
    "工程建设": (
        SkillTerm("土木工程", ("土木工程", "civil engineering")),
        SkillTerm("工程管理", ("工程管理", "construction management")),
        SkillTerm("岩土工程", ("岩土", "geotechnical")),
        SkillTerm("隧道工程", ("隧道", "tunnel")),
        SkillTerm("桥梁工程", ("桥梁", "bridge engineering")),
        SkillTerm("铁路工程", ("铁路", "railway")),
        SkillTerm("施工管理", ("施工管理", "施工组织", "site management")),
        SkillTerm("工程测量", ("工程测量", "测绘", "surveying")),
        SkillTerm("监测分析", ("变形监测", "监测分析", "监测数据")),
        SkillTerm("BIM", ("bim", "building information modeling")),
        SkillTerm("CAD", ("cad", "autocad")),
        SkillTerm("有限元", ("有限元", "finite element", "ansys", "midas")),
        SkillTerm("质量安全", ("质量管理", "安全管理", "质量安全")),
        SkillTerm("招投标", ("招投标", "投标文件", "tender")),
        SkillTerm("工程造价", ("工程造价", "计量计价", "cost control")),
        SkillTerm("工程规范", ("工程规范", "行业规范", "技术标准")),
    ),
    "AI/数据": (
        SkillTerm("Python", ("python",)),
        SkillTerm("FastAPI", ("fastapi",)),
        SkillTerm("大语言模型", ("大语言模型", "大模型", "llm", "large language model")),
        SkillTerm("RAG", ("rag", "检索增强生成")),
        SkillTerm("智能体", ("智能体", "agentic", "ai agent", "agent 开发")),
        SkillTerm("机器学习", ("机器学习", "machine learning")),
        SkillTerm("深度学习", ("深度学习", "deep learning")),
        SkillTerm("PyTorch", ("pytorch",)),
        SkillTerm("TensorFlow", ("tensorflow",)),
        SkillTerm("向量数据库", ("向量数据库", "vector database", "milvus", "faiss")),
        SkillTerm("模型微调", ("模型微调", "fine-tuning", "finetuning", "lora")),
        SkillTerm("提示词工程", ("提示词", "prompt engineering")),
        SkillTerm("NLP", ("nlp", "自然语言处理")),
        SkillTerm("数据分析", ("数据分析", "data analysis")),
        SkillTerm("SQL", ("sql", "postgresql", "mysql")),
        SkillTerm("Docker", ("docker",)),
        SkillTerm("Kubernetes", ("kubernetes", "k8s")),
        SkillTerm("Git", ("git", "github")),
        SkillTerm("REST API", ("rest api", "restful", "接口开发")),
    ),
}

COMMON_TERMS: tuple[SkillTerm, ...] = (
    SkillTerm("Excel", ("excel",)),
    SkillTerm("PowerPoint", ("powerpoint", "ppt")),
    SkillTerm("英语", ("英语", "english", "cet-4", "cet-6")),
    SkillTerm("项目管理", ("项目管理", "project management")),
    SkillTerm("团队协作", ("团队协作", "跨部门", "teamwork")),
)

ACTION_OR_RESULT_RE = re.compile(
    r"(?:负责|完成|设计|开发|实现|搭建|构建|分析|优化|验证|参与|主导|提升|降低|"
    r"built|developed|designed|implemented|analysed|analyzed|improved|reduced|led|\d)",
    re.IGNORECASE,
)
YEARS_RE = re.compile(r"(?P<years>\d{1,2})\s*(?:\+\s*)?(?:年|years?)", re.IGNORECASE)


def _contains_alias(text: str, alias: str) -> bool:
    """Match Chinese phrases by containment and Latin terms at token boundaries."""
    folded_text = text.casefold()
    folded_alias = alias.casefold()
    if re.search(r"[\u4e00-\u9fff]", folded_alias):
        return folded_alias in folded_text
    pattern = rf"(?<![a-z0-9]){re.escape(folded_alias)}(?![a-z0-9])"
    return re.search(pattern, folded_text) is not None


def _matched_terms(text: str, terms: tuple[SkillTerm, ...]) -> list[str]:
    return [term.name for term in terms if any(_contains_alias(text, alias) for alias in term.aliases)]


def _all_terms() -> tuple[SkillTerm, ...]:
    return tuple(term for terms in DOMAIN_TERMS.values() for term in terms) + COMMON_TERMS


def _detect_job_domain(text: str) -> tuple[str, dict[str, list[str]]]:
    matches = {domain: _matched_terms(text, terms) for domain, terms in DOMAIN_TERMS.items()}
    counts = {domain: len(values) for domain, values in matches.items()}
    best_domain = max(counts, key=counts.get)
    if counts[best_domain] == 0 or len(set(counts.values())) == 1:
        return "综合", matches
    return best_domain, matches


def _find_evidence_lines(candidate_text: str, matched_keywords: list[str]) -> list[str]:
    lines = [line.strip(" •-\t") for line in candidate_text.splitlines() if line.strip()]
    evidence: list[str] = []
    canonical = {term.name: term for term in _all_terms()}
    for line in lines:
        if not ACTION_OR_RESULT_RE.search(line):
            continue
        for keyword in matched_keywords:
            term = canonical[keyword]
            if any(_contains_alias(line, alias) for alias in term.aliases):
                evidence.append(line)
                break
    return list(dict.fromkeys(evidence))[:5]


def _required_education_gap(candidate_text: str, job_text: str) -> list[str]:
    gaps: list[str] = []
    if any(marker in job_text for marker in ("博士", "phd", "doctorate")) and not any(
        marker in candidate_text for marker in ("博士", "phd", "doctorate")
    ):
        gaps.append("岗位要求博士学历，候选材料中未识别到博士经历")
    elif any(marker in job_text for marker in ("硕士", "研究生", "master")) and not any(
        marker in candidate_text for marker in ("硕士", "研究生", "master", "博士", "phd")
    ):
        gaps.append("岗位要求硕士学历，候选材料中未识别到对应学历")
    elif any(marker in job_text for marker in ("本科", "学士", "bachelor")) and not any(
        marker in candidate_text
        for marker in ("本科", "学士", "bachelor", "硕士", "研究生", "博士", "master", "phd")
    ):
        gaps.append("岗位要求本科学历，候选材料中未识别到对应学历")
    return gaps


def _required_experience_gap(candidate_text: str, job_text: str) -> list[str]:
    job_years = [int(match.group("years")) for match in YEARS_RE.finditer(job_text)]
    if not job_years:
        return []
    candidate_years = [int(match.group("years")) for match in YEARS_RE.finditer(candidate_text)]
    required = max(job_years)
    demonstrated = max(candidate_years, default=0)
    if demonstrated >= required:
        return []
    return [f"岗位要求至少 {required} 年经验，候选材料中明确识别到 {demonstrated} 年"]


def _location_score(preferences: list[str], location: str) -> int:
    if not preferences or not location.strip():
        return 100
    return 100 if any(pref.casefold() in location.casefold() for pref in preferences) else 35


def _score_one(candidate: CandidateProfile, job: RadarJobPosting) -> RadarJobResult:
    candidate_text = candidate.text.casefold()
    job_text = f"{job.title}\n{job.description}".casefold()
    detected_domain, domain_job_matches = _detect_job_domain(job_text)
    job_keywords = _matched_terms(job_text, _all_terms())
    candidate_keywords = set(_matched_terms(candidate_text, _all_terms()))
    matched = [keyword for keyword in job_keywords if keyword in candidate_keywords]
    missing = [keyword for keyword in job_keywords if keyword not in candidate_keywords]

    skills_score = round(100 * len(matched) / len(job_keywords)) if job_keywords else 40
    if detected_domain == "综合":
        domain_score = 60 if candidate.target_domains else 50
    else:
        domain_terms = domain_job_matches[detected_domain]
        candidate_domain_terms = set(_matched_terms(candidate_text, DOMAIN_TERMS[detected_domain]))
        observed = len(candidate_domain_terms.intersection(domain_terms))
        coverage = observed / max(1, len(domain_terms))
        target_bonus = 0
        if any(detected_domain.casefold() in domain.casefold() for domain in candidate.target_domains):
            target_bonus = 15
        domain_score = min(100, round(35 + coverage * 50 + target_bonus))

    evidence_lines = _find_evidence_lines(candidate.text, matched)
    evidence_score = min(100, round(35 + 65 * len(evidence_lines) / max(1, len(matched)))) if matched else 0
    hard_gaps = _required_education_gap(candidate_text, job_text)
    hard_gaps.extend(_required_experience_gap(candidate_text, job_text))
    requirements_score = max(20, 100 - 40 * len(hard_gaps))
    location_score = _location_score(candidate.preferred_locations, job.location)

    dimensions = RadarDimensionScores(
        skills=skills_score,
        domain=domain_score,
        evidence=evidence_score,
        requirements=requirements_score,
        location=location_score,
    )
    weighted = (
        skills_score * 0.45
        + domain_score * 0.20
        + evidence_score * 0.15
        + requirements_score * 0.15
        + location_score * 0.05
    )
    score = max(0, min(100, round(weighted - min(24, len(hard_gaps) * 8))))
    recommendation = "优先申请" if score >= 75 else "补强后申请" if score >= 60 else "谨慎申请"
    explanation = (
        f"识别到 {len(job_keywords)} 个岗位能力词，已有材料覆盖 {len(matched)} 个；"
        f"{len(evidence_lines)} 条履历语句提供了行动或结果证据。"
    )
    if hard_gaps:
        explanation += f" 同时发现 {len(hard_gaps)} 项硬性条件风险。"

    return RadarJobResult(
        job_id=job.job_id,
        title=job.title,
        company=job.company,
        location=job.location,
        source_url=job.source_url,
        detected_domain=detected_domain,
        score=score,
        recommendation=recommendation,
        dimensions=dimensions,
        matched_keywords=matched[:12],
        missing_keywords=missing[:12],
        evidence_lines=evidence_lines,
        hard_requirement_gaps=hard_gaps,
        explanation=explanation,
    )


def analyze_job_batch(candidate: CandidateProfile, jobs: list[RadarJobPosting]) -> RadarAnalyzeResponse:
    """Rank jobs by transparent local scoring and return stable aggregate counts."""
    results = sorted(
        (_score_one(candidate, job) for job in jobs),
        key=lambda result: (-result.score, result.company, result.title),
    )
    summary = RadarSummary(
        total_jobs=len(results),
        strong_matches=sum(result.recommendation == "优先申请" for result in results),
        needs_work=sum(result.recommendation == "补强后申请" for result in results),
        cautious_matches=sum(result.recommendation == "谨慎申请" for result in results),
        top_score=results[0].score,
    )
    return RadarAnalyzeResponse(summary=summary, results=results)
