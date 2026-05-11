export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreatePayload {
  content: string;
}
