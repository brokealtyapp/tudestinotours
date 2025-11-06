import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, ExternalLink, MapPin, Calendar as CalendarIcon, Upload, X, Loader2, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import imageCompression from "browser-image-compression";

interface Tour {
  id: string;
  title: string;
  description: string;
  continent?: string | null;
  duration: string;
  images: string[];
  featured: boolean;
  rating: string | null;
  reviewCount: number | null;
  itinerary: { day: string; title: string; description: string }[] | null;
  includes: string[];
  excludes: string[];
  cancellationPolicy: string | null;
  requirements: string | null;
  faqs: any;
  createdAt: Date;
}

export default function ToursManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showCreateEditDialog, setShowCreateEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [deletingTour, setDeletingTour] = useState<Tour | null>(null);
  const [viewingTour, setViewingTour] = useState<Tour | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Ordenamiento
  const [sortBy, setSortBy] = useState<"title">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [tourForm, setTourForm] = useState<{
    title: string;
    description: string;
    continent: string | null;
    duration: string;
    images: string[];
    featured: boolean;
    itinerary: { day: string; title: string; description: string }[];
    includes: string[];
    excludes: string[];
    cancellationPolicy: string;
    requirements: string;
    faqs: { question: string; answer: string }[];
  }>({
    title: "",
    description: "",
    continent: null,
    duration: "",
    images: [],
    featured: false,
    itinerary: [],
    includes: [],
    excludes: [],
    cancellationPolicy: "",
    requirements: "",
    faqs: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: allTours } = useQuery<Tour[]>({ queryKey: ["/api/tours"] });
  const { data: configData } = useQuery<any[]>({ queryKey: ["/api/config"] });
  
  const continentsConfig = configData?.find(c => c.key === 'CONTINENTS_AND_CITIES');
  const continentsData: Record<string, string[]> = continentsConfig 
    ? JSON.parse(continentsConfig.value) 
    : {};
  
  const continents = Object.keys(continentsData).sort();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!tourForm.title.trim()) {
      errors.title = "El título es obligatorio";
    }
    
    if (!tourForm.description.trim()) {
      errors.description = "La descripción es obligatoria";
    }
    
    if (!tourForm.duration.trim()) {
      errors.duration = "La duración es obligatoria";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Filtrado y ordenamiento
  const filteredAndSortedTours = allTours
    ?.filter(t => {
      // Filtro por búsqueda de texto
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(searchLower);
        const descriptionMatch = t.description.toLowerCase().includes(searchLower);
        const continentMatch = t.continent?.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !descriptionMatch && !continentMatch) {
          return false;
        }
      }
      
      return true;
    })
    ?.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const tours = filteredAndSortedTours;

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/tours", data),
    onSuccess: () => {
      toast({ title: "Éxito", description: "Tour creado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
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
      apiRequest("PUT", `/api/tours/${id}`, data),
    onSuccess: () => {
      toast({ title: "Éxito", description: "Tour actualizado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
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
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tours/${id}`),
    onSuccess: () => {
      toast({ title: "Éxito", description: "Tour eliminado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
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
    setTourForm({
      title: "",
      description: "",
      continent: null,
      duration: "",
      images: [],
      featured: false,
      itinerary: [],
      includes: [],
      excludes: [],
      cancellationPolicy: "",
      requirements: "",
      faqs: [],
    });
    setFormErrors({});
    setEditingTour(null);
    setNewImageUrl("");
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setShowCreateEditDialog(true);
  };

  const handleOpenEditDialog = (tour: Tour) => {
    setEditingTour(tour);
    setTourForm({
      title: tour.title,
      description: tour.description,
      continent: tour.continent || "",
      duration: tour.duration,
      images: tour.images || [],
      featured: tour.featured || false,
      itinerary: tour.itinerary || [],
      includes: tour.includes || [],
      excludes: tour.excludes || [],
      cancellationPolicy: tour.cancellationPolicy || "",
      requirements: tour.requirements || "",
      faqs: tour.faqs || [],
    });
    setShowCreateEditDialog(true);
  };

  const handleOpenDeleteDialog = (tour: Tour) => {
    setDeletingTour(tour);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deletingTour) {
      deleteMutation.mutate(deletingTour.id);
      setShowDeleteDialog(false);
      setDeletingTour(null);
    }
  };

  const handleOpenDetailsDialog = (tour: Tour) => {
    setViewingTour(tour);
    setShowDetailsDialog(true);
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario",
        variant: "destructive",
      });
      return;
    }

    const data: any = {
      title: tourForm.title,
      description: tourForm.description,
      continent: tourForm.continent || null,
      duration: tourForm.duration,
      images: tourForm.images.filter(img => img && img.trim() !== ''),
      featured: tourForm.featured,
      itinerary: tourForm.itinerary.filter(day => day.title && day.description).length > 0 
        ? tourForm.itinerary.filter(day => day.title && day.description) 
        : null,
      includes: tourForm.includes.filter(item => item && item.trim() !== ''),
      excludes: tourForm.excludes.filter(item => item && item.trim() !== ''),
      cancellationPolicy: tourForm.cancellationPolicy || null,
      requirements: tourForm.requirements || null,
      faqs: tourForm.faqs.filter(faq => faq.question && faq.answer) || null,
    };

    if (editingTour) {
      updateMutation.mutate({ id: editingTour.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setTourForm(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()],
      }));
      setNewImageUrl("");
      toast({ title: "Éxito", description: "URL de imagen agregada" });
    }
  };

  const handleRemoveImage = (index: number) => {
    setTourForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos JPG, PNG o WEBP",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(0);

      // Paso 1: Comprimir imagen en el navegador
      const options = {
        maxSizeMB: 2, // Tamaño máximo 2MB
        maxWidthOrHeight: 1920, // Máximo 1920px de ancho/alto
        useWebWorker: true,
        fileType: file.type,
      };

      let compressedFile = file;
      
      // Solo comprimir si es mayor a 1MB
      if (file.size > 1024 * 1024) {
        toast({
          title: "Optimizando imagen...",
          description: "Comprimiendo para mejorar el rendimiento",
        });
        
        compressedFile = await imageCompression(file, options);
      }

      setUploadProgress(20);

      // Paso 2: Obtener URL de subida
      const response = await apiRequest("POST", "/api/tours/upload-url", {
        filename: file.name,
      });
      const { uploadURL, imagePath } = await response.json() as { 
        uploadURL: string; 
        imagePath: string; 
      };

      setUploadProgress(40);

      // Paso 3: Subir archivo comprimido a Object Storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": compressedFile.type,
        },
        body: compressedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir la imagen");
      }

      setUploadProgress(90);

      // Paso 4: Agregar ruta de imagen a la lista
      setTourForm(prev => ({
        ...prev,
        images: [...prev.images, imagePath],
      }));

      setUploadProgress(100);

      toast({
        title: "Éxito",
        description: "Imagen subida y optimizada correctamente",
      });

      // Resetear input
      event.target.value = "";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <CardTitle>Gestión de Tours</CardTitle>
        <Button onClick={handleOpenCreateDialog} data-testid="button-create-tour">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tour
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filtros y Búsqueda</h3>
            <div className="text-sm text-gray-600">
              Mostrando {tours?.length || 0} de {allTours?.length || 0} tours
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-gray-700">Buscar</Label>
              <Input
                placeholder="Título, continente, descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-700">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger data-testid="select-sort-by" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Título</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-700">Orden</Label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger data-testid="select-sort-order" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente</SelectItem>
                  <SelectItem value="desc">Descendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {searchQuery && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                }}
                data-testid="button-clear-filters"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours && tours.length > 0 ? (
            tours.map((tour) => {
              const tourImage = tour.images && tour.images.length > 0 
                ? tour.images[0] 
                : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop';
              
              return (
                <div
                  key={tour.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                  data-testid={`tour-card-${tour.id}`}
                >
                  <div className="relative">
                    <img 
                      src={tourImage} 
                      alt={tour.title}
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-white/90 backdrop-blur-sm hover:bg-white"
                        onClick={() => handleOpenDetailsDialog(tour)}
                        data-testid={`button-details-${tour.id}`}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4 text-gray-700" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-white/90 backdrop-blur-sm hover:bg-white"
                        onClick={() => handleOpenEditDialog(tour)}
                        data-testid={`button-edit-${tour.id}`}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-gray-700" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-white/90 backdrop-blur-sm hover:bg-white"
                        onClick={() => handleOpenDeleteDialog(tour)}
                        data-testid={`button-delete-${tour.id}`}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    {tour.featured && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="default" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          DESTACADO
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{tour.title}</h3>
                    
                    <div className="space-y-2">
                      {tour.continent && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          {tour.continent}
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {tour.duration}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {tour.description}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <MapPin className="w-16 h-16 text-gray-400 mb-4" />
              {searchQuery ? (
                <>
                  <p className="text-lg font-medium text-gray-900">
                    No se encontraron tours
                  </p>
                  <p className="text-sm text-gray-600">
                    Intenta ajustar los filtros para ver más resultados
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-900">
                    No hay tours registrados
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Comienza creando el primer tour
                  </p>
                  <Button
                    onClick={handleOpenCreateDialog}
                    data-testid="button-create-first-tour"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Tour
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={showCreateEditDialog} onOpenChange={setShowCreateEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTour ? "Editar Tour" : "Nuevo Tour"}
            </DialogTitle>
            <DialogDescription>
              {editingTour 
                ? "Modifica los detalles del tour. Los campos marcados con * son obligatorios." 
                : "Completa la información para crear un nuevo tour. Los campos marcados con * son obligatorios."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={tourForm.title}
                onChange={(e) => setTourForm({ ...tourForm, title: e.target.value })}
                data-testid="input-title"
              />
              {formErrors.title && (
                <p className="text-xs text-destructive mt-1">{formErrors.title}</p>
              )}
            </div>

            <div>
              <Label>Descripción *</Label>
              <Textarea
                value={tourForm.description}
                onChange={(e) => setTourForm({ ...tourForm, description: e.target.value })}
                rows={4}
                data-testid="input-description"
              />
              {formErrors.description && (
                <p className="text-xs text-destructive mt-1">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Continente (Opcional)</Label>
                <Select
                  value={tourForm.continent || "none"}
                  onValueChange={(value) => {
                    setTourForm({ ...tourForm, continent: value === "none" ? null : value });
                  }}
                >
                  <SelectTrigger data-testid="select-continent">
                    <SelectValue placeholder="Selecciona un continente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin continente</SelectItem>
                    {continents.map((continent: string) => (
                      <SelectItem key={continent} value={continent}>
                        {continent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duración *</Label>
                <Select
                  value={tourForm.duration}
                  onValueChange={(value) => setTourForm({ ...tourForm, duration: value })}
                >
                  <SelectTrigger data-testid="select-duration">
                    <SelectValue placeholder="Selecciona días" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((days) => (
                      <SelectItem key={days} value={`${days} día${days > 1 ? 's' : ''}`}>
                        {days} día{days > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.duration && (
                  <p className="text-xs text-destructive mt-1">{formErrors.duration}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={tourForm.featured}
                onCheckedChange={(checked) => setTourForm({ ...tourForm, featured: checked })}
                data-testid="switch-featured"
              />
              <Label htmlFor="featured" className="flex items-center gap-2 cursor-pointer">
                <Star className="h-4 w-4 text-yellow-500" />
                Destacar este tour en la página principal
              </Label>
            </div>

            <div className="space-y-4">
              <Label>Imágenes del Tour</Label>
              
              {/* Subida de archivos */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                <input
                  type="file"
                  id="tour-image-upload"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  data-testid="input-file-upload"
                />
                <label
                  htmlFor="tour-image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Subiendo imagen...</p>
                      <Progress value={uploadProgress} className="w-full max-w-xs" />
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-900">
                        Subir imagen desde tu computadora
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG o WEBP • Se optimizará automáticamente
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* O agregar URL */}
              <div>
                <Label className="text-xs text-gray-600">O pega una URL externa</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    data-testid="input-image-url"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddImage}
                    variant="outline"
                    data-testid="button-add-image"
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Galería de imágenes */}
              {tourForm.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    {tourForm.images.length} imagen(es):
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {tourForm.images.filter(img => img && img.trim() !== '').map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 
                              'https://via.placeholder.com/300x200?text=Error+cargando+imagen';
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={() => handleRemoveImage(idx)}
                          data-testid={`button-remove-image-${idx}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        {img && img.startsWith('/api/tours/images/') && (
                          <Badge 
                            variant="secondary" 
                            className="absolute bottom-2 left-2 text-xs"
                          >
                            Almacenada
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Información Detallada del Tour</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Itinerario</Label>
                  {tourForm.itinerary.map((day, idx) => (
                    <div key={idx} className="border rounded-lg p-4 mb-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm font-semibold">Día {idx + 1}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setTourForm({ 
                              ...tourForm, 
                              itinerary: tourForm.itinerary.filter((_, i) => i !== idx) 
                            });
                          }}
                          data-testid={`button-remove-day-${idx}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={day.title}
                        onChange={(e) => {
                          const newItinerary = [...tourForm.itinerary];
                          newItinerary[idx] = { ...newItinerary[idx], title: e.target.value };
                          setTourForm({ ...tourForm, itinerary: newItinerary });
                        }}
                        placeholder="Título del día (ej: Llegada a la ciudad)"
                        data-testid={`input-day-title-${idx}`}
                      />
                      <Textarea
                        value={day.description}
                        onChange={(e) => {
                          const newItinerary = [...tourForm.itinerary];
                          newItinerary[idx] = { ...newItinerary[idx], description: e.target.value };
                          setTourForm({ ...tourForm, itinerary: newItinerary });
                        }}
                        rows={3}
                        placeholder="Descripción de actividades del día..."
                        data-testid={`input-day-description-${idx}`}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTourForm({ 
                      ...tourForm, 
                      itinerary: [...tourForm.itinerary, { day: `Día ${tourForm.itinerary.length + 1}`, title: "", description: "" }] 
                    })}
                    data-testid="button-add-day"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Día
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agrega cada día del tour con su título y actividades
                  </p>
                </div>

                <div>
                  <Label>Lo que Incluye</Label>
                  {tourForm.includes.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newIncludes = [...tourForm.includes];
                          newIncludes[idx] = e.target.value;
                          setTourForm({ ...tourForm, includes: newIncludes });
                        }}
                        placeholder="Ej: Desayunos incluidos"
                        data-testid={`input-includes-${idx}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setTourForm({ 
                            ...tourForm, 
                            includes: tourForm.includes.filter((_, i) => i !== idx) 
                          });
                        }}
                        data-testid={`button-remove-includes-${idx}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTourForm({ ...tourForm, includes: [...tourForm.includes, ""] })}
                    data-testid="button-add-includes"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Item
                  </Button>
                </div>

                <div>
                  <Label>Lo que NO Incluye</Label>
                  {tourForm.excludes.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newExcludes = [...tourForm.excludes];
                          newExcludes[idx] = e.target.value;
                          setTourForm({ ...tourForm, excludes: newExcludes });
                        }}
                        placeholder="Ej: Comidas no especificadas"
                        data-testid={`input-excludes-${idx}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setTourForm({ 
                            ...tourForm, 
                            excludes: tourForm.excludes.filter((_, i) => i !== idx) 
                          });
                        }}
                        data-testid={`button-remove-excludes-${idx}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTourForm({ ...tourForm, excludes: [...tourForm.excludes, ""] })}
                    data-testid="button-add-excludes"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Item
                  </Button>
                </div>

                <div>
                  <Label>Políticas de Cancelación</Label>
                  <Textarea
                    value={tourForm.cancellationPolicy}
                    onChange={(e) => setTourForm({ ...tourForm, cancellationPolicy: e.target.value })}
                    rows={4}
                    placeholder="Describe las políticas de cancelación del tour..."
                    data-testid="input-cancellation-policy"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Políticas específicas para este tour (sobrescribe las políticas globales)
                  </p>
                </div>

                <div>
                  <Label>Requisitos</Label>
                  <Textarea
                    value={tourForm.requirements}
                    onChange={(e) => setTourForm({ ...tourForm, requirements: e.target.value })}
                    rows={4}
                    placeholder="Lista los requisitos necesarios para este tour..."
                    data-testid="input-requirements"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Requisitos específicos para este tour (sobrescribe los requisitos globales)
                  </p>
                </div>

                <div>
                  <Label>Preguntas Frecuentes (FAQs)</Label>
                  {tourForm.faqs.map((faq, idx) => (
                    <div key={idx} className="border rounded-lg p-4 mb-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm">Pregunta {idx + 1}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setTourForm({ 
                              ...tourForm, 
                              faqs: tourForm.faqs.filter((_, i) => i !== idx) 
                            });
                          }}
                          data-testid={`button-remove-faq-${idx}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={faq.question}
                        onChange={(e) => {
                          const newFaqs = [...tourForm.faqs];
                          newFaqs[idx] = { ...newFaqs[idx], question: e.target.value };
                          setTourForm({ ...tourForm, faqs: newFaqs });
                        }}
                        placeholder="Escribe la pregunta..."
                        data-testid={`input-faq-question-${idx}`}
                      />
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => {
                          const newFaqs = [...tourForm.faqs];
                          newFaqs[idx] = { ...newFaqs[idx], answer: e.target.value };
                          setTourForm({ ...tourForm, faqs: newFaqs });
                        }}
                        rows={2}
                        placeholder="Escribe la respuesta..."
                        data-testid={`input-faq-answer-${idx}`}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTourForm({ 
                      ...tourForm, 
                      faqs: [...tourForm.faqs, { question: "", answer: "" }] 
                    })}
                    data-testid="button-add-faq"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Pregunta
                  </Button>
                </div>
              </div>
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
              data-testid="button-save"
            >
              {editingTour ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Tour</DialogTitle>
          </DialogHeader>
          {viewingTour && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Título</Label>
                  <p className="font-medium">{viewingTour.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Duración</Label>
                  <p className="font-medium">{viewingTour.duration}</p>
                </div>
              </div>

              {viewingTour.continent && (
                <div>
                  <Label className="text-xs text-gray-600">Continente</Label>
                  <p className="font-medium">{viewingTour.continent}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-gray-600">Descripción</Label>
                <p className="text-sm">{viewingTour.description}</p>
              </div>

              {viewingTour.featured && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <Star className="w-4 h-4" />
                  <span className="font-medium">Tour Destacado</span>
                </div>
              )}

              {viewingTour.images && viewingTour.images.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Imágenes ({viewingTour.images.length})</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {viewingTour.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${viewingTour.title} ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setLocation(`/admin?tab=salidas&tour=${viewingTour.id}`);
                  }}
                  data-testid="button-view-departures"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Salidas de este Tour
                </Button>
              </div>
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
              {deletingTour && (
                <>
                  Está a punto de eliminar el tour{" "}
                  <strong>{deletingTour.title}</strong>.
                  Esta acción no se puede deshacer. Si este tour tiene salidas activas, no podrás eliminarlo.
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
