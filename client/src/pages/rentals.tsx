import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  MoreHorizontal,
  XCircle,
  CheckCircle,
  Trash2,
  Pencil,
  RotateCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Rental, Customer, Motorcycle } from "@shared/schema";

const rentalFormSchema = z.object({
  customerId: z.string().min(1, "Cliente obrigatório"),
  motorcycleId: z.string().min(1, "Moto obrigatória"),
  startDate: z.string().min(1, "Data de início obrigatória"),
  expectedEndDate: z.string().min(1, "Data prevista obrigatória"),
  plan: z.enum(["daily", "weekly", "monthly"]),
  rentalValue: z.string().min(1, "Valor obrigatório"),
  depositValue: z.string().min(1, "Caução obrigatória"),
  billingFrequency: z.string().optional(),
  dueDay: z.coerce.number().min(1).max(31).optional(),
  notes: z.string().optional(),
  startKm: z.coerce.number().min(0).optional(),
});

type RentalFormValues = z.infer<typeof rentalFormSchema>;

interface RentalWithRelations extends Rental {
  customer?: Customer;
  motorcycle?: Motorcycle;
}

const planLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

function RentalForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: motorcycles } = useQuery<Motorcycle[]>({
    queryKey: ["/api/motorcycles"],
  });

  const availableMotorcycles = motorcycles?.filter(
    (m) => m.status === "available"
  );

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      customerId: "",
      motorcycleId: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      expectedEndDate: "",
      plan: "weekly",
      rentalValue: "",
      depositValue: "",
      billingFrequency: "weekly",
      dueDay: undefined,
      notes: "",
      startKm: undefined,
    },
  });

  const selectedMotorcycle = motorcycles?.find(
    (m) => m.id === form.watch("motorcycleId")
  );

  const mutation = useMutation({
    mutationFn: async (data: RentalFormValues) => {
      const payload = {
        ...data,
        billingFrequency: data.billingFrequency || "weekly",
        notes: data.notes || null,
      };
      return apiRequest("POST", "/api/rentals", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({
        title: "Aluguel criado",
        description: "Novo contrato de aluguel registrado com parcelas geradas.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o aluguel.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motorcycleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moto *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-motorcycle">
                      <SelectValue placeholder="Selecione a moto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableMotorcycles?.map((moto) => (
                      <SelectItem key={moto.id} value={moto.id}>
                        {moto.brand} {moto.model} - {moto.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Início *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-start-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expectedEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previsão Fim *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-end-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-plan">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="rentalValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Aluguel (R$) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-testid="input-rental-value"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="depositValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caução (R$) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder={
                      selectedMotorcycle
                        ? String(selectedMotorcycle.deposit)
                        : "0.00"
                    }
                    data-testid="input-deposit-value"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km Inicial</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    placeholder={
                      selectedMotorcycle
                        ? String(selectedMotorcycle.currentKm)
                        : "0"
                    }
                    data-testid="input-start-km"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="billingFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequência de Cobrança</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "weekly"}>
                  <FormControl>
                    <SelectTrigger data-testid="select-billing-frequency">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia Vencimento (Mensal)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 10"
                    data-testid="input-due-day"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Termos e condições do aluguel..."
                  className="resize-none"
                  data-testid="input-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-submit-rental"
          >
            {mutation.isPending ? "Salvando..." : "Criar Aluguel"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EditRentalForm({ rental, onSuccess }: { rental: RentalWithRelations; onSuccess: () => void }) {
  const { toast } = useToast();

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: motorcycles } = useQuery<Motorcycle[]>({
    queryKey: ["/api/motorcycles"],
  });

  const availableMotorcycles = motorcycles?.filter(
    (m) => m.status === "available" || m.id === rental.motorcycleId
  );

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      customerId: rental.customerId,
      motorcycleId: rental.motorcycleId,
      startDate: typeof rental.startDate === "string" ? rental.startDate : format(new Date(rental.startDate), "yyyy-MM-dd"),
      expectedEndDate: typeof rental.expectedEndDate === "string" ? rental.expectedEndDate : format(new Date(rental.expectedEndDate), "yyyy-MM-dd"),
      plan: rental.plan as "daily" | "weekly" | "monthly",
      rentalValue: String(rental.rentalValue),
      depositValue: String(rental.depositValue),
      billingFrequency: rental.billingFrequency || "weekly",
      dueDay: rental.dueDay ?? undefined,
      notes: rental.notes || "",
      startKm: rental.startKm ?? undefined,
    },
  });

  const selectedMotorcycle = motorcycles?.find(
    (m) => m.id === form.watch("motorcycleId")
  );

  const mutation = useMutation({
    mutationFn: async (data: RentalFormValues) => {
      const payload = {
        ...data,
        billingFrequency: data.billingFrequency || "weekly",
        notes: data.notes || null,
      };
      return apiRequest("PATCH", `/api/rentals/${rental.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({
        title: "Aluguel atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o aluguel.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-customer">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motorcycleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moto *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-motorcycle">
                      <SelectValue placeholder="Selecione a moto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableMotorcycles?.map((moto) => (
                      <SelectItem key={moto.id} value={moto.id}>
                        {moto.brand} {moto.model} - {moto.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Início *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-edit-start-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expectedEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previsão Fim *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-edit-end-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-plan">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="rentalValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Aluguel (R$) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-testid="input-edit-rental-value"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="depositValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caução (R$) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder={
                      selectedMotorcycle
                        ? String(selectedMotorcycle.deposit)
                        : "0.00"
                    }
                    data-testid="input-edit-deposit-value"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km Inicial</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    placeholder={
                      selectedMotorcycle
                        ? String(selectedMotorcycle.currentKm)
                        : "0"
                    }
                    data-testid="input-edit-start-km"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="billingFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequência de Cobrança</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "weekly"}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-billing-frequency">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia Vencimento (Mensal)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 10"
                    data-testid="input-edit-due-day"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Termos e condições do aluguel..."
                  className="resize-none"
                  data-testid="input-edit-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-submit-edit-rental"
          >
            {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function RentalsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: rentals, isLoading } = useQuery<RentalWithRelations[]>({
    queryKey: ["/api/rentals"],
  });

  const deleteRentalMutation = useMutation({
    mutationFn: async (rentalId: string) => {
      return apiRequest("DELETE", `/api/rentals/${rentalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Aluguel excluído",
        description: "O aluguel e suas parcelas foram removidos do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o aluguel.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteRental = (rental: RentalWithRelations) => {
    const msg = rental.active
      ? `Tem certeza que deseja excluir este aluguel ATIVO? A moto será liberada e todas as parcelas serão removidas.`
      : `Tem certeza que deseja excluir este aluguel e todas as suas parcelas?`;
    if (window.confirm(msg)) {
      deleteRentalMutation.mutate(rental.id);
    }
  };

  const reactivateRentalMutation = useMutation({
    mutationFn: async (rental: RentalWithRelations) => {
      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      return apiRequest("PATCH", `/api/rentals/${rental.id}`, {
        expectedEndDate: format(newEndDate, "yyyy-MM-dd"),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({
        title: "Aluguel reativado",
        description: "O contrato foi reativado com sucesso. Você pode editar as datas se necessário.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível reativar o aluguel.",
        variant: "destructive",
      });
    },
  });

  const endRentalMutation = useMutation({
    mutationFn: async (rentalId: string) => {
      return apiRequest("PATCH", `/api/rentals/${rentalId}/end`, {
        actualEndDate: format(new Date(), "yyyy-MM-dd"),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      toast({
        title: "Aluguel encerrado",
        description: "O contrato foi finalizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível encerrar o aluguel.",
        variant: "destructive",
      });
    },
  });

  const filteredRentals = rentals?.filter((rental) => {
    const matchesSearch =
      rental.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      rental.motorcycle?.plate.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && rental.active) ||
      (statusFilter === "ended" && !rental.active);
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-rentals-title">
            Aluguéis
          </h1>
          <p className="text-muted-foreground">Gerencie contratos de aluguel</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-rental">
              <Plus className="w-4 h-4 mr-2" />
              Novo Aluguel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Aluguel</DialogTitle>
            </DialogHeader>
            <RentalForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingRental} onOpenChange={(open) => { if (!open) setEditingRental(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Aluguel</DialogTitle>
            </DialogHeader>
            {editingRental && (
              <EditRentalForm
                rental={editingRental}
                onSuccess={() => setEditingRental(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou placa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-rentals"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="ended">Encerrados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRentals && filteredRentals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Moto</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="hidden lg:table-cell">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.map((rental) => (
                  <TableRow key={rental.id} data-testid={`row-rental-${rental.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {rental.customer?.name || "Cliente"}
                        </p>
                        <p className="text-sm text-muted-foreground md:hidden">
                          {rental.motorcycle?.plate}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p className="font-medium">
                          {rental.motorcycle?.brand} {rental.motorcycle?.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rental.motorcycle?.plate}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p>
                            {format(new Date(rental.startDate), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                          <p className="text-muted-foreground">
                            até{" "}
                            {format(
                              new Date(rental.expectedEndDate),
                              "dd/MM/yyyy",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(rental.rentalValue)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {planLabels[rental.plan]}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {rental.active ? (
                        <Badge
                          variant="outline"
                          className="bg-chart-2/10 text-chart-2 gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Encerrado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-actions-${rental.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingRental(rental)}
                            data-testid={`button-edit-${rental.id}`}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {rental.active ? (
                            <DropdownMenuItem
                              onClick={() => endRentalMutation.mutate(rental.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Encerrar Aluguel
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => reactivateRentalMutation.mutate(rental)}
                              data-testid={`button-reactivate-${rental.id}`}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reativar Aluguel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteRental(rental)}
                            className="text-destructive"
                            data-testid={`button-delete-${rental.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Nenhum aluguel encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Crie o primeiro contrato de aluguel"}
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => setIsOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Aluguel
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
