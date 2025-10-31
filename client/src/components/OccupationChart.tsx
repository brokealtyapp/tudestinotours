import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DepartureOccupation {
  tourName: string;
  departureDate: string;
  occupiedSeats: number;
  maxSeats: number;
  occupationPercentage: number;
}

interface OccupationChartProps {
  data: DepartureOccupation[];
}

export default function OccupationChart({ data }: OccupationChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay salidas programadas próximamente
      </div>
    );
  }

  const getOccupationColor = (percentage: number) => {
    if (percentage >= 70) return "bg-green-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getOccupationLabel = (percentage: number) => {
    if (percentage >= 70) return "Alta";
    if (percentage >= 40) return "Media";
    return "Baja";
  };

  return (
    <div className="space-y-4" data-testid="component-occupation-chart">
      {data.map((departure, index) => {
        const color = getOccupationColor(departure.occupationPercentage);
        const label = getOccupationLabel(departure.occupationPercentage);

        return (
          <div key={index} className="space-y-2" data-testid={`occupation-item-${index}`}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" title={departure.tourName} data-testid={`text-tour-${index}`}>
                  {departure.tourName}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`text-date-${index}`}>
                  {format(new Date(departure.departureDate), "dd MMM yyyy", { locale: es })}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold" data-testid={`text-percentage-${index}`}>
                  {departure.occupationPercentage}%
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`text-seats-${index}`}>
                  {departure.occupiedSeats}/{departure.maxSeats} asientos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} transition-all`}
                  style={{ width: `${departure.occupationPercentage}%` }}
                  data-testid={`bar-occupation-${index}`}
                />
              </div>
              <span className="text-xs font-medium min-w-[3rem] text-right" data-testid={`label-status-${index}`}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
