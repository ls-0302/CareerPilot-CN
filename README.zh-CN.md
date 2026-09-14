# CareerPilot-CN

**面向工程建设与 AI 岗位的可解释求职决策和简历优化平台。**

[English](README.md) · [系统架构](ARCHITECTURE.md) · [完整部署说明](SETUP.zh-CN.md) · [改造记录](MODIFICATIONS.md)

CareerPilot-CN 将简历和一批岗位描述转化为可核验的求职优先级。新增的「岗位雷达」无需 API Key 即可本地运行；可选的大模型工作流用于定制简历、生成求职信和面试材料，并通过看板跟踪申请进度。

## 项目思路

不少求职助手把匹配结果藏在一次大模型调用里，或者直接尝试不稳定的网页自动投递。CareerPilot-CN 把流程拆成两层：

1. **确定性决策层**：批量排序岗位、展示每项得分、识别学历和经验门槛，并且不虚构候选人经历。
2. **可选生成层**：候选人选定岗位后再调用配置好的大模型，所有材料必须人工核对，最终投递保留人工确认。

## 本项目新增内容

- 同时覆盖工程建设和 AI / 数据岗位的中文岗位雷达。
- 支持中英文表头的 CSV 岗位批量导入。
- 技能覆盖、领域契合、履历证据、硬性要求、地点偏好五维评分。
- 输出匹配能力、待补技能、硬性条件预警、排序解释和申请建议。
- 自带脱敏演示数据；核心评分不依赖账号、招聘网站或 API Key。
- 增加类型安全的前端 API 客户端、后端单元 / 集成测试和前端解析 / API 测试。
- 为密集岗位比较设计的 Cobalt 工作台，兼顾桌面端与移动端。

原项目已有能力继续保留：简历解析、岗位管理、LLM 简历定制、求职信、面试准备、PDF 导出和申请看板。

## 快速启动

### Docker 一键运行

```bash
docker compose up --build
```

访问 <http://localhost:3000/radar>。内置演示无需配置大模型。

### 本地开发

后端（推荐 Python 3.13）：

```powershell
cd apps/backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

前端（Node.js 22+）：

```powershell
cd apps/frontend
npm ci
npm run dev
```

访问 <http://localhost:3000/radar>。大模型提供商和完整部署选项参见 [`SETUP.zh-CN.md`](SETUP.zh-CN.md)。

## 岗位 CSV

可直接导入 [`sample_data/jobs_zh.csv`](sample_data/jobs_zh.csv)，或使用以下格式：

```csv
job_id,title,company,location,description,source_url
1,工程技术管理岗,示例单位,长沙,负责施工管理和工程测量,https://example.com/job/1
```

必填列为 `title`、`company`、`description`；`job_id`、`location`、`source_url` 可选。浏览器解析器也支持「岗位名称、公司、岗位描述、地点、来源链接」等中文表头。

## 验证命令

```powershell
cd apps/frontend
npm test
npm run lint
npm run typecheck
npm run build

cd ../backend
python -m pytest tests/unit/test_job_radar.py tests/integration/test_job_radar_api.py
```

## 安全边界

CareerPilot-CN 不保存招聘网站密码、不绕过验证码，也不点击最终投递按钮。它负责分析、准备材料和记录进度；经历真实性核对与最终投递始终由用户完成。

## 开源来源与许可证

CareerPilot-CN 基于 [srbhr/Resume-Matcher](https://github.com/srbhr/Resume-Matcher) 进行二次开发，继续采用 Apache-2.0 许可证。原许可证保留在 [`LICENSE`](LICENSE)，来源与实质改造记录见 [`NOTICE.md`](NOTICE.md) 和 [`MODIFICATIONS.md`](MODIFICATIONS.md)。
