import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@assets/logo tu destino tours_1761750190712.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src={logo} alt="Tu Destino Tours" className="h-10" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-home">
              Home
            </Link>
            <Link href="/tours" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-tours">
              Tours
            </Link>
            <Link href="/explore" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-explore">
              Explore
            </Link>
            <Link href="/activity" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-activity">
              Activity
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild data-testid="button-signin">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button className="bg-primary text-primary-foreground hover-elevate active-elevate-2" asChild data-testid="button-signup">
              <Link href="/signup">Sign Up</Link>
            </Button>
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
              Home
            </Link>
            <Link href="/tours" className="px-4 py-2 hover-elevate rounded-md" data-testid="link-mobile-tours">
              Tours
            </Link>
            <Link href="/explore" className="px-4 py-2 hover-elevate rounded-md" data-testid="link-mobile-explore">
              Explore
            </Link>
            <Link href="/activity" className="px-4 py-2 hover-elevate rounded-md" data-testid="link-mobile-activity">
              Activity
            </Link>
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="ghost" asChild data-testid="button-mobile-signin">
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button className="bg-primary text-primary-foreground" asChild data-testid="button-mobile-signup">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
