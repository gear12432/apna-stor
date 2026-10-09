import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ProfileSetup from './pages/ProfileSetup';
import Home from './pages/Home';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Customers from './pages/Customers';
import Products from './pages/Products';
import DailyWorkPage from './pages/DailyWork';
import Reminders from './pages/Reminders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { testFirestoreConnection } from './firebase';

function MainRouter() {
  const { currentUser, userProfile, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'forgot-password'>('login');

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  // Unauthenticated user flow
  if (!currentUser) {
    if (authScreen === 'signup') {
      return <Signup onNavigate={(screen) => setAuthScreen(screen as any)} />;
    }
    if (authScreen === 'forgot-password') {
      return <ForgotPassword onNavigate={(screen) => setAuthScreen(screen as any)} />;
    }
    return <Login onNavigate={(screen) => setAuthScreen(screen as any)} />;
  }

  // Authenticated routing
  const navigateBackToHome = () => setCurrentScreen('home');

  switch (currentScreen) {
    case 'sales':
      return <Sales onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'purchases':
      return <Purchases onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'expenses':
      return <Expenses onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'payments':
      return <Payments onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'customers':
      return <Customers onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'products':
      return <Products onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'daily-work':
      return <DailyWorkPage onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'reminders':
      return <Reminders onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'reports':
      return <Reports onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'settings':
      return <Settings onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'profile':
      return <Profile onBack={navigateBackToHome} onNavigate={setCurrentScreen} />;
    case 'profile-setup':
      return <ProfileSetup onComplete={() => setCurrentScreen('home')} />;
    case 'home':
    default:
      return <Home onNavigate={setCurrentScreen} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
