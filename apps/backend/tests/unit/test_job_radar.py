"""Unit tests for deterministic Chinese/English job ranking."""

from app.schemas.job_radar import CandidateProfile, RadarJobPosting
from app.services.job_radar import analyze_job_batch


def _candidate() -> CandidateProfile:
    return CandidateProfile(
        text="""土木工程硕士，研究方向为隧道变形监测。
        负责铁路隧道监测数据分析，使用 Python 与 Excel 完成数据清洗和可视化。
        开发 FastAPI 大模型应用，完成 RAG 检索与 Docker 部署。""",
        target_domains=["工程建设", "AI/数据"],
        preferred_locations=["长沙", "广州"],
    )


def test_civil_role_ranks_above_unrelated_ai_role() -> None:
    jobs = [
        RadarJobPosting(
            job_id="civil-1",
            title="隧道监测工程师",
            company="湘江建设集团",
            location="长沙",
            description="硕士优先。负责铁路隧道工程测量、变形监测、监测数据分析与工程规范核验。",
        ),
        RadarJobPosting(
            job_id="ai-1",
            title="高级算法工程师",
            company="星河智能",
            location="北京",
            description="要求 5 年机器学习经验，熟练 TensorFlow、Kubernetes、模型微调和向量数据库。",
        ),
    ]

    response = analyze_job_batch(_candidate(), jobs)

    assert response.results[0].job_id == "civil-1"
    assert response.results[0].detected_domain == "工程建设"
    assert "监测分析" in response.results[0].matched_keywords
    assert response.results[0].score > response.results[1].score


def test_hard_requirements_are_explained_and_penalized() -> None:
    job = RadarJobPosting(
        job_id="hard-1",
        title="资深平台工程师",
        company="云岑科技",
        description="要求博士学历，8 年 Python、FastAPI、Docker 和 Kubernetes 平台开发经验。",
    )

    result = analyze_job_batch(_candidate(), [job]).results[0]

    assert len(result.hard_requirement_gaps) == 2
    assert result.dimensions.requirements == 20
    assert result.score < 75


def test_results_use_stable_descending_order() -> None:
    job = RadarJobPosting(
        job_id="general-1",
        title="项目助理",
        company="远山咨询",
        description="参与项目管理、Excel 数据整理和跨部门团队协作。",
    )

    response = analyze_job_batch(_candidate(), [job])

    assert response.summary.total_jobs == 1
    assert response.summary.top_score == response.results[0].score
    assert response.mode == "offline-explainable"
