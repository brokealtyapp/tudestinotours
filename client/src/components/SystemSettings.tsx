import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import CitiesManagement from "./CitiesManagement";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  dataType: string;
  updatedAt: Date;
  updatedBy: string | null;
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "email", label: "Email" },
  { value: "payments", label: "Pagos" },
  { value: "reservations", label: "Reservas" },
  { value: "notifications", label: "Notificaciones" },
];

const DATA_TYPES = [
  { value: "string", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "boolean", label: "Booleano" },
  { value: "json", label: "JSON" },
];

export default function SystemSettings() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [form, setForm] = useState({
    key: "",
    value: "",
    category: "general",
    description: "",
    dataType: "string",
  });

  const { data: settings = [], isLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings", selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      return fetch(`/api/settings?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }).then(r => r.json());
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configuración creada",
        description: "La configuración se creó correctamente.",
      });
      setShowDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la configuración",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest("PUT", `/api/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configuración actualizada",
        description: "La configuración se actualizó correctamente.",
      });
      setShowDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiRequest("DELETE", `/api/settings/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configuración eliminada",
        description: "La configuración se eliminó correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar la configuración",
      });
    },
  });

  const resetForm = () => {
    setForm({
      key: "",
      value: "",
      category: "general",
      description: "",
      dataType: "string",
    });
    setEditingSetting(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setForm({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description || "",
      dataType: setting.dataType,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingSetting) {
      updateMutation.mutate({
        key: editingSetting.key,
        value: form.value,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (key: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta configuración?")) {
      deleteMutation.mutate(key);
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
          <CardDescription>Cargando configuraciones...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CitiesManagement />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Gestiona las configuraciones generales del sistema
              </CardDescription>
            </div>
            <Button onClick={handleOpenNew} data-testid="button-new-setting">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Configuración
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              size="sm"
            >
              Todas
            </Button>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.value)}
                size="sm"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {settings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay configuraciones en esta categoría
              </p>
            ) : (
              settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                  data-testid={`setting-${setting.key}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-semibold" data-testid={`text-key-${setting.key}`}>
                        {setting.key}
                      </h3>
                      <Badge variant="outline">{getCategoryLabel(setting.category)}</Badge>
                      <Badge variant="secondary">{setting.dataType}</Badge>
                    </div>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    )}
                    <div className="bg-muted rounded px-3 py-2 mt-2">
                      <code className="text-sm" data-testid={`text-value-${setting.key}`}>
                        {setting.value}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última actualización: {new Date(setting.updatedAt).toLocaleString('es-ES')}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(setting)}
                      data-testid={`button-edit-${setting.key}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(setting.key)}
                      data-testid={`button-delete-${setting.key}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? "Editar Configuración" : "Nueva Configuración"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Clave</Label>
              <Input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                disabled={!!editingSetting}
                placeholder="ej: max_passengers_per_tour"
                data-testid="input-key"
              />
            </div>

            <div>
              <Label>Valor</Label>
              <Textarea
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="Valor de la configuración"
                data-testid="input-value"
              />
            </div>

            {!editingSetting && (
              <>
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
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

                <div>
                  <Label>Tipo de Dato</Label>
                  <Select
                    value={form.dataType}
                    onValueChange={(value) => setForm({ ...form, dataType: value })}
                  >
                    <SelectTrigger data-testid="select-datatype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Descripción (Opcional)</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe el propósito de esta configuración"
                    data-testid="input-description"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !form.key || !form.value ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                data-testid="button-save"
              >
                {editingSetting ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
