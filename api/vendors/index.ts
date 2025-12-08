import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { vendors, insertVendorSchema } from '../_lib/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { search } = req.query;
      
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
        .values({ ...parsed.data, vendorNumber })
        .returning();
      
      return res.status(201).json(newVendor);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Vendors API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
