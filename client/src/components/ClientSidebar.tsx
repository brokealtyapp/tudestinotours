import {
  Home,
  Calendar,
  CreditCard,
  User,
  LogOut,
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/logo tu destino tours horizontal_1761754020215.png";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface ClientSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  {
    title: "Mi Dashboard",
    icon: Home,
    value: "dashboard",
  },
  {
    title: "Mis Reservas",
    icon: Calendar,
    value: "reservations",
  },
  {
    title: "Mis Pagos",
    icon: CreditCard,
    value: "payments",
  },
  {
    title: "Mi Perfil",
    icon: User,
    value: "profile",
  },
];

export function ClientSidebar({ activeSection, onSectionChange }: ClientSidebarProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <Sidebar className="bg-white border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-100 px-6 py-6">
        <div className="flex flex-col gap-3">
          <img 
            src={logoUrl} 
            alt="Tu Destino Tours" 
            className="h-10 w-auto object-contain"
          />
          <p className="text-xs text-gray-500 text-center font-medium">Mi Panel de Cliente</p>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
          data-testid="button-logout-sidebar"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
