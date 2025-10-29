import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, CreditCard } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

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
          Loading your bookings...
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">
            View and manage your tour reservations
          </p>
        </div>

        {userReservations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-6">
                You don't have any bookings yet
              </p>
              <Link href="/tours">
                <Button data-testid="button-browse-tours">Browse Tours</Button>
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
                      {reservation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Location
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
                          Booking Date
                        </p>
                        <p className="font-semibold">
                          {new Date(reservation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Passengers
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
                          Total Amount
                        </p>
                        <p className="font-semibold text-primary">
                          ${reservation.totalPrice}
                        </p>
                      </div>
                    </div>
                  </div>

                  {reservation.passengers && reservation.passengers.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Passenger Details</h4>
                      <div className="space-y-2">
                        {reservation.passengers.map((passenger: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{passenger.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Passport: {passenger.passportNumber} |{" "}
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
                            Payment Status
                          </p>
                          <p className="font-semibold capitalize">
                            {reservation.payment.status}
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
                              View Payment
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
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
