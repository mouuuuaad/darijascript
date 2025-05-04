
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { Skeleton } from '@/components/ui/skeleton'; // Loading indicator

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if loading is finished and user is not logged in
    if (!loading && !user) {
      // Redirect to a login page (you'll need to create this page)
      // For now, redirecting to home page as a placeholder
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || !user) {
    // Display a loading skeleton or spinner
    return (
        <div className="flex flex-col space-y-3 p-4">
          <Skeleton className="h-[125px] w-full rounded-xl bg-muted/50" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80%] bg-muted/50" />
            <Skeleton className="h-4 w-[60%] bg-muted/50" />
          </div>
        </div>
    );
  }

  // If user is logged in, render the children components
  return <>{children}</>;
};
