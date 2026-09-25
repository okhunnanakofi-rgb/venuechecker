import { useState, useMemo } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { History, Clock, Calendar, User, Search, X } from 'lucide-react';
import { useAttendanceHistory } from '@/hooks/useAttendees';
import { ExportButton } from '@/components/export/ExportButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AttendanceHistory() {
  const { data: history, isLoading } = useAttendanceHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredHistory = useMemo(() => {
    if (!history) return [];

    return history.filter((record) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        record.attendee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.attendee?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.qr_code.toLowerCase().includes(searchQuery.toLowerCase());

      // Date filter
      let matchesDate = true;
      if (startDate || endDate) {
        const recordDate = parseISO(record.check_in_time);
        const start = startDate ? startOfDay(parseISO(startDate)) : new Date(0);
        const end = endDate ? endOfDay(parseISO(endDate)) : new Date(9999, 11, 31);
        matchesDate = isWithinInterval(recordDate, { start, end });
      }

      return matchesSearch && matchesDate;
    });
  }, [history, searchQuery, startDate, endDate]);

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = searchQuery || startDate || endDate;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance History</h2>
          <p className="text-muted-foreground">Complete record of all venue visits</p>
        </div>
        <ExportButton data={filteredHistory} />
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2 text-sm">
              <Search className="h-3.5 w-3.5" />
              Search
            </Label>
            <Input
              id="search"
              placeholder="Name, email, or QR code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary border-border/50"
            />
          </div>
          <div className="flex items-end">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredHistory.length} of {history?.length || 0} records
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredHistory.length > 0 ? (
        <>
          {/* Mobile View */}
          <div className="space-y-3 md:hidden">
            {filteredHistory.map((record) => (
              <div key={record.id} className="glass-card p-4 animate-slide-in">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{record.attendee?.full_name}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(record.check_in_time), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {record.duration_minutes}m
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {format(new Date(record.check_in_time), 'h:mm a')} → {format(new Date(record.check_out_time), 'h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Attendee</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Check In</TableHead>
                  <TableHead className="text-muted-foreground">Check Out</TableHead>
                  <TableHead className="text-muted-foreground text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((record) => (
                  <TableRow key={record.id} className="border-border/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.attendee?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{record.attendee?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.check_in_time), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.check_in_time), 'h:mm a')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.check_out_time), 'h:mm a')}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="status-checked-out px-2 py-1 rounded-full text-xs font-medium">
                        {record.duration_minutes}m
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">
            {hasFilters ? 'No Records Found' : 'No History Yet'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? 'Try adjusting your filters'
              : 'Attendance records will appear here after check-outs'}
          </p>
        </div>
      )}
    </div>
  );
}
