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
import { Plus, Edit, Trash2, Copy, Calendar } from "lucide-react";
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
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const [duplicatingDeparture, setDuplicatingDeparture] = useState<Departure | null>(null);
  const [filterTourId, setFilterTourId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
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

  const [duplicateDates, setDuplicateDates] = useState<string[]>([""]);

  const { data: tours } = useQuery<Tour[]>({ queryKey: ["/api/tours"] });
  const { data: allDepartures } = useQuery<Departure[]>({ 
    queryKey: ["/api/departures"],
  });

  const departures = allDepartures?.filter(d => {
    if (filterTourId !== "all" && d.tourId !== filterTourId) return false;
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    return true;
  });

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

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar esta salida? Esta acción no se puede deshacer.")) {
      deleteMutation.mutate(id);
    }
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

  const getTourName = (tourId: string) => {
    return tours?.find(t => t.id === tourId)?.title || "Tour no encontrado";
  };

  const getOccupationPercentage = (reserved: number, total: number) => {
    return total > 0 ? Math.round((reserved / total) * 100) : 0;
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
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label>Filtrar por Tour</Label>
            <Select value={filterTourId} onValueChange={setFilterTourId}>
              <SelectTrigger data-testid="select-filter-tour">
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
          <div className="flex-1 min-w-[200px]">
            <Label>Filtrar por Estado</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-testid="select-filter-status">
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
                          <div className="text-sm">
                            {departure.reservedSeats} / {departure.totalSeats}
                          </div>
                          <Progress value={occupationPercentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getOccupationColor(occupationPercentage)}`}>
                          {occupationPercentage}%
                        </span>
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
                            onClick={() => handleOpenEditDialog(departure)}
                            data-testid={`button-edit-departure-${departure.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDuplicateDialog(departure)}
                            data-testid={`button-duplicate-departure-${departure.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(departure.id)}
                            data-testid={`button-delete-departure-${departure.id}`}
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No hay salidas registradas
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
    </Card>
  );
}
