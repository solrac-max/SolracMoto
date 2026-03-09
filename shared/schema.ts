import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "operator", "mechanic"]);
export const motorcycleStatusEnum = pgEnum("motorcycle_status", ["available", "rented", "maintenance", "blocked"]);
export const rentalPlanEnum = pgEnum("rental_plan", ["daily", "weekly", "monthly"]);
export const paymentMethodEnum = pgEnum("payment_method", ["pix", "cash", "card", "transfer"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "pending", "overdue"]);
export const maintenanceTypeEnum = pgEnum("maintenance_type", ["preventive", "corrective"]);
export const customerScoreEnum = pgEnum("customer_score", ["reliable", "neutral", "alert"]);
export const debitStatusEnum = pgEnum("debit_status", ["pending", "paid"]);

// System Users (extends auth users with role)
export const systemUsers = pgTable("system_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authUserId: varchar("auth_user_id").notNull(),
  role: userRoleEnum("role").notNull().default("operator"),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers (Locatários)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  rg: varchar("rg"),
  birthDate: date("birth_date"),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  address: text("address"),
  emergencyContact: varchar("emergency_contact"),
  emergencyPhone: varchar("emergency_phone"),
  cnhPhoto: varchar("cnh_photo"),
  residenceProof: varchar("residence_proof"),
  score: customerScoreEnum("score").notNull().default("neutral"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Motorcycles
export const motorcycles = pgTable("motorcycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plate: varchar("plate", { length: 10 }).notNull().unique(),
  chassis: varchar("chassis").notNull(),
  renavam: varchar("renavam"),
  brand: varchar("brand").notNull(),
  model: varchar("model").notNull(),
  year: integer("year").notNull(),
  color: varchar("color").notNull(),
  status: motorcycleStatusEnum("status").notNull().default("available"),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }).notNull(),
  weeklyRate: decimal("weekly_rate", { precision: 10, scale: 2 }).notNull(),
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }).notNull(),
  deposit: decimal("deposit", { precision: 10, scale: 2 }).notNull(),
  unlimitedKm: boolean("unlimited_km").notNull().default(true),
  kmLimit: integer("km_limit"),
  currentKm: integer("current_km").notNull().default(0),
  photo: varchar("photo"),
  trackerId: varchar("tracker_id"),
  trackerActive: boolean("tracker_active").default(false),
  lastLatitude: decimal("last_latitude", { precision: 10, scale: 7 }),
  lastLongitude: decimal("last_longitude", { precision: 10, scale: 7 }),
  lastAddress: text("last_address"),
  lastLocationUpdate: timestamp("last_location_update"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rentals (Contratos de Aluguel)
export const rentals = pgTable("rentals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  motorcycleId: varchar("motorcycle_id").notNull().references(() => motorcycles.id),
  startDate: date("start_date").notNull(),
  expectedEndDate: date("expected_end_date").notNull(),
  actualEndDate: date("actual_end_date"),
  plan: rentalPlanEnum("plan").notNull(),
  rentalValue: decimal("rental_value", { precision: 10, scale: 2 }).notNull(),
  depositValue: decimal("deposit_value", { precision: 10, scale: 2 }).notNull(),
  billingFrequency: varchar("billing_frequency").notNull().default("weekly"),
  dueDay: integer("due_day"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  returnNotes: text("return_notes"),
  startKm: integer("start_km"),
  endKm: integer("end_km"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rental Installments (Parcelas)
export const rentalInstallments = pgTable("rental_installments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalId: varchar("rental_id").notNull().references(() => rentals.id),
  dueDate: date("due_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  competence: varchar("competence"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalId: varchar("rental_id").references(() => rentals.id),
  installmentId: varchar("installment_id").references(() => rentalInstallments.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  paymentDate: date("payment_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  competence: varchar("competence"),
  receipt: varchar("receipt"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Maintenance Orders
export const maintenanceOrders = pgTable("maintenance_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  motorcycleId: varchar("motorcycle_id").notNull().references(() => motorcycles.id),
  type: maintenanceTypeEnum("type").notNull(),
  entryDate: date("entry_date").notNull(),
  exitDate: date("exit_date"),
  items: text("items"),
  currentKm: integer("current_km"),
  partsCost: decimal("parts_cost", { precision: 10, scale: 2 }).default("0"),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }).default("0"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default("0"),
  nextMaintenanceDate: date("next_maintenance_date"),
  nextMaintenanceKm: integer("next_maintenance_km"),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Catalog (Catálogo de Serviços e Peças)
export const serviceCatalog = pgTable("service_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  partsCost: decimal("parts_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceCatalogSchema = createInsertSchema(serviceCatalog).omit({ id: true, createdAt: true });
export type InsertServiceCatalog = z.infer<typeof insertServiceCatalogSchema>;
export type ServiceCatalog = typeof serviceCatalog.$inferSelect;

// Fixed Costs (Custos Fixos por Veículo)
export const fixedCosts = pgTable("fixed_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  motorcycleId: varchar("motorcycle_id").notNull().references(() => motorcycles.id),
  description: varchar("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: varchar("frequency").notNull().default("monthly"),
  referenceMonth: varchar("reference_month").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertSystemUserSchema = createInsertSchema(systemUsers).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMotorcycleSchema = createInsertSchema(motorcycles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRentalSchema = createInsertSchema(rentals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRentalInstallmentSchema = createInsertSchema(rentalInstallments).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertMaintenanceOrderSchema = createInsertSchema(maintenanceOrders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFixedCostSchema = createInsertSchema(fixedCosts).omit({ id: true, createdAt: true });

// Types
export type InsertSystemUser = z.infer<typeof insertSystemUserSchema>;
export type SystemUser = typeof systemUsers.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertMotorcycle = z.infer<typeof insertMotorcycleSchema>;
export type Motorcycle = typeof motorcycles.$inferSelect;

export type InsertRental = z.infer<typeof insertRentalSchema>;
export type Rental = typeof rentals.$inferSelect;

export type InsertRentalInstallment = z.infer<typeof insertRentalInstallmentSchema>;
export type RentalInstallment = typeof rentalInstallments.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertMaintenanceOrder = z.infer<typeof insertMaintenanceOrderSchema>;
export type MaintenanceOrder = typeof maintenanceOrders.$inferSelect;

export type InsertFixedCost = z.infer<typeof insertFixedCostSchema>;
export type FixedCost = typeof fixedCosts.$inferSelect;

// Extra Revenues (Receitas Extras)
export const extraRevenues = pgTable("extra_revenues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: varchar("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  category: varchar("category").notNull().default("other"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExtraRevenueSchema = createInsertSchema(extraRevenues).omit({ id: true, createdAt: true });
export type InsertExtraRevenue = z.infer<typeof insertExtraRevenueSchema>;
export type ExtraRevenue = typeof extraRevenues.$inferSelect;

// Extra Expenses (Despesas Extras)
export const extraExpenses = pgTable("extra_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: varchar("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  category: varchar("category").notNull().default("other"),
  motorcycleId: varchar("motorcycle_id").references(() => motorcycles.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExtraExpenseSchema = createInsertSchema(extraExpenses).omit({ id: true, createdAt: true });
export type InsertExtraExpense = z.infer<typeof insertExtraExpenseSchema>;
export type ExtraExpense = typeof extraExpenses.$inferSelect;

// Contract Templates
export const contractTemplates = pgTable("contract_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  fileData: text("file_data").notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  active: boolean("active").notNull().default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({ id: true, uploadedAt: true });
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;

// Customer Debits (Débitos de Clientes)
export const customerDebits = pgTable("customer_debits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  description: varchar("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  status: debitStatusEnum("status").notNull().default("pending"),
  maintenanceOrderId: varchar("maintenance_order_id"),
  notes: text("notes"),
  paidDate: date("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerDebitSchema = createInsertSchema(customerDebits).omit({ id: true, createdAt: true });
export type InsertCustomerDebit = z.infer<typeof insertCustomerDebitSchema>;
export type CustomerDebit = typeof customerDebits.$inferSelect;

// Allowed Emails (access control)
export const allowedEmails = pgTable("allowed_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  name: varchar("name"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertAllowedEmailSchema = createInsertSchema(allowedEmails).omit({ id: true, addedAt: true });
export type InsertAllowedEmail = z.infer<typeof insertAllowedEmailSchema>;
export type AllowedEmail = typeof allowedEmails.$inferSelect;
