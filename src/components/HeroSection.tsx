import heroImage from "@/assets/hero-food.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Delicious Indian food spread" width={1920} height={1080} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>
      <div className="relative container mx-auto px-4 py-24 md:py-36 text-center">
        <div className="animate-fade-up max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 backdrop-blur-sm">
            🎉 Flat 20% off on your first order!
          </span>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-primary-foreground mb-4 leading-tight">
            Flavours That <br />
            <span className="text-primary">Speak Louder</span>
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg mx-auto font-body">
            Fresh ingredients, authentic recipes, and lightning-fast delivery from our cloud kitchen to your doorstep.
          </p>
          <a
            href="#menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all shadow-lg hover:shadow-xl"
          >
            Explore Menu
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
