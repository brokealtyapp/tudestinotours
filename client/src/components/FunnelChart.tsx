interface FunnelData {
  received: number;
  underReview: number;
  approved: number;
  partialPaid: number;
  paid: number;
}

interface FunnelChartProps {
  data: FunnelData;
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const total = data.received + data.underReview + data.approved + data.partialPaid + data.paid;
  
  if (total === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay datos de conversión disponibles
      </div>
    );
  }

  const stages = [
    { label: "Recibida", count: data.received, color: "bg-blue-500" },
    { label: "En Revisión", count: data.underReview, color: "bg-yellow-500" },
    { label: "Aprobada", count: data.approved, color: "bg-purple-500" },
    { label: "Pago Parcial", count: data.partialPaid, color: "bg-orange-500" },
    { label: "Pagada", count: data.paid, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-4" data-testid="component-funnel-chart">
      <div className="flex items-center h-12 rounded-lg overflow-hidden border">
        {stages.map((stage, index) => {
          const percentage = (stage.count / total) * 100;
          if (stage.count === 0) return null;
          
          return (
            <div
              key={stage.label}
              className={`${stage.color} h-full flex items-center justify-center text-white text-xs font-medium px-2 transition-all hover:opacity-80`}
              style={{ width: `${percentage}%` }}
              title={`${stage.label}: ${stage.count} (${percentage.toFixed(1)}%)`}
              data-testid={`funnel-segment-${index}`}
            >
              {percentage > 8 && (
                <span className="truncate">{stage.count}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stages.map((stage, index) => {
          const percentage = (stage.count / total) * 100;
          return (
            <div key={stage.label} className="flex items-center gap-2" data-testid={`funnel-legend-${index}`}>
              <div className={`w-3 h-3 rounded ${stage.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stage.label}</p>
                <p className="text-sm font-semibold">
                  {stage.count} <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
