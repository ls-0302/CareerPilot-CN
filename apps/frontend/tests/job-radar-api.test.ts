import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeRadarJobs } from '@/lib/api/job-radar';

describe('analyzeRadarJobs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('posts the candidate and jobs to the radar endpoint', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          mode: 'offline-explainable',
          summary: {
            total_jobs: 1,
            strong_matches: 1,
            needs_work: 0,
            cautious_matches: 0,
            top_score: 82,
          },
          results: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    await analyzeRadarJobs(
      {
        text: '土木工程硕士，负责隧道监测数据分析与 Python 开发。',
        target_domains: [],
        preferred_locations: [],
      },
      [
        {
          job_id: '1',
          title: '监测岗',
          company: '湖湘建设',
          description: '负责隧道工程测量与变形监测。',
          location: '长沙',
        },
      ]
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/radar/analyze',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
