import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { ScanLine, Camera, CheckCircle2, LogOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProcessScan } from '@/hooks/useAttendees';
import { cn } from '@/lib/utils';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

interface ScanResult {
  action: 'check_in' | 'check_out';
  name: string;
  duration?: number;
}

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { mutate: processScan, isPending } = useProcessScan();

  const handleScan = (qrCode: string) => {
    if (isPending) return;
    
    processScan(qrCode, {
      onSuccess: (result) => {
        setStatus('success');
        setLastResult({
          action: result.action,
          name: result.attendee.full_name,
          duration: result.action === 'check_out' ? result.duration : undefined,
        });
        
        // Reset after 3 seconds
        setTimeout(() => {
          setStatus('idle');
          setLastResult(null);
        }, 3000);
      },
      onError: () => {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      },
    });
  };

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
      setStatus('scanning');
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setStatus('error');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
    setIsScanning(false);
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">QR Scanner</h2>
        <p className="text-muted-foreground">Scan attendee QR codes to check in or out</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="relative aspect-square bg-secondary">
          <div id="qr-reader" className="w-full h-full" />
          
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className={cn(
                "p-6 rounded-full transition-all duration-300",
                status === 'success' && "bg-success/20 animate-pulse-glow",
                status === 'error' && "bg-destructive/20",
                status === 'idle' && "bg-muted"
              )}>
                {status === 'success' && lastResult ? (
                  lastResult.action === 'check_in' ? (
                    <CheckCircle2 className="h-16 w-16 text-success" />
                  ) : (
                    <LogOut className="h-16 w-16 text-accent" />
                  )
                ) : status === 'error' ? (
                  <AlertCircle className="h-16 w-16 text-destructive" />
                ) : (
                  <ScanLine className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              {status === 'success' && lastResult && (
                <div className="text-center animate-fade-in">
                  <p className={cn(
                    "text-lg font-semibold",
                    lastResult.action === 'check_in' ? "text-success" : "text-accent"
                  )}>
                    {lastResult.action === 'check_in' ? 'Checked In' : 'Checked Out'}
                  </p>
                  <p className="text-foreground font-medium">{lastResult.name}</p>
                  {lastResult.duration && (
                    <p className="text-sm text-muted-foreground">
                      Duration: {lastResult.duration} minutes
                    </p>
                  )}
                </div>
              )}

              {status === 'error' && (
                <div className="text-center animate-fade-in">
                  <p className="text-lg font-semibold text-destructive">Scan Failed</p>
                  <p className="text-sm text-muted-foreground">Invalid or unregistered QR code</p>
                </div>
              )}

              {status === 'idle' && (
                <p className="text-muted-foreground">Camera not active</p>
              )}
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-primary/50" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary rounded-lg">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="h-0.5 bg-primary animate-scan-line" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <Button
            onClick={isScanning ? stopScanning : startScanning}
            variant={isScanning ? 'destructive' : 'success'}
            className="w-full"
            size="lg"
          >
            <Camera className="h-5 w-5" />
            {isScanning ? 'Stop Scanner' : 'Start Scanner'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter QR code..."
              className="flex-1 h-10 rounded-lg border border-border bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" disabled={!manualCode.trim() || isPending}>
              Submit
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
