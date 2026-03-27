/**
 * Forgot Password Page
 *
 * Collects user email and sends a password reset link.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/integrations/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { getErrorMessage } from '@/integrations/api/client';
import yolunoLogo from '@/assets/landing/yoluno-logo.png';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          <RouterLink to="/" className="mx-auto mb-4 block">
            <img src={yolunoLogo} alt="Yoluno" className="h-12 mx-auto" />
          </RouterLink>
          {sent ? (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Check your email</CardTitle>
              <CardDescription className="text-muted-foreground">
                If an account exists for <span className="font-medium">{email}</span>, we've sent a password reset link.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl text-foreground">Forgot password?</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {sent ? (
          <CardFooter className="flex flex-col gap-4">
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </CardFooter>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
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
                  autoFocus
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <Link
                to="/login"
                className="text-center text-sm text-muted-foreground hover:underline inline-flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to login
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
