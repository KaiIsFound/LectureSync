import { NextResponse } from 'next/server';

// Cho phép Vercel chạy tối đa 60 giây (bản Hobby giới hạn 10s hoặc 60s tuỳ config)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const language = formData.get('language') as string || 'vi';

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file audio' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình GROQ_API_KEY' }, { status: 500 });
    }

    console.log(`[Transcribe File] Đang xử lý file ${Math.round(file.size / 1024)}KB, ngôn ngữ: ${language}`);

    // Gửi thẳng file WebM này sang Groq Whisper
    const groqFormData = new FormData();
    groqFormData.append('file', file, 'recording.webm');
    // Model turbo là nhanh nhất và xịn nhất hiện nay
    groqFormData.append('model', 'whisper-large-v3-turbo');
    groqFormData.append('response_format', 'verbose_json');
    groqFormData.append('language', language);
    groqFormData.append('temperature', '0');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: groqFormData,
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error('[Transcribe File] Lỗi Groq:', errorText);
      return NextResponse.json({ error: 'Lỗi khi gọi Groq API' }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const transcript = (groqData?.text || '').trim();

    return NextResponse.json({ success: true, transcript });
  } catch (error) {
    console.error('[Transcribe File] Lỗi Server:', error);
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}
