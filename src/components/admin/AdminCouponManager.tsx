import { useCallback, useEffect, useMemo, useState } from "react";
import { ArchiveRestore, Pencil, Plus, Tag, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  deleted_at: string | null;
}

type CouponForm = {
  code: string;
  discount_percent: string;
  min_order_amount: string;
  max_uses: string;
  expires_at: string;
};

const emptyForm: CouponForm = {
  code: "",
  discount_percent: "",
  min_order_amount: "",
  max_uses: "",
  expires_at: "",
};

const formatCurrency = (amount: number | null) => `Rs. ${amount ?? 0}`;

const formatDate = (value: string | null) => {
  if (!value) return "No expiry";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDateInputMin = () => new Date().toISOString().split("T")[0];

const isExpiredCoupon = (expiresAt: string | null) => Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());

const AdminCouponManager = ({ userRole }: { userRole: "super_admin" | "admin" }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Unable to load coupons", description: error.message, variant: "destructive" });
      setCoupons([]);
    } else {
      setCoupons((data as Coupon[]) || []);
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const filteredCoupons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const isArchived = Boolean(coupon.deleted_at);
      const isExpired = isExpiredCoupon(coupon.expires_at);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        coupon.code.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !isArchived && coupon.is_active && !isExpired) ||
        (statusFilter === "inactive" && !isArchived && !coupon.is_active && !isExpired) ||
        (statusFilter === "expired" && isExpired) ||
        (statusFilter === "archived" && isArchived);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchTerm, statusFilter]);

  const validateForm = () => {
    const discount = Number.parseInt(form.discount_percent, 10);
    const minOrderAmount =
      form.min_order_amount.trim().length > 0 ? Number.parseInt(form.min_order_amount, 10) : 0;
    const maxUses =
      form.max_uses.trim().length > 0 ? Number.parseInt(form.max_uses, 10) : null;

    if (!form.code.trim()) {
      return "Coupon code is required.";
    }

    if (!Number.isInteger(discount) || discount < 1 || discount > 100) {
      return "Discount must be a whole number between 1 and 100.";
    }

    if (!Number.isInteger(minOrderAmount) || minOrderAmount < 0) {
      return "Minimum order must be zero or more.";
    }

    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      return "Max uses must be at least 1 when provided.";
    }

    if (form.expires_at) {
      const expiryDate = new Date(`${form.expires_at}T23:59:59`);
      if (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= Date.now()) {
        return "Expiry date must be in the future.";
      }
    }

    return null;
  };

  const openCreateDialog = () => {
    setEditingCouponId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setForm({
      code: coupon.code,
      discount_percent: String(coupon.discount_percent),
      min_order_amount: coupon.min_order_amount ? String(coupon.min_order_amount) : "",
      max_uses: coupon.max_uses ? String(coupon.max_uses) : "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCouponId(null);
    setForm(emptyForm);
  };

  const saveCoupon = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({ title: "Invalid coupon details", description: validationError, variant: "destructive" });
      return;
    }

    setSaving(true);

    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_percent: Number.parseInt(form.discount_percent, 10),
      min_order_amount: form.min_order_amount ? Number.parseInt(form.min_order_amount, 10) : 0,
      max_uses: form.max_uses ? Number.parseInt(form.max_uses, 10) : null,
      expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null,
      is_active: true,
    };

    const query = editingCouponId
      ? supabase.from("coupons").update(payload).eq("id", editingCouponId)
      : supabase.from("coupons").insert(payload);

    const { error } = await query;

    if (error) {
      toast({
        title: editingCouponId ? "Update failed" : "Create failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: editingCouponId ? "Coupon updated" : "Coupon created" });
      closeDialog();
      fetchCoupons();
    }

    setSaving(false);
  };

  const toggleActive = async (coupon: Coupon) => {
    if (coupon.deleted_at) return;

    if (isExpiredCoupon(coupon.expires_at)) {
      toast({
        title: "Coupon has expired",
        description: "Edit the expiry date before activating this coupon again.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);

    if (error) {
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: coupon.is_active ? "Coupon deactivated" : "Coupon activated" });
      fetchCoupons();
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Archive this coupon?")) return;

    const { error } = await supabase
      .from("coupons")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id);

    if (error) {
      toast({ title: "Archive failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon archived" });
      fetchCoupons();
    }
  };

  const handleRestore = async (coupon: Coupon) => {
    const nextActiveState = isExpiredCoupon(coupon.expires_at) ? false : Boolean(coupon.is_active ?? true);

    const { error } = await supabase
      .from("coupons")
      .update({ deleted_at: null, is_active: nextActiveState })
      .eq("id", coupon.id);

    if (error) {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: isExpiredCoupon(coupon.expires_at) ? "Coupon restored as inactive" : "Coupon restored",
      });
      fetchCoupons();
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("Permanently delete this coupon?")) return;

    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon permanently deleted" });
      fetchCoupons();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading coupons...</p>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Coupons ({filteredCoupons.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage coupon status, expiry, restores, and usage limits from one place.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-1 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by coupon code"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All coupons</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCoupons.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No matching coupons found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredCoupons.map((coupon) => {
            const isArchived = Boolean(coupon.deleted_at);
            const isExpired = isExpiredCoupon(coupon.expires_at);
            const usageLimitReached =
              coupon.max_uses !== null && (coupon.used_count || 0) >= coupon.max_uses;

            return (
              <div
                key={coupon.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-card-foreground">{coupon.code}</span>
                      <Badge variant={coupon.is_active && !isArchived && !isExpired ? "default" : "secondary"}>
                        {coupon.is_active && !isArchived && !isExpired ? "Active" : "Inactive"}
                      </Badge>
                      {isExpired && (
                        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                          Expired
                        </Badge>
                      )}
                      {isArchived && <Badge variant="outline">Archived</Badge>}
                      {usageLimitReached && <Badge variant="outline">Limit Reached</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {coupon.discount_percent}% off
                      {coupon.min_order_amount ? ` · Min ${formatCurrency(coupon.min_order_amount)}` : ""}
                      {coupon.max_uses ? ` · ${coupon.used_count || 0}/${coupon.max_uses} used` : " · Unlimited uses"}
                      {coupon.expires_at ? ` · Expires ${formatDate(coupon.expires_at)}` : " · No expiry"}
                    </p>
                    {isExpired && (
                      <p className="mt-2 text-sm text-destructive">
                        This coupon has passed its expiry date and will not apply at checkout.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isArchived && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(coupon)}>
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(coupon)}>
                          {coupon.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSoftDelete(coupon.id)} title="Archive">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </>
                    )}

                    {isArchived && (
                      <Button variant="outline" size="sm" onClick={() => handleRestore(coupon)}>
                        <ArchiveRestore className="mr-1 h-4 w-4" /> Restore
                      </Button>
                    )}

                    {userRole === "super_admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleHardDelete(coupon.id)}
                        title="Permanently delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setDialogOpen(true))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCouponId ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Coupon Code *</label>
              <Input
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                placeholder="SAVE20"
                className="mt-1 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Discount % *</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discount_percent}
                  onChange={(event) => setForm({ ...form, discount_percent: event.target.value })}
                  placeholder="20"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Min Order (Rs.)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_order_amount}
                  onChange={(event) => setForm({ ...form, min_order_amount: event.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Max Uses</label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_uses}
                  onChange={(event) => setForm({ ...form, max_uses: event.target.value })}
                  placeholder="Unlimited"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Expires At</label>
                <Input
                  type="date"
                  min={getDateInputMin()}
                  value={form.expires_at}
                  onChange={(event) => setForm({ ...form, expires_at: event.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Discount must be 1-100%. Minimum order cannot be negative. Max uses must be at least 1 when set.
            </div>

            <Button onClick={saveCoupon} disabled={saving} className="w-full">
              {saving ? (editingCouponId ? "Saving..." : "Creating...") : editingCouponId ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouponManager;
