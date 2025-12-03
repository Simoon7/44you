import { useState } from 'react';
import { OnboardingScreen } from './components/OnboardingScreen';
import { StartScreen } from './components/StartScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { NewMainDashboard } from './components/NewMainDashboard';
import { PersonalityScreen } from './components/PersonalityScreen';
import { CompatibilityScreen } from './components/CompatibilityScreen';
import { MatchingScreen } from './components/MatchingScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { ChatRoomScreen } from './components/ChatRoomScreen';
import './styles/App.css';

type Screen = 'onboarding' | 'start' | 'login' | 'signup' | 'main' | 'personality' | 'compatibility' | 'matching' | 'community' | 'chatroom';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');

  const renderScreen = () => {
    if (currentScreen === 'onboarding') {
      return (
        <OnboardingScreen 
          onComplete={() => setCurrentScreen('start')}
        />
      );
    }
    if (currentScreen === 'start') {
      return (
        <StartScreen 
          onNavigateToLogin={() => setCurrentScreen('login')}
          onNavigateToSignup={() => setCurrentScreen('signup')}
        />
      );
    }
    if (currentScreen === 'login') {
      return (
        <LoginScreen 
          onNavigateToSignup={() => setCurrentScreen('signup')}
          onBack={() => setCurrentScreen('start')}
          onLoginSuccess={() => setCurrentScreen('main')}
        />
      );
    }
    if (currentScreen === 'signup') {
      return <SignupScreen onBack={() => setCurrentScreen('start')} />;
    }
    if (currentScreen === 'main') {
      return (
        <NewMainDashboard 
          onLogout={() => setCurrentScreen('start')}
          onNavigateToPersonality={() => setCurrentScreen('personality')}
          onNavigateToCompatibility={() => setCurrentScreen('compatibility')}
          onNavigateToMatching={() => setCurrentScreen('matching')}
          onNavigateToCommunity={() => setCurrentScreen('community')}
          onNavigateToChatRoom={() => setCurrentScreen('chatroom')}
        />
      );
    }
    if (currentScreen === 'personality') {
      return <PersonalityScreen onBack={() => setCurrentScreen('main')} />;
    }
    if (currentScreen === 'compatibility') {
      return <CompatibilityScreen onBack={() => setCurrentScreen('main')} />;
    }
    if (currentScreen === 'matching') {
      return <MatchingScreen onBack={() => setCurrentScreen('main')} />;
    }
    if (currentScreen === 'community') {
      return <CommunityScreen onBack={() => setCurrentScreen('main')} />;
    }
    if (currentScreen === 'chatroom') {
      return <ChatRoomScreen onBack={() => setCurrentScreen('main')} />;
    }
    return null;
  };

  return (
    <div className="app-container">
      <div className="app-content">
        {renderScreen()}
      </div>
    </div>
  );
}
