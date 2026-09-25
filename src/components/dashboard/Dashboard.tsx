import { Users, UserCheck, Clock, History } from 'lucide-react';
import { useAttendees, useActiveCheckins, useAttendanceHistory } from '@/hooks/useAttendees';
import { StatsCard } from './StatsCard';
import { ActiveAttendeeCard } from './ActiveAttendeeCard';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  const { data: attendees, isLoading: loadingAttendees } = useAttendees();
  const { data: activeCheckins, isLoading: loadingCheckins } = useActiveCheckins();
  const { data: history, isLoading: loadingHistory } = useAttendanceHistory();

  const totalAttendees = attendees?.length || 0;
  const activeCount = activeCheckins?.length || 0;
  const todayVisits = history?.filter(h => {
    const today = new Date().toDateString();
    return new Date(h.check_out_time).toDateString() === today;
  }).length || 0;

  const avgDuration = history?.length 
    ? Math.round(history.reduce((sum, h) => sum + (h.duration_minutes || 0), 0) / history.length)
    : 0;

  const isLoading = loadingAttendees || loadingCheckins || loadingHistory;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Real-time venue attendance overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatsCard
              title="Total Registered"
              value={totalAttendees}
              subtitle="All-time attendees"
              icon={Users}
            />
            <StatsCard
              title="Currently Inside"
              value={activeCount}
              subtitle="Active check-ins"
              icon={UserCheck}
              variant="success"
            />
            <StatsCard
              title="Today's Visits"
              value={todayVisits}
              subtitle="Completed visits"
              icon={History}
              variant="accent"
            />
            <StatsCard
              title="Avg. Duration"
              value={`${avgDuration}m`}
              subtitle="Average stay time"
              icon={Clock}
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Active Attendees</h3>
          <span className="text-sm text-muted-foreground">{activeCount} currently inside</span>
        </div>

        {loadingCheckins ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : activeCheckins && activeCheckins.length > 0 ? (
          <div className="space-y-3">
            {activeCheckins.map((checkin) => (
              <ActiveAttendeeCard key={checkin.id} checkin={checkin} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No Active Check-ins</h3>
            <p className="text-sm text-muted-foreground">
              Attendees will appear here when they check in
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
