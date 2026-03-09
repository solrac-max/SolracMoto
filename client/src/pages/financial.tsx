import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bike,
  Wrench,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  Repeat,
  Printer,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { printReport } from "@/lib/print-report";
import type { Motorcycle } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FinancialReport {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalIncome: number;
    rentalIncome: number;
    extraRevenueTotal: number;
    maintenanceCost: number;
    fixedCostTotal: number;
    extraExpenseTotal: number;
    totalExpenses: number;
    netResult: number;
    unassignedIncome: number;
  };
  perMotorcycle: Array<{
    motorcycleId: string;
    plate: string;
    brand: string;
    model: string;
    income: number;
    maintenance: number;
    fixedCosts: number;
    extraExpenses: number;
    net: number;
  }>;
  paymentDetails: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    customerName: string;
  }>;
  maintenanceDetails: Array<{
    id: string;
    date: string;
    amount: number;
    items: string | null;
    motorcyclePlate: string;
    motorcycleName: string;
  }>;
  fixedCostDetails: Array<{
    id: string;
    motorcycleId: string;
    description: string;
    amount: number;
    referenceMonth: string;
    motorcyclePlate: string;
    motorcycleName: string;
  }>;
  extraRevenueDetails: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    notes: string | null;
  }>;
  extraExpenseDetails: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    motorcycleId: string | null;
    motorcyclePlate: string;
    motorcycleName: string;
    notes: string | null;
  }>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const methodLabels: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência",
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const categoryLabels: Record<string, string> = {
  service: "Serviço",
  sale: "Venda",
  insurance: "Seguro",
  other: "Outros",
};

const expenseCategoryLabels: Record<string, string> = {
  repair: "Reparo",
  fuel: "Combustível",
  toll: "Pedágio",
  parts: "Peças",
  administrative: "Administrativo",
  other: "Outros",
};

interface EditingFixedCost {
  id: string;
  motorcycleId: string;
  description: string;
  amount: number;
  referenceMonth: string;
}

interface EditingExtraRevenue {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  notes: string | null;
}

interface EditingExtraExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  motorcycleId: string | null;
  notes: string | null;
}

function ExtraRevenueForm({ onSuccess, editingRevenue }: { onSuccess: () => void; editingRevenue?: EditingExtraRevenue | null }) {
  const { toast } = useToast();
  const isEditing = !!editingRevenue;
  const [description, setDescription] = useState(editingRevenue?.description || "");
  const [amount, setAmount] = useState(editingRevenue ? String(editingRevenue.amount) : "");
  const [date, setDate] = useState(editingRevenue?.date || new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState(editingRevenue?.category || "other");
  const [notes, setNotes] = useState(editingRevenue?.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiRequest("POST", "/api/extra-revenues", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      queryClient.invalidateQueries({ queryKey: ["/api/extra-revenues"] });
      toast({ title: "Receita extra adicionada" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao adicionar receita extra", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiRequest("PATCH", `/api/extra-revenues/${editingRevenue!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      queryClient.invalidateQueries({ queryKey: ["/api/extra-revenues"] });
      toast({ title: "Receita extra atualizada" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar receita extra", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = "Informe a descri\u00e7\u00e3o";
    if (!amount || Number(amount) <= 0) newErrors.amount = "Informe um valor v\u00e1lido";
    if (!date) newErrors.date = "Informe a data";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = { description, amount, date, category, notes: notes || null };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Descri\u00e7\u00e3o</Label>
        <Input
          value={description}
          onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: "" })); }}
          placeholder="Ex: Venda de capacete, Frete de entrega..."
          data-testid="input-extra-revenue-description"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: "" })); }}
            placeholder="0,00"
            data-testid="input-extra-revenue-amount"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-testid="input-extra-revenue-date"
          />
          {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="select-extra-revenue-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service">Servi\u00e7o</SelectItem>
            <SelectItem value="sale">Venda</SelectItem>
            <SelectItem value="insurance">Seguro</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notas (opcional)</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalhes adicionais..."
          data-testid="input-extra-revenue-notes"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-extra-revenue">
        {isPending ? "Salvando..." : isEditing ? "Salvar Altera\u00e7\u00f5es" : "Adicionar Receita Extra"}
      </Button>
    </form>
  );
}

