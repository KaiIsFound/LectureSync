import { callGemini, PROCESS_PROMPT } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript } = body;

    console.log('[Process API] Received transcript length:', transcript?.length || 0);

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      console.error('[Process API] Empty transcript');
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }

    console.log('[Process API] Calling Gemini...');
    const result = await callGemini(PROCESS_PROMPT(transcript));
    console.log('[Process API] Gemini response length:', result?.length || 0);

    // Parse the JSON response from Gemini
    let parsed;
    try {
      // Remove potential markdown code fences and whitespace
      let cleaned = result.trim();
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
      cleaned = cleaned.replace(/\s*```$/i, '');
      cleaned = cleaned.trim();

      // Try to find JSON object in the response
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
      }

      parsed = JSON.parse(cleaned);
      console.log('[Process API] Parsed keys:', Object.keys(parsed));
    } catch (parseErr) {
      console.error('[Process API] JSON parse failed:', parseErr);
      console.error('[Process API] Raw response (first 500):', result.slice(0, 500));
      // Fallback: return raw text as notes
      parsed = {
        notes: result,
        definitions: [],
        deadlines: [],
        formulas: [],
        flashcards: [],
        quiz: [],
      };
    }

    // Ensure all required fields exist
    const safe = {
      notes: parsed.notes || '',
      definitions: Array.isArray(parsed.definitions) ? parsed.definitions : [],
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
      formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
      flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
      quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
    };

    console.log('[Process API] Success — notes:', safe.notes.length, 'flashcards:', safe.flashcards.length, 'quiz:', safe.quiz.length);
    return Response.json(safe);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Process API] Fatal error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
