import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Globe, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";
import { useState } from "react";
import logo from "@assets/logo tu destino tours horizontal_1761754020215.png";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    console.log("Subscribe with email:", email);
    setEmail("");
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Tu Destino Tours" className="h-12" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Tu solución definitiva para viajes y tours
            </p>
            <div className="flex items-center gap-2 mb-6">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Nuestra oficina</p>
                <p className="text-sm text-muted-foreground">260 Madison ave FL8<br />New York NY 10016<br />United States</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Servicios</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Tours Económicos</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Asesoría Experta</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Independiente</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Tours de Lujo</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Consejos de Seguridad</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Tips y Trucos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Aventuras</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Extremo</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">En el Aire</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Naturaleza y Vida Silvestre</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Deportes de Invierno</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Parques al Aire Libre</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Deportes de Motor</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Destinos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">USA</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">India</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Francia</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Reino Unido</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">España</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Canadá</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              <p className="text-primary font-semibold whitespace-nowrap">Conversemos</p>
              <div className="flex gap-2 w-full sm:max-w-md">
                <Input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-newsletter"
                />
                <Button 
                  className="bg-primary text-primary-foreground hover-elevate active-elevate-2"
                  onClick={handleSubscribe}
                  data-testid="button-newsletter"
                >
                  Enviar
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-facebook">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-instagram">
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-twitter">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-linkedin">
                <FaLinkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Todos los Derechos Reservados. Desarrollado por SEO Consulting</p>
            <Link href="/privacy" className="hover:text-foreground">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
