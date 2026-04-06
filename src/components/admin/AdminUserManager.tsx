import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, UserCog } from "lucide-react";

interface RoleRow {
  id: string;
  user_id: string;
  role: string;
}

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/20",
  admin: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-accent text-accent-foreground border-border",
  user: "bg-muted text-muted-foreground border-border",
  moderator: "bg-secondary text-secondary-foreground border-border",
};

const AdminUserManager = () => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchRoles = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("*");
    setRoles((data as RoleRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleAdd = async () => {
    if (!userId.trim()) {
      toast({ title: "User ID is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId.trim(), role: selectedRole as any });
    if (error) {
      toast({ title: "Failed to add role", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role assigned ✅" });
      setDialogOpen(false);
      setUserId("");
      fetchRoles();
    }
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this role assignment?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role removed" });
      fetchRoles();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading user roles...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">User Roles ({roles.length})</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Assign Role
        </Button>
      </div>

      {roles.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <UserCog className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">No roles assigned yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {roles.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-card-foreground truncate">{r.user_id}</p>
              </div>
              <Badge variant="outline" className={roleColors[r.role] || ""}>
                {r.role.replace("_", " ")}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">User ID (UUID) *</label>
              <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="paste user UUID here" className="mt-1 font-mono text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin / Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={saving} className="w-full">
              {saving ? "Assigning..." : "Assign Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManager;
