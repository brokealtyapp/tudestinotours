import { Search, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function AdminHeader() {
  const { user } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const getUserInitials = () => {
    if (!user?.email) return "AD";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-admin-greeting">
          {getGreeting()}, {user?.email?.split('@')[0] || 'Administrador'}
        </h1>
        <p className="text-sm text-gray-500">Bienvenido de vuelta</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar reservas, tours, pasajeros..."
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            data-testid="input-admin-search"
          />
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5 text-gray-600" />
        </Button>

        <Avatar className="h-10 w-10" data-testid="avatar-admin">
          <AvatarImage src="" alt={user?.email || ''} />
          <AvatarFallback className="bg-blue-600 text-white font-semibold">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
