import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, MapPin, Search, Users, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays } from "date-fns";
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
import heroImage from "@assets/generated_images/Tropical_beach_paradise_hero_36bd81ee.png";

type Tour = {
  id: number;
  name: string;
  destination: string;
  availableSeats: number;
};

type GuestCounts = {
  adults: number;
  youth: number;
  children: number;
  babies: number;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function CustomCalendar({ 
  selected, 
  onSelect,
  disabled,
  onClose 
}: { 
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  onClose: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const nextMonth = addMonths(currentMonth, 1);

  const renderMonth = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    
    // Calcular días vacíos al inicio
    const firstDayOfWeek = start.getDay();
    const emptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    return (
      <div className="p-4">
        <div className="text-center font-semibold mb-4">
          {format(month, "MMMM 'de' yyyy", { locale: es })}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: emptyDays }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          {days.map((day) => {
            const isDisabled = disabled ? disabled(day) : false;
            const isSelected = selected ? isSameDay(day, selected) : false;
            const isTodayDate = isToday(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  if (!isDisabled) {
                    onSelect(day);
                    onClose();
                  }
                }}
                disabled={isDisabled}
                className={`
                  p-2 text-sm rounded-md transition-colors
                  ${isSelected ? "bg-primary text-primary-foreground font-semibold" : ""}
                  ${isTodayDate && !isSelected ? "border-2 border-primary" : ""}
                  ${!isDisabled && !isSelected ? "hover-elevate" : ""}
                  ${isDisabled ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                `}
                data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleToday = () => {
    onSelect(new Date());
    onClose();
  };

  const handleTomorrow = () => {
    onSelect(addDays(new Date(), 1));
    onClose();
  };

  return (
    <div className="w-auto">
      <div className="flex gap-2 p-4 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          data-testid="button-today"
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTomorrow}
          data-testid="button-tomorrow"
        >
          Mañana
        </Button>
      </div>
      
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          data-testid="button-prev-month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          data-testid="button-next-month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 divide-x">
        {renderMonth(currentMonth)}
        {renderMonth(nextMonth)}
      </div>
      
      <div className="flex justify-end gap-2 p-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onSelect(undefined);
            onClose();
          }}
          data-testid="button-clear-date"
        >
          Borrar
        </Button>
      </div>
    </div>
  );
}

export default function Hero() {
  const [selectedTour, setSelectedTour] = useState<string>("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: 1,
    youth: 0,
    children: 0,
    babies: 0,
  });
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  // Cargar tours desde la API
  const { data: tours, isLoading } = useQuery<Tour[]>({
    queryKey: ["/api/tours"],
  });

  const totalGuests = guestCounts.adults + guestCounts.youth + guestCounts.children + guestCounts.babies;

  const updateGuestCount = (category: keyof GuestCounts, delta: number) => {
    setGuestCounts(prev => ({
      ...prev,
      [category]: Math.max(0, prev[category] + delta),
    }));
  };

  const [, setLocation] = useLocation();

  const handleSearch = () => {
    // Construir query params para la búsqueda
    const params = new URLSearchParams();
    
    if (selectedTour) {
      params.append("tourId", selectedTour);
    }
    
    if (checkIn) {
      params.append("checkIn", format(checkIn, "yyyy-MM-dd"));
    }
    
    if (checkOut) {
      params.append("checkOut", format(checkOut, "yyyy-MM-dd"));
    }
    
    if (totalGuests > 0) {
      params.append("adults", guestCounts.adults.toString());
      params.append("youth", guestCounts.youth.toString());
      params.append("children", guestCounts.children.toString());
      params.append("babies", guestCounts.babies.toString());
    }
    
    // Navegar a /tours con los parámetros de búsqueda
    setLocation(`/tours?${params.toString()}`);
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
                    <SelectValue placeholder="Selecciona destino" />
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
                        <span className="text-muted-foreground">Cualquier fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CustomCalendar
                      selected={checkIn}
                      onSelect={setCheckIn}
                      disabled={(date) => date < new Date()}
                      onClose={() => setCheckInOpen(false)}
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
                        <span className="text-muted-foreground">Cualquier fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CustomCalendar
                      selected={checkOut}
                      onSelect={setCheckOut}
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
                      onClose={() => setCheckOutOpen(false)}
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
                      {totalGuests} {totalGuests === 1 ? "persona" : "personas"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-1">
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg">
                          Selecciona el número de participantes
                        </h3>
                      </div>

                      {/* Adultos */}
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium">Adulto</p>
                          <p className="text-xs text-muted-foreground">(Edad 25-99)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateGuestCount('adults', -1)}
                            disabled={guestCounts.adults <= 0}
                            data-testid="button-adults-decrease"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium" data-testid="text-adults-count">
                            {guestCounts.adults}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateGuestCount('adults', 1)}
                            data-testid="button-adults-increase"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Jóvenes */}
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium">Joven</p>
                          <p className="text-xs text-muted-foreground">(Edad 18-24)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateGuestCount('youth', -1)}
                            disabled={guestCounts.youth <= 0}
                            data-testid="button-youth-decrease"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium" data-testid="text-youth-count">
                            {guestCounts.youth}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateGuestCount('youth', 1)}
                            data-testid="button-youth-increase"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Niños */}
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium">Niño</p>
                          <p className="text-xs text-muted-foreground">(Edad 6-17)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateGuestCount('children', -1)}
                            disabled={guestCounts.children <= 0}
                            data-testid="button-children-decrease"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium" data-testid="text-children-count">
                            {guestCounts.children}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateGuestCount('children', 1)}
                            data-testid="button-children-increase"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Bebés */}
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">Bebé</p>
                          <p className="text-xs text-muted-foreground">(Hasta los 5 años)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateGuestCount('babies', -1)}
                            disabled={guestCounts.babies <= 0}
                            data-testid="button-babies-decrease"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium" data-testid="text-babies-count">
                            {guestCounts.babies}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateGuestCount('babies', 1)}
                            data-testid="button-babies-increase"
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
