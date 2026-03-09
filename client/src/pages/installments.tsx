import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Calendar,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { RentalInstallment, Rental, Customer } from "@shared/schema";

interface InstallmentWithRelations extends RentalInstallment {
  rental?: Rental;
  customer?: Customer;
}

const statusLabels: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Vencido",
};

const statusColors: Record<string, string> = {
  paid: "bg-chart-2/10 text-chart-2",
  pending: "bg-chart-4/10 text-chart-4",
  overdue: "bg-destructive/10 text-destructive",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  paid: CheckCircle,
  pending: Clock,
  overdue: AlertTriangle,
};

export default function InstallmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: installments, isLoading } = useQuery<InstallmentWithRelations[]>({
    queryKey: ["/api/installments"],
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      return apiRequest("PATCH", `/api/installments/${installmentId}`, {
        status: "paid",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Parcela atualizada",
        description: "A parcela foi marcada como paga.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a parcela.",
        variant: "destructive",
      });
    },
  });

  const getInstallmentStatus = (installment: InstallmentWithRelations): string => {
    if (installment.status === "paid") return "paid";
    const dueDate = new Date(installment.dueDate);
    const today = new Date();
    if (dueDate < today) return "overdue";
    return "pending";
  };

  const getDaysUntilDue = (dueDate: string): number => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const filteredInstallments = installments?.filter((installment) => {
    const status = getInstallmentStatus(installment);
    const matchesSearch = installment.customer?.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group installments by status for summary
  const summary = {
    pending: installments?.filter(i => getInstallmentStatus(i) === "pending").length || 0,
    overdue: installments?.filter(i => getInstallmentStatus(i) === "overdue").length || 0,
    paid: installments?.filter(i => getInstallmentStatus(i) === "paid").length || 0,
    overdueAmount: installments
      ?.filter(i => getInstallmentStatus(i) === "overdue")
      .reduce((sum, i) => sum + Number(i.amount), 0) || 0,
  };

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
          <h1 className="text-2xl font-bold" data-testid="text-installments-title">
            Parcelas
          </h1>
          <p className="text-muted-foreground">Controle de recorrência mensal</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold" data-testid="text-pending-count">{summary.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-overdue-count">{summary.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor em Atraso</p>
                <p className="text-xl font-bold text-destructive" data-testid="text-overdue-amount">
                  {formatCurrency(summary.overdueAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagas</p>
                <p className="text-2xl font-bold text-chart-2" data-testid="text-paid-count">{summary.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                data-testid="input-search-installments"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
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
          ) : filteredInstallments && filteredInstallments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Competência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.map((installment) => {
                  const status = getInstallmentStatus(installment);
                  const daysUntilDue = getDaysUntilDue(installment.dueDate);
                  const StatusIcon = statusIcons[status];
                  
                  return (
                    <TableRow key={installment.id} data-testid={`row-installment-${installment.id}`}>
                      <TableCell>
                        <p className="font-medium">
                          {installment.customer?.name || "Cliente"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p>
                              {format(new Date(installment.dueDate), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                            {status === "pending" && daysUntilDue <= 7 && daysUntilDue >= 0 && (
                              <p className="text-xs text-chart-4">
                                Vence em {daysUntilDue} dia{daysUntilDue !== 1 ? "s" : ""}
                              </p>
                            )}
                            {status === "overdue" && (
                              <p className="text-xs text-destructive">
                                Vencido há {Math.abs(daysUntilDue)} dia{Math.abs(daysUntilDue) !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${status === "overdue" ? "text-destructive" : ""}`}>
                          {formatCurrency(installment.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {installment.competence || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${statusColors[status]} gap-1`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusLabels[status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {status !== "paid" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-actions-${installment.id}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => markAsPaidMutation.mutate(installment.id)}
                                data-testid={`button-mark-paid-${installment.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marcar como Pago
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Nenhuma parcela encontrada
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "As parcelas serão geradas automaticamente ao criar aluguéis"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
