import { API_URL } from '../constants';
import { AttendanceRecord, AttendanceStatus } from '../types';

// Helper to find property value with enhanced matching strategies
const getProp = (item: any, lookups: string[], defaultValue: string = ""): string => {
  const itemKeys = Object.keys(item);
  
  // Strategy 1: Exact or Case-insensitive match
  for (const lookup of lookups) {
    const foundKey = itemKeys.find(key => key.toLowerCase() === lookup.toLowerCase());
    if (foundKey && item[foundKey] !== undefined && item[foundKey] !== "") {
      return String(item[foundKey]);
    }
  }

  // Strategy 2: Partial match (key contains lookup word)
  // We prioritize the first lookup term (usually the most specific one like 'nama')
  for (const lookup of lookups) {
    const foundKey = itemKeys.find(key => key.toLowerCase().includes(lookup.toLowerCase()));
    if (foundKey && item[foundKey] !== undefined && item[foundKey] !== "") {
      return String(item[foundKey]);
    }
  }
  
  return defaultValue;
};

const normalizeStatus = (status: string): AttendanceStatus => {
  const s = status.toLowerCase();
  if (s.includes('tidak') || s.includes('absent')) return AttendanceStatus.TIDAK_HADIR;
  if (s.includes('lewat') || s.includes('late')) return AttendanceStatus.LEWAT;
  if (s.includes('bertugas') || s.includes('duty')) return AttendanceStatus.BERTUGAS;
  if (s.includes('hadir') || s.includes('present') || s === 'y' || s === 'yes' || s === '/') return AttendanceStatus.HADIR;
  return AttendanceStatus.HADIR; // Default
};

export const fetchAttendanceData = async (): Promise<AttendanceRecord[]> => {
  console.log("Fetching from:", API_URL);
  
  const response = await fetch(API_URL, {
    method: "GET",
    redirect: "follow",
  });
  
  if (!response.ok) {
    throw new Error(`Ralat Rangkaian: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  console.log("Raw JSON received:", json);
  
  let rawData: any[] = [];

  // Handle various JSON structures
  if (Array.isArray(json)) {
    rawData = json;
  } else if (json.data && Array.isArray(json.data)) {
    rawData = json.data;
  } else if (typeof json === 'object') {
    // Attempt to find any array in the object
    const possibleArray = Object.values(json).find(val => Array.isArray(val));
    if (possibleArray) {
      rawData = possibleArray as any[];
    }
  }

  if (!rawData || rawData.length === 0) {
     // If we got a valid 200 OK but empty array, that's fine, return empty.
     // But if structure was totally weird, we might warn.
     console.warn("Format data tidak dikenali atau senarai kosong.");
     return [];
  }

  return rawData.map((item: any, index: number) => {
    // Expanded lookup keywords for Malay Google Forms
    const timestamp = getProp(item, ['timestamp', 'tarikh', 'date', 'time', 'masa', 'tanda masa'], new Date().toISOString());
    const nama = getProp(item, ['nama', 'name', 'pengawas', 'student', 'peserta'], "Tanpa Nama");
    const tingkatan = getProp(item, ['tingkatan', 'kelas', 'form', 'grade', 'darjah'], "Umum");
    const statusRaw = getProp(item, ['status', 'kehadiran', 'attendance', 'hadir'], "Hadir");
    const catatan = getProp(item, ['catatan', 'remarks', 'note', 'alasan', 'sebab', 'ulasan'], "");

    return {
      id: item.id || `row-${index}-${Date.now()}`,
      timestamp: timestamp,
      nama: nama,
      tingkatan: tingkatan,
      status: normalizeStatus(statusRaw),
      catatan: catatan
    };
  });
};