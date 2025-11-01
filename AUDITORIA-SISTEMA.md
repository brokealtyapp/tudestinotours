# 🔍 AUDITORÍA COMPLETA DEL SISTEMA - Tu Destino Tours

**Fecha:** 1 de Noviembre, 2025  
**Auditor:** Sistema de Revisión Automatizado  
**Alcance:** Backend, Frontend, Base de Datos, Seguridad, Rendimiento

---

## 📋 RESUMEN EJECUTIVO

**Total de problemas encontrados:** 24  
**Críticos:** 3 🔴  
**Altos:** 7 🟠  
**Medios:** 10 🟡  
**Bajos:** 4 🟢  

---

## 🔴 PROBLEMAS CRÍTICOS (Requieren corrección inmediata)

### 1. **RACE CONDITION EN RESERVAS - RIESGO DE OVERBOOKING**
**Severidad:** CRÍTICA 🔴  
**Archivo:** `server/routes.ts` (líneas 607-620)  
**Descripción:**  
La creación de reservas NO utiliza transacciones de base de datos. Esto permite que múltiples peticiones concurrentes reserven los mismos cupos:

```typescript
// PROBLEMA: Estas 3 operaciones NO son atómicas
const reservation = await storage.createReservation({...}); // Línea 607
await storage.updateDepartureSeats(departure.id, validatedData.numberOfPassengers); // Línea 617
await storage.incrementReservedSeats(departure.tourId, validatedData.numberOfPassengers); // Línea 620
```

**Escenario de fallo:**
1. Usuario A verifica: 2 cupos disponibles ✅
2. Usuario B verifica: 2 cupos disponibles ✅ (al mismo tiempo)
3. Usuario A reserva 2 cupos → reservedSeats = 2
4. Usuario B reserva 2 cupos → reservedSeats = 4 (¡OVERBOOKING!)

**Impacto:** Pérdida de dinero, problemas operacionales, mala experiencia del cliente.

**Solución requerida:**
```typescript
// Usar transacciones de Drizzle
const reservation = await db.transaction(async (tx) => {
  // 1. Verificar y actualizar cupos (con lock)
  const departure = await tx.select()
    .from(departures)
    .where(eq(departures.id, departureId))
    .for('update'); // Bloqueo pesimista
  
  if (departure.reservedSeats + numberOfPassengers > departure.totalSeats) {
    throw new Error('No hay cupos disponibles');
  }
  
  // 2. Crear reserva
  const newReservation = await tx.insert(reservations).values({...}).returning();
  
  // 3. Actualizar cupos
  await tx.update(departures)
    .set({ reservedSeats: departure.reservedSeats + numberOfPassengers })
    .where(eq(departures.id, departureId));
    
  return newReservation[0];
});
```

---

### 2. **RACE CONDITION EN CANCELACIONES - LIBERACIÓN DE CUPOS**
**Severidad:** CRÍTICA 🔴  
**Archivo:** `server/routes.ts` (líneas 674-689)  
**Descripción:**  
Al cancelar reservas, la liberación de cupos tampoco usa transacciones:

```typescript
if (status === "cancelled" || status === "cancelada" || status === "vencida") {
  await storage.updateDepartureSeats(
    currentReservation.departureId,
    -currentReservation.numberOfPassengers
  ); // NO atómico con el update de status
  
  await storage.decrementReservedSeats(
    currentReservation.tourId,
    currentReservation.numberOfPassengers
  );
}
```

**Impacto:** Posibles inconsistencias en el conteo de cupos disponibles.

---

### 3. **SCHEDULER: CANCELACIONES AUTOMÁTICAS SIN TRANSACCIÓN**
**Severidad:** CRÍTICA 🔴  
**Archivo:** `server/jobs/scheduler.ts` (líneas 179-188)  
**Descripción:**  
Las cancelaciones automáticas liberan cupos sin transacción:

```typescript
await storage.updateReservationAutomationFields(reservation.id, {
  status: "cancelada",
});

// PROBLEMA: Si falla aquí, la reserva quedó cancelada pero los cupos no se liberaron
await storage.decrementReservedSeats(
  reservation.tourId,
  reservation.numberOfPassengers
);
```

**Impacto:** Pérdida de cupos disponibles, problemas de integridad de datos.

---

## 🟠 PROBLEMAS ALTOS (Deben corregirse pronto)

### 4. **FALTA VALIDACIÓN DE USUARIOS INACTIVOS**
**Severidad:** ALTA 🟠  
**Archivo:** `server/auth.ts`, `server/routes.ts`  
**Descripción:**  
El campo `active` en usuarios existe pero NO se valida en el login:

