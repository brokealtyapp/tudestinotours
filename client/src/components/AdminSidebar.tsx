import {
  BarChart3,
  Calendar,
  Home,
  Map,
  Settings,
  Users,
  Wallet,
  FileCheck,
  Mail,
  Plane,
  MessageSquare,
  ExternalLink,
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
import { Link } from "wouter";
import logoUrl from "@assets/logo tu destino tours horizontal_1761754020215.png";

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
    title: "Testimonios",
    icon: MessageSquare,
    value: "testimonials",
  },
  {
    title: "Configuración",
    icon: Settings,
    value: "config",
  },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <Sidebar className="bg-white border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-100 px-6 py-6">
        <div className="flex flex-col gap-3">
          <img 
            src={logoUrl} 
            alt="Tu Destino Tours" 
            className="h-10 w-auto object-contain"
          />
          <p className="text-xs text-gray-500 text-center font-medium">Panel de Administración</p>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.value)}
                    isActive={activeSection === item.value}
                    data-testid={`sidebar-${item.value}`}
                    className={`
                      rounded-lg px-3 py-2.5 transition-all duration-200
                      ${activeSection === item.value 
                        ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600 pl-2' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  data-testid="sidebar-public-site"
                  className="rounded-lg px-3 py-2.5 transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Link href="/">
                    <ExternalLink className="h-5 w-5" />
                    <span className="text-sm">Ver Sitio Público</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
