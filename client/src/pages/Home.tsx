import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import PopularTours from "@/components/PopularTours";
import WhyChooseUs from "@/components/WhyChooseUs";
import ExploreDestinations from "@/components/ExploreDestinations";
import Testimonials from "@/components/Testimonials";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Tu Destino Tours - Experiencias de Viaje Inolvidables"
        description="Descubre tours y experiencias únicas alrededor del mundo. Reserva tu próxima aventura con Tu Destino Tours - tu agencia de confianza para viajes inolvidables."
        ogType="website"
      />
      
      <Header />
      <main>
        <Hero />
        <StatsSection />
        <section id="populares">
          <PopularTours />
        </section>
        <WhyChooseUs />
        <section id="tours">
          <ExploreDestinations />
        </section>
        <section id="clientes">
          <Testimonials />
        </section>
        <section id="contactanos">
          <ContactSection />
        </section>
      </main>
      <Footer />
    </div>
  );
}
