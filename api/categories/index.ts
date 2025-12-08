import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { categories, insertCategorySchema } from '../_lib/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const result = await db.select().from(categories).orderBy(desc(categories.createdAt));
      return res.status(200).json(result);
    }
    
    if (req.method === 'POST') {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const [newCategory] = await db.insert(categories)
        .values(parsed.data)
        .returning();
      
      return res.status(201).json(newCategory);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
