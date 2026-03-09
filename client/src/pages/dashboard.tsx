import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Bike,
  Users,
  FileText,
  CreditCard,
  Wrench,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Phone,
  ChevronRight,
  DollarSign,
  Check,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  motorcycles: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    blocked: number;
  };
  customers: {
    total: number;
    withActiveRentals: number;
  };
  rentals: {
    active: number;
    expiringSoon: number;
  };
  payments: {
    monthlyRevenue: number;
    overdueCount: number;
    overdueAmount: number;
  };
  maintenance: {
    monthlyCost: number;
    pendingCount: number;
  };
  alerts: Array<{
    id: string;
    type: "rental_expiring" | "payment_overdue" | "maintenance_due";
    message: string;
    date: string;
  }>;
}

interface DueTodayRental {
  rentalId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  motorcyclePlate: string;
  motorcycleBrandModel: string;
  plan: string;
  installments: Array<{ id: string; dueDate: string; amount: number; status: string }>;
  totalAmount: number;
}

interface OverdueRental {
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
}

const planLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {(description || trendValue) && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" && (
                  <TrendingUp className="h-3 w-3 text-chart-2" />
                )}
                {trend === "down" && (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span
                  className={`text-xs ${
                    trend === "up"
                      ? "text-chart-2"
                      : trend === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {trendValue || description}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({
  type,
  message,
  date,
}: {
  type: "rental_expiring" | "payment_overdue" | "maintenance_due";
  message: string;
  date: string;
}) {
  const typeConfig = {
    rental_expiring: {
      icon: Calendar,
      color: "bg-chart-3/10 text-chart-3",
      label: "Aluguel",
    },
    payment_overdue: {
      icon: CreditCard,
      color: "bg-destructive/10 text-destructive",
      label: "Pagamento",
    },
    maintenance_due: {
      icon: Wrench,
      color: "bg-chart-4/10 text-chart-4",
      label: "Manutenção",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`p-2 rounded-md ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <Badge variant="outline" className="text-xs">
        {config.label}
      </Badge>
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const [payingItem, setPayingItem] = useState<OverdueRental | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: overdueRentals, isLoading: isLoadingOverdue } = useQuery<OverdueRental[]>({
    queryKey: ["/api/dashboard/overdue-rentals"],
  });

  const { data: dueToday, isLoading: isLoadingDueToday } = useQuery<DueTodayRental[]>({
    queryKey: ["/api/dashboard/due-today"],
  });

  const [payingDueTodayItem, setPayingDueTodayItem] = useState<DueTodayRental | null>(null);

  const handleOpenDueTodayPayDialog = (item: DueTodayRental, e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    setPaymentMethod("pix");
    const ids = new Set(item.installments.map(i => i.id));
    setSelectedInstallments(ids);
    setPayingDueTodayItem(item);
  };

  const payMutation = useMutation({
    mutationFn: async ({ rentalId, customerId, installmentList, method }: { rentalId: string; customerId: string; installmentList: Array<{ id: string; amount: number }>; method: string }) => {
      return apiRequest("POST", "/api/payments/batch", {
        rentalId,
        customerId,
        method,
        installments: installmentList,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overdue-rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/due-today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({
        title: "Pagamento registrado",
        description: "A baixa foi realizada com sucesso.",
      });
      setPayingItem(null);
      setPayingDueTodayItem(null);
      setSelectedInstallments(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleOpenPayDialog = (item: OverdueRental, e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    setPaymentMethod("pix");
    setSelectedInstallments(new Set([item.oldestInstallmentId]));
    setPayingItem(item);
  };

  const toggleInstallment = (id: string) => {
    setSelectedInstallments(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allPayableInstallments = payingItem
    ? payingItem.overdueInstallments
    : payingDueTodayItem
    ? payingDueTodayItem.installments
    : [];

  const selectedTotal = allPayableInstallments
    .filter(i => selectedInstallments.has(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  const activePayItem = payingItem || payingDueTodayItem;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visão geral da sua frota de motos
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Motos Disponíveis"
          value={stats?.motorcycles.available ?? 0}
          icon={Bike}
          description={`${stats?.motorcycles.total ?? 0} total`}
          loading={isLoading}
        />
        <StatCard
          title="Motos Alugadas"
          value={stats?.motorcycles.rented ?? 0}
          icon={FileText}
          description={`${stats?.rentals.expiringSoon ?? 0} vencendo em breve`}
          loading={isLoading}
        />
        <StatCard
          title="Receita do Mês"
          value={formatCurrency(stats?.payments.monthlyRevenue ?? 0)}
          icon={CreditCard}
          trend="up"
          trendValue="Este mês"
          loading={isLoading}
        />
        <StatCard
          title="Custo Manutenção"
          value={formatCurrency(stats?.maintenance.monthlyCost ?? 0)}
          icon={Wrench}
          description={`${stats?.maintenance.pendingCount ?? 0} pendentes`}
          loading={isLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Clientes Ativos"
          value={stats?.customers.withActiveRentals ?? 0}
          icon={Users}
          description={`${stats?.customers.total ?? 0} cadastrados`}
          loading={isLoading}
        />
        <StatCard
          title="Em Manutenção"
          value={stats?.motorcycles.maintenance ?? 0}
          icon={Wrench}
          loading={isLoading}
        />
        <StatCard
          title="Pagamentos Atrasados"
          value={stats?.payments.overdueCount ?? 0}
          icon={AlertTriangle}
          description={
            stats?.payments.overdueAmount
              ? formatCurrency(stats.payments.overdueAmount)
              : undefined
          }
          trend={stats?.payments.overdueCount ? "down" : undefined}
          loading={isLoading}
        />
        <StatCard
          title="Aluguéis Ativos"
          value={stats?.rentals.active ?? 0}
          icon={FileText}
          loading={isLoading}
        />
      </div>

      {/* Due Today */}
      {(isLoadingDueToday || (dueToday && dueToday.length > 0)) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-chart-1" />
              Aluguéis a Pagar Hoje
            </CardTitle>
            {dueToday && (
              <Badge variant="secondary" data-testid="badge-due-today-count">
                {dueToday.length} {dueToday.length === 1 ? "aluguel" : "aluguéis"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingDueToday ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {dueToday?.map((item) => {
                  const totalDue = formatCurrency(item.totalAmount);
                  return (
                    <div
                      key={item.rentalId}
                      className="flex items-center gap-3 p-3 rounded-md border hover-elevate"
                      data-testid={`row-due-today-${item.rentalId}`}
                    >
                      <div className="p-2 rounded-md bg-chart-1/10">
                        <CreditCard className="h-4 w-4 text-chart-1" />
                      </div>
                      <Link
                        href={`/customers?search=${encodeURIComponent(item.customerName)}`}
                        className="flex-1 min-w-0 cursor-pointer"
                        data-testid={`link-due-today-${item.rentalId}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold" data-testid={`text-due-today-customer-${item.rentalId}`}>
                            {item.customerName}
                          </span>
                          {item.customerPhone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {item.customerPhone}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {item.motorcycleBrandModel} ({item.motorcyclePlate})
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {planLabels[item.plan] || item.plan}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {item.installments.map((inst, idx) => (
                              <span key={inst.id}>
                                {idx > 0 && ", "}
                                {format(new Date(inst.dueDate), "dd/MM", { locale: ptBR })}
                              </span>
                            ))} - {totalDue}
                          </Badge>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        onClick={(e) => handleOpenDueTodayPayDialog(item, e)}
                        data-testid={`button-pay-due-today-${item.rentalId}`}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Dar Baixa
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overdue Rentals */}
      {(isLoadingOverdue || (overdueRentals && overdueRentals.length > 0)) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Aluguéis em Atraso
            </CardTitle>
            {overdueRentals && (
              <Badge variant="destructive" data-testid="badge-overdue-count">
                {overdueRentals.length} {overdueRentals.length === 1 ? "aluguel" : "aluguéis"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingOverdue ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {overdueRentals?.map((item) => {
                  const daysOverdue = formatDistanceToNow(new Date(item.oldestDueDate), {
                    locale: ptBR,
                  });
                  return (
                    <div
                      key={item.rentalId}
                      className="flex items-center gap-3 p-3 rounded-md border hover-elevate"
                      data-testid={`row-overdue-${item.rentalId}`}
                    >
                        <div className="p-2 rounded-md bg-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <Link
                          href={`/customers?search=${encodeURIComponent(item.customerName)}`}
                          className="flex-1 min-w-0 cursor-pointer"
                          data-testid={`link-overdue-${item.rentalId}`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold" data-testid={`text-overdue-customer-${item.rentalId}`}>
                              {item.customerName}
                            </span>
                            {item.customerPhone && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {item.customerPhone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {item.motorcycleBrandModel} ({item.motorcyclePlate})
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {planLabels[item.plan] || item.plan}
                            </Badge>
                            <Badge variant="destructive" className="text-xs">
                              {item.overdueInstallments.map((inst, idx) => (
                                <span key={inst.id}>
                                  {idx > 0 && ", "}
                                  {format(new Date(inst.dueDate), "dd/MM", { locale: ptBR })}
                                </span>
                              ))} - {formatCurrency(item.overdueAmount)}
                            </Badge>
                          </div>
                          <p className="text-xs text-destructive mt-0.5">
                            Atraso há {daysOverdue}
                          </p>
                        </Link>
                        <Button
                          size="sm"
                          onClick={(e) => handleOpenPayDialog(item, e)}
                          data-testid={`button-pay-overdue-${item.rentalId}`}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Dar Baixa
                        </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fleet Status and Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fleet Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status da Frota</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-chart-2/10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-chart-2" />
                    <span>Disponíveis</span>
                  </div>
                  <span className="font-bold text-chart-2">
                    {stats?.motorcycles.available ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-chart-1/10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-chart-1" />
                    <span>Alugadas</span>
                  </div>
                  <span className="font-bold text-chart-1">
                    {stats?.motorcycles.rented ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-chart-3/10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-chart-3" />
                    <span>Em Manutenção</span>
                  </div>
                  <span className="font-bold text-chart-3">
                    {stats?.motorcycles.maintenance ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <span>Bloqueadas</span>
                  </div>
                  <span className="font-bold text-muted-foreground">
                    {stats?.motorcycles.blocked ?? 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-chart-3" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats?.alerts && stats.alerts.length > 0 ? (
              <div className="space-y-3">
                {stats.alerts.slice(0, 5).map((alert) => (
                  <AlertItem
                    key={alert.id}
                    type={alert.type}
                    message={alert.message}
                    date={format(new Date(alert.date), "dd MMM, yyyy", {
                      locale: ptBR,
                    })}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center mb-3">
                  <Bike className="h-6 w-6 text-chart-2" />
                </div>
                <p className="text-muted-foreground">
                  Nenhum alerta no momento
                </p>
                <p className="text-sm text-muted-foreground">
                  Sua frota está operando normalmente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!activePayItem} onOpenChange={(open) => { if (!open) { setPayingItem(null); setPayingDueTodayItem(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {activePayItem && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50">
                <p className="font-semibold text-sm">{activePayItem.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {activePayItem.motorcycleBrandModel} ({activePayItem.motorcyclePlate})
                </p>
              </div>

              <div className="space-y-2">
                <Label>Selecione as parcelas para dar baixa</Label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {allPayableInstallments.map((inst) => (
                    <div
                      key={inst.id}
                      onClick={() => toggleInstallment(inst.id)}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                        selectedInstallments.has(inst.id)
                          ? "bg-chart-2/10 border-chart-2/30"
                          : ""
                      }`}
                      data-testid={`toggle-installment-${inst.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                          selectedInstallments.has(inst.id)
                            ? "bg-chart-2 border-chart-2 text-white"
                            : "border-muted-foreground/30"
                        }`}>
                          {selectedInstallments.has(inst.id) && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm">
                          Venc. {format(new Date(inst.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(inst.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <span className="text-sm font-medium">Total selecionado</span>
                <span className="font-bold text-chart-2" data-testid="text-payment-total">
                  {formatCurrency(selectedTotal)}
                </span>
              </div>

              <Button
                className="w-full"
                disabled={payMutation.isPending || selectedInstallments.size === 0}
                onClick={() => {
                  const instList = allPayableInstallments
                    .filter(i => selectedInstallments.has(i.id))
                    .map(i => ({ id: i.id, amount: i.amount }));
                  payMutation.mutate({
                    rentalId: activePayItem.rentalId,
                    customerId: activePayItem.customerId,
                    installmentList: instList,
                    method: paymentMethod,
                  });
                }}
                data-testid="button-confirm-payment"
              >
                {payMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
