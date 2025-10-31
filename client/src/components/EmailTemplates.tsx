import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TEMPLATE_TYPES = [
  { value: "confirmation", label: "Confirmación de Reserva" },
  { value: "reminder", label: "Recordatorio de Pago" },
  { value: "cancellation", label: "Cancelación de Reserva" },
  { value: "rejection", label: "Rechazo de Documento" },
  { value: "payment_confirmed", label: "Pago Confirmado" },
];

const DEFAULT_VARIABLES = {
  confirmation: ["clientName", "reservationCode", "tourName", "departureDate", "totalPrice"],
  reminder: ["clientName", "reservationCode", "tourName", "amountDue", "dueDate"],
  cancellation: ["clientName", "reservationCode", "tourName", "reason"],
  rejection: ["clientName", "passengerName", "rejectionReason"],
  payment_confirmed: ["clientName", "reservationCode", "amountPaid", "balance"],
};

export function EmailTemplates() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const [templateForm, setTemplateForm] = useState({
    templateType: "",
    subject: "",
    body: "",
    variables: [] as string[],
    isActive: true,
  });

  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  const { data: templates, isLoading } = useQuery<any[]>({
    queryKey: ['/api/email-templates'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/email-templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setShowDialog(false);
      resetForm();
      toast({
        title: "Éxito",
        description: "Plantilla creada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la plantilla",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/email-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setShowDialog(false);
      resetForm();
      toast({
        title: "Éxito",
        description: "Plantilla actualizada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la plantilla",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/email-templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Éxito",
        description: "Plantilla eliminada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla",
        variant: "destructive",
      });
    },
  });

  const renderMutation = useMutation({
    mutationFn: async ({ id, variables }: { id: string; variables: Record<string, string> }) => {
      const res = await apiRequest("POST", `/api/email-templates/${id}/render`, { variables });
      return res.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreviewDialog(true);
    },
  });

  const resetForm = () => {
    setTemplateForm({
      templateType: "",
      subject: "",
      body: "",
      variables: [],
      isActive: true,
    });
    setEditingTemplate(null);
  };

  const handleOpenDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        templateType: template.templateType,
        subject: template.subject,
        body: template.body,
        variables: template.variables || [],
        isActive: template.isActive,
      });
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: templateForm,
      });
    } else {
      createMutation.mutate(templateForm);
    }
  };

  const handlePreview = (template: any) => {
    const defaultVars = (DEFAULT_VARIABLES as any)[template.templateType] || [];
    const initialVars: Record<string, string> = {};
    defaultVars.forEach((v: string) => {
      initialVars[v] = `[${v}]`;
    });
    setPreviewVariables(initialVars);
    renderMutation.mutate({ id: template.id, variables: initialVars });
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta plantilla?")) {
      deleteMutation.mutate(id);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    setTemplateForm(prev => ({
      ...prev,
      body: prev.body + `{{${placeholder}}}`,
    }));
  };

  const getTypeLabel = (type: string) => {
    return TEMPLATE_TYPES.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando plantillas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Plantillas de Email</h2>
          <p className="text-muted-foreground">
            Gestiona las plantillas de correo electrónico del sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id} data-testid={`template-card-${template.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getTypeLabel(template.templateType)}
                  {!template.isActive && (
                    <Badge variant="secondary" data-testid={`badge-inactive-${template.id}`}>
                      Inactiva
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Asunto: {template.subject}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(template)}
                  data-testid={`button-preview-${template.id}`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Vista Previa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(template)}
                  data-testid={`button-edit-${template.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(template.id)}
                  data-testid={`button-delete-${template.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}

        {templates?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay plantillas creadas. Haz clic en "Nueva Plantilla" para comenzar.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="templateType">Tipo de Plantilla</Label>
              <Select
                value={templateForm.templateType}
                onValueChange={(value) => setTemplateForm(prev => ({ ...prev, templateType: value }))}
                disabled={!!editingTemplate}
              >
                <SelectTrigger data-testid="select-template-type">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} data-testid={`option-${type.value}`}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ej: Confirmación de tu reserva {{reservationCode}}"
                data-testid="input-subject"
              />
            </div>

            <div>
              <Label>Placeholders Disponibles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {templateForm.templateType && (DEFAULT_VARIABLES as any)[templateForm.templateType]?.map((v: string) => (
                  <Badge
                    key={v}
                    variant="outline"
                    className="cursor-pointer hover-elevate"
                    onClick={() => insertPlaceholder(v)}
                    data-testid={`placeholder-${v}`}
                  >
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Haz clic en un placeholder para insertarlo en el cuerpo del mensaje
              </p>
            </div>

            <div>
              <Label htmlFor="body">Cuerpo del Mensaje</Label>
              <Textarea
                id="body"
                value={templateForm.body}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Escribe el contenido del email..."
                rows={10}
                data-testid="textarea-body"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa placeholders como {'{{clientName}}'} que serán reemplazados automáticamente
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!templateForm.templateType || !templateForm.subject || !templateForm.body}
                data-testid="button-save"
              >
                {editingTemplate ? "Guardar Cambios" : "Crear Plantilla"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista Previa del Email</DialogTitle>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <div>
                <Label>Asunto:</Label>
                <div className="p-3 bg-muted rounded-md mt-1 font-medium" data-testid="preview-subject">
                  {previewData.subject}
                </div>
              </div>

              <div>
                <Label>Cuerpo:</Label>
                <div className="p-4 bg-muted rounded-md mt-1 whitespace-pre-wrap" data-testid="preview-body">
                  {previewData.body}
                </div>
              </div>

              <Button onClick={() => setShowPreviewDialog(false)} className="w-full" data-testid="button-close-preview">
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
