import { db } from "./db";
import { customers, motorcycles, rentals, rentalInstallments, payments, maintenanceOrders } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingMotorcycles = await db.select().from(motorcycles).limit(1);
    if (existingMotorcycles.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    // Create sample customers
    const [customer1, customer2, customer3] = await db.insert(customers).values([
      {
        name: "João Silva Santos",
        cpf: "123.456.789-00",
        rg: "12.345.678-9",
        birthDate: "1990-05-15",
        phone: "(11) 99999-1111",
        email: "joao.silva@email.com",
        address: "Rua das Flores, 123 - Centro, São Paulo - SP, 01234-567",
        emergencyContact: "Maria Santos",
        emergencyPhone: "(11) 98888-1111",
        score: "reliable",
        notes: "Cliente pontual, sempre paga em dia.",
      },
      {
        name: "Carlos Eduardo Oliveira",
        cpf: "987.654.321-00",
        rg: "98.765.432-1",
        birthDate: "1985-10-20",
        phone: "(11) 99999-2222",
        email: "carlos.oliveira@email.com",
        address: "Av. Paulista, 456 - Bela Vista, São Paulo - SP, 01310-100",
        emergencyContact: "Ana Oliveira",
        emergencyPhone: "(11) 98888-2222",
        score: "neutral",
        notes: "",
      },
      {
        name: "Pedro Henrique Costa",
        cpf: "456.789.123-00",
        rg: "45.678.912-3",
        birthDate: "1992-03-08",
        phone: "(11) 99999-3333",
        email: "pedro.costa@email.com",
        address: "Rua Augusta, 789 - Consolação, São Paulo - SP, 01305-100",
        emergencyContact: "José Costa",
        emergencyPhone: "(11) 98888-3333",
        score: "alert",
        notes: "Atrasou pagamento em contrato anterior.",
      },
    ]).returning();

    // Create sample motorcycles
    const [moto1, moto2, moto3] = await db.insert(motorcycles).values([
      {
        plate: "ABC-1234",
        chassis: "9BWZZZ377VT004251",
        renavam: "123456789",
        brand: "Honda",
        model: "CG 160 Titan",
        year: 2023,
        color: "Vermelha",
        status: "rented",
        dailyRate: "45.00",
        weeklyRate: "280.00",
        monthlyRate: "1000.00",
        deposit: "500.00",
        unlimitedKm: true,
        currentKm: 15000,
        trackerId: "GPS-001",
        trackerActive: true,
        lastLatitude: "-23.550520",
        lastLongitude: "-46.633308",
        lastAddress: "Av. Paulista, 1000 - São Paulo, SP",
      },
      {
        plate: "DEF-5678",
        chassis: "9BWZZZ377VT004252",
        renavam: "987654321",
        brand: "Yamaha",
        model: "Factor 150",
        year: 2022,
        color: "Preta",
        status: "available",
        dailyRate: "40.00",
        weeklyRate: "250.00",
        monthlyRate: "900.00",
        deposit: "450.00",
        unlimitedKm: true,
        currentKm: 22000,
        trackerId: "GPS-002",
        trackerActive: true,
        lastLatitude: "-23.557821",
        lastLongitude: "-46.662508",
        lastAddress: "Rua Oscar Freire, 500 - São Paulo, SP",
      },
      {
        plate: "GHI-9012",
        chassis: "9BWZZZ377VT004253",
        renavam: "456789123",
        brand: "Honda",
        model: "Biz 125",
        year: 2024,
        color: "Branca",
        status: "maintenance",
        dailyRate: "35.00",
        weeklyRate: "220.00",
        monthlyRate: "800.00",
        deposit: "400.00",
        unlimitedKm: false,
        kmLimit: 100,
        currentKm: 5000,
        trackerId: "GPS-003",
        trackerActive: false,
      },
    ]).returning();

    // Create sample rental
    const today = new Date();
    const startDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const expectedEndDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

    const [rental1] = await db.insert(rentals).values([
      {
        customerId: customer1.id,
        motorcycleId: moto1.id,
        startDate: startDate.toISOString().split('T')[0],
        expectedEndDate: expectedEndDate.toISOString().split('T')[0],
        plan: "weekly",
        rentalValue: "280.00",
        depositValue: "500.00",
        billingFrequency: "weekly",
        dueDay: 10,
        active: true,
        startKm: 14800,
        notes: "Contrato padrão semanal.",
      },
    ]).returning();

    // Create sample installments
    const dueDate1 = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueDate2 = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const dueDate3 = new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000);

    const [installment1, installment2] = await db.insert(rentalInstallments).values([
      {
        rentalId: rental1.id,
        dueDate: dueDate1.toISOString().split('T')[0],
        amount: "280.00",
        status: "paid",
        competence: "Semana 1",
      },
      {
        rentalId: rental1.id,
        dueDate: dueDate2.toISOString().split('T')[0],
        amount: "280.00",
        status: "paid",
        competence: "Semana 2",
      },
      {
        rentalId: rental1.id,
        dueDate: dueDate3.toISOString().split('T')[0],
        amount: "280.00",
        status: "pending",
        competence: "Semana 3",
      },
    ]).returning();

    // Create sample payments
    await db.insert(payments).values([
      {
        rentalId: rental1.id,
        installmentId: installment1.id,
        customerId: customer1.id,
        paymentDate: dueDate1.toISOString().split('T')[0],
        amount: "280.00",
        method: "pix",
        competence: "Semana 1",
        notes: "Pagamento pontual.",
      },
      {
        rentalId: rental1.id,
        installmentId: installment2.id,
        customerId: customer1.id,
        paymentDate: new Date(dueDate2.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: "280.00",
        method: "cash",
        competence: "Semana 2",
        notes: "Pago com 2 dias de atraso.",
      },
    ]);

    // Create sample maintenance order
    await db.insert(maintenanceOrders).values([
      {
        motorcycleId: moto3.id,
        type: "preventive",
        entryDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: "Troca de óleo, revisão de freios, ajuste de corrente",
        currentKm: 5000,
        partsCost: "150.00",
        laborCost: "100.00",
        totalCost: "250.00",
        nextMaintenanceDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextMaintenanceKm: 8000,
        notes: "Manutenção preventiva de 5.000 km",
        completed: false,
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
