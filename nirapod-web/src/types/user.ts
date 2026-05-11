export type UserRole = "CITIZEN" | "POLICE" | "FIRE" | "CITY" | "ANIMAL" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  nid: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  presentAddress: string;
  permanentAddress: string;
  createdAt: string;
}
