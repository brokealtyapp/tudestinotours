import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bike, Waves, Mountain } from "lucide-react";
import heroImage from "@assets/generated_images/Mountain_castle_dramatic_view_e1ca76a2.png";

const testimonials = [
  {
    id: 1,
    name: "Ronald Richards",
    rating: 4.8,
    text: "Una experiencia increíble que superó todas mis expectativas.",
    role: "Anfitrión Fideler",
  },
  {
    id: 2,
    name: "Neri Helder",
    rating: 4.7,
    text: "Servicio excepcional y atención al detalle impecable.",
    role: "Anfitrión Fideler",
  },
  {
    id: 3,
    name: "Ronald Richards",
    rating: 4.8,
    text: "Definitivamente lo recomendaría a todos mis amigos.",
    role: "Anfitrión Fideler",
  },
];

const features = [
  {
    icon: Mountain,
    title: "Senderismo en Montaña",
    description: "Disfruta de caminatas guiadas por paisajes montañosos espectaculares.",
  },
  {
    icon: Bike,
    title: "Ciclismo de Montaña",
    description: "Rutas emocionantes en bicicleta por terrenos desafiantes y hermosos.",
  },
  {
    icon: Waves,
    title: "Natación y Pesca",
    description: "Experiencias acuáticas inolvidables en aguas cristalinas.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img
              src={heroImage}
              alt="Paisaje montañoso con testimonios"
              className="rounded-lg w-full h-[500px] object-cover"
            />
            <div className="absolute top-4 left-4 bg-white rounded-lg p-3 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-full bg-primary/20"></div>
              <div>
                <div className="font-semibold text-sm">Ronald Richards</div>
                <div className="flex items-center gap-1">
                  <span className="text-destructive">★</span>
                  <span className="text-sm">4.8</span>
                </div>
              </div>
            </div>

            {testimonials.slice(1).map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`absolute ${
                  index === 0 ? "top-1/3 right-4" : "bottom-8 left-4"
                } bg-white rounded-lg p-3 shadow-lg max-w-xs`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {testimonial.text}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-destructive text-xs">★</span>
                        <span className="text-xs">{testimonial.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-destructive font-semibold mb-2">¿Por qué elegirnos?</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Gran Oportunidad para
              <br />
              Aventuras y Viajes
            </h2>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
