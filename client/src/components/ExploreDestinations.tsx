import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TourCard from "./TourCard";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import tour1 from "@assets/generated_images/Mountain_castle_dramatic_view_e1ca76a2.png";
import tour2 from "@assets/generated_images/Cruise_ship_in_fjord_448b7050.png";
import tour3 from "@assets/generated_images/Historic_ship_at_dock_61dab35e.png";
import tour4 from "@assets/generated_images/Aerial_tropical_island_view_e3f7dcd3.png";
import tour5 from "@assets/generated_images/Sandbar_between_tropical_islands_9f61d263.png";
import tour6 from "@assets/generated_images/Thailand_beach_with_boat_0d72543f.png";

//todo: remove mock functionality
const categories = [
  "Popular Destination",
  "Islands",
  "Surfing",
  "Nation Parks",
  "Lake",
  "Beach",
  "Camp",
];

const destinations = [
  {
    id: 1,
    image: tour1,
    title: "Sorrento Castle",
    location: "Amalfi, Italy",
    rating: 4.8,
    reviews: "1.4k",
    price: 187,
  },
  {
    id: 2,
    image: tour2,
    title: "Cape Reinga",
    location: "Northland, New Zealand",
    rating: 4.7,
    reviews: "1.2k",
    price: 154,
  },
  {
    id: 3,
    image: tour3,
    title: "Osaka Castle",
    location: "Osaka, Japan",
    rating: 4.9,
    reviews: "2.1k",
    price: 169,
  },
  {
    id: 4,
    image: tour4,
    title: "Amalfi Coast",
    location: "Amalfi, Italy",
    rating: 4.9,
    reviews: "1.8k",
    price: 149,
  },
  {
    id: 5,
    image: tour5,
    title: "Tanah Gajah",
    location: "Bali, Indonesia",
    rating: 4.9,
    reviews: "3.2k",
    price: 138,
  },
  {
    id: 6,
    image: tour6,
    title: "Taj Mahal",
    location: "Agra, India",
    rating: 4.8,
    reviews: "2.5k",
    price: 120,
  },
];

export default function ExploreDestinations() {
  const [activeCategory, setActiveCategory] = useState("Popular Destination");

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Explore More</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Find your travel destination, because we have covered all regions in the wold.
            After you find the trip you want to go to, you can directly order the ticket.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className={activeCategory === category ? "bg-foreground text-background" : ""}
                onClick={() => {
                  setActiveCategory(category);
                  console.log("Category selected:", category);
                }}
                data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Button>
            ))}
          </div>
          <Button variant="outline" className="gap-2 flex-shrink-0" data-testid="button-filters">
            Filters
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <TourCard key={destination.id} {...destination} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Button 
            variant="outline" 
            className="hover-elevate"
            onClick={() => console.log("Show more clicked")}
            data-testid="button-show-more"
          >
            Show More
          </Button>
        </div>
      </div>
    </section>
  );
}
