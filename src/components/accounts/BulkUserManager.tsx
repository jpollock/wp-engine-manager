// src/components/accounts/BulkUserManager.tsx
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import { useApi } from '@/lib/hooks/useApi';
import { Logger } from '@/lib/logger';
import type { Account, AccountUser, PaginatedResponse } from '@/types/api';

interface BulkUserManagerProps {
  open: boolean;
  onClose: () => void;
}

type UserAction = 'add' | 'remove';
type ActionStatus = 'pending' | 'success' | 'error';

interface UserActionItem {
  user: AccountUser | NewUser;
  isNew?: boolean;
  accountAssignments?: AccountAssignment[];
  status?: ActionStatus;
  error?: string;
}

interface AccountAssignment {
  accountId: string;
  accountName: string;
  role: string;
}

interface NewUser {
  first_name: string;
  last_name: string;
  email: string;
  roles?: string;
}

interface AccountUserWithAccountName extends AccountUser {
  accountName: string;
}

interface PendingAssignment {
  accountId: string | null;
  role: string | null;
}

interface ActionResult {
  accountId: string;
  accountName: string;
  userId: string;
  userName: string;
  success: boolean;
  error?: string;
}

interface AccountsResponse {
  results: Account[];
  count: number;
  next?: string;
  previous?: string;
}

// Add a type guard for Error
function isError(error: unknown): error is Error {
    return error instanceof Error;
  }

