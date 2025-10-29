import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@assets/logo tu destino tours horizontal_1761754020215.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src={logo} alt="Tu Destino Tours" className="h-10" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-home">
              Inicio
            </Link>
            <Link href="/tours" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-tours">
              Tours
            </Link>
            <Link href="/explore" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-explore">
              Explorar
            </Link>
            <Link href="/activity" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-activity">
              Actividades
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                    <User className="h-4 w-4" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={isAdmin ? "/admin" : "/dashboard"} data-testid="link-dashboard">
                      {isAdmin ? "Panel de Administración" : "Mi Panel"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild data-testid="button-signin">
                  <Link href="/signin">Iniciar Sesión</Link>
                </Button>
                <Button className="bg-primary text-primary-foreground hover-elevate active-elevate-2" asChild data-testid="button-signup">
                  <Link href="/signup">Registrarse</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 gap-2">
            <Link href="/" className="px-4 py-2 hover-elevate rounded-md" data-testid="link-mobile-home">
              Inicio
            </Link>
            <Link href="/tours" className="px-4 py-2 hover-elevate rounded-md" data-testid="link-mobile-tours">
              Tours
            </Link>
            <Link href="/explore" className="px-4 py-2 hover-elevate rounded-md" data-testid="link-mobile-explore">
              Explorar
            </Link>
            <Link href="/activity" className="px-4 py-2 hover-elevate rounded-md" data-testid="link-mobile-activity">
              Actividades
            </Link>
            <div className="flex flex-col gap-2 mt-4">
              {user ? (
                <>
                  <Link href={isAdmin ? "/admin" : "/dashboard"} className="px-4 py-2 hover-elevate rounded-md" data-testid="link-mobile-dashboard">
                    {isAdmin ? "Panel de Administración" : "Mi Panel"}
                  </Link>
                  <Button variant="ghost" onClick={handleLogout} data-testid="button-mobile-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild data-testid="button-mobile-signin">
                    <Link href="/signin">Iniciar Sesión</Link>
                  </Button>
                  <Button className="bg-primary text-primary-foreground" asChild data-testid="button-mobile-signup">
                    <Link href="/signup">Registrarse</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
