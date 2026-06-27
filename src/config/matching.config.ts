export const MATCH_WEIGHTS = {
  skills: 0.5,
  experience: 0.2,
  education: 0.15,
  languages: 0.1,
  certifications: 0.05,
} as const;

export type MatchWeightKey = keyof typeof MATCH_WEIGHTS;

export const RECOMMENDED_JOBS_LIMIT = 20;
export const RECOMMENDED_CANDIDATES_LIMIT = 20;
export const MIN_RECOMMENDATION_SCORE = 0;

export const LANGUAGE_KEYWORDS = [
  'english',
  'french',
  'kinyarwanda',
  'swahili',
  'spanish',
  'german',
  'portuguese',
  'arabic',
  'mandarin',
  'chinese',
];

export const EDUCATION_KEYWORDS = [
  'bachelor',
  'master',
  'phd',
  'doctorate',
  'diploma',
  'degree',
  'mba',
  'bsc',
  'msc',
  'associate',
  'certificate',
  'high school',
];
