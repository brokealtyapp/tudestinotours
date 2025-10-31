import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import TourCard from "./TourCard";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const categories = [
  "Destino Popular",
  "Islas",
  "Surf",
  "Parques Nacionales",
  "Lago",
  "Playa",
  "Camping",
];

export default function ExploreDestinations() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("Destino Popular");

  const { data: tours, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tours"],
  });

  const displayedTours = tours?.slice(0, 6) || [];

  if (isLoading) {
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

        <div className="flex items-center justify-between gap-4 mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className={activeCategory === category ? "bg-foreground text-background" : ""}
                onClick={() => setActiveCategory(category)}
                data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Button>
            ))}
          </div>
          <Button variant="outline" className="gap-2 flex-shrink-0" data-testid="button-filters">
            Filtros
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTours.map((tour: any) => (
            <TourCard
              key={tour.id}
              id={tour.id}
              image={tour.images?.[0] || "/placeholder-tour.jpg"}
              title={tour.title}
              location={tour.location}
              rating={parseFloat(tour.rating || "0")}
              reviews={tour.reviewCount?.toString() || "0"}
              price={parseFloat(tour.price)}
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
