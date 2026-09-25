export interface Attendee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface AttendeeCheckin {
  id: string;
  attendee_id: string;
  qr_code: string;
  checked_in: boolean;
  check_in_time: string;
  check_out_time: string | null;
  created_at: string;
  attendee?: Attendee;
}

export interface AttendeeHistory {
  id: string;
  attendee_id: string;
  qr_code: string;
  check_in_time: string;
  check_out_time: string;
  duration_minutes: number | null;
  created_at: string;
  attendee?: Attendee;
}

export type ScanResult = {
  action: 'check_in' | 'check_out';
  attendee: Attendee;
  checkin?: AttendeeCheckin;
};
