'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Header from './components/Header';
import Footer from './components/Footer';
import PredictionCard from './components/PredictionCard';
import LoginForm from './components/LoginForm';

const GOOGLE_CLIENT_ID =
  '966100421808-9fcdcovoaq2866o82pglo1v8f2u4q9n0.apps.googleusercontent.com';

declare global {
  interface Window {
    google: any;
  }
}

interface UserData {
  email: string;
  name: string;
  loginMethod: 'google' | 'email';
  id_token?: string;
  isExpert: boolean;
  answers: { questionId: number; answer: boolean }[];
}

interface VoteCounts {
  yes: number;
  no: number;
}

interface VoteState {
  [questionId: string]: VoteCounts;
}

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [votes, setVotes] = useState<VoteState>({
    '1': { yes: 0, no: 0 },
    '2': { yes: 0, no: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeGoogle = () => {
      console.log('Initializing Google Sign-In...');
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      console.log('Rendering Google button...');
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn')!,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        }
      );
    };

    // Load the Google Identity Services script
    if (!window.google?.accounts) {
      console.log('Loading Google Identity Services script...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Script loaded, initializing...');
        initializeGoogle();
      };
      document.body.appendChild(script);
    } else {
      console.log('Google Identity Services already loaded');
      initializeGoogle();
    }

    return () => {
      // Cleanup
      const button = document.getElementById('google-btn');
      if (button) {
        button.innerHTML = '';
      }
    };
  }, []);

  const verifyExpertStatus = async (email: string, id_token?: string) => {
    try {
      const response = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id_token }),
      });

      if (!response.ok) {
        throw new Error('Expert verification failed');
      }

      const { isExpert } = await response.json();
      return isExpert;
    } catch (error) {
      console.error('Error verifying expert status:', error);
      return false;
    }
  };

  const handleCredentialResponse = async (response: any) => {
    console.log('Received Google credential response');
    setIsLoading(true);
    try {
      console.log('Decoding JWT...');
      const id_token = response.credential;
      const decoded: any = jwtDecode(id_token);
      console.log('JWT decoded successfully:', {
        email: decoded.email,
        name: decoded.name,
      });

      // Verify expert status through ZKP
      const proofResponse = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: id_token,
          email: decoded.email,
        }),
      });

      if (!proofResponse.ok) {
        throw new Error('Failed to verify expert status');
      }

      const { isExpert, verifiedDomain } = await proofResponse.json();
      console.log('Google login verification:', { isExpert, verifiedDomain });

      const userData = {
        email: decoded.email,
        name: decoded.name,
        loginMethod: 'google' as const,
        id_token: id_token,
        isExpert,
        answers: [],
      };

      setUser(userData);
      console.log('User state updated');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('Login process completed');
    }
  };

  const handleEmailLogin = async (email: string) => {
    try {
      setIsLoading(true);

      // Verify expert status through ZKP
      const proofResponse = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!proofResponse.ok) {
        throw new Error('Failed to verify email');
      }

      const { isExpert, verifiedDomain } = await proofResponse.json();
      console.log('Email login verification:', { isExpert, verifiedDomain });

      setUser({
        email,
        name: email.split('@')[0],
        loginMethod: 'email',
        isExpert, // Use the ZKP verification result
        answers: [],
      });
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setVotes({
      '1': { yes: 0, no: 0 },
      '2': { yes: 0, no: 0 },
    });
    if (window.google?.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const handleVote = async (questionId: string, answer: 'yes' | 'no') => {
    console.log('Vote attempt by user:', user);
    console.log('Is expert?', user?.isExpert);

    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    if (!user.isExpert) {
      alert('Only verified experts can vote on predictions');
      return;
    }

    setVotes((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [answer]: (prev[questionId]?.[answer] || 0) + 1,
      },
    }));

    console.log(
      `Vote recorded: ${answer} for question ${questionId} by verified expert`
    );
  };

  const handleManualGoogleSignIn = () => {
    console.log('Manual Google Sign-In clicked');
    if (window.google?.accounts) {
      window.google.accounts.id.prompt((notification: any) => {
        console.log('Prompt notification:', notification);
        if (notification.isNotDisplayed()) {
          console.error(
            'Prompt not displayed:',
            notification.getNotDisplayedReason()
          );
        }
        if (notification.isSkippedMoment()) {
          console.error('Prompt skipped:', notification.getSkippedReason());
        }
        if (notification.isDismissedMoment()) {
          console.error('Prompt dismissed:', notification.getDismissedReason());
        }
      });
    }
  };

  const predictions = [
    {
      id: '1',
      question: 'Will global temperatures rise by more than 1.5°C by 2030?',
      description:
        'Based on current climate models and trends, will global average temperatures exceed the 1.5°C threshold?',
      endDate: 'December 31, 2024',
    },
    {
      id: '2',
      question:
        'Will quantum computers achieve practical quantum advantage by 2025?',
      description:
        'Will a quantum computer solve a practical problem faster than classical computers?',
      endDate: 'December 31, 2024',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Add debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-0 right-0 bg-black text-white p-2 text-xs">
            Loading: {isLoading ? 'true' : 'false'}
            <br />
            User: {user ? user.email : 'none'}
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg">
              <p>Verifying credentials...</p>
            </div>
          </div>
        )}

        {!user && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Sign In</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2">Sign in with Google (Expert Access):</p>
                <div
                  id="google-btn"
                  className="w-full flex justify-center"
                ></div>
              </div>
              <div>
                <p className="mb-2">Or sign in with email:</p>
                <LoginForm onLogin={handleEmailLogin} />
              </div>
            </div>
          </div>
        )}

        {user && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <p>Welcome, {user.name}</p>
            <p className="text-sm text-gray-600">
              {user.loginMethod === 'google'
                ? '🔒 Expert status will be verified with Zero Knowledge Proof'
                : '⚠️ Non-expert access'}
            </p>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6">Expert Predictions</h1>

        <div className="space-y-6">
          {predictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              question={prediction.question}
              description={prediction.description}
              endDate={prediction.endDate}
              onVote={(answer) => handleVote(prediction.id, answer)}
              voteCounts={votes[prediction.id]}
              isExpert={Boolean(user?.isExpert)}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
