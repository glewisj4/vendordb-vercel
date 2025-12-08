import { pgTable, text, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const phoneContactSchema = z.object({
  number: z.string(),
  label: z.string(),
  extension: z.string().optional(),
});

export const emailContactSchema = z.object({
  address: z.string(),
  label: z.string(),
});

export type PhoneContact = z.infer<typeof phoneContactSchema>;
export type EmailContact = z.infer<typeof emailContactSchema>;

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  vendorNumber: text("vendor_number").unique(),
  companyName: text("company_name").notNull(),
  phone: text("phone"),
  phoneExtension: text("phone_extension"),
  fax: text("fax"),
  email: text("email"),
  website: text("website"),
  address: text("address"),
  notes: text("notes"),
  categories: text("categories").array(),
  services: text("services").array(),
  phones: json("phones").$type<PhoneContact[]>(),
  emails: json("emails").$type<EmailContact[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const representatives = pgTable("representatives", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  vendorName: text("vendor_name"),
  name: text("name").notNull(),
  position: text("position"),
  cellPhone: text("cell_phone"),
  cellPhoneExtension: text("cell_phone_extension"),
  officePhone: text("office_phone"),
  officePhoneExtension: text("office_phone_extension"),
  fax: text("fax"),
  email: text("email"),
  notes: text("notes"),
  phones: json("phones").$type<PhoneContact[]>(),
  emails: json("emails").$type<EmailContact[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  name: text("name").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"),
  level: text("level").default("1"),
  subcategories: text("subcategories").array(),
  vendorCount: integer("vendor_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  name: text("name").notNull(),
  description: text("description"),
  vendorCount: integer("vendor_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  name: text("name").notNull(),
  description: text("description"),
  isGeneric: boolean("is_generic").default(false),
  industry: text("industry"),
  logo: text("logo"),
  website: text("website"),
  templateId: varchar("template_id"),
  parentBrandId: varchar("parent_brand_id"),
  vendorCount: integer("vendor_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const proCustomers = pgTable("pro_customers", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  phoneExtension: text("phone_extension"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  trades: text("trades").array(),
  preferredBrands: text("preferred_brands").array(),
  notes: text("notes"),
  paymentPreference: text("payment_preference"),
  mvpRewardsProgram: boolean("mvp_rewards_program").default(false),
  phones: json("phones").$type<PhoneContact[]>(),
  emails: json("emails").$type<EmailContact[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  name: text("name").notNull().unique(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRepresentativeSchema = createInsertSchema(representatives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProCustomerSchema = createInsertSchema(proCustomers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, createdAt: true });

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type ProCustomer = typeof proCustomers.$inferSelect;
export type InsertProCustomer = z.infer<typeof insertProCustomerSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
