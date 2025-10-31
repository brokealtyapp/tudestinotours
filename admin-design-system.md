# Sistema de Diseño - Panel de Administración
## Tu Destino Tours

Este documento define el sistema de diseño exclusivo para el panel de administración (`/admin`), basado en referencias de interfaces modernas y minimalistas.

---

## Principios de Diseño

### 1. Minimalismo Premium
- Fondos claros y limpios (blanco/gris muy claro)
- Espaciado generoso entre elementos
- Sombras sutiles para profundidad
- Jerarquía visual clara

### 2. Contenido Visual Primero
- Imágenes grandes y atractivas
- Cards con overlays de texto sobre imágenes
- Íconos como apoyo, no como protagonistas

### 3. Usabilidad Clara
- Navegación intuitiva
- Acciones primarias destacadas
- Estados claros e inmediatos

---

## Paleta de Colores Admin

### Fondos
- **Background Principal**: `#FAFBFC` (gris muy claro, casi blanco)
- **Background Cards**: `#FFFFFF` (blanco puro)
- **Background Sidebar**: `#FFFFFF` con sombra `0 0 15px rgba(0,0,0,0.05)`

### Textos
- **Primario**: `#1A1A1A` (negro suave)
- **Secundario**: `#6B7280` (gris medio)
- **Terciario**: `#9CA3AF` (gris claro)

### Acentos (mantener branding)
- **Azul Principal**: `#2563EB` (acciones primarias, links)
- **Rojo Acento**: `#DC2626` (alertas, cancelaciones)
- **Verde Éxito**: `#10B981` (confirmaciones, estados positivos)
- **Amarillo Warning**: `#F59E0B` (advertencias)

---

## Tipografía

### Jerarquía
- **H1 - Título Principal**: `32px / 2rem`, font-weight: 700, color: primario
- **H2 - Sección**: `24px / 1.5rem`, font-weight: 600, color: primario
- **H3 - Subsección**: `18px / 1.125rem`, font-weight: 600, color: primario
- **Body Large**: `16px / 1rem`, font-weight: 400, color: primario
- **Body Regular**: `14px / 0.875rem`, font-weight: 400, color: primario
- **Caption**: `12px / 0.75rem`, font-weight: 400, color: secundario

---

## Espaciado

### Sistema de espaciado (basado en 4px)
- **xs**: `4px` - Espacios mínimos
- **sm**: `8px` - Dentro de componentes pequeños
- **md**: `16px` - Padding de cards, gaps pequeños
- **lg**: `24px` - Separación entre secciones
- **xl**: `32px` - Márgenes principales
- **2xl**: `48px` - Separación de secciones grandes

### Aplicación
- **Padding Cards**: `24px` (lg)
- **Gap entre Cards**: `16px` (md) en grids, `24px` (lg) en listas verticales
- **Margin Secciones**: `32px` (xl)

---

## Componentes

### Sidebar
```
- Ancho: 256px (16rem)
- Background: #FFFFFF
- Box-shadow: 0 0 15px rgba(0,0,0,0.05)
- Padding: 24px 16px
- Items: hover con bg #F3F4F6, active con bg #EFF6FF + borde izquierdo azul
```

### Header Principal
```
- Height: 64px
- Background: #FFFFFF
- Box-shadow: 0 1px 3px rgba(0,0,0,0.06)
- Padding: 0 32px
- Contiene: Saludo personalizado + Búsqueda + Avatar
```

### Cards
```
- Background: #FFFFFF
- Border-radius: 16px (rounded-2xl)
- Box-shadow: 0 1px 3px rgba(0,0,0,0.08)
- Padding: 24px
- Hover: elevar sombra a 0 4px 12px rgba(0,0,0,0.12)
```

### Cards con Imagen (Tours, Salidas)
```
- Border-radius: 16px
- Imagen: aspect-ratio 16:9 o 4:3, object-fit: cover
- Overlay: gradient linear de transparente a rgba(0,0,0,0.7)
- Texto sobre imagen: color blanco, font-weight: 600
- Padding interno del overlay: 16px
```

### Botones
```
Primary:
- Background: #2563EB
- Color: #FFFFFF
- Padding: 10px 20px
- Border-radius: 8px
- Font-weight: 500
- Hover: bg #1D4ED8

Secondary/Outline:
- Background: transparent
- Border: 1px solid #E5E7EB
- Color: #374151
- Hover: bg #F9FAFB

Ghost:
- Background: transparent
- Color: #6B7280
- Hover: bg #F3F4F6
```

### Inputs
```
- Height: 40px
- Border: 1px solid #E5E7EB
- Border-radius: 8px
- Padding: 10px 12px
- Focus: border #2563EB, ring 0 0 0 3px rgba(37,99,235,0.1)
```

### Badges/Tags
```
- Padding: 4px 12px
- Border-radius: 12px (pill shape)
- Font-size: 12px
- Font-weight: 500

Estados:
- Confirmado: bg #D1FAE5, color #065F46
- Pendiente: bg #FEF3C7, color #92400E
- Cancelado: bg #FEE2E2, color #991B1B
```

### Tables
```
- Background: #FFFFFF
- Border: 1px solid #F3F4F6
- Header: bg #F9FAFB, font-weight: 600, color: #374151
- Rows: border-bottom 1px solid #F3F4F6
- Hover row: bg #F9FAFB
```

---

## Sombras

### Elevaciones
```css
/* Nivel 1 - Cards en reposo */
box-shadow: 0 1px 3px rgba(0,0,0,0.08);

/* Nivel 2 - Cards en hover, modals */
box-shadow: 0 4px 12px rgba(0,0,0,0.12);

/* Nivel 3 - Dropdowns, tooltips */
box-shadow: 0 10px 25px rgba(0,0,0,0.15);

/* Sidebar */
box-shadow: 0 0 15px rgba(0,0,0,0.05);
```

---

## Layouts

### Grid de Cards (Tours, Salidas)
```
- Display: grid
- Grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
- Gap: 16px
```

### Lista de Reservas/Tablas
```
- Display: stack vertical
- Gap: 8px entre rows
- Padding: 24px en container
```

---

## Interacciones

### Hover States
- Cards: Elevar sombra + transform translateY(-2px) con transition 200ms
- Botones: Cambio de background con transition 150ms
- Links: Color change a azul más oscuro

### Transitions
```css
/* Default para la mayoría de interacciones */
transition: all 200ms ease-in-out;

/* Sombras específicas */
transition: box-shadow 200ms ease-in-out, transform 200ms ease-in-out;
```

---

## Aplicación Solo en Admin

**Importante**: Estos estilos se aplican ÚNICAMENTE dentro del componente `Admin.tsx` y sus children. El frontend público NO debe verse afectado.

### Estrategia de implementación:
1. Wrapper class `.admin-panel` en el layout principal de Admin
2. Estilos scoped específicos para componentes admin
3. NO modificar variables globales que afecten al frontend público
