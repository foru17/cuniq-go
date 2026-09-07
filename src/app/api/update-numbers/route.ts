import { NextResponse } from 'next/server';
import { runUpdate } from '@/services/updateService';

// A run makes up to MAX_UPSTREAM_CALLS_PER_RUN upstream requests with pacing
// delays; the platform default (10s) is not enough.
export const maxDuration = 60;

type AuthOutcome = { ok: true } | { ok: false; status: number; error: string };

/**
 * Accepts either the manual token (UPDATE_API_TOKEN) or, when configured, the
 * scheduler secret Vercel Cron sends as `Authorization: Bearer $CRON_SECRET`.
 */
function authorize(request: Request): AuthOutcome {
  const accepted = [process.env.UPDATE_API_TOKEN, process.env.CRON_SECRET].filter(
    (t): t is string => Boolean(t)
  );

  if (accepted.length === 0) {
    console.error('[Update API] Neither UPDATE_API_TOKEN nor CRON_SECRET is configured');
    return { ok: false, status: 500, error: 'Server configuration error' };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[Update API] Missing or invalid authorization header');
    return { ok: false, status: 401, error: 'Unauthorized: Bearer token required' };
  }

  const token = authHeader.substring(7);
  if (!accepted.includes(token)) {
    console.warn('[Update API] Invalid token provided');
    return { ok: false, status: 401, error: 'Unauthorized: Invalid token' };
  }

  return { ok: true };
}

async function handle(request: Request, source: string) {
  console.log(`[Update API] Starting data update (${source})...`);

  const auth = authorize(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error, timestamp: Date.now() },
      { status: auth.status }
    );
  }

  try {
    const result = await runUpdate({ force: true });
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    console.error('[Update API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/update-numbers — manual/backend trigger (Bearer UPDATE_API_TOKEN)
 */
export async function POST(request: Request) {
  return handle(request, 'POST');
}

/**
 * GET /api/update-numbers — scheduler trigger. Vercel Cron and most external
 * cron services can only issue GETs; same auth rules apply.
 */
export async function GET(request: Request) {
  return handle(request, 'GET');
}
