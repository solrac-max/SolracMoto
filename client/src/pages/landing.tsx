import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bike, Users, CreditCard, Wrench, Shield, TrendingUp, AlertTriangle, Mail, Loader2 } from "lucide-react";
import solracLogo from "@assets/WhatsApp_Image_2026-02-13_at_01.09.05_1771165708652.jpeg";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const params = new URLSearchParams(window.location.search);
  const accessDenied = params.get("access") === "denied";
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Digite seu e-mail");
      return;
    }
    try {
      await login(email.trim());
    } catch (err: any) {
      if (err.message === "access_denied") {
        setError("Acesso negado. Seu e-mail não está autorizado.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-2">
              <img src={solracLogo} alt="Solrac Moto" className="w-10 h-10 rounded-md object-cover" />
              <span className="font-bold text-xl">Solrac Moto</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
                Recursos
              </a>
              <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-benefits">
                Benefícios
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild data-testid="button-login-nav">
                <a href="#login">Entrar</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {accessDenied && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-destructive text-destructive-foreground px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium" data-testid="text-access-denied">
              Acesso negado. Seu e-mail não está autorizado a acessar este sistema. Entre em contato com o administrador.
            </p>
          </div>
        </div>
      )}

      <section className={`${accessDenied ? "pt-44" : "pt-32"} pb-20 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Shield className="w-4 h-4" />
                Sistema Completo de Gestão
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Gerencie sua frota de motos com{" "}
                <span className="text-primary">excelência</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Solrac Moto é a solução completa para gerenciar aluguéis de motos.
                Controle veículos, clientes, pagamentos e manutenção em um único lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild data-testid="button-hero-start">
                  <a href="#login">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Começar Agora
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-hero-demo">
                  <a href="#features">Ver Recursos</a>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-chart-2" />
                  100% Gratuito
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-chart-2" />
                  Multi-usuário
                </span>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-3xl" />
              <div className="relative bg-card border rounded-3xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                        <Bike className="w-6 h-6 text-chart-2" />
                      </div>
                      <div>
                        <p className="font-semibold">Motos Disponíveis</p>
                        <p className="text-2xl font-bold text-chart-2">24</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Este mês</p>
                      <p className="text-lg font-semibold text-chart-2">+12%</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">18</p>
                      <p className="text-sm text-muted-foreground">Alugadas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-sm text-muted-foreground">Manutenção</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">45</p>
                      <p className="text-sm text-muted-foreground">Clientes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="login" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-md mx-auto">
          <Card className="p-8">
            <div className="flex flex-col items-center mb-6">
              <img src={solracLogo} alt="Solrac Moto" className="w-16 h-16 rounded-xl object-cover mb-4" />
              <h2 className="text-2xl font-bold">Entrar no Sistema</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use seu e-mail autorizado para acessar
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="pl-10"
                    disabled={isLoggingIn}
                    data-testid="input-login-email"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p data-testid="text-login-error">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoggingIn} data-testid="button-login-submit">
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recursos poderosos para gerenciar sua frota de motos com eficiência
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-xl bg-chart-1/10 flex items-center justify-center mb-4">
                <Bike className="w-6 h-6 text-chart-1" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Motos</h3>
              <p className="text-muted-foreground">
                Cadastro completo com fotos, documentos, rastreamento GPS e histórico de manutenção.
              </p>
            </Card>
            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-chart-2" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Clientes</h3>
              <p className="text-muted-foreground">
                Cadastro de locatários com documentos, histórico de aluguéis e score de confiabilidade.
              </p>
            </Card>
            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Controle Financeiro</h3>
              <p className="text-muted-foreground">
                Acompanhe pagamentos, parcelas, inadimplência e gere relatórios financeiros detalhados.
              </p>
            </Card>
            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6 text-chart-4" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Manutenção</h3>
              <p className="text-muted-foreground">
                Registre manutenções preventivas e corretivas com controle de custos e alertas.
              </p>
            </Card>
            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-xl bg-chart-5/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-chart-5" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Contratos</h3>
              <p className="text-muted-foreground">
                Gerencie contratos de aluguel com planos flexíveis: diário, semanal ou mensal.
              </p>
            </Card>
            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
              <p className="text-muted-foreground">
                Visão geral da frota com KPIs, alertas e indicadores de desempenho em tempo real.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Por que escolher a Solrac Moto?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Segurança Total</h3>
                    <p className="text-muted-foreground">
                      Seus dados protegidos com autenticação segura e backups automáticos.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-chart-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Multi-usuário</h3>
                    <p className="text-muted-foreground">
                      Diferentes níveis de acesso: Admin, Operador e Mecânico.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-chart-3" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Relatórios Completos</h3>
                    <p className="text-muted-foreground">
                      Acompanhe receita, inadimplência, custos de manutenção e ocupação da frota.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-card rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-4xl font-bold text-primary mb-2">100%</p>
                    <p className="text-sm text-muted-foreground">Gratuito</p>
                  </div>
                  <div className="bg-card rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-4xl font-bold text-chart-2 mb-2">24/7</p>
                    <p className="text-sm text-muted-foreground">Disponível</p>
                  </div>
                  <div className="bg-card rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-4xl font-bold text-chart-3 mb-2">3</p>
                    <p className="text-sm text-muted-foreground">Perfis de Usuário</p>
                  </div>
                  <div className="bg-card rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-4xl font-bold text-chart-4 mb-2">GPS</p>
                    <p className="text-sm text-muted-foreground">Rastreamento</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Pronto para gerenciar sua frota?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Comece agora gratuitamente e descubra como a Solrac Moto pode transformar a gestão do seu negócio.
          </p>
          <Button size="lg" variant="secondary" asChild data-testid="button-cta-start">
            <a href="#login">
              Começar Gratuitamente
            </a>
          </Button>
        </div>
      </section>

      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={solracLogo} alt="Solrac Moto" className="w-8 h-8 rounded-md object-cover" />
            <span className="font-semibold">Solrac Moto</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Solrac Moto. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
