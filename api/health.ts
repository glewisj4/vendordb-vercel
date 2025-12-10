import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    databaseUrlSet: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
  };

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        ...checks,
        status: 'error',
        error: 'DATABASE_URL environment variable is not set'
      });
    }

    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT COUNT(*) as count FROM vendors`;

    checks.vendorCount = result[0]?.count || 0;
    checks.status = 'ok';
    checks.database = 'connected';

    return res.status(200).json(checks);
  } catch (error) {
    checks.status = 'error';
    checks.error = error instanceof Error ? error.message : 'Unknown error';
    checks.errorType = error instanceof Error ? error.constructor.name : typeof error;
    
    return res.status(500).json(checks);
  }
}
