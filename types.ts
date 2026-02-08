export interface AttendanceRecord {
  id: string;
  timestamp: string;
  nama: string;
  tingkatan: string; // e.g., "3 Cekal"
  status: AttendanceStatus;
  catatan?: string;
}

export enum AttendanceStatus {
  HADIR = "Hadir",
  TIDAK_HADIR = "Tidak Hadir",
  LEWAT = "Lewat",
  BERTUGAS = "Bertugas",
  LAIN_LAIN = "Lain-lain"
}

export interface DashboardStats {
  total: number;
  hadir: number;
  tidakHadir: number;
  lewat: number;
  todayCount: number;
}