import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Download, Users, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { useAttendanceHistory } from '@/hooks/useAttendees';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CalendarView() {
  const { data: history, isLoading } = useAttendanceHistory();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get attendance count per day
  const attendanceByDay = useMemo(() => {
    if (!history) return {};
    
    const counts: Record<string, number> = {};
    history.forEach((record) => {
      const dateKey = format(parseISO(record.check_in_time), 'yyyy-MM-dd');
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [history]);

  // Get records for selected date
  const selectedDateRecords = useMemo(() => {
    if (!history || !selectedDate) return [];
    return history.filter((record) =>
      isSameDay(parseISO(record.check_in_time), selectedDate)
    );
  }, [history, selectedDate]);

  // Get records for selected range
  const selectedRangeRecords = useMemo(() => {
    if (!history || !selectedRange) return [];
    return history.filter((record) =>
      isWithinInterval(parseISO(record.check_in_time), {
        start: startOfDay(selectedRange.start),
        end: endOfDay(selectedRange.end),
      })
    );
  }, [history, selectedRange]);

  const handleDayClick = (day: Date) => {
    if (rangeStart) {
      // Completing a range selection
      const start = rangeStart < day ? rangeStart : day;
      const end = rangeStart < day ? day : rangeStart;
      setSelectedRange({ start, end });
      setSelectedDate(null);
      setRangeStart(null);
    } else {
      // Start new selection
      setSelectedDate(day);
      setSelectedRange(null);
    }
  };

  const startRangeSelection = () => {
    if (selectedDate) {
      setRangeStart(selectedDate);
      toast.info('Click another date to complete the range');
    }
  };

  const clearSelection = () => {
    setSelectedDate(null);
    setSelectedRange(null);
    setRangeStart(null);
  };

  const exportSelectedRange = () => {
    if (selectedRangeRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const exportData = selectedRangeRecords.map((record) => ({
      'Attendee Name': record.attendee?.full_name || 'Unknown',
      'Email': record.attendee?.email || '',
      'Date': format(parseISO(record.check_in_time), 'yyyy-MM-dd'),
      'Check In': format(parseISO(record.check_in_time), 'HH:mm:ss'),
      'Check Out': format(parseISO(record.check_out_time), 'HH:mm:ss'),
      'Duration (minutes)': record.duration_minutes || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const fileName = selectedRange
      ? `attendance_${format(selectedRange.start, 'yyyy-MM-dd')}_to_${format(selectedRange.end, 'yyyy-MM-dd')}.xlsx`
      : `attendance_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    toast.success('Report exported successfully!');
  };

  const getDayColor = (count: number) => {
    if (count === 0) return '';
    if (count < 5) return 'bg-primary/20';
    if (count < 15) return 'bg-primary/40';
    if (count < 30) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  const isInRange = (day: Date) => {
    if (!selectedRange) return false;
    return isWithinInterval(day, {
      start: startOfDay(selectedRange.start),
      end: endOfDay(selectedRange.end),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar View</h2>
          <p className="text-muted-foreground">View attendance by date</p>
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar View</h2>
          <p className="text-muted-foreground">View attendance by date and export reports</p>
        </div>
        {(selectedDate || selectedRange) && (
          <div className="flex gap-2">
            {selectedDate && (
              <Button variant="outline" size="sm" onClick={startRangeSelection}>
                Select Range
              </Button>
            )}
            {selectedRange && (
              <Button size="sm" onClick={exportSelectedRange}>
                <Download className="h-4 w-4" />
                Export Range
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const count = attendanceByDay[dateKey] || 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isRangeSelected = isInRange(day);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground/50",
                    isSelected && "ring-2 ring-primary",
                    isRangeSelected && "bg-primary/30",
                    isToday && "ring-1 ring-accent",
                    getDayColor(count),
                    "hover:bg-secondary"
                  )}
                >
                  <span className={cn(isToday && "font-bold text-accent")}>
                    {format(day, 'd')}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span>1-4</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/40" />
              <span>5-14</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/60" />
              <span>15-29</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/80" />
              <span>30+</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">
                {selectedRange
                  ? `${format(selectedRange.start, 'MMM d')} - ${format(selectedRange.end, 'MMM d, yyyy')}`
                  : selectedDate
                  ? format(selectedDate, 'MMMM d, yyyy')
                  : 'Select a date'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedRange
                  ? `${selectedRangeRecords.length} visits`
                  : selectedDate
                  ? `${selectedDateRecords.length} visits`
                  : 'Click on a day to view details'}
              </p>
            </div>
          </div>

          {(selectedDate || selectedRange) && (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(selectedRange ? selectedRangeRecords : selectedDateRecords).length > 0 ? (
                (selectedRange ? selectedRangeRecords : selectedDateRecords).map((record) => (
                  <div key={record.id} className="p-3 rounded-lg bg-secondary">
                    <p className="font-medium truncate">{record.attendee?.full_name}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {format(parseISO(record.check_in_time), 'HH:mm')} - {format(parseISO(record.check_out_time), 'HH:mm')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {record.duration_minutes}m
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No visits recorded</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
