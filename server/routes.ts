import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertCustomerSchema, insertMotorcycleSchema, insertRentalSchema, insertPaymentSchema, insertMaintenanceOrderSchema, insertServiceCatalogSchema, insertFixedCostSchema, insertAllowedEmailSchema, insertExtraExpenseSchema, insertExtraRevenueSchema, insertContractTemplateSchema, insertCustomerDebitSchema } from "@shared/schema";
import { z } from "zod";

function getTodayBrazil(): string {
  const now = new Date();
  const brDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const year = brDate.getFullYear();
  const month = String(brDate.getMonth() + 1).padStart(2, "0");
  const day = String(brDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/overdue-rentals", isAuthenticated, async (req, res) => {
    try {
      const allRentals = await storage.getRentals();
      const allInstallments = await storage.getAllInstallments();
      const todayStr = getTodayBrazil();

      const overdueByRental: Record<string, {
        rentalId: string;
        customerId: string;
        customerName: string;
        customerPhone: string;
        motorcyclePlate: string;
        motorcycleBrandModel: string;
        plan: string;
        overdueCount: number;
        overdueAmount: number;
        oldestDueDate: string;
        oldestInstallmentId: string;
        oldestInstallmentAmount: number;
        overdueInstallments: Array<{ id: string; dueDate: string; amount: number }>;
      }> = {};

      for (const inst of allInstallments) {
        if (inst.status === "paid") continue;
        const instDate = String(inst.dueDate).slice(0, 10);
        if (instDate >= todayStr) continue;

        const rental = allRentals.find(r => r.id === inst.rentalId);
        if (!rental || !rental.active) continue;

        if (!overdueByRental[rental.id]) {
          overdueByRental[rental.id] = {
            rentalId: rental.id,
            customerId: rental.customerId,
            customerName: rental.customer?.name || "Cliente",
            customerPhone: rental.customer?.phone || "",
            motorcyclePlate: rental.motorcycle?.plate || "",
            motorcycleBrandModel: `${rental.motorcycle?.brand || ""} ${rental.motorcycle?.model || ""}`.trim(),
            plan: rental.plan,
            overdueCount: 0,
            overdueAmount: 0,
            oldestDueDate: inst.dueDate,
            oldestInstallmentId: inst.id,
            oldestInstallmentAmount: Number(inst.amount) || 0,
            overdueInstallments: [],
          };
        }

        overdueByRental[rental.id].overdueCount += 1;
        overdueByRental[rental.id].overdueAmount += Number(inst.amount) || 0;
        overdueByRental[rental.id].overdueInstallments.push({
          id: inst.id,
          dueDate: inst.dueDate,
          amount: Number(inst.amount) || 0,
        });

        if (new Date(inst.dueDate) < new Date(overdueByRental[rental.id].oldestDueDate)) {
          overdueByRental[rental.id].oldestDueDate = inst.dueDate;
          overdueByRental[rental.id].oldestInstallmentId = inst.id;
          overdueByRental[rental.id].oldestInstallmentAmount = Number(inst.amount) || 0;
        }
      }

      for (const key of Object.keys(overdueByRental)) {
        overdueByRental[key].overdueInstallments.sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
      }

      const result = Object.values(overdueByRental).sort(
        (a, b) => new Date(a.oldestDueDate).getTime() - new Date(b.oldestDueDate).getTime()
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching overdue rentals:", error);
      res.status(500).json({ message: "Failed to fetch overdue rentals" });
    }
  });

  app.get("/api/dashboard/due-today", isAuthenticated, async (req, res) => {
    try {
      const allRentals = await storage.getRentals();
      const allInstallments = await storage.getAllInstallments();
      const today = getTodayBrazil();

      const dueTodayByRental: Record<string, {
        rentalId: string;
        customerId: string;
        customerName: string;
        customerPhone: string;
        motorcyclePlate: string;
        motorcycleBrandModel: string;
        plan: string;
        installments: Array<{ id: string; dueDate: string; amount: number; status: string }>;
        totalAmount: number;
      }> = {};

      for (const inst of allInstallments) {
        if (inst.status === "paid") continue;
        const instDate = String(inst.dueDate).slice(0, 10);
        if (instDate !== today) continue;

        const rental = allRentals.find(r => r.id === inst.rentalId);
        if (!rental || !rental.active) continue;

        if (!dueTodayByRental[rental.id]) {
          dueTodayByRental[rental.id] = {
            rentalId: rental.id,
            customerId: rental.customerId,
            customerName: rental.customer?.name || "Cliente",
            customerPhone: rental.customer?.phone || "",
            motorcyclePlate: rental.motorcycle?.plate || "",
            motorcycleBrandModel: `${rental.motorcycle?.brand || ""} ${rental.motorcycle?.model || ""}`.trim(),
            plan: rental.plan,
            installments: [],
            totalAmount: 0,
          };
        }

        dueTodayByRental[rental.id].installments.push({
          id: inst.id,
          dueDate: instDate,
          amount: Number(inst.amount) || 0,
          status: inst.status,
        });
        dueTodayByRental[rental.id].totalAmount += Number(inst.amount) || 0;
      }

      const result = Object.values(dueTodayByRental).sort(
        (a, b) => a.customerName.localeCompare(b.customerName)
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching due today:", error);
      res.status(500).json({ message: "Failed to fetch due today" });
    }
  });

  // Customers routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.birthDate === "") body.birthDate = null;
      if (body.rg === "") body.rg = null;
      if (body.email === "") body.email = null;
      if (body.address === "") body.address = null;
      if (body.emergencyContact === "") body.emergencyContact = null;
      if (body.emergencyPhone === "") body.emergencyPhone = null;
      if (body.notes === "") body.notes = null;
      const validated = insertCustomerSchema.parse(body);
      const customer = await storage.createCustomer(validated);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error?.code === "23505" || error?.constraint?.includes("unique")) {
        return res.status(409).json({ message: "CPF já cadastrado no sistema" });
      }
      if (error?.code === "22007" || error?.message?.includes("invalid input syntax for type date")) {
        return res.status(400).json({ message: "Data inválida. Verifique os campos de data." });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const cleanData = { ...req.body };
      if (cleanData.birthDate === "") cleanData.birthDate = null;
      if (cleanData.rg === "") cleanData.rg = null;
      if (cleanData.email === "") cleanData.email = null;
      if (cleanData.address === "") cleanData.address = null;
      if (cleanData.emergencyContact === "") cleanData.emergencyContact = null;
      if (cleanData.emergencyPhone === "") cleanData.emergencyPhone = null;
      if (cleanData.notes === "") cleanData.notes = null;
      const customer = await storage.updateCustomer(id, cleanData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      if (error?.code === "23505" || error?.constraint?.includes("unique")) {
        return res.status(409).json({ message: "CPF já cadastrado no sistema" });
      }
      if (error?.code === "22007" || error?.message?.includes("invalid input syntax for type date")) {
        return res.status(400).json({ message: "Data inválida. Verifique os campos de data." });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const hasActiveRentals = (await storage.getRentals()).some(
        (r) => r.customerId === id && r.active
      );
      if (hasActiveRentals) {
        return res.status(400).json({ message: "Não é possível excluir um cliente com aluguéis ativos" });
      }
      const deleted = await storage.deleteCustomer(id);
      if (!deleted) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json({ message: "Cliente excluído com sucesso" });
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      if (error?.code === "23503") {
        return res.status(400).json({ message: "Não é possível excluir este cliente pois existem registros vinculados a ele" });
      }
      res.status(500).json({ message: "Falha ao excluir cliente" });
    }
  });

  // Motorcycles routes
  app.get("/api/motorcycles", isAuthenticated, async (req, res) => {
    try {
      const motorcycles = await storage.getMotorcycles();
      res.json(motorcycles);
    } catch (error) {
      console.error("Error fetching motorcycles:", error);
      res.status(500).json({ message: "Failed to fetch motorcycles" });
    }
  });

  app.get("/api/motorcycles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const motorcycle = await storage.getMotorcycle(id);
      if (!motorcycle) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      res.json(motorcycle);
    } catch (error) {
      console.error("Error fetching motorcycle:", error);
      res.status(500).json({ message: "Failed to fetch motorcycle" });
    }
  });

  app.post("/api/motorcycles", isAuthenticated, async (req, res) => {
    try {
      const validated = insertMotorcycleSchema.parse(req.body);
      const motorcycle = await storage.createMotorcycle(validated);
      res.status(201).json(motorcycle);
    } catch (error) {
      console.error("Error creating motorcycle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create motorcycle" });
    }
  });

  app.patch("/api/motorcycles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const motorcycle = await storage.updateMotorcycle(id, req.body);
      if (!motorcycle) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      res.json(motorcycle);
    } catch (error) {
      console.error("Error updating motorcycle:", error);
      res.status(500).json({ message: "Failed to update motorcycle" });
    }
  });

  // Rentals routes
  app.get("/api/rentals", isAuthenticated, async (req, res) => {
    try {
      const rentals = await storage.getRentals();
      res.json(rentals);
    } catch (error) {
      console.error("Error fetching rentals:", error);
      res.status(500).json({ message: "Failed to fetch rentals" });
    }
  });

  app.get("/api/rentals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const rental = await storage.getRental(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      res.json(rental);
    } catch (error) {
      console.error("Error fetching rental:", error);
      res.status(500).json({ message: "Failed to fetch rental" });
    }
  });

  app.post("/api/rentals", isAuthenticated, async (req, res) => {
    try {
      const validated = insertRentalSchema.parse(req.body);

      const existingRentals = await storage.getRentals();
      const activeOnSameMoto = existingRentals.find(
        r => r.motorcycleId === validated.motorcycleId && r.active
      );
      if (activeOnSameMoto) {
        return res.status(400).json({
          message: "Esta moto já possui um aluguel ativo. Encerre o aluguel atual antes de criar um novo."
        });
      }

      const rental = await storage.createRental(validated);
      res.status(201).json(rental);
    } catch (error) {
      console.error("Error creating rental:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rental" });
    }
  });

  app.patch("/api/rentals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const rental = await storage.updateRental(id, req.body);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      res.json(rental);
    } catch (error) {
      console.error("Error updating rental:", error);
      res.status(500).json({ message: "Failed to update rental" });
    }
  });

  app.patch("/api/rentals/:id/end", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { actualEndDate, endKm, returnNotes } = req.body;
      const rental = await storage.endRental(id, actualEndDate, endKm, returnNotes);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      res.json(rental);
    } catch (error) {
      console.error("Error ending rental:", error);
      res.status(500).json({ message: "Failed to end rental" });
    }
  });

  // Installments routes
  app.get("/api/installments", isAuthenticated, async (req, res) => {
    try {
      const installments = await storage.getAllInstallments();
      res.json(installments);
    } catch (error) {
      console.error("Error fetching installments:", error);
      res.status(500).json({ message: "Failed to fetch installments" });
    }
  });

  app.get("/api/rentals/:id/installments", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const installments = await storage.getInstallmentsByRental(id);
      res.json(installments);
    } catch (error) {
      console.error("Error fetching rental installments:", error);
      res.status(500).json({ message: "Failed to fetch rental installments" });
    }
  });

  app.patch("/api/installments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const installment = await storage.updateInstallment(id, req.body);
      if (!installment) {
        return res.status(404).json({ message: "Installment not found" });
      }
      res.json(installment);
    } catch (error) {
      console.error("Error updating installment:", error);
      res.status(500).json({ message: "Failed to update installment" });
    }
  });

  // Payments routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments/batch", isAuthenticated, async (req, res) => {
    try {
      const { rentalId, customerId, method, installments } = req.body;
      if (!Array.isArray(installments) || installments.length === 0) {
        return res.status(400).json({ message: "No installments provided" });
      }
      const results = [];
      for (const inst of installments) {
        const today = getTodayBrazil();
        const payment = await storage.createPayment({
          rentalId,
          customerId,
          installmentId: inst.id,
          paymentDate: today,
          amount: String(inst.amount),
          method,
        });
        results.push(payment);
      }
      res.status(201).json(results);
    } catch (error) {
      console.error("Error creating batch payments:", error);
      res.status(500).json({ message: "Failed to create payments" });
    }
  });

  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const validated = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validated);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.delete("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const keepInstallment = req.query.keepInstallment !== "false";
      const deleted = await storage.deletePayment(id, keepInstallment);
      if (!deleted) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }
      res.json({ message: "Pagamento excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Falha ao excluir pagamento" });
    }
  });

  // Maintenance routes
  app.get("/api/maintenance", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getMaintenanceOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching maintenance orders:", error);
      res.status(500).json({ message: "Failed to fetch maintenance orders" });
    }
  });

  app.post("/api/maintenance", isAuthenticated, async (req, res) => {
    try {
      const validated = insertMaintenanceOrderSchema.parse(req.body);
      const order = await storage.createMaintenanceOrder(validated);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating maintenance order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create maintenance order" });
    }
  });

  app.patch("/api/maintenance/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { items, partsCost, laborCost, notes, type, entryDate, exitDate, currentKm, nextMaintenanceDate, nextMaintenanceKm } = req.body;
      const updateData: Record<string, any> = {};
      if (items !== undefined) updateData.items = items;
      if (partsCost !== undefined) updateData.partsCost = partsCost;
      if (laborCost !== undefined) updateData.laborCost = laborCost;
      if (notes !== undefined) updateData.notes = notes;
      if (type !== undefined) updateData.type = type;
      if (entryDate !== undefined) updateData.entryDate = entryDate;
      if (exitDate !== undefined) updateData.exitDate = exitDate;
      if (currentKm !== undefined) updateData.currentKm = currentKm;
      if (nextMaintenanceDate !== undefined) updateData.nextMaintenanceDate = nextMaintenanceDate;
      if (nextMaintenanceKm !== undefined) updateData.nextMaintenanceKm = nextMaintenanceKm;
      if (partsCost !== undefined || laborCost !== undefined) {
        const existing = await storage.getMaintenanceOrder(id);
        const p = Number(partsCost ?? existing?.partsCost ?? 0);
        const l = Number(laborCost ?? existing?.laborCost ?? 0);
        updateData.totalCost = String(p + l);
      }
      const order = await storage.updateMaintenanceOrder(id, updateData);
      if (!order) return res.status(404).json({ message: "Ordem não encontrada" });
      res.json(order);
    } catch (error) {
      console.error("Error updating maintenance order:", error);
      res.status(500).json({ message: "Falha ao atualizar ordem de manutenção" });
    }
  });

  app.patch("/api/maintenance/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { exitDate } = req.body;
      const order = await storage.completeMaintenanceOrder(id, exitDate);
      if (!order) {
        return res.status(404).json({ message: "Maintenance order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error completing maintenance order:", error);
      res.status(500).json({ message: "Failed to complete maintenance order" });
    }
  });

  app.get("/api/maintenance/report", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getMaintenanceOrders();
      const grouped: Record<string, {
        motorcycleId: string;
        plate: string;
        brand: string;
        model: string;
        months: Record<string, {
          month: string;
          orders: Array<{
            id: string;
            type: string;
            entryDate: string;
            items: string | null;
            partsCost: string | number | null;
            laborCost: string | number | null;
            totalCost: string | number | null;
            completed: boolean;
          }>;
          totalPartsCost: number;
          totalLaborCost: number;
          totalCost: number;
        }>;
        grandTotalParts: number;
        grandTotalLabor: number;
        grandTotal: number;
      }> = {};

      for (const order of orders) {
        const motoKey = order.motorcycleId;
        if (!grouped[motoKey]) {
          grouped[motoKey] = {
            motorcycleId: order.motorcycleId,
            plate: order.motorcycle?.plate || "",
            brand: order.motorcycle?.brand || "",
            model: order.motorcycle?.model || "",
            months: {},
            grandTotalParts: 0,
            grandTotalLabor: 0,
            grandTotal: 0,
          };
        }

        const entryDate = new Date(order.entryDate);
        const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = `${String(entryDate.getMonth() + 1).padStart(2, "0")}/${entryDate.getFullYear()}`;

        if (!grouped[motoKey].months[monthKey]) {
          grouped[motoKey].months[monthKey] = {
            month: monthLabel,
            orders: [],
            totalPartsCost: 0,
            totalLaborCost: 0,
            totalCost: 0,
          };
        }

        const partsCost = Number(order.partsCost) || 0;
        const laborCost = Number(order.laborCost) || 0;
        const totalCost = Number(order.totalCost) || 0;

        grouped[motoKey].months[monthKey].orders.push({
          id: order.id,
          type: order.type,
          entryDate: order.entryDate,
          items: order.items,
          partsCost: order.partsCost,
          laborCost: order.laborCost,
          totalCost: order.totalCost,
          completed: order.completed,
        });

        grouped[motoKey].months[monthKey].totalPartsCost += partsCost;
        grouped[motoKey].months[monthKey].totalLaborCost += laborCost;
        grouped[motoKey].months[monthKey].totalCost += totalCost;
        grouped[motoKey].grandTotalParts += partsCost;
        grouped[motoKey].grandTotalLabor += laborCost;
        grouped[motoKey].grandTotal += totalCost;
      }

      const report = Object.values(grouped).map((moto) => ({
        ...moto,
        months: Object.entries(moto.months)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([, v]) => v),
      }));

      report.sort((a, b) => b.grandTotal - a.grandTotal);
      res.json(report);
    } catch (error) {
      console.error("Error generating maintenance report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.delete("/api/maintenance/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const deleted = await storage.deleteMaintenanceOrder(id);
      if (!deleted) {
        return res.status(404).json({ message: "Ordem de manutenção não encontrada" });
      }
      res.json({ message: "Ordem de manutenção excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting maintenance order:", error);
      res.status(500).json({ message: "Falha ao excluir ordem de manutenção" });
    }
  });

  app.delete("/api/rentals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const deleted = await storage.deleteRental(id);
      if (!deleted) {
        return res.status(404).json({ message: "Aluguel não encontrado" });
      }
      res.json({ message: "Aluguel excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting rental:", error);
      res.status(500).json({ message: "Falha ao excluir aluguel" });
    }
  });

  // Service Catalog routes
  app.get("/api/service-catalog", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getServiceCatalog();
      res.json(items);
    } catch (error) {
      console.error("Error fetching service catalog:", error);
      res.status(500).json({ message: "Failed to fetch service catalog" });
    }
  });

  app.post("/api/service-catalog", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertServiceCatalogSchema.parse(req.body);
      const item = await storage.createServiceCatalogItem(parsed);
      res.status(201).json(item);
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating service catalog item:", error);
      res.status(500).json({ message: "Failed to create service catalog item" });
    }
  });

  app.patch("/api/service-catalog/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertServiceCatalogSchema.partial().parse(req.body);
      const item = await storage.updateServiceCatalogItem(req.params.id as string, parsed);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      console.error("Error updating service catalog item:", error);
      res.status(500).json({ message: "Failed to update service catalog item" });
    }
  });

  app.delete("/api/service-catalog/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteServiceCatalogItem(req.params.id as string);
      if (!deleted) return res.status(404).json({ message: "Item not found" });
      res.json({ message: "Deleted" });
    } catch (error) {
      console.error("Error deleting service catalog item:", error);
      res.status(500).json({ message: "Failed to delete service catalog item" });
    }
  });

  // Fixed Costs routes
  app.get("/api/fixed-costs", isAuthenticated, async (req, res) => {
    try {
      const costs = await storage.getFixedCosts();
      res.json(costs);
    } catch (error) {
      console.error("Error fetching fixed costs:", error);
      res.status(500).json({ message: "Failed to fetch fixed costs" });
    }
  });

  app.post("/api/fixed-costs", isAuthenticated, async (req, res) => {
    try {
      const { repeatUntil, allMotorcycles, ...rest } = req.body;
      const data = insertFixedCostSchema.parse(rest);

      const allMotos = await storage.getMotorcycles();
      const targetMotorcycles = allMotorcycles
        ? allMotos.map((m) => m.id)
        : [data.motorcycleId];

      const results = [];

      for (const motoId of targetMotorcycles) {
        if (repeatUntil && typeof repeatUntil === "string") {
          const [startYear, startMonth] = data.referenceMonth.split("-").map(Number);
          const [endYear, endMonth] = repeatUntil.split("-").map(Number);
          let y = startYear;
          let m = startMonth;
          while (y < endYear || (y === endYear && m <= endMonth)) {
            const refMonth = `${y}-${String(m).padStart(2, "0")}`;
            const cost = await storage.createFixedCost({ ...data, motorcycleId: motoId, referenceMonth: refMonth });
            results.push(cost);
            m++;
            if (m > 12) { m = 1; y++; }
          }
        } else {
          const cost = await storage.createFixedCost({ ...data, motorcycleId: motoId });
          results.push(cost);
        }
      }

      res.status(201).json(results);
    } catch (error) {
      console.error("Error creating fixed cost:", error);
      res.status(500).json({ message: "Failed to create fixed cost" });
    }
  });

  app.patch("/api/fixed-costs/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id as string;
      const updateSchema = insertFixedCostSchema.partial();
      const validated = updateSchema.parse(req.body);

      const updated = await storage.updateFixedCost(id, validated);
      if (!updated) {
        return res.status(404).json({ message: "Fixed cost not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating fixed cost:", error);
      res.status(500).json({ message: "Failed to update fixed cost" });
    }
  });

  app.delete("/api/fixed-costs/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteFixedCost(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ message: "Fixed cost not found" });
      }
      res.json({ message: "Fixed cost deleted" });
    } catch (error) {
      console.error("Error deleting fixed cost:", error);
      res.status(500).json({ message: "Failed to delete fixed cost" });
    }
  });

  // Extra Revenues
  app.get("/api/extra-revenues", isAuthenticated, async (req, res) => {
    try {
      const revenues = await storage.getExtraRevenues();
      res.json(revenues);
    } catch (error) {
      console.error("Error fetching extra revenues:", error);
      res.status(500).json({ message: "Failed to fetch extra revenues" });
    }
  });

  app.post("/api/extra-revenues", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertExtraRevenueSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const revenue = await storage.createExtraRevenue(parsed.data);
      res.status(201).json(revenue);
    } catch (error) {
      console.error("Error creating extra revenue:", error);
      res.status(500).json({ message: "Failed to create extra revenue" });
    }
  });

  app.patch("/api/extra-revenues/:id", isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateExtraRevenue(req.params.id as string, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Extra revenue not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating extra revenue:", error);
      res.status(500).json({ message: "Failed to update extra revenue" });
    }
  });

  app.delete("/api/extra-revenues/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteExtraRevenue(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ message: "Extra revenue not found" });
      }
      res.json({ message: "Extra revenue deleted" });
    } catch (error) {
      console.error("Error deleting extra revenue:", error);
      res.status(500).json({ message: "Failed to delete extra revenue" });
    }
  });

  // Extra Expenses
  app.get("/api/extra-expenses", isAuthenticated, async (req, res) => {
    try {
      const expenses = await storage.getExtraExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching extra expenses:", error);
      res.status(500).json({ message: "Failed to fetch extra expenses" });
    }
  });

  app.post("/api/extra-expenses", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertExtraExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const expense = await storage.createExtraExpense(parsed.data);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating extra expense:", error);
      res.status(500).json({ message: "Failed to create extra expense" });
    }
  });

  app.patch("/api/extra-expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateExtraExpense(req.params.id as string, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Extra expense not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating extra expense:", error);
      res.status(500).json({ message: "Failed to update extra expense" });
    }
  });

  app.delete("/api/extra-expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteExtraExpense(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ message: "Extra expense not found" });
      }
      res.json({ message: "Extra expense deleted" });
    } catch (error) {
      console.error("Error deleting extra expense:", error);
      res.status(500).json({ message: "Failed to delete extra expense" });
    }
  });

  // Contract Templates
  app.get("/api/contract-templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getContractTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching contract templates:", error);
      res.status(500).json({ message: "Failed to fetch contract templates" });
    }
  });

  app.get("/api/contract-templates/active", isAuthenticated, async (req, res) => {
    try {
      const template = await storage.getActiveContractTemplate();
      if (!template) {
        return res.status(404).json({ message: "No active contract template" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching active contract template:", error);
      res.status(500).json({ message: "Failed to fetch active contract template" });
    }
  });

  app.post("/api/contract-templates", isAuthenticated, async (req, res) => {
    try {
      const { name, fileData, fileName, fileType } = req.body;
      if (!name || !fileData || !fileName || !fileType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const template = await storage.createContractTemplate({ name, fileData, fileName, fileType, active: true });
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating contract template:", error);
      res.status(500).json({ message: "Failed to create contract template" });
    }
  });

  app.delete("/api/contract-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteContractTemplate(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ message: "Contract template not found" });
      }
      res.json({ message: "Contract template deleted" });
    } catch (error) {
      console.error("Error deleting contract template:", error);
      res.status(500).json({ message: "Failed to delete contract template" });
    }
  });

  // Customer Debits
  app.get("/api/customer-debits", isAuthenticated, async (req, res) => {
    try {
      const debits = await storage.getCustomerDebits();
      res.json(debits);
    } catch (error) {
      console.error("Error fetching customer debits:", error);
      res.status(500).json({ message: "Failed to fetch customer debits" });
    }
  });

  app.get("/api/customer-debits/by-customer/:customerId", isAuthenticated, async (req, res) => {
    try {
      const debits = await storage.getDebitsByCustomer(req.params.customerId as string);
      res.json(debits);
    } catch (error) {
      console.error("Error fetching customer debits:", error);
      res.status(500).json({ message: "Failed to fetch customer debits" });
    }
  });

  app.get("/api/customer-debits/balance/:customerId", isAuthenticated, async (req, res) => {
    try {
      const debits = await storage.getDebitsByCustomer(req.params.customerId as string);
      const pending = debits.filter((d) => d.status === "pending");
      const paid = debits.filter((d) => d.status === "paid");
      const pendingBalance = pending.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const paidTotal = paid.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      res.json({ pendingBalance, paidTotal, totalDebits: debits.length });
    } catch (error) {
      console.error("Error fetching customer debit balance:", error);
      res.status(500).json({ message: "Failed to fetch customer debit balance" });
    }
  });

  app.post("/api/customer-debits", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertCustomerDebitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const debit = await storage.createCustomerDebit(parsed.data);
      res.status(201).json(debit);
    } catch (error) {
      console.error("Error creating customer debit:", error);
      res.status(500).json({ message: "Failed to create customer debit" });
    }
  });

  app.patch("/api/customer-debits/:id", isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateCustomerDebit(req.params.id as string, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Customer debit not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating customer debit:", error);
      res.status(500).json({ message: "Failed to update customer debit" });
    }
  });

  app.delete("/api/customer-debits/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteCustomerDebit(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ message: "Customer debit not found" });
      }
      res.json({ message: "Customer debit deleted" });
    } catch (error) {
      console.error("Error deleting customer debit:", error);
      res.status(500).json({ message: "Failed to delete customer debit" });
    }
  });

  // Financial Report
  app.get("/api/financial/report", isAuthenticated, async (req, res) => {
    try {
      const { period, year, month, week } = req.query;

      const allPayments = await storage.getPayments();
      const allMaintenance = await storage.getMaintenanceOrders();
      const allFixedCosts = await storage.getFixedCosts();
      const allMotorcycles = (await storage.getMotorcycles());
      const allExtraRevenues = await storage.getExtraRevenues();
      const allExtraExpenses = await storage.getExtraExpenses();

      let startDate: Date;
      let endDate: Date;
      const now = new Date();
      const y = Number(year) || now.getFullYear();
      const m = Number(month) || (now.getMonth() + 1);

      if (period === "weekly") {
        const w = Number(week) || 1;
        startDate = new Date(y, m - 1, (w - 1) * 7 + 1);
        endDate = new Date(y, m - 1, w * 7);
        if (endDate.getMonth() !== m - 1) {
          endDate = new Date(y, m, 0);
        }
      } else if (period === "annual") {
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31);
      } else {
        startDate = new Date(y, m - 1, 1);
        endDate = new Date(y, m, 0);
      }

      const filteredPayments = allPayments.filter(p => {
        const d = new Date(p.paymentDate);
        return d >= startDate && d <= endDate;
      });

      const filteredMaintenance = allMaintenance.filter(o => {
        const d = new Date(o.entryDate);
        return d >= startDate && d <= endDate;
      });

      const referenceMonths: string[] = [];
      if (period === "annual") {
        for (let i = 0; i < 12; i++) {
          referenceMonths.push(`${y}-${String(i + 1).padStart(2, "0")}`);
        }
      } else {
        referenceMonths.push(`${y}-${String(m).padStart(2, "0")}`);
      }

      const filteredFixedCosts = allFixedCosts.filter(c =>
        referenceMonths.includes(c.referenceMonth)
      );

      const filteredExtraRevenues = allExtraRevenues.filter(r => {
        const d = new Date(r.date);
        return d >= startDate && d <= endDate;
      });

      const filteredExtraExpenses = allExtraExpenses.filter(e => {
        const d = new Date(e.date);
        return d >= startDate && d <= endDate;
      });

      const rentalIncome = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const extraRevenueTotal = filteredExtraRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalIncome = rentalIncome + extraRevenueTotal;

      const maintenanceCost = filteredMaintenance.reduce((sum, o) => sum + (Number(o.totalCost) || 0), 0);
      let fixedCostTotal = filteredFixedCosts.reduce((sum, c) => sum + Number(c.amount), 0);
      if (period === "weekly") {
        fixedCostTotal = Math.round((fixedCostTotal / 4) * 100) / 100;
      }
      const extraExpenseTotal = filteredExtraExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalExpenses = maintenanceCost + fixedCostTotal + extraExpenseTotal;
      const netResult = totalIncome - totalExpenses;

      const incomeByMoto: Record<string, { plate: string; brand: string; model: string; income: number; maintenance: number; fixedCosts: number; extraExpenses: number; net: number }> = {};

      for (const moto of allMotorcycles) {
        incomeByMoto[moto.id] = {
          plate: moto.plate,
          brand: moto.brand,
          model: moto.model,
          income: 0,
          maintenance: 0,
          fixedCosts: 0,
          extraExpenses: 0,
          net: 0,
        };
      }

      const allRentals = await storage.getRentals();
      let unassignedIncome = 0;
      for (const p of filteredPayments) {
        if (p.rentalId) {
          const rental = allRentals.find(r => r.id === p.rentalId);
          if (rental && incomeByMoto[rental.motorcycleId]) {
            incomeByMoto[rental.motorcycleId].income += Number(p.amount);
          } else {
            unassignedIncome += Number(p.amount);
          }
        } else {
          unassignedIncome += Number(p.amount);
        }
      }

      for (const o of filteredMaintenance) {
        if (incomeByMoto[o.motorcycleId]) {
          incomeByMoto[o.motorcycleId].maintenance += Number(o.totalCost) || 0;
        }
      }

      for (const c of filteredFixedCosts) {
        if (incomeByMoto[c.motorcycleId]) {
          const costAmount = period === "weekly" ? Math.round((Number(c.amount) / 4) * 100) / 100 : Number(c.amount);
          incomeByMoto[c.motorcycleId].fixedCosts += costAmount;
        }
      }

      for (const e of filteredExtraExpenses) {
        if (e.motorcycleId && incomeByMoto[e.motorcycleId]) {
          incomeByMoto[e.motorcycleId].extraExpenses += Number(e.amount);
        }
      }

      for (const key of Object.keys(incomeByMoto)) {
        const m = incomeByMoto[key];
        m.net = m.income - m.maintenance - m.fixedCosts - m.extraExpenses;
      }

      const perMotorcycle = Object.entries(incomeByMoto)
        .map(([id, data]) => ({ motorcycleId: id, ...data }))
        .filter(m => m.income > 0 || m.maintenance > 0 || m.fixedCosts > 0 || m.extraExpenses > 0)
        .sort((a, b) => b.net - a.net);

      const paymentDetails = filteredPayments.map(p => ({
        id: p.id,
        date: p.paymentDate,
        amount: Number(p.amount),
        method: p.method,
        customerName: p.customer?.name || "Cliente",
      }));

      const maintenanceDetails = filteredMaintenance.map(o => ({
        id: o.id,
        date: o.entryDate,
        amount: Number(o.totalCost) || 0,
        items: o.items,
        motorcyclePlate: o.motorcycle?.plate || "",
        motorcycleName: `${o.motorcycle?.brand || ""} ${o.motorcycle?.model || ""}`.trim(),
      }));

      const fixedCostDetails = filteredFixedCosts.map(c => ({
        id: c.id,
        motorcycleId: c.motorcycleId,
        description: c.description,
        amount: Number(c.amount),
        referenceMonth: c.referenceMonth,
        motorcyclePlate: c.motorcycle?.plate || "",
        motorcycleName: `${c.motorcycle?.brand || ""} ${c.motorcycle?.model || ""}`.trim(),
      }));

      const extraRevenueDetails = filteredExtraRevenues.map(r => ({
        id: r.id,
        date: r.date,
        description: r.description,
        amount: Number(r.amount),
        category: r.category,
        notes: r.notes,
      }));

      const extraExpenseDetails = filteredExtraExpenses.map(e => ({
        id: e.id,
        date: e.date,
        description: e.description,
        amount: Number(e.amount),
        category: e.category,
        motorcycleId: e.motorcycleId,
        motorcyclePlate: e.motorcycle?.plate || "",
        motorcycleName: e.motorcycle ? `${e.motorcycle.brand} ${e.motorcycle.model}` : "",
        notes: e.notes,
      }));

      res.json({
        period: period || "monthly",
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        summary: {
          totalIncome,
          rentalIncome,
          extraRevenueTotal,
          maintenanceCost,
          fixedCostTotal,
          extraExpenseTotal,
          totalExpenses,
          netResult,
          unassignedIncome,
        },
        perMotorcycle,
        paymentDetails,
        maintenanceDetails,
        fixedCostDetails,
        extraRevenueDetails,
        extraExpenseDetails,
      });
    } catch (error) {
      console.error("Error generating financial report:", error);
      res.status(500).json({ message: "Failed to generate financial report" });
    }
  });

  // Allowed Emails (access control)
  app.get("/api/allowed-emails", isAuthenticated, async (req, res) => {
    try {
      const emails = await storage.getAllowedEmails();
      res.json(emails);
    } catch (error) {
      console.error("Error fetching allowed emails:", error);
      res.status(500).json({ message: "Failed to fetch allowed emails" });
    }
  });

  app.post("/api/allowed-emails", isAuthenticated, async (req, res) => {
    try {
      const validated = insertAllowedEmailSchema.parse(req.body);
      const email = await storage.addAllowedEmail(validated);
      res.status(201).json(email);
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(400).json({ message: "Este e-mail já está na lista" });
      }
      console.error("Error adding allowed email:", error);
      res.status(500).json({ message: "Failed to add allowed email" });
    }
  });

  app.delete("/api/allowed-emails/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteAllowedEmail(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.json({ message: "Email removed" });
    } catch (error) {
      console.error("Error deleting allowed email:", error);
      res.status(500).json({ message: "Failed to delete allowed email" });
    }
  });

  return httpServer;
}
