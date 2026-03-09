import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Wrench,
  Calendar,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type MaintenanceOrder, type Motorcycle, type ServiceCatalog, insertMaintenanceOrderSchema } from "@shared/schema";

const maintenanceFormSchema = insertMaintenanceOrderSchema.extend({
  motorcycleId: z.string().min(1, "Selecione a moto"),
  type: z.enum(["preventive", "corrective"]),
  entryDate: z.string().min(1, "Data de entrada obrigatória"),
  exitDate: z.string().nullable().optional(),
  items: z.string().nullable().optional(),
  currentKm: z.coerce.number().nullable().optional(),
  partsCost: z.string().nullable().optional(),
  laborCost: z.string().nullable().optional(),
  nextMaintenanceDate: z.string().nullable().optional(),
  nextMaintenanceKm: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceWithRelations extends MaintenanceOrder {
  motorcycle?: Motorcycle;
}

const typeLabels: Record<string, string> = {
  preventive: "Preventiva",
  corrective: "Corretiva",
};

const typeColors: Record<string, string> = {
  preventive: "bg-chart-1/10 text-chart-1",
  corrective: "bg-chart-3/10 text-chart-3",
};

function formatCurrency(value: string | number | null) {
  const num = Number(value) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MaintenanceForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<ServiceCatalog[]>([]);

  const { data: motorcycles } = useQuery<Motorcycle[]>({
    queryKey: ["/api/motorcycles"],
  });

  const { data: catalogItems = [] } = useQuery<ServiceCatalog[]>({
    queryKey: ["/api/service-catalog"],
  });

  const activeCatalogItems = catalogItems.filter((i) => i.active);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      motorcycleId: "",
      type: "preventive",
      entryDate: format(new Date(), "yyyy-MM-dd"),
      exitDate: "",
      items: "",
      currentKm: 0,
      partsCost: "0",
      laborCost: "0",
      nextMaintenanceDate: "",
      nextMaintenanceKm: undefined,
      notes: "",
    },
  });

  const selectedMotorcycle = motorcycles?.find(
    (m) => m.id === form.watch("motorcycleId")
  );

  const mutation = useMutation({
    mutationFn: async (data: MaintenanceFormValues) => {
      const totalCost = String(parseFloat(data.partsCost || "0") + parseFloat(data.laborCost || "0"));
      return apiRequest("POST", "/api/maintenance", {
        ...data,
        exitDate: data.exitDate || null,
        items: data.items || null,
        currentKm: data.currentKm || null,
        partsCost: data.partsCost || "0",
        laborCost: data.laborCost || "0",
        totalCost,
        nextMaintenanceDate: data.nextMaintenanceDate || null,
        nextMaintenanceKm: data.nextMaintenanceKm || null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      toast({
        title: "Manutenção registrada",
        description: "Ordem de manutenção criada com sucesso.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a manutenção.",
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
            name="motorcycleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moto *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-motorcycle">
                      <SelectValue placeholder="Selecione a moto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {motorcycles?.map((moto) => (
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
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="preventive">Preventiva</SelectItem>
                    <SelectItem value="corrective">Corretiva</SelectItem>
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
            name="entryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Entrada *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-entry-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exitDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Saída</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="date" data-testid="input-exit-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currentKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km Atual</FormLabel>
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
                    data-testid="input-current-km"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {activeCatalogItems.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Adicionar do Catálogo</Label>
            <div className="flex items-center gap-2">
              <Select
                value=""
                onValueChange={(catalogId) => {
                  const item = activeCatalogItems.find((i) => i.id === catalogId);
                  if (!item) return;
                  const currentItems = form.getValues("items") || "";
                  const newItems = currentItems ? `${currentItems}, ${item.name}` : item.name;
                  form.setValue("items", newItems);
                  const currentParts = parseFloat(form.getValues("partsCost") || "0");
                  const currentLabor = parseFloat(form.getValues("laborCost") || "0");
                  form.setValue("partsCost", String(currentParts + Number(item.partsCost)));
                  form.setValue("laborCost", String(currentLabor + Number(item.laborCost)));
                  setSelectedCatalogItems((prev) => [...prev, item]);
                }}
              >
                <SelectTrigger data-testid="select-catalog-item">
                  <SelectValue placeholder="Selecionar serviço do catálogo..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    activeCatalogItems.reduce<Record<string, ServiceCatalog[]>>((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {})
                  ).sort(([a], [b]) => a.localeCompare(b)).flatMap(([category, catItems]) =>
                    catItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        [{category}] {item.name} — {formatCurrency(Number(item.partsCost) + Number(item.laborCost))}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedCatalogItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCatalogItems.map((item, idx) => (
                  <Badge key={`${item.id}-${idx}`} variant="secondary" data-testid={`badge-catalog-selected-${item.id}-${idx}`}>
                    {item.name}
                  </Badge>
                ))}
                <p className="text-xs text-muted-foreground w-full">
                  Custos adicionados: Peças {formatCurrency(selectedCatalogItems.reduce((s, i) => s + Number(i.partsCost), 0))}, Mão de obra {formatCurrency(selectedCatalogItems.reduce((s, i) => s + Number(i.laborCost), 0))}
                </p>
              </div>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="items"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Itens da Manutenção</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Troca de óleo, pastilha de freio, pneu..."
                  className="resize-none"
                  data-testid="input-items"
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">Preenchido pelo catálogo ou edite livremente. Os custos podem ser ajustados manualmente abaixo.</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="partsCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo Peças (R$)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    type="number"
                    step="0.01"
                    data-testid="input-parts-cost"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="laborCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mão de Obra (R$)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    type="number"
                    step="0.01"
                    data-testid="input-labor-cost"
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
            name="nextMaintenanceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Próxima Manutenção (Data)</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="date" data-testid="input-next-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nextMaintenanceKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Próxima Manutenção (Km)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    placeholder="Ex: 50000"
                    data-testid="input-next-km"
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
                  placeholder="Observações sobre a manutenção..."
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
            data-testid="button-submit-maintenance"
          >
            {mutation.isPending ? "Salvando..." : "Registrar Manutenção"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EditMaintenanceDialog({ order, open, onOpenChange }: { order: MaintenanceWithRelations; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState(order.items || "");
  const [partsCost, setPartsCost] = useState(String(order.partsCost || "0"));
  const [laborCost, setLaborCost] = useState(String(order.laborCost || "0"));
  const [notes, setNotes] = useState(order.notes || "");
  const [type, setType] = useState(order.type);
  const [entryDate, setEntryDate] = useState(order.entryDate);
  const [exitDate, setExitDate] = useState(order.exitDate || "");

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/maintenance/${order.id}`, {
        items: items || null,
        partsCost,
        laborCost,
        notes: notes || null,
        type,
        entryDate,
        exitDate: exitDate || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance/report"] });
      toast({ title: "Manutenção atualizada", description: "Os dados foram salvos com sucesso." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Não foi possível atualizar.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Manutenção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            {order.motorcycle?.brand} {order.motorcycle?.model} — {order.motorcycle?.plate}
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="edit-select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventiva</SelectItem>
                  <SelectItem value="corrective">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Entrada</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} data-testid="edit-input-entry-date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data Saída</Label>
            <Input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} data-testid="edit-input-exit-date" />
          </div>

          <div className="space-y-2">
            <Label>Itens / Descrição</Label>
            <Textarea
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="Itens da manutenção..."
              className="resize-none"
              data-testid="edit-input-items"
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>Custo Peças (R$)</Label>
              <Input type="number" step="0.01" value={partsCost} onChange={(e) => setPartsCost(e.target.value)} data-testid="edit-input-parts-cost" />
            </div>
            <div className="space-y-2">
              <Label>Mão de Obra (R$)</Label>
              <Input type="number" step="0.01" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} data-testid="edit-input-labor-cost" />
            </div>
          </div>

          <div className="p-3 rounded-md bg-muted text-sm">
            Total: {formatCurrency(parseFloat(partsCost || "0") + parseFloat(laborCost || "0"))}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações..."
              className="resize-none"
              data-testid="edit-input-notes"
            />
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-save-edit-maintenance">
            {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MaintenancePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<MaintenanceWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: maintenanceOrders, isLoading } = useQuery<
    MaintenanceWithRelations[]
  >({
    queryKey: ["/api/maintenance"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Manutenção excluída",
        description: "A ordem de manutenção foi removida do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a manutenção.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (order: MaintenanceWithRelations) => {
    if (window.confirm(`Tem certeza que deseja excluir esta ordem de manutenção?`)) {
      deleteMutation.mutate(order.id);
    }
  };

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/maintenance/${id}/complete`, {
        exitDate: format(new Date(), "yyyy-MM-dd"),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      toast({
        title: "Manutenção finalizada",
        description: "A ordem de manutenção foi concluída.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível finalizar.",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = maintenanceOrders?.filter((order) => {
    const matchesSearch = order.motorcycle?.plate
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !order.completed) ||
      (statusFilter === "completed" && order.completed);
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: string | number | null) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-maintenance-title">
            Manutenção
          </h1>
          <p className="text-muted-foreground">Controle de manutenções</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-maintenance">
              <Plus className="w-4 h-4 mr-2" />
              Nova Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Manutenção</DialogTitle>
            </DialogHeader>
            <MaintenanceForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-maintenance"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Entrada</TableHead>
                  <TableHead className="hidden lg:table-cell">Custo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-maintenance-${order.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {order.motorcycle?.brand} {order.motorcycle?.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.motorcycle?.plate}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={typeColors[order.type]}
                      >
                        {typeLabels[order.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(order.entryDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-medium">
                        {formatCurrency(order.totalCost)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {order.completed ? (
                        <Badge
                          variant="outline"
                          className="bg-chart-2/10 text-chart-2 gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Concluída
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-chart-3/10 text-chart-3 gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-actions-${order.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingOrder(order)}
                            data-testid={`button-edit-${order.id}`}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {!order.completed && (
                            <DropdownMenuItem
                              onClick={() => completeMutation.mutate(order.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Finalizar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(order)}
                            className="text-destructive"
                            data-testid={`button-delete-${order.id}`}
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
                <Wrench className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Nenhuma manutenção encontrada
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Registre a primeira manutenção"}
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => setIsOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Manutenção
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {editingOrder && (
        <EditMaintenanceDialog
          order={editingOrder}
          open={!!editingOrder}
          onOpenChange={(open) => { if (!open) setEditingOrder(null); }}
        />
      )}
    </div>
  );
}
