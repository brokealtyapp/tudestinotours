import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, MapPin, Search, Users, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import heroImage from "@assets/generated_images/Tropical_beach_paradise_hero_36bd81ee.png";

type Tour = {
  id: number;
  name: string;
  destination: string;
  availableSeats: number;
};

export default function Hero() {
  const [selectedTour, setSelectedTour] = useState<string>("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  // Cargar tours desde la API
  const { data: tours, isLoading } = useQuery<Tour[]>({
    queryKey: ["/api/tours"],
  });

  const handleSearch = () => {
    if (!selectedTour) {
      console.log("Por favor selecciona un destino");
      return;
    }
    
    console.log("Búsqueda:", {
      tour: selectedTour,
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : null,
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : null,
      guests,
    });
    
    // Navegar a la sección de tours con filtros aplicados
    const toursSection = document.getElementById("tours");
    if (toursSection) {
      toursSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const incrementGuests = () => setGuests(prev => Math.min(prev + 1, 20));
  const decrementGuests = () => setGuests(prev => Math.max(prev - 1, 1));

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
          ¡Tus Expertos en Viajes
          <br />
          de Aventura en el Mundo!
        </h1>

        <Card className="mt-12 p-6 max-w-4xl mx-auto bg-white/95 backdrop-blur shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Selector de Destino */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-background">
              <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Destino
                </label>
                <Select value={selectedTour} onValueChange={setSelectedTour}>
                  <SelectTrigger 
                    className="border-0 p-0 h-auto focus:ring-0 font-medium"
                    data-testid="select-destination"
                  >
                    <SelectValue placeholder="Selecciona un destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        Cargando tours...
                      </SelectItem>
                    ) : tours && tours.length > 0 ? (
                      tours.map((tour) => (
                        <SelectItem key={tour.id} value={tour.id.toString()}>
                          {tour.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-tours" disabled>
                        No hay tours disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Picker - Entrada */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-background">
              <CalendarIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Entrada
                </label>
                <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-medium justify-start hover:bg-transparent"
                      data-testid="button-checkin"
                    >
                      {checkIn ? (
                        format(checkIn, "d/MM/yyyy", { locale: es })
                      ) : (
                        <span className="text-muted-foreground">Selecciona</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={(date) => {
                        setCheckIn(date);
                        setCheckInOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Date Picker - Salida */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-background">
              <CalendarIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Salida
                </label>
                <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-medium justify-start hover:bg-transparent"
                      data-testid="button-checkout"
                    >
                      {checkOut ? (
                        format(checkOut, "d/MM/yyyy", { locale: es })
                      ) : (
                        <span className="text-muted-foreground">Selecciona</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={(date) => {
                        setCheckOut(date);
                        setCheckOutOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return true;
                        if (checkIn) {
                          const nextDay = new Date(checkIn);
                          nextDay.setDate(nextDay.getDate() + 1);
                          return date < nextDay;
                        }
                        return false;
                      }}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Selector de Huéspedes */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-background">
              <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Huéspedes
                </label>
                <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-medium justify-start hover:bg-transparent"
                      data-testid="button-guests"
                    >
                      {guests} {guests === 1 ? "persona" : "personas"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Huéspedes</p>
                          <p className="text-xs text-muted-foreground">
                            Cantidad de personas
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={decrementGuests}
                            disabled={guests <= 1}
                            data-testid="button-guests-decrease"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium" data-testid="text-guests-count">
                            {guests}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={incrementGuests}
                            disabled={guests >= 20}
                            data-testid="button-guests-increase"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Button
            className="w-full md:w-auto mt-6 bg-primary text-primary-foreground hover-elevate active-elevate-2 gap-2 px-8"
            onClick={handleSearch}
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </Card>
      </div>
    </section>
  );
}
