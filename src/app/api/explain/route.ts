import { callGemini, EXPLAIN_PROMPT } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { chunk } = await request.json();

    if (!chunk || typeof chunk !== 'string' || chunk.trim().length === 0) {
      return Response.json({ error: 'No text chunk provided' }, { status: 400 });
    }

    const explanation = await callGemini(EXPLAIN_PROMPT(chunk));
    return Response.json({ explanation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Explain API error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
