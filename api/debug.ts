import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { vendors, representatives, categories } from './_lib/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const vendorList = await db.select().from(vendors).limit(3);
    const repList = await db.select().from(representatives).limit(3);
    const catList = await db.select().from(categories).limit(3);

    return res.status(200).json({
      status: 'ok',
      vendorCount: vendorList.length,
      repCount: repList.length,
      catCount: catList.length,
      sampleVendor: vendorList[0] || null,
      sampleRep: repList[0] || null,
      sampleCategory: catList[0] || null,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
