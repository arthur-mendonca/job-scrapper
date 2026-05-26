import type { NormalizedJob } from '../normalizer/normalizer.types.js';
import { compactWhitespace, normalizeKey } from '../utils/text.js';

export interface ProfileFilterResult {
  accepted: boolean;
  reason: string;
}

const rejectedTitlePatterns: Array<[string, RegExp]> = [
  ['marketing role', /\b(marketing|growth|brand|seo|sem|demand gen|performance marketer)\b/],
  ['content or writing role', /\b(content|copywriter|copy writer|writer|editor|blogger|journalist|enablement)\b/],
  ['admin or office role', /\b(office assistant|administrative assistant|admin assistant|virtual assistant|executive assistant|receptionist)\b/],
  ['sales or customer support role', /\b(sales|account executive|customer support|customer success|support specialist|business development|bdr|sdr)\b/],
  ['people or recruiting role', /\b(recruiter|talent acquisition|human resources|people partner|hr)\b/],
  ['design or product role', /\b(product manager|project manager|program manager|designer|ux|ui designer)\b/],
  ['finance or legal role', /\b(finance|accountant|accounting|bookkeeper|legal|paralegal)\b/],
  ['data entry or operations role', /\b(data entry|operations assistant|operations manager|ops manager)\b/]
];

const targetRolePatterns = [
  /\bbackend\b/,
  /\bback end\b/,
  /\bfull stack\b/,
  /\bfullstack\b/,
  /\bsoftware engineer\b/,
  /\bsoftware developer\b/,
  /\bweb developer\b/,
  /\bnode(?:\.js)? developer\b/,
  /\bnode(?:\.js)? engineer\b/,
  /\btypescript developer\b/,
  /\btypescript engineer\b/,
  /\bnest(?:\.js|js)? developer\b/,
  /\bnest(?:\.js|js)? engineer\b/,
  /\breact developer\b/,
  /\breact engineer\b/,
  /\bnext(?:\.js|js)? developer\b/,
  /\bnext(?:\.js|js)? engineer\b/,
  /\bai automation engineer\b/,
  /\bautomation engineer\b/
];

const mobilePrimaryPatterns = [
  /\bios\b/,
  /\bandroid\b/,
  /\bmobile\b/,
  /\breact native\b/,
  /\bflutter\b/,
  /\bswift\b/,
  /\bkotlin\b/
];

const nonTargetPrimaryStackPatterns = [
  /\bpython developer\b/,
  /\bpython engineer\b/,
  /\bjava developer\b/,
  /\bjava engineer\b/,
  /\.net developer\b/,
  /\.net engineer\b/,
  /\bc# developer\b/,
  /\bc# engineer\b/,
  /\bphp developer\b/,
  /\bphp engineer\b/,
  /\bruby developer\b/,
  /\bruby engineer\b/,
  /\bwordpress developer\b/
];

const targetStackTags = new Set([
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Node',
  'NestJS',
  'React',
  'Next.js',
  'AWS',
  'Docker',
  'CI/CD',
  'PostgreSQL',
  'REST APIs',
  'AI',
  'LLM',
  'automation',
  'Svelte',
]);

export function filterJobForTargetProfile(job: NormalizedJob): ProfileFilterResult {
  const title = normalizeKey(job.title);
  const text = normalizeKey(
    compactWhitespace(`${job.title} ${job.normalizedTitle} ${job.location ?? ''} ${job.description ?? ''} ${job.requirements ?? ''}`)
  );
  const targetStackCount = job.stackTags.filter((tag) => targetStackTags.has(tag)).length;
  const hasCoreStack = job.stackTags.some((tag) => [
    'TypeScript', 
    'Node.js', 
    'Node', 
    'NestJS', 
    'React', 
    'Next.js', 
    'Svelte',
  ].includes(tag));

  for (const [reason, pattern] of rejectedTitlePatterns) {
    if (pattern.test(title)) {
      return { accepted: false, reason };
    }
  }

  if (job.remoteType === 'onsite' || job.remoteType === 'hybrid') {
    return { accepted: false, reason: `${job.remoteType} role` };
  }

  if (
    job.geoRestrictions.includes('us-only') ||
    /\bus only\b|\busa only\b|only candidates in the u\.?s\.?|must be based in the u\.?s\.?/.test(text)
  ) {
    return { accepted: false, reason: 'us-only role' };
  }

  if (/\b(7|8|9|10|11|12)\+?\s*years\b/.test(text)) {
    return { accepted: false, reason: '7-plus-years-required' };
  }

  if (job.seniority && ['Staff', 'Principal'].includes(job.seniority)) {
    return { accepted: false, reason: 'staff-principal-only' };
  }

  if (mobilePrimaryPatterns.some((pattern) => pattern.test(title))) {
    return { accepted: false, reason: 'mobile-primary-role' };
  }

  if (nonTargetPrimaryStackPatterns.some((pattern) => pattern.test(title)) && !hasCoreStack) {
    return { accepted: false, reason: 'non-target-primary-stack' };
  }

  if (targetRolePatterns.some((pattern) => pattern.test(title))) {
    return { accepted: true, reason: 'target role title' };
  }

  if (hasCoreStack && /\b(engineer|developer|dev|programmer)\b/.test(title)) {
    return { accepted: true, reason: 'technical title with target stack' };
  }

  if (targetStackCount >= 2 && /\b(engineer|developer|dev|programmer|architect)\b/.test(text)) {
    return { accepted: true, reason: 'target stack in job text' };
  }

  return { accepted: false, reason: 'outside target software profile' };
}
