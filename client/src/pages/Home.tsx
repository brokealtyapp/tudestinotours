import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import PopularTours from "@/components/PopularTours";
import WhyChooseUs from "@/components/WhyChooseUs";
import ExploreDestinations from "@/components/ExploreDestinations";
import Testimonials from "@/components/Testimonials";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
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
