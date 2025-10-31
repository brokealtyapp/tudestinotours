import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { EmailLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface EmailCommunicationsProps {
  reservationId: string;
}

export default function EmailCommunications({ reservationId }: EmailCommunicationsProps) {
  const { data: logs = [], isLoading } = useQuery<EmailLog[]>({
    queryKey: ["/api/reservations", reservationId, "communications"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Enviado</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Historial de Comunicaciones</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de todos los emails enviados para esta reserva
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay comunicaciones</h3>
              <p className="text-sm text-muted-foreground">
                Aún no se han enviado emails para esta reserva
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} data-testid={`email-log-${log.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{log.subject}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>Para: {log.recipientEmail}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(log.sentAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    {getStatusBadge(log.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Tipo:</span>
                    <Badge variant="secondary">{log.templateType}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Fecha de envío:</span>
                    <span>{new Date(log.sentAt).toLocaleString("es-ES")}</span>
                  </div>

                  {log.errorMessage && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Error al enviar</p>
                          <p className="text-xs text-destructive/80 mt-1">{log.errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Ver contenido del email
                    </summary>
                    <div className="mt-3 p-4 bg-muted/50 rounded-md border">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: log.body }}
                      />
                    </div>
                  </details>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
