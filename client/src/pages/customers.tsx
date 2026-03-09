import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users,
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  Shield,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Customer, type CustomerDebit, insertCustomerSchema, insertCustomerDebitSchema } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const customerFormSchema = insertCustomerSchema.extend({
  name: insertCustomerSchema.shape.name,
  cpf: insertCustomerSchema.shape.cpf,
  phone: insertCustomerSchema.shape.phone,
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const debitFormSchema = insertCustomerDebitSchema.extend({
  amount: z.string().min(1, "Valor é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
}).omit({ customerId: true });

type DebitFormValues = z.infer<typeof debitFormSchema>;

const scoreLabels: Record<string, string> = {
  reliable: "Confiável",
  neutral: "Neutro",
  alert: "Alerta",
};

const scoreColors: Record<string, string> = {
  reliable: "bg-chart-2/10 text-chart-2",
  neutral: "bg-muted text-muted-foreground",
  alert: "bg-destructive/10 text-destructive",
};

const scoreIcons: Record<string, React.ElementType> = {
  reliable: Shield,
  neutral: Users,
  alert: AlertTriangle,
};

function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function CustomerForm({
  customer,
  onSuccess,
}: {
  customer?: Customer;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!customer;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name || "",
      cpf: customer?.cpf || "",
      rg: customer?.rg || "",
      birthDate: customer?.birthDate || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
      emergencyContact: customer?.emergencyContact || "",
      emergencyPhone: customer?.emergencyPhone || "",
      score: (customer?.score as any) || "neutral",
      notes: customer?.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const payload = {
        ...data,
        rg: data.rg || null,
        birthDate: data.birthDate || null,
        email: data.email || null,
        address: data.address || null,
        emergencyContact: data.emergencyContact || null,
        emergencyPhone: data.emergencyPhone || null,
        notes: data.notes || null,
      };
      if (isEditing) {
        return apiRequest("PATCH", `/api/customers/${customer.id}`, payload);
      }
      return apiRequest("POST", "/api/customers", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: isEditing ? "Cliente atualizado" : "Cliente cadastrado",
        description: isEditing
          ? "Os dados do cliente foram atualizados."
          : "Novo cliente adicionado ao sistema.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o cliente.",
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="João da Silva"
                    data-testid="input-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="000.000.000-00"
                    data-testid="input-cpf"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="rg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RG</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="00.000.000-0" data-testid="input-rg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="date" data-testid="input-birth-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Score</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-score">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="reliable">Confiável</SelectItem>
                    <SelectItem value="neutral">Neutro</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="(11) 99999-9999"
                    data-testid="input-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="joao@email.com"
                    data-testid="input-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Rua, número, bairro, cidade, CEP"
                  className="resize-none"
                  data-testid="input-address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contato de Emergência</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Nome do contato" data-testid="input-emergency-contact" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone Emergência</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="(11) 99999-9999"
                    data-testid="input-emergency-phone"
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
                  placeholder="Observações sobre o cliente..."
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
            data-testid="button-submit-customer"
          >
            {mutation.isPending
              ? "Salvando..."
              : isEditing
              ? "Atualizar"
              : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function DebitForm({
  customerId,
  debit,
  onSuccess,
}: {
  customerId: string;
  debit?: CustomerDebit;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!debit;

  const form = useForm<DebitFormValues>({
    resolver: zodResolver(debitFormSchema),
    defaultValues: {
      description: debit?.description || "",
      amount: debit?.amount || "",
      date: debit?.date || new Date().toISOString().split("T")[0],
      status: (debit?.status as any) || "pending",
      maintenanceOrderId: debit?.maintenanceOrderId || "",
      notes: debit?.notes || "",
      paidDate: debit?.paidDate || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: DebitFormValues) => {
      const payload = {
        ...data,
        customerId,
        maintenanceOrderId: data.maintenanceOrderId || null,
        notes: data.notes || null,
        paidDate: data.paidDate || null,
      };
      if (isEditing) {
        return apiRequest("PATCH", `/api/customer-debits/${debit.id}`, payload);
      }
      return apiRequest("POST", "/api/customer-debits", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-debits/by-customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-debits"] });
      toast({
        title: isEditing ? "Débito atualizado" : "Débito registrado",
        description: isEditing
          ? "O débito foi atualizado com sucesso."
          : "Novo débito adicionado ao cliente.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o débito.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: Peça quebrada - retrovisor"
                  data-testid="input-debit-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 grid-cols-2">
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
                    min="0.01"
                    placeholder="0,00"
                    data-testid="input-debit-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-debit-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "pending"}>
                  <FormControl>
                    <SelectTrigger data-testid="select-debit-status">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paidDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do Pagamento</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="date" data-testid="input-debit-paid-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maintenanceOrderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID da Ordem de Manutenção (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  placeholder="Vincular a uma OS..."
                  data-testid="input-debit-maintenance-id"
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
                  placeholder="Detalhes sobre o débito..."
                  className="resize-none"
                  data-testid="input-debit-notes"
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
            data-testid="button-submit-debit"
          >
            {mutation.isPending ? "Salvando..." : isEditing ? "Atualizar" : "Registrar Débito"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function CustomerDebitsView({
  customer,
  onBack,
}: {
  customer: Customer;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [isDebitFormOpen, setIsDebitFormOpen] = useState(false);
  const [editingDebit, setEditingDebit] = useState<CustomerDebit | undefined>();

  const { data: debits, isLoading } = useQuery<CustomerDebit[]>({
    queryKey: ["/api/customer-debits/by-customer", customer.id],
  });

  const pendingDebits = debits?.filter((d) => d.status === "pending") || [];
  const paidDebits = debits?.filter((d) => d.status === "paid") || [];
  const pendingBalance = pendingDebits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const totalPaid = paidDebits.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const markPaidMutation = useMutation({
    mutationFn: async (debitId: string) => {
      return apiRequest("PATCH", `/api/customer-debits/${debitId}`, {
        status: "paid",
        paidDate: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-debits/by-customer", customer.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-debits"] });
      toast({ title: "Débito pago", description: "O débito foi marcado como pago." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (debitId: string) => {
      return apiRequest("DELETE", `/api/customer-debits/${debitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-debits/by-customer", customer.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-debits"] });
      toast({ title: "Débito excluído", description: "O débito foi removido." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleEditDebit = (debit: CustomerDebit) => {
    setEditingDebit(debit);
    setIsDebitFormOpen(true);
  };

  const handleCloseDebitForm = () => {
    setIsDebitFormOpen(false);
    setEditingDebit(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-customers">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-debits-title">
              Débitos - {customer.name}
            </h1>
            <p className="text-muted-foreground">Gerencie os débitos do cliente</p>
          </div>
        </div>
        <Dialog open={isDebitFormOpen} onOpenChange={setIsDebitFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDebit(undefined)} data-testid="button-add-debit">
              <Plus className="w-4 h-4 mr-2" />
              Novo Débito
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDebit ? "Editar Débito" : "Registrar Novo Débito"}</DialogTitle>
            </DialogHeader>
            <DebitForm customerId={customer.id} debit={editingDebit} onSuccess={handleCloseDebitForm} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-destructive/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Pendente</p>
                <p className="text-lg font-bold text-destructive" data-testid="text-pending-balance">
                  {formatCurrency(pendingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-chart-2/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-lg font-bold text-chart-2" data-testid="text-total-paid">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Débitos</p>
                <p className="text-lg font-bold" data-testid="text-total-debits">
                  {debits?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <CardTitle className="text-lg">Débitos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : debits && debits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debits.map((debit) => (
                  <TableRow key={debit.id} data-testid={`row-debit-${debit.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{debit.description}</p>
                        {debit.notes && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{debit.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(parseISO(debit.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {formatCurrency(debit.amount)}
                    </TableCell>
                    <TableCell>
                      {debit.status === "pending" ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive gap-1">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-chart-2/10 text-chart-2 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Pago
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-debit-actions-${debit.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {debit.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => markPaidMutation.mutate(debit.id)}
                              data-testid={`button-mark-paid-${debit.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEditDebit(debit)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (window.confirm("Tem certeza que deseja excluir este débito?")) {
                                deleteMutation.mutate(debit.id);
                              }
                            }}
                            className="text-destructive"
                            data-testid={`button-delete-debit-${debit.id}`}
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
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Nenhum débito registrado</h3>
              <p className="text-muted-foreground mb-4">Este cliente não possui débitos</p>
              <Button onClick={() => setIsDebitFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Débito
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [viewingDebitsCustomer, setViewingDebitsCustomer] = useState<Customer | undefined>();
  const urlParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(urlParams.get("search") || "");

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: allDebits } = useQuery<CustomerDebit[]>({
    queryKey: ["/api/customer-debits"],
  });

  const pendingDebitsByCustomer = new Map<string, number>();
  allDebits?.forEach((d) => {
    if (d.status === "pending") {
      pendingDebitsByCustomer.set(d.customerId, (pendingDebitsByCustomer.get(d.customerId) || 0) + parseFloat(d.amount));
    }
  });

  const filteredCustomers = customers?.filter((customer) => {
    return (
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.cpf.includes(search) ||
      customer.phone.includes(search)
    );
  });

  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return apiRequest("DELETE", `/api/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${customer.name}"?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingCustomer(undefined);
  };

  if (viewingDebitsCustomer) {
    return (
      <CustomerDebitsView
        customer={viewingDebitsCustomer}
        onBack={() => setViewingDebitsCustomer(undefined)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-customers-title">
            Clientes
          </h1>
          <p className="text-muted-foreground">Gerencie os locatários</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingCustomer(undefined)}
              data-testid="button-add-customer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Editar Cliente" : "Cadastrar Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <CustomerForm customer={editingCustomer} onSuccess={handleClose} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-customers"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden sm:table-cell">Débitos</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const ScoreIcon = scoreIcons[customer.score];
                  const pendingAmount = pendingDebitsByCustomer.get(customer.id) || 0;
                  return (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">
                              {customer.cpf}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono">
                        {customer.cpf}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">
                                {customer.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${scoreColors[customer.score]} gap-1`}
                        >
                          <ScoreIcon className="w-3 h-3" />
                          {scoreLabels[customer.score]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {pendingAmount > 0 ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive gap-1" data-testid={`badge-debit-${customer.id}`}>
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(pendingAmount)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-actions-${customer.id}`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setViewingDebitsCustomer(customer)}
                              data-testid={`button-debits-${customer.id}`}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Débitos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(customer)}
                              className="text-destructive"
                              data-testid={`button-delete-${customer.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Nenhum cliente encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? "Tente ajustar a busca"
                  : "Cadastre o primeiro cliente"}
              </p>
              {!search && (
                <Button onClick={() => setIsOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Cliente
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
