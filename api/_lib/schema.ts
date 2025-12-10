import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Type definitions for multi-contact fields
export interface PhoneContact {
  label: string;
  number: string;
  extension?: string;
}

export interface EmailContact {
  label: string;
  address: string;
}

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorNumber: varchar("vendor_number").unique(),
  companyName: text("company_name").notNull(),
  phone: text("phone"),
  phoneExtension: text("phone_extension"),
  email: text("email"),
  fax: text("fax"),
  phones: json("phones").$type<PhoneContact[]>().default([]),
  emails: json("emails").$type<EmailContact[]>().default([]),
  categories: json("categories").$type<string[]>().default([]),
  brands: json("brands").$type<string[]>().default([]),
  services: json("services").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const representatives = pgTable("representatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  position: text("position"),
  cellPhone: text("cell_phone"),
  cellPhoneExtension: text("cell_phone_extension"),
  email: text("email"),
  phones: json("phones").$type<PhoneContact[]>().default([]),
  emails: json("emails").$type<EmailContact[]>().default([]),
  vendorName: text("vendor_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PRIMARY CATEGORIES TABLE
// This is the main categories table that handles both generic and branded categories.
// - Generic categories: categoryType="generic", brandId=null (e.g., "Roofing > Shingles")
// - Branded categories: categoryType="branded", brandId=required (e.g., "GAF > Roofing > Shingles")
// Business Rules:
// 1. Generic categories can only have generic parents
// 2. Branded categories can only have branded parents with the same brandId
// 3. Paths for branded categories include brand name prefix
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  categoryType: varchar("category_type").notNull().default("generic"), // "generic" or "branded"
  brandId: varchar("brand_id"), // Required for branded categories, null for generic
  level: varchar("level").notNull().default("1"), // "1", "2", "3", etc. for depth
  parentId: varchar("parent_id"),
  path: text("path"), // e.g., "Roofing > Shingles > Asphalt" or "GAF > Roofing > Shingles"
  subcategories: json("subcategories").$type<string[]>().default([]),
  vendorCount: varchar("vendor_count").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  level: varchar("level").notNull().default("1"), // "1", "2", "3", etc. for depth
  parentId: varchar("parent_id"),
  path: text("path"), // e.g., "Delivery > Rooftop > Standard"
  subservices: json("subservices").$type<string[]>().default([]),
  vendorCount: varchar("vendor_count").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessTypes = pgTable("business_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const proCustomers = pgTable("pro_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Core Business & Contact Information
  businessName: text("business_name").notNull(),
  businessTypes: text("business_types").array().notNull().default([]), // Multiple business types per customer
  primaryContactName: text("primary_contact_name"),
  primaryContactRole: text("primary_contact_role"), // Owner, Foreman, Office Manager
  primaryContactMobile: text("primary_contact_mobile"),
  primaryContactMobileExtension: text("primary_contact_mobile_extension"),
  primaryContactEmail: text("primary_contact_email"),
  phones: json("phones").$type<PhoneContact[]>().default([]),
  emails: json("emails").$type<EmailContact[]>().default([]),
  lowesProAccountNumber: text("lowes_pro_account_number"),
  taxExemptNumber: text("tax_exempt_number"),
  preferredContactMethod: text("preferred_contact_method"), // text, call, email
  paymentPreference: text("payment_preference"), // Lowe's Pro Rewards, Lowe's Commercial Account, Other Business Credit, Non-Business Credit, Cash
  mvpRewardsProgram: boolean("mvp_rewards_program").default(false),
  
  // Trade & Project Profile
  trades: text("trades").array().notNull().default([]), // Multiple trades per customer
  secondarySpecialties: json("secondary_specialties").$type<string[]>().default([]),
  typicalProjectType: text("typical_project_type"), // Residential, Commercial, New Construction, Repair/Remodel
  currentMajorProjects: text("current_major_projects"),
  
  // Brand & Product Preferences
  powerToolPlatform: text("power_tool_platform"), // DeWalt 20V MAX, Milwaukee M18, etc.
  paintBrand: text("paint_brand"),
  paintSheen: text("paint_sheen"),
  goToColors: json("go_to_colors").$type<string[]>().default([]),
  lumberGrade: text("lumber_grade"),
  subflooring: text("subflooring"),
  drywall: text("drywall"),
  insulation: text("insulation"),
  screws: text("screws"),
  caulkSealant: text("caulk_sealant"),
  adhesive: text("adhesive"),
  sawBlades: text("saw_blades"),
  plumbingPipe: text("plumbing_pipe"),
  plumbingFittings: text("plumbing_fittings"),
  fixtureBrands: text("fixture_brands"),
  breakerBoxBrand: text("breaker_box_brand"),
  deviceBrands: text("device_brands"),
  applianceBrands: text("appliance_brands"), // Whirlpool, GE, Samsung, etc.
  preferredApplianceModels: text("preferred_appliance_models"), // Specific models they've liked
  goToItems: json("go_to_items").$type<string[]>().default([]),
  
  // Ordering & Logistics
  typicalOrderMethod: text("typical_order_method"), // call-in, email, text, walk-in
  fulfillmentPreference: text("fulfillment_preference"), // will call, delivery
  frequentDeliveryAddresses: json("frequent_delivery_addresses").$type<string[]>().default([]),
  purchasingInfluencers: text("purchasing_influencers"),
  orderFrequency: text("order_frequency"), // daily, weekly, per-project
  
  // Relationship & Service Notes
  painPoints: text("pain_points"),
  theUsual: text("the_usual"),
  communicationStyle: text("communication_style"),
  lastMajorQuoteIssue: text("last_major_quote_issue"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const proContacts = pgTable("pro_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proCustomerId: varchar("pro_customer_id").references(() => proCustomers.id).notNull(),
  name: text("name").notNull(),
  title: text("title"),
  phone: text("phone"),
  phoneExtension: text("phone_extension"),
  email: text("email"),
  phones: json("phones").$type<PhoneContact[]>().default([]),
  emails: json("emails").$type<EmailContact[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const managedProperties = pgTable("managed_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proCustomerId: varchar("pro_customer_id").references(() => proCustomers.id).notNull(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  phoneExtension: text("phone_extension"),
  phones: json("phones").$type<PhoneContact[]>().default([]),
  emails: json("emails").$type<EmailContact[]>().default([]),
  unitCount: integer("unit_count"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRepresentativeSchema = createInsertSchema(representatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => {
  // When categoryType is "branded", brandId must be provided
  if (data.categoryType === "branded" && !data.brandId) {
    return false;
  }
  // When categoryType is "generic", brandId must be null
  if (data.categoryType === "generic" && data.brandId) {
    return false;
  }
  return true;
}, {
  message: "brandId is required for branded categories and must be null for generic categories",
  path: ["brandId"],
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  isDefault: varchar("is_default").default("false"), // true for predefined trades, false for custom
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isGeneric: boolean("is_generic").default(false), // true for "Generic" or "Unbranded" categories
  industry: text("industry"), // roofing, electrical, plumbing, etc.
  logo: text("logo"), // URL to brand logo if available
  website: text("website"),
  templateId: varchar("template_id").references(() => brandTemplates.id),
  templateVersion: text("template_version"),
  vendorCount: integer("vendor_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// BRAND CATEGORY TEMPLATES TABLE
// This table is used for brand-specific category templates and automated category generation.
// Purpose: Store predefined category hierarchies for each brand (from brandTemplates)
// Relationship to categories table:
// - This table stores templates/blueprints for categories that can be generated
// - The main 'categories' table stores actual user-created categories (both generic and branded)
// - When creating branded categories, users may reference these templates but actual categories go in 'categories' table
// Note: This creates a separation between templates (brandCategories) and actual data (categories)
export const brandCategories = pgTable("brand_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  level: integer("level").notNull().default(1), // 1, 2, 3, etc. for depth
  parentId: varchar("parent_id"),
  path: text("path"), // e.g., "GAF > Roofing > Shingles > Architectural"
  vendorCount: integer("vendor_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate paths per brand
  uniqueBrandPath: unique().on(table.brandId, table.path)
}));

export const brandTemplates = pgTable("brand_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Roofing Brand Template", "Electrical Brand Template"
  industry: text("industry").notNull(), // roofing, electrical, plumbing, etc.
  description: text("description"),
  template: json("template").$type<{
    categories: {
      name: string;
      description?: string;
      subcategories?: {
        name: string;
        description?: string;
        subcategories?: any[];
      }[];
    }[];
  }>(), // JSON structure for the category hierarchy
  version: text("version").default("1.0"),
  isDefault: boolean("is_default").default(false), // true for system templates
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorBrands = pgTable("vendor_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  brandId: varchar("brand_id").references(() => brands.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProCustomerSchema = createInsertSchema(proCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProContactSchema = createInsertSchema(proContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManagedPropertySchema = createInsertSchema(managedProperties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessTypeSchema = createInsertSchema(businessTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandCategorySchema = createInsertSchema(brandCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandTemplateSchema = createInsertSchema(brandTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorBrandSchema = createInsertSchema(vendorBrands).omit({
  id: true,
  createdAt: true,
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;
export type Representative = typeof representatives.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertProCustomer = z.infer<typeof insertProCustomerSchema>;
export type ProCustomer = typeof proCustomers.$inferSelect;

export type InsertProContact = z.infer<typeof insertProContactSchema>;
export type ProContact = typeof proContacts.$inferSelect;

export type InsertManagedProperty = z.infer<typeof insertManagedPropertySchema>;
export type ManagedProperty = typeof managedProperties.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

export type InsertBusinessType = z.infer<typeof insertBusinessTypeSchema>;
export type BusinessType = typeof businessTypes.$inferSelect;

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

export type InsertBrandCategory = z.infer<typeof insertBrandCategorySchema>;
export type BrandCategory = typeof brandCategories.$inferSelect;

export type InsertBrandTemplate = z.infer<typeof insertBrandTemplateSchema>;
export type BrandTemplate = typeof brandTemplates.$inferSelect;

export type InsertVendorBrand = z.infer<typeof insertVendorBrandSchema>;
export type VendorBrand = typeof vendorBrands.$inferSelect;

// Strong typing for brand vendor reconciliation
export interface BrandImpactPreview {
  vendorId: string;
  vendorName: string;
  adds: string[];
  removes: string[];
}
