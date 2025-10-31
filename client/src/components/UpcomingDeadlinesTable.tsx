import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UpcomingDeadline {
  reservationId: string;
  bookingCode: string;
  tourName: string;
  departureDate: string;
  daysRemaining: number;
  dueDate: string;
  balanceDue: number;
}

interface UpcomingDeadlinesTableProps {
  deadlines: UpcomingDeadline[];
}

export default function UpcomingDeadlinesTable({ deadlines }: UpcomingDeadlinesTableProps) {
  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay vencimientos próximos en los siguientes 30 días
      </div>
    );
  }

  const getDaysRemainingBadge = (days: number) => {
    if (days < 7) {
      return <Badge variant="destructive" data-testid="badge-urgent">{days}d</Badge>;
    } else if (days < 14) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600" data-testid="badge-warning">{days}d</Badge>;
    } else {
      return <Badge variant="secondary" data-testid="badge-normal">{days}d</Badge>;
    }
  };

  const handleSendReminder = (reservationId: string) => {
    // TODO: Implement send reminder functionality
    console.log("Send reminder for reservation:", reservationId);
  };

  return (
    <div className="rounded-md border" data-testid="table-upcoming-deadlines">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Tour</TableHead>
            <TableHead>Fecha Salida</TableHead>
            <TableHead>Vence en</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-center">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deadlines.map((deadline, index) => (
            <TableRow key={deadline.reservationId} data-testid={`row-deadline-${index}`}>
              <TableCell className="font-medium" data-testid={`text-code-${index}`}>
                {deadline.bookingCode}
              </TableCell>
              <TableCell data-testid={`text-tour-${index}`}>
                <div className="max-w-[200px] truncate" title={deadline.tourName}>
                  {deadline.tourName}
                </div>
              </TableCell>
              <TableCell data-testid={`text-departure-${index}`}>
                {format(new Date(deadline.departureDate), "dd MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell data-testid={`badge-days-${index}`}>
                {getDaysRemainingBadge(deadline.daysRemaining)}
              </TableCell>
              <TableCell className="text-right font-semibold" data-testid={`text-balance-${index}`}>
                ${deadline.balanceDue.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSendReminder(deadline.reservationId)}
                  data-testid={`button-remind-${index}`}
                  title="Enviar recordatorio de pago"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
