export const scoreBands = [
  {tone:'poor',label:'Poor',range:'0–49'},
  {tone:'attention',label:'Needs improvement',range:'50–89'},
  {tone:'good',label:'Good',range:'90–100'},
];
export const isScore = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
export function scoreBand(value) { return isScore(value) ? scoreBands[value >= 90 ? 2 : value >= 50 ? 1 : 0] : {tone:'neutral',label:'Not measured'}; }
export function severityTone(value) { return ['high','critical','serious'].includes(value) ? 'poor' : ['medium','moderate'].includes(value) ? 'attention' : ['low','minor'].includes(value) ? 'info' : 'neutral'; }
export function severityGroup(value) { return ['high','critical','serious'].includes(value) ? 'high' : ['medium','moderate'].includes(value) ? 'medium' : ['low','minor'].includes(value) ? 'low' : 'unknown'; }
export function categoryFindings(data) {
  if (!data) return [];
  return ['issues','violations','broken','pageErrors','errors'].flatMap((source) => Array.isArray(data[source]) ? data[source].filter(Boolean).map((item,index) => ({...(typeof item === 'string' ? {message:item} : item), source, key:`${source}-${item.id || index}`})) : []);
}
export function metricBand(key, raw) {
  const text = typeof raw === 'string' ? raw.replace(/[\u00a0\u202f]/g,' ').trim() : String(raw ?? '');
  if (!/^\d+(\.\d+)?(\s*(ms|s))?$/.test(text)) return {tone:'neutral',label:'Lab measurement'};
  let value = Number.parseFloat(text);
  const unit = text.match(/\s*(ms|s)$/)?.[1];
  if (unit === 'ms' && ['fcp', 'lcp', 'speedIndex'].includes(key)) value /= 1000;
  if (unit === 's' && key === 'tbt') value *= 1000;
  const limits = {
    fcp: [1.8, 3],
    lcp: [2.5, 4],
    cls: [0.1, 0.25],
    tbt: [200, 600],
    speedIndex: [3.4, 5.8],
  }[key] ?? null;
  if (!limits) return {tone:'neutral',label:'Lab measurement'};
  return {tone:value <= limits[0] ? 'good' : value <= limits[1] ? 'attention' : 'poor',label:value <= limits[0] ? 'Good' : value <= limits[1] ? 'Needs improvement' : 'Poor'};
}
export function displayValue(value) { return value === undefined || value === null || value === '' ? '—' : typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value); }
