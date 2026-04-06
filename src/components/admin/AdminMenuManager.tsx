import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";

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
  created_at: string;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Main Course",
  is_veg: false,
  is_popular: false,
  is_available: true,
};

const categories = ["Main Course", "Starters", "Breads", "Desserts", "Beverages"];

const AdminMenuManager = ({ userRole }: { userRole: "super_admin" | "admin" }) => {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as MenuItemRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItemRow) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: item.category,
      is_veg: item.is_veg,
      is_popular: item.is_popular,
      is_available: item.is_available,
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("food-images").upload(path, file);
    if (error) {
      toast({ title: "Image upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("food-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    setSaving(true);

    let image_url: string | undefined = undefined;
    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) image_url = url;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseInt(form.price),
      category: form.category,
      is_veg: form.is_veg,
      is_popular: form.is_popular,
      is_available: form.is_available,
      ...(image_url ? { image_url } : {}),
    };

    if (editingId) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Menu item updated ✅" });
      }
    } else {
      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) {
        toast({ title: "Create failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Menu item added ✅" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchItems();
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Archive this menu item? It will be hidden from customers.")) return;
    const { error } = await supabase.from("menu_items").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast({ title: "Archive failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item archived" });
      fetchItems();
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("⚠️ PERMANENTLY delete this item? This cannot be undone.")) return;
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
      toast({ title: "Item restored ✅" });
      fetchItems();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading menu items...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Menu Items ({items.length})</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <UtensilsIcon />
          <p className="text-muted-foreground mt-2">No menu items yet. Add your first dish!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-card-foreground truncate">{item.name}</h3>
                  {item.is_veg && <Badge variant="outline" className="text-xs border-success text-success">Veg</Badge>}
                  {item.is_popular && <Badge className="text-xs bg-primary/10 text-primary border-0">Popular</Badge>}
                  {!item.is_available && <Badge variant="destructive" className="text-xs">Unavailable</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{item.category} · ₹{item.price} · ⭐ {item.rating}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Food Image</label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mt-1" />
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
  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mx-auto">
    <ImageIcon className="h-5 w-5 text-muted-foreground" />
  </div>
);

export default AdminMenuManager;
