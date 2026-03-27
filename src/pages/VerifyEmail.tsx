/**
 * Verify Email Page
 *
 * Two modes:
 * 1. No token → "Check your email" prompt (user just signed up)
 * 2. With ?token= → verifies email and shows success/error
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail, resendVerification } from '@/integrations/api/auth';
import { getErrorMessage } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import yolunoLogo from '@/assets/landing/yoluno-logo.png';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  const [status, setStatus] = useState<'waiting' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'waiting'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState(emailParam || '');
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(getErrorMessage(err));
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setIsResending(true);
    try {
      await resendVerification(resendEmail);
      toast.success('Verification email sent! Check your inbox.');
    } catch {
      toast.error('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const showResendActions = status === 'waiting' || status === 'error';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 block">
            <img src={yolunoLogo} alt="Yoluno" className="h-12 mx-auto" />
          </Link>

          {status === 'waiting' && (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Verify your email</CardTitle>
              <CardDescription className="text-muted-foreground">
                We've sent a verification link to your email.
                Please check your inbox and click the link to verify your account.
              </CardDescription>
            </>
          )}

          {status === 'loading' && (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Verifying your email...</CardTitle>
              <CardDescription className="text-muted-foreground">
                Please wait while we verify your email address.
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Email verified!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your email has been verified successfully. You can now sign in to your account.
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-foreground">Verification failed</CardTitle>
              <CardDescription className="text-muted-foreground">
                {errorMessage || 'The verification link is invalid or has expired.'}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {status === 'success' && (
            <Link to="/login">
              <Button className="w-full">Sign in to your account</Button>
            </Link>
          )}

          {showResendActions && (
            <>
              {!emailParam && (
                <input
                  type="email"
                  placeholder="Enter your email to resend"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </Button>
              {status === 'waiting' && (
                <p className="text-center text-xs text-muted-foreground">
                  Didn't receive the email? Check your spam folder or resend it.
                </p>
              )}
              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  Back to login
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
