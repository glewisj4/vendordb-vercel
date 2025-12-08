import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { vendors, insertVendorSchema } from '../_lib/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid vendor ID' });
  }

  try {
    if (req.method === 'GET') {
      const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
      
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      return res.status(200).json(vendor);
    }
    
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const parsed = insertVendorSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const [updated] = await db.update(vendors)
        .set({ ...parsed.data, updatedAt: new Date() })
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
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Vendor API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
