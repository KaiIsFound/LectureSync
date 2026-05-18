import { callGemini, callGeminiWithImage } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, history, images } = await request.json();

    if (!message && (!images || images.length === 0)) {
      return NextResponse.json({ error: 'Message or image is required' }, { status: 400 });
    }

    // Build conversation history for context
    const historyText = (history || [])
      .slice(-10)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `You are LectureSync AI — a friendly, knowledgeable study assistant. You have access to the student's lecture notes, transcripts, uploaded documents, and study materials.

IMPORTANT RULES:
- Answer questions based on the provided context when relevant
- If the question is about their lectures or uploaded files, reference that content specifically
- If an image is provided, analyze it thoroughly — extract text, describe diagrams, explain formulas, or answer questions about it
- Be concise but thorough
- Use bullet points and simple language
- If you don't have enough context to answer, say so honestly
- You can help with: explaining concepts, summarizing content, creating study plans, answering questions about their material, reading images/diagrams, and general academic help
- Respond in the same language the student uses

=== STUDENT'S STUDY MATERIALS ===
${context || 'No materials uploaded yet.'}

=== RECENT CONVERSATION ===
${historyText || 'No previous messages.'}

=== STUDENT'S MESSAGE ===
${message || 'Please analyze the attached image.'}

Please provide a helpful response:`;

    let response: string;

    if (images && images.length > 0) {
      // Multimodal request with images
      response = await callGeminiWithImage(prompt, images);
    } else {
      // Text-only request
      response = await callGemini(prompt);
    }

    return NextResponse.json({ response });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
