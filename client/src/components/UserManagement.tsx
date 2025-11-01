import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Shield, 
  UserPlus, 
  Download, 
  Search, 
  History 
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  active: boolean;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: any;
  performedBy: string;
  createdAt: string;
}

const ROLES = [
  { value: "super_admin", label: "Super Admin", color: "bg-purple-500" },
  { value: "admin", label: "Administrador", color: "bg-red-500" },
  { value: "manager", label: "Gerente", color: "bg-blue-500" },
  { value: "agent", label: "Agente", color: "bg-green-500" },
  { value: "client", label: "Cliente", color: "bg-gray-500" },
];

export default function UserManagement() {
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [createForm, setCreateForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "client" 
  });
  
  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs", selectedUser?.id],
    enabled: !!selectedUser && showHistoryDialog,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuario creado",
        description: "El nuevo usuario se creó correctamente.",
      });
      setShowCreateDialog(false);
      setCreateForm({ name: "", email: "", password: "", role: "client" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario se actualizaron correctamente.",
      });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return apiRequest("PUT", `/api/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario se actualizó correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return apiRequest("PUT", `/api/admin/users/${id}/toggle-active`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario se actualizó correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo cambiar el estado",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario se eliminó correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
      });
    },
  });

  const handleCreateUser = () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Todos los campos son requeridos",
      });
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: editForm,
    });
  };

  const handleChangeRole = (userId: string, role: string) => {
    updateRoleMutation.mutate({ id: userId, role });
  };

  const handleToggleActive = (userId: string, active: boolean) => {
    toggleActiveMutation.mutate({ id: userId, active: !active });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleViewHistory = (user: User) => {
    setSelectedUser(user);
    setShowHistoryDialog(true);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Nombre", "Email", "Rol", "Estado", "Permisos", "Fecha Creación"].join(","),
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        getRoleLabel(user.role),
        user.active ? "Activo" : "Inactivo",
        user.permissions.length.toString(),
        new Date(user.createdAt).toLocaleDateString("es-ES"),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportación exitosa",
      description: `Se exportaron ${filteredUsers.length} usuarios a CSV`,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const roleConfig = ROLES.find(r => r.value === role);
    return roleConfig?.color || "bg-gray-500";
  };

  const getRoleLabel = (role: string) => {
    const roleConfig = ROLES.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  // Filtrado y búsqueda
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtro de búsqueda
      const matchesSearch = searchQuery === "" || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro de rol
      const matchesRole = filterRole === "all" || user.role === filterRole;
      
      // Filtro de estado
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "active" && user.active) ||
        (filterStatus === "inactive" && !user.active);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Cargando usuarios...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios del sistema, sus roles y permisos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-user"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros y búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger data-testid="select-filter-role">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-testid="select-filter-status">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contador de resultados */}
          <div className="mb-4 text-sm text-muted-foreground">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron usuarios con los filtros aplicados
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`user-${user.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold" data-testid={`text-name-${user.id}`}>
                        {user.name}
                      </h3>
                      <Badge
                        className={`${getRoleBadgeColor(user.role)} text-white`}
                        data-testid={`badge-role-${user.id}`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleLabel(user.role)}
                      </Badge>
                      {!user.active && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-email-${user.id}`}>
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Permisos: {user.permissions.length} asignados
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(role) => handleChangeRole(user.id, role)}
                    >
                      <SelectTrigger className="w-40" data-testid={`select-role-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewHistory(user)}
                      data-testid={`button-history-${user.id}`}
                      title="Ver historial de acciones"
                    >
                      <History className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                      data-testid={`button-edit-${user.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant={user.active ? "outline" : "default"}
                      onClick={() => handleToggleActive(user.id, user.active)}
                      data-testid={`button-toggle-${user.id}`}
                    >
                      {user.active ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user.id)}
                      data-testid={`button-delete-${user.id}`}
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

      {/* Dialog para crear usuario */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre Completo</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Juan Pérez"
                data-testid="input-create-name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                data-testid="input-create-email"
              />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="••••••••"
                data-testid="input-create-password"
              />
            </div>
            <div>
              <Label>Rol</Label>
              <Select
                value={createForm.role}
                onValueChange={(role) => setCreateForm({ ...createForm, role })}
              >
                <SelectTrigger data-testid="select-create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
                data-testid="button-save-create"
              >
                Crear Usuario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar usuario */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                data-testid="input-edit-email"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateUserMutation.isPending}
                data-testid="button-save-edit"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para historial de acciones */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Acciones - {selectedUser?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Todas las acciones realizadas por este usuario en el sistema
            </p>
          </DialogHeader>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay acciones registradas para este usuario
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4"
                  data-testid={`audit-log-${log.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          log.action === "created" ? "default" :
                          log.action === "updated" ? "secondary" :
                          "destructive"
                        }>
                          {log.action === "created" ? "Creado" :
                           log.action === "updated" ? "Actualizado" :
                           "Eliminado"}
                        </Badge>
                        <span className="text-sm font-semibold">{log.entityType}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("es-ES")}
                      </p>
                      {log.changes && (
                        <div className="mt-2 text-sm bg-muted p-2 rounded">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
