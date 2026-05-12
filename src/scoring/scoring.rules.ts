export const positiveStackTags = [
  'TypeScript',
  'JavaScript',
  'Node.js',
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
  'automation'
] as const;

export const lowerPriorityPrimaryTags = [
  'Python',
  'Java',
  '.NET',
  'C#',
  'PHP',
  'Ruby',
  'mobile-only',
  'WordPress-only'
] as const;

export function sourceTrustAdjustment(sourceTrustScore: number): number {
  if (sourceTrustScore >= 90) return 5;
  if (sourceTrustScore >= 70) return 2;
  if (sourceTrustScore >= 50) return 0;
  if (sourceTrustScore >= 30) return -8;
  return -20;
}
