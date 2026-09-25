-- Create attendees table (master list of all attendees)
CREATE TABLE public.attendees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendee_checkin table (active check-ins)
CREATE TABLE public.attendee_checkin (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    qr_code TEXT NOT NULL,
    checked_in BOOLEAN NOT NULL DEFAULT true,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendee_history table (historical records)
CREATE TABLE public.attendee_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    qr_code TEXT NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_history ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (for venue management - no auth required for this demo)
CREATE POLICY "Allow public read on attendees" ON public.attendees FOR SELECT USING (true);
CREATE POLICY "Allow public insert on attendees" ON public.attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on attendees" ON public.attendees FOR UPDATE USING (true);

CREATE POLICY "Allow public read on attendee_checkin" ON public.attendee_checkin FOR SELECT USING (true);
CREATE POLICY "Allow public insert on attendee_checkin" ON public.attendee_checkin FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on attendee_checkin" ON public.attendee_checkin FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on attendee_checkin" ON public.attendee_checkin FOR DELETE USING (true);

CREATE POLICY "Allow public read on attendee_history" ON public.attendee_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on attendee_history" ON public.attendee_history FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on attendees
CREATE TRIGGER update_attendees_updated_at
    BEFORE UPDATE ON public.attendees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for active check-ins
ALTER TABLE public.attendee_checkin REPLICA IDENTITY FULL;

-- Create index for faster lookups
CREATE INDEX idx_attendee_checkin_qr_code ON public.attendee_checkin(qr_code);
CREATE INDEX idx_attendee_checkin_checked_in ON public.attendee_checkin(checked_in);
CREATE INDEX idx_attendees_qr_code ON public.attendees(qr_code);