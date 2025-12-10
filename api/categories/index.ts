import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { categories, insertCategorySchema } from '../_lib/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // Single category operations
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const [category] = await db.select().from(categories).where(eq(categories.id, id));
        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }
        return res.status(200).json(category);
      }

      if (req.method === 'PATCH' || req.method === 'PUT') {
        const [updated] = await db.update(categories)
          .set({ ...req.body, updatedAt: new Date() } as any)
          .where(eq(categories.id, id))
          .returning();
        if (!updated) {
          return res.status(404).json({ error: 'Category not found' });
        }
        return res.status(200).json(updated);
      }

      if (req.method === 'DELETE') {
        const [deleted] = await db.delete(categories)
          .where(eq(categories.id, id))
          .returning();
        if (!deleted) {
          return res.status(404).json({ error: 'Category not found' });
        }
        return res.status(200).json({ success: true });
      }
    }

    // List operations
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
        .values(parsed.data as any)
        .returning();
      return res.status(201).json(newCategory);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