```typescript
// server/routes.ts línea 157
const user = await storage.getUserByEmail(email);
if (!user) {
  return res.status(401).json({ error: "Credenciales inválidas" });
}
// FALTA: if (!user.active) { return res.status(403).json({ error: "Cuenta desactivada" }); }
```

**Impacto:** Usuarios desactivados pueden seguir accediendo al sistema.

---

### 5. **ENDPOINT DE CREACIÓN DE RESERVAS SIN AUTENTICACIÓN**
**Severidad:** ALTA 🟠  
**Archivo:** `server/routes.ts` (línea 562)  
**Descripción:**  
```typescript
app.post("/api/reservations", async (req: Request, res: Response) => {
  // NO usa authenticateToken
```

**Justificación existente:** Permite reservas anónimas.  
**Problema:** Sin rate limiting, puede ser abusado para:
- Spam de reservas
- Bloqueo de cupos malicioso
- DoS del sistema

**Solución:** Implementar rate limiting por IP:
```typescript
import rateLimit from 'express-rate-limit';

const reservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 reservas por IP
  message: 'Demasiadas reservas desde esta IP, intente más tarde'
});

app.post("/api/reservations", reservationLimiter, async (req, res) => {...});
```

---

### 6. **FALTA VALIDACIÓN DE LÍMITES EN FILE UPLOADS**
**Severidad:** ALTA 🟠  
**Archivo:** `server/routes.ts` (líneas 67-76, 95-109)  
**Descripción:**  
Los endpoints de upload NO validan:
- ❌ Tamaño máximo de archivo
- ❌ Tipo de archivo (MIME type)
- ❌ Extensión de archivo

```typescript
app.post("/api/objects/upload", async (req: Request, res: Response) => {
  // FALTA: Validación de tipo de archivo, tamaño, etc.
  const uploadURL = await objectStorageService.getObjectEntityUploadURL();
  res.json({ uploadURL });
});
```

**Impacto:** 
- Usuarios pueden subir archivos ejecutables maliciosos
- Posible llenado del storage con archivos gigantes
- Vulnerabilidades XSS si se sirven archivos HTML

**Solución:**
```typescript
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Validar antes de generar URL
if (!ALLOWED_EXTENSIONS.some(ext => filename.endsWith(ext))) {
  return res.status(400).json({ error: 'Tipo de archivo no permitido' });
}
```

---

### 7. **EXPOSICIÓN DE INFORMACIÓN SENSIBLE EN ERRORES**
**Severidad:** ALTA 🟠  
**Archivo:** Múltiples archivos  
**Descripción:**  
Los mensajes de error exponen detalles internos:

```typescript
catch (error: any) {
  res.status(400).json({ error: error.message }); // Expone stack traces
}
```

**Impacto:** Los atacantes pueden obtener información sobre la estructura interna.

**Solución:**
```typescript
catch (error: any) {
  console.error('[BOOKING] Error:', error); // Log interno
  res.status(500).json({ error: 'Error procesando la solicitud' }); // Mensaje genérico
}
```

---

### 8. **FALTA ÍNDICES EN BASE DE DATOS**
**Severidad:** ALTA 🟠  
**Archivo:** `shared/schema.ts`  
**Descripción:**  
NO hay índices definidos para queries frecuentes:

```typescript
// Queries frecuentes SIN índice:
// 1. Búsqueda de reservas por userId
.where(eq(reservations.userId, userId)) // ❌ Sin índice

// 2. Búsqueda de pasajeros por reservationId
.where(eq(passengers.reservationId, reservationId)) // ❌ Sin índice

// 3. Búsqueda de installments por reservationId
.where(eq(paymentInstallments.reservationId, reservationId)) // ❌ Sin índice

// 4. Timeline events por reservationId
.where(eq(timelineEvents.reservationId, reservationId)) // ❌ Sin índice

// 5. Departures por tourId
.where(eq(departures.tourId, tourId)) // ❌ Sin índice
```

**Impacto:** Queries lentos a medida que crece la base de datos (N+1 queries).

**Solución:**
```typescript
export const reservations = pgTable("reservations", {
  // ... campos existentes
}, (table) => ({
  userIdIdx: index("reservations_user_id_idx").on(table.userId),
  departureIdIdx: index("reservations_departure_id_idx").on(table.departureId),
  statusIdx: index("reservations_status_idx").on(table.status),
}));
```

---

