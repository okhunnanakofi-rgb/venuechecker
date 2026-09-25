import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WidgetData {
  venue_name: string;
  current_count: number;
  max_capacity: number | null;
}

const Widget = () => {
  const [data, setData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch venue settings
      const { data: settings } = await supabase
        .from('venue_settings')
        .select('venue_name, max_capacity, widget_enabled')
        .eq('widget_enabled', true)
        .limit(1)
        .maybeSingle();

      if (!settings) {
        setData(null);
        return;
      }

      // Fetch current check-in count
      const { count } = await supabase
        .from('attendee_checkin')
        .select('*', { count: 'exact', head: true })
        .eq('checked_in', true);

      setData({
        venue_name: settings.venue_name,
        current_count: count || 0,
        max_capacity: settings.max_capacity,
      });
    } catch (error) {
      console.error('Error fetching widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel('widget-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendee_checkin',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(222,47%,12%)] flex items-center justify-center p-4">
        <div className="animate-pulse text-[hsl(215,20%,55%)]">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(222,47%,12%)] flex items-center justify-center p-4">
        <div className="text-[hsl(215,20%,55%)] text-center">
          <p>Widget not available</p>
        </div>
      </div>
    );
  }

  const capacityPercent = data.max_capacity
    ? Math.min((data.current_count / data.max_capacity) * 100, 100)
    : 0;

  const getStatusColor = () => {
    if (!data.max_capacity) return 'hsl(160, 84%, 39%)';
    if (capacityPercent < 50) return 'hsl(160, 84%, 39%)';
    if (capacityPercent < 80) return 'hsl(35, 92%, 50%)';
    return 'hsl(0, 84%, 60%)';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(222,47%,12%)] flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'linear-gradient(145deg, hsl(222, 47%, 10%), hsl(222, 47%, 7%))',
            border: '1px solid hsl(222, 30%, 18%)',
            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${getStatusColor()}20` }}
            >
              <Users className="h-4 w-4" style={{ color: getStatusColor() }} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'hsl(210, 40%, 98%)' }}>
              {data.venue_name}
            </span>
          </div>

          <div className="mb-4">
            <div
              className="text-5xl font-bold mb-1"
              style={{ color: getStatusColor() }}
            >
              {data.current_count}
            </div>
            <div className="text-sm" style={{ color: 'hsl(215, 20%, 55%)' }}>
              {data.max_capacity ? `of ${data.max_capacity}` : 'currently inside'}
            </div>
          </div>

          {data.max_capacity && (
            <div className="space-y-2">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'hsl(222, 30%, 18%)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${capacityPercent}%`,
                    backgroundColor: getStatusColor(),
                  }}
                />
              </div>
              <div className="text-xs" style={{ color: 'hsl(215, 20%, 55%)' }}>
                {capacityPercent.toFixed(0)}% capacity
              </div>
            </div>
          )}

          <div
            className="mt-4 pt-4 text-[10px]"
            style={{ borderTop: '1px solid hsl(222, 30%, 18%)', color: 'hsl(215, 20%, 45%)' }}
          >
            Powered by VenueCheck
          </div>
        </div>
      </div>
    </div>
  );
};

export default Widget;
