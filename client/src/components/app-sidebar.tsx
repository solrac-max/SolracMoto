import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import solracLogo from "@assets/WhatsApp_Image_2026-02-13_at_01.09.05_1771165708652.jpeg";
import {
  LayoutDashboard,
  Bike,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Wrench,
  ClipboardList,
  BarChart3,
  LogOut,
  ScrollText,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Motos",
    url: "/motorcycles",
    icon: Bike,
  },
  {
    title: "Clientes",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Aluguéis",
    url: "/rentals",
    icon: FileText,
  },
  {
    title: "Contratos",
    url: "/contracts",
    icon: ScrollText,
  },
  {
    title: "Parcelas",
    url: "/installments",
    icon: Receipt,
  },
  {
    title: "Pagamentos",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Manutenção",
    url: "/maintenance",
    icon: Wrench,
  },
  {
    title: "Relatório Manutenção",
    url: "/maintenance-report",
    icon: ClipboardList,
  },
  {
    title: "Financeiro",
    url: "/financial",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <img src={solracLogo} alt="Solrac Moto" className="w-10 h-10 rounded-md object-cover" />
          <div>
            <h1 className="font-bold text-lg leading-none">Solrac Moto</h1>
            <p className="text-xs text-muted-foreground">Gestão de Frotas</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName || user?.email || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
