'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import FileUp from 'lucide-react/dist/esm/icons/file-up';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import SearchCheck from 'lucide-react/dist/esm/icons/search-check';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  analyzeRadarJobs,
  type RadarJob,
  type RadarResponse,
  type RadarResult,
} from '@/lib/api/job-radar';
import { parseRadarCsv } from '@/lib/utils/job-radar-csv';

const SAMPLE_PROFILE = `土木工程硕士，研究方向为铁路隧道与建筑结构变形监测。
负责监测数据分析与工程规范核验，使用 Python、Excel 完成数据清洗、风险计算和可视化。
开发 FastAPI 大模型应用，完成 RAG 检索、提示词设计、REST API 与 Docker 部署。
参与项目管理和跨部门协作，能够撰写技术报告与投标材料。`;

const SAMPLE_JOBS: RadarJob[] = [
  {
    job_id: 'demo-1',
    title: '工程技术管理岗',
    company: '湖湘建设发展集团',
    location: '湖南·长沙',
    description:
      '硕士优先。负责施工管理、工程测量、质量安全与项目管理，参与投标文件编制和工程规范核验。',
  },
  {
    job_id: 'demo-2',
    title: 'AI 应用工程师',
    company: '岳麓数智研究院',
    location: '湖南·长沙',
    description:
      '负责大语言模型应用研发，要求 Python、FastAPI、RAG、向量数据库、Docker 和 REST API 经验。',
  },
  {
    job_id: 'demo-3',
    title: '隧道监测工程师',
    company: '南岭交通设计院',
    location: '广东·广州',
    description: '负责铁路隧道工程测量、变形监测、监测数据分析和有限元复核，本科及以上学历。',
  },
  {
    job_id: 'demo-4',
    title: '高级算法研究员',
    company: '北辰计算实验室',
    location: '北京',
    description:
      '博士学历，要求 5 年机器学习经验，熟练 TensorFlow、Kubernetes、模型微调和向量数据库。',
  },
];

const DIMENSION_LABELS: Array<[keyof RadarResult['dimensions'], string]> = [
  ['skills', '技能覆盖'],
  ['domain', '领域契合'],
  ['evidence', '履历证据'],
  ['requirements', '硬性要求'],
  ['location', '地点偏好'],
];

function scoreTone(score: number): string {
  if (score >= 75) return 'text-[var(--color-radar-success)]';
  if (score >= 60) return 'text-[var(--color-radar-warning)]';
  return 'text-[var(--color-radar-danger)]';
}

