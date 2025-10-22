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
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'mfa'>('credentials');
  const [mfaData, setMfaData] = useState<{ email: string; phone: string } | null>(null);
  const [code, setCode] = useState('');

  const { login, verifyMFA, sendMFACode, initiateMFALogin } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      
      console.log('Login successful:', response);
      showNotification('success', 'Login successful! Redirecting...');
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error: any) {
      console.log('Login error:', error.message);
      setError(error.message || 'Login failed');
      showNotification('error', error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMFAInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await initiateMFALogin(email);
      
      if (response.requiresMFA) {
        setPendingUserId(response.userId);
        setMfaRequired(true);
        setMfaData({
          email: email,
          phone: response.phone 
        });
        setCode(''); 
        setError('');
        showNotification('success', 'Verification code sent to your WhatsApp!');
      } else {
        setError('MFA is not enabled for this account. Please use regular login.');
        showNotification('warning', 'MFA is not enabled for this account.');
      }
    } catch (error: any) {
      setError(error.message);
      showNotification('error', error.message || 'Failed to send verification code.');
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
      showNotification('success', 'MFA verification successful! Redirecting...');
      
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
              <button
                onClick={() => {
                  setMfaRequired(false);
                  setMfaData(null);
                  setCode('');
                }}
                className="flex items-center text-sm text-pink-600 hover:text-pink-500 mb-4"
              >
                ← Back to MFA login
              </button>
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

  if (loginMethod === 'mfa') {
    return (
      <>
        <Head>
          <title>Login with MFA - Gine&apos;s Dessert</title>
        </Head>
        <div className="flex items-center justify-center bg-gray-50 py-[14rem] px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <button
                onClick={() => setLoginMethod('credentials')}
                className="flex items-center text-sm text-pink-600 hover:text-pink-500 mb-4"
              >
                ← Back to regular login
              </button>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Login with WhatsApp MFA
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Enter your email to receive a verification code via WhatsApp to the number that you registered with.
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleMFAInitiate}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                >
                  {loading ? 'Sending code...' : 'Send Verification Code'}
                </button>
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

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in with Credentials'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLoginMethod('mfa')}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.189-1.248-6.189-3.515-8.464"/>
                  </svg>
                  Sign in with WhatsApp MFA
                </span>
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              WhatsApp MFA is only available for accounts that have enabled it during registration
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