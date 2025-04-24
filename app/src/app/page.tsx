'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Footer from './components/Footer';
import PredictionCard from './components/PredictionCard';
import LoginForm from './components/LoginForm';
import CreateMarketForm from './components/CreateMarketForm';
import { useAuraxToken } from './hooks/useAuraxToken';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

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

interface Prediction {
  id: string;
  question: string;
  description: string;
  endDate: string;
  status: 'open' | 'closed';
}

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [votes, setVotes] = useState<VoteState>({
    '1': { yes: 0, no: 0 },
    '2': { yes: 0, no: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([
    {
      id: '1',
      question: 'Will SpaceX reach Mars by 2025?',
      description:
        'This prediction is about SpaceX successfully landing a crewed mission on Mars by the end of 2025.',
      endDate: '2025-12-31',
      status: 'open',
    },
    {
      id: '2',
      question:
        'Will quantum computers achieve quantum supremacy in cryptography by 2024?',
      description:
        'This prediction is about quantum computers demonstrating clear superiority over classical computers in breaking current cryptographic systems.',
      endDate: '2024-12-31',
      status: 'open',
    },
  ]);
  const [zkpVerifying, setZkpVerifying] = useState(false);
  const [zkpVerified, setZkpVerified] = useState(false);
  const [mounted, setMounted] = useState(false);

  const initializeGoogleButton = () => {
    console.log('Initializing Google Sign-In...');
    if (window.google?.accounts) {
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
    }
  };

  useEffect(() => {
    const loadGoogleScript = () => {
      if (!window.google?.accounts) {
        console.log('Loading Google Identity Services script...');
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Script loaded, initializing...');
          initializeGoogleButton();
        };
        document.body.appendChild(script);
      } else {
        console.log('Google Identity Services already loaded');
        initializeGoogleButton();
      }
    };

    loadGoogleScript();

    return () => {
      // Cleanup
      const button = document.getElementById('google-btn');
      if (button) {
        button.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
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

      // Set basic user info without expert status
      const userData = {
        email: decoded.email,
        name: decoded.name,
        loginMethod: 'google' as const,
        id_token: id_token,
        isExpert: false, // Default to false until ZKP verification
        answers: [],
      };

      setUser(userData);
      console.log('User state updated');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (email: string) => {
    try {
      setIsLoading(true);
      // Simple email login without verification
      setUser({
        email,
        name: email.split('@')[0],
        loginMethod: 'email',
        isExpert: false,
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
    setZkpVerified(false);
    // Reset votes to initial state
    setVotes({
      '1': { yes: 0, no: 0 },
      '2': { yes: 0, no: 0 },
    });
    // Reset predictions to initial state
    setPredictions([
      {
        id: '1',
        question: 'Will SpaceX reach Mars by 2025?',
        description:
          'This prediction is about SpaceX successfully landing a crewed mission on Mars by the end of 2025.',
        endDate: '2025-12-31',
        status: 'open',
      },
      {
        id: '2',
        question:
          'Will quantum computers achieve quantum supremacy in cryptography by 2024?',
        description:
          'This prediction is about quantum computers demonstrating clear superiority over classical computers in breaking current cryptographic systems.',
        endDate: '2024-12-31',
        status: 'open',
      },
    ]);

    if (window.google?.accounts) {
      window.google.accounts.id.disableAutoSelect();
      setTimeout(() => {
        initializeGoogleButton();
      }, 100);
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

  const handleMarketStatusChange = (
    marketId: string,
    status: 'open' | 'closed'
  ) => {
    setPredictions(
      predictions.map((prediction) =>
        prediction.id === marketId ? { ...prediction, status } : prediction
      )
    );
  };

  const handleCreateMarket = ({
    question,
    description,
  }: {
    question: string;
    description: string;
  }) => {
    const newMarket = {
      id: (predictions.length + 1).toString(),
      question,
      description,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'open' as const,
    };

    setPredictions([...predictions, newMarket]);
    setShowCreateForm(false);
  };

  const handleZKPVerification = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      setZkpVerifying(true);
      const response = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          id_token: user.id_token,
          type: user.loginMethod === 'google' ? 'jwt' : 'domain',
        }),
      });

      const result = await response.json();

      if (result.verified) {
        setZkpVerified(true);
        if (result.isExpert) {
          setUser((prev) => (prev ? { ...prev, isExpert: true } : prev));
        }
        alert(result.message || 'Verification successful!');
      } else {
        alert(result.error || 'Verification failed');
      }
    } catch (error) {
      console.error('ZKP Verification failed:', error);
      alert(
        'Verification failed: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setZkpVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-40 right-4 bg-black bg-opacity-75 text-white p-2 text-xs rounded z-50">
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
          <div className="mb-6 p-3 bg-white rounded-lg shadow max-w-2xl">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold whitespace-nowrap">
                eMail Sign In
              </h2>
              <div className="flex items-center gap-4">
                <div id="google-btn"></div>
                <LoginForm onLogin={handleEmailLogin} />
              </div>
            </div>
          </div>
        )}

        {user && (
          <div className="mb-6 p-3 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Logged in as: {user.email}
                  {user.isExpert && ' (Expert)'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleZKPVerification}
                  disabled={zkpVerifying || zkpVerified}
                  className={`px-3 py-2 rounded ${
                    zkpVerified
                      ? 'bg-green-500 text-white'
                      : zkpVerifying
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {zkpVerified
                    ? '✓ ZKP Verified'
                    : zkpVerifying
                    ? 'Verifying...'
                    : 'Verify with ZKP'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            {user?.isExpert && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create New Market
              </button>
            )}
          </div>

          {showCreateForm && (
            <CreateMarketForm
              onSubmit={handleCreateMarket}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          <div className="space-y-6">
            {predictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                question={prediction.question}
                description={prediction.description}
                endDate={prediction.endDate}
                status={prediction.status}
                onVote={(answer) => handleVote(prediction.id, answer)}
                onStatusChange={(status) =>
                  handleMarketStatusChange(prediction.id, status)
                }
                voteCounts={votes[prediction.id] || { yes: 0, no: 0 }}
                isExpert={user?.isExpert ?? false}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
