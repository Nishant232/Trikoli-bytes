import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapMenuItemRow } from "@/lib/menu";
import type { MenuItem } from "@/types/menu";
import type { Tables } from "@/integrations/supabase/types";

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

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewAuthors, setReviewAuthors] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!id) return;

    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("menu_item_id", id)
      .order("created_at", { ascending: false });

    const reviewList = data || [];
    setReviews(reviewList);

    const userIds = Array.from(new Set(reviewList.map((review) => review.user_id)));
    if (userIds.length === 0) {
      setReviewAuthors({});
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const authors = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile.full_name || "Verified Customer"]));
    setReviewAuthors(authors);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoadingItem(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setItem(null);
      } else {
        setItem(mapMenuItemRow(data as Tables<"menu_items">));
      }
      setLoadingItem(false);
    };

    fetchProduct();
    fetchReviews();
  }, [fetchReviews, id]);

  const userReviewExists = useMemo(
    () => reviews.some((review) => review.user_id === user?.id),
    [reviews, user?.id],
  );

  const submitReview = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to leave a review.",
        variant: "destructive",
      });
      return;
    }

    if (userReviewExists) {
      toast({
        title: "Review already added",
        description: "You can post only one review per dish.",
        variant: "destructive",
      });
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
      toast({ title: "Review submitted!" });
      setComment("");
      setRating(5);
      fetchReviews();
    }
    setSubmitting(false);
  };

  if (loadingItem) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          Loading item...
        </div>
      </div>
    );
  }

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
    for (let index = 0; index < qty; index += 1) {
      addItem({ id: item.id, name: item.name, price: item.price, image: item.image });
    }
    toast({ title: `${item.name} added to cart!` });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : item.rating.toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </button>

        <div className="mb-12 grid gap-8 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={item.image} alt={item.name} className="h-80 w-full object-cover md:h-full" />
            {item.isPopular && (
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                Popular
              </span>
            )}
            {!item.isAvailable && (
              <span className="absolute bottom-4 left-4 rounded-full bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground">
                Currently Unavailable
              </span>
            )}
            <span className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded border-2 bg-card text-[10px] font-bold ${item.isVeg ? "border-success text-success" : "border-accent text-accent"}`}>
              ●
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">{item.name}</h1>
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="font-semibold">{avgRating}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>
            <p className="mb-4 leading-relaxed text-muted-foreground">{item.description}</p>
            <p className="mb-1 text-sm text-muted-foreground">
              Category: <span className="font-medium text-foreground">{item.category}</span>
            </p>
            <p className="mb-6 text-3xl font-bold text-primary">₹{item.price}</p>
            {!item.isAvailable && (
              <p className="mb-4 text-sm text-destructive">
                This dish is temporarily unavailable and cannot be added to cart right now.
              </p>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-full bg-secondary px-4 py-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-primary/10">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-primary/10">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={handleAdd} size="lg" className="flex-1" disabled={!item.isAvailable}>
                {item.isAvailable ? `Add to Cart - ₹${item.price * qty}` : "Unavailable"}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Reviews and Ratings</h2>

          <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 font-semibold text-card-foreground">Leave a Review</h3>
            <div className="mb-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)}>
                  <Star className={`h-6 w-6 transition-colors ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            {userReviewExists && (
              <p className="mb-3 text-sm text-muted-foreground">
                You have already reviewed this dish. Only one review per customer is allowed.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={user ? "Write your review..." : "Sign in to leave a review"}
                disabled={!user || userReviewExists}
                maxLength={500}
              />
              <Button onClick={submitReview} disabled={submitting || !user || userReviewExists}>Submit</Button>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {reviewAuthors[review.user_id] || "Verified Customer"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-card-foreground">{review.comment}</p>
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
