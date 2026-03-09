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
  DialogDescription,
  DialogFooter,
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
  CreditCard,
  Calendar,
  Filter,
  Trash2,
  MoreHorizontal,
  Printer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Payment, Customer, Rental } from "@shared/schema";
import { printReport } from "@/lib/print-report";

const paymentFormSchema = z.object({
  customerId: z.string().min(1, "Cliente obrigatório"),
  rentalId: z.string().optional(),
  paymentDate: z.string().min(1, "Data obrigatória"),
  amount: z.string().min(1, "Valor obrigatório"),
  method: z.enum(["pix", "cash", "card", "transfer"]),
  competence: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentWithRelations extends Payment {
  customer?: Customer;
  rental?: Rental;
}

const methodLabels: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência",
};

const methodColors: Record<string, string> = {
  pix: "bg-chart-2/10 text-chart-2",
  cash: "bg-chart-3/10 text-chart-3",
  card: "bg-chart-1/10 text-chart-1",
  transfer: "bg-chart-4/10 text-chart-4",
};

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: rentals } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"],
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      customerId: "",
      rentalId: "",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      method: "pix",
      competence: "",
      notes: "",
    },
  });

  const selectedCustomerId = form.watch("customerId");
  const customerRentals = rentals?.filter(
    (r) => r.customerId === selectedCustomerId && r.active
  );

  const mutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const payload = {
        ...data,
        rentalId: data.rentalId || null,
        competence: data.competence || null,
        notes: data.notes || null,
      };
      return apiRequest("POST", "/api/payments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar o pagamento.",
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
                        {customer.name}
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
            name="rentalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aluguel (opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger data-testid="select-rental">
                      <SelectValue placeholder="Vincular a aluguel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {customerRentals?.map((rental) => (
                      <SelectItem key={rental.id} value={rental.id}>
                        Aluguel #{rental.id.slice(0, 8)}
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
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do Pagamento *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-payment-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-testid="input-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-method">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="competence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Competência</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  placeholder="Ex: Jan/2026 ou Semana 03"
                  data-testid="input-competence"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  placeholder="Observações sobre o pagamento..."
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
            data-testid="button-submit-payment"
          >
            {mutation.isPending ? "Salvando..." : "Registrar Pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function PaymentsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<PaymentWithRelations | null>(null);

  const { data: payments, isLoading } = useQuery<PaymentWithRelations[]>({
    queryKey: ["/api/payments"],
  });

  const { toast } = useToast();

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ paymentId, keepInstallment }: { paymentId: string; keepInstallment: boolean }) => {
      return apiRequest("DELETE", `/api/payments/${paymentId}?keepInstallment=${keepInstallment}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      setDeleteTarget(null);
      toast({
        title: "Pagamento excluído",
        description: "O pagamento foi removido do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o pagamento.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (payment: PaymentWithRelations) => {
    if (payment.installmentId) {
      setDeleteTarget(payment);
    } else {
      if (window.confirm(`Tem certeza que deseja excluir este pagamento de ${formatCurrency(payment.amount)}?`)) {
        deleteMutation.mutate({ paymentId: payment.id, keepInstallment: true });
      }
    }
  };

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch = payment.customer?.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesMethod =
      methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalFiltered = filteredPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const handlePrintPayments = () => {
    if (!filteredPayments || filteredPayments.length === 0) return;
    const filterDesc = [];
    if (search) filterDesc.push(`Cliente: "${search}"`);
    if (methodFilter !== "all") filterDesc.push(`Método: ${methodLabels[methodFilter]}`);
    printReport({
      title: "Relatório de Pagamentos",
      subtitle: filterDesc.length > 0 ? `Filtros: ${filterDesc.join(" | ")}` : "Todos os pagamentos",
      columns: [
        { header: "Cliente" },
        { header: "Data" },
        { header: "Valor", align: "right" },
        { header: "Forma" },
        { header: "Competência" },
      ],
      rows: filteredPayments.map(p => [
        p.customer?.name || "Cliente",
        format(new Date(p.paymentDate), "dd/MM/yyyy", { locale: ptBR }),
        formatCurrency(p.amount),
        methodLabels[p.method] || p.method,
        p.competence || "-",
      ]),
      totals: ["", "Total", formatCurrency(totalFiltered), "", ""],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-payments-title">
            Pagamentos
          </h1>
          <p className="text-muted-foreground">Controle de pagamentos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrintPayments} disabled={!filteredPayments || filteredPayments.length === 0} data-testid="button-print-payments">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-payment">
                <Plus className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <PaymentForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-payments"
              />
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-method-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Formas</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
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
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Forma</TableHead>
                  <TableHead className="hidden lg:table-cell">Competência</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                    <TableCell>
                      <p className="font-medium">
                        {payment.customer?.name || "Cliente"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(payment.paymentDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-chart-2">
                        {formatCurrency(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={methodColors[payment.method]}
                      >
                        {methodLabels[payment.method]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {payment.competence || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-actions-${payment.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDelete(payment)}
                            className="text-destructive"
                            data-testid={`button-delete-${payment.id}`}
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
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Nenhum pagamento encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || methodFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Registre o primeiro pagamento"}
              </p>
              {!search && methodFilter === "all" && (
                <Button onClick={() => setIsOpen(true)} data-testid="button-add-payment-empty">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Pagamento
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Pagamento</DialogTitle>
            <DialogDescription>
              Este pagamento está vinculado a uma parcela. O que deseja fazer com a parcela?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate({ paymentId: deleteTarget.id, keepInstallment: true });
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-keep-installment"
            >
              Manter parcela pendente
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate({ paymentId: deleteTarget.id, keepInstallment: false });
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-remove-installment"
            >
              Excluir parcela também
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} data-testid="button-cancel-delete">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
