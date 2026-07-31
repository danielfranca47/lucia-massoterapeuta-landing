import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Thread from "@/components/Thread";
import Intro from "@/components/Intro";
import Services from "@/components/Services";
import Ritual from "@/components/Ritual";
import Locations from "@/components/Locations";
import BookingWidget from "@/components/Booking/BookingWidget";
import Social from "@/components/Social";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Thread />
      <Intro />
      <Services />
      <Ritual />
      <Locations />
      <section className="booking" id="reservar">
        <BookingWidget />
      </section>
      <Social />
      <Footer />
    </>
  );
}
