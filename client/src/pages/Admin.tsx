import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import { Plus, Edit, Trash2, Check, X, DollarSign, FileText, Download, Users, Eye, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import ReservationTimeline from "@/components/ReservationTimeline";
import DashboardAdmin from "@/components/DashboardAdmin";
import DeparturesManagement from "@/components/DeparturesManagement";
import { Reports } from "@/components/Reports";
import { Reconciliation } from "@/components/Reconciliation";
import { PaymentCalendar } from "@/components/PaymentCalendar";
import { EmailTemplates } from "@/components/EmailTemplates";
import ReminderConfig from "@/components/ReminderConfig";
import EmailCommunications from "@/components/EmailCommunications";
import AuditLog from "@/components/AuditLog";
import UserManagement from "@/components/UserManagement";
import SystemSettings from "@/components/SystemSettings";
import { DocumentVerification } from "@/components/DocumentVerification";
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
  const [activeSection, setActiveSection] = useState("dashboard");
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
  const [graceDaysBeforeCancellation, setGraceDaysBeforeCancellation] = useState("3");
  const [maxInstallmentsAllowed, setMaxInstallmentsAllowed] = useState("6");
  const [latePaymentSurcharge, setLatePaymentSurcharge] = useState("0");
  const [showInstallmentsDialog, setShowInstallmentsDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [installmentForm, setInstallmentForm] = useState({
    amount: "",
    dueDate: "",
    paymentLink: "",
    description: "",
  });
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentStatus, setDocumentStatus] = useState("");
  const [documentNotes, setDocumentNotes] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "",
    paymentReference: "",
    exchangeRate: "",
    paidAt: new Date().toISOString().split('T')[0],
  });

  // Filtros de reservas
  const [tourFilter, setTourFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: tours } = useQuery<any[]>({ queryKey: ["/api/tours"] });
  const { data: reservations } = useQuery<any[]>({ queryKey: ["/api/reservations"] });
  const { data: systemConfig } = useQuery<any[]>({ queryKey: ["/api/config"] });
  const { data: installments } = useQuery<any[]>({ 
    queryKey: ["/api/reservations", selectedReservation?.id, "installments"],
    enabled: !!selectedReservation,
  });
  const { data: allPassengers } = useQuery<any[]>({ queryKey: ["/api/passengers"] });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [isLoading, user, isAdmin, setLocation]);

  useEffect(() => {
    if (systemConfig) {
      const minDepositConfig = systemConfig.find((c: any) => c.key === "DEFAULT_MIN_DEPOSIT_PERCENTAGE");
      if (minDepositConfig) {
        setMinDepositPercentage(minDepositConfig.value);
      }
      
      const graceDaysConfig = systemConfig.find((c: any) => c.key === "GRACE_DAYS_BEFORE_CANCELLATION");
      if (graceDaysConfig) {
        setGraceDaysBeforeCancellation(graceDaysConfig.value);
      }
      
      const maxInstallmentsConfig = systemConfig.find((c: any) => c.key === "MAX_INSTALLMENTS_ALLOWED");
      if (maxInstallmentsConfig) {
        setMaxInstallmentsAllowed(maxInstallmentsConfig.value);
      }
      
      const latePaymentConfig = systemConfig.find((c: any) => c.key === "LATE_PAYMENT_SURCHARGE");
      if (latePaymentConfig) {
        setLatePaymentSurcharge(latePaymentConfig.value);
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
      // Guardar todas las configuraciones de pago
      await Promise.all([
        apiRequest("POST", "/api/config", {
          key: "DEFAULT_MIN_DEPOSIT_PERCENTAGE",
          value: minDepositPercentage,
          description: "Porcentaje mínimo de depósito inicial requerido para todas las reservas"
        }),
        apiRequest("POST", "/api/config", {
          key: "GRACE_DAYS_BEFORE_CANCELLATION",
          value: graceDaysBeforeCancellation,
          description: "Días de gracia después del vencimiento antes de cancelar automáticamente"
        }),
        apiRequest("POST", "/api/config", {
          key: "MAX_INSTALLMENTS_ALLOWED",
          value: maxInstallmentsAllowed,
          description: "Cantidad máxima de cuotas permitidas por reserva"
        }),
        apiRequest("POST", "/api/config", {
          key: "LATE_PAYMENT_SURCHARGE",
          value: latePaymentSurcharge,
          description: "Porcentaje de recargo aplicado a pagos tardíos"
        })
      ]);
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

  const handleOpenPaymentDialog = (installment: any) => {
    setSelectedInstallment(installment);
    setPaymentForm({
      paymentMethod: "",
      paymentReference: "",
      exchangeRate: "",
      paidAt: new Date().toISOString().split('T')[0],
    });
    setShowPaymentDialog(true);
  };

  const handleMarkInstallmentPaid = async () => {
    if (!selectedInstallment) return;
    
    try {
      await apiRequest("PUT", `/api/installments/${selectedInstallment.id}/pay`, {
        paymentMethod: paymentForm.paymentMethod || undefined,
        paymentReference: paymentForm.paymentReference || undefined,
        exchangeRate: paymentForm.exchangeRate ? parseFloat(paymentForm.exchangeRate) : undefined,
        paidAt: paymentForm.paidAt || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations", selectedReservation.id, "installments"] });
      setShowPaymentDialog(false);
      setSelectedInstallment(null);
      toast({ title: "Éxito", description: "Pago registrado exitosamente" });
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

  const handleViewDocument = (passenger: any) => {
    setSelectedPassenger(passenger);
    setDocumentStatus(passenger.documentStatus || "pending");
    setDocumentNotes(passenger.documentNotes || "");
    setShowDocumentModal(true);
  };

  const handleUpdateDocumentStatus = async (status: string, notes?: string) => {
    if (!selectedPassenger) return;
    
    try {
      await apiRequest("PUT", `/api/passengers/${selectedPassenger.id}/document-status`, {
        status,
        notes: notes || documentNotes,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/passengers"] });
      setShowDocumentModal(false);
      setSelectedPassenger(null);
      setDocumentNotes("");
      
      const statusLabel = status === "approved" ? "aprobado" : status === "rejected" ? "rechazado" : "marcado como pendiente";
      toast({ title: "Éxito", description: `Documento ${statusLabel} exitosamente` });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDocumentStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getDocumentStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      case "pending":
      default:
        return "Pendiente";
    }
  };

  // Filtrar reservas
  const filteredReservations = reservations?.filter((reservation: any) => {
    // Filtro por tour
    if (tourFilter !== "all" && reservation.tourId !== tourFilter) {
      return false;
    }

    // Filtro por estado
    if (statusFilter !== "all" && reservation.status !== statusFilter) {
      return false;
    }

    // Filtro por estado de pago
    if (paymentStatusFilter !== "all" && reservation.paymentStatus !== paymentStatusFilter) {
      return false;
    }

    // Filtro por búsqueda (nombre del comprador, email, o código de reserva)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = reservation.id.toLowerCase().includes(query);
      const matchesBuyerName = reservation.buyerName?.toLowerCase().includes(query);
      const matchesBuyerEmail = reservation.buyerEmail?.toLowerCase().includes(query);
      const matchesTourTitle = reservation.tourTitle?.toLowerCase().includes(query);

      if (!matchesId && !matchesBuyerName && !matchesBuyerEmail && !matchesTourTitle) {
        return false;
      }
    }

    return true;
  }) || [];

  const sidebarStyle = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-[#FAFBFC]">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {activeSection === "dashboard" && <DashboardAdmin />}

              {activeSection === "departures" && <DeparturesManagement />}

              {activeSection === "tours" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Gestión de Tours</h2>
                    <button
                      onClick={() => {
                        resetTourForm();
                        setShowTourDialog(true);
                      }}
                      className="bg-blue-600 text-white rounded-lg px-4 py-2.5 hover:bg-blue-700 transition-colors flex items-center gap-2"
                      data-testid="button-add-tour"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Tour
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours?.map((tour: any) => {
                      const reservedSeats = tour.reservedSeats || 0;
                      const availableSeats = tour.maxPassengers - reservedSeats;
                      const occupancyPercentage = Math.round((reservedSeats / tour.maxPassengers) * 100);
                      const tourImage = tour.images && tour.images.length > 0 ? tour.images[0] : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop';
                      
                      return (
                        <div
                          key={tour.id}
                          className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                          data-testid={`tour-item-${tour.id}`}
                        >
                          <div className="relative">
                            <img 
                              src={tourImage} 
                              alt={tour.title}
                              className="h-48 w-full object-cover"
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                              <button
                                onClick={() => handleEditTour(tour)}
                                className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white transition-colors shadow-sm"
                                data-testid={`button-edit-${tour.id}`}
                              >
                                <Edit className="h-4 w-4 text-gray-700" />
                              </button>
                              <button
                                onClick={() => handleDeleteTour(tour.id)}
                                className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white transition-colors shadow-sm"
                                data-testid={`button-delete-${tour.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-gray-700" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tour.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{tour.location}</p>
                            
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-medium text-gray-900">
                                ${tour.price}
                              </div>
                              <div className="text-sm font-medium text-gray-600">
                                {tour.duration}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                occupancyPercentage > 80 
                                  ? 'bg-red-100 text-red-700' 
                                  : occupancyPercentage > 50 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {availableSeats} cupos disponibles
                              </span>
                              <span className="text-xs text-gray-500">
                                {occupancyPercentage}% ocupado
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSection === "reservations" && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-semibold text-gray-900">Gestión de Reservas</h2>
                      <div className="text-sm text-gray-600">
                        Mostrando {filteredReservations.length} de {reservations?.length || 0} reservas
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</Label>
                          <Input
                            placeholder="Nombre, email, tour, código..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            data-testid="input-search-reservations"
                            className="rounded-lg"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Tour</Label>
                          <select
                            value={tourFilter}
                            onChange={(e) => setTourFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            data-testid="select-tour-filter"
                          >
                            <option value="all">Todos los tours</option>
                            {tours?.map((tour: any) => (
                              <option key={tour.id} value={tour.id}>
                                {tour.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Estado</Label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            data-testid="select-status-filter"
                          >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                            <option value="vencida">Vencida</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Estado de Pago</Label>
                          <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            data-testid="select-payment-status-filter"
                          >
                            <option value="all">Todos los pagos</option>
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="completed">Completado</option>
                            <option value="failed">Fallido</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {filteredReservations.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron reservas</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {searchQuery || tourFilter !== "all" || statusFilter !== "all" || paymentStatusFilter !== "all"
                            ? "Intenta ajustar los filtros de búsqueda"
                            : "Aún no hay reservas en el sistema"}
                        </p>
                        {(searchQuery || tourFilter !== "all" || statusFilter !== "all" || paymentStatusFilter !== "all") && (
                          <Button
                            onClick={() => {
                              setSearchQuery("");
                              setTourFilter("all");
                              setStatusFilter("all");
                              setPaymentStatusFilter("all");
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Limpiar filtros
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredReservations.map((reservation: any) => {
                      const departureDate = reservation.departureDate ? new Date(reservation.departureDate) : null;
                      const paymentDueDate = reservation.paymentDueDate ? new Date(reservation.paymentDueDate) : null;
                      const now = new Date();
                      const daysUntilDue = paymentDueDate ? Math.ceil((paymentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                      const isNearDue = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 7;
                      
                      const getStatusBadgeClass = (status: string) => {
                        switch (status) {
                          case "confirmed":
                            return "bg-green-100 text-green-700";
                          case "completed":
                            return "bg-blue-100 text-blue-700";
                          case "cancelled":
                          case "cancelada":
                          case "vencida":
                            return "bg-red-100 text-red-700";
                          case "pending":
                          case "approved":
                          default:
                            return "bg-yellow-100 text-yellow-700";
                        }
                      };

                      const getPaymentStatusBadgeClass = (status: string) => {
                        switch (status) {
                          case "completed":
                            return "bg-green-100 text-green-700";
                          case "failed":
                          case "refunded":
                            return "bg-red-100 text-red-700";
                          case "pending":
                          default:
                            return "bg-yellow-100 text-yellow-700";
                        }
                      };
                      
                      return (
                        <div
                          key={reservation.id}
                          className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-6"
                          data-testid={`reservation-item-${reservation.id}`}
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  Reserva #{reservation.id.slice(0, 8)}
                                </h3>
                                {reservation.tourTitle && (
                                  <p className="text-sm font-medium text-blue-600 mb-3">
                                    {reservation.tourTitle}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(reservation.status)}`}>
                                    {getStatusLabel(reservation.status)}
                                  </span>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(reservation.paymentStatus)}`}>
                                    Pago: {getPaymentStatusLabel(reservation.paymentStatus)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-gray-100 bg-gray-50 rounded-lg p-4">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Comprador</p>
                                <p className="text-sm font-semibold text-gray-900">{reservation.buyerName || 'No especificado'}</p>
                                {reservation.buyerEmail && (
                                  <p className="text-xs text-gray-600 mt-1">{reservation.buyerEmail}</p>
                                )}
                                {reservation.buyerPhone && (
                                  <p className="text-xs text-gray-600">{reservation.buyerPhone}</p>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Total</p>
                                  <p className="text-base font-semibold text-gray-900">${reservation.totalPrice}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Pasajeros</p>
                                  <p className="text-base font-semibold text-gray-900">{reservation.numberOfPassengers}</p>
                                </div>
                                {departureDate && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-600 mb-1">Fecha de salida</p>
                                    <p className="text-sm font-semibold text-gray-900">{departureDate.toLocaleDateString('es-ES')}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {paymentDueDate && reservation.paymentStatus === 'pending' && (
                              <div className={`p-3 rounded-lg ${isOverdue ? 'bg-red-50' : isNearDue ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                                <p className={`text-sm font-medium ${isOverdue ? 'text-red-900' : isNearDue ? 'text-yellow-900' : 'text-gray-900'}`}>
                                  Fecha límite de pago: {paymentDueDate.toLocaleDateString('es-ES')}
                                  {daysUntilDue !== null && (
                                    <span className="ml-2">
                                      {isOverdue ? `(${Math.abs(daysUntilDue)} días vencido)` : `(${daysUntilDue} días restantes)`}
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const token = localStorage.getItem('token');
                                  window.open(`/api/reservations/${reservation.id}/invoice`, '_blank');
                                }}
                                data-testid={`button-download-invoice-${reservation.id}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Factura
                              </Button>
                              {(reservation.status === "confirmed" || reservation.status === "completed") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const token = localStorage.getItem('token');
                                    window.open(`/api/reservations/${reservation.id}/itinerary`, '_blank');
                                  }}
                                  data-testid={`button-download-itinerary-${reservation.id}`}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Itinerario
                                </Button>
                              )}
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
                  )}
                </div>
              )}

              {activeSection === "payments" && (
            <Tabs defaultValue="reconciliation" className="space-y-4">
              <TabsList className="bg-white rounded-lg p-1 shadow-sm">
                <TabsTrigger 
                  value="reconciliation" 
                  data-testid="subtab-reconciliation"
                  className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Conciliación
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar" 
                  data-testid="subtab-calendar"
                  className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Calendario
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="reconciliation">
                <Reconciliation />
              </TabsContent>
              
              <TabsContent value="calendar">
                <PaymentCalendar />
              </TabsContent>
            </Tabs>
              )}

              {activeSection === "reports" && <Reports />}

              {activeSection === "templates" && (
            <Tabs defaultValue="email-templates" className="space-y-4">
              <TabsList>
                <TabsTrigger value="email-templates" data-testid="subtab-email-templates">Plantillas</TabsTrigger>
                <TabsTrigger value="reminders" data-testid="subtab-reminders">Recordatorios</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email-templates">
                <EmailTemplates />
              </TabsContent>
              
              <TabsContent value="reminders">
                <ReminderConfig />
              </TabsContent>
            </Tabs>
              )}

              {activeSection === "config" && (
            <Tabs defaultValue="payments" className="space-y-4">
              <TabsList>
                <TabsTrigger value="payments" data-testid="subtab-payments">Pagos</TabsTrigger>
                <TabsTrigger value="users" data-testid="subtab-users">Usuarios</TabsTrigger>
                <TabsTrigger value="system" data-testid="subtab-system">Sistema</TabsTrigger>
              </TabsList>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Pagos</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configura los parámetros globales del sistema de pagos y cuotas
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="min-deposit">Porcentaje Mínimo de Depósito Global (%)</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Porcentaje mínimo que los clientes deben pagar como depósito inicial
                        </p>
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
                      </div>
                      
                      <div className="border-t pt-6">
                        <Label htmlFor="grace-days">Días de Gracia Antes de Cancelar</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Días que el sistema esperará después del vencimiento antes de cancelar automáticamente
                        </p>
                        <div className="flex-1 max-w-xs">
                          <Input
                            id="grace-days"
                            type="number"
                            min="0"
                            max="30"
                            value={graceDaysBeforeCancellation}
                            onChange={(e) => setGraceDaysBeforeCancellation(e.target.value)}
                            data-testid="input-grace-days"
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-6">
                        <Label htmlFor="max-installments">Cantidad Máxima de Cuotas Permitidas</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Número máximo de cuotas que se pueden crear para una reserva
                        </p>
                        <div className="flex-1 max-w-xs">
                          <Input
                            id="max-installments"
                            type="number"
                            min="1"
                            max="12"
                            value={maxInstallmentsAllowed}
                            onChange={(e) => setMaxInstallmentsAllowed(e.target.value)}
                            data-testid="input-max-installments"
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-6">
                        <Label htmlFor="late-surcharge">Recargo por Pago Tardío (%)</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Porcentaje de recargo aplicado cuando un pago se realiza después de su fecha límite
                        </p>
                        <div className="flex-1 max-w-xs">
                          <Input
                            id="late-surcharge"
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={latePaymentSurcharge}
                            onChange={(e) => setLatePaymentSurcharge(e.target.value)}
                            data-testid="input-late-surcharge"
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-6 flex justify-end">
                        <Button onClick={handleSaveConfig} data-testid="button-save-config">
                          Guardar Todas las Configuraciones
                        </Button>
                      </div>
                      
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-2">Información Adicional</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                          <li>El porcentaje de depósito aplica por defecto a todos los tours nuevos</li>
                          <li>Puedes configurar excepciones individuales en la sección "Tours"</li>
                          <li>Los días de gracia se suman automáticamente a la fecha de vencimiento</li>
                          <li>El límite de cuotas previene la fragmentación excesiva de pagos</li>
                          <li>El recargo por pago tardío se calcula sobre el monto de la cuota vencida</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              <TabsContent value="system">
                <SystemSettings />
              </TabsContent>
            </Tabs>
              )}

              {activeSection === "passengers" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Todos los Pasajeros</h2>
                  </div>

                  {!allPassengers || allPassengers.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No hay pasajeros registrados</p>
                  ) : (
                    <div className="space-y-4">
                      {allPassengers.map((passenger: any) => (
                        <div
                          key={passenger.id}
                          className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-6"
                          data-testid={`row-passenger-${passenger.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Nombre Completo</p>
                                <p className="text-gray-900 font-semibold">{passenger.fullName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Pasaporte</p>
                                <p className="text-gray-900 font-mono text-sm">{passenger.passportNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Nacionalidad</p>
                                <p className="text-gray-900">{passenger.nationality}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Fecha de Nacimiento</p>
                                <p className="text-gray-900">{new Date(passenger.dateOfBirth).toLocaleDateString('es-ES')}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Reserva ID</p>
                                <p className="text-gray-900 font-mono text-sm">{passenger.reservationId}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Estado Documento</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDocumentStatusBadgeColor(passenger.documentStatus || 'pending')}`}>
                                  {getDocumentStatusLabel(passenger.documentStatus || 'pending')}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {passenger.passportImageUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDocument(passenger)}
                                  data-testid={`button-view-document-${passenger.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Documento
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "documents" && (
                <DocumentVerification />
              )}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={showTourDialog} onOpenChange={setShowTourDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingTour ? "Editar Tour" : "Crear Nuevo Tour"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Título</Label>
                <Input
                  value={tourForm.title}
                  onChange={(e) => setTourForm(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="input-tour-title"
                  className="rounded-lg border-gray-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Descripción</Label>
                <Textarea
                  value={tourForm.description}
                  onChange={(e) => setTourForm(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-tour-description"
                  className="rounded-lg border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Ubicación</Label>
                  <Input
                    value={tourForm.location}
                    onChange={(e) => setTourForm(prev => ({ ...prev, location: e.target.value }))}
                    data-testid="input-tour-location"
                    className="rounded-lg border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Precio</Label>
                  <Input
                    type="number"
                    value={tourForm.price}
                    onChange={(e) => setTourForm(prev => ({ ...prev, price: e.target.value }))}
                    data-testid="input-tour-price"
                    className="rounded-lg border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Duración</Label>
                  <Input
                    value={tourForm.duration}
                    onChange={(e) => setTourForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="ej: 3 días"
                    data-testid="input-tour-duration"
                    className="rounded-lg border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Máx. Pasajeros</Label>
                  <Input
                    type="number"
                    value={tourForm.maxPassengers}
                    onChange={(e) => setTourForm(prev => ({ ...prev, maxPassengers: e.target.value }))}
                    data-testid="input-tour-max-passengers"
                    className="rounded-lg border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">% Mínimo de Depósito (Opcional)</Label>
                <p className="text-sm text-gray-600 mb-2">
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
                  className="rounded-lg border-gray-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Imágenes (Ingresa URLs de imágenes)</Label>
                <Input
                  placeholder="Pega la URL de la imagen y presiona Enter"
                  onKeyDown={handleImageUrlAdd}
                  data-testid="input-tour-image-url"
                  className="rounded-lg border-gray-300 focus:border-blue-500"
                />
                {tourForm.images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
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
                <Button variant="outline" onClick={() => setShowTourDialog(false)} className="rounded-lg">
                  Cancelar
                </Button>
                <Button onClick={handleSaveTour} data-testid="button-save-tour" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  {editingTour ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showInstallmentsDialog} onOpenChange={setShowInstallmentsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                Gestión de Reserva
                {selectedReservation && (
                  <p className="text-sm text-gray-600 font-normal mt-1">
                    Reserva #{selectedReservation.id.slice(0, 8)} - Total: ${selectedReservation.totalPrice}
                  </p>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="installments" className="mt-4">
              <TabsList className="grid w-full grid-cols-4 bg-white rounded-lg p-1 shadow-sm">
                <TabsTrigger 
                  value="installments" 
                  data-testid="tab-installments"
                  className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Cuotas
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  data-testid="tab-timeline"
                  className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Timeline
                </TabsTrigger>
                <TabsTrigger 
                  value="communications" 
                  data-testid="tab-communications"
                  className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Comunicaciones
                </TabsTrigger>
                <TabsTrigger 
                  value="audit" 
                  data-testid="tab-audit"
                  className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Auditoría
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="installments" className="space-y-6">
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
                              onClick={() => handleOpenPaymentDialog(installment)}
                              data-testid={`button-mark-paid-${installment.id}`}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Registrar Pago
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
                      <Label className="text-sm font-medium text-gray-700">Monto</Label>
                      <Input
                        type="number"
                        value={installmentForm.amount}
                        onChange={(e) => setInstallmentForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        data-testid="input-installment-amount"
                        className="rounded-lg border-gray-300 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Fecha de Vencimiento</Label>
                      <Input
                        type="date"
                        value={installmentForm.dueDate}
                        onChange={(e) => setInstallmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        data-testid="input-installment-due-date"
                        className="rounded-lg border-gray-300 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Enlace de Pago (Mercado Pago, PayPal, etc.)</Label>
                    <Input
                      value={installmentForm.paymentLink}
                      onChange={(e) => setInstallmentForm(prev => ({ ...prev, paymentLink: e.target.value }))}
                      placeholder="https://..."
                      data-testid="input-installment-payment-link"
                      className="rounded-lg border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Descripción (Opcional)</Label>
                    <Input
                      value={installmentForm.description}
                      onChange={(e) => setInstallmentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="ej: Depósito inicial, Segundo pago, etc."
                      data-testid="input-installment-description"
                      className="rounded-lg border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleAddInstallment}
                      data-testid="button-add-installment"
                      disabled={!installmentForm.amount || !installmentForm.dueDate}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Cuota
                    </Button>
                  </div>
                </div>
              </div>

              </TabsContent>
              
              <TabsContent value="timeline">
                {selectedReservation && (
                  <ReservationTimeline reservationId={selectedReservation.id} />
                )}
              </TabsContent>
              
              <TabsContent value="communications">
                {selectedReservation && (
                  <EmailCommunications reservationId={selectedReservation.id} />
                )}
              </TabsContent>

              <TabsContent value="audit">
                {selectedReservation && (
                  <AuditLog reservationId={selectedReservation.id} />
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verificación de Documento - {selectedPassenger?.fullName}</DialogTitle>
            </DialogHeader>
            {selectedPassenger && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pasaporte:</span>
                    <span className="ml-2 font-mono font-medium">{selectedPassenger.passportNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nacionalidad:</span>
                    <span className="ml-2">{selectedPassenger.nationality}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha de Nacimiento:</span>
                    <span className="ml-2">{new Date(selectedPassenger.dateOfBirth).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reserva:</span>
                    <span className="ml-2 font-mono">{selectedPassenger.reservationId}</span>
                  </div>
                </div>

                {selectedPassenger.passportImageUrl && (
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <img
                      src={selectedPassenger.passportImageUrl}
                      alt={`Pasaporte de ${selectedPassenger.fullName}`}
                      className="w-full h-auto max-h-[50vh] object-contain"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Estado del Documento</Label>
                    <div className="mt-2">
                      <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${getDocumentStatusBadgeColor(selectedPassenger.documentStatus || 'pending')}`}>
                        {getDocumentStatusLabel(selectedPassenger.documentStatus || 'pending')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="document-notes" className="text-sm font-medium">Notas / Razón de Rechazo</Label>
                    <Textarea
                      id="document-notes"
                      value={documentNotes}
                      onChange={(e) => setDocumentNotes(e.target.value)}
                      placeholder="Ej: La foto está borrosa, no se pueden leer los datos claramente..."
                      rows={3}
                      data-testid="input-document-notes"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDocumentModal(false)}
                      data-testid="button-cancel-document-verification"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    {selectedPassenger.documentStatus !== "approved" && (
                      <Button
                        variant="outline"
                        className="border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handleUpdateDocumentStatus("approved")}
                        data-testid="button-approve-document"
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Aprobar Documento
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateDocumentStatus("rejected", documentNotes)}
                      disabled={!documentNotes.trim()}
                      data-testid="button-reject-document"
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Rechazar y Solicitar Corrección
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Pago Offline</DialogTitle>
            </DialogHeader>
            {selectedInstallment && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto de la cuota:</span>
                    <span className="font-bold text-lg">${selectedInstallment.amountDue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vencimiento:</span>
                    <span>{new Date(selectedInstallment.dueDate).toLocaleDateString('es-ES')}</span>
                  </div>
                  {selectedInstallment.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descripción:</span>
                      <span>{selectedInstallment.description}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payment-method" className="text-sm font-medium text-gray-700">Método de Pago</Label>
                    <select
                      id="payment-method"
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="flex h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      data-testid="select-payment-method"
                    >
                      <option value="">Seleccionar método...</option>
                      <option value="transfer">Transferencia Bancaria</option>
                      <option value="cash">Efectivo</option>
                      <option value="check">Cheque</option>
                      <option value="wire">Wire Transfer</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="payment-reference" className="text-sm font-medium text-gray-700">Referencia / # Transacción (Opcional)</Label>
                    <Input
                      id="payment-reference"
                      value={paymentForm.paymentReference}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                      placeholder="Ej: REF-12345, #OP789"
                      data-testid="input-payment-reference"
                      className="rounded-lg border-gray-300 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="exchange-rate" className="text-sm font-medium text-gray-700">Tipo de Cambio (Opcional)</Label>
                    <Input
                      id="exchange-rate"
                      type="number"
                      step="0.01"
                      value={paymentForm.exchangeRate}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, exchangeRate: e.target.value }))}
                      placeholder="Ej: 20.50"
                      data-testid="input-exchange-rate"
                      className="rounded-lg border-gray-300 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-600 mt-1">Si el pago se realizó en otra moneda</p>
                  </div>

                  <div>
                    <Label htmlFor="paid-at" className="text-sm font-medium text-gray-700">Fecha de Pago</Label>
                    <Input
                      id="paid-at"
                      type="date"
                      value={paymentForm.paidAt}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paidAt: e.target.value }))}
                      data-testid="input-paid-at"
                      className="rounded-lg border-gray-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Nota:</strong> El comprobante de pago (imagen/PDF) puede ser subido mediante la integración de object storage si está configurada.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentDialog(false)}
                    data-testid="button-cancel-payment"
                    className="rounded-lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleMarkInstallmentPaid}
                    data-testid="button-confirm-payment"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Pago
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </SidebarProvider>
  );
}
