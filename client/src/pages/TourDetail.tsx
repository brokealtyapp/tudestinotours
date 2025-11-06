import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Check, 
  X, 
  FileText,
  Info,
  AlertCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Tour, Departure } from "@shared/schema";
import SEOHead from "@/components/SEOHead";
import TourSchemaOrg from "@/components/TourSchemaOrg";

export default function TourDetail() {
  const [, params] = useRoute("/tours/:id");
  const [, navigate] = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);

  const tourId = params?.id;

  const { data: tour, isLoading: tourLoading } = useQuery<Tour>({
    queryKey: ["/api/tours", tourId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tours/${tourId}`);
      return await response.json();
    },
    enabled: !!tourId,
  });

  const { data: departures, isLoading: departuresLoading } = useQuery<Departure[]>({
    queryKey: ["/api/departures", tourId],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/departures");
      const allDepartures = await response.json() as Departure[];
      return allDepartures
        .filter(d => d.tourId === tourId && d.status === "active")
        .filter(d => new Date(d.departureDate) > new Date())
        .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
    },
    enabled: !!tourId,
  });

  if (tourLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando detalles del tour...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Tour no encontrado</h2>
            <p className="text-muted-foreground mb-4">El tour que buscas no existe o ha sido eliminado.</p>
            <Button onClick={() => navigate("/tours")} data-testid="button-back-to-tours">
              Volver a Tours
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const images = tour.images && tour.images.length > 0 ? tour.images : ["/placeholder-tour.jpg"];
  const minPrice = departures && departures.length > 0 
    ? Math.min(...departures.map(d => parseFloat(d.price)))
    : null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBookNow = () => {
    if (selectedDepartureId) {
      navigate(`/booking/${tourId}?departureId=${selectedDepartureId}`);
    } else {
      navigate(`/booking/${tourId}`);
    }
  };

  const handleDownloadBrochure = () => {
    window.open(`/api/tours/${tourId}/brochure`, '_blank');
  };

  const getOccupationColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-orange-500";
    return "text-green-600";
  };

  const getOccupationBadge = (percentage: number, availableSeats: number) => {
    if (availableSeats === 0) {
      return <Badge variant="destructive">Agotado</Badge>;
    }
    if (percentage >= 90) {
      return <Badge variant="destructive">Últimos cupos</Badge>;
    }
    if (percentage >= 70) {
      return <Badge className="bg-orange-500 text-white">Pocos cupos</Badge>;
    }
    return <Badge className="bg-green-600 text-white">Disponible</Badge>;
  };

  const selectedDeparture = selectedDepartureId && departures 
    ? departures.find(d => d.id === selectedDepartureId) 
    : undefined;

  const seoDescription = tour.description 
    ? tour.description.substring(0, 155) + (tour.description.length > 155 ? '...' : '')
    : `Descubre ${tour.title} - ${tour.duration} de viaje inolvidable con Tu Destino Tours.`;

  const seoImage = tour.images && tour.images.length > 0 
    ? tour.images[0] 
    : undefined;

  return (
    <div className="min-h-screen">
      <SEOHead
        title={tour.title}
        description={seoDescription}
        ogType="website"
        ogImage={seoImage}
        ogUrl={window.location.href}
      />
      <TourSchemaOrg tour={tour} departure={selectedDeparture} />
      
      <Header />
      
      {/* Hero Section with Image Gallery */}
      <section className="relative h-[500px] bg-muted overflow-hidden">
        <img 
          src={images[currentImageIndex]} 
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover-elevate active-elevate-2 backdrop-blur-sm text-white p-3 rounded-full overflow-visible"
              data-testid="button-prev-image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover-elevate active-elevate-2 backdrop-blur-sm text-white p-3 rounded-full overflow-visible"
              data-testid="button-next-image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-white" />
              <span className="text-white/90">{tour.continent || "Destino internacional"}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-tour-title">
              {tour.title}
            </h1>
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{tour.rating || "5.0"}</span>
                <span className="text-white/80">({tour.reviewCount || 0} reseñas)</span>
              </div>
              <Separator orientation="vertical" className="h-6 bg-white/30" />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{tour.duration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImageIndex ? "bg-white w-8" : "bg-white/50"
                }`}
                data-testid={`indicator-image-${idx}`}
              />
            ))}
          </div>
        )}
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Descripción</h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
                {tour.description}
              </p>
            </section>

            <Separator />

            {/* What's Included */}
            {tour.includes && tour.includes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Qué incluye</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tour.includes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2" data-testid={`included-${idx}`}>
                      <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-1">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* What's NOT Included */}
            {tour.excludes && tour.excludes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Qué NO incluye</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tour.excludes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2" data-testid={`not-included-${idx}`}>
                      <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-1">
                        <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* Itinerary */}
            {tour.itinerary && Array.isArray(tour.itinerary) && tour.itinerary.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Itinerario</h2>
                <div className="space-y-4">
                  {tour.itinerary.map((day: { day: string; title: string; description: string }, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{day.title}</h3>
                          <p className="text-muted-foreground whitespace-pre-line">{day.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* Policies & Requirements */}
            {(tour.cancellationPolicy || tour.requirements) && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Políticas y Requisitos</h2>
                
                <div className="space-y-4">
                  {tour.cancellationPolicy && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Política de Cancelación
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">
                          {tour.cancellationPolicy}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {tour.requirements && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-primary" />
                          Requisitos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">
                          {tour.requirements}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            )}

            <Separator />

            {/* FAQ */}
            {tour.faqs && Array.isArray(tour.faqs) && tour.faqs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Preguntas Frecuentes</h2>
                <Accordion type="single" collapsible className="w-full">
                  {(tour.faqs as Array<{ question: string; answer: string }>).map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`} data-testid={`faq-${idx}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>
                        <div className="text-muted-foreground whitespace-pre-line">
                          {faq.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </div>

          {/* Sidebar - Departures & Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Price Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">
                    {minPrice !== null ? (
                      <>
                        <div className="text-sm text-muted-foreground">Desde</div>
                        <div className="text-3xl font-bold text-primary" data-testid="text-price">
                          ${minPrice.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">por persona</div>
                      </>
                    ) : (
                      <div className="text-xl font-semibold text-muted-foreground" data-testid="text-price">
                        Consultar precio
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Available Departures */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Salidas Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {departuresLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : departures && departures.length > 0 ? (
                    departures.map((departure) => {
                      const availableSeats = departure.totalSeats - departure.reservedSeats;
                      const occupationPercentage = (departure.reservedSeats / departure.totalSeats) * 100;
                      const isSelected = selectedDepartureId === departure.id;
                      
                      return (
                        <div
                          key={departure.id}
                          onClick={() => setSelectedDepartureId(departure.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover-elevate ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border"
                          }`}
                          data-testid={`departure-${departure.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-sm mb-1">
                                {format(new Date(departure.departureDate), "d MMMM yyyy", { locale: es })}
                              </div>
                              {departure.returnDate && (
                                <div className="text-xs text-muted-foreground">
                                  Regreso: {format(new Date(departure.returnDate), "d MMM yyyy", { locale: es })}
                                </div>
                              )}
                            </div>
                            {getOccupationBadge(occupationPercentage, availableSeats)}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {availableSeats} cupos disponibles
                              </span>
                              <span className="font-bold text-primary">
                                ${parseFloat(departure.price).toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Ocupación</span>
                                <span className={getOccupationColor(occupationPercentage)}>
                                  {occupationPercentage.toFixed(0)}%
                                </span>
                              </div>
                              <Progress value={occupationPercentage} className="h-2" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay salidas disponibles próximamente</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleBookNow}
                  data-testid="button-book-now"
                >
                  {selectedDepartureId ? "Reservar esta salida" : "Reservar ahora"}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadBrochure}
                  data-testid="button-download-brochure"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Folleto PDF
                </Button>
                {selectedDepartureId && departures && departures.length > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Has seleccionado: {format(
                      new Date(departures.find(d => d.id === selectedDepartureId)!.departureDate), 
                      "d MMMM yyyy", 
                      { locale: es }
                    )}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-center mb-2">¿Necesitas ayuda?</p>
                  <p className="text-center font-semibold">Contáctanos</p>
                  <p className="text-sm text-center text-muted-foreground">
                    info@tudestinotours.com
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
        <div className="flex items-center justify-between gap-3">
          {minPrice !== null ? (
            <div>
              <div className="text-sm text-muted-foreground">Desde</div>
              <div className="text-xl font-bold text-primary">${minPrice.toFixed(2)}</div>
            </div>
          ) : (
            <div className="text-sm font-semibold text-muted-foreground">Consultar precio</div>
          )}
          <Button 
            size="lg"
            onClick={handleBookNow}
            data-testid="button-book-now-mobile"
          >
            Reservar ahora
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
