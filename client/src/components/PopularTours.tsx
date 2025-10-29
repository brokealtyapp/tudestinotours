import { Button } from "@/components/ui/button";
import TourCard from "./TourCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import tour1 from "@assets/generated_images/Thailand_beach_with_boat_0d72543f.png";
import tour2 from "@assets/generated_images/Romantic_beach_couple_walking_7c537b30.png";
import tour3 from "@assets/generated_images/Cruise_ship_in_fjord_448b7050.png";
import tour4 from "@assets/generated_images/Historic_ship_at_dock_61dab35e.png";

//todo: remove mock functionality
const tours = [
  {
    id: 1,
    image: tour1,
    title: "Molokini and Turtle Town Snorkeling Adventure Aboard",
    location: "Bali, Indonesia",
    rating: 4.8,
    reviews: "1.4k",
    price: 187,
    discount: 20,
  },
  {
    id: 2,
    image: tour2,
    title: "All Inclusive Ultimate Circle Island Day Tour with Lunch",
    location: "Ontario, Canada",
    rating: 4.8,
    reviews: "1.4k",
    price: 154,
    discount: 20,
  },
  {
    id: 3,
    image: tour3,
    title: "Inside Park Bike Tour and Space Center Houston Admission",
    location: "Venice, Italy",
    rating: 4.8,
    reviews: "1.4k",
    price: 169,
    discount: 20,
  },
  {
    id: 4,
    image: tour4,
    title: "Westminster Walking Tour & Westminster Abbey Entry",
    location: "Nevada, USA",
    rating: 4.8,
    reviews: "1.4k",
    price: 148,
    discount: 20,
  },
];

export default function PopularTours() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Most Popular in 2023</h2>
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
          Let's spend your money and relieve your stress by going around the island of Bali.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tours.map((tour) => (
            <TourCard key={tour.id} {...tour} />
          ))}
        </div>
      </div>
    </section>
  );
}
