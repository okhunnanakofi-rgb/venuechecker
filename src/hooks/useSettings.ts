import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VenueSettings {
  id: string;
  venue_name: string;
  max_capacity: number | null;
  email_notifications_enabled: boolean;
  email_on_checkin: boolean;
  email_on_checkout: boolean;
  widget_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useSettings = () => {
  return useQuery({
    queryKey: ['venue-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as VenueSettings | null;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<VenueSettings> & { id: string }) => {
      const { id, ...updateData } = settings;
      const { data, error } = await supabase
        .from('venue_settings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-settings'] });
      toast.success('Settings updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
};

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'super_admin';
  created_at: string;
  email?: string;
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminUser[];
    },
  });
};

export const useAddAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'super_admin' }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin added successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add admin: ${error.message}`);
    },
  });
};

export const useRemoveAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin removed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove admin: ${error.message}`);
    },
  });
};
