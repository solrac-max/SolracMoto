import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
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
  Bike,
  MapPin,
  Edit,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Motorcycle, insertMotorcycleSchema } from "@shared/schema";

const motorcycleFormSchema = insertMotorcycleSchema.extend({
  plate: insertMotorcycleSchema.shape.plate,
  chassis: insertMotorcycleSchema.shape.chassis,
  brand: insertMotorcycleSchema.shape.brand,
  model: insertMotorcycleSchema.shape.model,
  year: insertMotorcycleSchema.shape.year,
  color: insertMotorcycleSchema.shape.color,
  dailyRate: insertMotorcycleSchema.shape.dailyRate,
  weeklyRate: insertMotorcycleSchema.shape.weeklyRate,
  monthlyRate: insertMotorcycleSchema.shape.monthlyRate,
  deposit: insertMotorcycleSchema.shape.deposit,
});

type MotorcycleFormValues = z.infer<typeof motorcycleFormSchema>;

const statusLabels: Record<string, string> = {
  available: "Disponível",
  rented: "Alugada",
  maintenance: "Manutenção",
  blocked: "Bloqueada",
};

const statusColors: Record<string, string> = {
  available: "bg-chart-2/10 text-chart-2",
  rented: "bg-chart-1/10 text-chart-1",
  maintenance: "bg-chart-3/10 text-chart-3",
  blocked: "bg-muted text-muted-foreground",
};

function MotorcycleForm({
  motorcycle,
  onSuccess,
}: {
  motorcycle?: Motorcycle;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!motorcycle;

  const form = useForm<MotorcycleFormValues>({
    resolver: zodResolver(motorcycleFormSchema),
    defaultValues: {
      plate: motorcycle?.plate || "",
      chassis: motorcycle?.chassis || "",
      renavam: motorcycle?.renavam || "",
      brand: motorcycle?.brand || "",
      model: motorcycle?.model || "",
      year: motorcycle?.year || new Date().getFullYear(),
      color: motorcycle?.color || "",
      status: (motorcycle?.status as any) || "available",
      dailyRate: motorcycle?.dailyRate || "0",
      weeklyRate: motorcycle?.weeklyRate || "0",
      monthlyRate: motorcycle?.monthlyRate || "0",
      deposit: motorcycle?.deposit || "0",
      unlimitedKm: motorcycle?.unlimitedKm ?? true,
      kmLimit: motorcycle?.kmLimit || undefined,
      currentKm: motorcycle?.currentKm || 0,
      trackerId: motorcycle?.trackerId || "",
      trackerActive: motorcycle?.trackerActive === true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: MotorcycleFormValues) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/motorcycles/${motorcycle.id}`, data);
      }
      return apiRequest("POST", "/api/motorcycles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      toast({
        title: isEditing ? "Moto atualizada" : "Moto cadastrada",
        description: isEditing
          ? "Os dados da moto foram atualizados."
          : "Nova moto adicionada à frota.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a moto.",
        variant: "destructive",
      });
    },
  });

  const control = form.control as any;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data: any) => mutation.mutate(data))}
        className="space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="ABC-1234"
                    data-testid="input-plate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="chassis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chassi *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="9BWZZZ377VT004251"
                    data-testid="input-chassis"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Honda"
                    data-testid="input-brand"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="CG 160"
                    data-testid="input-model"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    data-testid="input-year"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Vermelha"
                    data-testid="input-color"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="rented">Alugada</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="blocked">Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <FormField
            control={control}
            name="dailyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diária (R$)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    data-testid="input-daily-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="weeklyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Semanal (R$)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    data-testid="input-weekly-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="monthlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensal (R$)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    data-testid="input-monthly-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caução (R$)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    data-testid="input-deposit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="currentKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km Atual</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    data-testid="input-current-km"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="trackerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Rastreador</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="GPS-001"
                    data-testid="input-tracker-id"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-6">
          <FormField
            control={control}
            name="unlimitedKm"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-unlimited-km"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Km Ilimitado</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="trackerActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-tracker-active"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Rastreador Ativo</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-submit-motorcycle"
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

export default function MotorcyclesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | undefined>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: motorcycles, isLoading } = useQuery<Motorcycle[]>({
    queryKey: ["/api/motorcycles"],
  });

  const filteredMotorcycles = motorcycles?.filter((moto) => {
    const matchesSearch =
      moto.plate.toLowerCase().includes(search.toLowerCase()) ||
      moto.model.toLowerCase().includes(search.toLowerCase()) ||
      moto.brand.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || moto.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (motorcycle: Motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingMotorcycle(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-motorcycles-title">
            Motos
          </h1>
          <p className="text-muted-foreground">
            Gerencie a frota de motos
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingMotorcycle(undefined)}
              data-testid="button-add-motorcycle"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Moto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMotorcycle ? "Editar Moto" : "Cadastrar Nova Moto"}
              </DialogTitle>
            </DialogHeader>
            <MotorcycleForm
              motorcycle={editingMotorcycle}
              onSuccess={handleClose}
            />
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
                placeholder="Buscar por placa, modelo ou marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-motorcycles"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="rented">Alugada</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Motorcycles Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMotorcycles && filteredMotorcycles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moto</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead className="hidden md:table-cell">Ano</TableHead>
                  <TableHead className="hidden lg:table-cell">Km Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Mensal</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMotorcycles.map((moto) => (
                  <TableRow key={moto.id} data-testid={`row-motorcycle-${moto.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Bike className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {moto.brand} {moto.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {moto.color}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{moto.plate}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {moto.year}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {moto.currentKm?.toLocaleString("pt-BR")} km
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[moto.status]}
                      >
                        {statusLabels[moto.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(moto.monthlyRate))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-actions-${moto.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(moto)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {moto.lastLatitude && moto.lastLongitude && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://www.google.com/maps?q=${moto.lastLatitude},${moto.lastLongitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Ver Localização
                              </a>
                            </DropdownMenuItem>
                          )}
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
                <Bike className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Nenhuma moto encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Cadastre a primeira moto da sua frota"}
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => setIsOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Moto
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
