import Groq from 'groq-sdk';

/**
 * Legacy document classifier — Express-compatible (no NestJS).
 * CV extraction uses `cv-ai.service.ts`.
 */
export class AiService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async classifyDocument(extractedText: string, categories: string[]) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `
              You are a document classifier.

              Available categories: ${categories.join(', ')}

              Extracted text from scanned document:
              "${extractedText}"

              Return ONLY a valid JSON object:
              {
                "title": "document title or null",
                "documentOwner": "who the document belongs to or null",
                "author": "who wrote or issued the document or null",
                "documentType": "Agreement|Invoice|Certificate|Permit|...",
                "category": "pick one from available categories or best-guess",
                "summary": "short summary max 2 sentences",
                "concerning": "contextual field that adapts by documentType (see rules)",
                "purpose": "why this document exists or null",
                "documentDate": "date found on the document (ISO or readable) or null"
              }

              IMPORTANT:
              - Return ONLY valid JSON, nothing else (no markdown fencing, no explanation).
              - Always include all keys exactly as shown above. Use null for unknown values.
            `,
          },
        ],
      });

      const content = response.choices[0].message.content;
      return this.parseJsonResponse(content!);
    } catch (error) {
      console.error('[AI] Error during classification:', error);
      throw error;
    }
  }

  private parseJsonResponse(content: string) {
    const trimmed = content.trim();
    const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const jsonString = fencedMatch ? fencedMatch[1].trim() : trimmed;
    return JSON.parse(jsonString);
  }
}

export const aiService = new AiService();
