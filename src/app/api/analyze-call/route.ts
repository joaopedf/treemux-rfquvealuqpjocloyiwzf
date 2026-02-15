import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export const maxDuration = 30;

const CLINICAL_ANALYSIS_PROMPT = `You are an AI medical assistant helping rural healthcare clinics analyze patient calls in real-time.

Your role is to:
1. Extract critical symptoms and medical information from the conversation
2. Identify urgency level (CRITICAL, URGENT, ROUTINE)
3. Suggest immediate actions or interventions
4. Flag any red flags or concerning patterns
5. Generate a structured clinical summary

Format your response as follows:
**URGENCY LEVEL:** [CRITICAL/URGENT/ROUTINE]

**KEY SYMPTOMS:**
- List each symptom clearly

**RED FLAGS:**
- Any concerning signs that need immediate attention

**RECOMMENDED ACTIONS:**
1. Immediate steps to take
2. Follow-up recommendations
3. When to escalate

**CLINICAL SUMMARY:**
Brief structured note for medical records

Be concise, actionable, and prioritize patient safety. If information is unclear, note what additional questions should be asked.`;

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return new Response('Transcript is required', { status: 400 });
    }

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: CLINICAL_ANALYSIS_PROMPT,
      prompt: `Analyze this patient call transcript and provide clinical guidance:\n\n${transcript}`,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error analyzing call:', error);
    return new Response('Error analyzing call', { status: 500 });
  }
}
