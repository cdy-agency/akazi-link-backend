import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { convert as pdfToImages } from 'pdf-img-convert';
import Tesseract from 'tesseract.js';
import WordExtractor from 'word-extractor';
import { getExtension } from '../config/cv.config';
import {
  CvExtractionMethod,
  EMPTY_CV_AI_EXTRACTED_DATA,
  EMPTY_CV_EXTRACTED_DATA,
  ICvDocument,
  ICvAiExtractedData,
  ICvExtractionResult,
  ICvExtractionSummary,
  ICvTextExtractionResult,
} from '../types/cv.types';
import {
  extractCvWithAi,
} from '../ai/cv-ai.service';

const MIN_DIRECT_TEXT_LENGTH = 80;
const OCR_MAX_PAGES = 2;

const EMAIL_REGEX =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{1,4})?/g;

type SectionKey =
  | 'skills'
  | 'education'
  | 'experience'
  | 'languages'
  | 'certificates';

const SECTION_HEADERS: Record<SectionKey, RegExp> = {
  skills:
    /^(skills|technical skills|core competencies|key skills|competencies)$/i,
  education:
    /^(education|academic background|qualifications|academic qualifications)$/i,
  experience:
    /^(experience|work experience|employment|professional experience|work history|employment history)$/i,
  languages: /^(languages|language skills)$/i,
  certificates:
    /^(certificates|certifications|licenses|licences|professional certifications)$/i,
};

const downloadCvBuffer = async (fileUrl: string): Promise<Buffer> => {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download CV file (HTTP ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const resolveFormat = (
  fileName: string,
  mimeType: string
): CvExtractionMethod | null => {
  const extension = getExtension(fileName);

  if (extension === '.docx') return 'docx';
  if (extension === '.doc') return 'doc';
  if (extension === '.pdf') return 'pdf';

  if (mimeType.includes('wordprocessingml')) return 'docx';
  if (mimeType.includes('msword')) return 'doc';
  if (mimeType.includes('pdf')) return 'pdf';

  return null;
};

export const extractDocxText = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
};

export const extractDocText = async (buffer: Buffer): Promise<string> => {
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return document.getBody().trim();
};

export const extractPdfText = async (buffer: Buffer): Promise<string> => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
};

export const extractWithOcrFallback = async (
  buffer: Buffer
): Promise<string> => {
  const pageNumbers = Array.from({ length: OCR_MAX_PAGES }, (_, index) => index + 1);
  const images = await pdfToImages(buffer, {
    page_numbers: pageNumbers,
    scale: 2,
  });

  if (!images.length) {
    throw new Error('OCR fallback could not render any PDF pages');
  }

  const worker = await Tesseract.createWorker('eng');
  const pageTexts: string[] = [];

  try {
    for (const image of images) {
      const imageBuffer = Buffer.isBuffer(image) ? image : Buffer.from(image);
      const { data } = await worker.recognize(imageBuffer);
      if (data.text?.trim()) {
        pageTexts.push(data.text.trim());
      }
    }
  } finally {
    await worker.terminate();
  }

  const rawText = pageTexts.join('\n\n').trim();
  if (!rawText) {
    throw new Error('OCR fallback did not extract any readable text');
  }

  return rawText;
};

const extractDirectText = async (
  format: CvExtractionMethod,
  buffer: Buffer
): Promise<{ rawText: string; method: CvExtractionMethod }> => {
  if (format === 'docx') {
    return { rawText: await extractDocxText(buffer), method: 'docx' };
  }

  if (format === 'doc') {
    return { rawText: await extractDocText(buffer), method: 'doc' };
  }

  const rawText = await extractPdfText(buffer);
  return { rawText, method: 'pdf' };
};

export const extractText = async (
  cv: Pick<ICvDocument, 'fileName' | 'fileUrl' | 'mimeType'>
): Promise<ICvTextExtractionResult> => {
  const startedAt = Date.now();
  const format = resolveFormat(cv.fileName, cv.mimeType);

  if (!format) {
    throw new Error('Unsupported CV file format for text extraction');
  }

  const buffer = await downloadCvBuffer(cv.fileUrl);
  let { rawText, method } = await extractDirectText(format, buffer);

  if (format === 'pdf' && rawText.length < MIN_DIRECT_TEXT_LENGTH) {
    rawText = await extractWithOcrFallback(buffer);
    method = 'ocr';
  }

  if (!rawText.trim()) {
    throw new Error('No readable text could be extracted from the CV');
  }

  return {
    rawText: rawText.trim(),
    extractionMethod: method,
    textExtractionDurationMs: Date.now() - startedAt,
  };
};

