import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  Map,
  Settings,
  Users,
  Wallet,
  FileCheck,
  Mail,
  Plane,
} from "lucide-react";
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
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    value: "dashboard",
  },
  {
    title: "Tours",
    icon: Map,
    value: "tours",
  },
  {
    title: "Salidas",
    icon: Plane,
    value: "departures",
  },
  {
    title: "Reservas",
    icon: Calendar,
    value: "reservations",
  },
  {
    title: "Pagos",
    icon: Wallet,
    value: "payments",
  },
  {
    title: "Pasajeros",
    icon: Users,
    value: "passengers",
  },
  {
    title: "Documentos",
    icon: FileCheck,
    value: "documents",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    value: "reports",
  },
  {
    title: "Plantillas",
    icon: Mail,
    value: "templates",
  },
  {
    title: "Configuración",
    icon: Settings,
    value: "config",
  },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-semibold text-lg">Tu Destino Tours</h2>
            <p className="text-xs text-muted-foreground">Panel de Administración</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.value)}
                    isActive={activeSection === item.value}
                    data-testid={`sidebar-${item.value}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
