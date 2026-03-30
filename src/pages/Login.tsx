/**
 * Login Page
 *
 * User authentication page. Blocks unverified users with a resend option.
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { resendVerification } from '@/integrations/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { handleError } from '@/lib/errors';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { toast } from 'sonner';
import yolunoLogo from '@/assets/landing/yoluno-logo.png';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showNotVerified, setShowNotVerified] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email sent. Check your inbox.');
    } catch {
      toast.error('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowNotVerified(false);

    try {
      await signIn(email, password);
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo);
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setShowNotVerified(true);
      } else {
        handleError(error, {
          context: 'LoginPage',
          userMessage: 'Invalid email or password',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 block">
            <img src={yolunoLogo} alt="Yoluno" className="h-12 mx-auto" />
          </Link>
          <CardTitle className="text-h4 text-foreground">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to your Yoluno account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {showNotVerified && (
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                  <Mail className="h-5 w-5 text-gold" />
                </div>
                <p className="text-body-sm text-foreground/80 font-medium">
                  Please verify your email before signing in.
                </p>
                <p className="text-caption text-gold">
                  Check your inbox for the verification link we sent to{' '}
                  <span className="font-medium">{email}</span>.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={isResending}
                  className="border-gold/30 text-foreground/80 hover:bg-gold/10"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend verification email'
                  )}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-body-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <p className="text-center text-body-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
