import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { services, insertServiceSchema } from '../_lib/schema';
import { desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const result = await db.select().from(services).orderBy(desc(services.createdAt));
      return res.status(200).json(result);
    }
    
    if (req.method === 'POST') {
      const parsed = insertServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const [newService] = await db.insert(services)
        .values(parsed.data)
        .returning();
      
      return res.status(201).json(newService);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Services API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
