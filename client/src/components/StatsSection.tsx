import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import islandImage1 from "@assets/generated_images/Aerial_tropical_island_view_e3f7dcd3.png";
import islandImage2 from "@assets/generated_images/Sandbar_between_tropical_islands_9f61d263.png";

export default function StatsSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="grid grid-cols-2 gap-4">
            <img
              src={islandImage1}
              alt="Hermoso destino isleño"
              className="rounded-lg w-full h-64 object-cover"
            />
            <img
              src={islandImage2}
              alt="Paraíso tropical"
              className="rounded-lg w-full h-64 object-cover mt-8"
            />
          </div>

          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Lo Mejor de Esta Semana
            </h2>
            <p className="text-muted-foreground mb-8">
              Gasta tu dinero y alivia tu estrés dando la vuelta a la isla de
              Bali. Invierte tu dinero sabiamente y experimenta la belleza impresionante de Bali
              al máximo.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-4xl font-bold text-destructive mb-1">50+</div>
                <div className="text-sm text-muted-foreground">Destinos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-destructive mb-1">200+</div>
                <div className="text-sm text-muted-foreground">Turistas</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-destructive mb-1">100+</div>
                <div className="text-sm text-muted-foreground">Hoteles</div>
              </div>
            </div>

            <Button 
              className="bg-primary text-primary-foreground hover-elevate active-elevate-2"
              data-testid="button-find-place"
              asChild
            >
              <Link href="/tours">
                Descubre Nuevos Lugares
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
