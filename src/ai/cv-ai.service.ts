import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import {
  EMPTY_CV_AI_EXTRACTED_DATA,
  ICvAiExtractedData,
  ICvConfidenceScores,
} from '../types/cv.types';

export type CvAiProvider = 'groq' | 'anthropic' | 'heuristic';

export interface CvAiExtractionResult {
  extractedData: ICvAiExtractedData;
  confidenceScores: ICvConfidenceScores;
  provider: CvAiProvider;
}

const MAX_PROMPT_CHARS = 12000;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const ANTHROPIC_MODEL = 'claude-3-5-haiku-latest';

const CV_EXTRACTION_PROMPT = (rawText: string) => `
You are an expert CV/resume parser. Extract structured candidate information from the CV text below.

Return ONLY a valid JSON object with this exact shape:
{
  "extractedData": {
    "fullName": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "professionalSummary": "string or null",
    "skills": ["skill1", "skill2"],
    "interviewSkills": ["communication", "problem solving"],
    "education": ["degree / school entries"],
    "experience": ["job title at company - dates - summary"],
    "languages": ["English - Fluent"],
    "certifications": ["cert name"],
    "linkedInUrl": "string or null",
    "githubUrl": "string or null",
    "portfolioUrl": "string or null",
    "yearsOfExperience": 0
  },
  "confidenceScores": {
    "fullName": 0.0,
    "email": 0.0,
    "phone": 0.0,
    "location": 0.0,
    "professionalSummary": 0.0,
    "skills": 0.0,
    "interviewSkills": 0.0,
    "education": 0.0,
    "experience": 0.0,
    "languages": 0.0,
    "certifications": 0.0,
    "linkedInUrl": 0.0,
    "githubUrl": 0.0,
    "portfolioUrl": 0.0,
    "yearsOfExperience": 0.0,
    "overall": 0.0
  }
}

Rules:
- confidenceScores are 0.0 to 1.0 (how confident you are per field)
- interviewSkills = soft skills useful in interviews (communication, leadership, teamwork, etc.)
- yearsOfExperience = total years inferred from work history (number, 0 if unknown)
- Use empty arrays [] when nothing found
- Use null for unknown scalar fields
- Return ONLY JSON, no markdown fencing

CV TEXT:
"""
${rawText}
"""
`.trim();

const parseJsonResponse = (content: string): unknown => {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonString = fencedMatch ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(jsonString);
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
    .filter(Boolean);
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const clampConfidence = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(1, value));
};

export const normalizeAiExtractionPayload = (
  payload: unknown
): CvAiExtractionResult => {
  const root = (payload || {}) as {
    extractedData?: Record<string, unknown>;
    confidenceScores?: Record<string, unknown>;
  };

  const data = root.extractedData || {};
  const certs = toStringArray(data.certifications ?? data.certificates);

  const extractedData: ICvAiExtractedData = {
    fullName: toOptionalString(data.fullName),
    email: toOptionalString(data.email),
    phone: toOptionalString(data.phone),
    location: toOptionalString(data.location),
    professionalSummary: toOptionalString(data.professionalSummary),
    skills: toStringArray(data.skills),
    interviewSkills: toStringArray(data.interviewSkills),
    education: toStringArray(data.education),
    experience: toStringArray(data.experience),
    languages: toStringArray(data.languages),
    certifications: certs,
    certificates: certs,
    linkedInUrl: toOptionalString(data.linkedInUrl),
    githubUrl: toOptionalString(data.githubUrl),
    portfolioUrl: toOptionalString(data.portfolioUrl),
    yearsOfExperience: toOptionalNumber(data.yearsOfExperience),
  };

  const scores = root.confidenceScores || {};
  const confidenceScores: ICvConfidenceScores = {
    fullName: clampConfidence(scores.fullName),
    email: clampConfidence(scores.email),
    phone: clampConfidence(scores.phone),
    location: clampConfidence(scores.location),
    professionalSummary: clampConfidence(scores.professionalSummary),
    skills: clampConfidence(scores.skills),
    interviewSkills: clampConfidence(scores.interviewSkills),
    education: clampConfidence(scores.education),
    experience: clampConfidence(scores.experience),
    languages: clampConfidence(scores.languages),
    certifications: clampConfidence(scores.certifications),
    linkedInUrl: clampConfidence(scores.linkedInUrl),
    githubUrl: clampConfidence(scores.githubUrl),
    portfolioUrl: clampConfidence(scores.portfolioUrl),
    yearsOfExperience: clampConfidence(scores.yearsOfExperience),
    overall: clampConfidence(scores.overall),
  };

  return { extractedData, confidenceScores, provider: 'groq' };
};

const truncateText = (rawText: string): string => {
  if (rawText.length <= MAX_PROMPT_CHARS) return rawText;
  return `${rawText.slice(0, MAX_PROMPT_CHARS)}\n...[truncated]`;
};

const extractWithGroq = async (rawText: string): Promise<CvAiExtractionResult> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const client = new Groq({ apiKey });
  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: CV_EXTRACTION_PROMPT(truncateText(rawText)) }],
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Groq returned an empty response');
  }

  const parsed = parseJsonResponse(content);
  return { ...normalizeAiExtractionPayload(parsed), provider: 'groq' };
};

const extractWithAnthropic = async (
  rawText: string
): Promise<CvAiExtractionResult> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    messages: [
      { role: 'user', content: CV_EXTRACTION_PROMPT(truncateText(rawText)) },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Anthropic returned no text content');
  }

  const parsed = parseJsonResponse(textBlock.text);
  return { ...normalizeAiExtractionPayload(parsed), provider: 'anthropic' };
};

export const extractCvWithAi = async (
  rawText: string
): Promise<CvAiExtractionResult> => {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      extractedData: EMPTY_CV_AI_EXTRACTED_DATA(),
      confidenceScores: {},
      provider: 'heuristic',
    };
  }

  try {
    return await extractWithGroq(trimmed);
  } catch (groqError) {
    console.warn(
      '[CV AI] Groq extraction failed, trying Anthropic:',
      groqError instanceof Error ? groqError.message : groqError
    );
  }

  try {
    return await extractWithAnthropic(trimmed);
  } catch (anthropicError) {
    console.warn(
      '[CV AI] Anthropic extraction failed:',
      anthropicError instanceof Error ? anthropicError.message : anthropicError
    );
    throw anthropicError;
  }
};
