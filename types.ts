export interface AttendanceData {
  studentName: string;
  className: string;
  responsibleName: string;
  phone: string;
  requestedBy: string;
  reason: string;
  roughNotes: string;
  date: string;
  time: string;
}

export interface RefinedContent {
  formalReport: string;
  agreements: string[];
}

export interface SignatureData {
  responsible: string | null;
  soe: string | null;
  coord: string | null;
  aee: string | null;
  integral: string | null;
}
