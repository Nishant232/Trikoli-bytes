import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { menuItems } from "@/data/menuData";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Plus, Minus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  user_id: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const item = menuItems.find((m) => m.id === id);

  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("menu_item_id", id!)
      .order("created_at", { ascending: false });
    setReviews(data || []);
  };

  const submitReview = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to leave a review.", variant: "destructive" });
      return;
    }
    if (!comment.trim()) {
      toast({ title: "Write something", description: "Please add a comment.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      menu_item_id: id!,
      rating,
      comment: comment.trim().slice(0, 500),
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted! ⭐" });
      setComment("");
      setRating(5);
      fetchReviews();
    }
    setSubmitting(false);
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-heading text-2xl font-bold">Item not found</h1>
          <Button onClick={() => navigate("/")} className="mt-4">Back to Menu</Button>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ id: item.id, name: item.name, price: item.price, image: item.image });
    }
    toast({ title: `${item.name} added to cart!` });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : item.rating;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </button>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={item.image} alt={item.name} className="w-full h-80 md:h-full object-cover" />
            {item.isPopular && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">🔥 Popular</span>
            )}
            <span className={`absolute top-4 right-4 h-6 w-6 rounded border-2 flex items-center justify-center text-[10px] font-bold ${item.isVeg ? "border-success text-success bg-card" : "border-accent text-accent bg-card"}`}>●</span>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">{item.name}</h1>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="font-semibold">{avgRating}</span>
              <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
            <p className="text-sm text-muted-foreground mb-1">Category: <span className="font-medium text-foreground">{item.category}</span></p>
            <p className="text-3xl font-bold text-primary mb-6">₹{item.price}</p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-secondary rounded-full px-4 py-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={handleAdd} size="lg" className="flex-1">
                Add to Cart — ₹{item.price * qty}
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="border-t border-border pt-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Reviews & Ratings</h2>

          {/* Write review */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-[var(--shadow-card)] mb-6">
            <h3 className="font-semibold text-card-foreground mb-3">Leave a Review</h3>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`h-6 w-6 transition-colors ${s <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={user ? "Write your review..." : "Sign in to leave a review"}
                disabled={!user}
                maxLength={500}
              />
              <Button onClick={submitReview} disabled={submitting || !user}>Submit</Button>
            </div>
          </div>

          {/* Review list */}
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-muted"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="text-sm text-card-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
