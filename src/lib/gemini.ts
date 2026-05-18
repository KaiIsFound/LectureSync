// AI API client helper — server-side only
// Hệ thống Dual-Model: chạy song song 2 model, lấy kết quả tốt nhất

// ════════════════════════════════════════
// Gọi 1 model Groq cụ thể
// ════════════════════════════════════════
async function callGroqModel(prompt: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq [${model}] error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`No response from Groq [${model}]`);
  return text;
}

// ════════════════════════════════════════
// Hàm chính: Dual-Model (chạy song song)
// ════════════════════════════════════════
export async function callGemini(prompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    // ★ Chạy song song 2 model, lấy kết quả nào tốt hơn
    const MODEL_A = "llama-3.3-70b-versatile";   // Mạnh, phân tích tổng quát tốt
    const MODEL_B = "deepseek-r1-distill-llama-70b"; // DeepSeek R1 (Llama 70B), reasoning sâu sắc

    console.log(`[Dual-Model] Chạy song song: ${MODEL_A} + ${MODEL_B}`);

    const results = await Promise.allSettled([
      callGroqModel(prompt, MODEL_A, groqKey),
      callGroqModel(prompt, MODEL_B, groqKey),
    ]);

    const resultA = results[0].status === 'fulfilled' ? results[0].value : null;
    const resultB = results[1].status === 'fulfilled' ? results[1].value : null;

    if (results[0].status === 'rejected') console.warn(`[Dual-Model] ${MODEL_A} thất bại:`, (results[0] as PromiseRejectedResult).reason?.message);
    if (results[1].status === 'rejected') console.warn(`[Dual-Model] ${MODEL_B} thất bại:`, (results[1] as PromiseRejectedResult).reason?.message);

    // Logic chọn kết quả tốt nhất:
    if (resultA && resultB) {
      // Cả 2 thành công → chọn cái nào có output JSON hợp lệ và dài hơn (chi tiết hơn)
      const isJsonA = isValidJson(resultA);
      const isJsonB = isValidJson(resultB);

      if (isJsonA && !isJsonB) {
        console.log(`[Dual-Model] ✅ Chọn ${MODEL_A} (JSON hợp lệ)`);
        return resultA;
      }
      if (!isJsonA && isJsonB) {
        console.log(`[Dual-Model] ✅ Chọn ${MODEL_B} (JSON hợp lệ)`);
        return resultB;
      }
      // Cả 2 đều JSON hoặc cả 2 đều text → chọn cái dài hơn (nhiều nội dung hơn)
      if (resultA.length >= resultB.length) {
        console.log(`[Dual-Model] ✅ Chọn ${MODEL_A} (${resultA.length} > ${resultB.length} ký tự)`);
        return resultA;
      } else {
        console.log(`[Dual-Model] ✅ Chọn ${MODEL_B} (${resultB.length} > ${resultA.length} ký tự)`);
        return resultB;
      }
    }

    // Chỉ 1 cái thành công → dùng cái đó
    if (resultA) {
      console.log(`[Dual-Model] ✅ Chỉ ${MODEL_A} thành công`);
      return resultA;
    }
    if (resultB) {
      console.log(`[Dual-Model] ✅ Chỉ ${MODEL_B} thành công`);
      return resultB;
    }

    // Cả 2 đều thất bại
    throw new Error('Cả 2 model đều thất bại. Vui lòng thử lại.');
  }

  // Fallback: Gemini nếu không có Groq key
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('API key is not set in .env.local');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  return text;
}

// Kiểm tra output có phải JSON hợp lệ không
function isValidJson(text: string): boolean {
  try {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    cleaned = cleaned.trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return false;
    JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    return true;
  } catch {
    return false;
  }
}

export interface ImagePart {
  mimeType: string;
  base64Data: string;
}

