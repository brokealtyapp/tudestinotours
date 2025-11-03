import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, ChevronRight, Calendar, Users, AlertCircle, LogIn } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type BookingStep = 1 | 2 | 3 | 4;

interface PassengerData {
  name: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  passportImageUrl: string;
}

interface Departure {
  id: string;
  tourId: string;
  departureDate: Date;
  returnDate: Date | null;
  totalSeats: number;
  reservedSeats: number;
  price: string;
  status: string;
}

export default function Booking() {
  const { id: tourId } = useParams();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Leer departureId de la URL query string
  const queryParams = new URLSearchParams(window.location.search);
  const initialDepartureId = queryParams.get('departureId') || "";

  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [numPassengers, setNumPassengers] = useState(1);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>(initialDepartureId);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [paymentUrl, setPaymentUrl] = useState("");
  
  // Datos del comprador (requeridos para reservas anónimas)
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerPassportNumber, setBuyerPassportNumber] = useState("");
  const [buyerDepartureAirport, setBuyerDepartureAirport] = useState("");
  const [buyerNationality, setBuyerNationality] = useState("");
  
  // Email validation state
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const { data: tour, isLoading: tourLoading } = useQuery<any>({
    queryKey: ["/api/tours", tourId],
    queryFn: () => apiRequest("GET", `/api/tours/${tourId}`),
  });

  const { data: departures, isLoading: departuresLoading } = useQuery<Departure[]>({
    queryKey: ["/api/departures", tourId],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/departures");
      const allDepartures = await response.json() as Departure[];
      return allDepartures
        .filter(d => d.tourId === tourId && d.status === "active")
        .filter(d => new Date(d.departureDate) > new Date())
        .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
    },
    enabled: !!tourId,
  });

  const { data: nationalities } = useQuery<Array<{key: string; value: string}>>({
    queryKey: ["/api/system-settings/category/nationalities"],
  });

  // Permitir reservas sin autenticación (reservas anónimas)

  useEffect(() => {
    setPassengers(
      Array(numPassengers)
        .fill(null)
        .map(() => ({
          name: "",
          passportNumber: "",
          nationality: "",
          dateOfBirth: "",
          passportImageUrl: "",
        }))
    );
  }, [numPassengers]);

  // Auto-duplicar datos del comprador al pasajero 1
  useEffect(() => {
    if (passengers.length > 0 && buyerName) {
      setPassengers((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          name: buyerName,
          passportNumber: buyerPassportNumber,
          nationality: buyerNationality,
        };
        return updated;
      });
    }
  }, [buyerName, buyerPassportNumber, buyerNationality]);

  // Check if email exists with debounce
  useEffect(() => {
    // Skip if user is already logged in or email is empty
    if (user || !buyerEmail || buyerEmail.trim() === "") {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    
    // Create AbortController to cancel in-flight requests
    const abortController = new AbortController();
    const currentEmail = buyerEmail; // Capture current email value
    
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/users/check-email?email=${encodeURIComponent(currentEmail)}`,
          { signal: abortController.signal }
        );
        const data = await response.json();
        
        // Only update state if email hasn't changed
        if (currentEmail === buyerEmail) {
          setEmailExists(data.exists);
          setCheckingEmail(false);
        }
      } catch (error: any) {
        // Ignore abort errors (user is typing)
        if (error.name !== 'AbortError') {
          console.error("Error checking email:", error);
          if (currentEmail === buyerEmail) {
            setEmailExists(false);
            setCheckingEmail(false);
          }
        }
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timeoutId);
      abortController.abort(); // Cancel in-flight request
    };
  }, [buyerEmail, user]);

  if (tourLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          Cargando información de reserva...
        </div>
        <Footer />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Tour No Encontrado</h1>
          <Button onClick={() => setLocation("/tours")}>Volver a Tours</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedDepartureId) {
        toast({
          title: "Error",
          description: "Por favor selecciona una fecha de salida",
          variant: "destructive",
        });
        return;
      }
      if (numPassengers < 1) {
        toast({
          title: "Error",
          description: "Por favor selecciona al menos un pasajero",
          variant: "destructive",
        });
        return;
      }
      const selectedDeparture = departures?.find(d => d.id === selectedDepartureId);
      if (selectedDeparture) {
        const availableSeats = selectedDeparture.totalSeats - selectedDeparture.reservedSeats;
        if (numPassengers > availableSeats) {
          toast({
            title: "Error",
            description: `No hay suficientes cupos disponibles. Disponibles: ${availableSeats}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    if (currentStep === 2) {
      // Validar datos del comprador
      if (!buyerName || !buyerEmail || !buyerPhone || !buyerPassportNumber || !buyerDepartureAirport || !buyerNationality) {
        toast({
          title: "Error",
          description: "Por favor completa todos los datos del comprador",
          variant: "destructive",
        });
        return;
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(buyerEmail)) {
        toast({
          title: "Error",
          description: "Por favor ingresa un correo electrónico válido",
          variant: "destructive",
        });
        return;
      }
      
      // Validar datos de pasajeros
      const missingData = passengers.some(
        (p) =>
          !p.name || !p.passportNumber || !p.nationality || !p.dateOfBirth
      );
      if (missingData) {
        toast({
          title: "Error",
          description: "Por favor completa toda la información de los pasajeros",
          variant: "destructive",
        });
        return;
      }
    }

    // NOTE: Se eliminó la validación obligatoria de documentos de pasaporte
    // Los pasajeros pueden crear su reserva sin subir documentos
    // y subirlos posteriormente (documentos opcionales)

    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as BookingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as BookingStep);
    }
  };

  const handlePassengerChange = (
    index: number,
    field: keyof PassengerData,
    value: string
  ) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handlePassportUpload = async (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadUrlResponse = await apiRequest("POST", "/api/objects/upload");
      const uploadData = await uploadUrlResponse.json();
      const { uploadURL } = uploadData;

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const normalizeResponse = await apiRequest("POST", "/api/objects/normalize", {
        imageURL: uploadURL,
      });
      const normalizeData = await normalizeResponse.json();

      handlePassengerChange(index, "passportImageUrl", normalizeData.objectPath);

      toast({
        title: "Éxito",
        description: "Pasaporte subido exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al subir pasaporte",
        variant: "destructive",
      });
    }
  };

  const handleSubmitBooking = async () => {
    try {
      const selectedDeparture = departures?.find(d => d.id === selectedDepartureId);
      if (!selectedDeparture) {
        toast({
          title: "Error",
          description: "Salida no encontrada",
          variant: "destructive",
        });
        return;
      }

      const reservationData = {
        tourId,
        departureId: selectedDepartureId,
        userId: user?.id || null,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerPassportNumber,
        buyerDepartureAirport,
        buyerNationality,
        reservationDate: new Date().toISOString(),
        departureDate: new Date(selectedDeparture.departureDate).toISOString(),
        numberOfPassengers: numPassengers,
        totalPrice: parseFloat(selectedDeparture.price) * numPassengers,
        status: "pending",
        paymentStatus: "pending",
        paymentLink: null,
        passengers: passengers.map(p => ({
          fullName: p.name,
          passportNumber: p.passportNumber,
          nationality: p.nationality,
          dateOfBirth: new Date(p.dateOfBirth).toISOString(),
          passportImageUrl: p.passportImageUrl,
        })),
      };

      const reservation: any = await apiRequest("POST", "/api/reservations", reservationData);

      // Las cuotas de pago ya se generan automáticamente en el backend al crear la reserva
      // ya no es necesario crear un payment manual aquí

      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });

      toast({
        title: "Éxito",
        description: "¡Reserva creada exitosamente!",
      });

      setLocation(`/booking-confirmation?reservationId=${reservation.id}&email=${encodeURIComponent(buyerEmail)}&isNewUser=${reservation.isNewUser || false}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la reserva",
        variant: "destructive",
      });
    }
  };

  const steps = [
    { label: "Pasajeros", number: 1 },
    { label: "Detalles", number: 2 },
    { label: "Documentos", number: 3 },
    { label: "Pago", number: 4 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reserva tu Tour</h1>
          <p className="text-muted-foreground">{tour.title}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        currentStep === step.number
                          ? "bg-primary text-primary-foreground"
                          : currentStep > step.number
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                      data-testid={`step-indicator-${step.number}`}
                    >
                      {currentStep > step.number ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className="text-xs mt-2">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        currentStep > step.number
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    Selecciona una Fecha de Salida
                  </Label>
                  {departuresLoading ? (
                    <div className="text-muted-foreground text-center py-8">
                      Cargando salidas disponibles...
                    </div>
                  ) : !departures || departures.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No hay salidas disponibles para este tour en este momento.
                      </p>
                      <Button onClick={() => setLocation("/tours")} variant="outline">
                        Volver a Tours
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {departures.map((departure) => {
                        const availableSeats = departure.totalSeats - departure.reservedSeats;
                        const occupationPercent = (departure.reservedSeats / departure.totalSeats) * 100;
                        const isSelected = selectedDepartureId === departure.id;
                        
                        return (
                          <Card
                            key={departure.id}
                            className={`cursor-pointer hover-elevate transition-all ${
                              isSelected ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => setSelectedDepartureId(departure.id)}
                            data-testid={`card-departure-${departure.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">
                                      {format(new Date(departure.departureDate), "PPP", { locale: es })}
                                    </span>
                                    {departure.returnDate && (
                                      <span className="text-sm text-muted-foreground">
                                        → {format(new Date(departure.returnDate), "PPP", { locale: es })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <span>
                                        {availableSeats} / {departure.totalSeats} disponibles
                                      </span>
                                    </div>
                                    <Badge
                                      variant={
                                        occupationPercent >= 80
                                          ? "destructive"
                                          : occupationPercent >= 50
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {occupationPercent.toFixed(0)}% ocupado
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-primary">
                                    ${departure.price}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    por persona
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedDepartureId && departures && (
                  <>
                    <div>
                      <Label htmlFor="num-passengers">
                        Número de Pasajeros
                      </Label>
                      <Select
                        value={numPassengers.toString()}
                        onValueChange={(value) => setNumPassengers(parseInt(value))}
                      >
                        <SelectTrigger id="num-passengers" data-testid="select-num-passengers">
                          <SelectValue placeholder="Selecciona número de pasajeros" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const maxAvailable = departures.find(d => d.id === selectedDepartureId)
                              ? departures.find(d => d.id === selectedDepartureId)!.totalSeats -
                                departures.find(d => d.id === selectedDepartureId)!.reservedSeats
                              : 1;
                            const max = Math.min(100, maxAvailable);
                            return Array.from({ length: max }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'pasajero' : 'pasajeros'}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      {(() => {
                        const selectedDeparture = departures.find(d => d.id === selectedDepartureId);
                        const price = selectedDeparture ? parseFloat(selectedDeparture.price) : 0;
                        return (
                          <>
                            <div className="flex justify-between mb-2">
                              <span>Precio por persona:</span>
                              <span className="font-semibold">${price}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                              <span>Número de pasajeros:</span>
                              <span className="font-semibold">{numPassengers}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                              <span>Total:</span>
                              <span className="text-primary">
                                ${(price * numPassengers).toFixed(2)}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Datos del Comprador */}
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Datos del Comprador</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ingresa tus datos de contacto para recibir la confirmación de tu reserva. Estos datos se copiarán automáticamente al Pasajero 1.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="buyer-name">Nombre Completo *</Label>
                      <Input
                        id="buyer-name"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Juan Pérez"
                        data-testid="input-buyer-name"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="buyer-email">Correo Electrónico *</Label>
                        <Input
                          id="buyer-email"
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="ejemplo@correo.com"
                          data-testid="input-buyer-email"
                        />
                        {checkingEmail && (
                          <p className="text-xs text-muted-foreground mt-1">Verificando email...</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="buyer-phone">Teléfono *</Label>
                        <Input
                          id="buyer-phone"
                          type="tel"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="+1 (809) 555-1234"
                          data-testid="input-buyer-phone"
                        />
                      </div>
                    </div>
                    
                    {emailExists && !user && (
                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800" data-testid="alert-email-exists">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-900 dark:text-blue-100">
                          <div className="flex flex-col gap-2">
                            <p className="font-medium">Ya tienes una cuenta registrada con este correo.</p>
                            <p className="text-sm">
                              Puedes continuar con la reserva de todas formas, o iniciar sesión para ver tus reservas anteriores.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setLocation("/login")}
                                data-testid="button-go-to-login"
                              >
                                <LogIn className="h-4 w-4 mr-1" />
                                Iniciar Sesión
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setEmailExists(false)}
                                data-testid="button-continue-anyway"
                              >
                                Continuar de todas formas
                              </Button>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="buyer-passport">Número de Pasaporte *</Label>
                        <Input
                          id="buyer-passport"
                          value={buyerPassportNumber}
                          onChange={(e) => setBuyerPassportNumber(e.target.value)}
                          placeholder="AB123456"
                          data-testid="input-buyer-passport"
                        />
                      </div>
                      <div>
                        <Label htmlFor="buyer-nationality">Nacionalidad *</Label>
                        <Select
                          value={buyerNationality}
                          onValueChange={setBuyerNationality}
                        >
                          <SelectTrigger id="buyer-nationality" data-testid="select-buyer-nationality">
                            <SelectValue placeholder="Selecciona nacionalidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {nationalities?.map((nat) => (
                              <SelectItem key={nat.key} value={nat.value}>
                                {nat.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="buyer-airport">Aeropuerto de Salida *</Label>
                      <Input
                        id="buyer-airport"
                        value={buyerDepartureAirport}
                        onChange={(e) => setBuyerDepartureAirport(e.target.value)}
                        placeholder="Ej: Aeropuerto Internacional de Las Américas (SDQ)"
                        data-testid="input-buyer-airport"
                        />
                    </div>
                  </CardContent>
                </Card>

                {/* Datos de Pasajeros */}
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-4">Información de Pasajeros</h3>
                </div>
                {passengers.map((passenger, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>Pasajero {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor={`name-${index}`}>Nombre Completo</Label>
                        <Input
                          id={`name-${index}`}
                          value={passenger.name}
                          onChange={(e) =>
                            handlePassengerChange(index, "name", e.target.value)
                          }
                          data-testid={`input-passenger-name-${index}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`passport-${index}`}>
                            Número de Pasaporte
                          </Label>
                          <Input
                            id={`passport-${index}`}
                            value={passenger.passportNumber}
                            onChange={(e) =>
                              handlePassengerChange(
                                index,
                                "passportNumber",
                                e.target.value
                              )
                            }
                            data-testid={`input-passenger-passport-${index}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`nationality-${index}`}>
                            Nacionalidad
                          </Label>
                          <Select
                            value={passenger.nationality}
                            onValueChange={(value) =>
                              handlePassengerChange(index, "nationality", value)
                            }
                          >
                            <SelectTrigger id={`nationality-${index}`} data-testid={`select-passenger-nationality-${index}`}>
                              <SelectValue placeholder="Selecciona nacionalidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {nationalities?.map((nat) => (
                                <SelectItem key={nat.key} value={nat.value}>
                                  {nat.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Fecha de Nacimiento</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={passenger.dateOfBirth.split('-')[2] || ""}
                            onValueChange={(day) => {
                              const [year, month] = passenger.dateOfBirth.split('-');
                              const newDate = `${year || new Date().getFullYear()}-${month || '01'}-${day.padStart(2, '0')}`;
                              handlePassengerChange(index, "dateOfBirth", newDate);
                            }}
                          >
                            <SelectTrigger data-testid={`select-passenger-dob-day-${index}`}>
                              <SelectValue placeholder="Día" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={passenger.dateOfBirth.split('-')[1] || ""}
                            onValueChange={(month) => {
                              const [year, , day] = passenger.dateOfBirth.split('-');
                              const newDate = `${year || new Date().getFullYear()}-${month.padStart(2, '0')}-${day || '01'}`;
                              handlePassengerChange(index, "dateOfBirth", newDate);
                            }}
                          >
                            <SelectTrigger data-testid={`select-passenger-dob-month-${index}`}>
                              <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                { value: "01", label: "Enero" },
                                { value: "02", label: "Febrero" },
                                { value: "03", label: "Marzo" },
                                { value: "04", label: "Abril" },
                                { value: "05", label: "Mayo" },
                                { value: "06", label: "Junio" },
                                { value: "07", label: "Julio" },
                                { value: "08", label: "Agosto" },
                                { value: "09", label: "Septiembre" },
                                { value: "10", label: "Octubre" },
                                { value: "11", label: "Noviembre" },
                                { value: "12", label: "Diciembre" },
                              ].map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={passenger.dateOfBirth.split('-')[0] || ""}
                            onValueChange={(year) => {
                              const [, month, day] = passenger.dateOfBirth.split('-');
                              const newDate = `${year}-${month || '01'}-${day || '01'}`;
                              handlePassengerChange(index, "dateOfBirth", newDate);
                            }}
                          >
                            <SelectTrigger data-testid={`select-passenger-dob-year-${index}`}>
                              <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {passengers.map((passenger, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>
                        Documento de Pasaporte - {passenger.name || `Pasajero ${index + 1}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor={`passport-file-${index}`}>
                          Subir Imagen de Pasaporte
                        </Label>
                        <Input
                          id={`passport-file-${index}`}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handlePassportUpload(index, e)}
                          data-testid={`input-passenger-passport-file-${index}`}
                        />
                        {passenger.passportImageUrl && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ Pasaporte subido exitosamente
                          </p>
                        )}
                      </div>
                      {passenger.passportImageUrl && passenger.passportImageUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
                        <div className="border rounded-lg p-2">
                          <img
                            src={passenger.passportImageUrl}
                            alt={`Pasaporte de ${passenger.name}`}
                            className="max-w-full h-auto rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Reserva</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Información del Tour y Salida */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">Detalles del Tour</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Tour:</span>
                          <span className="font-semibold">{tour.title}</span>
                        </div>
                        {(() => {
                          const selectedDeparture = departures?.find(d => d.id === selectedDepartureId);
                          if (selectedDeparture) {
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-sm">Fecha de salida:</span>
                                  <span className="font-semibold">
                                    {format(new Date(selectedDeparture.departureDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                                  </span>
                                </div>
                                {selectedDeparture.returnDate && (
                                  <div className="flex justify-between">
                                    <span className="text-sm">Fecha de regreso:</span>
                                    <span className="font-semibold">
                                      {format(new Date(selectedDeparture.returnDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          }
                          return null;
                        })()}
                        <div className="flex justify-between">
                          <span className="text-sm">Ubicación:</span>
                          <span className="font-semibold">{tour.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Duración:</span>
                          <span className="font-semibold">{tour.duration}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Información del Comprador */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">Datos del Comprador</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Nombre:</span>
                          <span className="font-semibold">{buyerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Email:</span>
                          <span className="font-semibold">{buyerEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Teléfono:</span>
                          <span className="font-semibold">{buyerPhone}</span>
                        </div>
                        {buyerPassportNumber && (
                          <div className="flex justify-between">
                            <span className="text-sm">Pasaporte:</span>
                            <span className="font-semibold">{buyerPassportNumber}</span>
                          </div>
                        )}
                        {buyerNationality && (
                          <div className="flex justify-between">
                            <span className="text-sm">Nacionalidad:</span>
                            <span className="font-semibold">{buyerNationality}</span>
                          </div>
                        )}
                        {buyerDepartureAirport && (
                          <div className="flex justify-between">
                            <span className="text-sm">Aeropuerto de salida:</span>
                            <span className="font-semibold">{buyerDepartureAirport}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Lista de Pasajeros */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">
                        Pasajeros ({numPassengers})
                      </h4>
                      <div className="space-y-4">
                        {passengers.map((passenger, index) => (
                          <Card key={index} className="bg-muted/50">
                            <CardContent className="pt-4 space-y-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Pasajero {index + 1}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Nombre:</span>
                                  <p className="font-medium">{passenger.name}</p>
                                </div>
                                {passenger.dateOfBirth && (
                                  <div>
                                    <span className="text-muted-foreground">Fecha de nacimiento:</span>
                                    <p className="font-medium">
                                      {format(new Date(passenger.dateOfBirth), "dd/MM/yyyy")}
                                    </p>
                                  </div>
                                )}
                                {passenger.nationality && (
                                  <div>
                                    <span className="text-muted-foreground">Nacionalidad:</span>
                                    <p className="font-medium">{passenger.nationality}</p>
                                  </div>
                                )}
                                {passenger.passportNumber && (
                                  <div>
                                    <span className="text-muted-foreground">Pasaporte:</span>
                                    <p className="font-medium">{passenger.passportNumber}</p>
                                  </div>
                                )}
                                {passenger.passportImageUrl && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Documento:</span>
                                    <p className="font-medium text-green-600">✓ Cargado</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Desglose de Precios */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">Desglose de Precios</h4>
                      <div className="space-y-2">
                        {(() => {
                          const selectedDeparture = departures?.find(d => d.id === selectedDepartureId);
                          const pricePerPerson = selectedDeparture ? parseFloat(selectedDeparture.price) : 0;
                          const totalPrice = pricePerPerson * numPassengers;
                          
                          return (
                            <>
                              <div className="flex justify-between text-sm">
                                <span>Precio por persona:</span>
                                <span className="font-semibold">${pricePerPerson.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Número de pasajeros:</span>
                                <span className="font-semibold">{numPassengers}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between text-lg font-bold pt-2">
                                <span>Total a Pagar:</span>
                                <span className="text-primary">${totalPrice.toFixed(2)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} data-testid="button-next">
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitBooking}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-submit-booking"
            >
              Confirmar Reserva
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
