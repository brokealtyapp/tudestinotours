import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Users, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function TourDetail() {
  const { id } = useParams();

  const { data: tour, isLoading } = useQuery<any>({
    queryKey: ["/api/tours", id],
    queryFn: () => apiRequest("GET", `/api/tours/${id}`),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          Loading tour details...
        </div>
        <Footer />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Tour Not Found</h1>
          <Link href="/tours">
            <Button>Back to Tours</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-6">
          <Link href="/tours">
            <Button variant="outline" data-testid="button-back-to-tours">
              ← Back to Tours
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {tour.images && tour.images.length > 0 ? (
              <img
                src={tour.images[0]}
                alt={tour.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2">
              {tour.images?.slice(1, 5).map((img: string, idx: number) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${tour.title} - ${idx + 2}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/10 text-primary gap-1">
                <Star className="h-3 w-3 fill-primary" />
                {tour.rating || "0"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({tour.reviewCount || 0} reviews)
              </span>
            </div>

            <h1 className="text-4xl font-bold mb-4">{tour.title}</h1>

            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{tour.location}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{tour.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Max Passengers</p>
                  <p className="font-semibold">{tour.maxPassengers}</p>
                </div>
              </div>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-3xl font-bold text-primary">
                    ${tour.price}
                  </span>
                  <span className="text-muted-foreground">per person</span>
                </div>
                <Link href={`/booking/${id}`}>
                  <Button
                    className="w-full bg-destructive text-destructive-foreground hover-elevate active-elevate-2"
                    size="lg"
                    data-testid="button-book-now"
                  >
                    Book Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {tour.description}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </div>
  );
}
