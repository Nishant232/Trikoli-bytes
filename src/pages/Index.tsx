import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PromoBanner from "@/components/PromoBanner";
import MenuSection from "@/components/MenuSection";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <PromoBanner />
    <MenuSection />
    <CartSidebar />
    <Footer />
  </div>
);

export default Index;
