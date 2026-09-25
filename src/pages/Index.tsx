import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { RegisterForm } from '@/components/register/RegisterForm';
import { QRScanner } from '@/components/scanner/QRScanner';
import { AttendanceHistory } from '@/components/history/AttendanceHistory';
import { AttendanceAnalytics } from '@/components/analytics/AttendanceAnalytics';
import { CalendarView } from '@/components/calendar/CalendarView';
import { SettingsPage } from '@/components/settings/SettingsPage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'register':
        return <RegisterForm />;
      case 'scan':
        return <QRScanner />;
      case 'history':
        return <AttendanceHistory />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <AttendanceAnalytics />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="container mx-auto px-4 py-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
