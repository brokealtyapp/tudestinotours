import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, MapPin } from "lucide-react";

export default function CitiesManagement() {
  const { toast } = useToast();
  const [newCity, setNewCity] = useState("");
  
  const { data: configData } = useQuery<any[]>({ queryKey: ["/api/config"] });
  
  const availableCities = configData?.find(c => c.key === 'AVAILABLE_CITIES');
  const cities: string[] = availableCities ? JSON.parse(availableCities.value) : [];

  const updateMutation = useMutation({
    mutationFn: async (updatedCities: string[]) => {
      return apiRequest("POST", "/api/config", {
        key: "AVAILABLE_CITIES",
        value: JSON.stringify(updatedCities),
        description: "Ciudades disponibles para tours"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      toast({
        title: "Éxito",
        description: "Ciudades actualizadas correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar las ciudades",
      });
    },
  });

  const handleAddCity = () => {
    if (!newCity.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de la ciudad no puede estar vacío",
      });
      return;
    }

    if (cities.includes(newCity.trim())) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Esta ciudad ya existe",
      });
      return;
    }

    const updatedCities = [...cities, newCity.trim()];
    updateMutation.mutate(updatedCities);
    setNewCity("");
  };

  const handleRemoveCity = (cityToRemove: string) => {
    const updatedCities = cities.filter(city => city !== cityToRemove);
    updateMutation.mutate(updatedCities);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Gestión de Ciudades
        </CardTitle>
        <CardDescription>
          Administra las ciudades disponibles para seleccionar al crear tours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="Nombre de la ciudad"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCity();
              }
            }}
            data-testid="input-new-city"
          />
          <Button 
            onClick={handleAddCity}
            disabled={updateMutation.isPending}
            data-testid="button-add-city"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {cities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay ciudades configuradas. Agrega la primera ciudad.
            </p>
          ) : (
            cities.map((city) => (
              <Badge
                key={city}
                variant="secondary"
                className="px-3 py-1.5 gap-2"
                data-testid={`badge-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {city}
                <button
                  onClick={() => handleRemoveCity(city)}
                  className="hover:text-destructive transition-colors"
                  data-testid={`button-remove-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Total: {cities.length} {cities.length === 1 ? 'ciudad' : 'ciudades'}
        </p>
      </CardContent>
    </Card>
  );
}
