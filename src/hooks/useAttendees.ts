import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Attendee, AttendeeCheckin, AttendeeHistory } from '@/types/attendance';
import { toast } from 'sonner';

// Generate unique QR code
const generateQRCode = () => {
  return `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// Send notification email based on settings
const sendNotification = async (
  type: 'check_in' | 'check_out',
  attendee: Attendee,
  durationMinutes?: number
) => {
  try {
    // Check settings first
    const { data: settings } = await supabase
      .from('venue_settings')
      .select('email_notifications_enabled, email_on_checkin, email_on_checkout, venue_name')
      .limit(1)
      .maybeSingle();

    if (!settings?.email_notifications_enabled) {
      console.log('Email notifications disabled');
      return;
    }

    if (type === 'check_in' && !settings.email_on_checkin) {
      console.log('Check-in emails disabled');
      return;
    }

    if (type === 'check_out' && !settings.email_on_checkout) {
      console.log('Check-out emails disabled');
      return;
    }

    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        type,
        attendee_name: attendee.full_name,
        attendee_email: attendee.email,
        venue_name: settings.venue_name,
        timestamp: new Date().toISOString(),
        duration_minutes: durationMinutes,
      },
    });

    if (error) {
      console.error('Failed to send notification:', error);
    } else {
      console.log(`${type} notification sent to ${attendee.email}`);
    }
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};

// Fetch all attendees
export const useAttendees = () => {
  return useQuery({
    queryKey: ['attendees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Attendee[];
    },
  });
};

// Fetch active check-ins with real-time updates
export const useActiveCheckins = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('active-checkins-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendee_checkin',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['active-checkins'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['active-checkins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendee_checkin')
        .select(`
          *,
          attendee:attendees(*)
        `)
        .eq('checked_in', true)
        .order('check_in_time', { ascending: false });
      
      if (error) throw error;
      return data as (AttendeeCheckin & { attendee: Attendee })[];
    },
  });
};

// Fetch attendance history
export const useAttendanceHistory = () => {
  return useQuery({
    queryKey: ['attendance-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendee_history')
        .select(`
          *,
          attendee:attendees(*)
        `)
        .order('check_out_time', { ascending: false });
      
      if (error) throw error;
      return data as (AttendeeHistory & { attendee: Attendee })[];
    },
  });
};

// Register new attendee
export const useRegisterAttendee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attendeeData: { full_name: string; email: string; phone?: string }) => {
      const qr_code = generateQRCode();
      
      const { data, error } = await supabase
        .from('attendees')
        .insert({
          ...attendeeData,
          qr_code,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Attendee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendees'] });
      toast.success('Attendee registered successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Registration failed: ${error.message}`);
    },
  });
};

// Process QR scan (check-in or check-out)
export const useProcessScan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (qrCode: string) => {
      // First, find the attendee by QR code
      const { data: attendee, error: attendeeError } = await supabase
        .from('attendees')
        .select('*')
        .eq('qr_code', qrCode)
        .single();
      
      if (attendeeError || !attendee) {
        throw new Error('Invalid QR code. Attendee not found.');
      }
      
      // Check if there's an active check-in for this attendee
      const { data: activeCheckin, error: checkinError } = await supabase
        .from('attendee_checkin')
        .select('*')
        .eq('attendee_id', attendee.id)
        .eq('checked_in', true)
        .maybeSingle();
      
      if (checkinError) throw checkinError;
      
      if (activeCheckin) {
        // Attendee is checked in - process checkout
        const checkOutTime = new Date().toISOString();
        const checkInTime = new Date(activeCheckin.check_in_time);
        const durationMinutes = Math.round((new Date(checkOutTime).getTime() - checkInTime.getTime()) / 60000);
        
        // Insert into history
        const { error: historyError } = await supabase
          .from('attendee_history')
          .insert({
            attendee_id: attendee.id,
            qr_code: qrCode,
            check_in_time: activeCheckin.check_in_time,
            check_out_time: checkOutTime,
            duration_minutes: durationMinutes,
          });
        
        if (historyError) throw historyError;
        
        // Delete from active check-ins
        const { error: deleteError } = await supabase
          .from('attendee_checkin')
          .delete()
          .eq('id', activeCheckin.id);
        
        if (deleteError) throw deleteError;

        // Send checkout notification (non-blocking)
        sendNotification('check_out', attendee as Attendee, durationMinutes);
        
        return { action: 'check_out' as const, attendee, duration: durationMinutes };
      } else {
        // No active check-in - process check-in
        const { data: newCheckin, error: insertError } = await supabase
          .from('attendee_checkin')
          .insert({
            attendee_id: attendee.id,
            qr_code: qrCode,
            checked_in: true,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;

        // Send checkin notification (non-blocking)
        sendNotification('check_in', attendee as Attendee);
        
        return { action: 'check_in' as const, attendee, checkin: newCheckin };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['active-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      queryClient.invalidateQueries({ queryKey: ['attendees'] });
      
      if (result.action === 'check_in') {
        toast.success(`${result.attendee.full_name} checked in successfully!`);
      } else {
        toast.success(`${result.attendee.full_name} checked out. Duration: ${result.duration} minutes`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
