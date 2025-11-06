import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Globe, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ContinentData {
  [continent: string]: string[];
}

export default function ContinentsManagement() {
  const { toast } = useToast();
  const [newContinent, setNewContinent] = useState("");
  const [newCity, setNewCity] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("");
  const [openContinents, setOpenContinents] = useState<Record<string, boolean>>({});
  
  const { data: configData } = useQuery<any[]>({ queryKey: ["/api/config"] });
  
  const continentsConfig = configData?.find(c => c.key === 'CONTINENTS_AND_CITIES');
  const continentsData: ContinentData = continentsConfig 
    ? JSON.parse(continentsConfig.value) 
    : {};

  const updateMutation = useMutation({
    mutationFn: async (updatedData: ContinentData) => {
      return apiRequest("POST", "/api/config", {
        key: "CONTINENTS_AND_CITIES",
        value: JSON.stringify(updatedData),
        description: "Continentes y ciudades disponibles para tours"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      toast({
        title: "Éxito",
        description: "Continentes y ciudades actualizados correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
      });
    },
  });

  const handleAddContinent = () => {
    if (!newContinent.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre del continente no puede estar vacío",
      });
      return;
    }

    if (continentsData[newContinent.trim()]) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Este continente ya existe",
      });
      return;
    }

    const updatedData = {
      ...continentsData,
      [newContinent.trim()]: []
    };
    updateMutation.mutate(updatedData);
    setNewContinent("");
  };

  const handleRemoveContinent = (continent: string) => {
    const { [continent]: removed, ...rest } = continentsData;
    updateMutation.mutate(rest);
  };

  const handleAddCity = () => {
    if (!selectedContinent) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Primero selecciona un continente",
      });
      return;
    }

    if (!newCity.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de la ciudad no puede estar vacío",
      });
      return;
    }

    const cities = continentsData[selectedContinent] || [];
    if (cities.includes(newCity.trim())) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Esta ciudad ya existe en este continente",
      });
      return;
    }

    const updatedData = {
      ...continentsData,
      [selectedContinent]: [...cities, newCity.trim()].sort()
    };
    updateMutation.mutate(updatedData);
    setNewCity("");
  };

  const handleRemoveCity = (continent: string, city: string) => {
    const cities = continentsData[continent] || [];
    const updatedCities = cities.filter(c => c !== city);
    const updatedData = {
      ...continentsData,
      [continent]: updatedCities
    };
    updateMutation.mutate(updatedData);
  };

  const toggleContinent = (continent: string) => {
    setOpenContinents(prev => ({
      ...prev,
      [continent]: !prev[continent]
    }));
  };

  const continents = Object.keys(continentsData).sort();
  const totalCities = Object.values(continentsData).reduce((sum, cities) => sum + cities.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Gestión de Continentes y Ciudades
        </CardTitle>
        <CardDescription>
          Organiza las ciudades por continentes para facilitar la navegación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold text-sm">Agregar Nuevo Continente</h3>
          <div className="flex gap-2">
            <Input
              value={newContinent}
              onChange={(e) => setNewContinent(e.target.value)}
              placeholder="Ej: América del Sur, Europa, Asia"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddContinent();
                }
              }}
              data-testid="input-new-continent"
            />
            <Button 
              onClick={handleAddContinent}
              disabled={updateMutation.isPending}
              data-testid="button-add-continent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {continents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay continentes configurados. Agrega el primer continente.
            </p>
          ) : (
            continents.map((continent) => (
              <Collapsible
                key={continent}
                open={openContinents[continent]}
                onOpenChange={() => toggleContinent(continent)}
              >
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-1 rounded-md -ml-2">
                        {openContinents[continent] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{continent}</span>
                        <Badge variant="secondary" className="ml-2">
                          {continentsData[continent].length} {continentsData[continent].length === 1 ? 'ciudad' : 'ciudades'}
                        </Badge>
                      </CollapsibleTrigger>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveContinent(continent)}
                        data-testid={`button-remove-continent-${continent.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex gap-2">
                        <Input
                          value={selectedContinent === continent ? newCity : ""}
                          onChange={(e) => {
                            setSelectedContinent(continent);
                            setNewCity(e.target.value);
                          }}
                          placeholder="Nombre de la ciudad"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setSelectedContinent(continent);
                              handleAddCity();
                            }
                          }}
                          onFocus={() => setSelectedContinent(continent)}
                          data-testid={`input-new-city-${continent.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedContinent(continent);
                            handleAddCity();
                          }}
                          disabled={updateMutation.isPending}
                          data-testid={`button-add-city-${continent.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {continentsData[continent].length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No hay ciudades. Agrega la primera.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {continentsData[continent].map((city) => (
                            <Badge
                              key={city}
                              variant="outline"
                              className="px-3 py-1.5 gap-2 bg-background"
                              data-testid={`badge-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <MapPin className="h-3 w-3" />
                              {city}
                              <button
                                onClick={() => handleRemoveCity(continent, city)}
                                className="hover:text-destructive transition-colors"
                                data-testid={`button-remove-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground border-t pt-4">
          <span>Total: {continents.length} {continents.length === 1 ? 'continente' : 'continentes'}</span>
          <span>•</span>
          <span>{totalCities} {totalCities === 1 ? 'ciudad' : 'ciudades'} en total</span>
        </div>
      </CardContent>
    </Card>
  );
}
