import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Mail, Phone, User, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegisterAttendee, useAttendees } from '@/hooks/useAttendees';
import { BulkImportDialog } from '@/components/import/BulkImportDialog';
import { BadgeGenerator } from '@/components/badges/BadgeGenerator';
import { Attendee } from '@/types/attendance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [registeredAttendee, setRegisteredAttendee] = useState<Attendee | null>(null);
  const { mutate: registerAttendee, isPending } = useRegisterAttendee();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerAttendee({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
    }, {
      onSuccess: (attendee) => {
        setRegisteredAttendee(attendee);
        reset();
      },
    });
  };

  const downloadQR = () => {
    if (!registeredAttendee) return;
    
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0, 300, 300);
      
      const link = document.createElement('a');
      link.download = `${registeredAttendee.full_name.replace(/\s+/g, '_')}_QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['attendees'] });
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Register Attendee</h2>
          <p className="text-muted-foreground">Add a new attendee and generate their QR code</p>
        </div>
        <div className="flex gap-2">
          <BulkImportDialog onImportComplete={handleImportComplete} />
          <BadgeGenerator />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name
          </Label>
          <Input
            id="full_name"
            placeholder="John Doe"
            {...register('full_name')}
            className="bg-secondary border-border/50"
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            className="bg-secondary border-border/50"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number (Optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            {...register('phone')}
            className="bg-secondary border-border/50"
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          <UserPlus className="h-5 w-5" />
          {isPending ? 'Registering...' : 'Register Attendee'}
        </Button>
      </form>

      <Dialog open={!!registeredAttendee} onOpenChange={() => setRegisteredAttendee(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Registration Complete!</DialogTitle>
          </DialogHeader>
          {registeredAttendee && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={registeredAttendee.qr_code}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{registeredAttendee.full_name}</h3>
                <p className="text-sm text-muted-foreground">{registeredAttendee.email}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {registeredAttendee.qr_code}
                </p>
              </div>
              <Button onClick={downloadQR} variant="success" className="w-full">
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
