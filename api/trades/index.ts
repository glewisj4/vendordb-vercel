import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { trades, insertTradeSchema } from '../_lib/schema';
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
    // Single trade operations
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const [trade] = await db.select().from(trades).where(eq(trades.id, id));
        if (!trade) {
          return res.status(404).json({ error: 'Trade not found' });
        }
        return res.status(200).json(trade);
      }

      if (req.method === 'PATCH' || req.method === 'PUT') {
        const [updated] = await db.update(trades)
          .set({ ...req.body, updatedAt: new Date() } as any)
          .where(eq(trades.id, id))
          .returning();
        if (!updated) {
          return res.status(404).json({ error: 'Trade not found' });
        }
        return res.status(200).json(updated);
      }

      if (req.method === 'DELETE') {
        const [deleted] = await db.delete(trades)
          .where(eq(trades.id, id))
          .returning();
        if (!deleted) {
          return res.status(404).json({ error: 'Trade not found' });
        }
        return res.status(200).json({ success: true });
      }
    }

    // List operations
    if (req.method === 'GET') {
      const result = await db.select().from(trades).orderBy(desc(trades.createdAt));
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const parsed = insertTradeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const [newTrade] = await db.insert(trades)
        .values(parsed.data as any)
        .returning();
      return res.status(201).json(newTrade);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Trades API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
