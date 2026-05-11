"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User2, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/axios";
import type { User } from "@/types/user";

function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    SUSPENDED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Citizen",
  POLICE: "Police",
  FIRE: "Fire Service",
  CITY: "City Corporation",
  ANIMAL: "Animal Welfare",
  ADMIN: "Admin",
};

export function ProfileView() {
  const { data: session } = useSession();

  const { data: profile, isLoading, isError } = useQuery<User>({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const { data } = await api.get<User>("/api/v1/users/me");
      return data;
    },
    enabled: !!session,
  });

  // ── Edit profile ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setPresentAddress(profile.presentAddress);
      setPermanentAddress(profile.permanentAddress);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put("/api/v1/users/me", { name, phone, presentAddress, permanentAddress });
    },
    onSuccess: () => toast.success("Profile updated"),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to update profile"),
  });

  // ── Change password ───────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await api.put("/api/v1/users/me/password", { currentPassword, newPassword });
    },
    onSuccess: () => {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to change password"),
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    passwordMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle size={36} className="text-red-500" aria-hidden="true" />
        <p className="text-sm text-red-600">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold select-none">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-semibold">{profile.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-muted-foreground">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
            <StatusChip status={profile.status} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Read-only info */}
      <section aria-labelledby="info-heading">
        <h2 id="info-heading" className="text-sm font-semibold mb-3 flex items-center gap-2">
          <User2 size={15} aria-hidden="true" />
          Account info
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium break-all">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">NID</dt>
            <dd className="font-medium">{profile.nid}</dd>
          </div>
        </dl>
      </section>

      <Separator />

      {/* Edit profile form */}
      <section aria-labelledby="edit-heading">
        <h2 id="edit-heading" className="text-sm font-semibold mb-4">Edit profile</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
          className="space-y-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="present-address">Present address</Label>
            <Input
              id="present-address"
              value={presentAddress}
              onChange={(e) => setPresentAddress(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="permanent-address">Permanent address</Label>
            <Input
              id="permanent-address"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>

      <Separator />

      {/* Change password */}
      <section aria-labelledby="password-heading">
        <h2 id="password-heading" className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Lock size={15} aria-hidden="true" />
          Change password
        </h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={passwordMutation.isPending}>
            {passwordMutation.isPending ? "Changing…" : "Change password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
