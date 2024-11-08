import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Logger } from '@/lib/logger';
import type { User } from '@/types/api';

interface LoginFormProps {
  onSuccess: () => void;
}
// Add type guard for Error
function isError(error: unknown): error is Error {
    return error instanceof Error;
  }
export function LoginForm({ onSuccess }: LoginFormProps) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      api.setCredentials(credentials.username, credentials.password);
      const user = await api.fetch<User>('/user');
      Logger.info('Login successful', { userId: user.id });
      onSuccess();
    } catch (err) {
      Logger.error('Login failed', isError(err) ? err : new Error(String(err)));
      setError('Invalid API credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-96">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="API Username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="API Password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              disabled={loading}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}