### 9. **VALIDACIÓN DÉBIL DE EMAILS**
**Severidad:** ALTA 🟠  
**Archivo:** `shared/schema.ts`  
**Descripción:**  
Los campos de email NO tienen validación de formato:

```typescript
export const users = pgTable("users", {
  email: text("email").notNull().unique(), // ❌ Sin validación de formato
});
```

**Solución:**
```typescript
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(8, { message: "Contraseña debe tener al menos 8 caracteres" }),
});
```

---

### 10. **FALTA SANITIZACIÓN DE INPUTS HTML**
**Severidad:** ALTA 🟠  
**Archivo:** Frontend (múltiples componentes)  
**Descripción:**  
Los textos ingresados por usuarios (nombres, descripciones) NO son sanitizados contra XSS:

```typescript
// Ejemplo: tours.description puede contener <script>
<div dangerouslySetInnerHTML={{ __html: tour.description }} /> // ❌ Vulnerable a XSS
```

**Impacto:** Ataques XSS almacenado.

**Solución:**
```bash
npm install dompurify
```

```typescript
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tour.description) }} />
```

---

## 🟡 PROBLEMAS MEDIOS (Deberían corregirse)

### 11. **FALTA VALIDACIÓN DE MONTOS NEGATIVOS**
**Severidad:** MEDIA 🟡  
**Archivo:** `server/routes.ts`, `shared/schema.ts`  
**Descripción:**  
No hay validación para evitar montos negativos en pagos/precios.

**Solución:**
```typescript
price: z.number().positive({ message: "El precio debe ser positivo" }),
```

---

### 12. **FALTA PAGINACIÓN EN ENDPOINTS**
**Severidad:** MEDIA 🟡  
**Archivo:** `server/routes.ts`  
**Descripción:**  
Endpoints como `/api/reservations`, `/api/passengers` devuelven TODOS los registros sin límite.

**Impacto:** Timeouts y alto consumo de memoria con muchos datos.

**Solución:**
```typescript
app.get("/api/reservations", authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;
  
  const reservations = await storage.getReservations(userId, limit, offset);
  res.json({ data: reservations, page, limit });
});
```

---

### 13. **SCHEDULER: POSIBLES EMAILS DUPLICADOS**
**Severidad:** MEDIA 🟡  
**Archivo:** `server/jobs/scheduler.ts` (líneas 62-66)  
**Descripción:**  
La ventana de 60 minutos puede enviar el mismo recordatorio múltiples veces si el scheduler corre cada 6 horas.

**Solución:** Verificar timestamp exacto del último envío.

---

### 14. **FALTA TIMEOUT EN PETICIONES SMTP**
**Severidad:** MEDIA 🟡  
**Archivo:** `server/services/smtpService.ts`  
**Descripción:**  
Las peticiones SMTP no tienen timeout, pueden colgar indefinidamente.

---

### 15. **CONTRASEÑAS: FALTA POLÍTICA DE COMPLEJIDAD**
**Severidad:** MEDIA 🟡  
**Archivo:** `server/auth.ts`  
**Descripción:**  
No se valida complejidad de contraseñas (mayúsculas, números, caracteres especiales).

---

### 16. **FALTA CSRF PROTECTION**
**Severidad:** MEDIA 🟡  
**Descripción:**  
No hay protección CSRF para formularios críticos.

---

### 17. **JWT: NO HAY LISTA NEGRA DE TOKENS**
**Severidad:** MEDIA 🟡  
**Archivo:** `server/auth.ts`  
**Descripción:**  
Tokens revocados (logout, cambio de contraseña) siguen siendo válidos hasta expirar.

**Solución:** Implementar Redis para blacklist de tokens.

---

### 18. **LOGS: INFORMACIÓN SENSIBLE**
**Severidad:** MEDIA 🟡  
**Archivo:** `server/index.ts` (línea 37)  
**Descripción:**  
Los logs pueden contener información sensible:

