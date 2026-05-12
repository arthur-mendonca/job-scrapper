import type { NormalizedJob } from '../normalizer/normalizer.types.js';
import { compactWhitespace } from '../utils/text.js';
import { sourceTrustAdjustment } from './scoring.rules.js';

export interface JobScore {
  score: number;
  technicalScore: number;
  sourceTrustAdjustment: number;
  matchReasons: string[];
  riskFlags: string[];
  recommendedAction: string;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function scoreJob(job: NormalizedJob): JobScore {
  const matchReasons: string[] = [];
  const riskFlags: string[] = [];
  const text = compactWhitespace(
    `${job.title} ${job.normalizedTitle} ${job.companyName} ${job.location ?? ''} ${job.description ?? ''} ${
      job.requirements ?? ''
    } ${job.stackTags.join(' ')}`
  ).toLowerCase();

  let technicalScore = 35;

  const add = (points: number, reason: string): void => {
    technicalScore += points;
    matchReasons.push(reason);
  };

  const subtract = (points: number, flag: string): void => {
    technicalScore -= points;
    riskFlags.push(flag);
  };

  if (job.stackTags.includes('TypeScript')) add(10, 'TypeScript');
  if (job.stackTags.includes('Node.js')) add(12, 'Node.js');
  if (job.stackTags.includes('NestJS')) add(8, 'NestJS');
  if (job.stackTags.includes('React')) add(6, 'React');
  if (job.stackTags.includes('Next.js')) add(5, 'Next.js');
  if (job.stackTags.includes('AWS')) add(5, 'AWS');
  if (job.stackTags.includes('Docker')) add(4, 'Docker');
  if (job.stackTags.includes('CI/CD')) add(3, 'CI/CD');
  if (job.stackTags.includes('PostgreSQL')) add(4, 'PostgreSQL');
  if (job.stackTags.includes('REST APIs')) add(3, 'REST APIs');
  if (job.stackTags.includes('AI') || job.stackTags.includes('LLM')) add(6, 'AI/LLM');
  if (job.stackTags.includes('automation')) add(5, 'automation');

  if (hasAny(text, [/full[\s-]?stack/, /backend[\s-]?leaning/, /back[\s-]?end/])) {
    add(8, 'backend-leaning full stack or backend role');
  }

  if (job.remoteType === 'remote') add(8, 'remote role');
  if (job.remoteType === 'hybrid') subtract(12, 'hybrid');
  if (job.remoteType === 'onsite') subtract(25, 'onsite');

  if (hasAny(text, [/\blatam\b/, /latin america/, /\bamericas\b/, /worldwide/, /anywhere/])) {
    add(8, 'LATAM/Americas/worldwide friendly');
  }

  if (hasAny(text, [/\bus only\b/, /\busa only\b/, /only candidates in the u\.?s\.?/, /must be based in the u\.?s\.?/])) {
    subtract(20, 'us-only');
  }

  if (job.currency === 'USD' || /\busd\b|\$/.test(text)) add(5, 'USD compensation signal');
  if (job.salaryMin !== null || job.salaryMax !== null) add(4, 'clear compensation');
  else subtract(3, 'unclear-compensation');

  if (hasAny(text, [/contract/, /contractor/, /b2b/])) add(3, 'contract-compatible');
  if (job.companyName && job.companyName.toLowerCase() !== 'unknown company') add(2, 'clear company');

  if (hasAny(text, [/\b7\+?\s*years\b/, /\b8\+?\s*years\b/, /\b9\+?\s*years\b/, /\b10\+?\s*years\b/])) {
    subtract(15, '7-plus-years-required');
  }

  if (job.seniority && ['Staff', 'Principal'].includes(job.seniority)) {
    subtract(20, 'staff-principal-only');
  }

  if (hasAny(text, [/unpaid test/, /take[-\s]?home.*(week|unpaid|long)/])) {
    subtract(20, 'unpaid-or-heavy-test-project');
  }

  if (hasAny(text, [/data entry/, /task job/, /onboarding fee/, /pay.*training/])) {
    subtract(30, 'suspicious-source');
  }

  if (hasAny(text, [/python-first/, /java-first/, /\.net-first/, /php-first/])) {
    subtract(15, 'non-target-primary-stack');
  }

  if (job.description && job.description.length < 120) {
    subtract(8, 'vague-description');
  }

  const trustAdjustment = sourceTrustAdjustment(job.sourceTrustScore);
  if (trustAdjustment > 0) {
    matchReasons.push(`source trust adjustment +${trustAdjustment}`);
  } else if (trustAdjustment < 0) {
    riskFlags.push(job.sourceTrustScore < 30 ? 'suspicious-source' : 'indirect-source');
  }

  if (job.sourceTrustScore < 50) riskFlags.push('low-trust-source');
  if (job.sourceAccessMode === 'closed_public') riskFlags.push('closed-application-flow');

  const score = clampScore(technicalScore + trustAdjustment);
  const technical = clampScore(technicalScore);

  return {
    score,
    technicalScore: technical,
    sourceTrustAdjustment: trustAdjustment,
    matchReasons,
    riskFlags: [...new Set(riskFlags)],
    recommendedAction: recommendedAction(score, riskFlags)
  };
}

function recommendedAction(score: number, riskFlags: string[]): string {
  if (riskFlags.includes('us-only') || riskFlags.includes('staff-principal-only') || riskFlags.includes('onsite')) {
    return 'Ignore due to location or seniority mismatch.';
  }
  if (riskFlags.includes('suspicious-source') || riskFlags.includes('low-trust-source')) {
    return 'Save for manual review.';
  }
  if (riskFlags.includes('unclear-compensation')) {
    return 'Ignore unless compensation is confirmed.';
  }
  if (score >= 85) {
    return 'Apply and contact recruiter if available.';
  }
  if (score >= 70) {
    return 'Apply through company website.';
  }
  return 'Save for manual review.';
}
