import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { proCustomers, insertProCustomerSchema } from '../_lib/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { search } = req.query;
      
      let result;
      if (search && typeof search === 'string') {
        result = await db.select().from(proCustomers)
          .where(or(
            ilike(proCustomers.businessName, `%${search}%`),
            ilike(proCustomers.contactName, `%${search}%`)
          ))
          .orderBy(desc(proCustomers.createdAt));
      } else {
        result = await db.select().from(proCustomers).orderBy(desc(proCustomers.createdAt));
      }
      
      return res.status(200).json(result);
    }
    
    if (req.method === 'POST') {
      const parsed = insertProCustomerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const [newCustomer] = await db.insert(proCustomers)
        .values(parsed.data)
        .returning();
      
      return res.status(201).json(newCustomer);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Pro Customers API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
