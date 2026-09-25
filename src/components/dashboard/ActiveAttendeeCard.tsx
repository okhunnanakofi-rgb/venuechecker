import { Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Attendee, AttendeeCheckin } from '@/types/attendance';

interface ActiveAttendeeCardProps {
  checkin: AttendeeCheckin & { attendee: Attendee };
}

export function ActiveAttendeeCard({ checkin }: ActiveAttendeeCardProps) {
  const duration = formatDistanceToNow(new Date(checkin.check_in_time), { addSuffix: false });

  return (
    <div className="glass-card p-4 hover:border-primary/30 transition-all duration-200 animate-scale-in">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <User className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{checkin.attendee.full_name}</h3>
          <p className="text-sm text-muted-foreground truncate">{checkin.attendee.email}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{duration}</span>
        </div>
        <div className="status-checked-in px-3 py-1 rounded-full text-xs font-medium">
          Checked In
        </div>
      </div>
    </div>
  );
}
