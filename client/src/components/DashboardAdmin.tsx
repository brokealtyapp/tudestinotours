import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";
import FunnelChart from "./FunnelChart";
import UpcomingDeadlinesTable from "./UpcomingDeadlinesTable";

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
}

export default function DashboardAdmin() {
  const { data: kpis, isLoading } = useQuery<DashboardKPIs>({
    queryKey: ["/api/dashboard/kpis"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} data-testid={`skeleton-kpi-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
              </CardHeader>
              <CardContent>
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
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Dashboard
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* GMV Card */}
        <Card data-testid="card-kpi-gmv">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GMV Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-gmv-amount">
              {formatCurrency(kpis.gmv)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ventas confirmadas y completadas
            </p>
          </CardContent>
        </Card>

        {/* Reservations Card */}
        <Card data-testid="card-kpi-reservations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-reservations-count">
              {totalActiveReservations}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendientes: {kpis.reservationsByStatus.pending} | 
              Aprobadas: {kpis.reservationsByStatus.approved} | 
              Confirmadas: {kpis.reservationsByStatus.confirmed}
            </p>
          </CardContent>
        </Card>

        {/* Occupation Card */}
        <Card data-testid="card-kpi-occupation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-occupation-percentage">
              {kpis.averageOccupation.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              De todos los tours disponibles
            </p>
          </CardContent>
        </Card>

        {/* Pending Payments Card */}
        <Card data-testid="card-kpi-pending-payments">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-payments-amount">
              {formatCurrency(kpis.pendingPayments.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.pendingPayments.count} reserva{kpis.pendingPayments.count !== 1 ? 's' : ''} pendiente{kpis.pendingPayments.count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card data-testid="card-funnel">
        <CardHeader>
          <CardTitle>Embudo de Conversión</CardTitle>
          <p className="text-sm text-muted-foreground">
            Flujo de reservas desde recepción hasta pago completo
          </p>
        </CardHeader>
        <CardContent>
          <FunnelChart data={kpis.funnel} />
        </CardContent>
      </Card>

      {/* Upcoming Deadlines Table */}
      <Card data-testid="card-upcoming-deadlines">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Vencimientos Próximos (30 días)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Reservas con pagos pendientes que vencen próximamente
          </p>
        </CardHeader>
        <CardContent>
          <UpcomingDeadlinesTable deadlines={kpis.upcomingDeadlines} />
        </CardContent>
      </Card>
    </div>
  );
}
