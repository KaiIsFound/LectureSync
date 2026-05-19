import { NextResponse } from "next/server";
import * as kv from "@/lib/kv";

// ════════════════════════════════════════════════════════════
// Hardware Audio API — Stateless cho Vercel Serverless
// ESP32 gửi 5-10s audio/chunk → Server transcribe ngay → Lưu KV
// ════════════════════════════════════════════════════════════

export const maxDuration = 30; // Vercel Pro: 60s, Hobby: 10s (auto-capped)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// WAV header cho PCM 16kHz, 16-bit, Mono
function createWavHeader(dataLength: number) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataLength, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666D7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataLength, true);
  return Buffer.from(buffer);
}

// ═══════════════════════════════════════════════
// Fallback: In-memory state (chỉ cho localhost)
// ═══════════════════════════════════════════════
let localTranscripts: string[] = [];
let localMeta = { time: 0, bytes: 0 };
let localAudioAccumulator: Buffer = Buffer.alloc(0);
let localFullRecording: Buffer = Buffer.alloc(0);
const LOCAL_CHUNK_BYTES = 320000; // 10 giây

// ════════════════════════════════════════
// POST: ESP32 gửi audio → Whisper → lưu KV
// ════════════════════════════════════════
export async function POST(req: Request) {
  try {
    const audioBuffer = await req.arrayBuffer();
    const chunkBuffer = Buffer.from(audioBuffer);

    if (chunkBuffer.length < 1000) {
      return NextResponse.json({ error: "No audio data" }, { status: 400, headers: corsHeaders });
    }

    const useKV = kv.isConfigured();

    // ── KV Mode (Vercel): ESP32 gửi chunk lớn (5-10s), xử lý ngay ──
    if (useKV) {
      await kv.updateMeta(chunkBuffer.length);

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ success: true, transcript: "" }, { headers: corsHeaders });
      }

      // Nếu chunk quá nhỏ (<2s = 64KB), trả về luôn (ESP32 đang gửi chunk nhỏ)
      if (chunkBuffer.length < 64000) {
        return NextResponse.json({ success: true, status: "chunk-too-small" }, { headers: corsHeaders });
      }

      // Lấy context từ KV cho prompt
      const allTranscripts = await kv.getAllTranscripts();
      const promptText = allTranscripts.slice(-3).join(" ").slice(-200);

      // PCM → WAV → Whisper/Deepgram
      const wavHeader = createWavHeader(chunkBuffer.length);
      const wavFile = Buffer.concat([wavHeader, chunkBuffer]);

      const text = await transcribeAudio(wavFile, promptText);
      if (text === null) {
        return NextResponse.json({ success: false, error: "STT error" }, { status: 500, headers: corsHeaders });
      }

      if (text && !isHallucination(text)) {
        console.log(`[ESP32→KV] ✅ ${text.slice(0, 80)}...`);
        await kv.pushTranscript(text);
        return NextResponse.json({ success: true, transcript: text }, { headers: corsHeaders });
      }

      return NextResponse.json({ success: true, transcript: "" }, { headers: corsHeaders });
    }

    // ── Gửi trực tiếp chunk audio lên AI (Trình duyệt đã lo việc gom audio) ──
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: true, transcript: "" }, { headers: corsHeaders });
    }

    // Lấy context từ transcript trước
    const promptText = localTranscripts.slice(-3).join(" ").slice(-200);

    const wavHeader = createWavHeader(chunkBuffer.length);
    const fullWavBuffer = Buffer.concat([wavHeader, chunkBuffer]);

    const text = await transcribeAudio(fullWavBuffer, promptText);
    if (text === null) {
      return NextResponse.json({ success: false }, { status: 500, headers: corsHeaders });
    }

    if (text && !isHallucination(text)) {
      console.log(`[ESP32 Local] ✅ ${text.slice(0, 80)}`);
      localTranscripts.push(text);
      return NextResponse.json({ success: true, transcript: text }, { headers: corsHeaders });
    }

    return NextResponse.json({ success: true, transcript: "" }, { headers: corsHeaders });
  } catch (error) {
    console.error("Hardware audio error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

// ════════════════════════════════════════
// GET: Browser lấy transcripts mới
// ════════════════════════════════════════
export async function GET(req: Request) {
  const url = new URL(req.url);
  const useKV = kv.isConfigured();

  // Download WAV (chỉ hỗ trợ local mode)
  if (url.searchParams.get("download") === "true") {
    if (!useKV && localFullRecording.length > 1000) {
      const wavHeader = createWavHeader(localFullRecording.length);
      const wavFile = Buffer.concat([wavHeader, localFullRecording]);
      return new NextResponse(wavFile, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/wav",
          "Content-Disposition": `attachment; filename="recording.wav"`,
          "Content-Length": String(wavFile.length),
        }
      });
    }
    return NextResponse.json({ error: "No audio" }, { status: 404, headers: corsHeaders });
  }

  if (useKV) {
    const [transcripts, meta] = await Promise.all([kv.popTranscripts(), kv.getMeta()]);
    return NextResponse.json({
      transcripts,
      lastReceived: meta?.time || 0,
      lastBytes: meta?.bytes || 0,
      recordingSize: 0,
      recordingDuration: 0,
    }, { headers: corsHeaders });
  }

  // Local mode
  const currentTranscripts = [...localTranscripts];
  localTranscripts = [];
  return NextResponse.json({
    transcripts: currentTranscripts,
    lastReceived: localMeta.time,
    lastBytes: localMeta.bytes,
    recordingSize: localFullRecording.length,
    recordingDuration: localFullRecording.length / 32000,
  }, { headers: corsHeaders });
}

