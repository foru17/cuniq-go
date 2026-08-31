import { NextResponse } from 'next/server';
import { runUpdate } from '@/services/updateService';

/**
 * POST /api/update-numbers
 * Updates the number cache by fetching latest data from the carrier API
 * This endpoint should be called by backend scheduled tasks, not by frontend users
 * Requires Bearer token authentication
 */
export async function POST(request: Request) {
  console.log('[Update API] Starting data update...');

  // Authentication check
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.UPDATE_API_TOKEN;

  if (!expectedToken) {
    console.error('[Update API] UPDATE_API_TOKEN not configured');
    return NextResponse.json(
      {
        success: false,
        error: 'Server configuration error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[Update API] Missing or invalid authorization header');
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Bearer token required',
        timestamp: Date.now()
      },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (token !== expectedToken) {
    console.warn('[Update API] Invalid token provided');
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Invalid token',
        timestamp: Date.now()
      },
      { status: 401 }
    );
  }

  console.log('[Update API] Authentication successful');

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
