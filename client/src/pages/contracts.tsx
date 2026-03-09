import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  Printer,
  Eye,
  Calendar,
  Bike,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Rental, Customer, Motorcycle, ContractTemplate } from "@shared/schema";
import solracLogo from "@assets/WhatsApp_Image_2026-02-13_at_01.09.05_1771165708652.jpeg";
import { Download } from "lucide-react";

interface RentalWithRelations extends Rental {
  customer?: Customer;
  motorcycle?: Motorcycle;
}

const planLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

const billingLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string) {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

function formatDateLong(date: string) {
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function calcDurationMonths(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return months > 0 ? months : 1;
}

function formatPaymentFrequency(plan: string, billingFrequency: string) {
  if (billingFrequency === "weekly" || plan === "weekly") return "toda semana";
  if (billingFrequency === "monthly" || plan === "monthly") return "todo mês";
  if (billingFrequency === "daily" || plan === "daily") return "diariamente";
  return "conforme acordado";
}

function formatPlanPeriod(plan: string) {
  if (plan === "weekly") return "por semana";
  if (plan === "monthly") return "por mês";
  if (plan === "daily") return "por dia";
  return "";
}

function generateContractHtml(rental: RentalWithRelations) {
  const customer = rental.customer;
  const moto = rental.motorcycle;
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const durationMonths = calcDurationMonths(rental.startDate, rental.expectedEndDate);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Contrato de Locação - ${customer?.name || "Cliente"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #111; padding: 30px 40px; line-height: 1.8; }
  .header { text-align: center; margin-bottom: 28px; }
  .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 1px; margin-bottom: 20px; text-transform: uppercase; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
  .clause { margin-bottom: 10px; text-align: justify; }
  .clause-title { font-weight: bold; }
  .indent { margin-left: 20px; }
  .indent-item { margin-bottom: 2px; }
  .signatures { margin-top: 50px; }
  .signature-block { margin-bottom: 50px; text-align: left; }
  .signature-block .line { border-top: 1px solid #333; width: 350px; margin-top: 40px; padding-top: 6px; font-size: 12px; }
  .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #ddd; padding-top: 8px; }
  .date-location { margin-top: 30px; margin-bottom: 20px; font-size: 13px; }
  ul { list-style-type: disc; margin-left: 30px; margin-top: 4px; margin-bottom: 8px; }
  ul li { margin-bottom: 2px; }
  @media print {
    body { padding: 15px 25px; }
    @page { margin: 15mm; size: A4; }
  }
</style>
</head>
<body>
  <div class="header">
    <img src="${solracLogo}" alt="Solrac Moto" style="height:60px;margin-bottom:8px;" />
    <h1>CONTRATO DE LOCAÇÃO DE MOTOCICLETA PARA USO PROFISSIONAL</h1>
  </div>

  <div class="section">
    <div class="section-title">IDENTIFICAÇÃO DAS PARTES</div>
    <div class="clause">
      <strong>LOCADOR:</strong><br/>
      C H B DE SOUZA, nome fantasia SOLRAC SOLUTIONS, pessoa jurídica de direito privado, inscrita no CNPJ nº 37.423.919/0001-06, com sede na Rua Ordalia Albino Roseiro, nº 297, Jardim Santa Cláudia, Sorocaba/SP, neste ato representada por Carlos Henrique Beniz de Souza, CPF nº 097.844.074-93, doravante denominada simplesmente LOCADOR.
    </div>
    <div class="clause">
      <strong>LOCATÁRIO:</strong><br/>
      ${customer?.name || "___________________________"}, CPF nº ${customer?.cpf || "___.___.___-__"}, RG nº ${customer?.rg || "___________________"}, residente e domiciliado na ${customer?.address || "_______________________________________________________________"}, doravante denominado simplesmente LOCATÁRIO.
    </div>
    <div class="clause">
      As partes têm entre si justo e contratado o presente Contrato de Locação de Motocicleta para Uso Profissional, que se regerá pelas cláusulas abaixo.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 1 – DO OBJETO</span><br/><br/>
      O presente contrato tem como objeto a locação da motocicleta:
      <ul>
        <li>Marca/Modelo: ${moto ? `${moto.brand} ${moto.model}` : "___________________________"}</li>
        <li>Ano: ${moto?.year || "________"}</li>
        <li>Cor: ${moto?.color || "_______________"}</li>
        <li>Placa: ${moto?.plate || "___-____"}</li>
        <li>Renavam: ${moto?.renavam || "___________________________"}</li>
      </ul>
      de propriedade do LOCADOR, entregue ao LOCATÁRIO conforme Registro Fotográfico.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 2 – DA NATUREZA DA RELAÇÃO</span><br/><br/>
      O presente contrato não gera vínculo empregatício, societário ou de subordinação entre as partes.<br/>
      O LOCATÁRIO exerce suas atividades de forma autônoma, inclusive junto às plataformas Uber, 99, delivery ou similares, sendo integralmente responsável por sua atuação.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 3 – DO USO DO VEÍCULO</span><br/><br/>
      O veículo será utilizado exclusivamente pelo LOCATÁRIO, para fins profissionais, sendo vedado:<br/><br/>
      <div class="indent">
        a) emprestar, sublocar ou ceder o veículo a terceiros;<br/>
        b) utilizar para fins ilícitos;<br/>
        c) retirar peças, rastreador ou acessórios;<br/>
        d) descaracterizar o veículo.<br/>
      </div>
      <br/>O descumprimento autoriza rescisão imediata e busca e apreensão.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 4 – DA RESPONSABILIDADE TOTAL</span><br/><br/>
      O LOCATÁRIO assume responsabilidade civil, criminal, administrativa e financeira integral por quaisquer danos causados:
      <ul>
        <li>a si próprio</li>
        <li>a terceiros</li>
        <li>ao veículo</li>
        <li>ao patrimônio público ou privado</li>
      </ul>
      Comprometendo-se a ressarcir integralmente o LOCADOR, inclusive custas judiciais, multas, indenizações e honorários advocatícios, reconhecendo expressamente o direito de regresso do LOCADOR.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 5 – DA MANUTENÇÃO</span><br/><br/>
      A manutenção preventiva será realizada exclusivamente na oficina indicada pelo LOCADOR.<br/><br/>
      Ficam sob responsabilidade do LOCADOR:
      <ul>
        <li>troca de óleo</li>
        <li>transmissão</li>
        <li>freios</li>
        <li>pneus (exceto remendos)</li>
        <li>cabos</li>
      </ul>
      Excetuam-se desgastes decorrentes de mau uso, quedas, negligência ou uso intensivo acima do padrão, os quais serão integralmente cobrados do LOCATÁRIO.<br/><br/>
      O LOCATÁRIO compromete-se a realizar revisão semanal, comunicar qualquer anomalia e zelar pelo bom uso do veículo.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 6 – DO PRAZO</span><br/><br/>
      A locação terá prazo de ${durationMonths} (${durationMonths === 1 ? "um" : durationMonths === 2 ? "dois" : durationMonths === 3 ? "três" : durationMonths === 6 ? "seis" : durationMonths === 12 ? "doze" : String(durationMonths)}) ${durationMonths === 1 ? "mês" : "meses"}, iniciando-se em ${formatDate(rental.startDate)} e encerrando-se em ${formatDate(rental.expectedEndDate)}, podendo ser renovada.<br/><br/>
      O prazo mínimo de permanência é de 60 (sessenta) dias.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 7 – DO PAGAMENTO</span><br/><br/>
      a) Caução: ${formatCurrency(Number(rental.depositValue))}, a ser pago conforme acordado entre as partes.<br/>
      b) Aluguel: ${formatCurrency(Number(rental.rentalValue))} ${formatPlanPeriod(rental.plan)}, pago ${formatPaymentFrequency(rental.plan, rental.billingFrequency)} via transferência bancária, Dinheiro ou PIX.<br/><br/>
      O caução será devolvido em até 30 (trinta) dias após a devolução do veículo, desde que não existam débitos, avarias etc.<br/><br/>
      Parágrafo único: O valor do caução não limita a responsabilidade financeira do LOCATÁRIO.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 8 – DA INADIMPLÊNCIA</span><br/><br/>
      O atraso superior a 2 (dois) dias autoriza o LOCADOR a:<br/><br/>
      <div class="indent">
        a) rescindir o contrato imediatamente;<br/>
        b) exigir a devolução imediata do veículo;<br/>
        c) promover busca e apreensão;<br/>
        d) reter integralmente o caução;<br/>
        e) cobrar valores judicial ou extrajudicialmente.<br/>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 9 – MULTA, JUROS E CORREÇÃO</span><br/><br/>
      Valores em atraso sofrerão:
      <ul>
        <li>multa de 20%</li>
        <li>juros de 1% ao mês</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 10 – PERDA TOTAL</span><br/><br/>
      Em casos de danos de perda total, fica o LOCATÁRIO responsável pelo pagamento integral do veículo, seguindo valor da TABELA FIPE.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 11 – MULTAS E APREENSÕES</span><br/><br/>
      Multas de trânsito, pontos na CNH, apreensões, pátio e despesas decorrentes de infrações são de responsabilidade exclusiva do LOCATÁRIO.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 12 – TRIBUTOS E SEGURO</span><br/><br/>
      IPVA, DPVAT, licenciamento anual e seguro contra roubo e furto são de responsabilidade do LOCADOR.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 13 – CONFISSÃO DE DÍVIDA</span><br/><br/>
      O LOCATÁRIO reconhece que quaisquer valores apurados constituem confissão irrevogável e irretratável de dívida, servindo este contrato como título executivo extrajudicial, nos termos do art. 784 do CPC.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 14 – RESCISÃO</span><br/><br/>
      A rescisão antes do prazo mínimo de 60 dias sujeita o LOCATÁRIO ao pagamento de multa equivalente a 2 (duas) semanas de locação, sem prejuízo de demais valores.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 15 – ASSINATURA DIGITAL</span><br/><br/>
      As partes concordam que este contrato poderá ser assinado eletronicamente ou Física, possuindo plena validade jurídica, nos termos da legislação vigente.
    </div>
  </div>

  <div class="section">
    <div class="clause">
      <span class="clause-title">CLÁUSULA 16 – FORO</span><br/><br/>
      Fica eleito o foro da Comarca de Sorocaba/SP, com renúncia de qualquer outro, por mais privilegiado que seja.
    </div>
  </div>

  <div class="date-location">
    <p>Sorocaba/SP, ${formatDateLong(rental.startDate)}.</p>
  </div>

  <div class="signatures">
    <div class="signature-block">
      <div class="line">
        <strong>LOCADOR:</strong><br/>
        C H B DE SOUZA – SOLRAC SOLUTIONS<br/>
        Carlos Henrique Beniz de Souza
      </div>
    </div>
    <div class="signature-block">
      <div class="line">
        <strong>LOCATÁRIO:</strong><br/>
        ${customer?.name || "___________________________"}
      </div>
    </div>
  </div>

  <div class="footer">Solrac Solutions - Gerado em: ${dateStr}</div>
  <script>window.onload=function(){window.print()}</script>
