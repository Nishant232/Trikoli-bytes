import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, ShieldCheck, Trash2, UserCog } from "lucide-react";
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

interface UserRecord {
  user_id: string;
  email: string | null;
  full_name: string | null;
  roles: string[];
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Manager",
  staff: "Staff",
  user: "User",
  moderator: "Moderator",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/20",
  admin: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-accent text-accent-foreground border-border",
  user: "bg-muted text-muted-foreground border-border",
  moderator: "bg-secondary text-secondary-foreground border-border",
};

const managedRoles = ["super_admin", "admin", "staff"];

const AdminUserManager = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_list_users_with_roles");

    if (error) {
      toast({ title: "Unable to load users", description: error.message, variant: "destructive" });
      setUsers([]);
    } else {
      setUsers((data as UserRecord[]) || []);
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.full_name?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch) ||
        user.user_id.toLowerCase().includes(normalizedSearch);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "no_role" ? user.roles.length === 0 : user.roles.includes(roleFilter));

      return Boolean(matchesSearch && matchesRole);
    });
  }, [roleFilter, searchTerm, users]);

  const assignableUsers = useMemo(
    () => users.filter((user) => !user.roles.includes(selectedRole)),
    [selectedRole, users],
  );

  const handleAdd = async () => {
    if (!selectedUserId) {
      toast({ title: "Select a user first", variant: "destructive" });
      return;
    }

    const selectedUser = users.find((user) => user.user_id === selectedUserId);
    const userLabel = selectedUser?.full_name || selectedUser?.email || selectedUserId;
    const roleLabel = roleLabels[selectedRole] || selectedRole;

    const confirmed = confirm(`Assign ${roleLabel} access to ${userLabel}?`);
    if (!confirmed) return;

    setSaving(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: selectedUserId, role: selectedRole as never });

    if (error) {
      toast({ title: "Failed to add role", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${roleLabel} access assigned` });
      setDialogOpen(false);
      setSelectedUserId("");
      fetchUsers();
    }
    setSaving(false);
  };

  const handleRemove = async (userId: string, role: string) => {
    const user = users.find((entry) => entry.user_id === userId);
    const userLabel = user?.full_name || user?.email || userId;
    const roleLabel = roleLabels[role] || role;
    const isCriticalRole = role === "super_admin";

    const confirmed = confirm(
      isCriticalRole
        ? `Remove ${roleLabel} access from ${userLabel}? This changes top-level control.`
        : `Remove ${roleLabel} access from ${userLabel}?`,
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as never);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${roleLabel} access removed` });
      fetchUsers();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading user roles...</p>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">User Access</h2>
          <p className="text-sm text-muted-foreground">Assign roles by user name or email instead of raw UUID.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Assign Role
        </Button>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-card-foreground">Role access summary</p>
        <p className="mt-1"><span className="font-medium">Super Admin:</span> full control including role assignments.</p>
        <p className="mt-1"><span className="font-medium">Manager:</span> menu, coupons, and order operations.</p>
        <p className="mt-1"><span className="font-medium">Staff:</span> order handling only.</p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or user id"
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="no_role">No Role</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Manager</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <UserCog className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No matching users found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => (
            <div key={user.user_id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-card-foreground">
                    {user.full_name || "Unnamed User"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{user.email || "No email available"}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{user.user_id}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {user.roles.length === 0 ? (
                    <Badge variant="secondary">No Role</Badge>
                  ) : (
                    user.roles.map((role) => (
                      <div key={`${user.user_id}-${role}`} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1">
                        <Badge variant="outline" className={roleColors[role] || ""}>
                          {roleLabels[role] || role}
                        </Badge>
                        <button
                          onClick={() => handleRemove(user.user_id, role)}
                          className="rounded p-1 text-destructive transition-colors hover:bg-destructive/10"
                          title={`Remove ${role}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
              <label className="text-sm font-medium text-foreground">User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.length === 0 ? (
                    <SelectItem value="no-users" disabled>No users available</SelectItem>
                  ) : (
                    assignableUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <span className="flex flex-col">
                          <span>{user.full_name || "Unnamed User"}</span>
                          <span className="text-xs text-muted-foreground">{user.email || user.user_id}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {managedRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole === "super_admin" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-destructive" />
                  <p>Super Admin access includes role management and full operational control.</p>
                </div>
              </div>
            )}

            <Button onClick={handleAdd} disabled={saving || !selectedUserId} className="w-full">
              {saving ? "Assigning..." : "Assign Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManager;
