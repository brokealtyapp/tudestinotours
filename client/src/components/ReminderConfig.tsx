import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ReminderRule, EmailTemplate } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReminderConfig() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [formData, setFormData] = useState({
    daysBeforeDeadline: 7,
    enabled: true,
    templateType: "reminder",
    sendTime: "09:00",
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery<ReminderRule[]>({
    queryKey: ["/api/reminder-rules"],
  });

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/reminder-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-rules"] });
      toast({
        title: "Regla creada",
        description: "La regla de recordatorio se creó correctamente",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la regla",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/reminder-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-rules"] });
      toast({
        title: "Regla actualizada",
        description: "La regla de recordatorio se actualizó correctamente",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la regla",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reminder-rules/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-rules"] });
      toast({
        title: "Regla eliminada",
        description: "La regla de recordatorio se eliminó correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la regla",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await fetch(`/api/reminder-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error("Failed to toggle");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-rules"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la regla",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      daysBeforeDeadline: 7,
      enabled: true,
      templateType: "reminder",
      sendTime: "09:00",
    });
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: ReminderRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        daysBeforeDeadline: rule.daysBeforeDeadline,
        enabled: rule.enabled,
        templateType: rule.templateType,
        sendTime: rule.sendTime,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (rulesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recordatorios Automáticos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configura cuándo enviar recordatorios de pago a los clientes
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-rule">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Regla
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Los recordatorios se envían automáticamente según los días configurados antes de la fecha límite de pago.
          El sistema verifica diariamente a las 8:00 AM y cada 6 horas.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Reglas de Recordatorio</CardTitle>
          <CardDescription>
            Gestiona las reglas que determinan cuándo enviar recordatorios automáticos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Días Antes</TableHead>
                <TableHead>Plantilla</TableHead>
                <TableHead>Hora de Envío</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay reglas configuradas. Agrega una regla para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id} data-testid={`row-rule-${rule.id}`}>
                    <TableCell className="font-medium">
                      {rule.daysBeforeDeadline === 0
                        ? "El día de vencimiento"
                        : `${rule.daysBeforeDeadline} días antes`}
                    </TableCell>
                    <TableCell>{rule.templateType}</TableCell>
                    <TableCell>{rule.sendTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(enabled) =>
                            toggleMutation.mutate({ id: rule.id, enabled })
                          }
                          data-testid={`switch-enable-${rule.id}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {rule.enabled ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(rule)}
                          data-testid={`button-edit-${rule.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("¿Estás seguro de eliminar esta regla?")) {
                              deleteMutation.mutate(rule.id);
                            }
                          }}
                          data-testid={`button-delete-${rule.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-rule-form">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Editar Regla" : "Nueva Regla de Recordatorio"}
            </DialogTitle>
            <DialogDescription>
              Configura cuándo y cómo enviar recordatorios automáticos a los clientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="days">Días antes de la fecha límite</Label>
              <Input
                id="days"
                type="number"
                min="0"
                value={formData.daysBeforeDeadline}
                onChange={(e) =>
                  setFormData({ ...formData, daysBeforeDeadline: parseInt(e.target.value) || 0 })
                }
                data-testid="input-days"
              />
              <p className="text-xs text-muted-foreground">
                0 = el mismo día de vencimiento
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Plantilla de Email</Label>
              <Select
                value={formData.templateType}
                onValueChange={(value) => setFormData({ ...formData, templateType: value })}
              >
                <SelectTrigger data-testid="select-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter((t) => t.isActive)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.templateType}>
                        {template.templateType}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora de envío</Label>
              <Input
                id="time"
                type="time"
                value={formData.sendTime}
                onChange={(e) => setFormData({ ...formData, sendTime: e.target.value })}
                data-testid="input-time"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
                data-testid="switch-enabled"
              />
              <Label>Regla activa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingRule ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
