import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination } from '@/components/shared/Pagination';
import { useApi } from '@/lib/hooks/useApi';
import type { Site, PaginatedResponse } from '@/types/api';

export function SitesView() {
  const { data, loading, error, request } = useApi<PaginatedResponse<Site>>();
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadSites();
  }, [page]);

  const loadSites = async () => {
    try {
      await request(`/sites?limit=${ITEMS_PER_PAGE}&offset=${(page - 1) * ITEMS_PER_PAGE}`);
    } catch (error) {
      // Error is handled by useApi hook
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error loading sites: {error.message}</div>;
  if (!data) return null;

  const totalPages = Math.ceil((data.count || 0) / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead># of Installs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((site) => (
              <TableRow key={site.id}>
                <TableCell>{site.name}</TableCell>
                <TableCell>{site.account?.id}</TableCell>
                <TableCell>{site.group_name}</TableCell>
                <TableCell>{site.tags?.join(', ')}</TableCell>
                <TableCell>{site.installs?.length || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
  );
}
