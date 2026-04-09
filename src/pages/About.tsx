import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">About Triloki Bytes</h1>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            <span className="text-2xl">🔥</span> <strong className="text-foreground">Triloki Bytes</strong> is a modern cloud kitchen dedicated to delivering high-quality, delicious food directly to your doorstep through a seamless online experience.
          </p>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Our Mission</h2>
            <p>We believe great food should be accessible, affordable, and convenient. Our kitchen uses fresh, locally-sourced ingredients to craft meals that bring authentic flavours to your table — no matter where you are.</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Why Choose Us?</h2>
            <ul className="list-inside list-disc space-y-2">
              <li><strong className="text-foreground">Fresh Ingredients</strong> — Sourced daily for maximum flavour</li>
              <li><strong className="text-foreground">Fast Delivery</strong> — Hot meals at your door in minutes</li>
              <li><strong className="text-foreground">Affordable Prices</strong> — Quality food without breaking the bank</li>
              <li><strong className="text-foreground">Hygienic Kitchen</strong> — Strict cleanliness and safety standards</li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Contact Us</h2>
            <div className="space-y-2">
              <p>📧 hello@trilokibytes.com</p>
              <p>📞 +91 98765 43210</p>
              <p>📍 Cloud Kitchen, New Delhi, India</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
