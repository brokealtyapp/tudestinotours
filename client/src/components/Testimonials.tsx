import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: testimonials = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/testimonials"],
  });

  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + 2);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 2 < 0 ? Math.max(0, testimonials.length - 2) : prev - 2));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 2 >= testimonials.length ? 0 : prev + 2));
  };

  useEffect(() => {
    if (testimonials.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 2 >= testimonials.length ? 0 : prev + 2));
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (isLoading || testimonials.length === 0) {
    return null;
  }
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <p className="text-destructive font-semibold mb-2">Testimonios</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              No Me Creas a Mí
              <br />
              Mira Lo Que Dicen
              <br />
              Nuestros Clientes
            </h2>
            <div className="flex gap-4 items-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-destructive text-destructive-foreground hover-elevate active-elevate-2"
                onClick={handlePrevious}
                data-testid="button-prev-testimonial"
                disabled={testimonials.length <= 2}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleNext}
                data-testid="button-next-testimonial"
                disabled={testimonials.length <= 2}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} - {Math.min(currentIndex + 2, testimonials.length)} de {testimonials.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-card" data-testid={`card-testimonial-${testimonial.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    {testimonial.imageUrl ? (
                      <img 
                        src={testimonial.imageUrl} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover mb-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/20 mb-4 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <h3 className="font-semibold mb-1">{testimonial.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {testimonial.company}
                    </p>
                    <div className="mb-4">
                      <span className="text-6xl text-muted-foreground/20">"</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {testimonial.text}
                    </p>
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-destructive text-destructive"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
