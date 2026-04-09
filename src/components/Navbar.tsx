import { ShoppingCart, Menu, X, User, LogOut, Package, UserCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoLight from "@/assets/logo-light.png";

const Navbar = () => {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut, isDashboardUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={logoLight} alt="Triloki Bytes" className="h-10 w-auto" />
        </button>

        <div className="hidden md:flex items-center gap-8">
          <a href="/#menu" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Menu</a>
          <button onClick={() => navigate("/offers")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Offers</button>
          <button onClick={() => navigate("/about")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</button>
          {user && (
            <button onClick={() => navigate("/orders")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">My Orders</button>
          )}
          {isDashboardUser && (
            <button onClick={() => navigate("/admin")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Dashboard</button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/cart")}
            className="relative p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-primary" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold animate-fade-in">
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => navigate("/profile")} className="p-2 rounded-full hover:bg-muted transition-colors" title="Profile">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
              </button>
              <button onClick={() => navigate("/orders")} className="p-2 rounded-full hover:bg-muted transition-colors" title="My Orders">
                <Package className="h-5 w-5 text-muted-foreground" />
              </button>
              <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-muted transition-colors" title="Sign Out">
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate("/auth")} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">
              <User className="h-4 w-4" /> Sign In
            </button>
          )}

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="flex flex-col p-4 gap-3">
            <a href="/#menu" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Menu</a>
            <button onClick={() => { navigate("/offers"); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-primary text-left">Offers</button>
            <button onClick={() => { navigate("/about"); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-primary text-left">About</button>
            {user ? (
              <>
                <button onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-primary text-left">My Profile</button>
                <button onClick={() => { navigate("/orders"); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-primary text-left">My Orders</button>
                {isDashboardUser && (
                  <button onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-primary text-left">Dashboard</button>
                )}
                <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="text-sm font-medium text-destructive text-left">Sign Out</button>
              </>
            ) : (
              <button onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="text-sm font-medium text-primary text-left">Sign In</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
