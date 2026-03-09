import {
  customers,
  motorcycles,
  rentals,
  rentalInstallments,
  payments,
  maintenanceOrders,
  serviceCatalog,
  fixedCosts,
  extraRevenues,
  customerDebits,
  allowedEmails,
  type Customer,
  type InsertCustomer,
  type Motorcycle,
  type InsertMotorcycle,
  type Rental,
  type InsertRental,
  type RentalInstallment,
  type InsertRentalInstallment,
  type Payment,
  type InsertPayment,
  type MaintenanceOrder,
  type InsertMaintenanceOrder,
  type ServiceCatalog,
  type InsertServiceCatalog,
  type FixedCost,
  type InsertFixedCost,
  type ExtraRevenue,
  type InsertExtraRevenue,
  type CustomerDebit,
  type InsertCustomerDebit,
  type AllowedEmail,
  type InsertAllowedEmail,
  extraExpenses,
  type ExtraExpense,
  type InsertExtraExpense,
  contractTemplates,
  type ContractTemplate,
  type InsertContractTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Motorcycles
  getMotorcycles(): Promise<Motorcycle[]>;
  getMotorcycle(id: string): Promise<Motorcycle | undefined>;
  createMotorcycle(motorcycle: InsertMotorcycle): Promise<Motorcycle>;
  updateMotorcycle(id: string, motorcycle: Partial<InsertMotorcycle>): Promise<Motorcycle | undefined>;

  // Rentals
  getRentals(): Promise<(Rental & { customer?: Customer; motorcycle?: Motorcycle })[]>;
  getRental(id: string): Promise<Rental | undefined>;
  createRental(rental: InsertRental): Promise<Rental>;
  updateRental(id: string, rental: Partial<InsertRental>): Promise<Rental | undefined>;
  endRental(id: string, actualEndDate: string, endKm?: number, returnNotes?: string): Promise<Rental | undefined>;
  deleteRental(id: string): Promise<boolean>;

  // Installments
  getAllInstallments(): Promise<(RentalInstallment & { rental?: Rental; customer?: Customer })[]>;
  getInstallmentsByRental(rentalId: string): Promise<RentalInstallment[]>;
  createInstallment(installment: InsertRentalInstallment): Promise<RentalInstallment>;
  updateInstallment(id: string, data: Partial<InsertRentalInstallment>): Promise<RentalInstallment | undefined>;
  generateInstallmentsForRental(rental: Rental, skipDueDates?: Set<string>): Promise<RentalInstallment[]>;

  // Payments
  getPayments(): Promise<(Payment & { customer?: Customer })[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  deletePayment(id: string, keepInstallmentPending?: boolean): Promise<boolean>;

  // Maintenance
  getMaintenanceOrders(): Promise<(MaintenanceOrder & { motorcycle?: Motorcycle })[]>;
  getMaintenanceOrder(id: string): Promise<MaintenanceOrder | undefined>;
  createMaintenanceOrder(order: InsertMaintenanceOrder): Promise<MaintenanceOrder>;
  updateMaintenanceOrder(id: string, order: Partial<InsertMaintenanceOrder>): Promise<MaintenanceOrder | undefined>;
  completeMaintenanceOrder(id: string, exitDate: string): Promise<MaintenanceOrder | undefined>;
  deleteMaintenanceOrder(id: string): Promise<boolean>;

  // Service Catalog
  getServiceCatalog(): Promise<ServiceCatalog[]>;
  createServiceCatalogItem(item: InsertServiceCatalog): Promise<ServiceCatalog>;
  updateServiceCatalogItem(id: string, item: Partial<InsertServiceCatalog>): Promise<ServiceCatalog | null>;
  deleteServiceCatalogItem(id: string): Promise<boolean>;

  // Fixed Costs
  getFixedCosts(): Promise<(FixedCost & { motorcycle?: Motorcycle })[]>;
  createFixedCost(cost: InsertFixedCost): Promise<FixedCost>;
  updateFixedCost(id: string, cost: Partial<InsertFixedCost>): Promise<FixedCost | null>;
  deleteFixedCost(id: string): Promise<boolean>;

  // Extra Revenues
  getExtraRevenues(): Promise<ExtraRevenue[]>;
  createExtraRevenue(revenue: InsertExtraRevenue): Promise<ExtraRevenue>;
  updateExtraRevenue(id: string, revenue: Partial<InsertExtraRevenue>): Promise<ExtraRevenue | null>;
  deleteExtraRevenue(id: string): Promise<boolean>;

  // Extra Expenses
  getExtraExpenses(): Promise<(ExtraExpense & { motorcycle?: Motorcycle })[]>;
  createExtraExpense(expense: InsertExtraExpense): Promise<ExtraExpense>;
  updateExtraExpense(id: string, expense: Partial<InsertExtraExpense>): Promise<ExtraExpense | null>;
  deleteExtraExpense(id: string): Promise<boolean>;

  // Contract Templates
  getContractTemplates(): Promise<ContractTemplate[]>;
  getActiveContractTemplate(): Promise<ContractTemplate | null>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  deleteContractTemplate(id: string): Promise<boolean>;

  // Customer Debits
  getCustomerDebits(): Promise<(CustomerDebit & { customer?: Customer })[]>;
  getDebitsByCustomer(customerId: string): Promise<CustomerDebit[]>;
  createCustomerDebit(debit: InsertCustomerDebit): Promise<CustomerDebit>;
  updateCustomerDebit(id: string, debit: Partial<InsertCustomerDebit>): Promise<CustomerDebit | null>;
  deleteCustomerDebit(id: string): Promise<boolean>;

  // Allowed Emails
  getAllowedEmails(): Promise<AllowedEmail[]>;
  isEmailAllowed(email: string): Promise<boolean>;
  addAllowedEmail(data: InsertAllowedEmail): Promise<AllowedEmail>;
  deleteAllowedEmail(id: string): Promise<boolean>;

  // Dashboard
  getDashboardStats(): Promise<{
    motorcycles: { total: number; available: number; rented: number; maintenance: number; blocked: number };
    customers: { total: number; withActiveRentals: number };
    rentals: { active: number; expiringSoon: number };
    payments: { monthlyRevenue: number; overdueCount: number; overdueAmount: number };
    maintenance: { monthlyCost: number; pendingCount: number };
    alerts: { id: string; type: string; message: string; date: string }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Customers
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  // Motorcycles
  async getMotorcycles(): Promise<Motorcycle[]> {
    await this.syncMotorcycleStatuses();
    return db.select().from(motorcycles).orderBy(desc(motorcycles.createdAt));
  }

  async getMotorcycle(id: string): Promise<Motorcycle | undefined> {
    const [motorcycle] = await db.select().from(motorcycles).where(eq(motorcycles.id, id));
    return motorcycle;
  }

  async createMotorcycle(motorcycle: InsertMotorcycle): Promise<Motorcycle> {
    const [newMotorcycle] = await db.insert(motorcycles).values(motorcycle).returning();
    return newMotorcycle;
  }

  async updateMotorcycle(id: string, motorcycle: Partial<InsertMotorcycle>): Promise<Motorcycle | undefined> {
    const [updated] = await db
      .update(motorcycles)
      .set({ ...motorcycle, updatedAt: new Date() })
      .where(eq(motorcycles.id, id))
      .returning();
    return updated;
  }

  // Rentals
  async getRentals(): Promise<(Rental & { customer?: Customer; motorcycle?: Motorcycle })[]> {
    const allRentals = await db.select().from(rentals).orderBy(desc(rentals.createdAt));
    const result = [];
    for (const rental of allRentals) {
      const [customer] = await db.select().from(customers).where(eq(customers.id, rental.customerId));
      const [motorcycle] = await db.select().from(motorcycles).where(eq(motorcycles.id, rental.motorcycleId));
      result.push({ ...rental, customer, motorcycle });
    }
    return result;
  }

  async getRental(id: string): Promise<Rental | undefined> {
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));
    return rental;
  }

  async createRental(rental: InsertRental): Promise<Rental> {
    const [newRental] = await db.insert(rentals).values(rental).returning();
    // Update motorcycle status to rented
    await db.update(motorcycles).set({ status: "rented" }).where(eq(motorcycles.id, rental.motorcycleId));
    // Generate installments automatically
    await this.generateInstallmentsForRental(newRental);
    return newRental;
  }

  async updateRental(id: string, rental: Partial<InsertRental>): Promise<Rental | undefined> {
    const [existing] = await db.select().from(rentals).where(eq(rentals.id, id));
    if (!existing) return undefined;

    const isReactivating = !existing.active && (rental.expectedEndDate || rental.startDate);
    const updateData: any = { ...rental, updatedAt: new Date() };
    if (isReactivating) {
      updateData.active = true;
      updateData.actualEndDate = null;
      updateData.endKm = null;
      updateData.returnNotes = null;
    }

    const [updated] = await db
      .update(rentals)
      .set(updateData)
      .where(eq(rentals.id, id))
      .returning();

    const motorcycleId = rental.motorcycleId || existing.motorcycleId;
    if (existing.active && rental.motorcycleId && rental.motorcycleId !== existing.motorcycleId) {
      await db.update(motorcycles).set({ status: "available" }).where(eq(motorcycles.id, existing.motorcycleId));
      await db.update(motorcycles).set({ status: "rented" }).where(eq(motorcycles.id, rental.motorcycleId));
    } else if (isReactivating) {
      await db.update(motorcycles).set({ status: "rented" }).where(eq(motorcycles.id, motorcycleId));
    }

    const scheduleChanged =
      (rental.startDate && rental.startDate !== existing.startDate) ||
      (rental.expectedEndDate && rental.expectedEndDate !== existing.expectedEndDate) ||
      (rental.billingFrequency && rental.billingFrequency !== existing.billingFrequency) ||
      (rental.rentalValue && String(rental.rentalValue) !== String(existing.rentalValue)) ||
      (rental.dueDay !== undefined && rental.dueDay !== existing.dueDay);

    if (scheduleChanged) {
      const existingInstallments = await db.select().from(rentalInstallments).where(eq(rentalInstallments.rentalId, id));
      const paidInstallments = existingInstallments.filter(inst => inst.status === "paid");
      for (const inst of existingInstallments) {
        if (inst.status !== "paid") {
          await db.delete(payments).where(eq(payments.installmentId, inst.id));
          await db.delete(rentalInstallments).where(eq(rentalInstallments.id, inst.id));
        }
      }
      const paidDueDates = new Set(paidInstallments.map(p => p.dueDate));
      await this.generateInstallmentsForRental(updated, paidDueDates);
    }

    return updated;
  }

  async deleteRental(id: string): Promise<boolean> {
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));
    if (!rental) return false;
    const rentalInstallmentsList = await db.select().from(rentalInstallments).where(eq(rentalInstallments.rentalId, id));
    for (const inst of rentalInstallmentsList) {
      await db.delete(payments).where(eq(payments.installmentId, inst.id));
    }
    await db.delete(payments).where(eq(payments.rentalId, id));
    await db.delete(rentalInstallments).where(eq(rentalInstallments.rentalId, id));
    const result = await db.delete(rentals).where(eq(rentals.id, id)).returning();
    if (result.length > 0 && rental.active) {
      await db.update(motorcycles).set({ status: "available" }).where(eq(motorcycles.id, rental.motorcycleId));
    }
    return result.length > 0;
  }

  async endRental(id: string, actualEndDate: string, endKm?: number, returnNotes?: string): Promise<Rental | undefined> {
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));
    if (!rental) return undefined;

    const [updated] = await db
      .update(rentals)
      .set({ 
        actualEndDate, 
        endKm, 
        returnNotes, 
        active: false, 
        updatedAt: new Date() 
      })
      .where(eq(rentals.id, id))
      .returning();

    // Update motorcycle status to available
    await db.update(motorcycles).set({ status: "available" }).where(eq(motorcycles.id, rental.motorcycleId));

    return updated;
  }

  // Installments
  async getAllInstallments(): Promise<(RentalInstallment & { rental?: Rental; customer?: Customer })[]> {
    const allInstallments = await db.select().from(rentalInstallments).orderBy(desc(rentalInstallments.dueDate));
    const result = [];
    for (const installment of allInstallments) {
      const [rental] = await db.select().from(rentals).where(eq(rentals.id, installment.rentalId));
      let customer;
      if (rental) {
        const [cust] = await db.select().from(customers).where(eq(customers.id, rental.customerId));
        customer = cust;
      }
      result.push({ ...installment, rental, customer });
    }
    return result;
  }

  async getInstallmentsByRental(rentalId: string): Promise<RentalInstallment[]> {
    return db.select().from(rentalInstallments).where(eq(rentalInstallments.rentalId, rentalId));
  }

  async createInstallment(installment: InsertRentalInstallment): Promise<RentalInstallment> {
    const [newInstallment] = await db.insert(rentalInstallments).values(installment).returning();
    return newInstallment;
  }

  async updateInstallment(id: string, data: Partial<InsertRentalInstallment>): Promise<RentalInstallment | undefined> {
    const [updated] = await db
      .update(rentalInstallments)
      .set(data)
      .where(eq(rentalInstallments.id, id))
      .returning();
    return updated;
  }

  async generateInstallmentsForRental(rental: Rental, skipDueDates?: Set<string>): Promise<RentalInstallment[]> {
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.expectedEndDate);
    const installments: RentalInstallment[] = [];
    
    let intervalDays: number;
    let competencePrefix: string;
    
    switch (rental.billingFrequency) {
      case "weekly":
        intervalDays = 7;
        competencePrefix = "Semana";
        break;
      case "biweekly":
        intervalDays = 14;
        competencePrefix = "Quinzena";
        break;
      case "monthly":
      default:
        intervalDays = 30;
        competencePrefix = "Mês";
        break;
    }
    
    let currentDate = new Date(startDate);
    let installmentNumber = 1;
    
    while (currentDate <= endDate) {
      // Calculate due date based on dueDay or interval from start
      let dueDate: Date;
      if (rental.dueDay && rental.billingFrequency === "monthly") {
        // For monthly billing with specific due day
        dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), rental.dueDay);
        if (dueDate <= startDate) {
          dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, rental.dueDay);
        }
      } else {
        dueDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      }
      
      const dueDateStr = dueDate.toISOString().split('T')[0];
      if (skipDueDates && skipDueDates.has(dueDateStr)) {
        if (rental.billingFrequency === "monthly") {
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
        } else {
          currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        }
        installmentNumber++;
        continue;
      }

      const [newInstallment] = await db.insert(rentalInstallments).values({
        rentalId: rental.id,
        dueDate: dueDateStr,
        amount: rental.rentalValue,
        status: "pending",
        competence: `${competencePrefix} ${installmentNumber}`,
      }).returning();
      
      installments.push(newInstallment);
      
      // Move to next period
      if (rental.billingFrequency === "monthly") {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
      } else {
        currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      }
      installmentNumber++;
    }
    
    return installments;
  }

  // Payments
  async getPayments(): Promise<(Payment & { customer?: Customer })[]> {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));
    const result = [];
    for (const payment of allPayments) {
      const [customer] = await db.select().from(customers).where(eq(customers.id, payment.customerId));
      result.push({ ...payment, customer });
    }
    return result;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    
    // If payment is linked to an installment, update installment status
    if (payment.installmentId) {
      await db
        .update(rentalInstallments)
        .set({ status: "paid" })
        .where(eq(rentalInstallments.id, payment.installmentId));
    }
    
    return newPayment;
  }

  async deletePayment(id: string, keepInstallmentPending: boolean = true): Promise<boolean> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    if (!payment) return false;
    const installmentId = payment.installmentId;
    const result = await db.delete(payments).where(eq(payments.id, id)).returning();
    if (result.length > 0 && installmentId) {
      if (keepInstallmentPending) {
        await db
          .update(rentalInstallments)
          .set({ status: "pending" })
          .where(eq(rentalInstallments.id, installmentId));
      } else {
        await db.delete(rentalInstallments).where(eq(rentalInstallments.id, installmentId));
      }
    }
    return result.length > 0;
  }

  // Maintenance
  async getMaintenanceOrders(): Promise<(MaintenanceOrder & { motorcycle?: Motorcycle })[]> {
    const allOrders = await db.select().from(maintenanceOrders).orderBy(desc(maintenanceOrders.createdAt));
    const result = [];
    for (const order of allOrders) {
      const [motorcycle] = await db.select().from(motorcycles).where(eq(motorcycles.id, order.motorcycleId));
      result.push({ ...order, motorcycle });
    }
    return result;
  }

  async getMaintenanceOrder(id: string): Promise<MaintenanceOrder | undefined> {
    const [order] = await db.select().from(maintenanceOrders).where(eq(maintenanceOrders.id, id));
    return order;
  }

  async createMaintenanceOrder(order: InsertMaintenanceOrder): Promise<MaintenanceOrder> {
    const orderData = {
      ...order,
      completed: true,
      exitDate: order.exitDate || order.entryDate,
    };
    const [newOrder] = await db.insert(maintenanceOrders).values(orderData).returning();
    return newOrder;
  }

  async updateMaintenanceOrder(id: string, order: Partial<InsertMaintenanceOrder>): Promise<MaintenanceOrder | undefined> {
    const [updated] = await db
      .update(maintenanceOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(maintenanceOrders.id, id))
      .returning();
    return updated;
  }

  async completeMaintenanceOrder(id: string, exitDate: string): Promise<MaintenanceOrder | undefined> {
    const [order] = await db.select().from(maintenanceOrders).where(eq(maintenanceOrders.id, id));
    if (!order) return undefined;

    const [updated] = await db
      .update(maintenanceOrders)
      .set({ exitDate, completed: true, updatedAt: new Date() })
      .where(eq(maintenanceOrders.id, id))
      .returning();

    // Update motorcycle status to available
    await db.update(motorcycles).set({ status: "available" }).where(eq(motorcycles.id, order.motorcycleId));

    return updated;
  }

  async deleteMaintenanceOrder(id: string): Promise<boolean> {
    const [order] = await db.select().from(maintenanceOrders).where(eq(maintenanceOrders.id, id));
    if (!order) return false;
    const result = await db.delete(maintenanceOrders).where(eq(maintenanceOrders.id, id)).returning();
    if (result.length > 0 && !order.completed) {
      await db.update(motorcycles).set({ status: "available" }).where(eq(motorcycles.id, order.motorcycleId));
    }
    return result.length > 0;
  }

  // Service Catalog
  async getServiceCatalog(): Promise<ServiceCatalog[]> {
    return await db.select().from(serviceCatalog).orderBy(serviceCatalog.category, serviceCatalog.name);
  }

  async createServiceCatalogItem(item: InsertServiceCatalog): Promise<ServiceCatalog> {
    const [result] = await db.insert(serviceCatalog).values(item).returning();
    return result;
  }

  async updateServiceCatalogItem(id: string, item: Partial<InsertServiceCatalog>): Promise<ServiceCatalog | null> {
    const [result] = await db.update(serviceCatalog).set(item).where(eq(serviceCatalog.id, id)).returning();
    return result || null;
  }

  async deleteServiceCatalogItem(id: string): Promise<boolean> {
    const result = await db.delete(serviceCatalog).where(eq(serviceCatalog.id, id)).returning();
    return result.length > 0;
  }

  // Fixed Costs
  async getFixedCosts(): Promise<(FixedCost & { motorcycle?: Motorcycle })[]> {
    const allCosts = await db.select().from(fixedCosts).orderBy(desc(fixedCosts.createdAt));
    const result = [];
    for (const cost of allCosts) {
      const [motorcycle] = await db.select().from(motorcycles).where(eq(motorcycles.id, cost.motorcycleId));
      result.push({ ...cost, motorcycle });
    }
    return result;
  }

  async createFixedCost(cost: InsertFixedCost): Promise<FixedCost> {
    const [newCost] = await db.insert(fixedCosts).values(cost).returning();
    return newCost;
  }

  async updateFixedCost(id: string, cost: Partial<InsertFixedCost>): Promise<FixedCost | null> {
    const [updated] = await db.update(fixedCosts).set(cost).where(eq(fixedCosts.id, id)).returning();
    return updated || null;
  }

  async deleteFixedCost(id: string): Promise<boolean> {
    const result = await db.delete(fixedCosts).where(eq(fixedCosts.id, id)).returning();
    return result.length > 0;
  }

  // Extra Revenues
  async getExtraRevenues(): Promise<ExtraRevenue[]> {
    return await db.select().from(extraRevenues).orderBy(desc(extraRevenues.date));
  }

  async createExtraRevenue(revenue: InsertExtraRevenue): Promise<ExtraRevenue> {
    const [result] = await db.insert(extraRevenues).values(revenue).returning();
    return result;
  }

  async updateExtraRevenue(id: string, revenue: Partial<InsertExtraRevenue>): Promise<ExtraRevenue | null> {
    const [result] = await db.update(extraRevenues).set(revenue).where(eq(extraRevenues.id, id)).returning();
    return result || null;
  }

  async deleteExtraRevenue(id: string): Promise<boolean> {
    const result = await db.delete(extraRevenues).where(eq(extraRevenues.id, id)).returning();
    return result.length > 0;
  }

  // Extra Expenses
  async getExtraExpenses(): Promise<(ExtraExpense & { motorcycle?: Motorcycle })[]> {
    const allExpenses = await db.select().from(extraExpenses).orderBy(desc(extraExpenses.date));
    const allMotorcycles = await db.select().from(motorcycles);
    const motoMap = new Map(allMotorcycles.map(m => [m.id, m]));
    return allExpenses.map(e => ({
      ...e,
      motorcycle: e.motorcycleId ? motoMap.get(e.motorcycleId) : undefined,
    }));
  }

  async createExtraExpense(expense: InsertExtraExpense): Promise<ExtraExpense> {
    const [result] = await db.insert(extraExpenses).values(expense).returning();
    return result;
  }

  async updateExtraExpense(id: string, expense: Partial<InsertExtraExpense>): Promise<ExtraExpense | null> {
    const [result] = await db.update(extraExpenses).set(expense).where(eq(extraExpenses.id, id)).returning();
    return result || null;
  }

  async deleteExtraExpense(id: string): Promise<boolean> {
    const result = await db.delete(extraExpenses).where(eq(extraExpenses.id, id)).returning();
    return result.length > 0;
  }

  // Contract Templates
  async getContractTemplates(): Promise<ContractTemplate[]> {
    return await db.select().from(contractTemplates).orderBy(desc(contractTemplates.uploadedAt));
  }

  async getActiveContractTemplate(): Promise<ContractTemplate | null> {
    const [result] = await db.select().from(contractTemplates).where(eq(contractTemplates.active, true)).orderBy(desc(contractTemplates.uploadedAt)).limit(1);
    return result || null;
  }

  async createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate> {
    await db.update(contractTemplates).set({ active: false }).where(eq(contractTemplates.active, true));
    const [result] = await db.insert(contractTemplates).values(template).returning();
    return result;
  }

  async deleteContractTemplate(id: string): Promise<boolean> {
    const result = await db.delete(contractTemplates).where(eq(contractTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Customer Debits
  async getCustomerDebits(): Promise<(CustomerDebit & { customer?: Customer })[]> {
    const allDebits = await db.select().from(customerDebits).orderBy(desc(customerDebits.date));
    const allCustomers = await db.select().from(customers);
    const customerMap = new Map(allCustomers.map(c => [c.id, c]));
    return allDebits.map(d => ({
      ...d,
      customer: customerMap.get(d.customerId),
    }));
  }

  async getDebitsByCustomer(customerId: string): Promise<CustomerDebit[]> {
    return await db.select().from(customerDebits)
      .where(eq(customerDebits.customerId, customerId))
      .orderBy(desc(customerDebits.date));
  }

  async createCustomerDebit(debit: InsertCustomerDebit): Promise<CustomerDebit> {
    const [result] = await db.insert(customerDebits).values(debit).returning();
    return result;
  }

  async updateCustomerDebit(id: string, debit: Partial<InsertCustomerDebit>): Promise<CustomerDebit | null> {
    const [result] = await db.update(customerDebits).set(debit).where(eq(customerDebits.id, id)).returning();
    return result || null;
  }

  async deleteCustomerDebit(id: string): Promise<boolean> {
    const result = await db.delete(customerDebits).where(eq(customerDebits.id, id)).returning();
    return result.length > 0;
  }

  // Allowed Emails
  async getAllowedEmails(): Promise<AllowedEmail[]> {
    return await db.select().from(allowedEmails).orderBy(desc(allowedEmails.addedAt));
  }

  async isEmailAllowed(email: string): Promise<boolean> {
    const allAllowed = await db.select().from(allowedEmails);
    if (allAllowed.length === 0) return true;
    return allAllowed.some(a => a.email.toLowerCase() === email.toLowerCase());
  }

  async addAllowedEmail(data: InsertAllowedEmail): Promise<AllowedEmail> {
    const [result] = await db.insert(allowedEmails).values({ ...data, email: data.email.toLowerCase() }).returning();
    return result;
  }

  async deleteAllowedEmail(id: string): Promise<boolean> {
    const result = await db.delete(allowedEmails).where(eq(allowedEmails.id, id)).returning();
    return result.length > 0;
  }

  // Dashboard
  async syncMotorcycleStatuses(): Promise<void> {
    const allMotorcycles = await db.select().from(motorcycles);
    const activeRentals = await db.select().from(rentals).where(eq(rentals.active, true));
    const rentedMotoIds = new Set(activeRentals.map(r => r.motorcycleId));

    for (const moto of allMotorcycles) {
      const hasActiveRental = rentedMotoIds.has(moto.id);
      if (hasActiveRental && moto.status !== "rented") {
        await db.update(motorcycles).set({ status: "rented" }).where(eq(motorcycles.id, moto.id));
      } else if (!hasActiveRental && moto.status === "rented") {
        await db.update(motorcycles).set({ status: "available" }).where(eq(motorcycles.id, moto.id));
      }
    }
  }

  async getDashboardStats() {
    await this.syncMotorcycleStatuses();
    const allMotorcycles = await db.select().from(motorcycles);
    const allCustomers = await db.select().from(customers);
    const allRentals = await db.select().from(rentals);
    const allPayments = await db.select().from(payments);
    const allMaintenance = await db.select().from(maintenanceOrders);
    const allInstallments = await db.select().from(rentalInstallments);

    const brNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const now = brNow;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Motorcycles stats
    const motorcycleStats = {
      total: allMotorcycles.length,
      available: allMotorcycles.filter(m => m.status === "available").length,
      rented: allMotorcycles.filter(m => m.status === "rented").length,
      maintenance: allMotorcycles.filter(m => m.status === "maintenance").length,
      blocked: allMotorcycles.filter(m => m.status === "blocked").length,
    };

    // Customer stats
    const activeRentals = allRentals.filter(r => r.active);
    const customersWithActiveRentals = new Set(activeRentals.map(r => r.customerId));
    const customerStats = {
      total: allCustomers.length,
      withActiveRentals: customersWithActiveRentals.size,
    };

    // Rental stats
    const expiringSoon = activeRentals.filter(r => {
      const endDate = new Date(r.expectedEndDate);
      return endDate <= sevenDaysFromNow;
    });
    const rentalStats = {
      active: activeRentals.length,
      expiringSoon: expiringSoon.length,
    };

    // Payment stats
    const monthlyPayments = allPayments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
    });
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const overdueInstallments = allInstallments.filter(i => {
      return i.status !== "paid" && i.dueDate < todayStr;
    });
    const overdueAmount = overdueInstallments.reduce((sum, i) => sum + Number(i.amount), 0);

    const paymentStats = {
      monthlyRevenue,
      overdueCount: overdueInstallments.length,
      overdueAmount,
    };

    // Maintenance stats
    const monthlyMaintenance = allMaintenance.filter(m => {
      const entryDate = new Date(m.entryDate);
      return entryDate >= startOfMonth && entryDate <= endOfMonth;
    });
    const monthlyCost = monthlyMaintenance.reduce((sum, m) => sum + Number(m.totalCost || 0), 0);
    const pendingMaintenance = allMaintenance.filter(m => !m.completed);

    const maintenanceStats = {
      monthlyCost,
      pendingCount: pendingMaintenance.length,
    };

    // Alerts
    const alerts: { id: string; type: string; message: string; date: string }[] = [];

    // Expiring rentals alerts
    expiringSoon.forEach(rental => {
      const motorcycle = allMotorcycles.find(m => m.id === rental.motorcycleId);
      const customer = allCustomers.find(c => c.id === rental.customerId);
      alerts.push({
        id: `rental-${rental.id}`,
        type: "rental_expiring",
        message: `Aluguel de ${customer?.name || "Cliente"} (${motorcycle?.plate || "Moto"}) vence em breve`,
        date: rental.expectedEndDate,
      });
    });

    // Overdue payments alerts
    overdueInstallments.slice(0, 5).forEach(installment => {
      const rental = allRentals.find(r => r.id === installment.rentalId);
      const customer = allCustomers.find(c => c.id === rental?.customerId);
      alerts.push({
        id: `payment-${installment.id}`,
        type: "payment_overdue",
        message: `Pagamento de ${customer?.name || "Cliente"} em atraso`,
        date: installment.dueDate,
      });
    });

    // Pending maintenance alerts
    pendingMaintenance.slice(0, 3).forEach(order => {
      const motorcycle = allMotorcycles.find(m => m.id === order.motorcycleId);
      alerts.push({
        id: `maintenance-${order.id}`,
        type: "maintenance_due",
        message: `Manutenção pendente: ${motorcycle?.brand || ""} ${motorcycle?.model || ""} (${motorcycle?.plate || ""})`,
        date: order.entryDate,
      });
    });

    return {
      motorcycles: motorcycleStats,
      customers: customerStats,
      rentals: rentalStats,
      payments: paymentStats,
      maintenance: maintenanceStats,
      alerts: alerts.slice(0, 10),
    };
  }
}

export const storage = new DatabaseStorage();
