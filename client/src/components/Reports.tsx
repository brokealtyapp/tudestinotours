import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface SalesReport {
  summary: {
    totalRevenue: number;
    totalReservations: number;
    averageOrderValue: number;
  };
  byTour: Array<{
    tourId: string;
    tourName: string;
    revenue: number;
    count: number;
  }>;
  byMonth: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
}

interface OccupationReportItem {
  departureId: string;
  tourId: string;
  tourName: string;
  departureDate: string;
  returnDate: string | null;
  totalSeats: number;
  reservedSeats: number;
  occupationPercentage: number;
}

interface AgingReport {
  buckets: {
    current: number;
    days8to14: number;
    days15to30: number;
    overdue: number;
  };
  reservations: Array<{
    id: string;
    code: string;
    tourName: string;
    buyerName: string;
    buyerEmail: string;
    totalPrice: number;
    balanceDue: number;
    paymentDueDate: string | null;
    daysOverdue: number;
    status: string;
    paymentStatus: string;
  }>;
}

function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}

export function Reports() {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Reportes y Análisis</h2>
        <p className="text-sm text-muted-foreground">Visualiza métricas clave y genera reportes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-reports">
          <TabsTrigger value="sales" data-testid="tab-sales">Ventas</TabsTrigger>
          <TabsTrigger value="occupation" data-testid="tab-occupation">Ocupación</TabsTrigger>
          <TabsTrigger value="aging" data-testid="tab-aging">Cuentas por Cobrar</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <SalesReport />
        </TabsContent>

        <TabsContent value="occupation" className="space-y-4">
          <OccupationReport />
        </TabsContent>

        <TabsContent value="aging" className="space-y-4">
          <AgingReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SalesReport() {
  const defaultStart = startOfMonth(subMonths(new Date(), 2));
  const defaultEnd = endOfMonth(new Date());

  const [startDate, setStartDate] = useState(format(defaultStart, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(defaultEnd, 'yyyy-MM-dd'));
  const [selectedTour, setSelectedTour] = useState<string>("all");
  const [selectedDeparture, setSelectedDeparture] = useState<string>("all");

  const { data: tours } = useQuery<any[]>({ queryKey: ['/api/tours'] });

  const { data: departures } = useQuery<any[]>({
    queryKey: ['/api/departures', { tourId: selectedTour !== "all" ? selectedTour : undefined }],
    enabled: selectedTour !== "all",
  });

  const { data: report, isLoading } = useQuery<SalesReport>({
    queryKey: ['/api/reports/sales', { 
      startDate, 
      endDate, 
      tourId: selectedTour !== "all" ? selectedTour : undefined,
      departureId: selectedDeparture !== "all" ? selectedDeparture : undefined
    }],
    enabled: !!startDate && !!endDate,
  });

  const handleExport = () => {
    if (!report) return;
    const exportData = report.byTour.map(item => ({
      Tour: item.tourName,
      Reservas: item.count,
      'Ingreso Total': item.revenue.toFixed(2),
      'Ticket Promedio': item.count > 0 ? (item.revenue / item.count).toFixed(2) : '0.00',
    }));
    exportToCSV(exportData, 'reporte-ventas');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card rounded-2xl shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-semibold text-foreground">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha Inicio</Label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha Fin</Label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                data-testid="input-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour-filter">Tour (Opcional)</Label>
              <Select value={selectedTour} onValueChange={(value) => {
                setSelectedTour(value);
                setSelectedDeparture("all");
              }}>
                <SelectTrigger id="tour-filter" data-testid="select-tour-filter">
                  <SelectValue placeholder="Todos los tours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tours</SelectItem>
                  {tours?.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure-filter">Salida (Opcional)</Label>
              <Select 
                value={selectedDeparture} 
                onValueChange={setSelectedDeparture}
                disabled={selectedTour === "all"}
              >
                <SelectTrigger id="departure-filter" data-testid="select-departure-filter">
                  <SelectValue placeholder="Todas las salidas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las salidas</SelectItem>
                  {departures?.map((departure) => (
                    <SelectItem key={departure.id} value={departure.id}>
                      {format(new Date(departure.departureDate), 'dd MMM yyyy', { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="text-center py-8">Cargando reporte...</div>}

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-foreground">Ingreso Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                  ${report.summary.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-foreground">Reservas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground" data-testid="text-total-reservations">
                  {report.summary.totalReservations}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-foreground">Ticket Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground" data-testid="text-average-order">
                  ${report.summary.averageOrderValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-6">
              <CardTitle className="text-lg font-semibold text-foreground">Ventas por Tour</CardTitle>
              <Button onClick={handleExport} variant="outline" size="sm" data-testid="button-export-sales">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {report.byTour.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de ventas en el período seleccionado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tour</TableHead>
                      <TableHead className="text-right">Reservas</TableHead>
                      <TableHead className="text-right">Ingreso Total</TableHead>
                      <TableHead className="text-right">Ticket Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byTour.map((item) => (
                      <TableRow key={item.tourId} data-testid={`row-tour-${item.tourId}`}>
                        <TableCell className="font-medium">{item.tourName}</TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                        <TableCell className="text-right">
                          ${item.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.count > 0 
                            ? (item.revenue / item.count).toLocaleString('es-MX', { minimumFractionDigits: 2 })
                            : '0.00'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-foreground">Ventas por Mes</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => `$${parseFloat(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function OccupationReport() {
  const defaultStart = format(new Date(), 'yyyy-MM-dd');
  const defaultEnd = format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedTour, setSelectedTour] = useState<string>("all");

  const { data: tours } = useQuery<any[]>({ queryKey: ['/api/tours'] });

  const { data: report, isLoading } = useQuery<OccupationReportItem[]>({
    queryKey: ['/api/reports/occupation', { startDate, endDate, tourId: selectedTour !== "all" ? selectedTour : undefined }],
    enabled: !!startDate && !!endDate,
  });

  const handleExport = () => {
    if (!report) return;
    const exportData = report.map(item => ({
      Tour: item.tourName,
      'Fecha Salida': format(new Date(item.departureDate), 'dd/MM/yyyy'),
      'Total Cupos': item.totalSeats,
      'Cupos Reservados': item.reservedSeats,
      'Ocupación %': item.occupationPercentage.toFixed(1),
    }));
    exportToCSV(exportData, 'reporte-ocupacion');
  };

  const getOccupationColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card rounded-2xl shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-semibold text-foreground">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occ-start-date">Fecha Inicio</Label>
              <input
                id="occ-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                data-testid="input-occ-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occ-end-date">Fecha Fin</Label>
              <input
                id="occ-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                data-testid="input-occ-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occ-tour-filter">Tour (Opcional)</Label>
              <Select value={selectedTour} onValueChange={setSelectedTour}>
                <SelectTrigger id="occ-tour-filter" data-testid="select-occ-tour-filter">
                  <SelectValue placeholder="Todos los tours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tours</SelectItem>
                  {tours?.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="text-center py-8">Cargando reporte...</div>}

      {report && (
        <>
          <Card className="bg-card rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-6">
              <CardTitle className="text-lg font-semibold text-foreground">Ocupación por Salida</CardTitle>
              <Button onClick={handleExport} variant="outline" size="sm" data-testid="button-export-occupation">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {report.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay salidas programadas en el período seleccionado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tour</TableHead>
                      <TableHead>Fecha Salida</TableHead>
                      <TableHead className="text-right">Total Cupos</TableHead>
                      <TableHead className="text-right">Reservados</TableHead>
                      <TableHead className="text-right">Ocupación</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.map((item) => (
                      <TableRow key={item.departureId} data-testid={`row-departure-${item.departureId}`}>
                        <TableCell className="font-medium">{item.tourName}</TableCell>
                        <TableCell>
                          {format(new Date(item.departureDate), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">{item.totalSeats}</TableCell>
                        <TableCell className="text-right">{item.reservedSeats}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getOccupationColor(item.occupationPercentage)}`}
                                style={{ width: `${Math.min(item.occupationPercentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {item.occupationPercentage.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.occupationPercentage >= 70 ? "default" :
                              item.occupationPercentage >= 40 ? "secondary" :
                              "destructive"
                            }
                          >
                            {item.occupationPercentage >= 70 ? "Alta" :
                             item.occupationPercentage >= 40 ? "Media" :
                             "Baja"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-foreground">Gráfico de Ocupación</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={report.slice(0, 10)} 
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    dataKey="tourName" 
                    type="category" 
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value: any) => `${parseFloat(value).toFixed(1)}%`} />
                  <Bar 
                    dataKey="occupationPercentage" 
                    fill="hsl(var(--primary))" 
                    name="Ocupación %" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function AgingReport() {
  const { data: report, isLoading } = useQuery<AgingReport>({
    queryKey: ['/api/reports/aging'],
  });

  const handleExport = () => {
    if (!report) return;
    const exportData = report.reservations.map(item => ({
      'Código': item.code,
      'Tour': item.tourName,
      'Cliente': item.buyerName,
      'Email': item.buyerEmail,
      'Total': item.totalPrice.toFixed(2),
      'Saldo Pendiente': item.balanceDue.toFixed(2),
      'Días Vencido': item.daysOverdue,
    }));
    exportToCSV(exportData, 'reporte-cuentas-por-cobrar');
  };

  return (
    <div className="space-y-6">
      {isLoading && <div className="text-center py-8">Cargando reporte...</div>}

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-foreground">Vigentes (0-7 días)</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground" data-testid="text-bucket-current">
                  ${report.buckets.current.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-foreground">8-14 días</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground" data-testid="text-bucket-8-14">
                  ${report.buckets.days8to14.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-foreground">15-30 días</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground" data-testid="text-bucket-15-30">
                  ${report.buckets.days15to30.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-foreground">Vencidas (+30 días)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground" data-testid="text-bucket-overdue">
                  ${report.buckets.overdue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-6">
              <CardTitle className="text-lg font-semibold text-foreground">Cuentas Pendientes por Cobrar</CardTitle>
              <Button onClick={handleExport} variant="outline" size="sm" data-testid="button-export-aging">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {report.reservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay cuentas pendientes por cobrar
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Tour</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Días Vencido</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.reservations.map((item) => (
                      <TableRow key={item.id} data-testid={`row-reservation-${item.id}`}>
                        <TableCell className="font-medium">{item.code}</TableCell>
                        <TableCell>{item.tourName}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.buyerName}</div>
                            <div className="text-sm text-muted-foreground">{item.buyerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${item.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.daysOverdue > 0 ? (
                            <Badge variant="destructive">{item.daysOverdue} días</Badge>
                          ) : (
                            <Badge variant="secondary">Al día</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.daysOverdue > 30 ? "destructive" :
                              item.daysOverdue > 14 ? "secondary" :
                              "default"
                            }
                          >
                            {item.daysOverdue > 30 ? "Crítico" :
                             item.daysOverdue > 14 ? "Atención" :
                             "Normal"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
