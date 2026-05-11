export type NotificationType = "STATUS_UPDATE" | "NEW_COMMENT" | "FOLLOWER" | "LOGIN_ALERT";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  complaintId: string | null;
  read: boolean;
  createdAt: string;
}

export interface FollowStatus {
  following: boolean;
  followerCount: number;
}
