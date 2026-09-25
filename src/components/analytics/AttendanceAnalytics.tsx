import { useMemo } from 'react';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays, getHours } from 'date-fns';
import { BarChart3, TrendingUp, Clock, Users } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAttendanceHistory, useActiveCheckins } from '@/hooks/useAttendees';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(160, 84%, 39%)', 'hsl(35, 92%, 50%)', 'hsl(200, 84%, 50%)', 'hsl(280, 84%, 50%)'];

export function AttendanceAnalytics() {
  const { data: history, isLoading: loadingHistory } = useAttendanceHistory();
  const { data: activeCheckins, isLoading: loadingActive } = useActiveCheckins();

  // Daily attendance trend (last 14 days)
  const dailyTrend = useMemo(() => {
    if (!history) return [];

    const endDate = new Date();
    const startDate = subDays(endDate, 13);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const visits = history.filter((h) => {
        const checkInDate = format(parseISO(h.check_in_time), 'yyyy-MM-dd');
        return checkInDate === dayStr;
      });

      return {
        date: format(day, 'MMM d'),
        visits: visits.length,
        avgDuration: visits.length > 0
          ? Math.round(visits.reduce((sum, v) => sum + (v.duration_minutes || 0), 0) / visits.length)
          : 0,
      };
    });
  }, [history]);

  // Peak hours distribution
  const peakHours = useMemo(() => {
    if (!history) return [];

    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;

    history.forEach((h) => {
      const hour = getHours(parseISO(h.check_in_time));
      hourCounts[hour]++;
    });

    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      visits: count,
    }));
  }, [history]);

  // Duration distribution
  const durationDistribution = useMemo(() => {
    if (!history) return [];

    const buckets = [
      { name: '< 30min', min: 0, max: 30, count: 0 },
      { name: '30-60min', min: 30, max: 60, count: 0 },
      { name: '1-2hrs', min: 60, max: 120, count: 0 },
      { name: '2-4hrs', min: 120, max: 240, count: 0 },
      { name: '> 4hrs', min: 240, max: Infinity, count: 0 },
    ];

    history.forEach((h) => {
      const duration = h.duration_minutes || 0;
      const bucket = buckets.find((b) => duration >= b.min && duration < b.max);
      if (bucket) bucket.count++;
    });

    return buckets.map((b) => ({ name: b.name, value: b.count }));
  }, [history]);

  // Stats summary
  const stats = useMemo(() => {
    if (!history) return { totalVisits: 0, avgDuration: 0, peakHour: 'N/A', todayVisits: 0 };

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayVisits = history.filter((h) => 
      format(parseISO(h.check_in_time), 'yyyy-MM-dd') === today
    ).length;

    const avgDuration = history.length > 0
      ? Math.round(history.reduce((sum, h) => sum + (h.duration_minutes || 0), 0) / history.length)
      : 0;

    // Find peak hour
    const hourCounts: Record<number, number> = {};
    history.forEach((h) => {
      const hour = getHours(parseISO(h.check_in_time));
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHourNum = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakHourNum ? `${peakHourNum[0].padStart(2, '0')}:00` : 'N/A';

    return {
      totalVisits: history.length,
      avgDuration,
      peakHour,
      todayVisits,
    };
  }, [history]);

  const isLoading = loadingHistory || loadingActive;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Attendance insights and trends</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Attendance insights and trends</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Visits</p>
              <p className="text-2xl font-bold">{stats.totalVisits}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Visits</p>
              <p className="text-2xl font-bold">{stats.todayVisits}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold">{stats.avgDuration}m</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peak Hour</p>
              <p className="text-2xl font-bold">{stats.peakHour}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Trend */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Attendance (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(215, 20%, 55%)" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(215, 20%, 55%)" 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 10%)',
                    border: '1px solid hsl(222, 30%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="hsl(160, 84%, 39%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVisits)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Check-in by Hour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(215, 20%, 55%)" 
                  tick={{ fontSize: 10 }}
                  interval={2}
                />
                <YAxis 
                  stroke="hsl(215, 20%, 55%)" 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 10%)',
                    border: '1px solid hsl(222, 30%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                  }}
                />
                <Bar 
                  dataKey="visits" 
                  fill="hsl(35, 92%, 50%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duration Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Visit Duration Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={durationDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {durationDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 10%)',
                    border: '1px solid hsl(222, 30%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {durationDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-medium">({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Avg Duration Trend */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Average Duration Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(35, 92%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(35, 92%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(215, 20%, 55%)" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(215, 20%, 55%)" 
                  tick={{ fontSize: 12 }}
                  unit="m"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 10%)',
                    border: '1px solid hsl(222, 30%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                  }}
                  formatter={(value: number) => [`${value} min`, 'Avg Duration']}
                />
                <Area
                  type="monotone"
                  dataKey="avgDuration"
                  stroke="hsl(35, 92%, 50%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDuration)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