function ExtraExpenseForm({ onSuccess, editingExpense }: { onSuccess: () => void; editingExpense?: EditingExtraExpense | null }) {
  const { toast } = useToast();
  const isEditing = !!editingExpense;
  const [description, setDescription] = useState(editingExpense?.description || "");
  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : "");
  const [date, setDate] = useState(editingExpense?.date || new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState(editingExpense?.category || "other");
  const [motorcycleId, setMotorcycleId] = useState(editingExpense?.motorcycleId || "");
  const [notes, setNotes] = useState(editingExpense?.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: motorcycles } = useQuery<Motorcycle[]>({
    queryKey: ["/api/motorcycles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiRequest("POST", "/api/extra-expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      queryClient.invalidateQueries({ queryKey: ["/api/extra-expenses"] });
      toast({ title: "Despesa extra adicionada" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao adicionar despesa extra", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiRequest("PATCH", `/api/extra-expenses/${editingExpense!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      queryClient.invalidateQueries({ queryKey: ["/api/extra-expenses"] });
      toast({ title: "Despesa extra atualizada" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar despesa extra", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = "Informe a descri\u00e7\u00e3o";
    if (!amount || Number(amount) <= 0) newErrors.amount = "Informe um valor v\u00e1lido";
    if (!date) newErrors.date = "Informe a data";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = { description, amount, date, category, motorcycleId: (motorcycleId && motorcycleId !== "none") ? motorcycleId : null, notes: notes || null };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Descri\u00e7\u00e3o</Label>
        <Input
          value={description}
          onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: "" })); }}
          placeholder="Ex: Guincho, Multa, Material..."
          data-testid="input-extra-expense-description"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: "" })); }}
            placeholder="0,00"
            data-testid="input-extra-expense-amount"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-testid="input-extra-expense-date"
          />
          {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="select-extra-expense-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="repair">Reparo</SelectItem>
            <SelectItem value="fuel">Combust\u00edvel</SelectItem>
            <SelectItem value="toll">Ped\u00e1gio</SelectItem>
            <SelectItem value="parts">Pe\u00e7as</SelectItem>
            <SelectItem value="administrative">Administrativo</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Moto (opcional)</Label>
        <Select value={motorcycleId} onValueChange={setMotorcycleId}>
          <SelectTrigger data-testid="select-extra-expense-moto">
            <SelectValue placeholder="Nenhuma (geral)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma (geral)</SelectItem>
            {motorcycles?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.brand} {m.model} - {m.plate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notas (opcional)</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalhes adicionais..."
          data-testid="input-extra-expense-notes"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-extra-expense">
        {isPending ? "Salvando..." : isEditing ? "Salvar Altera\u00e7\u00f5es" : "Adicionar Despesa Extra"}
      </Button>
    </form>
  );
}