```typescript
logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`; // Puede incluir passwords, tokens
```

---

### 19. **REPORTES: QUERY N+1**
**Severidad:** MEDIA 🟡  
**Archivo:** `server/routes.ts` (líneas 1053-1066)  
**Descripción:**  
Timeline events ejecutan 1 query por evento para obtener usuario:

```typescript
const enrichedEvents = await Promise.all(
  events.map(async (event) => {
    if (event.performedBy) {
      const user = await storage.getUser(event.performedBy); // N queries
```

**Solución:** Usar JOIN o cargar usuarios en batch.

---

### 20. **FALTA VALIDACIÓN DE FECHA DE NACIMIENTO**
**Severidad:** MEDIA 🟡  
**Archivo:** `shared/schema.ts`  
**Descripción:**  
No se valida que dateOfBirth sea una fecha pasada o que el pasajero sea mayor de edad.

---

## 🟢 PROBLEMAS BAJOS (Mejoras recomendadas)

### 21. **TODO PENDIENTE EN FRONTEND**
**Severidad:** BAJA 🟢  
**Archivo:** `client/src/components/UpcomingDeadlinesTable.tsx` (línea 42)  
```typescript
// TODO: Implement send reminder functionality
```

---

### 22. **FALTA DOCUMENTACIÓN DE API**
**Severidad:** BAJA 🟢  
**Descripción:**  
No hay documentación Swagger/OpenAPI de los endpoints.

---

### 23. **FALTA MONITOREO Y ALERTAS**
**Severidad:** BAJA 🟢  
**Descripción:**  
No hay sistema de monitoreo para errores críticos (ej: Sentry).

---

### 24. **VARIABLES DE ENTORNO: FALTA VALIDACIÓN**
**Severidad:** BAJA 🟢  
**Archivo:** `server/db.ts`  
**Descripción:**  
Solo se valida DATABASE_URL, faltan validaciones para SMTP_*, JWT_SECRET, etc.

---

## 📊 ESTADÍSTICAS DE COBERTURA

### Autenticación y Autorización ✅
- ✅ JWT implementado
- ✅ RBAC funcional (7 permisos)
- ✅ Middleware de autenticación
- ⚠️ Sin validación de usuarios inactivos
- ⚠️ Sin rate limiting

### Validación de Datos ⚠️
- ✅ Zod schemas en 9/39 endpoints POST/PUT/PATCH (23%)
- ⚠️ 30 endpoints sin validación explícita
- ❌ Sin validación de tipos de archivo
- ❌ Sin sanitización XSS

### Base de Datos ⚠️
- ❌ Sin transacciones en operaciones críticas
- ❌ Sin índices para queries frecuentes
- ✅ Drizzle ORM previene SQL injection
- ✅ Relaciones FK configuradas

### Seguridad ⚠️
- ✅ Passwords hasheados con bcrypt
- ✅ CORS configurado
- ⚠️ Exposición de errores internos
- ❌ Sin protección CSRF
- ❌ Sin rate limiting

### Rendimiento ⚠️
- ❌ Queries N+1 en reportes
- ❌ Sin paginación
- ❌ Sin índices
- ✅ Caching en frontend (React Query)

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### FASE 1: CRÍTICO (Esta semana)
1. ✅ Implementar transacciones en creación de reservas
2. ✅ Implementar transacciones en cancelaciones
3. ✅ Implementar transacciones en scheduler
4. ✅ Validar usuarios inactivos en login

### FASE 2: ALTO (Próximas 2 semanas)
5. ✅ Implementar rate limiting
6. ✅ Validar tipos/tamaños de archivos
7. ✅ Agregar índices a la base de datos
8. ✅ Sanitizar mensajes de error
9. ✅ Validación de emails mejorada

### FASE 3: MEDIO (Próximo mes)
10. ✅ Implementar paginación
11. ✅ Política de contraseñas robusta
12. ✅ Timeout en SMTP
13. ✅ Sanitización XSS en frontend
14. ✅ Resolver query N+1 en reportes

### FASE 4: BAJO (Backlog)
15. ✅ Documentación API (Swagger)
16. ✅ Sistema de monitoreo
17. ✅ Validación de env vars

---

## ✅ ASPECTOS POSITIVOS DEL SISTEMA

1. ✅ **Arquitectura sólida:** Separación clara frontend/backend
2. ✅ **RBAC completo:** Sistema de permisos granulares
3. ✅ **Auditoría completa:** Tracking de todos los cambios
4. ✅ **Email automatizado:** Sistema robusto de notificaciones
5. ✅ **Timeline visual:** Excelente trazabilidad
6. ✅ **Scheduler configurable:** Reglas de recordatorios en DB
7. ✅ **PDFs profesionales:** Generación de documentos
8. ✅ **Sistema de pagos flexible:** Installments configurables

---

## 📝 CONCLUSIÓN

El sistema tiene una **base sólida** con funcionalidades avanzadas bien implementadas (RBAC, auditoría, emails, PDFs). Sin embargo, existen **3 problemas críticos de concurrencia** que pueden causar overbooking y **7 problemas altos de seguridad** que deben corregirse inmediatamente.

**Prioridad máxima:** Implementar transacciones de base de datos en todas las operaciones de reservas/cancelaciones para prevenir race conditions.

---

**Fin del reporte**
