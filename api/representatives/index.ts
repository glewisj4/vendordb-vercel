import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { representatives, insertRepresentativeSchema } from '../_lib/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { search, vendorId } = req.query;
      
      let result;
      if (vendorId && typeof vendorId === 'string') {
        result = await db.select().from(representatives)
          .where(eq(representatives.vendorId, vendorId))
          .orderBy(desc(representatives.createdAt));
      } else if (search && typeof search === 'string') {
        result = await db.select().from(representatives)
          .where(or(
            ilike(representatives.name, `%${search}%`),
            ilike(representatives.vendorName, `%${search}%`)
          ))
          .orderBy(desc(representatives.createdAt));
      } else {
        result = await db.select().from(representatives).orderBy(desc(representatives.createdAt));
      }
      
      return res.status(200).json(result);
    }
    
    if (req.method === 'POST') {
      const parsed = insertRepresentativeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const [newRep] = await db.insert(representatives)
        .values(parsed.data)
        .returning();
      
      return res.status(201).json(newRep);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Representatives API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
