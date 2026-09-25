import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AttendeeHistory, Attendee } from '@/types/attendance';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: (AttendeeHistory & { attendee: Attendee })[];
}

export function ExportButton({ data }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const prepareData = () => {
    return data.map((record) => ({
      'Attendee Name': record.attendee?.full_name || 'Unknown',
      'Email': record.attendee?.email || '',
      'Phone': record.attendee?.phone || '',
      'QR Code': record.qr_code,
      'Check In Date': format(new Date(record.check_in_time), 'yyyy-MM-dd'),
      'Check In Time': format(new Date(record.check_in_time), 'HH:mm:ss'),
      'Check Out Date': format(new Date(record.check_out_time), 'yyyy-MM-dd'),
      'Check Out Time': format(new Date(record.check_out_time), 'HH:mm:ss'),
      'Duration (minutes)': record.duration_minutes || 0,
    }));
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const exportData = prepareData();
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers.map((header) => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendance_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = prepareData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance History');

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `attendance_history_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Excel file exported successfully!');
    } catch (error) {
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting || !data.length}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
