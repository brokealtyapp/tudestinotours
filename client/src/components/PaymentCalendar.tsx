import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function PaymentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const { data: calendarData, isLoading } = useQuery<any[]>({
    queryKey: [`/api/payments/calendar?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`],
  });

  const groupByDate = (data: any[]) => {
    const grouped = new Map<string, any[]>();
    
    if (!data) return grouped;
    
    data.forEach(item => {
      if (!item.installment?.dueDate) return;
      const dateKey = format(parseISO(item.installment.dueDate), 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(item);
    });
    
    return grouped;
  };

  const paymentsByDate = groupByDate(calendarData || []);
  
  const getDayTotal = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const payments = paymentsByDate.get(dateKey) || [];
    return payments.reduce((sum, item) => sum + parseFloat(item.installment.amountDue || 0), 0);
  };

  const getDayPayments = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return paymentsByDate.get(dateKey) || [];
  };

  const getPendingCount = (day: Date) => {
    const payments = getDayPayments(day);
    return payments.filter(p => p.installment.status === 'pending').length;
  };

  const renderCalendarDays = () => {
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = monthStart.getDay();
    const emptyDays = Array(firstDayOfWeek).fill(null);
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-center font-semibold text-sm p-2" data-testid={`calendar-header-${day}`}>
            {day}
          </div>
        ))}
        
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="min-h-24 p-2 border rounded-md bg-muted/20" />
        ))}
        
        {daysInMonth.map(day => {
          const dayTotal = getDayTotal(day);
          const pendingCount = getPendingCount(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card 
              key={day.toISOString()} 
              className={`min-h-24 p-2 bg-white shadow-sm ${isToday ? 'border-blue-600 border-2' : ''}`}
              data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
            >
              <div className="text-right text-sm font-medium text-gray-900 mb-1">
                {format(day, 'd')}
              </div>
              
              {dayTotal > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-blue-600" data-testid={`day-total-${format(day, 'yyyy-MM-dd')}`}>
                    ${dayTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="text-xs rounded-full" data-testid={`day-pending-${format(day, 'yyyy-MM-dd')}`}>
                      {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDayDetails = () => {
    const allPayments = calendarData || [];
    
    if (allPayments.length === 0) {
      return (
        <div className="text-center text-gray-600 py-8">
          No hay pagos pendientes este mes
        </div>
      );
    }

    const paymentsByDueDate = new Map<string, any[]>();
    allPayments.forEach(item => {
      if (!item.installment?.dueDate) return;
      const dateKey = format(parseISO(item.installment.dueDate), 'yyyy-MM-dd');
      if (!paymentsByDueDate.has(dateKey)) {
        paymentsByDueDate.set(dateKey, []);
      }
      paymentsByDueDate.get(dateKey)!.push(item);
    });

    const sortedDates = Array.from(paymentsByDueDate.keys()).sort();

    return (
      <div className="space-y-4">
        {sortedDates.map(dateKey => {
          const payments = paymentsByDueDate.get(dateKey)!;
          const dayTotal = payments.reduce((sum, item) => sum + parseFloat(item.installment.amountDue || 0), 0);
          
          return (
            <Card key={dateKey} className="bg-white shadow-sm" data-testid={`details-${dateKey}`}>
              <CardHeader className="pb-3 p-4">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center justify-between gap-2">
                  <span>{format(parseISO(dateKey), "EEEE d 'de' MMMM", { locale: es })}</span>
                  <Badge variant="outline" className="font-normal rounded-full">
                    ${dayTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {payments.map((item) => (
                    <div 
                      key={item.installment.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                      data-testid={`payment-item-${item.installment.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {item.tour?.name || 'Tour no especificado'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Reserva #{item.reservation?.id?.slice(0, 8)} • {item.buyer?.name || 'Cliente'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`rounded-full ${item.installment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                          data-testid={`status-${item.installment.id}`}
                        >
                          {item.installment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                        <div className="text-sm font-semibold text-gray-900 min-w-24 text-right" data-testid={`amount-${item.installment.id}`}>
                          ${parseFloat(item.installment.amountDue).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <CardTitle className="text-xl font-semibold text-gray-900" data-testid="text-current-month">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </CardTitle>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isLoading ? (
            <div className="text-center py-12">Cargando calendario...</div>
          ) : (
            renderCalendarDays()
          )}
        </CardContent>
      </Card>

      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <DollarSign className="h-5 w-5" />
            Detalle de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isLoading ? (
            <div className="text-center py-8">Cargando detalles...</div>
          ) : (
            renderDayDetails()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
