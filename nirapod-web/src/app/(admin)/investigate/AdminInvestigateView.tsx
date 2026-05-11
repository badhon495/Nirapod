"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";

interface AdminDocument {
  id: string;
  type: string;
  documentNumber: string | null;
  filePublicId: string;
  verified: boolean;
  createdAt: string;
}

interface AdminUser {
  id: string;
  nid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  presentAddress: string;
  permanentAddress: string;
  createdAt: string;
  documents: AdminDocument[];
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  SUSPENDED: "bg-red-100 text-red-800 border-red-200",
};

function cloudinaryUrl(publicId: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

function UserResult({ user }: { user: AdminUser }) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{user.role}</Badge>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${STATUS_BADGE[user.status] ?? ""}`}>
            {user.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">NID</span><span className="font-mono">{user.nid}</span>
        <span className="text-muted-foreground">Phone</span><span>{user.phone}</span>
        <span className="text-muted-foreground">Present address</span><span>{user.presentAddress}</span>
        <span className="text-muted-foreground">Permanent address</span><span>{user.permanentAddress}</span>
        <span className="text-muted-foreground">Joined</span><span>{formatDate(user.createdAt)}</span>
        <span className="text-muted-foreground">User ID</span><span className="font-mono text-xs">{user.id}</span>
      </div>

      {user.documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Documents ({user.documents.length})</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {user.documents.map((doc) => (
              <div key={doc.id} className="rounded border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs">{doc.type}</span>
                  {doc.verified && <span className="text-xs text-green-700">Verified</span>}
                </div>
                {doc.documentNumber && (
                  <p className="text-muted-foreground text-xs font-mono">#{doc.documentNumber}</p>
                )}
                <a
                  href={cloudinaryUrl(doc.filePublicId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline underline-offset-2 text-blue-600 hover:text-blue-800"
                >
                  View document
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type SearchMode = "nid" | "document";

export function AdminInvestigateView() {
  const [mode, setMode] = useState<SearchMode>("nid");
  const [query, setQuery] = useState("");

  const search = useMutation<AdminUser, Error, string>({
    mutationFn: async (q) => {
      const url = mode === "nid"
        ? `/api/v1/admin/investigate/nid/${encodeURIComponent(q)}`
        : `/api/v1/admin/investigate/document/${encodeURIComponent(q)}`;
      const res = await api.get<AdminUser>(url);
      return res.data;
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) search.mutate(query.trim());
  }

  const notFound = search.isError &&
    (search.error as { response?: { status?: number } })?.response?.status === 404;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Search size={18} aria-hidden="true" />
        <h1 className="text-lg font-semibold">Investigate</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Look up a user by NID or by document number (passport, driving license, utility bill, etc.)
      </p>

      <Separator />

      <div className="flex gap-2" role="group" aria-label="Search mode">
        {(["nid", "document"] as SearchMode[]).map((m) => (
          <Button
            key={m}
            variant={mode === m ? "default" : "outline"}
            size="sm"
            onClick={() => { setMode(m); search.reset(); }}
          >
            {m === "nid" ? "NID" : "Document number"}
          </Button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="inv-query" className="text-xs">
            {mode === "nid" ? "National ID number (10 digits)" : "Document number"}
          </Label>
          <Input
            id="inv-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "nid" ? "e.g. 1234567890" : "e.g. AB1234567"}
            className="font-mono"
            required
          />
        </div>
        <Button type="submit" className="self-end" disabled={search.isPending}>
          <Search size={14} aria-hidden="true" />
          Search
        </Button>
      </form>

      {search.isPending && (
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      )}

      {search.isSuccess && <UserResult user={search.data} />}

      {search.isError && !notFound && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={16} aria-hidden="true" />
          Failed to search. Please try again.
        </div>
      )}

      {notFound && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <User size={36} aria-hidden="true" />
          <p className="text-sm">No user found for that {mode === "nid" ? "NID" : "document number"}.</p>
        </div>
      )}
    </div>
  );
}
