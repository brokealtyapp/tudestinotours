import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Download, Filter } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function Reconciliation() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [minAmount, setMinAmount] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (statusFilter) params.append('status', statusFilter);
    if (minAmount) params.append('minAmount', minAmount);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const { data: reconciliationData, isLoading } = useQuery<any[]>({
    queryKey: [`/api/payments/reconciliation${buildQueryString()}`],
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && reconciliationData) {
      const pendingIds = reconciliationData
        .filter(item => item.installment.status === 'pending')
        .map(item => item.installment.id);
      setSelectedItems(new Set(pendingIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSet = new Set(selectedItems);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedItems(newSet);
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Advertencia",
        description: "Selecciona al menos una cuota",
        variant: "destructive",
      });
      return;
    }

    try {
      const promises = Array.from(selectedItems).map(id =>
        apiRequest("PUT", `/api/installments/${id}/pay`, {})
      );
      
      await Promise.all(promises);
      
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith('/api/payments/reconciliation');
        }
      });
      setSelectedItems(new Set());
      
      toast({
        title: "Éxito",
        description: `${selectedItems.size} cuota(s) marcada(s) como pagada(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (!reconciliationData || reconciliationData.length === 0) return;

    const csvData = reconciliationData.map(item => ({
      'Reserva': item.reservation.id.substring(0, 8),
      'Tour': item.tour?.title || 'N/A',
      'Comprador': item.buyer?.name || item.reservation.buyerName,
      'Email': item.buyer?.email || item.reservation.buyerEmail,
      'Monto': `$${item.installment.amountDue}`,
      'Vencimiento': format(new Date(item.installment.dueDate), 'dd/MM/yyyy'),
      'Estado': item.installment.status === 'paid' ? 'Pagado' : item.installment.status === 'pending' ? 'Pendiente' : 'Vencido',
      'Método': item.installment.paymentMethod || '',
      'Referencia': item.installment.paymentReference || '',
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conciliacion-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Pagado</Badge>;
      case 'pending':
        return <Badge className="rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Pendiente</Badge>;
      case 'overdue':
        return <Badge className="rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Vencido</Badge>;
      default:
        return <Badge className="rounded-full">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Conciliación de Pagos</h2>
          <p className="text-sm text-gray-600">
            Gestiona y concilia cuotas de pago pendientes
          </p>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <Button onClick={handleBulkMarkAsPaid} className="bg-blue-600 hover:bg-blue-700" data-testid="button-bulk-mark-paid">
              <Check className="h-4 w-4 mr-2" />
              Marcar {selectedItems.size} como Pagadas
            </Button>
          )}
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date-filter">Fecha Inicio</Label>
              <Input
                id="start-date-filter"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-filter-start-date"
              />
            </div>
            <div>
              <Label htmlFor="end-date-filter">Fecha Fin</Label>
              <Input
                id="end-date-filter"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-filter-end-date"
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Estado</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                data-testid="select-filter-status"
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            <div>
              <Label htmlFor="min-amount-filter">Monto Mínimo</Label>
              <Input
                id="min-amount-filter"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0.00"
                data-testid="input-filter-min-amount"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="text-center py-8">Cargando datos...</div>}

      {reconciliationData && reconciliationData.length > 0 && (
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size > 0 && selectedItems.size === reconciliationData.filter(item => item.installment.status === 'pending').length}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Reserva</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliationData.map((item) => (
                  <TableRow key={item.installment.id} data-testid={`row-installment-${item.installment.id}`}>
                    <TableCell>
                      {item.installment.status === 'pending' && (
                        <Checkbox
                          checked={selectedItems.has(item.installment.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.installment.id, checked as boolean)}
                          data-testid={`checkbox-${item.installment.id}`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.reservation.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{item.tour?.title || 'N/A'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.buyer?.name || item.reservation.buyerName}</div>
                        <div className="text-sm text-muted-foreground">{item.buyer?.email || item.reservation.buyerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${parseFloat(item.installment.amountDue).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.installment.dueDate), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.installment.status)}</TableCell>
                    <TableCell className="text-sm">{item.installment.paymentMethod || '-'}</TableCell>
                    <TableCell className="text-sm font-mono">{item.installment.paymentReference || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reconciliationData && reconciliationData.length === 0 && !isLoading && (
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardContent className="py-8">
            <p className="text-center text-gray-600">
              No se encontraron cuotas con los filtros aplicados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
