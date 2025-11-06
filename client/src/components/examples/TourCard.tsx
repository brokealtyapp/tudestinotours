import TourCard from '../TourCard';
import tourImage from "@assets/generated_images/Thailand_beach_with_boat_0d72543f.png";

export default function TourCardExample() {
  return (
    <div className="max-w-sm">
      <TourCard
        image={tourImage}
        title="Molokini and Turtle Town Snorkeling Adventure Aboard"
        continent="Asia"
        rating={4.8}
        reviews="1.4k"
        minPrice={187}
        discount={20}
      />
    </div>
  );
}
