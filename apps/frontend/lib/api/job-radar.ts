import { apiPost } from './client';

export interface RadarCandidate {
  text: string;
  target_domains: string[];
  preferred_locations: string[];
}

export interface RadarJob {
  job_id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  source_url?: string | null;
}

export interface RadarDimensions {
  skills: number;
  domain: number;
  evidence: number;
  requirements: number;
  location: number;
}

export interface RadarResult extends Omit<RadarJob, 'description'> {
  detected_domain: '工程建设' | 'AI/数据' | '综合';
  score: number;
  recommendation: '优先申请' | '补强后申请' | '谨慎申请';
  dimensions: RadarDimensions;
  matched_keywords: string[];
  missing_keywords: string[];
  evidence_lines: string[];
  hard_requirement_gaps: string[];
  explanation: string;
}

export interface RadarResponse {
  mode: 'offline-explainable';
  summary: {
    total_jobs: number;
    strong_matches: number;
    needs_work: number;
    cautious_matches: number;
    top_score: number;
  };
  results: RadarResult[];
}

export async function analyzeRadarJobs(
  candidate: RadarCandidate,
  jobs: RadarJob[]
): Promise<RadarResponse> {
  const response = await apiPost('/radar/analyze', { candidate, jobs }, 30_000);
  if (!response.ok) {
    throw new Error(`岗位评分失败，服务返回 ${response.status}。请检查输入后重试。`);
  }
  return response.json() as Promise<RadarResponse>;
}
