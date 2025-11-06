import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import TourCard from "./TourCard";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

export default function ExploreDestinations() {
  const [, setLocation] = useLocation();
  const [activeContinent, setActiveContinent] = useState<string | null>(null);

  const { data: tours, isLoading: toursLoading } = useQuery<any[]>({
    queryKey: ["/api/tours"],
  });

  const { data: config, isLoading: configLoading } = useQuery<any[]>({
    queryKey: ["/api/config"],
  });

  const continents = useMemo(() => {
    const continentsConfig = config?.find((c: any) => c.key === "CONTINENTS_AND_CITIES");
    if (!continentsConfig?.value) return [];
    
    try {
      const data = typeof continentsConfig.value === "string" 
        ? JSON.parse(continentsConfig.value) 
        : continentsConfig.value;
      return Object.keys(data);
    } catch {
      return [];
    }
  }, [config]);

  const filteredTours = useMemo(() => {
    if (!tours) return [];
    if (!activeContinent) return tours;
    return tours.filter((tour: any) => tour.continent === activeContinent);
  }, [tours, activeContinent]);

  const displayedTours = filteredTours.slice(0, 6);

  if (toursLoading || configLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">Cargando tours...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Explora Más</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Encuentra tu destino de viaje, porque hemos cubierto todas las regiones del mundo.
            Después de encontrar el viaje que deseas, puedes ordenar el boleto directamente.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap mb-8 overflow-x-auto pb-2">
          <Button
            variant={!activeContinent ? "default" : "outline"}
            className={!activeContinent ? "bg-foreground text-background" : ""}
            onClick={() => setActiveContinent(null)}
            data-testid="button-category-todos"
          >
            Todos
          </Button>
          {continents.map((continent) => (
            <Button
              key={continent}
              variant={activeContinent === continent ? "default" : "outline"}
              className={activeContinent === continent ? "bg-foreground text-background" : ""}
              onClick={() => setActiveContinent(continent)}
              data-testid={`button-category-${continent.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {continent}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTours.map((tour: any) => (
            <TourCard
              key={tour.id}
              id={tour.id}
              image={tour.images?.[0] || "/placeholder-tour.jpg"}
              title={tour.title}
              continent={tour.continent || ""}
              rating={parseFloat(tour.rating || "0")}
              reviews={tour.reviewCount?.toString() || "0"}
              minPrice={tour.minPrice}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <Button 
            variant="outline" 
            className="hover-elevate"
            onClick={() => setLocation("/tours")}
            data-testid="button-show-more"
          >
            Mostrar Más
          </Button>
        </div>
      </div>
    </section>
  );
}
