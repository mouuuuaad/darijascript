
'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/client';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, LogIn, LogOut, Prayer } from 'lucide-react'; // Import icons


interface Prayer {
  id: string;
  text: string;
  submittedAt: Timestamp | null; // Firestore Timestamp
}

// Helper function to format Firestore Timestamp
const formatTimestamp = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'No date';
  // Convert Firestore Timestamp to JavaScript Date object
  const date = timestamp.toDate();
  // Format the date as needed (e.g., 'YYYY-MM-DD HH:mm:ss')
  return date.toLocaleString(); // Adjust formatting as desired
};


export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Login with Google
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setError("Failed to sign in with Google.");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
       setError("Failed to sign out.");
    }
  };


  useEffect(() => {
    // Only fetch prayers if the user is logged in
    if (user) {
      setLoadingPrayers(true);
      setError(null); // Clear previous errors
      const prayersCollection = collection(firestore, 'prayers');
      // Order prayers by submission time, newest first
      const q = query(prayersCollection, orderBy('submittedAt', 'desc'));

      // Set up a real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const prayersData: Prayer[] = [];
        querySnapshot.forEach((doc) => {
          prayersData.push({ id: doc.id, ...doc.data() } as Prayer);
        });
        setPrayers(prayersData);
        setLoadingPrayers(false); // Prayers loaded
      }, (err) => {
          console.error("Error fetching prayers:", err);
          setError("Failed to load prayers. Please check your Firestore connection and permissions.");
          setLoadingPrayers(false); // Stop loading even on error
      });

      // Cleanup listener on unmount or when user logs out
      return () => unsubscribe();
    } else {
      setPrayers([]); // Clear prayers if user logs out
      setLoadingPrayers(false); // Not loading if not logged in
    }
  }, [user]); // Re-run effect when user changes


  // Loading state for authentication check
  if (authLoading) {
     return (
        <div className="flex justify-center items-center h-screen bg-background">
             <Skeleton className="h-12 w-12 rounded-full bg-primary/20 animate-pulse" />
        </div>
     );
  }

  // If user is not authenticated, show login button
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-[hsl(var(--primary)/0.1)] p-4">
         <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-border/50 shadow-xl">
             <CardHeader>
                 <CardTitle className="text-2xl font-bold text-center text-primary">Admin Login</CardTitle>
                 <CardDescription className="text-center text-muted-foreground">
                     Please sign in to access the admin dashboard.
                 </CardDescription>
             </CardHeader>
             <CardContent className="flex flex-col items-center gap-4">
                 {error && (
                      <p className="text-destructive text-sm flex items-center gap-1"><AlertTriangle size={14}/> {error}</p>
                  )}
                 <Button onClick={handleLogin} className="w-full bg-button-primary-gradient text-primary-foreground hover:opacity-90 shadow-md">
                     <LogIn size={16} className="mr-2" /> Sign In with Google
                 </Button>
             </CardContent>
         </Card>
      </div>
    );
  }


  // If user is authenticated, show the admin dashboard
  return (
    // Use AuthGuard to protect this page content further if needed,
    // though the conditional rendering based on 'user' already does this.
    // <AuthGuard>
      <div className="container mx-auto p-4 md:p-8 bg-gradient-to-br from-background to-[hsl(var(--primary)/0.1)] min-h-screen text-foreground">
        <div className="flex justify-between items-center mb-6 md:mb-10 pb-4 border-b border-border/30">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center gap-2">
             <Prayer size={28} className="text-secondary"/> Admin Dashboard
          </h1>
          <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">Logged in as {user.email}</span>
             <Button onClick={handleLogout} variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                <LogOut size={16} className="mr-1"/> Logout
             </Button>
          </div>
        </div>

         {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-md text-sm flex items-center gap-2">
                  <AlertTriangle size={16}/> {error}
              </div>
          )}

        <Card className="bg-card/90 border-border/50 shadow-lg backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Submitted Prayers (D3awi)</CardTitle>
                 <CardDescription>Prayers submitted through the welcome overlay.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[60vh] md:h-[70vh] w-full rounded-md border border-border/30">
                    <Table>
                       <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-md z-10">
                         <TableRow>
                           <TableHead className="w-[70%] text-secondary">Prayer Text (Noss dyal Douaa)</TableHead>
                           <TableHead className="text-right text-secondary">Submitted At (W9tach Tsifat)</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {loadingPrayers ? (
                           // Show Skeleton loaders while prayers are loading
                           Array.from({ length: 5 }).map((_, index) => (
                             <TableRow key={index}>
                               <TableCell><Skeleton className="h-4 w-full bg-muted/40" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto bg-muted/40" /></TableCell>
                             </TableRow>
                           ))
                         ) : prayers.length > 0 ? (
                           prayers.map((prayer) => (
                             <TableRow key={prayer.id} className="hover:bg-muted/20 transition-colors">
                               <TableCell className="font-medium py-3">{prayer.text}</TableCell>
                               <TableCell className="text-right text-muted-foreground text-xs py-3">
                                  {formatTimestamp(prayer.submittedAt)}
                               </TableCell>
                             </TableRow>
                           ))
                         ) : (
                           <TableRow>
                             <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                               No prayers submitted yet.
                             </TableCell>
                           </TableRow>
                         )}
                       </TableBody>
                        <TableCaption className="py-4">{loadingPrayers ? "Loading prayers..." : `Total Prayers: ${prayers.length}`}</TableCaption>
                    </Table>
                 </ScrollArea>
            </CardContent>
        </Card>

      </div>
    // </AuthGuard>
  );
}
