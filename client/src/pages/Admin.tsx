import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showTourDialog, setShowTourDialog] = useState(false);
  const [editingTour, setEditingTour] = useState<any>(null);
  const [tourForm, setTourForm] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    duration: "",
    maxPassengers: "",
    images: [] as string[],
  });

  const { data: tours } = useQuery<any[]>({ queryKey: ["/api/tours"] });
  const { data: reservations } = useQuery<any[]>({ queryKey: ["/api/reservations"] });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [isLoading, user, isAdmin, setLocation]);

  if (isLoading || (!user || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{isLoading ? "Cargando..." : "Redirigiendo..."}</p>
      </div>
    );
  }

  const handleImageUrlAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.currentTarget;
      const url = input.value.trim();
      if (url) {
        setTourForm(prev => ({
          ...prev,
          images: [...prev.images, url],
        }));
        input.value = "";
        toast({
          title: "Éxito",
          description: "URL de imagen agregada exitosamente",
        });
      }
    }
  };

  const handleSaveTour = async () => {
    try {
      const tourData = {
        ...tourForm,
        price: parseFloat(tourForm.price),
        maxPassengers: parseInt(tourForm.maxPassengers),
      };

      if (editingTour) {
        await apiRequest("PUT", `/api/tours/${editingTour.id}`, tourData);
        toast({ title: "Éxito", description: "Tour actualizado exitosamente" });
      } else {
        await apiRequest("POST", "/api/tours", tourData);
        toast({ title: "Éxito", description: "Tour creado exitosamente" });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      setShowTourDialog(false);
      resetTourForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este tour?")) return;
    try {
      await apiRequest("DELETE", `/api/tours/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      toast({ title: "Éxito", description: "Tour eliminado exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetTourForm = () => {
    setTourForm({
      title: "",
      description: "",
      location: "",
      price: "",
      duration: "",
      maxPassengers: "",
      images: [],
    });
    setEditingTour(null);
  };

  const handleEditTour = (tour: any) => {
    setEditingTour(tour);
    setTourForm({
      title: tour.title,
      description: tour.description,
      location: tour.location,
      price: tour.price,
      duration: tour.duration,
      maxPassengers: tour.maxPassengers.toString(),
      images: tour.images || [],
    });
    setShowTourDialog(true);
  };

  const handleConfirmPayment = async (reservationId: string) => {
    try {
      await apiRequest("PUT", `/api/reservations/${reservationId}/status`, {
        status: "confirmed",
        paymentStatus: "completed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Éxito",
        description: "Pago confirmado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateReservationStatus = async (
    reservationId: string,
    status: string
  ) => {
    try {
      await apiRequest("PUT", `/api/reservations/${reservationId}/status`, {
        status,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Éxito",
        description: `Estado de reserva actualizado a ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "approved":
        return "Aprobada";
      case "confirmed":
        return "Confirmada";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      case "cancelada":
        return "Cancelada";
      case "vencida":
        return "Vencida";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "completed":
        return "Completado";
      case "failed":
        return "Fallido";
      case "refunded":
        return "Reembolsado";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Panel de Administración</h1>

        <Tabs defaultValue="tours" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tours">Tours</TabsTrigger>
            <TabsTrigger value="reservations">Reservas</TabsTrigger>
          </TabsList>

          <TabsContent value="tours">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de Tours</CardTitle>
                <Button
                  onClick={() => {
                    resetTourForm();
                    setShowTourDialog(true);
                  }}
                  data-testid="button-add-tour"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Tour
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tours?.map((tour: any) => {
                    const reservedSeats = tour.reservedSeats || 0;
                    const availableSeats = tour.maxPassengers - reservedSeats;
                    const occupancyPercentage = Math.round((reservedSeats / tour.maxPassengers) * 100);
                    
                    return (
                      <div
                        key={tour.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`tour-item-${tour.id}`}
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{tour.title}</h3>
                          <p className="text-sm text-muted-foreground">{tour.location}</p>
                          <p className="text-sm">${tour.price} - {tour.duration}</p>
                          <div className="mt-2 flex items-center gap-4">
                            <span className="text-sm">
                              <span className="font-medium">Cupos:</span> {availableSeats} disponibles / {tour.maxPassengers} totales
                            </span>
                            <span className={`text-sm font-medium ${occupancyPercentage > 80 ? 'text-red-600' : occupancyPercentage > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {occupancyPercentage}% ocupado
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditTour(tour)}
                            data-testid={`button-edit-${tour.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteTour(tour.id)}
                            data-testid={`button-delete-${tour.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations?.map((reservation: any) => {
                    const departureDate = reservation.departureDate ? new Date(reservation.departureDate) : null;
                    const paymentDueDate = reservation.paymentDueDate ? new Date(reservation.paymentDueDate) : null;
                    const now = new Date();
                    const daysUntilDue = paymentDueDate ? Math.ceil((paymentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                    const isNearDue = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 7;
                    
                    return (
                      <div
                        key={reservation.id}
                        className="p-4 border rounded-lg"
                        data-testid={`reservation-item-${reservation.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">Reserva #{reservation.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              Estado: <span className={`font-medium ${reservation.status === 'vencida' || reservation.status === 'cancelada' ? 'text-red-600' : ''}`}>
                                {getStatusLabel(reservation.status)}
                              </span> | Pago: {getPaymentStatusLabel(reservation.paymentStatus)}
                            </p>
                            <p className="text-sm">Total: ${reservation.totalPrice} | Pasajeros: {reservation.numberOfPassengers}</p>
                            {departureDate && (
                              <p className="text-sm">
                                <span className="font-medium">Salida:</span> {departureDate.toLocaleDateString('es-ES')}
                              </p>
                            )}
                            {paymentDueDate && reservation.paymentStatus === 'pending' && (
                              <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : isNearDue ? 'text-yellow-600 font-medium' : ''}`}>
                                <span className="font-medium">Fecha límite de pago:</span> {paymentDueDate.toLocaleDateString('es-ES')}
                                {daysUntilDue !== null && (
                                  <span className="ml-2">
                                    {isOverdue ? `(${Math.abs(daysUntilDue)} días vencido)` : `(${daysUntilDue} días restantes)`}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          {reservation.paymentStatus === "pending" && 
                           reservation.status !== "vencida" && 
                           reservation.status !== "cancelada" && 
                           reservation.status !== "cancelled" && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmPayment(reservation.id)}
                              data-testid={`button-confirm-payment-${reservation.id}`}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Confirmar Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showTourDialog} onOpenChange={setShowTourDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTour ? "Editar Tour" : "Crear Nuevo Tour"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={tourForm.title}
                  onChange={(e) => setTourForm(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="input-tour-title"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={tourForm.description}
                  onChange={(e) => setTourForm(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-tour-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ubicación</Label>
                  <Input
                    value={tourForm.location}
                    onChange={(e) => setTourForm(prev => ({ ...prev, location: e.target.value }))}
                    data-testid="input-tour-location"
                  />
                </div>
                <div>
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    value={tourForm.price}
                    onChange={(e) => setTourForm(prev => ({ ...prev, price: e.target.value }))}
                    data-testid="input-tour-price"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duración</Label>
                  <Input
                    value={tourForm.duration}
                    onChange={(e) => setTourForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="ej: 3 días"
                    data-testid="input-tour-duration"
                  />
                </div>
                <div>
                  <Label>Máx. Pasajeros</Label>
                  <Input
                    type="number"
                    value={tourForm.maxPassengers}
                    onChange={(e) => setTourForm(prev => ({ ...prev, maxPassengers: e.target.value }))}
                    data-testid="input-tour-max-passengers"
                  />
                </div>
              </div>
              <div>
                <Label>Imágenes (Ingresa URLs de imágenes)</Label>
                <Input
                  placeholder="Pega la URL de la imagen y presiona Enter"
                  onKeyDown={handleImageUrlAdd}
                  data-testid="input-tour-image-url"
                />
                {tourForm.images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      {tourForm.images.length} imagen(es) agregada(s):
                    </p>
                    <div className="space-y-1">
                      {tourForm.images.map((img, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="flex-1 truncate">{img}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setTourForm(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx),
                              }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowTourDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTour} data-testid="button-save-tour">
                  {editingTour ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
