import { useCallback, useEffect, useMemo, useState } from "react";
import { ArchiveRestore, ArrowUpDown, EyeOff, ImageIcon, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_veg: boolean;
  rating: number;
  is_popular: boolean;
  is_available: boolean;
  deleted_at: string | null;
  created_at: string;
}

const defaultCategories = ["Main Course", "Starters", "Breads", "Desserts", "Beverages"];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Main Course",
  customCategory: "",
  is_veg: false,
  is_popular: false,
  is_available: true,
};

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const AdminMenuManager = ({ userRole }: { userRole: "super_admin" | "admin" }) => {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Unable to load menu items", description: error.message, variant: "destructive" });
      setItems([]);
    } else {
      setItems((data as MenuItemRow[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const categoryOptions = useMemo(
    () => Array.from(new Set([...defaultCategories, ...items.map((item) => item.category)])).sort(),
    [items],
  );

  const visibleItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (!showArchived && item.deleted_at) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (availabilityFilter === "available" && !item.is_available) return false;
      if (availabilityFilter === "unavailable" && item.is_available) return false;
      if (availabilityFilter === "archived" && !item.deleted_at) return false;
      if (
        normalizedSearch &&
        !item.name.toLowerCase().includes(normalizedSearch) &&
        !item.category.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });

    return filtered.sort((left, right) => {
      switch (sortBy) {
        case "price_low":
          return left.price - right.price;
        case "price_high":
          return right.price - left.price;
        case "name_az":
          return left.name.localeCompare(right.name);
        case "rating_high":
          return right.rating - left.rating;
        default:
          return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      }
    });
  }, [availabilityFilter, categoryFilter, items, searchTerm, showArchived, sortBy]);

  const archivedCount = items.filter((item) => item.deleted_at).length;

  const resetImageState = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    resetImageState();
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItemRow) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: categoryOptions.includes(item.category) ? item.category : "custom",
      customCategory: categoryOptions.includes(item.category) ? "" : item.category,
      is_veg: item.is_veg,
      is_popular: item.is_popular,
      is_available: item.is_available,
    });
    resetImageState();
    setImagePreview(item.image_url || null);
    setDialogOpen(true);
  };

  const handleImageChange = (file: File | null) => {
    if (!file) {
      resetImageState();
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      toast({
        title: "Unsupported image type",
        description: "Use JPG, PNG, or WEBP images only.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast({
        title: "Image too large",
        description: "Please upload an image smaller than 2 MB.",
        variant: "destructive",
      });
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const extension = file.name.split(".").pop();
    const path = `${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("food-images").upload(path, file);

    if (error) {
      toast({ title: "Image upload failed", description: error.message, variant: "destructive" });
      return null;
    }

    const { data } = supabase.storage.from("food-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    const resolvedCategory = form.category === "custom" ? form.customCategory.trim() : form.category;
    const parsedPrice = Number(form.price);

    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (!resolvedCategory) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }

    if (!Number.isInteger(parsedPrice) || parsedPrice <= 0) {
      toast({ title: "Enter a valid price", description: "Price must be a positive whole number.", variant: "destructive" });
      return;
    }

    setSaving(true);

    let imageUrl: string | undefined;
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (!uploadedUrl) {
        setSaving(false);
        return;
      }
      imageUrl = uploadedUrl;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parsedPrice,
      category: resolvedCategory,
      is_veg: form.is_veg,
      is_popular: form.is_popular,
      is_available: form.is_available,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    };

    if (editingId) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Menu item updated" });
      }
    } else {
      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) {
        toast({ title: "Create failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Menu item added" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchItems();
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Archive this menu item? It will be hidden from customers.")) return;

    const { error } = await supabase
      .from("menu_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Archive failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item archived" });
      fetchItems();
    }
  };

  const toggleAvailability = async (item: MenuItemRow) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);

    if (error) {
      toast({ title: "Availability update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: item.is_available ? "Marked unavailable" : "Marked available" });
      fetchItems();
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("Permanently delete this item? This cannot be undone.")) return;

    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Permanently deleted" });
      fetchItems();
    }
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from("menu_items").update({ deleted_at: null }).eq("id", id);
    if (error) {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item restored" });
      fetchItems();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading menu items...</p>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Menu Items ({visibleItems.length})</h2>
          <p className="text-sm text-muted-foreground">
            Manage customer visibility, categories, and dish presentation from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShowArchived((current) => !current)}>
            <EyeOff className="mr-1 h-4 w-4" />
            {showArchived ? "Hide Archived" : `Show Archived (${archivedCount})`}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by dish or category"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Availability</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="name_az">Name A-Z</SelectItem>
            <SelectItem value="price_low">Price Low-High</SelectItem>
            <SelectItem value="price_high">Price High-Low</SelectItem>
            <SelectItem value="rating_high">Top Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <UtensilsIcon />
          <p className="mt-2 text-muted-foreground">
            {showArchived ? "No menu items found." : "No matching menu items found."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-20 w-full rounded-lg object-cover lg:h-16 lg:w-16" />
              ) : (
                <div className="flex h-20 w-full items-center justify-center rounded-lg bg-muted lg:h-16 lg:w-16">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium text-card-foreground">{item.name}</h3>
                  {item.is_veg && <Badge variant="outline" className="border-success text-success text-xs">Veg</Badge>}
                  {item.is_popular && <Badge className="border-0 bg-primary/10 text-primary text-xs">Popular</Badge>}
                  {!item.is_available && <Badge variant="destructive" className="text-xs">Unavailable</Badge>}
                  {item.deleted_at && <Badge variant="secondary" className="text-xs">Archived</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.category} · ₹{item.price} · Rating {item.rating}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!item.deleted_at && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => toggleAvailability(item)}>
                      {item.is_available ? "Set Unavailable" : "Set Available"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {item.deleted_at ? (
                  <Button variant="ghost" size="icon" onClick={() => handleRestore(item.id)} title="Restore">
                    <ArchiveRestore className="h-4 w-4 text-primary" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => handleSoftDelete(item.id)} title="Archive">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                {userRole === "super_admin" && (
                  <Button variant="ghost" size="icon" onClick={() => handleHardDelete(item.id)} title="Delete permanently">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Butter Chicken" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the dish..." className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Price (₹) *</label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="299" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category *</label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                    <SelectItem value="custom">Custom Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.category === "custom" && (
              <div>
                <label className="text-sm font-medium text-foreground">Custom Category Name *</label>
                <Input
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                  placeholder="Chef Specials"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground">Food Image</label>
              <Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => handleImageChange(e.target.files?.[0] || null)} className="mt-1" />
              <p className="mt-1 text-xs text-muted-foreground">Accepted: JPG, PNG, WEBP up to 2 MB.</p>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-3 h-32 w-full rounded-lg object-cover" />
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_veg} onChange={(e) => setForm({ ...form, is_veg: e.target.checked })} className="rounded" />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} className="rounded" />
                Popular
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="rounded" />
                Available
              </label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const UtensilsIcon = () => (
  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
    <ImageIcon className="h-5 w-5 text-muted-foreground" />
  </div>
);

export default AdminMenuManager;
