import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Tag } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string | null;
}

const emptyForm = {
  code: "",
  discount_percent: "",
  min_order_amount: "",
  max_uses: "",
  expires_at: "",
};

const AdminCouponManager = ({ userRole }: { userRole: "super_admin" | "admin" }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.discount_percent) {
      toast({ title: "Code and discount % are required", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_percent: parseInt(form.discount_percent),
      min_order_amount: form.min_order_amount ? parseInt(form.min_order_amount) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: true,
    };

    const { error } = await supabase.from("coupons").insert(payload);
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon created ✅" });
      setDialogOpen(false);
      setForm(emptyForm);
      fetchCoupons();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, currentActive: boolean | null) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !currentActive })
      .eq("id", id);
    if (!error) fetchCoupons();
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Archive this coupon?")) return;
    const { error } = await supabase.from("coupons").update({ deleted_at: new Date().toISOString(), is_active: false } as any).eq("id", id);
    if (error) {
      toast({ title: "Archive failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon archived" });
      fetchCoupons();
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("⚠️ PERMANENTLY delete this coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Permanently deleted" });
      fetchCoupons();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading coupons...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Coupons ({coupons.length})</h2>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Create Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Tag className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">No coupons yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-card-foreground">{coupon.code}</span>
                  <Badge variant={coupon.is_active ? "default" : "secondary"}>
                    {coupon.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {coupon.discount_percent}% off
                  {coupon.min_order_amount ? ` · Min ₹${coupon.min_order_amount}` : ""}
                  {coupon.max_uses ? ` · ${coupon.used_count || 0}/${coupon.max_uses} used` : ""}
                  {coupon.expires_at ? ` · Expires ${new Date(coupon.expires_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => toggleActive(coupon.id, coupon.is_active)}>
                  {coupon.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Coupon Code *</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" className="mt-1 font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Discount % *</label>
                <Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="20" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Min Order (₹)</label>
                <Input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="0" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Max Uses</label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Expires At</label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="mt-1" />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full">
              {saving ? "Creating..." : "Create Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouponManager;
