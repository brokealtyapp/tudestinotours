import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  AlertCircle,
  FileText,
  User,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  id: string;
  reservationId: string;
  eventType: string;
  description: string;
  performedBy: string | null;
  performedByName?: string;
  metadata: string | null;
  createdAt: string;
}

interface ReservationTimelineProps {
  reservationId: string;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "reservation_created":
      return <Calendar className="h-4 w-4" />;
    case "status_changed":
      return <AlertCircle className="h-4 w-4" />;
    case "payment_status_changed":
      return <DollarSign className="h-4 w-4" />;
    case "installment_created":
      return <FileText className="h-4 w-4" />;
    case "installment_paid":
      return <CheckCircle2 className="h-4 w-4" />;
    case "reservation_confirmed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "reservation_cancelled":
      return <XCircle className="h-4 w-4" />;
    case "payment_confirmed":
      return <CreditCard className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case "reservation_created":
      return "bg-blue-500 dark:bg-blue-600";
    case "status_changed":
      return "bg-amber-500 dark:bg-amber-600";
    case "payment_status_changed":
      return "bg-green-500 dark:bg-green-600";
    case "installment_created":
      return "bg-purple-500 dark:bg-purple-600";
    case "installment_paid":
      return "bg-emerald-500 dark:bg-emerald-600";
    case "reservation_confirmed":
      return "bg-green-500 dark:bg-green-600";
    case "reservation_cancelled":
      return "bg-red-500 dark:bg-red-600";
    case "payment_confirmed":
      return "bg-green-500 dark:bg-green-600";
    default:
      return "bg-gray-500 dark:bg-gray-600";
  }
};

const getRelativeTime = (date: string) => {
  const now = new Date();
  const eventDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - eventDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Hace menos de un minuto";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Hace ${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `Hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`;
};

export default function ReservationTimeline({ reservationId }: ReservationTimelineProps) {
  const { data: events, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['/api/reservations', reservationId, 'timeline'],
  });

  if (isLoading) {
    return (
      <Card data-testid="timeline-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Cargando historial...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card data-testid="timeline-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No hay eventos registrados aún
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="timeline-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" aria-hidden="true" />
          
          {events.map((event, index) => (
            <div 
              key={event.id} 
              className="relative flex gap-4"
              data-testid={`timeline-event-${index}`}
            >
              {/* Event icon */}
              <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${getEventColor(event.eventType)} text-white shrink-0`}>
                {getEventIcon(event.eventType)}
              </div>
              
              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground" data-testid={`event-description-${index}`}>
                      {event.description}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {event.performedByName || 'Sistema'}
                      </span>
                      <span>•</span>
                      <time 
                        dateTime={event.createdAt}
                        title={format(new Date(event.createdAt), "PPpp", { locale: es })}
                        data-testid={`event-time-${index}`}
                      >
                        {getRelativeTime(event.createdAt)}
                      </time>
                    </div>
                    
                    {/* Metadata badge if available */}
                    {event.metadata && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {(() => {
                            try {
                              const metadata = JSON.parse(event.metadata);
                              return Object.entries(metadata)
                                .slice(0, 2)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ');
                            } catch {
                              return event.metadata;
                            }
                          })()}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
