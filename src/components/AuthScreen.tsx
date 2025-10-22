import { motion } from 'motion/react';
import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  onBack: () => void;
  onAuthSuccess: () => void;
}

export function AuthScreen({ onBack, onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setMessage('Account created! Please check your email to verify your account.');
          // Auto sign in after verification (if email confirmation is disabled)
          if (data.session) {
            setTimeout(() => {
              onAuthSuccess();
            }, 1500);
          }
        }
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.session) {
          setMessage('Welcome back! 🎵');
          setTimeout(() => {
            onAuthSuccess();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#667EEA] via-[#764BA2] to-[#F093FB]"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-20 right-10 w-40 h-40 rounded-full bg-[#FF69B4]/30 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 20, 0],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-[#00BFFF]/30 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          y: [0, -20, 0],
        }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 pt-16 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center mb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Auth Card */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <FloatingCard delay={0} rotation={0}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-white/70">
                  {isSignUp ? 'Sign up to unlock unlimited music generation' : 'Sign in to continue creating'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your username"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl text-white placeholder-white/50 border border-white/20 focus:border-white/40 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-white/80 text-sm mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl text-white placeholder-white/50 border border-white/20 focus:border-white/40 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl text-white placeholder-white/50 border border-white/20 focus:border-white/40 outline-none transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/20 border border-red-500/30"
                  >
                    <p className="text-red-200 text-sm">{error}</p>
                  </motion.div>
                )}

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-green-500/20 border border-green-500/30"
                  >
                    <p className="text-green-200 text-sm">{message}</p>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF69B4] to-[#00BFFF] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </>
                  ) : (
                    <>{isSignUp ? 'Create Account' : 'Sign In'}</>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </FloatingCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

