import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { brands, insertBrandSchema } from '../_lib/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { search, industry } = req.query;
      
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
        .values(parsed.data)
        .returning();
      
      return res.status(201).json(newBrand);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Brands API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
