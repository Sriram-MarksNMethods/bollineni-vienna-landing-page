import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Residences from "@/components/Residences";
import FloorPlans from "@/components/FloorPlans";
import AboutBuilder from "@/components/AboutBuilder";
import WhyInvestInUs from "@/components/WhyInvestInUs";
import Amenities from "@/components/Amenities";
import FAQ from "@/components/FAQ";
import LocationMap from "@/components/LocationMap";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import EnquiryLauncher from "@/components/EnquiryLauncher";

// react-phone-input-2 (+ its full country/dial-code dataset) makes this the
// heaviest client component on the page -- split it into its own chunk so
// that weight only downloads once the visitor reaches the contact form,
// instead of blocking the initial page load for a section at the very
// bottom of the page.
const BookingForm = dynamic(() => import("@/components/BookingForm"));

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <EnquiryLauncher />
      <Navbar />
      <main className="relative z-[2] max-lg:static">
        <Hero />
        <About />
        <Residences />
        <FloorPlans />
        <Amenities />
        <WhyInvestInUs />
        <AboutBuilder />
        <FAQ />
        <LocationMap />
        <BookingForm />
      </main>
      <Footer />
    </>
  );
}
