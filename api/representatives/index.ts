import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { representatives, insertRepresentativeSchema } from '../_lib/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, search, vendorId } = req.query;

  try {
    // Single representative operations
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const [rep] = await db.select().from(representatives).where(eq(representatives.id, id));
        if (!rep) {
          return res.status(404).json({ error: 'Representative not found' });
        }
        return res.status(200).json(rep);
      }

      if (req.method === 'PATCH' || req.method === 'PUT') {
        const [updated] = await db.update(representatives)
          .set({ ...req.body, updatedAt: new Date() } as any)
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
    }

    // List operations
    if (req.method === 'GET') {
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
        .values(parsed.data as any)
        .returning();
      return res.status(201).json(newRep);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Representatives API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
