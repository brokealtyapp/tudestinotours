import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Mark Smith",
    company: "Google Inc.",
    rating: 5,
    text: "Una experiencia maravillosa, el valle encantador lleno de vapor alrededor y el sol meridiano golpea la parte superior impenetrable.",
    avatar: "",
  },
  {
    id: 2,
    name: "Charles Patterson",
    company: "Técnico de Servicio",
    rating: 5,
    text: "Servicio excepcional, el valle encantador lleno de vapor alrededor y el sol meridiano golpea la parte superior impenetrable.",
    avatar: "",
  },
];

export default function Testimonials() {
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
                onClick={() => console.log("Previous testimonial")}
                data-testid="button-prev-testimonial"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => console.log("Next testimonial")}
                data-testid="button-next-testimonial"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Hay muchas variaciones
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-card" data-testid={`card-testimonial-${testimonial.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 mb-4"></div>
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
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
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