const cleanLine = (line: string): string =>
  line
    .replace(/^[\s•\-–—*]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

const isSectionHeader = (line: string): SectionKey | null => {
  const normalized = line.replace(/[:\s]+$/, '').trim();
  for (const [key, pattern] of Object.entries(SECTION_HEADERS) as [
    SectionKey,
    RegExp,
  ][]) {
    if (pattern.test(normalized)) {
      return key;
    }
  }
  return null;
};

const pushSectionItem = (
  sections: Record<SectionKey, string[]>,
  section: SectionKey,
  line: string
) => {
  const cleaned = cleanLine(line);
  if (!cleaned || cleaned.length < 2) return;
  sections[section].push(cleaned);
};

const inferFullName = (lines: string[]): string | undefined => {
  for (const line of lines.slice(0, 5)) {
    const cleaned = cleanLine(line);
    if (!cleaned || cleaned.length < 2 || cleaned.length > 80) continue;
    if (EMAIL_REGEX.test(cleaned)) continue;
    if (PHONE_REGEX.test(cleaned)) continue;
    if (isSectionHeader(cleaned)) continue;
    if (!/[A-Za-z]/.test(cleaned)) continue;
    if (/^(curriculum vitae|resume|cv)$/i.test(cleaned)) continue;
    return cleaned;
  }
  return undefined;
};

const inferLocation = (lines: string[]): string | undefined => {
  for (const line of lines.slice(0, 20)) {
    const match = line.match(
      /^(?:location|address|city)[:\s-]+(.+)$/i
    );
    if (match?.[1]?.trim()) {
      return cleanLine(match[1]);
    }
  }
  return undefined;
};

const parseSections = (rawText: string): Record<SectionKey, string[]> => {
  const sections: Record<SectionKey, string[]> = {
    skills: [],
    education: [],
    experience: [],
    languages: [],
    certificates: [],
  };

  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let currentSection: SectionKey | null = null;

  for (const line of lines) {
    const section = isSectionHeader(line);
    if (section) {
      currentSection = section;
      continue;
    }

    if (!currentSection) continue;
    pushSectionItem(sections, currentSection, line);
  }

  return sections;
};

export const extractStructuredData = (rawText: string): ICvAiExtractedData => {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  const lines = normalized.split('\n').map((line) => line.trim());

  const emailMatch = normalized.match(EMAIL_REGEX);
  const phoneMatch = normalized.match(PHONE_REGEX);
  const sections = parseSections(normalized);

  return {
    fullName: inferFullName(lines),
    email: emailMatch?.[0],
    phone: phoneMatch?.[0],
    location: inferLocation(lines),
    professionalSummary: undefined,
    skills: sections.skills,
    interviewSkills: [],
    education: sections.education,
    experience: sections.experience,
    languages: sections.languages,
    certifications: sections.certificates,
    certificates: sections.certificates,
    linkedInUrl: undefined,
    githubUrl: undefined,
    portfolioUrl: undefined,
    yearsOfExperience: undefined,
  };
};

const heuristicToAiResult = (rawText: string) => {
  const extractedData = extractStructuredData(rawText);
  return {
    extractedData,
    confidenceScores: { overall: 0.35 },
    provider: 'heuristic' as const,
  };
};

export const extractStructuredDataWithAi = async (rawText: string) => {
  try {
    return await extractCvWithAi(rawText);
  } catch (error) {
    console.warn(
      '[CV AI] Falling back to heuristic extraction:',
      error instanceof Error ? error.message : error
    );
    return heuristicToAiResult(rawText);
  }
};

export const runFullExtraction = async (
  cv: Pick<ICvDocument, 'fileName' | 'fileUrl' | 'mimeType'>
): Promise<ICvExtractionResult> => {
  const textResult = await extractText(cv);
  const structuredStartedAt = Date.now();
  const aiResult = await extractStructuredDataWithAi(textResult.rawText);

  return {
    ...textResult,
    extractedData: aiResult.extractedData,
    confidenceScores: aiResult.confidenceScores,
    aiProvider: aiResult.provider,
    structuredExtractionDurationMs: Date.now() - structuredStartedAt,
  };
};

export const getCvExtractionSummary = (
  extractedData?: ICvAiExtractedData | null
): ICvExtractionSummary | null => {
  if (!extractedData) return null;

  return {
    skillsCount: extractedData.skills?.length ?? 0,
    educationCount: extractedData.education?.length ?? 0,
    experienceCount: extractedData.experience?.length ?? 0,
    languagesCount: extractedData.languages?.length ?? 0,
    certificatesCount:
      extractedData.certifications?.length ??
      extractedData.certificates?.length ??
      0,
    interviewSkillsCount: extractedData.interviewSkills?.length ?? 0,
    fullName: extractedData.fullName,
    email: extractedData.email,
    phone: extractedData.phone,
    location: extractedData.location,
    yearsOfExperience: extractedData.yearsOfExperience,
  };
};

export const normalizeExtractedData = (
  data?: ICvAiExtractedData | null
): ICvAiExtractedData => {
  if (!data) return EMPTY_CV_AI_EXTRACTED_DATA();

  const certs = data.certifications?.length
    ? data.certifications
    : data.certificates ?? [];

  return {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    location: data.location,
    professionalSummary: data.professionalSummary,
    skills: data.skills ?? [],
    interviewSkills: data.interviewSkills ?? [],
    education: data.education ?? [],
    experience: data.experience ?? [],
    languages: data.languages ?? [],
    certifications: certs,
    certificates: certs,
    linkedInUrl: data.linkedInUrl,
    githubUrl: data.githubUrl,
    portfolioUrl: data.portfolioUrl,
    yearsOfExperience: data.yearsOfExperience,
  };
};
