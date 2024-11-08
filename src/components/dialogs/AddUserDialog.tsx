import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/lib/hooks/useApi';
import { Logger } from '@/lib/logger';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  selectedAccounts: string[];
  onSuccess: () => void;
}

export function AddUserDialog({ open, onClose, selectedAccounts, onSuccess }: AddUserDialogProps) {
  const { request, loading } = useApi();
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    roles: 'partial'
  });

  const handleSubmit = async () => {
    try {
      // Create user for each selected account
      for (const accountId of selectedAccounts) {
        await request(`/accounts/${accountId}/account_users`, {
          method: 'POST',
          body: JSON.stringify({
            user: {
              ...userData,
              account_id: accountId,
            }
          })
        });
        Logger.info(`Created user for account ${accountId}`);
      }
      onSuccess();
      onClose();
    } catch (error) {
      Logger.error('Failed to create user', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Input
            placeholder="First Name"
            value={userData.first_name}
            onChange={(e) => setUserData({...userData, first_name: e.target.value})}
            disabled={loading}
          />
          <Input
            placeholder="Last Name"
            value={userData.last_name}
            onChange={(e) => setUserData({...userData, last_name: e.target.value})}
            disabled={loading}
          />
          <Input
            placeholder="Email"
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({...userData, email: e.target.value})}
            disabled={loading}
          />
          <Select
            value={userData.roles}
            onValueChange={(value) => setUserData({...userData, roles: value})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="full,billing">Full + Billing</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="partial,billing">Partial + Billing</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Adding User...' : 'Add User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}