export async function callGeminiWithImage(prompt: string, images: ImagePart[]): Promise<string> {
  const errors: string[] = [];

  // ════════════════════════════════════════
  // ★ PHƯƠNG ÁN 1: OpenRouter — Miễn phí, ổn định, đọc ảnh rất tốt
  // ════════════════════════════════════════
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const VISION_MODEL = "google/gemma-4-31b-it:free";
      console.log(`[Vision] OpenRouter: dùng ${VISION_MODEL}`);

      const content: any[] = [{ type: "text", text: prompt }];
      for (const img of images) {
        content.push({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.base64Data}` }
        });
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
          "X-Title": "LectureSync"
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [{ role: "user", content }],
          max_tokens: 4096
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.length > 20) {
          console.log(`[Vision] ✅ OpenRouter thành công (${text.length} ký tự)`);
          return text;
        }
      } else {
        const errBody = await response.text();
        console.warn(`[Vision] OpenRouter error (${response.status}):`, errBody);
        errors.push(`OpenRouter: ${response.status}`);
      }
    } catch (e: any) {
      console.warn("[Vision] OpenRouter exception:", e.message);
      errors.push(`OpenRouter: ${e.message}`);
    }
  }

  // ════════════════════════════════════════
  // PHƯƠNG ÁN 2: Gemini API (nếu có key)
  // ════════════════════════════════════════
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      console.log("[Vision] Gemini 1.5 Flash...");
      const parts: any[] = [{ text: prompt }];
      for (const img of images) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64Data } });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[Vision] ✅ Gemini thành công (${text.length} ký tự)`);
          return text;
        }
      } else {
        const errBody = await response.text();
        console.warn("[Vision] Gemini error:", errBody);
        errors.push(`Gemini: ${response.status}`);
      }
    } catch (e: any) {
      errors.push(`Gemini: ${e.message}`);
    }
  }

  // ════════════════════════════════════════
  // PHƯƠNG ÁN 3: Groq Llama 4 Scout (backup cuối)
  // ════════════════════════════════════════
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
      console.log(`[Vision] Groq: ${VISION_MODEL}`);

      const content: any[] = [{ type: "text", text: prompt }];
      for (const img of images) {
        content.push({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.base64Data}` }
        });
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [{ role: "user", content }],
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.length > 20) {
          console.log(`[Vision] ✅ Groq thành công (${text.length} ký tự)`);
          return text;
        }
      } else {
        const errBody = await response.text();
        console.warn("[Vision] Groq error:", errBody);
        errors.push(`Groq: ${response.status}`);
      }
    } catch (e: any) {
      errors.push(`Groq: ${e.message}`);
    }
  }

  // Tất cả đều thất bại
  throw new Error(`Không thể xử lý ảnh. Lỗi: ${errors.join('; ')}. Hãy thêm OPENROUTER_API_KEY (miễn phí tại openrouter.ai) vào .env.local`);
}

export const EXPLAIN_PROMPT = (chunk: string) =>
  `You are a helpful teaching assistant. Simplify this lecture excerpt into 1-2 concise bullet points that a college freshman could easily understand. Use simple language. Do not add any preamble or introduction, just the bullet points.

Lecture excerpt:
"${chunk}"`;

export const PROCESS_PROMPT = (transcript: string) =>
  `You are an expert study assistant. Analyze this lecture transcript and produce a comprehensive study packet. Return ONLY valid JSON (no markdown code fences) in exactly this format:

{
  "notes": "Structured markdown notes with ## section headings based on topics discussed",
  "definitions": [{"term": "term name", "definition": "clear definition"}],
  "deadlines": [{"description": "assignment or deadline mentioned", "date": "date if mentioned or 'TBD'"}],
  "formulas": [{"name": "formula name", "formula": "the formula", "explanation": "what it means"}],
  "flashcards": [{"question": "study question", "answer": "concise answer"}],
  "quiz": [{"question": "question text", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "why this is correct"}]
}

Rules:
- Generate 5-10 HIGH-QUALITY flashcards. Focus EXCLUSIVELY on core academic concepts, theories, vocabulary, and important facts. STRICTLY IGNORE irrelevant chatter, meta-commentary (e.g., "subscribe", greetings, jokes, or class administration).
- Generate 5 quiz questions with 4 options each, strictly testing academic material.
- Extract ALL definitions, deadlines, and formulas mentioned.
- Notes should be well-structured markdown with clear section headings.
- If no deadlines/formulas are found, return empty arrays.
- Keep all answers concise and student-friendly.
- Ensure JSON is perfectly valid and correctly escaped.

Lecture transcript:
"${transcript}"`;
