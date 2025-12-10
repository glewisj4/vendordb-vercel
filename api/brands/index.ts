import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { brands, insertBrandSchema } from '../_lib/schema';
import { eq, ilike, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, search, industry } = req.query;

  try {
    // Single brand operations
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const [brand] = await db.select().from(brands).where(eq(brands.id, id));
        if (!brand) {
          return res.status(404).json({ error: 'Brand not found' });
        }
        return res.status(200).json(brand);
      }

      if (req.method === 'PATCH' || req.method === 'PUT') {
        const [updated] = await db.update(brands)
          .set({ ...req.body, updatedAt: new Date() } as any)
          .where(eq(brands.id, id))
          .returning();
        if (!updated) {
          return res.status(404).json({ error: 'Brand not found' });
        }
        return res.status(200).json(updated);
      }

      if (req.method === 'DELETE') {
        const [deleted] = await db.delete(brands)
          .where(eq(brands.id, id))
          .returning();
        if (!deleted) {
          return res.status(404).json({ error: 'Brand not found' });
        }
        return res.status(200).json({ success: true });
      }
    }

    // List operations
    if (req.method === 'GET') {
      let result;
      if (industry && typeof industry === 'string') {
        result = await db.select().from(brands)
          .where(eq(brands.industry, industry))
          .orderBy(desc(brands.createdAt));
      } else if (search && typeof search === 'string') {
        result = await db.select().from(brands)
          .where(ilike(brands.name, `%${search}%`))
          .orderBy(desc(brands.createdAt));
      } else {
        result = await db.select().from(brands).orderBy(desc(brands.createdAt));
      }
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const parsed = insertBrandSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const [newBrand] = await db.insert(brands)
        .values(parsed.data as any)
        .returning();
      return res.status(201).json(newBrand);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Brands API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
