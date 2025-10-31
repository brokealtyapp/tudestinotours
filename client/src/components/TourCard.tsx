import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ImageIcon } from "lucide-react";
import { Link } from "wouter";

interface TourCardProps {
  id?: string;
  image: string;
  title: string;
  location: string;
  rating: number;
  reviews: string;
  price: number;
  discount?: number;
}

export default function TourCard({
  id,
  image,
  title,
  location,
  rating,
  reviews,
  price,
  discount,
}: TourCardProps) {
  const [imageError, setImageError] = useState(false);

  const cardContent = (
    <Card className="overflow-hidden hover-elevate transition-shadow duration-200 cursor-pointer" data-testid={`card-tour-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="relative aspect-[4/3] bg-muted">
        {!imageError ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        {discount && (
          <Badge className="absolute top-3 right-3 bg-white/90 text-foreground border-0">
            {discount}% DESC
          </Badge>
        )}
        <Badge className="absolute top-3 left-3 bg-white/90 text-foreground border-0 gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {rating}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {title}
        </h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{location}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="text-destructive">★</span> {rating}{" "}
            <span className="text-muted-foreground">({reviews})</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-foreground">
              ${price}
              <span className="text-sm font-normal text-muted-foreground">/Persona</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (id) {
    return (
      <Link href={`/tours/${id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