export function BulkUserManager({ open, onClose }: BulkUserManagerProps) {
  const { request } = useApi<AccountsResponse>();
  const { request: usersRequest } = useApi<PaginatedResponse<AccountUser>>();
  const [step, setStep] = useState(1);
  const [action, setAction] = useState<UserAction>('add');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [existingUsers, setExistingUsers] = useState<AccountUserWithAccountName[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserActionItem[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Record<number, PendingAssignment>>({});
  const [newUser, setNewUser] = useState<NewUser>({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const loadInitialData = useCallback(async () => {
    try {
      const accountsResponse = await request('/accounts');
      setAccounts(accountsResponse.results);

      const allUsersPromises = accountsResponse.results.map(account =>
        usersRequest(`/accounts/${account.id}/account_users`)
          .then(response => response.results.map(user => ({
            ...user,
            accountName: account.name
          } as AccountUserWithAccountName)))
          .catch(error => {
            Logger.error(`Failed to fetch users for account ${account.id}`, isError(error) ? error : new Error(String(error)));
            return [] as AccountUserWithAccountName[];
          })
      );

      const usersFromAllAccounts = await Promise.all(allUsersPromises);
      const uniqueUsers = Array.from(
        new Map(
          usersFromAllAccounts.flat().map(user => [user.email, user])
        ).values()
      );
      
      setExistingUsers(uniqueUsers);
    } catch (error) {
      Logger.error('Failed to load initial data', isError(error) ? error : new Error(String(error)));
    }
  }, [request, usersRequest]);

  useEffect(() => {
    if (open) {
      loadInitialData();
      setStep(1);
      setAction('add');
      setSelectedUsers([]);
      setResults([]);
      setProgress(0);
      setProcessing(false);
      setSearchTerm('');
      setPendingAssignments({});
    }
  }, [open, loadInitialData]);

  const handleAddNewUser = () => {
    if (!newUser.email || !newUser.first_name || !newUser.last_name) {
      alert('Please fill in all required fields');
      return;
    }
    
    const emailExists = selectedUsers.some(u => 
      'email' in u.user && u.user.email.toLowerCase() === newUser.email.toLowerCase()
    );
    
    if (emailExists) {
      alert('A user with this email is already selected');
      return;
    }

    setSelectedUsers([
      ...selectedUsers,
      { 
        user: { ...newUser }, 
        isNew: true,
        accountAssignments: []
      }
    ]);
    
    setNewUser({
      first_name: '',
      last_name: '',
      email: '',
    });
  };

  const handleExistingUserSelect = (user: AccountUserWithAccountName) => {
    const isSelected = selectedUsers.some(u => 
      'email' in u.user && u.user.email.toLowerCase() === user.email.toLowerCase()
    );
    
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => 
        'email' in u.user && u.user.email.toLowerCase() !== user.email.toLowerCase()
      ));
    } else {
      setSelectedUsers([...selectedUsers, { 
        user,
        accountAssignments: action === 'add' ? [] : undefined
      }]);
    }
  };

  const handlePendingAccountChange = (userIndex: number, accountId: string) => {
    setPendingAssignments(current => ({
      ...current,
      [userIndex]: {
        ...current[userIndex],
        accountId
      }
    }));
  };

  const handlePendingRoleChange = (userIndex: number, role: string) => {
    setPendingAssignments(current => ({
      ...current,
      [userIndex]: {
        ...current[userIndex],
        role
      }
    }));
  };

  const handleAddAssignment = (userIndex: number) => {
    const pending = pendingAssignments[userIndex];
    if (!pending?.accountId || !pending?.role) return;

    const account = accounts.find(a => a.id === pending.accountId);
    if (!account) return;

    setSelectedUsers(users => {
      const updatedUsers = [...users];
      const user = { ...updatedUsers[userIndex] };
      
      if (!user.accountAssignments) {
        user.accountAssignments = [];
      }

      // Check if assignment already exists
      const existingIndex = user.accountAssignments.findIndex(
        a => a.accountId === pending.accountId
      );

      if (existingIndex >= 0) {
        return users; // Return original array if assignment exists
      }

      user.accountAssignments = [
        ...user.accountAssignments,
        {
          accountId: pending.accountId!,
          accountName: account.name,
          role: pending.role!
        }
      ];

      updatedUsers[userIndex] = user;
      return updatedUsers;
    });

    // Clear the pending assignment
    setPendingAssignments(current => ({
      ...current,
      [userIndex]: {
        accountId: null,
        role: null
      }
    }));
  };

  const removeAccountAssignment = (userIndex: number, accountId: string) => {
    setSelectedUsers(users => {
      const updatedUsers = [...users];
      const user = updatedUsers[userIndex];
      
      if (user.accountAssignments) {
        user.accountAssignments = user.accountAssignments.filter(
          a => a.accountId !== accountId
        );
      }

      return updatedUsers;
    });
  };

  const executeActions = async () => {
    setProcessing(true);
    setProgress(0);
    const results: ActionResult[] = [];
    let completed = 0;
    let total = 0;

    if (action === 'add') {
      total = selectedUsers.reduce((sum, user) => 
        sum + (user.accountAssignments?.length || 0), 0);
    } else {
      total = selectedUsers.length;
    }

    try {
      if (action === 'add') {
        for (const userAction of selectedUsers) {
          if (!userAction.accountAssignments?.length) continue;

          for (const assignment of userAction.accountAssignments) {
            try {
              if (userAction.isNew) {
                await request(`/accounts/${assignment.accountId}/account_users`, {
                  method: 'POST',
                  body: JSON.stringify({
                    user: {
                      ...userAction.user,
                      roles: assignment.role,
                      account_id: assignment.accountId
                    }
                  })
                });
              } else {
                const existingUser = userAction.user as AccountUser;
                await request(`/accounts/${assignment.accountId}/account_users`, {
                  method: 'POST',
                  body: JSON.stringify({
                    user: {
                      first_name: existingUser.first_name,
                      last_name: existingUser.last_name,
                      email: existingUser.email,
                      roles: assignment.role,
                      account_id: assignment.accountId
                    }
                  })
                });
              }

              results.push({
                accountId: assignment.accountId,
                accountName: assignment.accountName,
                userId: 'user_id' in userAction.user ? userAction.user.user_id : 'new',
                userName: `${userAction.user.first_name} ${userAction.user.last_name}`,
                success: true
              });
            } catch (error) {
              results.push({
                accountId: assignment.accountId,
                accountName: assignment.accountName,
                userId: 'user_id' in userAction.user ? userAction.user.user_id : 'new',
                userName: `${userAction.user.first_name} ${userAction.user.last_name}`,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
              });
            }

            completed++;
            setProgress((completed / total) * 100);
          }
        }
      } else {
        // Handle removing users
        for (const userAction of selectedUsers) {
          try {
            const existingUser = userAction.user as AccountUser;
            await request(`/accounts/${existingUser.account_id}/account_users/${existingUser.user_id}`, {
              method: 'DELETE'
            });

            results.push({
              accountId: existingUser.account_id,
              accountName: (userAction.user as AccountUserWithAccountName).accountName || '',
              userId: existingUser.user_id,
              userName: `${existingUser.first_name} ${existingUser.last_name}`,
              success: true
            });
          } catch (error) {
            results.push({
              accountId: (userAction.user as AccountUser).account_id,
              accountName: (userAction.user as AccountUserWithAccountName).accountName || '',
              userId: (userAction.user as AccountUser).user_id,
              userName: `${userAction.user.first_name} ${userAction.user.last_name}`,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
          }

          completed++;
          setProgress((completed / total) * 100);
        }
      }
    } catch (error) {
      Logger.error('Error during bulk operation', isError(error) ? error : new Error(String(error)));
    }

    setResults(results);
    setProcessing(false);
    setStep(action === 'add' ? 4 : 3);
  };

  // Continue from previous code...

  const renderSelectedUsersList = () => (
    <div className="mt-4 border rounded-md p-4">
      <h4 className="font-medium mb-2">Selected Users ({selectedUsers.length})</h4>
      <ScrollArea className="h-[200px]">
        {selectedUsers.map((userAction, index) => (
          <div 
            key={index}
            className="flex items-center justify-between py-2 px-3 hover:bg-gray-50"
          >
            <div>
              <div className="font-medium">
                {userAction.user.first_name} {userAction.user.last_name}
                {userAction.isNew && ' (New User)'}
              </div>
              <div className="text-sm text-gray-500">
                {userAction.user.email}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUsers(users => users.filter((_, i) => i !== index))}
              className="text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {selectedUsers.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No users selected
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 1: Choose Action</h3>
            <Tabs value={action} onValueChange={(value) => {
              setAction(value as UserAction);
              setSelectedUsers([]);
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add">Add Users</TabsTrigger>
                <TabsTrigger value="remove">Remove Users</TabsTrigger>
              </TabsList>
              <TabsContent value="add">
                <div className="space-y-4 mt-4">
                  {/* New User Form */}
                  <div className="space-y-4 border-b pb-4">
                    <h4 className="font-medium">Add New User</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                      />
                      <Input
                        placeholder="Last Name"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                      />
                    </div>
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                    <Button onClick={handleAddNewUser}>Add to List</Button>
                  </div>

                  {/* Existing Users Selection */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Select Existing Users</h4>
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      {existingUsers
                        .filter(user => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            user.first_name.toLowerCase().includes(searchLower) ||
                            user.last_name.toLowerCase().includes(searchLower) ||
                            user.email.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((user) => (
                          <div key={user.email} className="flex items-center space-x-2 py-2">
                            <Checkbox
                              checked={selectedUsers.some(u => 
                                'email' in u.user && u.user.email.toLowerCase() === user.email.toLowerCase()
                              )}
                              onCheckedChange={() => handleExistingUserSelect(user)}
                            />
                            <div>
                              <div>{user.first_name} {user.last_name}</div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                                {user.accountName && ` - ${user.accountName}`}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="remove">
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <ScrollArea className="h-[300px] border rounded-md p-4">
                    {existingUsers
                      .filter(user => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          user.first_name.toLowerCase().includes(searchLower) ||
                          user.last_name.toLowerCase().includes(searchLower) ||
                          user.email.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((user) => (
                        <div key={user.email} className="flex items-center space-x-2 py-2">
                          <Checkbox
                            checked={selectedUsers.some(u => 
                              'email' in u.user && u.user.email.toLowerCase() === user.email.toLowerCase()
                            )}
                            onCheckedChange={() => handleExistingUserSelect(user)}
                          />
                          <div>
                            <div>{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                              {user.accountName && ` - ${user.accountName}`}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>

            {renderSelectedUsersList()}

            <Button 
              onClick={() => setStep(action === 'add' ? 2 : 3)}
              disabled={selectedUsers.length === 0}
            >
              Next
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 2: Assign Accounts and Roles</h3>
            {selectedUsers.map((userAction, userIndex) => {
              const pending = pendingAssignments[userIndex] || { accountId: null, role: null };
              
              return (
                <div key={userIndex} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {userAction.user.first_name} {userAction.user.last_name}
                      </h4>
                      <div className="text-sm text-gray-500">{userAction.user.email}</div>
                    </div>
                    {userAction.isNew && (
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">New User</span>
                    )}
                  </div>
                  
                  {/* Current Assignments Table */}
                  {userAction.accountAssignments && userAction.accountAssignments.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Current Assignments</h5>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Account</th>
                              <th className="px-4 py-2 text-left">Role</th>
                              <th className="px-4 py-2 w-16"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {userAction.accountAssignments.map((assignment, i) => (
                              <tr key={i} className="border-t">
                                <td className="px-4 py-2">{assignment.accountName}</td>
                                <td className="px-4 py-2">{assignment.role}</td>
                                <td className="px-4 py-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAccountAssignment(userIndex, assignment.accountId)}
                                    className="text-red-500 h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Add New Assignment */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium">Add Assignment</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Account Selection */}
                      <div>
                        <label className="text-sm text-gray-700 mb-1 block">
                          Select Account
                        </label>
                        <Select
                          value={pending.accountId || ''}
                          onValueChange={(accountId) => handlePendingAccountChange(userIndex, accountId)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose account..." />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts
                              .filter(account => !userAction.accountAssignments?.some(
                                a => a.accountId === account.id
                              ))
                              .map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Role Selection */}
                      <div>
                        <label className="text-sm text-gray-700 mb-1 block">
                          Select Role
                        </label>
                        <Select
                          value={pending.role || ''}
                          onValueChange={(role) => handlePendingRoleChange(userIndex, role)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose role..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="full">Full</SelectItem>
                            <SelectItem value="full,billing">Full + Billing</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="partial,billing">Partial + Billing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAddAssignment(userIndex)}
                      disabled={!pending.accountId || !pending.role}
                      className="mt-2"
                    >
                      Add Assignment
                    </Button>
                  </div>

                  {/* Validation Message */}
                  {(!userAction.accountAssignments || userAction.accountAssignments.length === 0) && (
    <Alert variant="warning">
    <AlertDescription>
      Please assign at least one account and role for this user.
    </AlertDescription>
  </Alert>
                  )}
                </div>
              );
            })}

            <div className="space-x-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={() => setStep(3)}
                disabled={selectedUsers.some(u => 
                  !u.accountAssignments || u.accountAssignments.length === 0
                )}
              >
                Review
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review Changes</h3>
            
            {action === 'add' ? (
              <div className="space-y-4">
                {selectedUsers.map((userAction, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <h4 className="font-medium">
                      {userAction.user.first_name} {userAction.user.last_name}
                      {userAction.isNew && ' (New User)'}
                    </h4>
                    <div className="text-sm text-gray-500 mb-2">{userAction.user.email}</div>
                    <div className="space-y-1">
                      {userAction.accountAssignments?.map((assignment, i) => (
                        <div key={i} className="text-sm">
                          • {assignment.accountName} - {assignment.role}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  {selectedUsers.map((userAction, index) => (
                    <div key={index} className="py-2 border-b last:border-0">
                      <div className="font-medium">
                        {userAction.user.first_name} {userAction.user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userAction.user.email}
                        {(userAction.user as AccountUserWithAccountName).accountName && 
                          ` - ${(userAction.user as AccountUserWithAccountName).accountName}`}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            <Alert>
              <AlertDescription>
                {action === 'add' ? (
                  <>
                    This will add {selectedUsers.length} user(s) with {
                      selectedUsers.reduce((sum, user) => sum + (user.accountAssignments?.length || 0), 0)
                    } total account assignments.
                  </>
                ) : (
                  <>
                    This will remove {selectedUsers.length} user(s) from their respective accounts.
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(action === 'add' ? 2 : 1)}
              >
                Back
              </Button>
              <Button onClick={executeActions} disabled={processing}>
                {processing ? 'Processing...' : 'Confirm'}
              </Button>
            </div>

            {processing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <div className="text-sm text-center text-gray-500">
                  Processing... {Math.round(progress)}% complete
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Results</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <h4 className="font-medium">Operations Completed</h4>
                <span>
                  Success: {results.filter(r => r.success).length} / 
                  Failed: {results.filter(r => !r.success).length}
                </span>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-md p-4">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`py-2 border-b last:border-0 ${
                      result.success ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>{result.userName}</span>
                      <span>{result.accountName}</span>
                    </div>
                    {!result.success && (
                      <div className="text-sm mt-1 italic">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep(1);
                  setSelectedUsers([]);
                  setResults([]);
                  setSearchTerm('');
                  setPendingAssignments({});
                }}
              >
                Start New Bulk Operation
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk User Manager</DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}

export default BulkUserManager;