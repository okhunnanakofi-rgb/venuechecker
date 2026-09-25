import { useState, useRef } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle, Users } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportRow {
  full_name: string;
  email: string;
  phone?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const generateQRCode = () => {
  return `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

export function BulkImportDialog({ onImportComplete }: { onImportComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setProgress(0);
    setResult(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const mappedData: ImportRow[] = data
          .map((row) => ({
            full_name: row['full_name'] || row['name'] || row['Full Name'] || row['Name'] || '',
            email: row['email'] || row['Email'] || row['EMAIL'] || '',
            phone: row['phone'] || row['Phone'] || row['PHONE'] || '',
          }))
          .filter((row) => row.full_name && row.email);

        setPreviewData(mappedData);
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setImporting(true);
    setProgress(0);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < previewData.length; i += batchSize) {
      batches.push(previewData.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const attendeesToInsert = batch.map((row) => ({
        full_name: row.full_name.trim(),
        email: row.email.trim().toLowerCase(),
        phone: row.phone?.trim() || null,
        qr_code: generateQRCode(),
      }));

      const { error } = await supabase.from('attendees').insert(attendeesToInsert);

      if (error) {
        result.failed += batch.length;
        result.errors.push(`Batch ${i + 1}: ${error.message}`);
      } else {
        result.success += batch.length;
      }

      setProgress(Math.round(((i + 1) / batches.length) * 100));
    }

    setResult(result);
    setImporting(false);

    if (result.success > 0) {
      toast.success(`Successfully imported ${result.success} attendees`);
      onImportComplete();
    }
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} attendees`);
    }
  };

  const downloadTemplate = () => {
    const template = 'full_name,email,phone\nJohn Doe,john@example.com,+1234567890\nJane Smith,jane@example.com,';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendee_import_template.csv';
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Import Attendees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!result && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with attendee data
                </p>
                <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <FileUp className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Click to upload CSV</p>
                    <p className="text-sm text-muted-foreground">
                      Columns: full_name, email, phone (optional)
                    </p>
                  </div>
                </label>
              </div>

              {previewData.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Preview: {previewData.length} attendees found
                  </p>
                  <div className="max-h-48 overflow-auto rounded-lg border border-border/50">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary sticky top-0">
                        <tr>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-t border-border/50">
                            <td className="p-2">{row.full_name}</td>
                            <td className="p-2 text-muted-foreground">{row.email}</td>
                          </tr>
                        ))}
                        {previewData.length > 10 && (
                          <tr className="border-t border-border/50">
                            <td colSpan={2} className="p-2 text-center text-muted-foreground">
                              ... and {previewData.length - 10} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {importing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Importing... {progress}%
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4" />
                    {importing ? 'Importing...' : `Import ${previewData.length} Attendees`}
                  </Button>
                </div>
              )}
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {result.success > 0 && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span>{result.success} imported</span>
                  </div>
                )}
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>{result.failed} failed</span>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                  <p className="font-medium text-destructive mb-1">Errors:</p>
                  {result.errors.map((err, idx) => (
                    <p key={idx} className="text-destructive/80">{err}</p>
                  ))}
                </div>
              )}

              <Button onClick={() => setOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
