import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { trades, insertTradeSchema } from '../_lib/schema';
import { desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
        .values(parsed.data)
        .returning();
      
      return res.status(201).json(newTrade);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Trades API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
