import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
  Wrench,
  Calendar,
  Bike,
  DollarSign,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  Printer,
  Filter,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { printReport } from "@/lib/print-report";
import type { Motorcycle } from "@shared/schema";

interface MaintenanceOrderItem {
  id: string;
  type: string;
  entryDate: string;
  items: string | null;
  partsCost: string | number | null;
  laborCost: string | number | null;
  totalCost: string | number | null;
  completed: boolean;
}

interface MonthData {
  month: string;
  orders: MaintenanceOrderItem[];
  totalPartsCost: number;
  totalLaborCost: number;
  totalCost: number;
}

interface MotoReport {
  motorcycleId: string;
  plate: string;
  brand: string;
  model: string;
  months: MonthData[];
  grandTotalParts: number;
  grandTotalLabor: number;
  grandTotal: number;
}

const typeLabels: Record<string, string> = {
  preventive: "Preventiva",
  corrective: "Corretiva",
};

const typeColors: Record<string, string> = {
  preventive: "bg-chart-1/10 text-chart-1",
  corrective: "bg-chart-3/10 text-chart-3",
};

const formatCurrency = (value: string | number | null) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function MotoReportCard({ moto }: { moto: MotoReport }) {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => ({ ...prev, [month]: !prev[month] }));
  };

  return (
    <Card data-testid={`card-moto-${moto.motorcycleId}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Bike className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base" data-testid={`text-moto-name-${moto.motorcycleId}`}>
              {moto.brand} {moto.model}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{moto.plate}</p>
          </div>
        </div>
        <div className="text-right space-y-0.5">
          <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
            <span>Peças: {formatCurrency(moto.grandTotalParts)}</span>
            <span>M.O.: {formatCurrency(moto.grandTotalLabor)}</span>
          </div>
          <p className="text-lg font-bold" data-testid={`text-grand-total-${moto.motorcycleId}`}>
            {formatCurrency(moto.grandTotal)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {moto.months.map((monthData) => (
          <div key={monthData.month} className="border rounded-md">
            <button
              onClick={() => toggleMonth(monthData.month)}
              className="w-full flex items-center justify-between p-3 hover-elevate rounded-md"
              data-testid={`button-month-${moto.motorcycleId}-${monthData.month}`}
            >
              <div className="flex items-center gap-2">
                {expandedMonths[monthData.month] ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{monthData.month}</span>
                <Badge variant="outline" className="text-xs">
                  {monthData.orders.length} {monthData.orders.length === 1 ? "serviço" : "serviços"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="hidden sm:inline text-muted-foreground">
                  Peças: {formatCurrency(monthData.totalPartsCost)}
                </span>
                <span className="hidden sm:inline text-muted-foreground">
                  M.O.: {formatCurrency(monthData.totalLaborCost)}
                </span>
                <span className="font-semibold">
                  {formatCurrency(monthData.totalCost)}
                </span>
              </div>
            </button>

            {expandedMonths[monthData.month] && (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Serviços</TableHead>
                      <TableHead className="text-right">Peças</TableHead>
                      <TableHead className="text-right">M.O.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthData.orders.map((order) => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell>
                          <Badge variant="outline" className={typeColors[order.type]}>
                            {typeLabels[order.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(order.entryDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-xs truncate" title={order.items || ""}>
                            {order.items || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(order.partsCost)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(order.laborCost)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(order.totalCost)}
                        </TableCell>
                        <TableCell>
                          {order.completed ? (
                            <Badge variant="outline" className="bg-chart-2/10 text-chart-2 gap-1">
                              <CheckCircle className="w-3 h-3" />
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-chart-3/10 text-chart-3 gap-1">
                              <Clock className="w-3 h-3" />
                              Aberta
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell colSpan={3} className="text-right text-sm">
                        Subtotal do Mês
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(monthData.totalPartsCost)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(monthData.totalLaborCost)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {formatCurrency(monthData.totalCost)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function buildFilterDescription(
  filterMoto: string,
  filterDate: string,
  filterMonth: string,
  filterYear: string,
  motorcycles: Motorcycle[] | undefined,
) {
  const parts: string[] = [];
  if (filterMoto !== "all" && motorcycles) {
    const m = motorcycles.find((x) => x.id === filterMoto);
    if (m) parts.push(`Moto: ${m.brand} ${m.model} (${m.plate})`);
  }
  if (filterDate) parts.push(`Data: ${new Date(filterDate).toLocaleDateString("pt-BR")}`);
  if (filterMonth !== "all") parts.push(`Mês: ${monthNames[parseInt(filterMonth) - 1]}`);
  if (filterYear !== "all") parts.push(`Ano: ${filterYear}`);
  return parts.length > 0 ? parts.join(" | ") : "";
}

export default function MaintenanceReportPage() {
  const [filterMoto, setFilterMoto] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  const { data: report, isLoading } = useQuery<MotoReport[]>({
    queryKey: ["/api/maintenance/report"],
  });

  const { data: motorcycles } = useQuery<Motorcycle[]>({
    queryKey: ["/api/motorcycles"],
  });

  const availableYears = useMemo(() => {
    if (!report) return [];
    const years = new Set<string>();
    report.forEach((moto) => {
      moto.months.forEach((mo) => {
        mo.orders.forEach((o) => {
          const y = new Date(o.entryDate).getFullYear().toString();
          years.add(y);
        });
      });
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [report]);

  const filteredReport = useMemo(() => {
    if (!report) return [];

    let filtered = report;

    if (filterMoto !== "all") {
      filtered = filtered.filter((m) => m.motorcycleId === filterMoto);
    }

    filtered = filtered.map((moto) => {
      let months = moto.months.map((mo) => {
        let orders = mo.orders;

        if (filterDate) {
          orders = orders.filter((o) => o.entryDate === filterDate);
        }

        if (filterMonth !== "all") {
          orders = orders.filter((o) => {
            const m = new Date(o.entryDate).getMonth() + 1;
            return m === parseInt(filterMonth);
          });
        }

        if (filterYear !== "all") {
          orders = orders.filter((o) => {
            const y = new Date(o.entryDate).getFullYear().toString();
            return y === filterYear;
          });
        }

        if (orders.length === 0) return null;

        const totalPartsCost = orders.reduce((s, o) => s + (Number(o.partsCost) || 0), 0);
        const totalLaborCost = orders.reduce((s, o) => s + (Number(o.laborCost) || 0), 0);
        const totalCost = orders.reduce((s, o) => s + (Number(o.totalCost) || 0), 0);

        return { ...mo, orders, totalPartsCost, totalLaborCost, totalCost };
      }).filter(Boolean) as MonthData[];

      if (months.length === 0) return null;

      const grandTotalParts = months.reduce((s, mo) => s + mo.totalPartsCost, 0);
      const grandTotalLabor = months.reduce((s, mo) => s + mo.totalLaborCost, 0);
      const grandTotal = months.reduce((s, mo) => s + mo.totalCost, 0);

      return { ...moto, months, grandTotalParts, grandTotalLabor, grandTotal };
    }).filter(Boolean) as MotoReport[];

    return filtered;
  }, [report, filterMoto, filterDate, filterMonth, filterYear]);

  const overallTotalParts = filteredReport.reduce((sum, m) => sum + m.grandTotalParts, 0);
  const overallTotalLabor = filteredReport.reduce((sum, m) => sum + m.grandTotalLabor, 0);
  const overallTotal = filteredReport.reduce((sum, m) => sum + m.grandTotal, 0);
  const totalOrders = filteredReport.reduce(
    (sum, m) => sum + m.months.reduce((s, mo) => s + mo.orders.length, 0),
    0
  );

  const hasFilters = filterMoto !== "all" || filterDate !== "" || filterMonth !== "all" || filterYear !== "all";

  const clearFilters = () => {
    setFilterMoto("all");
    setFilterDate("");
    setFilterMonth("all");
    setFilterYear("all");
  };

  const filterDesc = buildFilterDescription(filterMoto, filterDate, filterMonth, filterYear, motorcycles);

  const handlePrintFiltered = () => {
    if (filteredReport.length === 0) return;
    const subtitle = filterDesc
      ? `${filterDesc} | ${filteredReport.length} motos | ${totalOrders} serviços`
      : `${filteredReport.length} motos | ${totalOrders} serviços`;

    printReport({
      title: "Relatório de Manutenção",
      subtitle,
      columns: [
        { header: "Moto" },
        { header: "Placa" },
        { header: "Peças", align: "right" },
        { header: "Mão de Obra", align: "right" },
        { header: "Total", align: "right" },
      ],
      rows: filteredReport.map((m) => [
        `${m.brand} ${m.model}`,
        m.plate,
        formatCurrency(m.grandTotalParts),
        formatCurrency(m.grandTotalLabor),
        formatCurrency(m.grandTotal),
      ]),
      totals: ["", "TOTAL GERAL", formatCurrency(overallTotalParts), formatCurrency(overallTotalLabor), formatCurrency(overallTotal)],
      sections: filteredReport.flatMap((moto) =>
        moto.months.map((mo) => ({
          title: `${moto.brand} ${moto.model} (${moto.plate}) - ${mo.month}`,
          columns: [
            { header: "Tipo" },
            { header: "Data" },
            { header: "Serviços" },
            { header: "Peças", align: "right" as const },
            { header: "M.O.", align: "right" as const },
            { header: "Total", align: "right" as const },
          ],
          rows: mo.orders.map((o) => [
            typeLabels[o.type] || o.type,
            new Date(o.entryDate).toLocaleDateString("pt-BR"),
            o.items || "-",
            formatCurrency(o.partsCost),
            formatCurrency(o.laborCost),
            formatCurrency(o.totalCost),
          ]),
          totals: [
            "",
            "",
            "Subtotal",
            formatCurrency(mo.totalPartsCost),
            formatCurrency(mo.totalLaborCost),
            formatCurrency(mo.totalCost),
          ],
        }))
      ),
    });
  };

  const handlePrintMoto = (moto: MotoReport) => {
    printReport({
      title: `Manutenção - ${moto.brand} ${moto.model}`,
      subtitle: `Placa: ${moto.plate} | Total: ${formatCurrency(moto.grandTotal)}${filterDesc ? ` | ${filterDesc}` : ""}`,
      columns: [],
      rows: [],
      sections: moto.months.map((mo) => ({
        title: mo.month,
        columns: [
          { header: "Tipo" },
          { header: "Data" },
          { header: "Serviços" },
          { header: "Peças", align: "right" as const },
          { header: "M.O.", align: "right" as const },
          { header: "Total", align: "right" as const },
        ],
        rows: mo.orders.map((o) => [
          typeLabels[o.type] || o.type,
          new Date(o.entryDate).toLocaleDateString("pt-BR"),
          o.items || "-",
          formatCurrency(o.partsCost),
          formatCurrency(o.laborCost),
          formatCurrency(o.totalCost),
        ]),
        totals: [
          "",
          "",
          "Subtotal",
          formatCurrency(mo.totalPartsCost),
          formatCurrency(mo.totalLaborCost),
          formatCurrency(mo.totalCost),
        ],
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-report-title">
            Relatório de Manutenção
          </h1>
          <p className="text-muted-foreground">
            Custos de manutenção por moto com filtros
          </p>
        </div>
        {filteredReport.length > 0 && (
          <Button onClick={handlePrintFiltered} variant="outline" data-testid="button-print-maintenance">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Relatório
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={filterMoto} onValueChange={setFilterMoto}>
              <SelectTrigger data-testid="select-filter-moto">
                <SelectValue placeholder="Todas as motos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as motos</SelectItem>
                {motorcycles?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.brand} {m.model} - {m.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                data-testid="input-filter-date"
              />
            </div>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger data-testid="select-filter-month">
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {monthNames.map((name, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger data-testid="select-filter-year">
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Bike className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Motos</p>
              <p className="text-xl font-bold" data-testid="text-total-motos">
                {filteredReport.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-chart-1/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Serviços</p>
              <p className="text-xl font-bold" data-testid="text-total-orders">
                {totalOrders}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-chart-4/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peças</p>
              <p className="text-xl font-bold" data-testid="text-total-parts">
                {formatCurrency(overallTotalParts)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-chart-5/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mão de Obra</p>
              <p className="text-xl font-bold" data-testid="text-total-labor">
                {formatCurrency(overallTotalLabor)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-chart-3/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Geral</p>
              <p className="text-xl font-bold" data-testid="text-total-cost">
                {formatCurrency(overallTotal)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredReport.length > 0 ? (
        <div className="space-y-4">
          {filteredReport.map((moto) => (
            <div key={moto.motorcycleId} className="space-y-2">
              <MotoReportCard moto={moto} />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePrintMoto(moto)}
                  data-testid={`button-print-moto-${moto.motorcycleId}`}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Imprimir {moto.brand} {moto.model}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {hasFilters ? "Nenhum resultado para os filtros" : "Nenhuma manutenção registrada"}
            </h3>
            <p className="text-muted-foreground">
              {hasFilters
                ? "Tente ajustar os filtros para encontrar resultados"
                : "Os custos aparecerão aqui conforme manutenções forem registradas"}
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters} data-testid="button-clear-filters-empty">
                <X className="w-4 h-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
