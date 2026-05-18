// ════════════════════════════════════════════════════════════
// Upstash Redis REST Client — zero npm dependencies
// Dùng cho Vercel serverless (stateless) thay cho biến bộ nhớ
// Free tier: 10K requests/ngày, 256MB — quá đủ cho LectureSync
// ════════════════════════════════════════════════════════════

async function redis(...command: (string | number)[]): Promise<any> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    console.error('[KV] Error:', res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return data.result;
}

/** Kiểm tra Upstash đã cấu hình chưa */
export function isConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/** Push transcript mới (cho browser đọc + lưu vĩnh viễn cho finalize) */
export async function pushTranscript(text: string) {
  await Promise.all([
    redis('RPUSH', 'ls:pending', text),   // Browser sẽ đọc rồi xoá
    redis('RPUSH', 'ls:all', text),        // Lưu vĩnh viễn cho finalize
    redis('EXPIRE', 'ls:pending', 7200),
    redis('EXPIRE', 'ls:all', 7200),
  ]);
}

/** Browser đọc transcript mới (và xoá khỏi pending) */
export async function popTranscripts(): Promise<string[]> {
  const items = await redis('LRANGE', 'ls:pending', 0, -1);
  if (items && items.length > 0) {
    await redis('DEL', 'ls:pending');
  }
  return items || [];
}

/** Cập nhật metadata (thời gian + bytes nhận được) */
export async function updateMeta(addBytes: number) {
  const raw = await redis('GET', 'ls:meta');
  const prev = raw ? JSON.parse(raw) : { bytes: 0 };
  const meta = { time: Date.now(), bytes: prev.bytes + addBytes };
  await redis('SET', 'ls:meta', JSON.stringify(meta), 'EX', 7200);
}

/** Đọc metadata */
export async function getMeta(): Promise<{ time: number; bytes: number } | null> {
  const raw = await redis('GET', 'ls:meta');
  return raw ? JSON.parse(raw) : null;
}

/** Lấy tất cả transcript đã lưu (cho finalize) */
export async function getAllTranscripts(): Promise<string[]> {
  return (await redis('LRANGE', 'ls:all', 0, -1)) || [];
}

/** Xoá toàn bộ session */
export async function clearAll() {
  await redis('DEL', 'ls:pending', 'ls:all', 'ls:meta');
}
