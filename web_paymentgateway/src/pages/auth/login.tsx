import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Notification from '../../components/Notification';
import { useNotification } from '../../hook/useNotification';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [mfaData, setMfaData] = useState<{ email: string; phone: string } | null>(null);
  const [code, setCode] = useState('');

  const { login, verifyMFA, sendMFACode } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      
      // After successful credentials check, initiate MFA
      if (response.requiresMFA) {
        setPendingUserId(response.userId);
        
        // Send MFA code automatically
        const mfaResponse = await sendMFACode(response.userId);
        
        setMfaData({
          email: email,
          phone: mfaResponse.phone 
        });
        setMfaRequired(true);
        setCode('');
        setError('');
        showNotification('success', 'Verification code sent to your WhatsApp!');
      }
      
    } catch (error: any) {
      console.log('Login error:', error.message);
      setError(error.message || 'Login failed');
      showNotification('error', error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyMFA(pendingUserId, code);
      showNotification('success', 'Login successful! Redirecting...');
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error: any) {
      setError(error.message);
      showNotification('error', error.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      await sendMFACode(pendingUserId);
      showNotification('success', 'New verification code sent successfully!');
    } catch (error: any) {
      setError('Failed to resend code: ' + error.message);
      showNotification('error', 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    const firstTwo = phone.slice(0, 2);
    const lastTwo = phone.slice(-2);
    const maskedLength = phone.length - 4;
    const mask = '•'.repeat(maskedLength);
    return `${firstTwo}${mask}${lastTwo}`;
  };

  if (mfaRequired && mfaData) {
    return (
      <>
        <Head>
          <title>Verify OTP Code - Gine&apos;s Dessert</title>
        </Head>
        <div className="flex items-center justify-center bg-gray-50 py-[14rem] px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Verify OTP Code
              </h2>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 text-center">
                  We sent a 6-digit verification code to your WhatsApp
                </p>
                <div className="mt-2 text-xs text-blue-600 text-center">
                  <p>Email: <span className="font-medium">{mfaData.email}</span></p>
                  <p>Phone: <span className="font-medium">{maskPhoneNumber(mfaData.phone)}</span></p>
                </div>
              </div>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleMFAVerify}>
              {error && (
                <div className={`px-4 py-3 rounded ${
                  error.includes('successfully') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 6-digit OTP Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm text-center text-lg font-semibold tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your WhatsApp
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP Code'}
                </button>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm text-pink-600 hover:text-pink-500 disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                  <span className="text-xs text-gray-500">
                    Code expires in 10 minutes
                  </span>
                </div>
              </div>
            </form>

            {/* Notification Component */}
            <Notification
              type={notification.type}
              message={notification.message}
              isVisible={notification.isVisible}
              onClose={hideNotification}
              duration={3000}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Login - Gine&apos;s Dessert</title>
      </Head>
      <div className="flex items-center justify-center bg-gray-50 py-[14rem] px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link href="/auth/register" className="font-medium text-pink-600 hover:text-pink-500">
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleCredentialsSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔒 Two-factor authentication via WhatsApp is required for all accounts
            </p>
          </div>

          {/* Notification Component */}
          <Notification
            type={notification.type}
            message={notification.message}
            isVisible={notification.isVisible}
            onClose={hideNotification}
            duration={3000}
          />
        </div>
      </div>
    </>
  );
}