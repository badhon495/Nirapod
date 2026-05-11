export type ComplaintCategory = "POLICE" | "FIRE" | "CITY" | "ANIMAL";
export type ComplaintUrgency = "LOW" | "MEDIUM" | "HIGH";
export type ComplaintStatus = "UNSOLVED" | "IN_PROGRESS" | "SOLVED";

export interface ComplaintPhoto {
  id: string;
  filePublicId: string;
  uploadedByName: string;
  isEvidence: boolean;
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  oldStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  changedByName: string;
  note: string | null;
  createdAt: string;
}

export interface ComplaintSummary {
  id: string;
  trackingId: number;
  reporterName: string;
  reporterId: string;
  category: ComplaintCategory;
  urgency: ComplaintUrgency;
  status: ComplaintStatus;
  title: string;
  district: string;
  area: string;
  isPublic: boolean;
  tags: string[];
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintDetail extends ComplaintSummary {
  details: string;
  locationLat: number | null;
  locationLng: number | null;
  locationText: string | null;
  authorityNote: string | null;
  photos: ComplaintPhoto[];
  statusHistory: StatusHistoryEntry[];
  resolvedAt: string | null;
}

export interface ComplaintCreatePayload {
  category: ComplaintCategory;
  urgency: ComplaintUrgency;
  title: string;
  details: string;
  district: string;
  area: string;
  locationLat?: number;
  locationLng?: number;
  locationText?: string;
  isPublic: boolean;
  tags?: string[];
  photoPublicIds?: string[];
}

export interface ComplaintFeedParams {
  category?: ComplaintCategory;
  status?: ComplaintStatus;
  district?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
