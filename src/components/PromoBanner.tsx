import { Tag, Clock, Truck } from "lucide-react";

const features = [
  { icon: Clock, title: "30 Min Delivery", desc: "Hot food at your doorstep" },
  { icon: Tag, title: "Best Prices", desc: "Affordable & delicious" },
  { icon: Truck, title: "Free Delivery", desc: "On orders above ₹199" },
];

const PromoBanner = () => (
  <section id="offers" className="py-12 bg-secondary/50">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="flex items-center gap-4 bg-card rounded-xl p-5 border border-border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-card-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PromoBanner;