function FixedCostForm({ onSuccess, editingCost }: { onSuccess: () => void; editingCost?: EditingFixedCost | null }) {
  const { toast } = useToast();
  const isEditing = !!editingCost;
  const [motorcycleId, setMotorcycleId] = useState(editingCost?.motorcycleId || "");
  const [description, setDescription] = useState(editingCost?.description || "");
  const [amount, setAmount] = useState(editingCost ? String(editingCost.amount) : "");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [allMotorcycles, setAllMotorcycles] = useState(false);
  const [referenceMonth, setReferenceMonth] = useState(() => {
    if (editingCost) return editingCost.referenceMonth;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [repeatUntil, setRepeatUntil] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-12`;
  });

  const { data: motorcycles } = useQuery<Motorcycle[]>({
    queryKey: ["/api/motorcycles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/fixed-costs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs"] });
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      let msg = "Custo fixo adicionado";
      if (allMotorcycles && repeatEnabled) msg = "Custo fixo adicionado para todas as motos e meses selecionados";
      else if (allMotorcycles) msg = "Custo fixo adicionado para todas as motos";
      else if (repeatEnabled) msg = "Custo fixo adicionado para todos os meses selecionados";
      toast({ title: msg });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao adicionar custo fixo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("PATCH", `/api/fixed-costs/${editingCost!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs"] });
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      toast({ title: "Custo fixo atualizado" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar custo fixo", variant: "destructive" });
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const countMonths = (start: string, end: string) => {
    const [sy, sm] = start.split("-").map(Number);
    const [ey, em] = end.split("-").map(Number);
    return (ey - sy) * 12 + (em - sm) + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!allMotorcycles && !motorcycleId) newErrors.motorcycleId = "Selecione uma moto";
    if (!description.trim()) newErrors.description = "Informe a descrição";
    if (!amount || Number(amount) <= 0) newErrors.amount = "Informe um valor válido";
    if (!referenceMonth) newErrors.referenceMonth = "Informe o mês de referência";
    if (!isEditing && repeatEnabled && (!repeatUntil || repeatUntil < referenceMonth)) {
      newErrors.repeatUntil = "O mês final deve ser igual ou posterior ao mês inicial";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (isEditing) {
      updateMutation.mutate({
        motorcycleId,
        description,
        amount,
        referenceMonth,
      });
    } else {
      if (allMotorcycles && (!motorcycles || motorcycles.length === 0)) {
        setErrors({ motorcycleId: "Nenhuma moto cadastrada" });
        return;
      }
      const motoIdForPost = allMotorcycles ? motorcycles![0].id : motorcycleId;
      createMutation.mutate({
        motorcycleId: motoIdForPost,
        description,
        amount,
        referenceMonth,
        ...(repeatEnabled ? { repeatUntil } : {}),
        ...(allMotorcycles ? { allMotorcycles: true } : {}),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <div className="flex items-center gap-2 p-3 rounded-md border">
          <Checkbox
            id="all-motos-toggle"
            checked={allMotorcycles}
            onCheckedChange={(v) => setAllMotorcycles(v === true)}
            data-testid="checkbox-all-motorcycles"
          />
          <label htmlFor="all-motos-toggle" className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Users className="w-4 h-4 text-muted-foreground" />
            Aplicar para todas as motos
          </label>
        </div>
      )}

      {!allMotorcycles && (
        <div className="space-y-2">
          <Label>Moto</Label>
          <Select value={motorcycleId} onValueChange={(v) => { setMotorcycleId(v); setErrors(prev => ({ ...prev, motorcycleId: "" })); }}>
            <SelectTrigger data-testid="select-fixed-cost-moto">
              <SelectValue placeholder="Selecione a moto" />
            </SelectTrigger>
            <SelectContent>
              {motorcycles?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.brand} {m.model} - {m.plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.motorcycleId && <p className="text-xs text-destructive">{errors.motorcycleId}</p>}
        </div>
      )}

      {allMotorcycles && (
        <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            O custo será adicionado para <span className="font-medium text-foreground">{motorcycles?.length || 0} motos</span> cadastradas
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={description}
          onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: "" })); }}
          placeholder="Ex: Seguro, IPVA, Estacionamento..."
          data-testid="input-fixed-cost-description"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: "" })); }}
            placeholder="0,00"
            data-testid="input-fixed-cost-amount"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label>{isEditing ? "Mês de Referência" : "Mês Inicial"}</Label>
          <Input
            type="month"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
            data-testid="input-fixed-cost-month"
          />
          {errors.referenceMonth && <p className="text-xs text-destructive">{errors.referenceMonth}</p>}
        </div>
      </div>

      {!isEditing && (
        <>
          <div className="flex items-center gap-2 p-3 rounded-md border">
            <Checkbox
              id="repeat-toggle"
              checked={repeatEnabled}
              onCheckedChange={(v) => setRepeatEnabled(v === true)}
              data-testid="checkbox-repeat-cost"
            />
            <label htmlFor="repeat-toggle" className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Repeat className="w-4 h-4 text-muted-foreground" />
              Repetir para os próximos meses
            </label>
          </div>

          {repeatEnabled && (
            <div className="space-y-2">
              <Label>Repetir até</Label>
              <Input
                type="month"
                value={repeatUntil}
                min={referenceMonth}
                onChange={(e) => { setRepeatUntil(e.target.value); setErrors(prev => ({ ...prev, repeatUntil: "" })); }}
                data-testid="input-fixed-cost-repeat-until"
              />
              {errors.repeatUntil && <p className="text-xs text-destructive">{errors.repeatUntil}</p>}
              {repeatUntil >= referenceMonth && (
                <p className="text-xs text-muted-foreground">
                  Serão criados {countMonths(referenceMonth, repeatUntil)} registros
                  {allMotorcycles ? ` para cada uma das ${motorcycles?.length || 0} motos` : ""}
                  {" "}de {formatCurrency(Number(amount) || 0)} cada
                </p>
              )}
            </div>
          )}
        </>
      )}

      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-fixed-cost">
        {isPending
          ? "Salvando..."
          : isEditing
          ? "Salvar Alterações"
          : allMotorcycles
          ? "Adicionar para Todas as Motos"
          : repeatEnabled
          ? "Adicionar para Todos os Meses"
          : "Adicionar Custo Fixo"}
      </Button>
    </form>
  );
}

