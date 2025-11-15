import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import TourCard from "./TourCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PopularTours() {
  const { data: tours, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tours"],
  });

  const popularTours = tours
    ?.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"))
    .slice(0, 4) || [];

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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Los Más Populares</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => console.log("Previous clicked")}
              data-testid="button-prev-tour"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => console.log("Next clicked")}
              data-testid="button-next-tour"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mb-8 max-w-2xl">
          Gasta tu dinero y alivia tu estrés dando la vuelta a la isla de Bali.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularTours.map((tour: any) => (
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
      </div>
    </section>
  );
}
