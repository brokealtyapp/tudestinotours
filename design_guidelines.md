# Design Guidelines: Tu Destino Tours

## Design Approach
**Reference-Based Design** inspired by leading travel platforms (Airbnb, Booking.com, Expedia) with customization for the tour-selling experience. The design emphasizes trust, energy, and clarity through the blue, red, and white color palette while showcasing destinations with visual impact.

## Core Design Principles
1. **Visual Storytelling**: Large, inspiring imagery that sells the travel experience
2. **Trust & Credibility**: Clean layouts with social proof, statistics, and clear information hierarchy
3. **Conversion-Focused**: Clear CTAs, prominent booking flows, and minimal friction
4. **Mobile-First**: Responsive design optimized for on-the-go browsing and booking

## Typography System

**Primary Font**: Poppins (Google Fonts)
- **Headings (H1)**: 600 weight, 3xl to 5xl size (mobile to desktop)
- **Headings (H2-H3)**: 600 weight, 2xl to 3xl size
- **Body Text**: 400 weight, base to lg size
- **Labels/Small**: 500 weight, sm size
- **CTAs/Buttons**: 600 weight, base to lg size

**Secondary Font**: Inter (Google Fonts)
- Used for data-heavy sections, forms, and admin panels
- 400-600 weights

## Layout System

**Spacing Scale**: Tailwind units of **4, 6, 8, 12, 16, 20, 24**
- Component padding: p-4 to p-8
- Section padding: py-16 to py-24 (desktop), py-8 to py-12 (mobile)
- Grid gaps: gap-4 to gap-8
- Card spacing: p-6

**Container Widths**:
- Full-width sections: w-full with max-w-7xl inner container
- Content sections: max-w-6xl
- Forms: max-w-2xl
- Text content: max-w-4xl

**Grid Systems**:
- Tour cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Features: grid-cols-1 md:grid-cols-3
- Stats: grid-cols-2 lg:grid-cols-4
- Mobile: Always single column

## Component Library

### Navigation
- Fixed header with shadow on scroll
- Logo on left, navigation items center/right
- "Reservar Ahora" CTA button prominent in header
- Mobile: Hamburger menu with slide-in drawer
- Language selector (ES/EN) optional

### Hero Section
- Full-width, 80vh minimum height
- Large background image with subtle overlay for text readability
- Centered heading with subheading
- Search bar/filter component integrated (destination, dates, passengers)
- Statistics badges (50+ Destinos, 200+ Turistas, 100+ Hoteles) positioned prominently
- Blurred background buttons for CTAs overlaid on images

### Tour Cards
- Aspect ratio 4:3 for main image
- Rounded corners (rounded-lg to rounded-xl)
- Location badge with pin icon top-left
- Star rating with number of reviews
- Price per person (large, bold)
- Discount badge (if applicable) top-right
- Hover: subtle lift effect (shadow-lg transition)
- "Reservar" button at bottom, full-width within card

### "Por Qué Elegirnos" Section
- Icon-based feature cards
- Icons: Heroicons (solid style)
- Grid of 3-4 features
- Icon above, title, short description
- Activities: Hiking, Biking, Swimming & Fishing, Cultural Tours

### Testimonials
- Card-based layout with user photo, name, location
- Quote text with quotation marks styling
- Star rating display
- 2-3 columns on desktop, carousel on mobile

### Tour Detail Page
- Image gallery (main large image + thumbnail grid)
- Sticky booking card on right (desktop) or bottom (mobile)
- Tabs for: Descripción, Itinerario, Políticas, FAQ
- Downloadable PDF brochure button
- Date selector showing available dates with cupos (spots available)
- Highlights section with checkmark icons

### Booking Wizard
- Multi-step progress indicator at top
- Steps: Datos del Comprador → Pasajeros → Documentos → Resumen → Pago
- Form fields with clear labels, validation states
- Passenger cards (collapsible, repeatable)
- File upload for passport photos (drag-drop + click)
- Summary sidebar (desktop) or expandable bottom sheet (mobile)

### Admin Dashboard
- Sidebar navigation (collapsed on mobile)
- KPI cards with icons and trend indicators
- Data tables with filters, sorting, pagination
- Status badges (color-coded by reservation state)
- Action buttons (approve, send payment link, cancel)
- Timeline view for reservation lifecycle

### Client Panel
- Tab navigation: Mis Reservas, Documentos, Perfil
- Reservation cards with status badge, tour info, dates
- "Pagar Ahora" button prominent when payment due
- Progress bars for partial payments
- Downloadable itinerary and voucher buttons

### Forms
- Floating labels or top-aligned labels
- Input fields with border, focus states (blue accent)
- Error states (red border + message below)
- Success states (green checkmark icon)
- Required field indicator (red asterisk)
- Help text in gray, smaller size

### Buttons
- Primary: Red background (CTA actions: Reservar, Pagar)
- Secondary: Blue background (secondary actions)
- Outline: White/gray border (tertiary actions)
- Sizes: sm, base, lg
- Rounded: rounded-lg
- Hover/active states with slight darken and shadow
- Disabled: reduced opacity, no pointer

### Badges & Tags
- Rounded-full for pills (status, discounts)
- Rounded-md for category tags
- Color coding:
  - Discount: Red background
  - Status: Green (Pagada), Yellow (Pendiente), Red (Cancelada), Gray (En Revisión)
  - Rating: Yellow stars with number

### Footer
- Multi-column layout (4 columns desktop, stacked mobile)
- Categories: Destinos, Empresa, Soporte, Legal
- Newsletter signup form
- Social media icons
- Trust badges (secure payment, verified, awards)
- Copyright and language selector

## Images

**Hero Section**: 
Large, high-quality landscape image of popular tourist destination (beaches, mountains, cultural sites). Image should be inspiring and represent the variety of tours offered. Dimensions: 1920x1080px minimum. Apply subtle dark overlay (opacity 40-50%) for text readability.

**Tour Cards**:
Each tour needs a featured image (1200x900px) showing the main attraction or experience. Images should be vibrant, well-composed, and evoke emotion.

**Tour Detail Gallery**:
Main image (1600x1200px) + 4-6 additional images showing different aspects of the tour (activities, accommodations, meals, landmarks).

**Testimonial Avatars**:
Square user photos (200x200px), displayed as rounded-full.

**Feature/Benefits Icons**:
Use Heroicons library - no custom images needed.

**Admin/Dashboard**:
Minimal imagery, focus on data visualization and clear information architecture.

## Iconography
**Library**: Heroicons (via CDN)
- Navigation: outline style
- Features: solid style
- Actions: mini style for inline elements
- Consistent 24px size for standard icons, 16px for small

## Spacing & Rhythm
- Consistent vertical rhythm with py-16 to py-24 between major sections
- Component internal spacing: p-6 to p-8
- Card spacing in grids: gap-6 to gap-8
- Form element spacing: space-y-4 to space-y-6

## Responsive Breakpoints
- Mobile: < 768px (single column, stacked navigation, bottom sheets)
- Tablet: 768px - 1024px (2 columns, adjusted spacing)
- Desktop: > 1024px (full multi-column layouts, sidebar layouts)

## Animations
**Minimal, purposeful animations only**:
- Smooth transitions on hover states (0.2s ease)
- Fade-in for modals/overlays
- Slide-in for mobile navigation
- No parallax, no scroll-triggered animations, no complex effects

## Accessibility
- WCAG 2.1 AA compliance minimum
- Sufficient color contrast for all text
- Focus indicators on all interactive elements
- Alt text for all images
- Keyboard navigation support
- ARIA labels for icon-only buttons
- Form validation messages linked to inputs