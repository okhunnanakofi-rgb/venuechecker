import { useState, useRef } from 'react';
import { Printer, Check, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAttendees } from '@/hooks/useAttendees';
import { Attendee } from '@/types/attendance';

export function BadgeGenerator() {
  const [open, setOpen] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const { data: attendees, isLoading } = useAttendees();
  const printRef = useRef<HTMLDivElement>(null);

  const toggleAttendee = (id: string) => {
    const newSet = new Set(selectedAttendees);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAttendees(newSet);
  };

  const selectAll = () => {
    if (attendees) {
      if (selectedAttendees.size === attendees.length) {
        setSelectedAttendees(new Set());
      } else {
        setSelectedAttendees(new Set(attendees.map((a) => a.id)));
      }
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedList = attendees?.filter((a) => selectedAttendees.has(a.id)) || [];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendee Badges</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Arial', sans-serif; }
            .page { 
              width: 210mm; 
              padding: 10mm;
              page-break-after: always;
            }
            .badges-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10mm;
            }
            .badge {
              border: 2px solid #333;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              height: 80mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              break-inside: avoid;
            }
            .badge-header {
              font-size: 10px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .badge-name {
              font-size: 18px;
              font-weight: bold;
              margin: 10px 0;
              word-break: break-word;
            }
            .badge-email {
              font-size: 11px;
              color: #666;
              margin-bottom: 10px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              padding: 10px;
              background: white;
            }
            .badge-qr-code {
              font-size: 8px;
              color: #999;
              margin-top: 8px;
              font-family: monospace;
            }
            @media print {
              .page { page-break-after: always; }
              .badge { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="badges-grid">
              ${selectedList
                .map(
                  (attendee) => `
                <div class="badge">
                  <div>
                    <div class="badge-header">VenueCheck • Attendee Badge</div>
                    <div class="badge-name">${attendee.full_name}</div>
                    <div class="badge-email">${attendee.email}</div>
                  </div>
                  <div class="qr-container">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      attendee.qr_code
                    )}" alt="QR Code" width="120" height="120" />
                  </div>
                  <div class="badge-qr-code">${attendee.qr_code}</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4" />
          Print Badges
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Generate Badges
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Select attendees to print badges
            </p>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {attendees && selectedAttendees.size === attendees.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <ScrollArea className="h-80 rounded-lg border border-border/50 p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : attendees && attendees.length > 0 ? (
              <div className="space-y-2">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedAttendees.has(attendee.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-border'
                    }`}
                    onClick={() => toggleAttendee(attendee.id)}
                  >
                    <Checkbox
                      checked={selectedAttendees.has(attendee.id)}
                      onCheckedChange={() => toggleAttendee(attendee.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{attendee.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{attendee.email}</p>
                    </div>
                    {selectedAttendees.has(attendee.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No attendees registered</p>
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              {selectedAttendees.size} selected
            </p>
            <Button onClick={handlePrint} disabled={selectedAttendees.size === 0}>
              <Printer className="h-4 w-4" />
              Print {selectedAttendees.size} Badge{selectedAttendees.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>

        {/* Hidden print preview */}
        <div ref={printRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
