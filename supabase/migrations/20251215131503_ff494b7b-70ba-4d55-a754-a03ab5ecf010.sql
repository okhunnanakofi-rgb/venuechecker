-- Create venue_settings table for configuration
CREATE TABLE public.venue_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_name TEXT NOT NULL DEFAULT 'VenueCheck',
    max_capacity INTEGER DEFAULT NULL,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    email_on_checkin BOOLEAN NOT NULL DEFAULT true,
    email_on_checkout BOOLEAN NOT NULL DEFAULT true,
    widget_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on venue_settings
ALTER TABLE public.venue_settings ENABLE ROW LEVEL SECURITY;

-- Policies for venue_settings (admins only)
CREATE POLICY "Admins can view settings"
ON public.venue_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update settings"
ON public.venue_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert settings"
ON public.venue_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Public read for widget (only specific columns)
CREATE POLICY "Public can view widget data"
ON public.venue_settings
FOR SELECT
TO anon
USING (widget_enabled = true);

-- Insert default settings
INSERT INTO public.venue_settings (venue_name, max_capacity, email_notifications_enabled)
VALUES ('VenueCheck', 100, true);

-- Add trigger for updated_at
CREATE TRIGGER update_venue_settings_updated_at
BEFORE UPDATE ON public.venue_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();