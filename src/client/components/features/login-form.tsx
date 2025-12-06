'use client';


import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from '@/client/components/ui/button';
import { Input } from '@/client/components/ui/input';
import { Label } from '@/client/components/ui/label';
import { useAuth } from '@/client/contexts/auth-context';
import { useToast } from '@/client/hooks/use-toast';
import { Alert, AlertDescription } from '@/client/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
       console.log("LoginForm: Attempting to sign in...");
       await signIn(email, password);
       console.log("LoginForm: Sign in successful. Redirecting to dashboard.");
      router.push('/dashboard'); 
    } catch (err: any) {
      console.error("LoginForm: An error occurred during sign in:", err);
      let errorMessage = 'E-Mail oder Passwort ist ungültig.';
      if (err.code === 'auth/network-request-failed') {
          errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.';
      } else if (err.message) {
          // Display the actual error message from Firebase for debugging
          errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="x.tool@ph-service.de"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          type="password"
          placeholder="Tell me everything.."
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      {error && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
                {error}
            </AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Anmelden...' : 'Anmelden'}
      </Button>
    </form>
  );
}
