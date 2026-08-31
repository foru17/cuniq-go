import { NextResponse } from 'next/server';
import { getNumbers } from '@/services/numberService';

// Cache the response for 60 seconds to reduce R2/S3 operations
export const revalidate = 60;

/**
 * GET /api/numbers
 * Read-only endpoint that returns cached number data
 * Data updates are handled by POST /api/update-numbers
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type'); // 'ordinary' or 'special'
  const type = typeParam === 'special' ? 'special' : 'ordinary';

  const { data, lastUpdated } = await getNumbers(type);

  return NextResponse.json({
    data,
    lastUpdated,
  });
}