function ResultCard({ result, rank }: { result: RadarResult; rank: number }) {
  return (
    <article className="border border-[var(--color-radar-rule)] bg-[var(--color-radar-paper)] p-4 md:p-6">
      <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_6rem]">
        <div className="min-w-0">
          <p className="font-mono text-xs text-[var(--color-radar-muted)]">排名 {rank}</p>
          <h2 className="mt-1 min-w-0 [overflow-wrap:anywhere] font-[var(--font-radar-display)] text-xl font-bold text-[var(--color-radar-ink)] md:text-2xl">
            {result.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-radar-ink-soft)]">
            {result.company} · {result.location || '地点未填写'} · {result.detected_domain}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className={`font-mono text-4xl font-bold tabular-nums ${scoreTone(result.score)}`}>
            {result.score}
          </p>
          <p className="text-sm font-semibold text-[var(--color-radar-ink-soft)]">
            {result.recommendation}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {DIMENSION_LABELS.map(([key, label]) => (
          <div key={key} className="border-t border-[var(--color-radar-rule)] pt-2">
            <p className="text-xs text-[var(--color-radar-muted)]">{label}</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-[var(--color-radar-ink)]">
              {result.dimensions[key]}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-5 max-w-[70ch] text-sm leading-6 text-[var(--color-radar-ink-soft)]">
        {result.explanation}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-radar-ink)]">已匹配能力</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.matched_keywords.length ? (
              result.matched_keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="border border-[var(--color-radar-rule)] bg-[var(--color-radar-panel)] px-2 py-1 text-xs text-[var(--color-radar-ink)]"
                >
                  {keyword}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--color-radar-muted)]">未识别到直接匹配词</span>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-radar-ink)]">优先补强</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-radar-ink-soft)]">
            {result.missing_keywords.slice(0, 6).join('、') || '没有明显技能缺口'}
          </p>
          {result.hard_requirement_gaps.map((gap) => (
            <p
              key={gap}
              className="mt-2 border-l-2 border-[var(--color-radar-danger)] pl-3 text-sm text-[var(--color-radar-danger)]"
            >
              {gap}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

export function JobRadarWorkbench() {
  const [profile, setProfile] = useState(SAMPLE_PROFILE);
  const [jobs, setJobs] = useState<RadarJob[]>(SAMPLE_JOBS);
  const [locations, setLocations] = useState('长沙, 广州');
  const [result, setResult] = useState<RadarResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sourceLabel = useMemo(() => `${jobs.length} 个岗位已载入`, [jobs.length]);

  const runAnalysis = async () => {
    if (profile.trim().length < 20 || jobs.length === 0) {
      setError('候选人材料至少需要 20 个字符，并且必须载入一个岗位。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setResult(
        await analyzeRadarJobs(
          {
            text: profile,
            target_domains: ['工程建设', 'AI/数据'],
            preferred_locations: locations
              .split(/[,，]/)
              .map((value) => value.trim())
              .filter(Boolean),
          },
          jobs
        )
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '岗位评分失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  const loadCsv = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseRadarCsv(await file.text());
      setJobs(parsed);
      setResult(null);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'CSV 解析失败。');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const resetDemo = () => {
    setProfile(SAMPLE_PROFILE);
    setLocations('长沙, 广州');
    setJobs(SAMPLE_JOBS);
    setResult(null);
    setError('');
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--color-radar-paper)] px-4 py-5 font-[var(--font-radar-body)] text-[var(--color-radar-ink)] md:px-8 md:py-8">
      <div className="mx-auto max-w-[96rem]">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-sm text-[var(--color-radar-ink-soft)] outline-none hover:text-[var(--color-radar-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-radar-focus)] active:text-[var(--color-radar-ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> 返回仪表盘
        </Link>

        <header className="mt-5 grid min-w-0 gap-5 border-y border-[var(--color-radar-rule)] py-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:items-end">
          <div className="min-w-0">
            <h1 className="min-w-0 [overflow-wrap:anywhere] font-[var(--font-radar-display)] text-[var(--text-radar-display)] font-semibold leading-[1.05] tracking-[-0.035em]">
              先排岗位，再改简历。
            </h1>
          </div>
          <p className="max-w-[58ch] text-base leading-7 text-[var(--color-radar-ink-soft)]">
            离线分析技能覆盖、领域契合与硬性条件。每一分都有依据，不上传招聘账号，也不替你点击最终投递。
          </p>
        </header>

        <section className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]">
          <aside className="h-fit border border-[var(--color-radar-rule)] bg-[var(--color-radar-panel)] p-4 md:p-6 xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-[var(--font-radar-display)] text-xl font-bold">评分输入</h2>
              <span className="font-mono text-xs tabular-nums text-[var(--color-radar-muted)]">
                {sourceLabel}
              </span>
            </div>

            <label htmlFor="radar-profile" className="mt-6 block text-sm font-semibold">
              候选人履历文本
            </label>
            <Textarea
              id="radar-profile"
              value={profile}
              onChange={(event) => setProfile(event.target.value)}
              className="mt-2 min-h-52 resize-y border-[var(--color-radar-rule-strong)] bg-[var(--color-radar-paper)] text-base leading-6 focus-visible:ring-[var(--color-radar-focus)]"
              aria-describedby="profile-help"
            />
            <p id="profile-help" className="mt-1 min-h-5 text-xs text-[var(--color-radar-muted)]">
              可粘贴脱敏简历或项目经历；评分只依据这里出现的事实。
            </p>

            <label htmlFor="radar-locations" className="mt-4 block text-sm font-semibold">
              偏好地点
            </label>
            <input
              id="radar-locations"
              value={locations}
              onChange={(event) => setLocations(event.target.value)}
              className="mt-2 h-11 w-full border border-[var(--color-radar-rule-strong)] bg-[var(--color-radar-paper)] px-3 text-base outline-2 outline-transparent hover:bg-[var(--color-radar-panel)] focus-visible:outline-[var(--color-radar-focus)] active:bg-[var(--color-radar-paper)] disabled:cursor-not-allowed disabled:bg-[var(--color-radar-panel-strong)] disabled:opacity-55"
              placeholder="长沙, 广州"
            />
            <p className="mt-1 min-h-5 text-xs text-[var(--color-radar-muted)]">
              使用逗号分隔多个城市。
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => void loadCsv(event.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <FileUp className="h-4 w-4" /> 导入岗位 CSV
              </Button>
              <Button type="button" variant="outline" onClick={resetDemo}>
                <RotateCcw className="h-4 w-4" /> 恢复演示数据
              </Button>
            </div>
            <Button
              type="button"
              className="mt-3 w-full whitespace-nowrap bg-[var(--color-radar-accent)] text-[var(--color-radar-accent-ink)] focus-visible:ring-[var(--color-radar-focus)]"
              onClick={() => void runAnalysis()}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchCheck className="h-4 w-4" />
              )}
              {loading ? '正在评分…' : '开始岗位评分'}
            </Button>
            <p className="mt-3 text-xs leading-5 text-[var(--color-radar-muted)]">
              CSV 列：title、company、description；可选 location、source_url、job_id。
            </p>
            {error && (
              <p
                role="alert"
                className="mt-4 border border-[var(--color-radar-danger)] bg-[var(--color-radar-paper)] p-3 text-sm text-[var(--color-radar-danger)]"
              >
                {error}
              </p>
            )}
          </aside>

          <div aria-live="polite" className="min-w-0">
            {result ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['岗位总数', result.summary.total_jobs],
                    ['优先申请', result.summary.strong_matches],
                    ['建议补强', result.summary.needs_work],
                    ['最高分', result.summary.top_score],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border-t border-[var(--color-radar-rule-strong)] pt-3"
                    >
                      <p className="text-sm text-[var(--color-radar-muted)]">{label}</p>
                      <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 space-y-4">
                  {result.results.map((item, index) => (
                    <ResultCard key={item.job_id} result={item} rank={index + 1} />
                  ))}
                </div>
              </>
            ) : (
              <div className="grid min-h-[24rem] place-items-center border border-[var(--color-radar-rule)] bg-[var(--color-radar-paper)] p-8 text-left">
                <div className="max-w-md">
                  <SearchCheck className="h-9 w-9 text-[var(--color-radar-accent)]" />
                  <h2 className="mt-5 font-[var(--font-radar-display)] text-2xl font-bold">
                    结果区等待评分
                  </h2>
                  <p className="mt-3 leading-7 text-[var(--color-radar-ink-soft)]">
                    当前已放入工程建设、AI
                    应用、隧道监测与高级算法四类演示岗位。运行一次即可看到排序依据和技能缺口。
                  </p>
                  <Button className="mt-5 whitespace-nowrap" onClick={() => void runAnalysis()}>
                    运行演示评分
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
