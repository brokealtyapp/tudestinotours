import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Search, Users } from "lucide-react";
import { useState } from "react";
import heroImage from "@assets/generated_images/Tropical_beach_paradise_hero_36bd81ee.png";

export default function Hero() {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const handleSearch = () => {
    console.log("Search triggered:", { destination, checkIn, checkOut, guests });
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
          Your Adventure Travel
          <br />
          Experts In the World!
        </h1>

        <Card className="mt-12 p-6 max-w-4xl mx-auto bg-white/95 backdrop-blur">
          <div className="flex items-center gap-4 mb-6 border-b pb-4">
            <Button 
              variant="ghost" 
              className="gap-2 border-b-2 border-primary text-primary pb-2"
              data-testid="button-filter-hotel"
            >
              <MapPin className="h-4 w-4" />
              Hotel
            </Button>
            <Button variant="ghost" className="gap-2" data-testid="button-filter-flight">
              Flight
            </Button>
            <Button variant="ghost" className="gap-2" data-testid="button-filter-bus">
              Bus & Train
            </Button>
            <Button variant="ghost" className="gap-2" data-testid="button-filter-holiday">
              Holiday
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Destination</label>
                <Input
                  type="text"
                  placeholder="Bali, Indonesia"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="border-0 p-0 h-auto focus-visible:ring-0"
                  data-testid="input-destination"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Check-in</label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="border-0 p-0 h-auto focus-visible:ring-0"
                  data-testid="input-checkin"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Check-out</label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="border-0 p-0 h-auto focus-visible:ring-0"
                  data-testid="input-checkout"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Guests</label>
                <Input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="border-0 p-0 h-auto focus-visible:ring-0"
                  data-testid="input-guests"
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full md:w-auto mt-6 bg-primary text-primary-foreground hover-elevate active-elevate-2 gap-2"
            onClick={handleSearch}
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </Card>
      </div>
    </section>
  );
}
