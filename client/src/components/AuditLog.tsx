import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileEdit, Trash2, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
  id: string;
  userId: string;
  reservationId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { before: any; after: any }>;
  timestamp: Date;
}

interface AuditLogProps {
  reservationId: string;
}

const actionTranslations: Record<string, string> = {
  updated: "Modificado",
  deleted: "Eliminado",
  created: "Creado",
};

const entityTypeTranslations: Record<string, string> = {
  tour: "Tour",
  departure: "Salida",
  reservation: "Reserva",
  passenger: "Pasajero",
  payment: "Pago",
  payment_installment: "Cuota de Pago",
  email_template: "Plantilla de Email",
  reminder_rule: "Regla de Recordatorio",
  user: "Usuario",
  system_setting: "Configuración del Sistema",
};

const fieldTranslations: Record<string, string> = {
  status: "Estado",
  totalAmount: "Monto Total",
  paidAmount: "Monto Pagado",
  startDate: "Fecha de Inicio",
  endDate: "Fecha de Fin",
  availableSeats: "Asientos Disponibles",
  price: "Precio",
  name: "Nombre",
  email: "Email",
  phone: "Teléfono",
  notes: "Notas",
  _deleted: "Eliminado",
};

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export default function AuditLog({ reservationId }: AuditLogProps) {
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/reservations", reservationId, "audit"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Auditoría</CardTitle>
          <CardDescription>Cargando historial...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Auditoría</CardTitle>
          <CardDescription>No hay cambios registrados para esta reserva.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Auditoría</CardTitle>
        <CardDescription>
          Registro completo de modificaciones y cambios realizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {logs.map((log, index) => {
              const isLast = index === logs.length - 1;
              const actionLabel = actionTranslations[log.action] || log.action;
              const entityLabel = entityTypeTranslations[log.entityType] || log.entityType;

              return (
                <div key={log.id} className="relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />
                  )}

                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center relative z-10">
                      {log.action === "deleted" ? (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      ) : (
                        <FileEdit className="w-4 h-4 text-primary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" data-testid={`badge-action-${log.id}`}>
                          {actionLabel}
                        </Badge>
                        <Badge variant="secondary" data-testid={`badge-entity-${log.id}`}>
                          {entityLabel}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ID: {log.entityId.slice(0, 8)}
                        </span>
                      </div>

                      {/* Timestamp and User */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span data-testid={`text-timestamp-${log.id}`}>
                            {format(new Date(log.timestamp), "PPpp", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span data-testid={`text-user-${log.id}`}>
                            Usuario: {log.userId.slice(0, 8)}
                          </span>
                        </div>
                      </div>

                      {/* Changes */}
                      {log.action !== "deleted" && Object.keys(log.changes).length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium">Cambios realizados:</p>
                          <div className="bg-muted/50 rounded-md p-3 space-y-2">
                            {Object.entries(log.changes).map(([field, change]) => {
                              const fieldLabel = fieldTranslations[field] || field;
                              
                              return (
                                <div
                                  key={field}
                                  className="text-sm space-y-1"
                                  data-testid={`change-${log.id}-${field}`}
                                >
                                  <p className="font-medium text-muted-foreground">{fieldLabel}:</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground">Antes:</p>
                                      <div className="bg-destructive/10 text-destructive-foreground rounded px-2 py-1 text-xs font-mono break-all">
                                        {formatValue(change.before)}
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground">Después:</p>
                                      <div className="bg-primary/10 text-primary-foreground rounded px-2 py-1 text-xs font-mono break-all">
                                        {formatValue(change.after)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Deleted indicator */}
                      {log.action === "deleted" && (
                        <div className="mt-3">
                          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                            Este registro fue eliminado del sistema.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
