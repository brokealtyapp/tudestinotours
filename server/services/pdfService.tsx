import React from 'react';
import ReactPDF, { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { Reservation, Tour, Passenger, PaymentInstallment, User, Departure, SystemSetting } from '@shared/schema';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 5,
  },
  companyTagline: {
    fontSize: 12,
    color: '#2563eb',
    marginBottom: 10,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
    marginBottom: 5,
  },
  documentSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '40%',
    color: '#64748b',
    fontSize: 9,
  },
  value: {
    width: '60%',
    color: '#1e293b',
    fontSize: 9,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    padding: 8,
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottom: '1 solid #e2e8f0',
    padding: 8,
    fontSize: 9,
  },
  tableCol1: { width: '10%' },
  tableCol2: { width: '30%' },
  tableCol3: { width: '20%' },
  tableCol4: { width: '20%' },
  tableCol5: { width: '20%' },
  totalRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #2563eb',
  },
  totalLabel: {
    width: '60%',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    width: '40%',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  highlight: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  itineraryItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderLeft: '3 solid #2563eb',
  },
});

interface InvoiceData {
  reservation: Reservation;
  tour: Tour;
  passengers: Passenger[];
  installments: PaymentInstallment[];
  user: User;
}

const InvoiceDocument = ({ reservation, tour, passengers, installments, user }: InvoiceData) => {
  const totalPaid = installments
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amountDue), 0);
  
  const pendingAmount = Number(reservation.totalPrice) - totalPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>Tu Destino Tours</Text>
          <Text style={styles.companyTagline}>Tu próxima aventura comienza aquí</Text>
          <Text style={styles.documentTitle}>FACTURA / RECIBO</Text>
          <Text style={styles.documentSubtitle}>Nº de Reserva: {reservation.id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{user.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Reserva:</Text>
            <Text style={styles.value}>
              {new Date(reservation.reservationDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Tour</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Destino:</Text>
            <Text style={styles.value}>{tour.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Continente:</Text>
            <Text style={styles.value}>{tour.continent || 'No especificado'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duración:</Text>
            <Text style={styles.value}>{tour.duration}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Salida:</Text>
            <Text style={styles.value}>
              {new Date(reservation.departureDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Número de Pasajeros:</Text>
            <Text style={styles.value}>{reservation.numberOfPassengers}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lista de Pasajeros</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>#</Text>
              <Text style={styles.tableCol2}>Nombre Completo</Text>
              <Text style={styles.tableCol3}>Fecha Nac.</Text>
              <Text style={styles.tableCol4}>Pasaporte</Text>
              <Text style={styles.tableCol5}>Nacionalidad</Text>
            </View>
            {passengers.map((passenger, index) => (
              <View key={passenger.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.tableCol1}>{index + 1}</Text>
                <Text style={styles.tableCol2}>{passenger.fullName}</Text>
                <Text style={styles.tableCol3}>
                  {new Date(passenger.dateOfBirth).toLocaleDateString('es-ES')}
                </Text>
                <Text style={styles.tableCol4}>{passenger.passportNumber}</Text>
                <Text style={styles.tableCol5}>{passenger.nationality}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cronograma de Pagos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>#</Text>
              <Text style={styles.tableCol2}>Descripción</Text>
              <Text style={styles.tableCol3}>Fecha Límite</Text>
              <Text style={styles.tableCol4}>Monto</Text>
              <Text style={styles.tableCol5}>Estado</Text>
            </View>
            {installments.map((inst, index) => (
              <View key={inst.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.tableCol1}>{inst.installmentNumber}</Text>
                <Text style={styles.tableCol2}>{inst.description}</Text>
                <Text style={styles.tableCol3}>
                  {new Date(inst.dueDate).toLocaleDateString('es-ES')}
                </Text>
                <Text style={styles.tableCol4}>${Number(inst.amountDue).toFixed(2)}</Text>
                <Text style={styles.tableCol5}>
                  {inst.status === 'paid' ? '✓ Pagado' : 'Pendiente'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total del Tour:</Text>
            <Text style={styles.totalValue}>${Number(reservation.totalPrice).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pagado:</Text>
            <Text style={[styles.totalValue, { color: '#16a34a' }]}>
              ${totalPaid.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Saldo Pendiente:</Text>
            <Text style={[styles.totalValue, { color: pendingAmount > 0 ? '#d97706' : '#16a34a' }]}>
              ${pendingAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {pendingAmount > 0 && (
          <View style={styles.highlight}>
            <Text style={{ fontSize: 9, color: '#92400e' }}>
              * Recuerde completar los pagos pendientes antes de la fecha límite para confirmar su reserva.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Tu Destino Tours | Email: info@tudestinotours.com | Tel: +1 (555) 123-4567</Text>
          <Text>Documento generado el {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</Text>
        </View>
      </Page>
    </Document>
  );
};

interface ItineraryData {
  reservation: Reservation;
  tour: Tour;
  passengers: Passenger[];
  user: User;
}

const ItineraryDocument = ({ reservation, tour, passengers, user }: ItineraryData) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>Tu Destino Tours</Text>
          <Text style={styles.companyTagline}>Tu próxima aventura comienza aquí</Text>
          <Text style={styles.documentTitle}>ITINERARIO DE VIAJE</Text>
          <Text style={styles.documentSubtitle}>{tour.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Viaje</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nº de Reserva:</Text>
            <Text style={styles.value}>{reservation.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Destino:</Text>
            <Text style={styles.value}>{tour.continent || 'No especificado'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Salida:</Text>
            <Text style={styles.value}>
              {new Date(reservation.departureDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duración:</Text>
            <Text style={styles.value}>{tour.duration}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Titular</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{user.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total de Pasajeros:</Text>
            <Text style={styles.value}>{reservation.numberOfPassengers}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lista de Pasajeros</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: '5%' }}>#</Text>
              <Text style={{ width: '35%' }}>Nombre Completo</Text>
              <Text style={{ width: '25%' }}>Nº Pasaporte</Text>
              <Text style={{ width: '20%' }}>Nacionalidad</Text>
              <Text style={{ width: '15%' }}>Fecha Nac.</Text>
            </View>
            {passengers.map((passenger, index) => (
              <View key={passenger.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={{ width: '5%' }}>{index + 1}</Text>
                <Text style={{ width: '35%' }}>{passenger.fullName}</Text>
                <Text style={{ width: '25%' }}>{passenger.passportNumber}</Text>
                <Text style={{ width: '20%' }}>{passenger.nationality}</Text>
                <Text style={{ width: '15%' }}>
                  {new Date(passenger.dateOfBirth).toLocaleDateString('es-ES')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción del Tour</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#475569' }}>
            {tour.description}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Importante</Text>
          <View style={styles.itineraryItem}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>
              Documentación Requerida
            </Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>
              • Pasaporte válido con al menos 6 meses de vigencia{'\n'}
              • Visa de turista (si aplica según nacionalidad){'\n'}
              • Comprobante de reserva de hotel{'\n'}
              • Seguro de viaje (recomendado)
            </Text>
          </View>

          <View style={styles.itineraryItem}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>
              Punto de Encuentro
            </Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>
              Los detalles específicos del punto de encuentro y hora de salida se enviarán por correo electrónico 48 horas antes de la fecha de salida.
            </Text>
          </View>

          <View style={styles.itineraryItem}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>
              Qué Llevar
            </Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>
              • Ropa cómoda y apropiada para el clima{'\n'}
              • Calzado cómodo para caminar{'\n'}
              • Protector solar y sombrero{'\n'}
              • Cámara fotográfica{'\n'}
              • Medicamentos personales
            </Text>
          </View>

          <View style={styles.itineraryItem}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>
              Políticas de Cancelación
            </Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>
              • Cancelación con más de 30 días: Reembolso del 100%{'\n'}
              • Cancelación entre 15-30 días: Reembolso del 50%{'\n'}
              • Cancelación con menos de 15 días: Sin reembolso{'\n'}
              • No-show: Sin reembolso
            </Text>
          </View>
        </View>

        <View style={styles.highlight}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#92400e', marginBottom: 4 }}>
            Contacto de Emergencia
          </Text>
          <Text style={{ fontSize: 9, color: '#92400e' }}>
            Durante su viaje, puede contactarnos 24/7 al: +1 (555) 123-4567{'\n'}
            Email: emergencias@tudestinotours.com
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>¡Que disfrute su viaje! - Tu Destino Tours</Text>
          <Text>www.tudestinotours.com | info@tudestinotours.com</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const stream = await ReactPDF.renderToStream(<InvoiceDocument {...data} />);
  const chunks: Uint8Array[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export async function generateItineraryPDF(data: ItineraryData): Promise<Buffer> {
  const stream = await ReactPDF.renderToStream(<ItineraryDocument {...data} />);
  const chunks: Uint8Array[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Tour Brochure PDF (Marketing Material)
interface TourBrochureData {
  tour: Tour;
  departures?: Departure[];
  agencyConfig?: {
    name: string;
    tagline: string;
    logoUrl?: string;
    website: string;
    email: string;
    phone: string;
    emergencyPhone?: string;
  };
  tourUrl?: string;
  qrCodeDataUrl?: string;
}

const TourBrochureDocument = ({ tour, departures = [], agencyConfig, tourUrl, qrCodeDataUrl }: TourBrochureData) => {
  const faqs = tour.faqs as Array<{question: string; answer: string}> | null;
  const itinerary = tour.itinerary as Array<{day: string; title: string; description: string; image?: string}> | null;
  
  // Calculate minimum price from active departures
  const minPrice = departures.length > 0 
    ? Math.min(...departures.map(d => Number(d.price)))
    : null;
  
  // Agency defaults
  const agencyName = agencyConfig?.name || 'Tu Destino Tours';
  const agencyTagline = agencyConfig?.tagline || 'Tu próxima aventura comienza aquí';
  const agencyWebsite = agencyConfig?.website || 'www.tudestinotours.com';
  const agencyEmail = agencyConfig?.email || 'info@tudestinotours.com';
  const agencyPhone = agencyConfig?.phone || '+1 (555) 123-4567';
  
  // Get up to 3 images for gallery (excluding first which is hero)
  const galleryImages = tour.images && tour.images.length > 1 
    ? tour.images.slice(1, 4) 
    : [];
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          {agencyConfig?.logoUrl ? (
            <View style={{ alignItems: 'flex-start', marginBottom: 5 }}>
              <Image 
                src={agencyConfig.logoUrl} 
                style={{ width: 120, height: 60, objectFit: 'contain', marginBottom: 5 }}
              />
              <Text style={styles.companyTagline}>{agencyTagline}</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.companyName}>{agencyName}</Text>
              <Text style={styles.companyTagline}>{agencyTagline}</Text>
            </View>
          )}
        </View>

        {/* Hero Image */}
        {tour.images && tour.images.length > 0 && tour.images[0] && (
          <View style={{ marginBottom: 15 }}>
            <Image 
              src={tour.images[0]} 
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 4 }}
            />
          </View>
        )}

        {/* Title and Subtitle */}
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.documentTitle}>{tour.title}</Text>
          <Text style={styles.documentSubtitle}>{tour.continent || 'Destino internacional'}</Text>
        </View>

        {/* Rating and Reviews */}
        {tour.rating && tour.reviewCount && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 10, color: '#f59e0b', marginRight: 5 }}>
              {'★'.repeat(Math.round(Number(tour.rating)))}{'☆'.repeat(5 - Math.round(Number(tour.rating)))}
            </Text>
            <Text style={{ fontSize: 9, color: '#64748b' }}>
              {Number(tour.rating).toFixed(1)} ({tour.reviewCount} reseñas)
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={[styles.highlight, { backgroundColor: '#dbeafe', padding: 12, marginBottom: 15 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 10, color: '#1e40af', marginBottom: 2 }}>Precio por persona:</Text>
              {minPrice !== null ? (
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#dc2626' }}>
                  Desde ${minPrice.toFixed(2)}
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                  Consultar salidas disponibles
                </Text>
              )}
            </View>
            {qrCodeDataUrl && (
              <View style={{ alignItems: 'center' }}>
                <Image src={qrCodeDataUrl} style={{ width: 60, height: 60 }} />
                <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>Reserva Online</Text>
              </View>
            )}
          </View>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.6, color: '#475569' }}>
            {tour.description}
          </Text>
        </View>

        {/* Key Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Tour</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Duración:</Text>
            <Text style={styles.value}>{tour.duration}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Continente:</Text>
            <Text style={styles.value}>{tour.continent || 'No especificado'}</Text>
          </View>
          {departures.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Salidas disponibles:</Text>
              <Text style={styles.value}>{departures.length} fecha(s)</Text>
            </View>
          )}
        </View>

        {/* Itinerary with Images */}
        {itinerary && itinerary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itinerario</Text>
            {itinerary.map((day, index) => (
              <View key={index} style={{ marginBottom: 12 }}>
                {day.image && (
                  <Image 
                    src={day.image} 
                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, marginBottom: 6 }}
                  />
                )}
                <View style={styles.itineraryItem}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#2563eb' }}>
                    Día {index + 1}: {day.title}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#475569', lineHeight: 1.5 }}>
                    {day.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* What's Included */}
        {tour.includes && tour.includes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qué Incluye</Text>
            {tour.includes.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={{ fontSize: 9, color: '#059669', marginRight: 5 }}>✓</Text>
                <Text style={{ fontSize: 9, color: '#475569', flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* What's NOT Included */}
        {tour.excludes && tour.excludes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qué NO Incluye</Text>
            {tour.excludes.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={{ fontSize: 9, color: '#dc2626', marginRight: 5 }}>✗</Text>
                <Text style={{ fontSize: 9, color: '#475569', flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cancellation Policy */}
        {tour.cancellationPolicy && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Política de Cancelación</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#475569' }}>
              {tour.cancellationPolicy}
            </Text>
          </View>
        )}

        {/* Requirements */}
        {tour.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requisitos</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#475569' }}>
              {tour.requirements}
            </Text>
          </View>
        )}

        {/* Photo Gallery */}
        {galleryImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Galería de Fotos</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              {galleryImages.filter(img => img && img.length > 0).map((image, index) => (
                <Image 
                  key={index}
                  src={image} 
                  style={{ 
                    width: galleryImages.length === 1 ? '100%' : '48%', 
                    height: 100, 
                    objectFit: 'cover', 
                    borderRadius: 4,
                    marginBottom: 8
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* FAQs */}
        {faqs && faqs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
            {faqs.map((faq, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e293b', marginBottom: 3 }}>
                  {faq.question}
                </Text>
                <Text style={{ fontSize: 9, color: '#475569', lineHeight: 1.4 }}>
                  {faq.answer}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Call to Action */}
        <View style={styles.highlight}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#92400e', marginBottom: 4 }}>
            ¿Listo para reservar?
          </Text>
          <Text style={{ fontSize: 9, color: '#92400e' }}>
            {tourUrl 
              ? `Escanea el código QR o visita: ${tourUrl}` 
              : `Visita ${agencyWebsite} o contáctanos para más información y disponibilidad de fechas.`
            }
          </Text>
        </View>

        {/* Footer with Dynamic Contact Info */}
        <View style={styles.footer}>
          <Text>{agencyName} | {agencyWebsite}</Text>
          <Text>Email: {agencyEmail} | Tel: {agencyPhone}</Text>
          {agencyConfig?.emergencyPhone && (
            <Text>Emergencias 24/7: {agencyConfig.emergencyPhone}</Text>
          )}
          <Text style={{ marginTop: 4, fontSize: 7 }}>
            Documento generado el {new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateTourBrochurePDF(data: TourBrochureData): Promise<Buffer> {
  const stream = await ReactPDF.renderToStream(<TourBrochureDocument {...data} />);
  const chunks: Uint8Array[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
