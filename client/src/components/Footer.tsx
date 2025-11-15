import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Globe, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import logo from "@assets/logo tu destino tours horizontal_1761754020215.png";

export default function Footer() {
  const [email, setEmail] = useState("");

  const { data: config } = useQuery<any[]>({
    queryKey: ["/api/config"],
  });

  const continents = useMemo(() => {
    const continentsConfig = config?.find((c: any) => c.key === "CONTINENTS_AND_CITIES");
    if (!continentsConfig?.value) return [];
    
    try {
      const data = typeof continentsConfig.value === "string" 
        ? JSON.parse(continentsConfig.value) 
        : continentsConfig.value;
      return Object.keys(data);
    } catch {
      return [];
    }
  }, [config]);

  const socialLinks = useMemo(() => {
    if (!config || !Array.isArray(config)) {
      return { facebook: '', instagram: '', twitter: '', linkedin: '' };
    }
    return {
      facebook: config.find((s: any) => s.key === 'AGENCY_FACEBOOK_URL')?.value || '',
      instagram: config.find((s: any) => s.key === 'AGENCY_INSTAGRAM_URL')?.value || '',
      twitter: config.find((s: any) => s.key === 'AGENCY_TWITTER_URL')?.value || '',
      linkedin: config.find((s: any) => s.key === 'AGENCY_LINKEDIN_URL')?.value || '',
    };
  }, [config]);

  const handleSubscribe = () => {
    console.log("Subscribe with email:", email);
    setEmail("");
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
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
            <h3 className="font-semibold mb-4">Destinos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {continents.length > 0 ? (
                continents.map((continent) => (
                  <li key={continent}>
                    <Link 
                      href={`/tours?continent=${encodeURIComponent(continent)}`} 
                      className="hover-elevate px-2 py-1 rounded-md inline-block"
                    >
                      {continent}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/tours" className="hover-elevate px-2 py-1 rounded-md inline-block">Todos los Tours</Link></li>
                </>
              )}
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
              {socialLinks.facebook && (
                <a 
                  href={socialLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground" 
                  data-testid="link-facebook"
                >
                  <FaFacebook className="h-5 w-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a 
                  href={socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground" 
                  data-testid="link-instagram"
                >
                  <FaInstagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks.twitter && (
                <a 
                  href={socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground" 
                  data-testid="link-twitter"
                >
                  <FaTwitter className="h-5 w-5" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a 
                  href={socialLinks.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground" 
                  data-testid="link-linkedin"
                >
                  <FaLinkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              © 2024 Todos los Derechos Reservados. Desarrollado por{' '}
              <a 
                href="https://seoconsulting.com.do" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground underline"
              >
                SEO Consulting
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
