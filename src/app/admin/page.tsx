
'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
// Removed AuthGuard as authentication is handled manually
// import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/client';
import { signOut, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, LogIn, LogOut, LayoutDashboard, ShieldAlert } from 'lucide-react'; // Import icons, replaced Prayer with LayoutDashboard

interface Prayer {
  id: string;
  text: string | null; // Allow null text just in case
  submittedAt: Timestamp | null; // Firestore Timestamp
}

// Helper function to format Firestore Timestamp safely
const formatTimestamp = (timestamp: Timestamp | null): string => {
  // Double check timestamp validity before calling .toDate()
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      const date = timestamp.toDate();
      // Note: toLocaleString() can cause hydration mismatches if server/client locales differ.
      // Consider using a consistent format like date-fns format(date, 'yyyy-MM-dd HH:mm:ss') if needed.
      return date.toLocaleString();
    } catch (e) {
      console.error("AdminPage: Error converting timestamp:", e, timestamp);
      return 'Invalid Date Format';
    }
  }
  return 'No Date Provided';
};

const ALLOWED_ADMIN_EMAIL = "mouaadidoufkir2@gmail.com"; // Define the allowed admin email


export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Login with Google and check email
  const handleLogin = async () => {
    setError(null); // Clear previous errors
    const provider = new GoogleAuthProvider();
    console.log("AdminPage: Initiating Google sign-in...");
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      console.log("AdminPage: Google sign-in successful. User:", result.user.email);
      // Check if the logged-in user's email is the allowed admin email
      if (result.user.email !== ALLOWED_ADMIN_EMAIL) {
        // If not the allowed email, sign them out immediately and show an error
        console.warn(`AdminPage: Unauthorized login attempt by ${result.user.email}. Signing out.`);
        await signOut(auth);
        setError(`Access denied. Only ${ALLOWED_ADMIN_EMAIL} can log in.`);
      } else {
        // Allowed user logged in successfully
        console.log(`AdminPage: Admin ${result.user.email} logged in successfully.`);
        //setError(null); // Ensure no error message persists after successful login
      }
    } catch (error: any) {
      console.error("AdminPage: Error during Google sign-in:", error);
      console.error("AdminPage: Error Code:", error.code);
      console.error("AdminPage: Error Message:", error.message);

       // Handle specific error codes if needed
       if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled by user."); // This message is displayed when the popup is closed.
       } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-blocked') {
            setError("Sign-in popup blocked or cancelled. Please allow popups for this site.");
       } else if (error.code === 'auth/unauthorized-domain') {
           // NOTE: 'auth/unauthorized-domain' might manifest as "requested action is invalid"
           // This is a strong indicator to check Firebase Console settings.
           setError("Sign-in failed: This domain is not authorized. Please check Firebase Authentication settings.");
       } else {
         // Generic error, often includes "The requested action is invalid." if domain isn't authorized
         // Suggest checking Firebase Console as a primary troubleshooting step.
         setError(`Sign-in failed: ${error.message}. Ensure this domain is listed in Firebase Auth > Google Sign-in > Authorized domains.`);
       }
    }
  };

  // Logout
  const handleLogout = async () => {
    setError(null); // Clear errors on logout
    console.log("AdminPage: Logging out...");
    try {
      await signOut(auth);
        console.log("AdminPage: Logout successful.");
    } catch (error) {
      console.error("AdminPage: Error signing out:", error);
       setError("Failed to sign out.");
    }
  };


  useEffect(() => {
    // Only fetch prayers if the user is logged in *and* has the allowed email
    // The check in handleLogin ensures only the allowed user can stay logged in,
    // but this adds an extra layer of security.
    console.log("AdminPage useEffect: Checking user state. Loading:", authLoading, "User:", user?.email);

    if (!authLoading && user && user.email === ALLOWED_ADMIN_EMAIL) {
      console.log("AdminPage useEffect: Authorized admin user found. Setting up Firestore listener.");
      setLoadingPrayers(true);
      setError(null); // Clear previous errors
      const prayersCollection = collection(firestore, 'prayers');
      // Order prayers by submission time, newest first
      const q = query(prayersCollection, orderBy('submittedAt', 'desc'));

      // Set up a real-time listener
       console.log("AdminPage useEffect: Attaching onSnapshot listener to 'prayers' collection.");
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log(`AdminPage onSnapshot: Received ${querySnapshot.size} documents.`);
        const prayersData: Prayer[] = [];
        querySnapshot.forEach((doc) => {
           // Defensive check: Ensure data exists and has expected fields before pushing
           const data = doc.data();
           // Log the raw data for debugging
           // console.log(`AdminPage onSnapshot: Processing doc ${doc.id}, Data:`, data);
           if (data && (data.text !== undefined || data.text === null) && (data.submittedAt !== undefined || data.submittedAt === null)) {
                // Add a default for text if it happens to be null/undefined
                const prayerText = data.text ?? "No text submitted";
                // Ensure submittedAt is a Timestamp or null
                 const submittedAt = data.submittedAt instanceof Timestamp ? data.submittedAt : (data.submittedAt === null ? null : new Timestamp(0,0)); // Convert null or provide default if invalid
                 // Log valid prayer data being pushed
                 // console.log(`AdminPage onSnapshot: Adding prayer - ID: ${doc.id}, Text: ${prayerText}, Timestamp: ${submittedAt?.toDate() ?? 'null'}`);
                prayersData.push({ id: doc.id, text: prayerText, submittedAt: submittedAt });
           } else {
               console.warn("AdminPage onSnapshot: Skipping document with missing data:", doc.id, data);
           }
        });
        setPrayers(prayersData);
        setLoadingPrayers(false); // Prayers loaded
         console.log("AdminPage onSnapshot: Prayer state updated. Loading finished.");
      }, (err) => {
          // Handle errors from the snapshot listener
          console.error("AdminPage onSnapshot Error: Failed to fetch prayers:", err);
          let errorMessage = "Failed to load prayers. Please check your Firestore connection and permissions.";
          // Check for permission denied errors specifically
          if ((err as any).code === 'permission-denied') {
               errorMessage = "Failed to load prayers: Permission Denied. Please check your Firestore Security Rules. Ensure the authenticated admin user has read access to the 'prayers' collection.";
               // Log the tip internally, but set a user-friendly error message for the UI
               // Use console.warn instead of console.error for tips
               console.warn("Firestore Security Rules Tip: Ensure your rules allow reads for the authenticated admin user, e.g., `allow read: if request.auth != null && request.auth.token.email == 'YOUR_ADMIN_EMAIL';`");
          }
          setError(errorMessage); // Set the error state to display in the UI
          setLoadingPrayers(false); // Stop loading even on error
      });

      // Cleanup listener on unmount or when user logs out/changes
       console.log("AdminPage useEffect: Returning cleanup function for listener.");
      return () => {
         console.log("AdminPage useEffect Cleanup: Unsubscribing from Firestore listener.");
         unsubscribe();
      };
    } else if (!authLoading) { // Only clear/reset if auth is done loading
         console.log("AdminPage useEffect: User not logged in or not authorized admin. Clearing prayers and stopping loading.");
         setPrayers([]); // Clear prayers if user logs out or is not the allowed admin
         setLoadingPrayers(false); // Not loading if not logged in or not authorized
         if (user && user.email !== ALLOWED_ADMIN_EMAIL) {
             // This case shouldn't happen if handleLogin works correctly, but as a fallback:
             console.warn(`AdminPage useEffect: Unauthorized user (${user.email}) detected after auth check. Forcing logout.`);
             setError("Unauthorized access.");
             handleLogout(); // Force logout if somehow an unauthorized user reaches here
         }
     } else {
         // Auth is still loading, do nothing yet
         console.log("AdminPage useEffect: Auth still loading...");
     }
  }, [user, authLoading]); // Re-run effect when user or authLoading changes


  // Loading state for authentication check
  if (authLoading) {
     console.log("AdminPage: Displaying auth loading skeleton.");
     return (
        <div className="flex justify-center items-center h-screen bg-background">
             <Skeleton className="h-12 w-12 rounded-full bg-primary/20 animate-pulse" />
        </div>
     );
  }

  // If user is not authenticated, show login button
  if (!user) {
    console.log("AdminPage: User not authenticated. Displaying login card.");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-[hsl(var(--primary)/0.1)] p-4">
         <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-border/50 shadow-xl">
             <CardHeader>
                 <CardTitle className="text-2xl font-bold text-center text-primary">Admin Login</CardTitle>
                 <CardDescription className="text-center text-muted-foreground">
                     Please sign in with the authorized Google account.
                 </CardDescription>
             </CardHeader>
             <CardContent className="flex flex-col items-center gap-4">
                 {error && (
                      // Use a more prominent error display for access denied or login failure
                      error.startsWith("Access denied") ? (
                           <p className="text-destructive text-sm text-center font-semibold flex items-center justify-center gap-1 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
                              <ShieldAlert size={16}/> {error}
                           </p>
                      ) : (
                           <p className="text-destructive text-sm text-center flex items-center justify-center gap-1 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
                              <AlertTriangle size={16}/> {error}
                           </p>
                      )

                  )}
                 <Button onClick={handleLogin} className="w-full bg-button-primary-gradient text-primary-foreground hover:opacity-90 shadow-md">
                     <LogIn size={16} className="mr-2" /> Sign In with Google
                 </Button>
             </CardContent>
         </Card>
      </div>
    );
  }

   // This should theoretically not be reached if handleLogin forces logout, but handle it defensively.
  if (user.email !== ALLOWED_ADMIN_EMAIL) {
      console.warn(`AdminPage: Rendering reached with unauthorized user ${user.email}. Forcing logout and showing error.`);
      //setError("Unauthorized access. Logging out."); // Set error message
      handleLogout(); // Attempt logout
      // Display a message indicating unauthorized access while logout proceeds.
      // You might want a more robust loading or error state here.
      return (
           <div className="flex flex-col items-center justify-center min-h-screen bg-destructive/10 p-4 text-destructive">
               <ShieldAlert size={48} className="mb-4" />
               <p className="text-lg font-semibold">Unauthorized Access</p>
               <p>You are not authorized to view this page. Logging out...</p>
               {error && <p className="mt-2 text-sm">{error}</p>} {/* Show any specific error */}
           </div>
      );
  }


  // If user is authenticated AND is the allowed admin, show the admin dashboard
  console.log("AdminPage: Authorized admin user authenticated. Displaying dashboard.");
  return (
    // <AuthGuard> // AuthGuard can still be used, but the primary check is now email-based
      <div className="container mx-auto p-4 md:p-8 bg-gradient-to-br from-background to-[hsl(var(--primary)/0.1)] min-h-screen text-foreground">
        <div className="flex justify-between items-center mb-6 md:mb-10 pb-4 border-b border-border/30">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center gap-2">
             <LayoutDashboard size={28} className="text-secondary"/> Admin Dashboard {/* Replaced Prayer with LayoutDashboard */}
          </h1>
          <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">Logged in as {user.email}</span>
             <Button onClick={handleLogout} variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                <LogOut size={16} className="mr-1"/> Logout
             </Button>
          </div>
        </div>

        {/* Display errors related to fetching data, specifically permission denied */}
         {error && (
              error.includes("Permission Denied") ? (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-md text-sm">
                      <p className="font-semibold flex items-center gap-2"><AlertTriangle size={16}/> Permission Denied</p>
                      <p className="mt-1">Could not load prayers. Please check your Firestore Security Rules in the Firebase Console.</p>
                      <p className="mt-1 text-xs">Ensure the rule for the 'prayers' collection allows read access for authenticated users with the email: <strong>{ALLOWED_ADMIN_EMAIL}</strong>.</p>
                      <p className="mt-1 text-xs">Example rule snippet: <code>match /prayers/{'{prayerId}'} {'{'} allow read: if request.auth != null &amp;&amp; request.auth.token.email == '{ALLOWED_ADMIN_EMAIL}'; {'}'}</code></p>
                  </div>
              ) : (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-md text-sm flex items-center gap-2">
                      <AlertTriangle size={16}/> {error}
                  </div>
              )
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
                              <TableRow key={`skeleton-${index}`}>
                                <TableCell><Skeleton className="h-4 w-full bg-muted/40" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto bg-muted/40" /></TableCell>
                              </TableRow>
                            ))
                         ) : Array.isArray(prayers) && prayers.length > 0 ? (
                           prayers.map((prayer) => (
                             <TableRow key={prayer.id} className="hover:bg-muted/20 transition-colors">
                               {/* Add default value for prayer text if it's null/undefined */}
                               <TableCell className="font-medium py-3">{prayer.text ?? 'N/A'}</TableCell>
                               <TableCell className="text-right text-muted-foreground text-xs py-3">
                                  {/* Ensure submittedAt is valid before formatting */}
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
                        {/* Check if prayers is an array before accessing length */}
                        <TableCaption className="py-4">{loadingPrayers ? "Loading prayers..." : `Total Prayers: ${Array.isArray(prayers) ? prayers.length : 0}`}</TableCaption>
                    </Table>
                 </ScrollArea>
            </CardContent>
        </Card>

      </div>
    // </AuthGuard>
  );
}
