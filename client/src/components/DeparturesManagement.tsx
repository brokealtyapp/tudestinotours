import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Copy, Calendar, Eye, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Departure {
  id: string;
  tourId: string;
  departureDate: Date;
  returnDate: Date | null;
  totalSeats: number;
  reservedSeats: number;
  price: string;
  supplements: any;
  cancellationPolicyOverride: string | null;
  paymentDeadlineDays: number;
  status: string;
}

interface Tour {
  id: string;
  title: string;
  location: string;
  price: string;
}

export default function DeparturesManagement() {
  const { toast } = useToast();
  const [showCreateEditDialog, setShowCreateEditDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const [duplicatingDeparture, setDuplicatingDeparture] = useState<Departure | null>(null);
  const [deletingDeparture, setDeletingDeparture] = useState<Departure | null>(null);
  const [viewingDeparture, setViewingDeparture] = useState<Departure | null>(null);
  
  // Filtros
  const [filterTourId, setFilterTourId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  // Ordenamiento
  const [sortBy, setSortBy] = useState<"date" | "occupation" | "price">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [departureForm, setDepartureForm] = useState({
    tourId: "",
    departureDate: "",
    returnDate: "",
    totalSeats: "",
    price: "",
    supplements: "",
    cancellationPolicyOverride: "",
    paymentDeadlineDays: "30",
    status: "active",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [duplicateDates, setDuplicateDates] = useState<string[]>([""]);

  const { data: tours } = useQuery<Tour[]>({ queryKey: ["/api/tours"] });
  const { data: allDepartures } = useQuery<Departure[]>({ 
    queryKey: ["/api/departures"],
  });

  // Funciones auxiliares
  const getTourName = (tourId: string) => {
    return tours?.find(t => t.id === tourId)?.title || "Tour no encontrado";
  };

  const getOccupationPercentage = (reserved: number, total: number) => {
    return total > 0 ? Math.round((reserved / total) * 100) : 0;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!departureForm.tourId) {
      errors.tourId = "El tour es obligatorio";
    }
    
    if (!departureForm.departureDate) {
      errors.departureDate = "La fecha de salida es obligatoria";
    } else if (new Date(departureForm.departureDate) < new Date()) {
      errors.departureDate = "La fecha de salida debe ser futura";
    }
    
    if (departureForm.returnDate && departureForm.departureDate) {
      if (new Date(departureForm.returnDate) < new Date(departureForm.departureDate)) {
        errors.returnDate = "La fecha de regreso debe ser posterior a la de salida";
      }
    }
    
    if (!departureForm.totalSeats || parseInt(departureForm.totalSeats) < 1) {
      errors.totalSeats = "Los cupos deben ser al menos 1";
    }
    
    if (!departureForm.price || parseFloat(departureForm.price) <= 0) {
      errors.price = "El precio debe ser mayor a 0";
    }
    
    if (!departureForm.paymentDeadlineDays || parseInt(departureForm.paymentDeadlineDays) < 1) {
      errors.paymentDeadlineDays = "El plazo debe ser al menos 1 día";
    }
    
    if (departureForm.supplements) {
      try {
        JSON.parse(departureForm.supplements);
      } catch {
        errors.supplements = "Debe ser un JSON válido";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Filtrado y ordenamiento
  const filteredAndSortedDepartures = allDepartures
    ?.filter(d => {
      // Filtro por tour
      if (filterTourId !== "all" && d.tourId !== filterTourId) return false;
      
      // Filtro por estado
      if (filterStatus !== "all" && d.status !== filterStatus) return false;
      
      // Filtro por búsqueda de texto
      if (searchQuery) {
        const tourName = getTourName(d.tourId).toLowerCase();
        const departureDate = format(new Date(d.departureDate), "dd/MM/yyyy");
        const searchLower = searchQuery.toLowerCase();
        
        if (!tourName.includes(searchLower) && !departureDate.includes(searchLower)) {
          return false;
        }
      }
      
      // Filtro por rango de fechas
      if (dateFrom) {
        const from = new Date(dateFrom);
        const departure = new Date(d.departureDate);
        if (departure < from) return false;
      }
      
      if (dateTo) {
        const to = new Date(dateTo);
        const departure = new Date(d.departureDate);
        if (departure > to) return false;
      }
      
      return true;
    })
    ?.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "date") {
        const dateA = new Date(a.departureDate).getTime();
        const dateB = new Date(b.departureDate).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === "occupation") {
        const occA = getOccupationPercentage(a.reservedSeats, a.totalSeats);
        const occB = getOccupationPercentage(b.reservedSeats, b.totalSeats);
        comparison = occA - occB;
      } else if (sortBy === "price") {
        comparison = parseFloat(a.price) - parseFloat(b.price);
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  
  const departures = filteredAndSortedDepartures;

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/departures", data),
    onSuccess: () => {
      toast({ title: "Éxito", description: "Salida creada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/departures"] });
      setShowCreateEditDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/departures/${id}`, data),
    onSuccess: () => {
      toast({ title: "Éxito", description: "Salida actualizada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/departures"] });
      setShowCreateEditDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/departures/${id}`),
    onSuccess: () => {
      toast({ title: "Éxito", description: "Salida eliminada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/departures"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, dates }: { id: string; dates: string[] }) =>
      apiRequest("POST", `/api/departures/${id}/duplicate`, { dates }),
    onSuccess: (response: any) => {
      toast({ 
        title: "Éxito", 
        description: response.message || "Salidas duplicadas exitosamente" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/departures"] });
      setShowDuplicateDialog(false);
      setDuplicateDates([""]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setDepartureForm({
      tourId: "",
      departureDate: "",
      returnDate: "",
      totalSeats: "",
      price: "",
      supplements: "",
      cancellationPolicyOverride: "",
      paymentDeadlineDays: "30",
      status: "active",
    });
    setEditingDeparture(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setShowCreateEditDialog(true);
  };

  const handleOpenEditDialog = (departure: Departure) => {
    setEditingDeparture(departure);
    setDepartureForm({
      tourId: departure.tourId,
      departureDate: format(new Date(departure.departureDate), "yyyy-MM-dd"),
      returnDate: departure.returnDate ? format(new Date(departure.returnDate), "yyyy-MM-dd") : "",
      totalSeats: departure.totalSeats.toString(),
      price: departure.price.toString(),
      supplements: departure.supplements ? JSON.stringify(departure.supplements, null, 2) : "",
      cancellationPolicyOverride: departure.cancellationPolicyOverride || "",
      paymentDeadlineDays: departure.paymentDeadlineDays.toString(),
      status: departure.status,
    });
    setShowCreateEditDialog(true);
  };

  const handleOpenDuplicateDialog = (departure: Departure) => {
    setDuplicatingDeparture(departure);
    setDuplicateDates([""]);
    setShowDuplicateDialog(true);
  };

  const handleSave = () => {
    const data: any = {
      tourId: departureForm.tourId,
      departureDate: new Date(departureForm.departureDate),
      totalSeats: parseInt(departureForm.totalSeats),
      price: departureForm.price,
      paymentDeadlineDays: parseInt(departureForm.paymentDeadlineDays),
      status: departureForm.status,
    };

    if (departureForm.returnDate) {
      data.returnDate = new Date(departureForm.returnDate);
    }

    if (departureForm.supplements) {
      try {
        data.supplements = JSON.parse(departureForm.supplements);
      } catch (e) {
        toast({
          title: "Error",
          description: "Suplementos debe ser un JSON válido",
          variant: "destructive",
        });
        return;
      }
    }

    if (departureForm.cancellationPolicyOverride) {
      data.cancellationPolicyOverride = departureForm.cancellationPolicyOverride;
    }

    if (editingDeparture) {
      updateMutation.mutate({ id: editingDeparture.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenDeleteDialog = (departure: Departure) => {
    setDeletingDeparture(departure);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deletingDeparture) {
      deleteMutation.mutate(deletingDeparture.id);
      setShowDeleteDialog(false);
      setDeletingDeparture(null);
    }
  };

  const handleOpenDetailsDialog = (departure: Departure) => {
    setViewingDeparture(departure);
    setShowDetailsDialog(true);
  };

  const handleDuplicate = () => {
    if (!duplicatingDeparture) return;
    
    const validDates = duplicateDates.filter(d => d.trim() !== "");
    if (validDates.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos una fecha",
        variant: "destructive",
      });
      return;
    }

    duplicateMutation.mutate({ id: duplicatingDeparture.id, dates: validDates });
  };

  const addDuplicateDate = () => {
    setDuplicateDates([...duplicateDates, ""]);
  };

  const removeDuplicateDate = (index: number) => {
    setDuplicateDates(duplicateDates.filter((_, i) => i !== index));
  };

  const updateDuplicateDate = (index: number, value: string) => {
    const newDates = [...duplicateDates];
    newDates[index] = value;
    setDuplicateDates(newDates);
  };

  const getOccupationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-orange-600";
    return "text-green-600";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activa";
      case "cancelled":
        return "Cancelada";
      case "completed":
        return "Completada";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <CardTitle>Gestión de Salidas</CardTitle>
        <Button onClick={handleOpenCreateDialog} data-testid="button-create-departure">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Salida
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filtros y Búsqueda</h3>
            <div className="text-sm text-gray-600">
              Mostrando {departures?.length || 0} de {allDepartures?.length || 0} salidas
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-gray-700">Buscar</Label>
              <Input
                placeholder="Tour, fecha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-700">Tour</Label>
              <Select value={filterTourId} onValueChange={setFilterTourId}>
                <SelectTrigger data-testid="select-filter-tour" className="mt-1">
                  <SelectValue placeholder="Todos los tours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tours</SelectItem>
                  {tours?.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-700">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="select-filter-status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-700">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger data-testid="select-sort-by" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="occupation">Ocupación</SelectItem>
                  <SelectItem value="price">Precio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-700">Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-700">Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
                className="mt-1"
              />
            </div>
          </div>

          {(searchQuery || filterTourId !== "all" || filterStatus !== "all" || dateFrom || dateTo) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterTourId("all");
                  setFilterStatus("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                data-testid="button-clear-filters"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tour</TableHead>
                <TableHead>Fecha Salida</TableHead>
                <TableHead>Fecha Regreso</TableHead>
                <TableHead>Cupos</TableHead>
                <TableHead>Ocupación</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departures && departures.length > 0 ? (
                departures.map((departure) => {
                  const occupationPercentage = getOccupationPercentage(
                    departure.reservedSeats,
                    departure.totalSeats
                  );
                  return (
                    <TableRow key={departure.id} data-testid={`row-departure-${departure.id}`}>
                      <TableCell className="font-medium">
                        {getTourName(departure.tourId)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(departure.departureDate), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {departure.returnDate
                          ? format(new Date(departure.returnDate), "dd/MM/yyyy", { locale: es })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {departure.reservedSeats} / {departure.totalSeats}
                            </span>
                            {occupationPercentage === 100 && (
                              <Badge variant="destructive" className="text-xs">
                                COMPLETO
                              </Badge>
                            )}
                          </div>
                          <Progress value={occupationPercentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${getOccupationColor(occupationPercentage)}`}>
                            {occupationPercentage}%
                          </span>
                          {occupationPercentage >= 90 && occupationPercentage < 100 && (
                            <Badge variant="outline" className="text-xs border-orange-600 text-orange-600">
                              CASI LLENO
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${parseFloat(departure.price).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(departure.status)}>
                          {getStatusLabel(departure.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDetailsDialog(departure)}
                            data-testid={`button-details-departure-${departure.id}`}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEditDialog(departure)}
                            data-testid={`button-edit-departure-${departure.id}`}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDuplicateDialog(departure)}
                            data-testid={`button-duplicate-departure-${departure.id}`}
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDeleteDialog(departure)}
                            data-testid={`button-delete-departure-${departure.id}`}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Calendar className="w-12 h-12 text-gray-400" />
                      {searchQuery || filterTourId !== "all" || filterStatus !== "all" || dateFrom || dateTo ? (
                        <>
                          <p className="text-lg font-medium text-gray-900">
                            No se encontraron salidas
                          </p>
                          <p className="text-sm text-gray-600">
                            Intenta ajustar los filtros para ver más resultados
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-medium text-gray-900">
                            No hay salidas programadas
                          </p>
                          <p className="text-sm text-gray-600">
                            Comienza creando la primera salida de un tour
                          </p>
                          <Button
                            onClick={handleOpenCreateDialog}
                            className="mt-2"
                            data-testid="button-create-first-departure"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Salida
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={showCreateEditDialog} onOpenChange={setShowCreateEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDeparture ? "Editar Salida" : "Nueva Salida"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tour *</Label>
              <Select
                value={departureForm.tourId}
                onValueChange={(value) =>
                  setDepartureForm({ ...departureForm, tourId: value })
                }
              >
                <SelectTrigger data-testid="input-tour">
                  <SelectValue placeholder="Seleccione un tour" />
                </SelectTrigger>
                <SelectContent>
                  {tours?.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha de Salida *</Label>
                <Input
                  type="date"
                  value={departureForm.departureDate}
                  onChange={(e) =>
                    setDepartureForm({ ...departureForm, departureDate: e.target.value })
                  }
                  data-testid="input-departure-date"
                />
              </div>
              <div>
                <Label>Fecha de Regreso</Label>
                <Input
                  type="date"
                  value={departureForm.returnDate}
                  onChange={(e) =>
                    setDepartureForm({ ...departureForm, returnDate: e.target.value })
                  }
                  data-testid="input-return-date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total de Cupos *</Label>
                <Input
                  type="number"
                  min="1"
                  value={departureForm.totalSeats}
                  onChange={(e) =>
                    setDepartureForm({ ...departureForm, totalSeats: e.target.value })
                  }
                  data-testid="input-total-seats"
                />
              </div>
              <div>
                <Label>Precio *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={departureForm.price}
                  onChange={(e) =>
                    setDepartureForm({ ...departureForm, price: e.target.value })
                  }
                  data-testid="input-price"
                />
              </div>
            </div>

            <div>
              <Label>Días de Plazo para Pago *</Label>
              <Input
                type="number"
                min="1"
                value={departureForm.paymentDeadlineDays}
                onChange={(e) =>
                  setDepartureForm({ ...departureForm, paymentDeadlineDays: e.target.value })
                }
                data-testid="input-payment-deadline"
              />
            </div>

            <div>
              <Label>Estado</Label>
              <Select
                value={departureForm.status}
                onValueChange={(value) =>
                  setDepartureForm({ ...departureForm, status: value })
                }
              >
                <SelectTrigger data-testid="input-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Suplementos (JSON opcional)</Label>
              <Textarea
                value={departureForm.supplements}
                onChange={(e) =>
                  setDepartureForm({ ...departureForm, supplements: e.target.value })
                }
                placeholder='{"early_bird": -100, "single_room": 200}'
                rows={3}
                data-testid="input-supplements"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ej: {`{"descuento_anticipado": -100, "habitacion_individual": 200}`}
              </p>
            </div>

            <div>
              <Label>Política de Cancelación (Override)</Label>
              <Textarea
                value={departureForm.cancellationPolicyOverride}
                onChange={(e) =>
                  setDepartureForm({
                    ...departureForm,
                    cancellationPolicyOverride: e.target.value,
                  })
                }
                placeholder="Política específica para esta salida..."
                rows={3}
                data-testid="input-cancellation-policy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateEditDialog(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-departure"
            >
              {editingDeparture ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Salida a Múltiples Fechas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Seleccione las fechas en las que desea crear copias de esta salida. Los cupos,
              precio y configuración se mantendrán igual.
            </p>
            {duplicateDates.map((date, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => updateDuplicateDate(index, e.target.value)}
                  data-testid={`input-duplicate-date-${index}`}
                  className="flex-1"
                />
                {duplicateDates.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDuplicateDate(index)}
                    data-testid={`button-remove-date-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addDuplicateDate}
              className="w-full"
              data-testid="button-add-date"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Fecha
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDuplicateDialog(false)}
              data-testid="button-cancel-duplicate"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={duplicateMutation.isPending}
              data-testid="button-confirm-duplicate"
            >
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Salida</DialogTitle>
          </DialogHeader>
          {viewingDeparture && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Tour</Label>
                  <p className="font-medium">{getTourName(viewingDeparture.tourId)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Estado</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(viewingDeparture.status)}>
                      {getStatusLabel(viewingDeparture.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Fecha de Salida</Label>
                  <p className="font-medium">
                    {format(new Date(viewingDeparture.departureDate), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Fecha de Regreso</Label>
                  <p className="font-medium">
                    {viewingDeparture.returnDate
                      ? format(new Date(viewingDeparture.returnDate), "dd/MM/yyyy", { locale: es })
                      : "No especificada"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Precio Base</Label>
                  <p className="text-2xl font-bold text-primary">
                    ${parseFloat(viewingDeparture.price).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Plazo de Pago</Label>
                  <p className="font-medium">{viewingDeparture.paymentDeadlineDays} días</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <Label className="text-sm font-medium">Ocupación</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Total Cupos</p>
                    <p className="text-2xl font-bold">{viewingDeparture.totalSeats}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Reservados</p>
                    <p className="text-2xl font-bold text-primary">{viewingDeparture.reservedSeats}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Disponibles</p>
                    <p className="text-2xl font-bold text-green-600">
                      {viewingDeparture.totalSeats - viewingDeparture.reservedSeats}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={getOccupationPercentage(viewingDeparture.reservedSeats, viewingDeparture.totalSeats)} 
                  className="h-3"
                />
                <div className="flex justify-center">
                  <span className={`font-bold text-lg ${getOccupationColor(getOccupationPercentage(viewingDeparture.reservedSeats, viewingDeparture.totalSeats))}`}>
                    {getOccupationPercentage(viewingDeparture.reservedSeats, viewingDeparture.totalSeats)}% Ocupación
                  </span>
                </div>
              </div>

              {viewingDeparture.supplements && Object.keys(viewingDeparture.supplements).length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Suplementos</Label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(viewingDeparture.supplements, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {viewingDeparture.cancellationPolicyOverride && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Política de Cancelación</Label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm">{viewingDeparture.cancellationPolicyOverride}</p>
                  </div>
                </div>
              )}

              {viewingDeparture.reservedSeats > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      window.location.hash = '#/admin?tab=reservas&departure=' + viewingDeparture.id;
                    }}
                    data-testid="button-view-reservations"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver {viewingDeparture.reservedSeats} Reserva{viewingDeparture.reservedSeats !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
              data-testid="button-close-details"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingDeparture && (
                <>
                  Está a punto de eliminar la salida del tour{" "}
                  <strong>{getTourName(deletingDeparture.tourId)}</strong> con fecha{" "}
                  <strong>
                    {format(new Date(deletingDeparture.departureDate), "dd/MM/yyyy", { locale: es })}
                  </strong>
                  . Esta acción no se puede deshacer.
                  {deletingDeparture.reservedSeats > 0 && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                      <p className="text-sm font-medium text-destructive">
                        ⚠️ Esta salida tiene {deletingDeparture.reservedSeats} cupo(s) reservado(s).
                        No podrá eliminarla si existen reservas activas.
                      </p>
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
