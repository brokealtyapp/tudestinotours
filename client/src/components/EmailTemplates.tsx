import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Copy, History, Send, Search, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QuillEditor } from "./QuillEditor";

const TEMPLATE_TYPES = [
  // Emails para clientes
  { value: "reservation_confirmation", label: "Confirmación de Reserva" },
  { value: "payment_reminder", label: "Recordatorio de Pago" },
  { value: "reservation_cancellation", label: "Cancelación de Reserva" },
  { value: "document_rejection", label: "Rechazo de Documento" },
  { value: "document_approval", label: "Aprobación de Documento" },
  { value: "payment_confirmed", label: "Pago Confirmado" },
  { value: "welcome_credentials", label: "Bienvenida con Credenciales" },
  { value: "trip_reminder", label: "Recordatorio de Viaje" },
  
  // Emails para administradores
  { value: "admin_new_reservation", label: "Nueva Reserva (Admin)" },
  { value: "admin_document_uploaded", label: "Documento Subido (Admin)" },
  { value: "admin_reservation_expiring", label: "Reserva por Vencer (Admin)" },
];

const CATEGORIES = [
  { value: "cliente", label: "Cliente" },
  { value: "admin", label: "Administrador" },
  { value: "transactional", label: "Transaccional" },
  { value: "reminders", label: "Recordatorios" },
  { value: "notifications", label: "Notificaciones" },
  { value: "marketing", label: "Marketing" },
];

const DEFAULT_VARIABLES: Record<string, string[]> = {
  // Emails para clientes
  reservation_confirmation: ["buyerName", "tourName", "departureDate", "numberOfPassengers", "totalPrice", "dashboardLink"],
  payment_reminder: ["buyerName", "tourName", "amount", "dueDate", "paymentLink"],
  reservation_cancellation: ["buyerName", "tourName", "reason"],
  document_rejection: ["passengerName", "rejectionReason", "uploadLink"],
  document_approval: ["passengerName", "dashboardLink"],
  payment_confirmed: ["buyerName", "amount", "paymentDate", "dashboardLink"],
  welcome_credentials: ["userName", "email", "temporaryPassword", "loginLink"],
  trip_reminder: ["buyerName", "tourName", "departureDate", "daysUntilDeparture", "dashboardLink"],
  
  // Emails para administradores
  admin_new_reservation: ["reservationId", "tourName", "buyerName", "buyerEmail", "buyerPhone", "numberOfPassengers", "totalPrice", "departureDate", "adminLink"],
  admin_document_uploaded: ["passengerName", "reservationId", "tourName", "documentType", "adminLink"],
  admin_reservation_expiring: ["reservationId", "buyerName", "buyerEmail", "tourName", "pendingAmount", "dueDate", "daysRemaining", "adminLink"],
};

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ],
};

