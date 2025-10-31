import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedReservations, setExpandedReservations] = useState<Record<string, boolean>>({});

  const { data: reservations, isLoading: reservationsLoading } = useQuery<any[]>({
    queryKey: ["/api/reservations"],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/signin");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading || reservationsLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          Cargando tus reservas...
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userReservations = reservations?.filter((r) => r.userId === user.id) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "confirmed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "confirmed":
        return "Confirmada";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "completed":
        return "Completado";
      case "failed":
        return "Fallido";
      case "refunded":
        return "Reembolsado";
      default:
        return status;
    }
  };

  const getInstallmentStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "paid":
        return "Pagado";
      case "overdue":
        return "Vencido";
      default:
        return status;
    }
  };

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "paid":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "overdue":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const toggleReservationExpanded = (reservationId: string) => {
    setExpandedReservations(prev => ({
      ...prev,
      [reservationId]: !prev[reservationId]
    }));
  };

  // Component to display payment installments
  const ReservationPaymentSchedule = ({ reservation }: { reservation: any }) => {
    const { data: installments, isLoading } = useQuery<any[]>({
      queryKey: ["/api/reservations", reservation.id, "installments"],
      enabled: !!reservation.id,
    });

    if (isLoading) {
      return <div className="text-sm text-muted-foreground">Cargando cronograma...</div>;
    }

    if (!installments || installments.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No hay un cronograma de pagos parciales configurado para esta reserva.
        </div>
      );
    }

    const totalPaid = installments
      .filter((i: any) => i.status === "paid")
      .reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    
    const pendingAmount = Number(reservation.totalPrice) - totalPaid;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total de la Reserva</p>
            <p className="font-semibold text-lg">${reservation.totalPrice}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pagado</p>
            <p className="font-semibold text-lg text-green-600">${totalPaid}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pendiente</p>
            <p className="font-semibold text-lg text-yellow-600">${pendingAmount}</p>
          </div>
        </div>

        <div className="space-y-2">
          {installments.map((installment: any) => (
            <div
              key={installment.id}
              className="p-4 border rounded-lg"
              data-testid={`installment-${installment.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">${installment.amount}</p>
                    <Badge className={getInstallmentStatusColor(installment.status)}>
                      {getInstallmentStatusLabel(installment.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de vencimiento: {new Date(installment.dueDate).toLocaleDateString('es-ES')}
                  </p>
                  {installment.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {installment.description}
                    </p>
                  )}
                  {installment.paidAt && (
                    <p className="text-sm text-green-600 mt-1">
                      Pagado el: {new Date(installment.paidAt).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
                {installment.paymentLink && installment.status === "pending" && (
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    data-testid={`button-pay-installment-${installment.id}`}
                  >
                    <a
                      href={installment.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pagar Ahora
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Reservas</h1>
          <p className="text-muted-foreground">
            Ve y gestiona tus reservas de tours
          </p>
        </div>

        {userReservations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-6">
                Aún no tienes ninguna reserva
              </p>
              <Link href="/tours">
                <Button data-testid="button-browse-tours">Explorar Tours</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {userReservations.map((reservation) => (
              <Card key={reservation.id} data-testid={`card-reservation-${reservation.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {reservation.tour?.title || "Tour"}
                    </CardTitle>
                    <Badge className={getStatusColor(reservation.status)}>
                      {getStatusLabel(reservation.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ubicación
                        </p>
                        <p className="font-semibold">
                          {reservation.tour?.location || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Fecha de Reserva
                        </p>
                        <p className="font-semibold">
                          {new Date(reservation.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Pasajeros
                        </p>
                        <p className="font-semibold">
                          {reservation.passengers?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Monto Total
                        </p>
                        <p className="font-semibold text-primary">
                          ${reservation.totalPrice}
                        </p>
                      </div>
                    </div>
                  </div>

                  {reservation.passengers && reservation.passengers.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Detalles de Pasajeros</h4>
                      <div className="space-y-2">
                        {reservation.passengers.map((passenger: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{passenger.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Pasaporte: {passenger.passportNumber} |{" "}
                                {passenger.nationality}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reservation.payment && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Estado de Pago
                          </p>
                          <p className="font-semibold">
                            {getPaymentStatusLabel(reservation.payment.status)}
                          </p>
                        </div>
                        {reservation.payment.externalPaymentUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            data-testid={`button-view-payment-${reservation.id}`}
                          >
                            <a
                              href={reservation.payment.externalPaymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Ver Pago
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t">
                    <Collapsible
                      open={expandedReservations[reservation.id]}
                      onOpenChange={() => toggleReservationExpanded(reservation.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full flex items-center justify-between p-0 hover:no-underline"
                          data-testid={`button-toggle-installments-${reservation.id}`}
                        >
                          <span className="font-semibold">Cronograma de Pagos</span>
                          {expandedReservations[reservation.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <ReservationPaymentSchedule reservation={reservation} />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
