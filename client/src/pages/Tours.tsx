import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Tours() {
  const [searchLocation, setSearchLocation] = useState("");
  const [location, setLocation] = useState("");

  const { data: tours, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tours", location],
  });

  const handleSearch = () => {
    setLocation(searchLocation);
  };

  return (
    <div className="min-h-screen">
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

            {isLoading ? (
              <div className="text-center py-12">Cargando tours...</div>
            ) : tours && tours.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map((tour: any) => (
                  <div key={tour.id} onClick={() => window.location.href = `/tours/${tour.id}`}>
                    <TourCard
                      image={tour.images[0] || "/placeholder-tour.jpg"}
                      title={tour.title}
                      location={tour.location}
                      rating={parseFloat(tour.rating || "0")}
                      reviews={tour.reviewCount?.toString() || "0"}
                      price={parseFloat(tour.price)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No se encontraron tours. Intenta una búsqueda diferente.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
