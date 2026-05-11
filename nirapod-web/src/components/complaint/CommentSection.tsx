"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Send, Trash2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/useComments";
import type { Comment } from "@/types/comment";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | undefined;
  complaintId: string;
}

function CommentItem({ comment, currentUserId, complaintId }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const updateMutation = useUpdateComment(complaintId, comment.id);
  const deleteMutation = useDeleteComment(complaintId);

  const isOwn = currentUserId === comment.userId;

  function handleSave() {
    if (!draft.trim()) return;
    updateMutation.mutate(
      { content: draft.trim() },
      {
        onSuccess: () => setEditing(false),
        onError: () => toast.error("Failed to update comment"),
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(comment.id, {
      onError: () => toast.error("Failed to delete comment"),
    });
  }

  return (
    <div className="flex gap-3 group">
      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium select-none">
        {comment.userName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{comment.userName}</span>
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5 space-y-1.5">
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              aria-label="Edit comment"
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending || !draft.trim()}
                aria-label="Save comment"
              >
                <Check size={14} aria-hidden="true" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditing(false); setDraft(comment.content); }}
                aria-label="Cancel edit"
              >
                <X size={14} aria-hidden="true" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-foreground/90 break-words">{comment.content}</p>
        )}
      </div>

      {isOwn && !editing && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
            aria-label="Edit comment"
          >
            <Pencil size={13} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            aria-label="Delete comment"
          >
            <Trash2 size={13} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface Props {
  complaintId: string;
}

export function CommentSection({ complaintId }: Props) {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useComments(complaintId);
  const addMutation = useAddComment(complaintId);

  const comments = data?.pages.flatMap((p) => p.content) ?? [];
  const totalCount = data?.pages[0]?.totalElements ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addMutation.mutate(
      { content: text.trim() },
      {
        onSuccess: () => setText(""),
        onError: () => toast.error("Failed to post comment"),
      }
    );
  }

  return (
    <section aria-label="Comments">
      <Separator className="my-6" />
      <h2 className="text-sm font-semibold mb-4">
        Comments {totalCount > 0 && <span className="text-muted-foreground font-normal">({totalCount})</span>}
      </h2>

      {session && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2 items-end">
            <textarea
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[72px]"
              placeholder="Write a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              aria-label="Comment text"
            />
            <Button
              type="submit"
              size="sm"
              disabled={addMutation.isPending || !text.trim()}
              aria-label="Post comment"
            >
              <Send size={14} aria-hidden="true" />
              Post
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={session?.user?.id}
              complaintId={complaintId}
            />
          ))}
          {hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading…" : "Load more comments"}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
