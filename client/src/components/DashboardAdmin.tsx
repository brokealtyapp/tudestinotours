import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import FunnelChart from "./FunnelChart";
import UpcomingDeadlinesTable from "./UpcomingDeadlinesTable";
import OccupationChart from "./OccupationChart";

interface FunnelData {
  received: number;
  underReview: number;
  approved: number;
  partialPaid: number;
  paid: number;
}

interface UpcomingDeadline {
  reservationId: string;
  bookingCode: string;
  tourName: string;
  departureDate: string;
  daysRemaining: number;
  dueDate: string;
  balanceDue: number;
}

interface DepartureOccupation {
  tourName: string;
  departureDate: string;
  occupiedSeats: number;
  maxSeats: number;
  occupationPercentage: number;
}

interface DashboardKPIs {
  gmv: number;
  reservationsByStatus: {
    pending: number;
    approved: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    overdue: number;
  };
  averageOccupation: number;
  pendingPayments: {
    amount: number;
    count: number;
  };
  upcomingDeadlinesCount: number;
  upcomingDeadlines: UpcomingDeadline[];
  funnel: FunnelData;
  occupationByDeparture: DepartureOccupation[];
}

interface DashboardAdminProps {
  onNavigate?: (section: string) => void;
}

export default function DashboardAdmin({ onNavigate }: DashboardAdminProps) {
  const { data: kpis, isLoading } = useQuery<DashboardKPIs>({
    queryKey: ["/api/dashboard/kpis"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} data-testid={`skeleton-kpi-${i}`} className="bg-white rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">Cargando...</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudieron cargar los KPIs</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalActiveReservations = 
    kpis.reservationsByStatus.pending +
    kpis.reservationsByStatus.approved +
    kpis.reservationsByStatus.confirmed;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900" data-testid="text-dashboard-title">
          Dashboard
        </h2>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* GMV Card */}
        <Card data-testid="card-kpi-gmv" className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
            <CardTitle className="text-base font-semibold text-gray-900">GMV Total</CardTitle>
            <DollarSign className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold text-gray-900" data-testid="text-gmv-amount">
              {formatCurrency(kpis.gmv)}
            </div>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              Ventas confirmadas y completadas
            </p>
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("reports")}
                className="w-full justify-between text-primary hover:text-primary"
                data-testid="button-navigate-reports"
              >
                Ver Reportes
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Reservations Card */}
        <Card data-testid="card-kpi-reservations" className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
            <CardTitle className="text-base font-semibold text-gray-900">Reservas Activas</CardTitle>
            <Users className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold text-gray-900" data-testid="text-reservations-count">
              {totalActiveReservations}
            </div>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              Pendientes: {kpis.reservationsByStatus.pending} | 
              Aprobadas: {kpis.reservationsByStatus.approved} | 
              Confirmadas: {kpis.reservationsByStatus.confirmed}
            </p>
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("reservations")}
                className="w-full justify-between text-primary hover:text-primary"
                data-testid="button-navigate-reservations"
              >
                Ver Todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Occupation Card */}
        <Card data-testid="card-kpi-occupation" className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
            <CardTitle className="text-base font-semibold text-gray-900">Ocupación Promedio</CardTitle>
            <TrendingUp className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold text-gray-900" data-testid="text-occupation-percentage">
              {kpis.averageOccupation.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              De todos los tours disponibles
            </p>
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("departures")}
                className="w-full justify-between text-primary hover:text-primary"
                data-testid="button-navigate-departures"
              >
                Ver Salidas
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments Card */}
        <Card data-testid="card-kpi-pending-payments" className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
            <CardTitle className="text-base font-semibold text-gray-900">Pagos Pendientes</CardTitle>
            <AlertCircle className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold text-gray-900" data-testid="text-pending-payments-amount">
              {formatCurrency(kpis.pendingPayments.amount)}
            </div>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              {kpis.pendingPayments.count} reserva{kpis.pendingPayments.count !== 1 ? 's' : ''} pendiente{kpis.pendingPayments.count !== 1 ? 's' : ''}
            </p>
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("payments")}
                className="w-full justify-between text-primary hover:text-primary"
                data-testid="button-navigate-payments"
              >
                Gestionar
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card data-testid="card-funnel" className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-semibold text-gray-900">Embudo de Conversión</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Flujo de reservas desde recepción hasta pago completo
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <FunnelChart data={kpis.funnel} />
        </CardContent>
      </Card>

      {/* Upcoming Deadlines Table */}
      <Card data-testid="card-upcoming-deadlines" className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Vencimientos Próximos (30 días)
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Reservas con pagos pendientes que vencen próximamente
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <UpcomingDeadlinesTable deadlines={kpis.upcomingDeadlines} />
        </CardContent>
      </Card>

      {/* Occupation by Departure Chart */}
      <Card data-testid="card-occupation-chart" className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-semibold text-gray-900">Ocupación por Salida</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Próximas 10 salidas programadas y su nivel de ocupación
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <OccupationChart data={kpis.occupationByDeparture} />
        </CardContent>
      </Card>
    </div>
  );
}
