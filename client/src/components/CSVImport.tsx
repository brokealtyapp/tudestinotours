import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CSVRow {
  // Buyer info
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerPassportNumber?: string;
  buyerNationality?: string;
  buyerDepartureAirport?: string;
  
  // Reservation info
  departureId: string;
  
  // Passenger info
  passengerFullName: string;
  passengerPassportNumber: string;
  passengerNationality: string;
  passengerDateOfBirth: string;
}

interface ParsedReservation {
  buyer: {
    name: string;
    email: string;
    phone: string;
    passportNumber?: string;
    nationality?: string;
    departureAirport?: string;
  };
  departureId: string;
  passengers: Array<{
    fullName: string;
    passportNumber: string;
    nationality: string;
    dateOfBirth: string;
  }>;
}

export default function CSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReservation[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo CSV válido",
        variant: "destructive",
      });
      return;
    }

    setFile(file);
    
    // Parse CSV
    const text = await file.text();
    const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
    
    if (rows.length < 2) {
      toast({
        title: "Error",
        description: "El archivo CSV está vacío o no tiene datos",
        variant: "destructive",
      });
      return;
    }

    // Parse header
    const headers = rows[0].split(',').map(h => h.trim());
    
    // Required headers
    const requiredHeaders = [
      'buyerName', 'buyerEmail', 'buyerPhone',
      'departureId',
      'passengerFullName', 'passengerPassportNumber', 
      'passengerNationality', 'passengerDateOfBirth'
    ];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      toast({
        title: "Error en formato CSV",
        description: `Faltan columnas requeridas: ${missingHeaders.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Parse data rows
    const dataRows: CSVRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      dataRows.push(row as CSVRow);
    }

    // Group by buyer email + departureId to create reservations
    const reservationsMap = new Map<string, ParsedReservation>();
    
    for (const row of dataRows) {
      const key = `${row.buyerEmail}-${row.departureId}`;
      
      if (!reservationsMap.has(key)) {
        reservationsMap.set(key, {
          buyer: {
            name: row.buyerName,
            email: row.buyerEmail,
            phone: row.buyerPhone,
            passportNumber: row.buyerPassportNumber,
            nationality: row.buyerNationality,
            departureAirport: row.buyerDepartureAirport,
          },
          departureId: row.departureId,
          passengers: [],
        });
      }
      
      const reservation = reservationsMap.get(key)!;
      reservation.passengers.push({
        fullName: row.passengerFullName,
        passportNumber: row.passengerPassportNumber,
        nationality: row.passengerNationality,
        dateOfBirth: row.passengerDateOfBirth,
      });
    }

    setParsedData(Array.from(reservationsMap.values()));
    
    toast({
      title: "CSV Analizado",
      description: `Se encontraron ${reservationsMap.size} reservas con ${dataRows.length} pasajeros`,
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para importar",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      const response = await apiRequest('POST', '/api/reservations/bulk', parsedData);
      const result = await response.json();

      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      
      toast({
        title: "Importación Exitosa",
        description: `Se importaron ${result.created} reservas exitosamente`,
      });

      // Reset state
      setFile(null);
      setParsedData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Error al Importar",
        description: error.message || "Ocurrió un error al importar las reservas",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'buyerName', 'buyerEmail', 'buyerPhone', 
      'buyerPassportNumber', 'buyerNationality', 'buyerDepartureAirport',
      'departureId',
      'passengerFullName', 'passengerPassportNumber', 
      'passengerNationality', 'passengerDateOfBirth'
    ];
    
    const exampleRows = [
      [
        'Juan Pérez', 'juan@example.com', '+1234567890',
        'A12345678', 'México', 'MEX',
        'departure-id-here',
        'Juan Pérez', 'A12345678', 'México', '1990-01-15'
      ],
      [
        'Juan Pérez', 'juan@example.com', '+1234567890',
        'A12345678', 'México', 'MEX',
        'departure-id-here',
        'María Pérez', 'B98765432', 'México', '1992-05-20'
      ]
    ];
    
    const csv = [headers.join(','), ...exampleRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-reservas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importación Masiva de Reservas</CardTitle>
        <CardDescription>
          Importa múltiples reservas desde un archivo CSV. Ideal para grupos grandes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template Button */}
        <div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            data-testid="button-download-csv-template"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar Plantilla CSV
          </Button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="hidden"
            data-testid="input-csv-file"
          />
          
          <div className="flex flex-col items-center gap-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Arrastra tu archivo CSV aquí, o{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline"
                  data-testid="button-select-file"
                >
                  selecciona un archivo
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formato CSV con columnas: buyerName, buyerEmail, buyerPhone, departureId, etc.
              </p>
            </div>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          )}
        </div>

        {/* Preview */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Vista Previa</h3>
              <span className="text-sm text-muted-foreground">
                {parsedData.length} reservas, {parsedData.reduce((sum, r) => sum + r.passengers.length, 0)} pasajeros
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {parsedData.slice(0, 5).map((reservation, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <p className="font-medium">{reservation.buyer.name}</p>
                      <p className="text-muted-foreground">{reservation.buyer.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reservation.passengers.length} pasajero(s)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {parsedData.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... y {parsedData.length - 5} reservas más
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full"
              data-testid="button-import-csv"
            >
              {importing ? 'Importando...' : `Importar ${parsedData.length} Reservas`}
            </Button>
          </div>
        )}

        {parsedData.length === 0 && file && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              No se pudieron analizar datos del archivo. Verifica el formato.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
