import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { proCustomers, insertProCustomerSchema } from '../_lib/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid customer ID' });
  }

  try {
    if (req.method === 'GET') {
      const [customer] = await db.select().from(proCustomers).where(eq(proCustomers.id, id));
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      return res.status(200).json(customer);
    }
    
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const parsed = insertProCustomerSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const [updated] = await db.update(proCustomers)
        .set({ ...parsed.data, updatedAt: new Date() } as any)
        .where(eq(proCustomers.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      return res.status(200).json(updated);
    }
    
    if (req.method === 'DELETE') {
      const [deleted] = await db.delete(proCustomers)
        .where(eq(proCustomers.id, id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Pro Customer API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
