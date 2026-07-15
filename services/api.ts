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

const normalizeStatus = (status: string): AttendanceStatus | null => {
  const s = status.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('tidak') || s.includes('absent')) return AttendanceStatus.TIDAK_HADIR;
  if (s.includes('lewat') || s.includes('late')) return AttendanceStatus.LEWAT;
  if (s.includes('bertugas') || s.includes('duty')) return AttendanceStatus.BERTUGAS;
  if (s.includes('hadir') || s.includes('present') || s === 'y' || s === 'yes' || s === '/') return AttendanceStatus.HADIR;
  return null;
};

export const fetchAttendanceData = async (): Promise<AttendanceRecord[]> => {
  const response = await fetch(API_URL, {
    method: "GET",
    redirect: "follow",
  });
  
  if (!response.ok) {
    throw new Error(`Ralat Rangkaian: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
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

  return rawData.flatMap((item: any, index: number): AttendanceRecord[] => {
    // Expanded lookup keywords for Malay Google Forms
    const timestamp = getProp(item, ['timestamp', 'tarikh', 'date', 'time', 'masa', 'tanda masa']);
    const nama = getProp(item, ['nama', 'name', 'pengawas', 'student', 'peserta']).trim();
    const tingkatan = getProp(item, ['tingkatan', 'kelas', 'form', 'grade', 'darjah'], "Tidak dinyatakan").trim();
    const statusRaw = getProp(item, ['status', 'kehadiran', 'attendance', 'hadir']);
    const catatan = getProp(item, ['catatan', 'remarks', 'note', 'alasan', 'sebab', 'ulasan'], "");

    const parsedDate = new Date(timestamp);
    // Dalam aliran NFC sedia ada, setiap penghantaran Google Form ialah bukti
    // kehadiran. Apps Script tidak membekalkan lajur status, jadi rekod NFC yang
    // lengkap ditandakan Hadir. Jika lajur status ditambah pada masa hadapan,
    // nilai sebenar itu tetap dihormati.
    const status = statusRaw ? normalizeStatus(statusRaw) : AttendanceStatus.HADIR;

    // Nama dan timestamp mesti datang daripada rekod sebenar Apps Script.
    if (!timestamp || Number.isNaN(parsedDate.getTime()) || !nama || !status) {
      console.warn(`Rekod baris ${index + 1} diketepikan kerana tidak lengkap atau tidak sah.`);
      return [];
    }

    return [{
      id: String(item.id || `row-${index}-${parsedDate.getTime()}`),
      timestamp: parsedDate.toISOString(),
      nama: nama.toUpperCase(),
      tingkatan: tingkatan,
      status,
      catatan: catatan
    }];
  });
};
