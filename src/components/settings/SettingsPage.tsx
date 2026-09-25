import { useState, useEffect } from 'react';
import { Settings, Building, Mail, Users, Shield, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSettings, useAdminUsers, useRemoveAdmin, VenueSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function SettingsPage() {
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const { data: admins, isLoading: loadingAdmins } = useAdminUsers();
  const { mutate: updateSettings, isPending: updating } = useUpdateSettings();
  const { mutate: removeAdmin } = useRemoveAdmin();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<Partial<VenueSettings>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = () => {
    if (settings?.id) {
      updateSettings({ id: settings.id, ...formData });
    }
  };

  const widgetUrl = `${window.location.origin}/widget`;
  const embedCode = `<iframe src="${widgetUrl}" width="300" height="150" frameborder="0" style="border-radius: 12px; overflow: hidden;"></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingSettings) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Configure your venue settings</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your venue and notification preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Venue Settings */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Venue Configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venue_name">Venue Name</Label>
              <Input
                id="venue_name"
                value={formData.venue_name || ''}
                onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                placeholder="Enter venue name"
                className="bg-secondary border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_capacity">Maximum Capacity</Label>
              <Input
                id="max_capacity"
                type="number"
                value={formData.max_capacity || ''}
                onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || null })}
                placeholder="Enter max capacity (optional)"
                className="bg-secondary border-border/50"
              />
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Email Notifications</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">Send emails to attendees</p>
              </div>
              <Switch
                checked={formData.email_notifications_enabled ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, email_notifications_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Check-in Emails</p>
                <p className="text-sm text-muted-foreground">Notify on check-in</p>
              </div>
              <Switch
                checked={formData.email_on_checkin ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, email_on_checkin: checked })}
                disabled={!formData.email_notifications_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Check-out Emails</p>
                <p className="text-sm text-muted-foreground">Notify on check-out</p>
              </div>
              <Switch
                checked={formData.email_on_checkout ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, email_on_checkout: checked })}
                disabled={!formData.email_notifications_enabled}
              />
            </div>
          </div>
        </div>

        {/* Widget Settings */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ExternalLink className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Live Widget</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Widget</p>
                <p className="text-sm text-muted-foreground">Allow public access to attendance counter</p>
              </div>
              <Switch
                checked={formData.widget_enabled ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, widget_enabled: checked })}
              />
            </div>

            {formData.widget_enabled && (
              <div className="space-y-2">
                <Label>Embed Code</Label>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-secondary text-xs overflow-x-auto">
                    {embedCode}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={copyEmbedCode}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <a
                  href={widgetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Preview widget <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Admin Users */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Admin Users</h3>
          </div>

          {loadingAdmins ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : admins && admins.length > 0 ? (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[150px]">
                        {admin.user_id === user?.id ? 'You' : admin.user_id.slice(0, 8) + '...'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{admin.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {admin.role !== 'super_admin' && admin.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeAdmin(admin.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No admin users found</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updating} size="lg">
          <Settings className="h-4 w-4" />
          {updating ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
