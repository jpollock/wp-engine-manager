// src/components/views/AccountsView.tsx
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination } from '@/components/shared/Pagination';
import { AddUserDialog } from '@/components/dialogs/AddUserDialog';
import { BulkUserManager } from '@/components/accounts/BulkUserManager';
import { useApi } from '@/lib/hooks/useApi';
import { Logger } from '@/lib/logger';
import type { Account, PaginatedResponse } from '@/types/api';

interface EnrichedAccount extends Account {
  userCount: number;
  siteCount: number;
  installCount: number;
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function AccountsView() {
  const { data, loading, error, request } = useApi<PaginatedResponse<Account>>();
  const [enrichedAccounts, setEnrichedAccounts] = useState<EnrichedAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showBulkManager, setShowBulkManager] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadAccounts = useCallback(async () => {
    try {
      const accountsResponse = await request(
        `/accounts?limit=${ITEMS_PER_PAGE}&offset=${(page - 1) * ITEMS_PER_PAGE}`
      );

      const enrichedAccountsData = await Promise.all(
        accountsResponse.results.map(async (account) => {
          try {
            const usersResponse = await request(`/accounts/${account.id}/account_users`);
            const sitesResponse = await request(`/sites?account_id=${account.id}`);
            const installsResponse = await request(`/installs?account_id=${account.id}`);

            return {
              ...account,
              userCount: usersResponse.results?.length || 0,
              siteCount: sitesResponse.results?.length || 0,
              installCount: installsResponse.results?.length || 0,
            };
          } catch (error) {
            Logger.error(`Failed to fetch details for account ${account.id}`, isError(error) ? error : new Error(String(error)));
            return {
              ...account,
              userCount: 0,
              siteCount: 0,
              installCount: 0,
            };
          }
        })
      );

      setEnrichedAccounts(enrichedAccountsData);
    } catch (error) {
      Logger.error('Failed to load accounts', isError(error) ? error : new Error(String(error)));
    }
  }, [page, request]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleRemoveUsers = async () => {
    if (!window.confirm('Are you sure you want to remove users from the selected accounts?')) {
      return;
    }

    try {
      for (const accountId of selectedAccounts) {
        await request(`/accounts/${accountId}/account_users`, { method: 'DELETE' });
        Logger.info(`Removed users from account ${accountId}`);
      }
      await loadAccounts();
      setSelectedAccounts([]);
    } catch (error) {
      Logger.error('Failed to remove users', isError(error) ? error : new Error(String(error)));
    }
  };

  if (loading && enrichedAccounts.length === 0) return <LoadingSpinner />;
  if (error) return <div>Error loading accounts: {error.message}</div>;
  if (!data && enrichedAccounts.length === 0) return null;

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex gap-2">
          <Button onClick={() => setShowBulkManager(true)}>
            Bulk User Manager
          </Button>
          <Button
            onClick={() => setShowAddUserDialog(true)}
            disabled={selectedAccounts.length === 0}
          >
            Add User
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemoveUsers}
            disabled={selectedAccounts.length === 0}
          >
            Remove User
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedAccounts.length === enrichedAccounts.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedAccounts(enrichedAccounts.map(acc => acc.id));
                    } else {
                      setSelectedAccounts([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right"># of Users</TableHead>
              <TableHead className="text-right"># of Sites</TableHead>
              <TableHead className="text-right"># of Installs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAccounts([...selectedAccounts, account.id]);
                      } else {
                        setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{account.name}</TableCell>
                <TableCell className="text-right">{account.userCount}</TableCell>
                <TableCell className="text-right">{account.siteCount}</TableCell>
                <TableCell className="text-right">{account.installCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <AddUserDialog
          open={showAddUserDialog}
          onClose={() => setShowAddUserDialog(false)}
          selectedAccounts={selectedAccounts}
          onSuccess={loadAccounts}
        />

        <BulkUserManager
          open={showBulkManager}
          onClose={() => setShowBulkManager(false)}
        />
      </CardContent>
    </Card>
  );
}