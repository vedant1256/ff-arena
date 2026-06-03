// ==================== USER ====================
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  ffUID: string;
  role: "user" | "admin" | "host" | "moderator";
  inrBalance: number;
  diamonds: number;
  totalWins: number;
  totalMatches: number;
  xp: number;
  isBanned: boolean;
  token?: string;
}

// ==================== TOURNAMENT ====================
export interface Prize {
  pos: string;
  cash: number;
  gems: number;
}

export interface Participant {
  userId: string;
  userName: string;
  ffUID: string;
  joinedAt: string;
}

export type TournamentType = "Solo" | "Duo" | "Squad" | "Clash Squad" | "BR Kill Race";
export type TournamentStatus = "upcoming" | "live" | "completed" | "cancelled";
export type MapType = "Bermuda" | "Kalahari" | "Purgatory" | "Alpine";

export interface Tournament {
  _id: string;
  name: string;
  type: TournamentType;
  map: MapType;
  entryFee: number;
  prizePool: number;
  startTime: string;
  slots: number;
  filledSlots: number;
  isFull: boolean;
  status: TournamentStatus;
  roomId: string;
  roomPass: string;
  roomReleasedAt: string | null;
  prizes: Prize[];
  participants: Participant[];
  perKill: number;
  createdAt: string;
}

// ==================== PAYMENT ====================
export interface Payment {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  ffUID: string;
  tournamentId: string;
  tournamentName: string;
  amount: number;
  utrId: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
  createdAt: string;
}

// ==================== WITHDRAWAL ====================
export interface Withdrawal {
  _id: string;
  userId: string;
  userName: string;
  upiId: string;
  amount: number;
  type: "inr" | "diamonds";
  inrEquivalent: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