// ════════════════════════════════════════
// PUT: Finalize — Kết hợp tất cả transcripts
// ════════════════════════════════════════
export async function PUT() {
  try {
    const useKV = kv.isConfigured();

    if (useKV) {
      // KV mode: lấy tất cả transcripts đã lưu
      const all = await kv.getAllTranscripts();
      const finalTranscript = all.join(" ");
      console.log(`[Finalize KV] ✅ ${all.length} chunks, ${finalTranscript.length} ký tự`);
      await kv.clearAll();
      return NextResponse.json({
        success: true,
        transcript: finalTranscript,
        method: "kv-combined",
        chunks: all.length,
      }, { headers: corsHeaders });
    }

    // Local mode: xử lý lại toàn bộ audio với Whisper
    const totalBytes = localFullRecording.length;
    if (totalBytes < 16000) {
      const result = localTranscripts.join(" ");
      localFullRecording = Buffer.alloc(0);
      localAudioAccumulator = Buffer.alloc(0);
      return NextResponse.json({ success: true, transcript: result, method: "live" }, { headers: corsHeaders });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const result = localTranscripts.join(" ");
      localFullRecording = Buffer.alloc(0);
      localAudioAccumulator = Buffer.alloc(0);
      return NextResponse.json({ success: true, transcript: result, method: "no-key" }, { headers: corsHeaders });
    }

    const CHUNK_DURATION_BYTES = 1920000; // 60s chunks
    const OVERLAP_BYTES = 96000;           // 3s overlap
    const finalParts: string[] = [];
    let offset = 0;

    while (offset < totalBytes) {
      const end = Math.min(offset + CHUNK_DURATION_BYTES, totalBytes);
      const chunk = localFullRecording.subarray(offset, end);
      const wavHeader = createWavHeader(chunk.length);
      const wavFile = Buffer.concat([wavHeader, chunk]);

      const text = await transcribeAudio(wavFile, finalParts.length > 0 ? finalParts[finalParts.length - 1].slice(-200) : "");
      
      if (text !== null) {
        if (text.length > 0 && !isHallucination(text)) {
          finalParts.push(text);
        }
      } else {
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }

      offset = end < totalBytes ? end - OVERLAP_BYTES : end;
      if (offset < totalBytes) await new Promise(r => setTimeout(r, 200));
    }

    const finalTranscript = finalParts.join(" ");
    localFullRecording = Buffer.alloc(0);
    localAudioAccumulator = Buffer.alloc(0);
    localTranscripts = [];

    return NextResponse.json({
      success: true,
      transcript: finalTranscript,
      method: "full-reprocess",
      chunks: finalParts.length,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("[Finalize] Error:", error);
    return NextResponse.json({ success: true, transcript: "", method: "error" }, { headers: corsHeaders });
  }
}

// ════════════════════════════════════════
// DELETE: Reset toàn bộ
// ════════════════════════════════════════
export async function DELETE() {
  if (kv.isConfigured()) {
    await kv.clearAll();
  }
  localFullRecording = Buffer.alloc(0);
  localAudioAccumulator = Buffer.alloc(0);
  localTranscripts = [];
  localMeta = { time: 0, bytes: 0 };
  return NextResponse.json({ success: true }, { headers: corsHeaders });
}

// ════════════════════════════════════════
// Hallucination filter
// ════════════════════════════════════════
function isHallucination(text: string): boolean {
  const lower = text.toLowerCase();
  return text.length < 200 && (
    text.includes("ご視聴ありがとうございました") ||
    text.includes("視聴ありがとうございました") ||
    lower.includes("thank you for watching") ||
    lower.includes("subscribe") ||
    lower.includes("la la school") ||
    lower.includes("ghiền mì gõ") ||
    lower.includes("đăng ký kênh") ||
    lower.includes("ủng hộ kênh") ||
    lower.includes("bỏ lỡ những video") ||
    lower === "thank you." ||
    lower.includes("cảm ơn các bạn đã theo dõi") ||
    lower === "cảm ơn." ||
    lower === "cảm ơn" ||
    lower === "cảm ơn cảm ơn" ||
    lower.includes("hẹn gặp lại") ||
    lower.includes("video tiếp theo") ||
    lower === "bum... bum..." ||
    lower === "oh" ||
    lower === "oh oh" ||
    lower === "oh oh oh" ||
    lower.includes("h h h") ||
    lower.includes("h h") ||
    lower.includes("e h h") ||
    lower.includes("ehe esam") ||
    lower.includes("ehe.") ||
    lower.includes("ehe") ||
    lower.includes("phong") ||
    lower.includes("vok") ||
    lower.includes("plocks") ||
    lower.includes("png") ||
    lower.includes("sot") ||
    lower.includes("ddc") ||
    lower.includes("slovena") ||
    lower.includes("c'est") ||
    !!text.match(/^[. ]*$/) ||
    lower === "thanks for watching." ||
    lower.includes("chúng ta sẽ bắt đầu") ||
    lower.includes("bắt đầu bài học hôm nay") ||
    lower.includes("xin chào đây là bài giảng") ||
    lower.includes("còn bây giờ thì sao") ||
    lower.includes("bây giờ thì sao") ||
    lower.includes("còn bây giờ") ||
    // ★ BỘ LỌC THÔNG MINH: Bắt mọi từ lặp lại 3+ lần (dấu hiệu 100% ảo giác)
    !!text.match(/\b(\w+)\b(?:\s+\1){2,}/i) ||
    // ★ Transcript quá ngắn thường là tiếng rác gõ phím/rè
    text.trim().length <= 3
  );
}

// ════════════════════════════════════════
// STT Helper (Deepgram fallback to Groq)
// ════════════════════════════════════════
async function transcribeAudio(wavBuffer: Buffer, promptText: string = ""): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(wavBuffer)], { type: "audio/wav" }), "audio.wav");
  formData.append("model", "whisper-large-v3");
  formData.append("response_format", "verbose_json");
  formData.append("language", "vi");
  formData.append("temperature", "0");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${groqKey}` },
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.text();
    if (err.includes("rate_limit")) await new Promise(r => setTimeout(r, 4000));
    return null;
  }
  
  const data = await res.json();
  return (data?.text || "").trim();
}
