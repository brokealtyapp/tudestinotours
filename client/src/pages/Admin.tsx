import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Check, X, DollarSign } from "lucide-react";
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
    minDepositPercentage: "",
    images: [] as string[],
  });
  const [minDepositPercentage, setMinDepositPercentage] = useState("30");
  const [showInstallmentsDialog, setShowInstallmentsDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [installmentForm, setInstallmentForm] = useState({
    amount: "",
    dueDate: "",
    paymentLink: "",
    description: "",
  });

  const { data: tours } = useQuery<any[]>({ queryKey: ["/api/tours"] });
  const { data: reservations } = useQuery<any[]>({ queryKey: ["/api/reservations"] });
  const { data: systemConfig } = useQuery<any[]>({ queryKey: ["/api/config"] });
  const { data: installments } = useQuery<any[]>({ 
    queryKey: ["/api/reservations", selectedReservation?.id, "installments"],
    enabled: !!selectedReservation,
  });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [isLoading, user, isAdmin, setLocation]);

  useEffect(() => {
    if (systemConfig) {
      const config = systemConfig.find((c: any) => c.key === "DEFAULT_MIN_DEPOSIT_PERCENTAGE");
      if (config) {
        setMinDepositPercentage(config.value);
      }
    }
  }, [systemConfig]);

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
      const tourData: any = {
        ...tourForm,
        price: parseFloat(tourForm.price),
        maxPassengers: parseInt(tourForm.maxPassengers),
      };
      
      if (tourForm.minDepositPercentage) {
        tourData.minDepositPercentage = parseInt(tourForm.minDepositPercentage);
      }

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
      minDepositPercentage: "",
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
      minDepositPercentage: tour.minDepositPercentage ? tour.minDepositPercentage.toString() : "",
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

  const handleSaveConfig = async () => {
    try {
      await apiRequest("POST", "/api/config", {
        key: "DEFAULT_MIN_DEPOSIT_PERCENTAGE",
        value: minDepositPercentage,
        description: "Porcentaje mínimo de depósito inicial requerido para todas las reservas"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Éxito", description: "Configuración guardada exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManageInstallments = (reservation: any) => {
    setSelectedReservation(reservation);
    setShowInstallmentsDialog(true);
  };

  const handleAddInstallment = async () => {
    if (!selectedReservation) return;
    
    try {
      await apiRequest("POST", `/api/reservations/${selectedReservation.id}/installments`, {
        amount: parseFloat(installmentForm.amount),
        dueDate: installmentForm.dueDate,
        paymentLink: installmentForm.paymentLink,
        description: installmentForm.description,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/reservations", selectedReservation.id, "installments"] });
      setInstallmentForm({ amount: "", dueDate: "", paymentLink: "", description: "" });
      toast({ title: "Éxito", description: "Cuota agregada exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkInstallmentPaid = async (installmentId: string) => {
    try {
      await apiRequest("PUT", `/api/installments/${installmentId}/pay`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/reservations", selectedReservation.id, "installments"] });
      toast({ title: "Éxito", description: "Cuota marcada como pagada" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteInstallment = async (installmentId: string) => {
    try {
      await apiRequest("DELETE", `/api/installments/${installmentId}`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/reservations", selectedReservation.id, "installments"] });
      toast({ title: "Éxito", description: "Cuota eliminada exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
            <TabsTrigger value="config">Configuración</TabsTrigger>
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManageInstallments(reservation)}
                              data-testid={`button-manage-installments-${reservation.id}`}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Gestionar Pagos
                            </Button>
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
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="min-deposit">Porcentaje Mínimo de Depósito Global (%)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Este es el porcentaje mínimo que los clientes deben pagar como depósito inicial para cualquier reserva. Puedes configurar excepciones por tour individual.
                    </p>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 max-w-xs">
                        <Input
                          id="min-deposit"
                          type="number"
                          min="0"
                          max="100"
                          value={minDepositPercentage}
                          onChange={(e) => setMinDepositPercentage(e.target.value)}
                          data-testid="input-min-deposit-percentage"
                        />
                      </div>
                      <Button onClick={handleSaveConfig} data-testid="button-save-config">
                        Guardar Configuración
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-2">Información Adicional</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Este porcentaje aplica por defecto a todos los tours nuevos</li>
                      <li>Puedes configurar un porcentaje diferente para tours específicos en la sección "Tours"</li>
                      <li>Si un tour tiene un porcentaje configurado, ese valor anula el global</li>
                      <li>Los clientes deberán pagar al menos este porcentaje del total al hacer la reserva</li>
                    </ul>
                  </div>
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
                <Label>% Mínimo de Depósito (Opcional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Deja vacío para usar la configuración global. Ingresa un valor para anular el porcentaje global para este tour.
                </p>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={tourForm.minDepositPercentage}
                  onChange={(e) => setTourForm(prev => ({ ...prev, minDepositPercentage: e.target.value }))}
                  placeholder={`Por defecto: ${minDepositPercentage}%`}
                  data-testid="input-tour-min-deposit"
                />
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

        <Dialog open={showInstallmentsDialog} onOpenChange={setShowInstallmentsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Gestión de Cronograma de Pagos
                {selectedReservation && (
                  <p className="text-sm text-muted-foreground font-normal mt-1">
                    Reserva #{selectedReservation.id.slice(0, 8)} - Total: ${selectedReservation.totalPrice}
                  </p>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Cuotas de Pago Programadas</h3>
                {installments && installments.length > 0 ? (
                  <div className="space-y-2">
                    {installments.map((installment: any) => (
                      <div
                        key={installment.id}
                        className="p-3 border rounded-lg flex justify-between items-center"
                        data-testid={`installment-${installment.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">${installment.amount}</p>
                          <p className="text-sm text-muted-foreground">
                            Vence: {new Date(installment.dueDate).toLocaleDateString('es-ES')}
                          </p>
                          {installment.description && (
                            <p className="text-sm text-muted-foreground">{installment.description}</p>
                          )}
                          {installment.paymentLink && (
                            <a 
                              href={installment.paymentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Enlace de pago
                            </a>
                          )}
                          <p className="text-sm font-medium mt-1">
                            Estado: {installment.status === 'paid' ? 'Pagado' : installment.status === 'pending' ? 'Pendiente' : installment.status === 'overdue' ? 'Vencido' : installment.status}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {installment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkInstallmentPaid(installment.id)}
                              data-testid={`button-mark-paid-${installment.id}`}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Marcar Pagado
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteInstallment(installment.id)}
                            data-testid={`button-delete-installment-${installment.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay cuotas programadas para esta reserva.</p>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Agregar Nueva Cuota</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        value={installmentForm.amount}
                        onChange={(e) => setInstallmentForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        data-testid="input-installment-amount"
                      />
                    </div>
                    <div>
                      <Label>Fecha de Vencimiento</Label>
                      <Input
                        type="date"
                        value={installmentForm.dueDate}
                        onChange={(e) => setInstallmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        data-testid="input-installment-due-date"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Enlace de Pago (Mercado Pago, PayPal, etc.)</Label>
                    <Input
                      value={installmentForm.paymentLink}
                      onChange={(e) => setInstallmentForm(prev => ({ ...prev, paymentLink: e.target.value }))}
                      placeholder="https://..."
                      data-testid="input-installment-payment-link"
                    />
                  </div>
                  <div>
                    <Label>Descripción (Opcional)</Label>
                    <Input
                      value={installmentForm.description}
                      onChange={(e) => setInstallmentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="ej: Depósito inicial, Segundo pago, etc."
                      data-testid="input-installment-description"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleAddInstallment}
                      data-testid="button-add-installment"
                      disabled={!installmentForm.amount || !installmentForm.dueDate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Cuota
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
