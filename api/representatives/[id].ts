import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { representatives, insertRepresentativeSchema } from '../_lib/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid representative ID' });
  }

  try {
    if (req.method === 'GET') {
      const [rep] = await db.select().from(representatives).where(eq(representatives.id, id));
      
      if (!rep) {
        return res.status(404).json({ error: 'Representative not found' });
      }
      
      return res.status(200).json(rep);
    }
    
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const parsed = insertRepresentativeSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const [updated] = await db.update(representatives)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(representatives.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: 'Representative not found' });
      }
      
      return res.status(200).json(updated);
    }
    
    if (req.method === 'DELETE') {
      const [deleted] = await db.delete(representatives)
        .where(eq(representatives.id, id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ error: 'Representative not found' });
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Representative API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
