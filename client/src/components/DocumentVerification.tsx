import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, ThumbsUp, ThumbsDown, X, Search, FileCheck, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function DocumentVerification() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [documentNotes, setDocumentNotes] = useState("");

  const { data: allPassengers } = useQuery<any[]>({ queryKey: ["/api/passengers"] });
  const { data: reservations } = useQuery<any[]>({ queryKey: ["/api/reservations"] });
  const { data: tours } = useQuery<any[]>({ queryKey: ["/api/tours"] });

  // Get reservation and tour info for each passenger
  const passengersWithDetails = useMemo(() => {
    if (!allPassengers || !reservations || !tours) return [];
    
    return allPassengers.map(passenger => {
      const reservation = reservations.find(r => r.id === passenger.reservationId);
      const tour = tours.find(t => t.id === reservation?.tourId);
      return {
        ...passenger,
        reservationCode: reservation?.code || '',
        tourName: tour?.title || '',
      };
    });
  }, [allPassengers, reservations, tours]);

  // Filter passengers with documents
  const passengersWithDocuments = useMemo(() => {
    return passengersWithDetails.filter(p => p.passportImageUrl);
  }, [passengersWithDetails]);

  // Apply filters and search
  const filteredPassengers = useMemo(() => {
    let filtered = passengersWithDocuments;

    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter(p => (p.documentStatus || 'pending') === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.fullName.toLowerCase().includes(search) ||
        p.passportNumber.toLowerCase().includes(search) ||
        p.reservationCode.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [passengersWithDocuments, activeTab, searchTerm]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: passengersWithDocuments.length,
      pending: passengersWithDocuments.filter(p => (p.documentStatus || 'pending') === 'pending').length,
      approved: passengersWithDocuments.filter(p => p.documentStatus === 'approved').length,
      rejected: passengersWithDocuments.filter(p => p.documentStatus === 'rejected').length,
    };
  }, [passengersWithDocuments]);

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ passengerId, status, notes }: { passengerId: string; status: string; notes?: string }) => {
      const res = await apiRequest("PUT", `/api/passengers/${passengerId}/document-status`, {
        status,
        notes,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/passengers"] });
      setShowDocumentModal(false);
      setSelectedPassenger(null);
      setDocumentNotes("");
      
      const statusLabel = variables.status === "approved" ? "aprobado" : variables.status === "rejected" ? "rechazado" : "marcado como pendiente";
      toast({ 
        title: "Éxito", 
        description: `Documento ${statusLabel} exitosamente${variables.status === 'rejected' ? '. Se ha enviado un email al cliente.' : ''}` 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewDocument = (passenger: any) => {
    setSelectedPassenger(passenger);
    setDocumentNotes(passenger.documentNotes || "");
    setShowDocumentModal(true);
  };

  const handleQuickApprove = (passenger: any) => {
    updateDocumentMutation.mutate({
      passengerId: passenger.id,
      status: "approved",
    });
  };

  const handleQuickReject = (passenger: any) => {
    setSelectedPassenger(passenger);
    setDocumentNotes(passenger.documentNotes || "");
    setShowDocumentModal(true);
    // Auto-focus will be on reject since modal opened
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedPassenger) return;
    
    if (status === "rejected" && !documentNotes.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para rechazar el documento",
        variant: "destructive",
      });
      return;
    }

    updateDocumentMutation.mutate({
      passengerId: selectedPassenger.id,
      status,
      notes: documentNotes,
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
    }
  };

  const getStatusLabel = (status: string) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Verificación de Documentos</h2>
        <p className="text-sm text-muted-foreground mt-1">Revisa y aprueba los documentos de pasaporte de los pasajeros</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, pasaporte o reserva..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-documents"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCheck className="h-4 w-4" />
          <span>{filteredPassengers.length} documento{filteredPassengers.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-document-status">
          <TabsTrigger value="all" data-testid="tab-all">
            Todos
            <Badge variant="secondary" className="ml-2">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes
            {statusCounts.pending > 0 && (
              <Badge variant="destructive" className="ml-2">{statusCounts.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprobados
            <Badge variant="secondary" className="ml-2">{statusCounts.approved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazados
            <Badge variant="secondary" className="ml-2">{statusCounts.rejected}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredPassengers.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "No se encontraron documentos" : "No hay documentos para revisar"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : activeTab === "pending"
                  ? "No hay documentos pendientes de revisión"
                  : activeTab === "approved"
                  ? "No hay documentos aprobados"
                  : activeTab === "rejected"
                  ? "No hay documentos rechazados"
                  : "Los documentos aparecerán aquí cuando los pasajeros los suban"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPassengers.map((passenger) => (
                <Card
                  key={passenger.id}
                  className="bg-card hover:shadow-md transition-all overflow-hidden"
                  data-testid={`card-document-${passenger.id}`}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={passenger.passportImageUrl}
                      alt={`Pasaporte de ${passenger.fullName}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleViewDocument(passenger)}
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(passenger.documentStatus || 'pending')}`}>
                        {getStatusLabel(passenger.documentStatus || 'pending')}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">{passenger.fullName}</h3>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p>Pasaporte: <span className="font-mono">{passenger.passportNumber}</span></p>
                        <p>Reserva: <span className="font-mono">{passenger.reservationCode}</span></p>
                        {passenger.tourName && <p>Tour: {passenger.tourName}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewDocument(passenger)}
                        data-testid={`button-view-${passenger.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {passenger.documentStatus !== "approved" && (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleQuickApprove(passenger)}
                          disabled={updateDocumentMutation.isPending}
                          data-testid={`button-approve-${passenger.id}`}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                      )}
                      {passenger.documentStatus !== "rejected" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleQuickReject(passenger)}
                          disabled={updateDocumentMutation.isPending}
                          data-testid={`button-reject-${passenger.id}`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de verificación */}
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
                  <span className="ml-2 font-mono">{selectedPassenger.reservationCode}</span>
                </div>
                {selectedPassenger.tourName && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Tour:</span>
                    <span className="ml-2 font-medium">{selectedPassenger.tourName}</span>
                  </div>
                )}
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
                    <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${getStatusBadgeColor(selectedPassenger.documentStatus || 'pending')}`}>
                      {getStatusLabel(selectedPassenger.documentStatus || 'pending')}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="document-notes" className="text-sm font-medium">
                    Notas / Razón de Rechazo {selectedPassenger.documentStatus === 'pending' && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    id="document-notes"
                    value={documentNotes}
                    onChange={(e) => setDocumentNotes(e.target.value)}
                    placeholder="Ej: La foto está borrosa, no se pueden leer los datos claramente..."
                    rows={3}
                    data-testid="input-document-notes"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    * Requerido al rechazar un documento. Opcional para aprobación.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDocumentModal(false);
                      setDocumentNotes("");
                    }}
                    data-testid="button-cancel-verification"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  {selectedPassenger.documentStatus !== "approved" && (
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={updateDocumentMutation.isPending}
                      data-testid="button-approve-document"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Aprobar Documento
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={!documentNotes.trim() || updateDocumentMutation.isPending}
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
    </div>
  );
}
