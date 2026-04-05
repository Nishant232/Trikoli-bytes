const Footer = () => (
  <footer id="contact" className="bg-foreground text-primary-foreground/80 py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-heading text-xl font-bold text-primary-foreground mb-3">
            🔥 Triloki <span className="text-primary">Bytes</span>
          </h3>
          <p className="text-sm leading-relaxed">
            A modern cloud kitchen bringing you authentic flavours with the convenience of online ordering. Fresh, fast, and flavorful.
          </p>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-primary-foreground mb-3">Quick Links</h4>
          <div className="space-y-2 text-sm">
            <a href="#menu" className="block hover:text-primary transition-colors">Menu</a>
            <a href="#offers" className="block hover:text-primary transition-colors">Offers</a>
            <a href="#about" className="block hover:text-primary transition-colors">About Us</a>
          </div>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-primary-foreground mb-3">Contact</h4>
          <div className="space-y-2 text-sm">
            <p>📧 hello@trilokibytes.com</p>
            <p>📞 +91 98765 43210</p>
            <p>📍 Cloud Kitchen, New Delhi</p>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-xs text-primary-foreground/50">
        © 2026 Triloki Bytes. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
