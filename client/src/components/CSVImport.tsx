import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, CheckCircle, AlertCircle, FileText, Eye, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CSVRow {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerPassportNumber?: string;
  buyerNationality?: string;
  buyerDepartureAirport?: string;
  departureId: string;
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

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidationResult {
  reservations: Array<{
    buyer: {
      name: string;
      email: string;
      phone: string;
    };
    departureId: string;
    passengerCount: number;
    tourTitle: string;
    departureDate: string;
    pricePerPassenger: string;
    totalPrice: string;
    availableSeats: number;
  }>;
  warnings: string[];
}

export default function CSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReservation[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^\+?[0-9]{7,15}$/.test(phone.replace(/[\s\-()]/g, ''));
  };

  const validateDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
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
    setValidationErrors([]);
    setValidationResult(null);
    setParsedData([]);
    setProgress(0);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const errors: ValidationError[] = [];
        const data = results.data as CSVRow[];
        
        if (data.length === 0) {
          toast({
            title: "Error",
            description: "El archivo CSV está vacío",
            variant: "destructive",
          });
          return;
        }

        const requiredHeaders = [
          'buyerName', 'buyerEmail', 'buyerPhone',
          'departureId',
          'passengerFullName', 'passengerPassportNumber', 
          'passengerNationality', 'passengerDateOfBirth'
        ];
        
        const headers = Object.keys(data[0]);
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          toast({
            title: "Error en formato CSV",
            description: `Faltan columnas requeridas: ${missingHeaders.join(', ')}`,
            variant: "destructive",
          });
          return;
        }

        // Validate each row
        const seenPassports = new Set<string>();
        data.forEach((row, index) => {
          const rowNum = index + 2; // +2 because of header and 0-indexing

          // Buyer validations
          if (!row.buyerName || row.buyerName.length < 2) {
            errors.push({ row: rowNum, field: 'buyerName', message: 'Nombre de comprador inválido' });
          }
          if (!row.buyerEmail || !validateEmail(row.buyerEmail)) {
            errors.push({ row: rowNum, field: 'buyerEmail', message: 'Email inválido' });
          }
          if (!row.buyerPhone || !validatePhone(row.buyerPhone)) {
            errors.push({ row: rowNum, field: 'buyerPhone', message: 'Teléfono inválido' });
          }

          // Departure validation
          if (!row.departureId || row.departureId.trim().length === 0) {
            errors.push({ row: rowNum, field: 'departureId', message: 'ID de salida requerido' });
          }

          // Passenger validations
          if (!row.passengerFullName || row.passengerFullName.length < 2) {
            errors.push({ row: rowNum, field: 'passengerFullName', message: 'Nombre de pasajero inválido' });
          }
          if (!row.passengerPassportNumber || row.passengerPassportNumber.trim().length === 0) {
            errors.push({ row: rowNum, field: 'passengerPassportNumber', message: 'Número de pasaporte requerido' });
          } else {
            // Check for duplicate passports
            const passportKey = row.passengerPassportNumber.trim().toUpperCase();
            if (seenPassports.has(passportKey)) {
              errors.push({ row: rowNum, field: 'passengerPassportNumber', message: `Pasaporte duplicado: ${row.passengerPassportNumber}` });
            }
            seenPassports.add(passportKey);
          }
          if (!row.passengerNationality || row.passengerNationality.trim().length === 0) {
            errors.push({ row: rowNum, field: 'passengerNationality', message: 'Nacionalidad requerida' });
          }
          if (!row.passengerDateOfBirth || !validateDate(row.passengerDateOfBirth)) {
            errors.push({ row: rowNum, field: 'passengerDateOfBirth', message: 'Fecha de nacimiento inválida (formato: YYYY-MM-DD)' });
          }
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
          toast({
            title: "Errores de Validación",
            description: `Se encontraron ${errors.length} errores. Revisa los detalles abajo.`,
            variant: "destructive",
          });
          return;
        }

        // Group by buyer email + departureId
        const reservationsMap = new Map<string, ParsedReservation>();
        
        for (const row of data) {
          const key = `${row.buyerEmail.trim().toLowerCase()}-${row.departureId.trim()}`;
          
          if (!reservationsMap.has(key)) {
            reservationsMap.set(key, {
              buyer: {
                name: row.buyerName.trim(),
                email: row.buyerEmail.trim().toLowerCase(),
                phone: row.buyerPhone.trim(),
                passportNumber: row.buyerPassportNumber?.trim(),
                nationality: row.buyerNationality?.trim(),
                departureAirport: row.buyerDepartureAirport?.trim(),
              },
              departureId: row.departureId.trim(),
              passengers: [],
            });
          }
          
          const reservation = reservationsMap.get(key)!;
          reservation.passengers.push({
            fullName: row.passengerFullName.trim(),
            passportNumber: row.passengerPassportNumber.trim(),
            nationality: row.passengerNationality.trim(),
            dateOfBirth: row.passengerDateOfBirth.trim(),
          });
        }

        setParsedData(Array.from(reservationsMap.values()));
        
        toast({
          title: "CSV Analizado Exitosamente",
          description: `Se encontraron ${reservationsMap.size} reservas con ${data.length} pasajeros`,
        });
      },
      error: (error) => {
        toast({
          title: "Error al Analizar CSV",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleValidate = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para validar",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    setProgress(0);

    try {
      const response = await apiRequest('POST', '/api/reservations/bulk/validate', parsedData);
      const result = await response.json();

      setValidationResult(result);
      setProgress(100);
      
      toast({
        title: "Validación Completa",
        description: `${result.reservations.length} reservas validadas correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error en Validación",
        description: error.message || "No se pudo validar las reservas",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
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
    setProgress(0);

    try {
      const response = await apiRequest('POST', '/api/reservations/bulk', parsedData);
      const result = await response.json();

      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      setProgress(100);
      
      toast({
        title: "Importación Exitosa",
        description: `Se importaron ${result.created} reservas exitosamente`,
      });

      // Reset state
      setFile(null);
      setParsedData([]);
      setValidationResult(null);
      setValidationErrors([]);
      setProgress(0);
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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Se encontraron {validationErrors.length} errores de validación</p>
                <p className="text-sm mt-1">Corrige estos errores antes de continuar</p>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {validationErrors.slice(0, 10).map((error, index) => (
                <div key={index} className="text-sm p-2 bg-muted rounded">
                  <span className="font-medium">Fila {error.row}:</span> {error.field} - {error.message}
                </div>
              ))}
              {validationErrors.length > 10 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ... y {validationErrors.length - 10} errores más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Parsed Data Summary */}
        {parsedData.length > 0 && validationErrors.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Datos Analizados</h3>
              <div className="flex gap-2">
                <Badge variant="outline">{parsedData.length} reservas</Badge>
                <Badge variant="outline">{parsedData.reduce((sum, r) => sum + r.passengers.length, 0)} pasajeros</Badge>
              </div>
            </div>

            {/* Validate Button */}
            {!validationResult && (
              <Button
                variant="outline"
                onClick={handleValidate}
                disabled={validating}
                className="w-full"
                data-testid="button-validate-csv"
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Vista Previa con Precios
                  </>
                )}
              </Button>
            )}

            {/* Validation Result */}
            {validationResult && (
              <div className="space-y-4">
                {validationResult.warnings.length > 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Advertencias</p>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                          {validationResult.warnings.map((warning, i) => (
                            <li key={i}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {validationResult.reservations.map((res, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{res.buyer.name}</p>
                              <p className="text-sm text-muted-foreground">{res.buyer.email}</p>
                            </div>
                            <Badge variant="outline">{res.passengerCount} pax</Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Tour:</span> {res.tourTitle}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Salida:</span> {new Date(res.departureDate).toLocaleDateString('es-ES')}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t">
                              <span className="text-muted-foreground">
                                ${res.pricePerPassenger} × {res.passengerCount}
                              </span>
                              <span className="font-semibold text-primary">
                                ${res.totalPrice}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {(importing || validating) && progress > 0 && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {importing ? 'Importando...' : 'Validando...'} {progress}%
                </p>
              </div>
            )}

            {/* Import Button */}
            {validationResult && (
              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full"
                data-testid="button-import-csv"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  `Importar ${parsedData.length} Reservas`
                )}
              </Button>
            )}
          </div>
        )}

        {parsedData.length === 0 && file && validationErrors.length === 0 && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">Analizando archivo...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
