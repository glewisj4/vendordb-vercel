import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { vendors, insertVendorSchema } from '../_lib/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, search } = req.query;

  try {
    // Single vendor operations (when id is provided)
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
        if (!vendor) {
          return res.status(404).json({ error: 'Vendor not found' });
        }
        return res.status(200).json(vendor);
      }

      if (req.method === 'PATCH' || req.method === 'PUT') {
        const [updated] = await db.update(vendors)
          .set({ ...req.body, updatedAt: new Date() } as any)
          .where(eq(vendors.id, id))
          .returning();
        if (!updated) {
          return res.status(404).json({ error: 'Vendor not found' });
        }
        return res.status(200).json(updated);
      }

      if (req.method === 'DELETE') {
        const [deleted] = await db.delete(vendors)
          .where(eq(vendors.id, id))
          .returning();
        if (!deleted) {
          return res.status(404).json({ error: 'Vendor not found' });
        }
        return res.status(200).json({ success: true });
      }
    }

    // List operations
    if (req.method === 'GET') {
      let result;
      if (search && typeof search === 'string') {
        result = await db.select().from(vendors)
          .where(or(
            ilike(vendors.companyName, `%${search}%`),
            ilike(vendors.vendorNumber, `%${search}%`)
          ))
          .orderBy(desc(vendors.createdAt));
      } else {
        result = await db.select().from(vendors).orderBy(desc(vendors.createdAt));
      }
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const parsed = insertVendorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const count = await db.select().from(vendors);
      const vendorNumber = `V#${String(count.length + 1).padStart(5, '0')}`;
      const [newVendor] = await db.insert(vendors)
        .values({ ...parsed.data, vendorNumber } as any)
        .returning();
      return res.status(201).json(newVendor);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Vendors API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
