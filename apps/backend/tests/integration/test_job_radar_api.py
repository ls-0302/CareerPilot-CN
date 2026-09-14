"""Integration tests for the offline job-radar API."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_radar_endpoint_sorts_and_summarizes_without_llm() -> None:
    payload = {
        "candidate": {
            "text": "土木工程硕士。使用 Python 分析隧道变形监测数据，完成工程测量报告。",
            "target_domains": ["工程建设"],
            "preferred_locations": ["长沙"],
        },
        "jobs": [
            {
                "job_id": "j1",
                "title": "工程测量岗",
                "company": "湖湘路桥",
                "location": "长沙",
                "description": "负责桥梁工程测量、变形监测和监测数据分析，本科及以上学历。",
            },
            {
                "job_id": "j2",
                "title": "算法研究员",
                "company": "北辰实验室",
                "location": "北京",
                "description": "博士学历，要求 5 年 TensorFlow、Kubernetes 与模型微调经验。",
            },
        ],
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/radar/analyze", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "offline-explainable"
    assert body["summary"]["total_jobs"] == 2
    assert body["results"][0]["job_id"] == "j1"


@pytest.mark.asyncio
async def test_radar_endpoint_rejects_empty_batch() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/radar/analyze",
            json={"candidate": {"text": "足够长度的候选人履历文本用于接口边界测试。"}, "jobs": []},
        )

    assert response.status_code == 422
