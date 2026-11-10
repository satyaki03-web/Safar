import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { SplashScreen } from './screens/SplashScreen';
import { OwnerHomeScreen } from './screens/OwnerHomeScreen';
import { DriverHomeScreen } from './screens/DriverHomeScreen';
import { VehicleModal } from './components/VehicleModal';
import { DriverOnboardingModal } from './components/DriverOnboardingModal';
import { DriverEarningsScreen } from './components/DriverEarningsScreen';
import { TripHistoryModal } from './components/TripHistoryModal';
import { SettingsAndProfileModal } from './components/SettingsAndProfileModal';
import { AnimatedOpeningScreen } from './components/AnimatedOpeningScreen';

function MainApp() {
  const { user, activeRole, isOnline } = useApp();

  const [showVehicles, setShowVehicles] = useState(false);
  const [showDriverProfile, setShowDriverProfile] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOpeningIntro, setShowOpeningIntro] = useState(true);

  React.useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('open-settings', handleOpenSettings);
    };
  }, []);

  return (
    <>
      {showOpeningIntro && (
        <AnimatedOpeningScreen onFinish={() => setShowOpeningIntro(false)} />
      )}

      {!user ? (
        <SplashScreen onComplete={() => {}} />
      ) : (
        <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#0E0E0E]">
          {/* Top Navbar */}
          <Navbar
            onOpenProfile={() => setShowSettings(true)}
          />

      {/* Main Experience View */}
      <main className="flex-1 relative overflow-hidden">
        {activeRole === 'owner' ? (
          <OwnerHomeScreen onOpenVehicles={() => setShowVehicles(true)} />
        ) : (
          <DriverHomeScreen
            onOpenDriverProfile={() => setShowDriverProfile(true)}
            onOpenEarnings={() => setShowEarnings(true)}
          />
        )}
      </main>

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-[1900] bg-[#0E0E0E] text-[#FFFFFF] px-4 py-3 rounded-[8px] border border-[#E4E4E4] text-xs flex items-center gap-2.5 shadow-floating">
          <span className="w-2 h-2 rounded-full bg-[#C8321E] shrink-0" />
          <span>Offline mode: Local trip cache active. Reconnecting...</span>
        </div>
      )}

      {/* Global Modals */}
      <VehicleModal
        isOpen={showVehicles}
        onClose={() => setShowVehicles(false)}
      />

      <DriverOnboardingModal
        isOpen={showDriverProfile}
        onClose={() => setShowDriverProfile(false)}
      />

      <DriverEarningsScreen
        isOpen={showEarnings}
        onClose={() => setShowEarnings(false)}
      />

      <TripHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

        <SettingsAndProfileModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenVehicles={() => setShowVehicles(true)}
        onOpenDriverProfile={() => setShowDriverProfile(true)}
        onOpenEarnings={() => setShowEarnings(true)}
        onOpenHistory={() => setShowHistory(true)}
      />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