export function EmailTemplates() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedTemplateForVersions, setSelectedTemplateForVersions] = useState<string | null>(null);
  const [selectedTemplateForTest, setSelectedTemplateForTest] = useState<any>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [templateForm, setTemplateForm] = useState({
    templateType: "",
    category: "transactional",
    subject: "",
    body: "",
    variables: [] as string[],
    isActive: true,
  });

  const [testEmail, setTestEmail] = useState("");
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});

  const { data: templates, isLoading } = useQuery<any[]>({
    queryKey: ['/api/email-templates'],
  });

  const { data: versions } = useQuery<any[]>({
    queryKey: ['/api/email-templates', selectedTemplateForVersions, 'versions'],
    enabled: !!selectedTemplateForVersions,
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    
    return templates.filter(t => {
      const matchesSearch = searchTerm === "" || 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.templateType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "active" && t.isActive) || 
        (filterStatus === "inactive" && !t.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [templates, searchTerm, filterCategory, filterStatus]);

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
      setShowDeleteAlert(false);
      setTemplateToDelete(null);
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

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/email-templates/${id}/duplicate`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Éxito",
        description: "Plantilla duplicada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo duplicar la plantilla",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async ({ id, testEmail, variables }: { id: string; testEmail: string; variables: any }) => {
      const res = await apiRequest("POST", `/api/email-templates/${id}/test`, { testEmail, variables });
      return res.json();
    },
    onSuccess: () => {
      setShowTestDialog(false);
      setTestEmail("");
      setTestVariables({});
      toast({
        title: "Éxito",
        description: "Email de prueba enviado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el email de prueba",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTemplateForm({
      templateType: "",
      category: "transactional",
      subject: "",
      body: "",
      variables: [],
      isActive: true,
    });
    setEditingTemplate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar placeholders
    const availableVars = DEFAULT_VARIABLES[templateForm.templateType as keyof typeof DEFAULT_VARIABLES] || [];
    const invalidVars = templateForm.variables.filter(v => !availableVars.includes(v));
    
    if (invalidVars.length > 0) {
      toast({
        title: "Error de validación",
        description: `Las siguientes variables no son válidas para este tipo de plantilla: ${invalidVars.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createMutation.mutate(templateForm);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setTemplateForm({
      templateType: template.templateType,
      category: template.category || "transactional",
      subject: template.subject,
      body: template.body,
      variables: template.variables || [],
      isActive: template.isActive,
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  const handleShowVersions = (id: string) => {
    setSelectedTemplateForVersions(id);
    setShowVersionsDialog(true);
  };

  const handleShowTest = (template: any) => {
    setSelectedTemplateForTest(template);
    const defaultVars: Record<string, string> = {};
    (template.variables || []).forEach((v: string) => {
      defaultVars[v] = `Ejemplo ${v}`;
    });
    setTestVariables(defaultVars);
    setShowTestDialog(true);
  };

  const handleSendTest = () => {
    if (selectedTemplateForTest && testEmail) {
      testEmailMutation.mutate({
        id: selectedTemplateForTest.id,
        testEmail,
        variables: testVariables,
      });
    }
  };

  // Auto-extract variables from body
  useEffect(() => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = Array.from(templateForm.body.matchAll(regex));
    const extractedVars = Array.from(new Set(matches.map(m => m[1])));
    setTemplateForm(prev => ({ ...prev, variables: extractedVars }));
  }, [templateForm.body]);

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'transactional': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'reminders': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'notifications': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'marketing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por asunto o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-templates"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40" data-testid="select-filter-category">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32" data-testid="select-filter-status">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="inactive">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Cargando plantillas...</div>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg" data-testid={`text-template-subject-${template.id}`}>
                        {template.subject}
                      </CardTitle>
                      {template.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20" data-testid={`badge-active-${template.id}`}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-900/20" data-testid={`badge-inactive-${template.id}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          Inactiva
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" data-testid={`badge-type-${template.id}`}>
                        {TEMPLATE_TYPES.find(t => t.value === template.templateType)?.label || template.templateType}
                      </Badge>
                      <Badge className={getCategoryBadgeColor(template.category)} data-testid={`badge-category-${template.id}`}>
                        {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                      </Badge>
                      {template.variables?.length > 0 && (
                        <span className="text-xs text-muted-foreground" data-testid={`text-variables-${template.id}`}>
                          {template.variables.length} variables
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleShowTest(template)}
                      title="Enviar prueba"
                      data-testid={`button-test-${template.id}`}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDuplicate(template.id)}
                      title="Duplicar"
                      data-testid={`button-duplicate-${template.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleShowVersions(template.id)}
                      title="Ver historial"
                      data-testid={`button-versions-${template.id}`}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                      data-testid={`button-edit-${template.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(template.id)}
                      data-testid={`button-delete-${template.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {template.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((v: string) => (
                        <code key={v} className="text-xs bg-muted px-2 py-1 rounded" data-testid={`code-variable-${v}-${template.id}`}>
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No se encontraron plantillas
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Modifica los campos de la plantilla." : "Crea una nueva plantilla de email."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateType">Tipo de Plantilla</Label>
                <Select
                  value={templateForm.templateType}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, templateType: value })}
                  disabled={!!editingTemplate}
                >
                  <SelectTrigger id="templateType" data-testid="select-template-type">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                >
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                required
                data-testid="input-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Cuerpo del Email (HTML)</Label>
              <div className="border rounded-md" data-testid="editor-body">
                <QuillEditor
                  value={templateForm.body}
                  onChange={(value) => setTemplateForm({ ...templateForm, body: value })}
                  modules={QUILL_MODULES}
                  className="min-h-[200px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Usa <code className="bg-muted px-1 rounded">{'{{variableName}}'}</code> para insertar variables dinámicas.
              </p>
            </div>

            {templateForm.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Variables Detectadas</Label>
                <div className="flex flex-wrap gap-2">
                  {templateForm.variables.map((v) => {
                    const isValid = DEFAULT_VARIABLES[templateForm.templateType as keyof typeof DEFAULT_VARIABLES]?.includes(v);
                    return (
                      <Badge
                        key={v}
                        variant={isValid ? "secondary" : "destructive"}
                        className="flex items-center gap-1"
                        data-testid={`badge-detected-${v}`}
                      >
                        {isValid ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {v}
                      </Badge>
                    );
                  })}
                </div>
                {templateForm.templateType && (
                  <p className="text-xs text-muted-foreground">
                    Variables disponibles: {DEFAULT_VARIABLES[templateForm.templateType as keyof typeof DEFAULT_VARIABLES]?.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={templateForm.isActive}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })}
                data-testid="switch-active"
              />
              <Label htmlFor="isActive">Plantilla Activa</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowDialog(false); resetForm(); }}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {editingTemplate ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Versions Dialog */}
      <Dialog open={showVersionsDialog} onOpenChange={setShowVersionsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-versions-title">Historial de Versiones</DialogTitle>
            <DialogDescription>
              Versiones anteriores de esta plantilla (máximo 10 versiones guardadas).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {versions && versions.length > 0 ? (
              versions.map((version) => (
                <Card key={version.id} data-testid={`card-version-${version.versionNumber}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Versión {version.versionNumber}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString('es-ES')}
                      </span>
                    </div>
                    {version.changedBy && (
                      <p className="text-xs text-muted-foreground">
                        Modificado por: Usuario ID {version.changedBy}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs">Asunto:</Label>
                      <p className="text-sm">{version.subject}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Variables:</Label>
                      <div className="flex flex-wrap gap-1">
                        {version.variables?.map((v: string) => (
                          <code key={v} className="text-xs bg-muted px-1 rounded">
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No hay versiones anteriores</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="text-test-title">Enviar Email de Prueba</DialogTitle>
            <DialogDescription>
              Envía un email de prueba con valores de ejemplo para verificar el formato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Email de Destino</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="prueba@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
                data-testid="input-test-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Variables de Prueba</Label>
              <div className="space-y-2">
                {selectedTemplateForTest?.variables?.map((v: string) => (
                  <div key={v} className="grid grid-cols-3 gap-2 items-center">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{`{{${v}}}`}</code>
                    <Input
                      className="col-span-2"
                      value={testVariables[v] || ''}
                      onChange={(e) => setTestVariables({ ...testVariables, [v]: e.target.value })}
                      placeholder={`Valor para ${v}`}
                      data-testid={`input-test-var-${v}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTestDialog(false)}
                data-testid="button-cancel-test"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendTest}
                disabled={!testEmail || testEmailMutation.isPending}
                data-testid="button-send-test"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Prueba
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent data-testid="alert-delete-template">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La plantilla y su historial de versiones serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