export default function FinancialPage() {
  const now = new Date();
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [week, setWeek] = useState(1);
  const [fixedCostOpen, setFixedCostOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<EditingFixedCost | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [extraRevenueOpen, setExtraRevenueOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<EditingExtraRevenue | null>(null);
  const [editRevenueDialogOpen, setEditRevenueDialogOpen] = useState(false);
  const [extraExpenseOpen, setExtraExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EditingExtraExpense | null>(null);
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { toast } = useToast();

  const queryParams = new URLSearchParams({
    period,
    year: String(year),
    month: String(month),
    ...(period === "weekly" ? { week: String(week) } : {}),
  });

  const reportUrl = `/api/financial/report?${queryParams}`;

  const { data: report, isLoading } = useQuery<FinancialReport>({
    queryKey: [reportUrl],
  });

  const deleteFixedCost = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/fixed-costs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs"] });
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      toast({ title: "Custo fixo removido" });
    },
  });

  const deleteExtraRevenue = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/extra-revenues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extra-revenues"] });
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      toast({ title: "Receita extra removida" });
    },
  });

  const deleteExtraExpense = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/extra-expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extra-expenses"] });
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/financial/report") });
      toast({ title: "Despesa extra removida" });
    },
  });

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getPeriodLabel = () => {
    if (period === "weekly") return `Semana ${week} - ${monthNames[month - 1]}/${year}`;
    if (period === "annual") return `Ano ${year}`;
    return `${monthNames[month - 1]}/${year}`;
  };

  const handlePrintComplete = () => {
    if (!report) return;
    const pl = getPeriodLabel();
    printReport({
      title: "Relatório Financeiro Completo",
      period: pl,
      columns: [
        { header: "Categoria" },
        { header: "Valor", align: "right" },
      ],
      rows: [
        ["Receita de Alugueis", formatCurrency(report.summary.rentalIncome)],
        ...(report.summary.extraRevenueTotal > 0 ? [["Receitas Extras", formatCurrency(report.summary.extraRevenueTotal)]] : []),
        ["Receita Total", formatCurrency(report.summary.totalIncome)],
        ["Manutenção", formatCurrency(report.summary.maintenanceCost)],
        ["Custos Fixos", formatCurrency(report.summary.fixedCostTotal)],
        ...(report.summary.extraExpenseTotal > 0 ? [["Despesas Extras", formatCurrency(report.summary.extraExpenseTotal)]] : []),
        ["Total Despesas", formatCurrency(report.summary.totalExpenses)],
        ["Resultado Líquido", formatCurrency(report.summary.netResult)],
      ],
      sections: [
        ...(report.perMotorcycle.length > 0 ? [{
          title: "Resultado por Moto",
          columns: [
            { header: "Moto" },
            { header: "Placa" },
            { header: "Receita", align: "right" as const },
            { header: "Manutenção", align: "right" as const },
            { header: "Custos Fixos", align: "right" as const },
            { header: "Líquido", align: "right" as const },
          ],
          rows: report.perMotorcycle.map(m => [
            `${m.brand} ${m.model}`, m.plate,
            formatCurrency(m.income), formatCurrency(m.maintenance),
            formatCurrency(m.fixedCosts), formatCurrency(m.net),
          ]),
        }] : []),
        ...(report.paymentDetails.length > 0 ? [{
          title: `Recebimentos (${report.paymentDetails.length})`,
          columns: [
            { header: "Data" },
            { header: "Cliente" },
            { header: "Método" },
            { header: "Valor", align: "right" as const },
          ],
          rows: report.paymentDetails.map(p => [
            new Date(p.date).toLocaleDateString("pt-BR"),
            p.customerName,
            methodLabels[p.method] || p.method,
            formatCurrency(p.amount),
          ]),
          totals: ["", "", "Total", formatCurrency(report.summary.totalIncome)],
        }] : []),
        ...(report.maintenanceDetails.length > 0 ? [{
          title: `Manutenções (${report.maintenanceDetails.length})`,
          columns: [
            { header: "Data" },
            { header: "Moto" },
            { header: "Serviços" },
            { header: "Valor", align: "right" as const },
          ],
          rows: report.maintenanceDetails.map(o => [
            new Date(o.date).toLocaleDateString("pt-BR"),
            `${o.motorcycleName} (${o.motorcyclePlate})`,
            o.items || "-",
            formatCurrency(o.amount),
          ]),
          totals: ["", "", "Total", formatCurrency(report.summary.maintenanceCost)],
        }] : []),
        ...(report.fixedCostDetails.length > 0 ? [{
          title: `Custos Fixos (${report.fixedCostDetails.length})`,
          columns: [
            { header: "Descrição" },
            { header: "Moto" },
            { header: "Ref." },
            { header: "Valor", align: "right" as const },
          ],
          rows: report.fixedCostDetails.map(c => [
            c.description,
            `${c.motorcycleName} (${c.motorcyclePlate})`,
            c.referenceMonth.split("-").reverse().join("/"),
            formatCurrency(c.amount),
          ]),
          totals: ["", "", "Total", formatCurrency(report.summary.fixedCostTotal)],
        }] : []),
        ...(report.extraRevenueDetails && report.extraRevenueDetails.length > 0 ? [{
          title: `Receitas Extras (${report.extraRevenueDetails.length})`,
          columns: [
            { header: "Data" },
            { header: "Descrição" },
            { header: "Categoria" },
            { header: "Valor", align: "right" as const },
          ],
          rows: report.extraRevenueDetails.map(r => [
            new Date(r.date).toLocaleDateString("pt-BR"),
            r.description,
            categoryLabels[r.category] || r.category,
            formatCurrency(r.amount),
          ]),
          totals: ["", "", "Total", formatCurrency(report.summary.extraRevenueTotal)],
        }] : []),
      ],
    });
  };

  const handlePrintPayments = () => {
    if (!report || report.paymentDetails.length === 0) return;
    printReport({
      title: "Relatório de Recebimentos",
      period: getPeriodLabel(),
      columns: [
        { header: "Data" },
        { header: "Cliente" },
        { header: "Método" },
        { header: "Valor", align: "right" },
      ],
      rows: report.paymentDetails.map(p => [
        new Date(p.date).toLocaleDateString("pt-BR"),
        p.customerName,
        methodLabels[p.method] || p.method,
        formatCurrency(p.amount),
      ]),
      totals: ["", "", "Total", formatCurrency(report.summary.totalIncome)],
    });
  };

  const handlePrintMaintenance = () => {
    if (!report || report.maintenanceDetails.length === 0) return;
    printReport({
      title: "Relatório de Manutenções",
      period: getPeriodLabel(),
      columns: [
        { header: "Data" },
        { header: "Moto" },
        { header: "Serviços" },
        { header: "Valor", align: "right" },
      ],
      rows: report.maintenanceDetails.map(o => [
        new Date(o.date).toLocaleDateString("pt-BR"),
        `${o.motorcycleName} (${o.motorcyclePlate})`,
        o.items || "-",
        formatCurrency(o.amount),
      ]),
      totals: ["", "", "Total", formatCurrency(report.summary.maintenanceCost)],
    });
  };

  const handlePrintNetResult = () => {
    if (!report) return;
    printReport({
      title: "Resultado Líquido por Moto",
      period: getPeriodLabel(),
      columns: [
        { header: "Moto" },
        { header: "Placa" },
        { header: "Receita", align: "right" },
        { header: "Manutenção", align: "right" },
        { header: "Custos Fixos", align: "right" },
        { header: "Líquido", align: "right" },
      ],
      rows: [
        ...report.perMotorcycle.map(m => [
          `${m.brand} ${m.model}`, m.plate,
          formatCurrency(m.income), formatCurrency(m.maintenance),
          formatCurrency(m.fixedCosts), formatCurrency(m.net),
        ]),
        ...(report.summary.unassignedIncome > 0 ? [
          ["Sem vínculo", "-", formatCurrency(report.summary.unassignedIncome), "-", "-", formatCurrency(report.summary.unassignedIncome)]
        ] : []),
      ],
      totals: [
        "", "TOTAL",
        formatCurrency(report.summary.totalIncome),
        formatCurrency(report.summary.maintenanceCost),
        formatCurrency(report.summary.fixedCostTotal),
        formatCurrency(report.summary.netResult),
      ],
    });
  };

  const periodLabel =
    period === "weekly"
      ? `Semana ${week} - ${monthNames[month - 1]}/${year}`
      : period === "annual"
      ? `Ano ${year}`
      : `${monthNames[month - 1]}/${year}`;

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-financial-title">
            Controle Financeiro
          </h1>
          <p className="text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {report && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-print-financial">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePrintComplete} data-testid="button-print-complete">
                  Relatório Completo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintPayments} data-testid="button-print-payments">
                  Recebimentos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintMaintenance} data-testid="button-print-maintenance">
                  Manutenções
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintNetResult} data-testid="button-print-net">
                  Resultado por Moto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Dialog open={extraRevenueOpen} onOpenChange={(open) => { setExtraRevenueOpen(open); }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-extra-revenue">
                <Plus className="w-4 h-4 mr-2" />
                Receita Extra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Receita Extra</DialogTitle>
              </DialogHeader>
              <ExtraRevenueForm onSuccess={() => setExtraRevenueOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={editRevenueDialogOpen} onOpenChange={(open) => { setEditRevenueDialogOpen(open); if (!open) setEditingRevenue(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Receita Extra</DialogTitle>
              </DialogHeader>
              {editingRevenue && (
                <ExtraRevenueForm
                  key={editingRevenue.id}
                  editingRevenue={editingRevenue}
                  onSuccess={() => { setEditRevenueDialogOpen(false); setEditingRevenue(null); }}
                />
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={extraExpenseOpen} onOpenChange={(open) => { setExtraExpenseOpen(open); }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-extra-expense">
                <Plus className="w-4 h-4 mr-2" />
                Despesa Extra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Despesa Extra</DialogTitle>
              </DialogHeader>
              <ExtraExpenseForm onSuccess={() => setExtraExpenseOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={editExpenseDialogOpen} onOpenChange={(open) => { setEditExpenseDialogOpen(open); if (!open) setEditingExpense(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Despesa Extra</DialogTitle>
              </DialogHeader>
              {editingExpense && (
                <ExtraExpenseForm
                  key={editingExpense.id}
                  editingExpense={editingExpense}
                  onSuccess={() => { setEditExpenseDialogOpen(false); setEditingExpense(null); }}
                />
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={fixedCostOpen} onOpenChange={(open) => { setFixedCostOpen(open); if (!open) setEditingCost(null); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-fixed-cost">
                <Plus className="w-4 h-4 mr-2" />
                Custo Fixo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Custo Fixo</DialogTitle>
              </DialogHeader>
              <FixedCostForm onSuccess={() => setFixedCostOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingCost(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Custo Fixo</DialogTitle>
              </DialogHeader>
              {editingCost && (
                <FixedCostForm
                  key={editingCost.id}
                  editingCost={editingCost}
                  onSuccess={() => { setEditDialogOpen(false); setEditingCost(null); }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Period Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px]" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ano</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[100px]" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {period !== "annual" && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mês</Label>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="w-[140px]" data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {period === "weekly" && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Semana</Label>
                <Select value={String(week)} onValueChange={(v) => setWeek(Number(v))}>
                  <SelectTrigger className="w-[100px]" data-testid="select-week">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((w) => (
                      <SelectItem key={w} value={String(w)}>Semana {w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-chart-2/10 flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receita Total</p>
                  <p className="text-xl font-bold text-chart-2" data-testid="text-total-income">
                    {formatCurrency(report.summary.totalIncome)}
                  </p>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      Alugueis: {formatCurrency(report.summary.rentalIncome)}
                    </span>
                    {report.summary.extraRevenueTotal > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Extras: {formatCurrency(report.summary.extraRevenueTotal)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-destructive/10 flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Despesas Totais</p>
                  <p className="text-xl font-bold text-destructive" data-testid="text-total-expenses">
                    {formatCurrency(report.summary.totalExpenses)}
                  </p>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      Manut: {formatCurrency(report.summary.maintenanceCost)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Fixo: {formatCurrency(report.summary.fixedCostTotal)}
                    </span>
                    {report.summary.extraExpenseTotal > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Extra: {formatCurrency(report.summary.extraExpenseTotal)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center ${
                  report.summary.netResult >= 0 ? "bg-chart-2/10" : "bg-destructive/10"
                }`}>
                  {report.summary.netResult >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-chart-2" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resultado Líquido</p>
                  <p className={`text-xl font-bold ${
                    report.summary.netResult >= 0 ? "text-chart-2" : "text-destructive"
                  }`} data-testid="text-net-result">
                    {formatCurrency(report.summary.netResult)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per Motorcycle Breakdown */}
          {report.perMotorcycle.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bike className="w-5 h-5" />
                  Resultado por Moto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Moto</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Manutenção</TableHead>
                      <TableHead className="text-right">Custos Fixos</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.perMotorcycle.map((m) => (
                      <TableRow key={m.motorcycleId} data-testid={`row-moto-${m.motorcycleId}`}>
                        <TableCell className="font-medium">{m.brand} {m.model}</TableCell>
                        <TableCell>{m.plate}</TableCell>
                        <TableCell className="text-right text-chart-2">
                          {formatCurrency(m.income)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(m.maintenance)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(m.fixedCosts)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${
                          m.net >= 0 ? "text-chart-2" : "text-destructive"
                        }`}>
                          {formatCurrency(m.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {report.summary.unassignedIncome > 0 && (
                      <TableRow data-testid="row-moto-unassigned">
                        <TableCell className="font-medium text-muted-foreground">Sem vínculo</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="text-right text-chart-2">
                          {formatCurrency(report.summary.unassignedIncome)}
                        </TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right font-bold text-chart-2">
                          {formatCurrency(report.summary.unassignedIncome)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Detailed Sections */}
          <div className="space-y-3">
            {/* Payments Detail */}
            <Card>
              <button
                onClick={() => toggleSection("payments")}
                className="w-full"
                data-testid="button-toggle-payments"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-chart-2" />
                    Recebimentos ({report.paymentDetails.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-chart-2">
                      {formatCurrency(report.summary.totalIncome)}
                    </span>
                    {expandedSection === "payments" ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </button>
              {expandedSection === "payments" && (
                <CardContent className="pt-0">
                  {report.paymentDetails.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.paymentDetails.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{new Date(p.date).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>{p.customerName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{methodLabels[p.method] || p.method}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(p.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum recebimento neste período
                    </p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Maintenance Detail */}
            <Card>
              <button
                onClick={() => toggleSection("maintenance")}
                className="w-full"
                data-testid="button-toggle-maintenance"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-destructive" />
                    Manutenções ({report.maintenanceDetails.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-destructive">
                      {formatCurrency(report.summary.maintenanceCost)}
                    </span>
                    {expandedSection === "maintenance" ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </button>
              {expandedSection === "maintenance" && (
                <CardContent className="pt-0">
                  {report.maintenanceDetails.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Moto</TableHead>
                          <TableHead>Serviços</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.maintenanceDetails.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell>{new Date(o.date).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>
                              <span className="text-sm">{o.motorcycleName}</span>
                              <span className="text-xs text-muted-foreground ml-1">({o.motorcyclePlate})</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm truncate max-w-xs block">{o.items || "-"}</span>
                            </TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              {formatCurrency(o.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma manutenção neste período
                    </p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Fixed Costs Detail */}
            <Card>
              <button
                onClick={() => toggleSection("fixedCosts")}
                className="w-full"
                data-testid="button-toggle-fixed-costs"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MinusCircle className="w-4 h-4 text-chart-3" />
                    Custos Fixos ({report.fixedCostDetails.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-chart-3">
                      {formatCurrency(report.summary.fixedCostTotal)}
                    </span>
                    {expandedSection === "fixedCosts" ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </button>
              {expandedSection === "fixedCosts" && (
                <CardContent className="pt-0">
                  {report.fixedCostDetails.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Moto</TableHead>
                          <TableHead>Ref.</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.fixedCostDetails.map((c) => (
                          <TableRow key={c.id} data-testid={`row-fixed-cost-${c.id}`}>
                            <TableCell className="font-medium">{c.description}</TableCell>
                            <TableCell>
                              <span className="text-sm">{c.motorcycleName}</span>
                              <span className="text-xs text-muted-foreground ml-1">({c.motorcyclePlate})</span>
                            </TableCell>
                            <TableCell>
                              {c.referenceMonth.split("-").reverse().join("/")}
                            </TableCell>
                            <TableCell className="text-right font-medium text-chart-3">
                              {formatCurrency(c.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingCost({
                                      id: c.id,
                                      motorcycleId: c.motorcycleId,
                                      description: c.description,
                                      amount: c.amount,
                                      referenceMonth: c.referenceMonth,
                                    });
                                    setEditDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-fixed-cost-${c.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (window.confirm("Remover este custo fixo?")) {
                                      deleteFixedCost.mutate(c.id);
                                    }
                                  }}
                                  data-testid={`button-delete-fixed-cost-${c.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum custo fixo neste período
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
            {/* Extra Revenues Detail */}
            <Card>
              <button
                onClick={() => toggleSection("extraRevenues")}
                className="w-full"
                data-testid="button-toggle-extra-revenues"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-chart-4" />
                    Receitas Extras ({report.extraRevenueDetails?.length || 0})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-chart-4">
                      {formatCurrency(report.summary.extraRevenueTotal)}
                    </span>
                    {expandedSection === "extraRevenues" ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </button>
              {expandedSection === "extraRevenues" && (
                <CardContent className="pt-0">
                  {report.extraRevenueDetails && report.extraRevenueDetails.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descri\u00e7\u00e3o</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.extraRevenueDetails.map((r) => (
                          <TableRow key={r.id} data-testid={`row-extra-revenue-${r.id}`}>
                            <TableCell>{new Date(r.date).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="font-medium">
                              {r.description}
                              {r.notes && (
                                <span className="text-xs text-muted-foreground ml-1">({r.notes})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{categoryLabels[r.category] || r.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-chart-4">
                              {formatCurrency(r.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingRevenue({
                                      id: r.id,
                                      description: r.description,
                                      amount: r.amount,
                                      date: r.date,
                                      category: r.category,
                                      notes: r.notes,
                                    });
                                    setEditRevenueDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-extra-revenue-${r.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (window.confirm("Remover esta receita extra?")) {
                                      deleteExtraRevenue.mutate(r.id);
                                    }
                                  }}
                                  data-testid={`button-delete-extra-revenue-${r.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma receita extra neste per\u00edodo
                    </p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Extra Expenses Detail */}
            <Card>
              <button
                onClick={() => toggleSection("extraExpenses")}
                className="w-full"
                data-testid="button-toggle-extra-expenses"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-500" />
                    Despesas Extras ({report.extraExpenseDetails?.length || 0})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-500">
                      {formatCurrency(report.summary.extraExpenseTotal)}
                    </span>
                    {expandedSection === "extraExpenses" ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </button>
              {expandedSection === "extraExpenses" && (
                <CardContent className="pt-0">
                  {report.extraExpenseDetails && report.extraExpenseDetails.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descri\u00e7\u00e3o</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Moto</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.extraExpenseDetails.map((e) => (
                          <TableRow key={e.id} data-testid={`row-extra-expense-${e.id}`}>
                            <TableCell>{new Date(e.date).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="font-medium">
                              {e.description}
                              {e.notes && (
                                <span className="text-xs text-muted-foreground ml-1">({e.notes})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{expenseCategoryLabels[e.category] || e.category}</Badge>
                            </TableCell>
                            <TableCell>
                              {e.motorcycleName ? (
                                <>
                                  <span className="text-sm">{e.motorcycleName}</span>
                                  <span className="text-xs text-muted-foreground ml-1">({e.motorcyclePlate})</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-orange-500">
                              {formatCurrency(e.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingExpense({
                                      id: e.id,
                                      description: e.description,
                                      amount: e.amount,
                                      date: e.date,
                                      category: e.category,
                                      motorcycleId: e.motorcycleId,
                                      notes: e.notes,
                                    });
                                    setEditExpenseDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-extra-expense-${e.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (window.confirm("Remover esta despesa extra?")) {
                                      deleteExtraExpense.mutate(e.id);
                                    }
                                  }}
                                  data-testid={`button-delete-extra-expense-${e.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma despesa extra neste per\u00edodo
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
