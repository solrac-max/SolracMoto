import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Plus, Trash2, Mail, UserCheck, Wrench, Pencil, Eye, EyeOff, FileText, Upload, Download, FileCheck } from "lucide-react";
import type { AllowedEmail, ServiceCatalog, ContractTemplate } from "@shared/schema";

const CATALOG_CATEGORIES = [
  "Motor",
  "Freios",
  "Suspensão",
  "Elétrica",
  "Transmissão",
  "Pneus",
  "Lubrificação",
  "Revisão",
  "Outros",
];

function formatCurrency(value: string | number | null) {
  const num = Number(value) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [contractUploading, setContractUploading] = useState(false);

  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<ServiceCatalog | null>(null);
  const [catalogForm, setCatalogForm] = useState({
    name: "",
    category: "",
    partsCost: "0",
    laborCost: "0",
    notes: "",
    active: true,
  });

  const { data: allowedEmails = [], isLoading: emailsLoading } = useQuery<AllowedEmail[]>({
    queryKey: ["/api/allowed-emails"],
  });

  const { data: catalogItems = [], isLoading: catalogLoading } = useQuery<ServiceCatalog[]>({
    queryKey: ["/api/service-catalog"],
  });

  const { data: contractTemplates = [], isLoading: templatesLoading } = useQuery<ContractTemplate[]>({
    queryKey: ["/api/contract-templates"],
  });

  const uploadContractMutation = useMutation({
    mutationFn: async (data: { name: string; fileData: string; fileName: string; fileType: string }) => {
      return apiRequest("POST", "/api/contract-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-templates"] });
      toast({ title: "Contrato enviado", description: "O modelo de contrato foi atualizado." });
      setContractUploading(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível enviar o contrato.", variant: "destructive" });
      setContractUploading(false);
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/contract-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-templates"] });
      toast({ title: "Contrato removido" });
    },
  });

  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Arquivo muito grande", description: "O arquivo deve ter no máximo 10MB.", variant: "destructive" });
      return;
    }

    setContractUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadContractMutation.mutate({
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileData: base64,
        fileName: file.name,
        fileType: file.type,
      });
    };
    reader.onerror = () => {
      toast({ title: "Erro ao ler o arquivo", variant: "destructive" });
      setContractUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDownloadContract = (template: ContractTemplate) => {
    const link = document.createElement("a");
    link.href = template.fileData;
    link.download = template.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addEmailMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      return apiRequest("POST", "/api/allowed-emails", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allowed-emails"] });
      toast({ title: "Acesso adicionado", description: "O e-mail foi autorizado com sucesso." });
      setEmailDialogOpen(false);
      setEmail("");
      setName("");
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Não foi possível adicionar o e-mail.", variant: "destructive" });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/allowed-emails/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allowed-emails"] });
      toast({ title: "Acesso removido", description: "O e-mail foi removido da lista." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Não foi possível remover o e-mail.", variant: "destructive" });
    },
  });

  const createCatalogMutation = useMutation({
    mutationFn: async (data: typeof catalogForm) => {
      return apiRequest("POST", "/api/service-catalog", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({ title: "Item criado", description: "Item adicionado ao catálogo." });
      closeCatalogDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Não foi possível criar o item.", variant: "destructive" });
    },
  });

  const updateCatalogMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof catalogForm }) => {
      return apiRequest("PATCH", `/api/service-catalog/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({ title: "Item atualizado", description: "Item do catálogo atualizado." });
      closeCatalogDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Não foi possível atualizar o item.", variant: "destructive" });
    },
  });

  const deleteCatalogMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/service-catalog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({ title: "Item excluído", description: "Item removido do catálogo." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Não foi possível excluir o item.", variant: "destructive" });
    },
  });

  const toggleCatalogActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return apiRequest("PATCH", `/api/service-catalog/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
    },
  });

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    addEmailMutation.mutate({ email: email.trim(), name: name.trim() || undefined });
  };

  function openCatalogDialog(item?: ServiceCatalog) {
    if (item) {
      setEditingCatalogItem(item);
      setCatalogForm({
        name: item.name,
        category: item.category,
        partsCost: String(item.partsCost),
        laborCost: String(item.laborCost),
        notes: item.notes || "",
        active: item.active,
      });
    } else {
      setEditingCatalogItem(null);
      setCatalogForm({ name: "", category: "", partsCost: "0", laborCost: "0", notes: "", active: true });
    }
    setCatalogDialogOpen(true);
  }

  function closeCatalogDialog() {
    setCatalogDialogOpen(false);
    setEditingCatalogItem(null);
    setCatalogForm({ name: "", category: "", partsCost: "0", laborCost: "0", notes: "", active: true });
  }

  function handleCatalogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catalogForm.name.trim() || !catalogForm.category) return;
    if (editingCatalogItem) {
      updateCatalogMutation.mutate({ id: editingCatalogItem.id, data: catalogForm });
    } else {
      createCatalogMutation.mutate(catalogForm);
    }
  }

  const groupedCatalog = catalogItems.reduce<Record<string, ServiceCatalog[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-settings-title">Configurações</h1>
        <p className="text-muted-foreground">Gerencie o controle de acesso e catálogo de serviços</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Controle de Acesso</CardTitle>
              <CardDescription>
                Apenas os e-mails listados abaixo poderão acessar o sistema. Se a lista estiver vazia, qualquer pessoa pode entrar.
              </CardDescription>
            </div>
          </div>
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-allowed-email">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Autorizar novo acesso</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-allowed-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome (opcional)</Label>
                  <Input
                    id="name"
                    placeholder="Nome do usuário"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-allowed-name"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addEmailMutation.isPending} data-testid="button-confirm-add-email">
                  {addEmailMutation.isPending ? "Adicionando..." : "Autorizar Acesso"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {emailsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : allowedEmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhuma restrição configurada</p>
              <p className="text-sm mt-1">Qualquer pessoa pode acessar o sistema. Adicione e-mails para restringir o acesso.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allowedEmails.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-md border"
                  data-testid={`row-allowed-email-${item.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-allowed-email-${item.id}`}>{item.email}</p>
                      {item.name && (
                        <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      Autorizado
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteEmailMutation.mutate(item.id)}
                      disabled={deleteEmailMutation.isPending}
                      data-testid={`button-delete-email-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-4">
                Total: {allowedEmails.length} {allowedEmails.length === 1 ? "e-mail autorizado" : "e-mails autorizados"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Catálogo de Serviços</CardTitle>
              <CardDescription>
                Cadastre serviços e peças com custos pré-configurados. Ao criar uma ordem de manutenção, selecione do catálogo para preencher automaticamente.
              </CardDescription>
            </div>
          </div>
          <Dialog open={catalogDialogOpen} onOpenChange={(open) => { if (!open) closeCatalogDialog(); else setCatalogDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button onClick={() => openCatalogDialog()} data-testid="button-add-catalog-item">
                <Plus className="w-4 h-4 mr-1" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCatalogItem ? "Editar Item" : "Novo Item do Catálogo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCatalogSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={catalogForm.name}
                    onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                    placeholder="Ex: Troca de óleo"
                    required
                    data-testid="input-catalog-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={catalogForm.category} onValueChange={(v) => setCatalogForm({ ...catalogForm, category: v })}>
                    <SelectTrigger data-testid="select-catalog-category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATALOG_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label>Custo Peças (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={catalogForm.partsCost}
                      onChange={(e) => setCatalogForm({ ...catalogForm, partsCost: e.target.value })}
                      data-testid="input-catalog-parts-cost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mão de Obra (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={catalogForm.laborCost}
                      onChange={(e) => setCatalogForm({ ...catalogForm, laborCost: e.target.value })}
                      data-testid="input-catalog-labor-cost"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={catalogForm.notes}
                    onChange={(e) => setCatalogForm({ ...catalogForm, notes: e.target.value })}
                    placeholder="Detalhes adicionais..."
                    className="resize-none"
                    data-testid="input-catalog-notes"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createCatalogMutation.isPending || updateCatalogMutation.isPending}
                  data-testid="button-confirm-catalog"
                >
                  {(createCatalogMutation.isPending || updateCatalogMutation.isPending) ? "Salvando..." : editingCatalogItem ? "Salvar Alterações" : "Adicionar ao Catálogo"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {catalogLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : catalogItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum item cadastrado</p>
              <p className="text-sm mt-1">Adicione serviços e peças ao catálogo para agilizar o preenchimento de ordens de manutenção.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCatalog).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h3>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serviço/Peça</TableHead>
                          <TableHead className="text-right">Peças</TableHead>
                          <TableHead className="text-right">Mão de Obra</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id} className={!item.active ? "opacity-50" : ""} data-testid={`row-catalog-${item.id}`}>
                            <TableCell>
                              <div>
                                <span className="font-medium" data-testid={`text-catalog-name-${item.id}`}>{item.name}</span>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.partsCost)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.laborCost)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(Number(item.partsCost) + Number(item.laborCost))}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleCatalogActiveMutation.mutate({ id: item.id, active: !item.active })}
                                data-testid={`button-toggle-catalog-${item.id}`}
                              >
                                {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openCatalogDialog(item)}
                                  data-testid={`button-edit-catalog-${item.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Excluir este item do catálogo?")) {
                                      deleteCatalogMutation.mutate(item.id);
                                    }
                                  }}
                                  data-testid={`button-delete-catalog-${item.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Total: {catalogItems.length} {catalogItems.length === 1 ? "item" : "itens"} ({catalogItems.filter(i => i.active).length} ativos)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Modelo de Contrato</CardTitle>
              <CardDescription>
                Envie um documento de contrato atualizado (PDF, DOC, DOCX). O sistema mantém o contrato ativo para impressão na tela de contratos.
              </CardDescription>
            </div>
          </div>
          <div>
            <label htmlFor="contract-upload">
              <Button
                asChild
                disabled={contractUploading || uploadContractMutation.isPending}
                data-testid="button-upload-contract"
              >
                <span>
                  <Upload className="w-4 h-4 mr-1" />
                  {contractUploading ? "Enviando..." : "Enviar Contrato"}
                </span>
              </Button>
            </label>
            <input
              id="contract-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleContractUpload}
              data-testid="input-contract-file"
            />
          </div>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
            </div>
          ) : contractTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum contrato enviado</p>
              <p className="text-sm mt-1">Envie um modelo de contrato para que ele fique disponível para impressão.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contractTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-md border"
                  data-testid={`row-contract-${template.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-contract-name-${template.id}`}>
                        {template.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Enviado em {template.uploadedAt ? new Date(template.uploadedAt).toLocaleDateString("pt-BR") : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {template.active && (
                      <Badge variant="secondary" className="text-xs">Ativo</Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownloadContract(template)}
                      data-testid={`button-download-contract-${template.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Remover este modelo de contrato?")) {
                          deleteContractMutation.mutate(template.id);
                        }
                      }}
                      data-testid={`button-delete-contract-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
