import type { RadarJob } from '@/lib/api/job-radar';

const HEADER_ALIASES: Record<keyof RadarJob, string[]> = {
  job_id: ['job_id', 'id', '编号'],
  title: ['title', 'role', '岗位', '职位'],
  company: ['company', '公司', '单位'],
  description: ['description', 'jd', '岗位描述', '职位描述'],
  location: ['location', '城市', '地点', '工作地点'],
  source_url: ['source_url', 'url', '链接', '来源链接'],
};

function parseRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseRadarCsv(input: string): RadarJob[] {
  const rows = parseRows(input.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('CSV 至少需要表头和一条岗位记录。');
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const indexes = Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([key, aliases]) => [
      key,
      headers.findIndex((header) => aliases.includes(header)),
    ])
  ) as Record<keyof RadarJob, number>;
  for (const key of ['title', 'company', 'description'] as const) {
    if (indexes[key] < 0) throw new Error(`CSV 缺少必需列：${key}。`);
  }
  return rows.slice(1).map((values, index) => ({
    job_id: indexes.job_id >= 0 ? values[indexes.job_id] || `csv-${index + 1}` : `csv-${index + 1}`,
    title: values[indexes.title]?.trim() || `未命名岗位 ${index + 1}`,
    company: values[indexes.company]?.trim() || '未填写公司',
    description: values[indexes.description]?.trim() || '',
    location: indexes.location >= 0 ? values[indexes.location]?.trim() || '' : '',
    source_url: indexes.source_url >= 0 ? values[indexes.source_url]?.trim() || null : null,
  }));
}
