import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BookingConfirmation() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [reservationId, setReservationId] = useState<string>("");
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("reservationId") || "";
    const email = params.get("email") || "";
    const newUser = params.get("isNewUser") === "true";
    setReservationId(id);
    setBuyerEmail(email);
    setIsNewUser(newUser);

    if (!id) {
      setLocation("/tours");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              ¡Reserva Confirmada!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Tu reserva ha sido creada exitosamente
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Número de Orden:</span>
                <Badge variant="secondary" className="text-base font-mono">
                  {reservationId.slice(0, 8).toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Confirmación por Email</h3>
                  <p className="text-sm text-muted-foreground">
                    Hemos enviado un email de confirmación con todos los detalles de tu reserva a:
                  </p>
                  <p className="text-sm font-medium mt-1">{buyerEmail}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-lg">Próximos Pasos</h3>
              
              {!user ? (
                <div className="space-y-4">
                  {isNewUser ? (
                    <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">Tu Cuenta Ha Sido Creada</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Hemos creado automáticamente una cuenta para ti. Revisa tu email <strong>{buyerEmail}</strong> donde encontrarás tus credenciales de acceso.
                          </p>
                          <Button
                            variant="default"
                            onClick={() => setLocation("/signin")}
                            data-testid="button-signin"
                          >
                            Iniciar Sesión
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Para ver y gestionar tu reserva en cualquier momento, inicia sesión con tu cuenta:
                      </p>
                      <Button
                        variant="default"
                        onClick={() => setLocation("/signin")}
                        data-testid="button-signin"
                      >
                        Iniciar Sesión
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Con tu cuenta podrás acceder a tu historial de reservas, gestionar tus pagos y recibir actualizaciones importantes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Puedes ver y gestionar tu reserva desde tu panel de control.
                  </p>
                  <Button
                    variant="default"
                    onClick={() => setLocation("/dashboard")}
                    data-testid="button-go-dashboard"
                  >
                    Ir a Mi Panel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="flex gap-3 justify-center">
                <Link href="/tours">
                  <Button variant="outline" data-testid="button-browse-tours">
                    Explorar Más Tours
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
