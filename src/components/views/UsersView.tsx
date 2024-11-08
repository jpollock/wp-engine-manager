// src/components/views/UsersView.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination } from '@/components/shared/Pagination';
import { useApi } from '@/lib/hooks/useApi';
import { Logger } from '@/lib/logger';
import type { Account, AccountUser, PaginatedResponse } from '@/types/api';

export function UsersView() {
  const { data: accountsData, loading: accountsLoading, error: accountsError, request: accountsRequest } = useApi<PaginatedResponse<Account>>();
  const { request: usersRequest } = useApi<{results: AccountUser[]}>();
  const [allUsers, setAllUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      // First get all accounts
      const accountsResponse = await accountsRequest('/accounts');
      
      // Then get users for each account
      const allUsersPromises = accountsResponse.results.map(account => 
        usersRequest(`/accounts/${account.id}/account_users`)
          .then(response => response.results.map(user => ({
            ...user,
            accountName: account.name // Add account name to user data
          })))
          .catch(error => {
            Logger.error(`Failed to fetch users for account ${account.id}`, error);
            return [];
          })
      );

      const usersFromAllAccounts = await Promise.all(allUsersPromises);
      const flattenedUsers = usersFromAllAccounts.flat();
      
      setAllUsers(flattenedUsers);
    } catch (error) {
      Logger.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || accountsLoading) return <LoadingSpinner />;
  if (accountsError) return <div>Error loading users: {accountsError.message}</div>;

  // Calculate pagination
  const totalUsers = allUsers.length;
  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = allUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <Card>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={`${user.account_id}-${user.user_id}`}>
                <TableCell>{user.first_name}</TableCell>
                <TableCell>{user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.accountName}</TableCell>
                <TableCell>{user.roles}</TableCell>
                <TableCell>
                  {user.invite_accepted ? 
                    <span className="text-green-600">Active</span> : 
                    <span className="text-yellow-600">Pending</span>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {allUsers.length > 0 ? (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        ) : (
          <div className="text-center py-4">No users found</div>
        )}
      </CardContent>
    </Card>
  );
}