import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/kv';

// Upstash Redis REST Client
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

  if (!res.ok) return null;
  const data = await res.json();
  return data.result;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

export async function POST(req: Request) {
  try {
    const { localIp } = await req.json();
    if (!localIp) {
      return NextResponse.json({ error: 'Missing localIp' }, { status: 400 });
    }

    const publicIp = getClientIp(req);
    console.log(`[Discovery] Registering ESP32 local IP ${localIp} for public IP ${publicIp}`);

    if (isConfigured()) {
      await redis('SET', `discovery:${publicIp}`, localIp, 'EX', 7200); // 2 hours expiration
    }

    return NextResponse.json({ success: true, publicIp });
  } catch (error) {
    console.error('[Discovery Register] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const publicIp = getClientIp(req);
    let localIp = null;

    if (isConfigured()) {
      localIp = await redis('GET', `discovery:${publicIp}`);
    }

    console.log(`[Discovery] Fetched ESP32 local IP for public IP ${publicIp}: ${localIp}`);
    return NextResponse.json({ success: true, localIp });
  } catch (error) {
    console.error('[Discovery Fetch] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
