import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Calendar, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function Tours() {
  const [location, navigate] = useLocation();
  const [searchLocation, setSearchLocation] = useState("");
  
  // Leer query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      continent: params.get("continent"),
      location: params.get("location"),
      tourId: params.get("tourId"),
      checkIn: params.get("checkIn"),
      checkOut: params.get("checkOut"),
      adults: parseInt(params.get("adults") || "0"),
      youth: parseInt(params.get("youth") || "0"),
      children: parseInt(params.get("children") || "0"),
      babies: parseInt(params.get("babies") || "0"),
    };
  }, [location]);

  const { data: tours, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tours"],
  });

  // Filtrar tours según los parámetros de búsqueda
  const filteredTours = useMemo(() => {
    if (!tours) return [];
    
    let filtered = [...tours];
    
    // Filtrar por tourId si existe
    if (queryParams.tourId) {
      filtered = filtered.filter(tour => tour.id.toString() === queryParams.tourId);
    }
    
    // Filtrar por continente (desde Hero)
    if (queryParams.continent) {
      filtered = filtered.filter(tour => tour.continent === queryParams.continent);
    }
    
    // Filtrar por ciudad específica (desde Hero) - solo si se proporcionó
    if (queryParams.location) {
      filtered = filtered.filter(tour => tour.location === queryParams.location);
    }
    
    // Filtrar por ubicación de búsqueda local (barra de búsqueda en Tours)
    if (searchLocation) {
      filtered = filtered.filter(tour => 
        tour.title?.toLowerCase().includes(searchLocation.toLowerCase()) ||
        tour.location?.toLowerCase().includes(searchLocation.toLowerCase()) ||
        tour.continent?.toLowerCase().includes(searchLocation.toLowerCase()) ||
        tour.description?.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }
    
    return filtered;
  }, [tours, queryParams.tourId, queryParams.continent, queryParams.location, searchLocation]);

  const handleSearch = () => {
    // La búsqueda local ya está manejada por el estado searchLocation
    // que se usa en filteredTours
  };

  const clearFilters = () => {
    setSearchLocation("");
    navigate("/tours");
  };

  const totalGuests = queryParams.adults + queryParams.youth + queryParams.children + queryParams.babies;
  const hasFilters = queryParams.continent || queryParams.location || queryParams.tourId || queryParams.checkIn || queryParams.checkOut || totalGuests > 0 || searchLocation;

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Explora Nuestros Tours"
        description="Descubre una amplia selección de tours y experiencias inolvidables. Desde aventuras exóticas hasta escapadas relajantes, encuentra el viaje perfecto para ti con Tu Destino Tours."
        ogType="website"
      />
      
      <Header />
      <main>
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Explora Nuestros Tours</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Descubre destinos increíbles y experiencias inolvidables alrededor del mundo
              </p>
              
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  type="text"
                  placeholder="Buscar por ubicación..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  data-testid="input-search-location"
                />
                <Button
                  onClick={handleSearch}
                  className="bg-primary text-primary-foreground"
                  data-testid="button-search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filtros activos */}
            {hasFilters && (
              <div className="mb-8 p-4 bg-background rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Filtros aplicados:</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar filtros
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {queryParams.continent && (
                    <Badge variant="secondary" className="gap-1">
                      <Search className="h-3 w-3" />
                      Continente: {queryParams.continent}
                    </Badge>
                  )}
                  {queryParams.location && (
                    <Badge variant="secondary" className="gap-1">
                      <Search className="h-3 w-3" />
                      Ciudad: {queryParams.location}
                    </Badge>
                  )}
                  {queryParams.checkIn && (
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Entrada: {format(parseISO(queryParams.checkIn), "d MMM yyyy", { locale: es })}
                    </Badge>
                  )}
                  {queryParams.checkOut && (
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Salida: {format(parseISO(queryParams.checkOut), "d MMM yyyy", { locale: es })}
                    </Badge>
                  )}
                  {totalGuests > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {totalGuests} {totalGuests === 1 ? "persona" : "personas"}
                      {queryParams.adults > 0 && ` (${queryParams.adults} adultos)`}
                      {queryParams.youth > 0 && ` (${queryParams.youth} jóvenes)`}
                      {queryParams.children > 0 && ` (${queryParams.children} niños)`}
                      {queryParams.babies > 0 && ` (${queryParams.babies} bebés)`}
                    </Badge>
                  )}
                  {searchLocation && (
                    <Badge variant="secondary" className="gap-1">
                      <Search className="h-3 w-3" />
                      Búsqueda: {searchLocation}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Resultados */}
            {isLoading ? (
              <div className="text-center py-12">Cargando tours...</div>
            ) : filteredTours && filteredTours.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {filteredTours.length} {filteredTours.length === 1 ? "tour encontrado" : "tours encontrados"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTours.map((tour: any) => (
                    <Link key={tour.id} href={`/tours/${tour.id}`}>
                      <TourCard
                        image={tour.images?.[0] || "/placeholder-tour.jpg"}
                        title={tour.title}
                        continent={tour.continent || ""}
                        rating={parseFloat(tour.rating || "0")}
                        reviews={tour.reviewCount?.toString() || "0"}
                        minPrice={tour.minPrice}
                      />
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No se encontraron tours que coincidan con tu búsqueda.
                </p>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