</body>
</html>`;
}

function dataUriToBlob(dataUri: string, fallbackType: string): Blob {
  const parts = dataUri.split(",");
  const isDataUri = parts.length > 1 && parts[0].includes("base64");
  const raw = isDataUri ? parts[1] : parts[0];
  const mime = isDataUri ? (parts[0].match(/:(.*?);/)?.[1] || fallbackType) : fallbackType;
  const byteString = atob(raw);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mime });
}

function openTemplateForPrint(template: ContractTemplate) {
  if (!template.fileData) return;
  const isPdf = template.fileType === "application/pdf" || template.fileName.toLowerCase().endsWith(".pdf");
  const blob = dataUriToBlob(template.fileData, template.fileType || "application/octet-stream");
  const url = URL.createObjectURL(blob);
  if (isPdf) {
    window.open(url, "_blank");
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.download = template.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function ContractPreview({ rental, onClose, activeTemplate }: { rental: RentalWithRelations; onClose: () => void; activeTemplate?: ContractTemplate | null }) {
  const customer = rental.customer;
  const moto = rental.motorcycle;

  const handlePrint = () => {
    if (activeTemplate) {
      openTemplateForPrint(activeTemplate);
    } else {
      const html = generateContractHtml(rental);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    }
  };

  const handlePrintGenerated = () => {
    const html = generateContractHtml(rental);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Contrato de Locação
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        <div className="rounded-md border p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Locatário
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Nome</span>
              <p className="font-medium" data-testid="text-contract-customer-name">{customer?.name || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">CPF</span>
              <p className="font-medium">{customer?.cpf || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">RG</span>
              <p className="font-medium">{customer?.rg || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Telefone</span>
              <p className="font-medium">{customer?.phone || "-"}</p>
            </div>
            {customer?.email && (
              <div>
                <span className="text-muted-foreground text-xs">E-mail</span>
                <p className="font-medium">{customer.email}</p>
              </div>
            )}
            {customer?.address && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Endereço</span>
                <p className="font-medium">{customer.address}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md border p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Bike className="w-4 h-4 text-muted-foreground" />
            Veículo
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Marca/Modelo</span>
              <p className="font-medium" data-testid="text-contract-moto">{moto ? `${moto.brand} ${moto.model}` : "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Placa</span>
              <p className="font-medium">{moto?.plate || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Ano</span>
              <p className="font-medium">{moto?.year || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Cor</span>
              <p className="font-medium">{moto?.color || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Chassi</span>
              <p className="font-medium">{moto?.chassis || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Renavam</span>
              <p className="font-medium">{moto?.renavam || "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Condições da Locação
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Plano</span>
              <p className="font-medium">{planLabels[rental.plan] || rental.plan}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Valor</span>
              <p className="font-medium">{formatCurrency(Number(rental.rentalValue))}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Caução</span>
              <p className="font-medium">{formatCurrency(Number(rental.depositValue))}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Cobrança</span>
              <p className="font-medium">{billingLabels[rental.billingFrequency] || rental.billingFrequency}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Início</span>
              <p className="font-medium">{formatDate(rental.startDate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Término Previsto</span>
              <p className="font-medium">{formatDate(rental.expectedEndDate)}</p>
            </div>
            {rental.startKm != null && (
              <div>
                <span className="text-muted-foreground text-xs">KM Início</span>
                <p className="font-medium">{rental.startKm.toLocaleString("pt-BR")} km</p>
              </div>
            )}
            {rental.dueDay && (
              <div>
                <span className="text-muted-foreground text-xs">Dia Vencimento</span>
                <p className="font-medium">{rental.dueDay}</p>
              </div>
            )}
          </div>
          {rental.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs">Observações</span>
              <p className="font-medium">{rental.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose} data-testid="button-close-contract">
            Fechar
          </Button>
          {activeTemplate && (
            <Button variant="outline" onClick={handlePrintGenerated} data-testid="button-print-generated-contract">
              <Printer className="w-4 h-4 mr-2" />
              Contrato Gerado
            </Button>
          )}
          <Button onClick={handlePrint} data-testid="button-print-contract">
            <Printer className="w-4 h-4 mr-2" />
            {activeTemplate ? "Imprimir Modelo Atual" : "Imprimir Contrato"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewingRental, setViewingRental] = useState<RentalWithRelations | null>(null);

  const { data: rentals, isLoading } = useQuery<RentalWithRelations[]>({
    queryKey: ["/api/rentals"],
  });

  const { data: contractTemplate } = useQuery<ContractTemplate>({
    queryKey: ["/api/contract-templates", "active"],
    queryFn: async () => {
      const res = await fetch("/api/contract-templates/active");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const filteredRentals = rentals?.filter((rental) => {
    const matchSearch =
      !search ||
      rental.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      rental.motorcycle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
      rental.customer?.cpf?.includes(search);

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && rental.active) ||
      (statusFilter === "ended" && !rental.active);

    return matchSearch && matchStatus;
  }) || [];

  const handlePrintDirect = (rental: RentalWithRelations) => {
    if (contractTemplate) {
      openTemplateForPrint(contractTemplate);
    } else {
      const html = generateContractHtml(rental);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-contracts-title">
            Contratos de Locação
          </h1>
          <p className="text-muted-foreground">
            Visualize e imprima contratos de locação
          </p>
        </div>
        {contractTemplate && (
          <Button
            variant="outline"
            onClick={() => openTemplateForPrint(contractTemplate)}
            data-testid="button-download-contract-template"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Modelo de Contrato
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, CPF ou placa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-contracts"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-contract-status">
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
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contratos
          </CardTitle>
          {filteredRentals.length > 0 && (
            <Badge variant="secondary" data-testid="badge-contract-count">
              {filteredRentals.length} {filteredRentals.length === 1 ? "contrato" : "contratos"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredRentals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nenhum contrato encontrado</p>
              <p className="text-sm text-muted-foreground">
                Cadastre um aluguel para gerar contratos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Moto</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="hidden lg:table-cell">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRentals.map((rental) => (
                    <TableRow key={rental.id} data-testid={`row-contract-${rental.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {rental.customer?.name || "Cliente"}
                          </p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {rental.customer?.cpf || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="text-sm">
                            {rental.motorcycle?.brand} {rental.motorcycle?.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rental.motorcycle?.plate}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(rental.startDate)}</p>
                          <p className="text-xs text-muted-foreground">
                            até {formatDate(rental.expectedEndDate)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(Number(rental.rentalValue))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {planLabels[rental.plan] || rental.plan}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rental.active ? "default" : "secondary"}
                          data-testid={`badge-contract-status-${rental.id}`}
                        >
                          {rental.active ? "Ativo" : "Encerrado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setViewingRental(rental)}
                            data-testid={`button-view-contract-${rental.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handlePrintDirect(rental)}
                            data-testid={`button-print-contract-${rental.id}`}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingRental} onOpenChange={(open) => { if (!open) setViewingRental(null); }}>
        {viewingRental && (
          <ContractPreview rental={viewingRental} onClose={() => setViewingRental(null)} activeTemplate={contractTemplate} />
        )}
      </Dialog>
    </div>
  );
}
