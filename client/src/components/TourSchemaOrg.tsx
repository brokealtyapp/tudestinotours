import { useEffect } from "react";
import type { Tour, Departure } from "@shared/schema";

interface TourSchemaOrgProps {
  tour: Tour;
  departure?: Departure;
}

export default function TourSchemaOrg({ tour, departure }: TourSchemaOrgProps) {
  useEffect(() => {
    const seatsAvailable = departure ? departure.totalSeats - departure.reservedSeats : 0;
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: tour.title,
      description: tour.description || "",
      image: tour.images && tour.images.length > 0 ? tour.images : [],
      touristType: "Turismo general",
      ...(departure && departure.returnDate && {
        startDate: new Date(departure.departureDate).toISOString(),
        endDate: new Date(departure.returnDate).toISOString(),
      }),
      ...(tour.duration && {
        duration: `P${tour.duration}D`,
      }),
      ...(tour.location && {
        itinerary: {
          "@type": "ItemList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              item: {
                "@type": "Place",
                name: tour.location,
              },
            },
          ],
        },
      }),
      ...(departure && {
        offers: {
          "@type": "Offer",
          price: departure.price,
          priceCurrency: "USD",
          availability: seatsAvailable > 0 
            ? "https://schema.org/InStock" 
            : "https://schema.org/SoldOut",
          validFrom: new Date().toISOString(),
        },
      }),
      provider: {
        "@type": "TravelAgency",
        name: "Tu Destino Tours",
      },
    };

    const scriptId = "tour-schema-org";
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!scriptElement) {
      scriptElement = document.createElement("script");
      scriptElement.id = scriptId;
      scriptElement.type = "application/ld+json";
      document.head.appendChild(scriptElement);
    }
    
    scriptElement.textContent = JSON.stringify(schema);

    return () => {
      const element = document.getElementById(scriptId);
      if (element) {
        element.remove();
      }
    };
  }, [tour, departure]);

  return null;
}
