import { describe, expect, it } from 'vitest';
import { parseRadarCsv } from '@/lib/utils/job-radar-csv';

describe('parseRadarCsv', () => {
  it('parses Chinese headers and quoted commas', () => {
    const jobs = parseRadarCsv(
      '编号,岗位,公司,岗位描述,地点\n1,工程技术岗,湖湘建设,"负责施工管理, 工程测量与安全管理",长沙'
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      job_id: '1',
      title: '工程技术岗',
      company: '湖湘建设',
      location: '长沙',
    });
    expect(jobs[0].description).toContain('工程测量');
  });

  it('rejects a CSV without required columns', () => {
    expect(() => parseRadarCsv('title,company\n工程师,湖湘建设')).toThrow('description');
  });
});
