'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth, firestore } from '@/lib/firebase/client';
import { signOut, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
    AlertTriangle, 
    LogIn, 
    LogOut, 
    LayoutDashboard, 
    ShieldAlert, 
    UserCheck, 
    VenetianMask, 
    Loader, 
    Lock, 
    Shield
} from 'lucide-react';
import { getPrayers } from '@/services/prayer-service';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Prayer {
  id: string;
  text: string | null;
  submittedAt: Date | null;
}

// Helper function to format date objects safely
const formatDate = (date: Date | null): string => {
  if (date instanceof Date && !isNaN(date.getTime())) {
    try {
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      console.error("AdminPage: Error formatting date:", e, date);
      return 'Invalid Date Format';
    }
  } else if (date === null) {
    return 'No Date Provided';
  } else {
    console.warn("AdminPage: Invalid date value encountered in formatDate:", date);
    return 'Invalid Date Value';
  }
};

const ALLOWED_ADMIN_EMAILS = ["mouaadidoufkir2@gmail.com", "mouaadidoufkir07@gmail.com"];
const FAILED_ATTEMPTS_LIMIT = 3;

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengerName, setChallengerName] = useState(''); 
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0); // Track failed attempts
  const [loginTimestamp, setLoginTimestamp] = useState<Date | null>(null); // Track login time
  const { toast } = useToast();

  // Enhanced function to initiate Google Sign-In AFTER the challenge
  const startGoogleSignIn = async () => {
      setError(null);
      setIsSubmittingChallenge(false);
      
      // We'll keep the dialog open while checking
      const provider = new GoogleAuthProvider();
      console.log("AdminPage: Starting Google sign-in process for:", challengerName || "Unknown challenger");

      try {
        // Show a toast while verifying
        toast({
          title: "Sbr chwiya...",
          description: `Rah kan chofou wach nta ${challengerName || 'houwa'} l7a9ani!`,
          className: "toast-info",
        });

        const result: UserCredential = await signInWithPopup(auth, provider);
        const loggedInEmail = result.user.email;
        console.log("AdminPage: Google sign-in attempt by:", loggedInEmail);

        if (loggedInEmail !== null && !ALLOWED_ADMIN_EMAILS.includes(loggedInEmail)) {
          console.warn(`AdminPage: Unauthorized login attempt by ${loggedInEmail}. Signing out.`);
          await signOut(auth);
          
          // Increment failed attempts for this session
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          
          // Different messages based on number of attempts
          let denialTitle = "Waaaaa Mal9inach Smitk!";
          let denialMessage = "Hadchi li dakhelti machi houwa. Lmochkil f email.";
          
          if (newFailedAttempts >= FAILED_ATTEMPTS_LIMIT) {
            denialTitle = "Khayf 3lik a sahbi!";
            denialMessage = "Hadchi bezzaf! Bghiti tkhrbe9? Rah kayn logs 3la koulchi!";
          }
          
          setError(`Accès interdit: ${loggedInEmail} machi houwa l'admin!`);
          toast({
            title: denialTitle,
            description: denialMessage,
            variant: "destructive",
            className: "toast-error",
          });
          
          // Close the challenge if open
          setShowChallenge(false);
          
        } else {
          console.log(`AdminPage: Admin ${loggedInEmail} logged in successfully.`);
          // Record login time
          const now = new Date();
          setLoginTimestamp(now);
          
          toast({
              title: "Mrhe7ba Sidi L'Admin!",
              description: `Tconnectiti b njah! L'blasa dyalek hadi ${user?.email || loggedInEmail}!`,
              className: "toast-success",
          });
          
          // Reset failed attempts on successful login
          setFailedAttempts(0);
          // Close the challenge dialog
          setShowChallenge(false);
        }
      } catch (error: any) {
          console.error("AdminPage: Error during Google sign-in:", error);

          let toastTitle = "Ghalat f Dkhoul!";
          let toastDescription = `W9e3 chi mochkil: ${error.message}.`;

          if (error.code === 'auth/popup-closed-by-user') {
              toastDescription = "Khwiti? Makeinch mochkil! Ma9dartich taked challenge?";
              setError("Tannulation du sign-in.");
          } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-blocked') {
              toastDescription = "Popup tbloka wella tlgha. 3tina permission bach ndkhlo.";
              setError(toastDescription);
          } else if (error.code === 'auth/unauthorized-domain') {
             toastDescription = "Ghalat f Dkhoul: Had l'domain ma msjjelch. Vérifier les paramètres Firebase.";
             setError(toastDescription);
          } else {
              // Generic error
              toastDescription = `W9e3 chi mochkil: ${error.message}. Vérifier les paramètres Firebase wla 3awed men be3d.`;
              setError(toastDescription);
          }
          toast({
            title: toastTitle,
            description: toastDescription,
            variant: "destructive",
            className: "toast-error",
          });
          
          // Close challenge dialog on error
          setShowChallenge(false);
      }
  };

  // Enhanced method for handling the initial login button click 
  const handleLoginClick = () => {
      setError(null); // Clear errors before showing challenge
      setChallengerName(''); // Reset name input
      setShowChallenge(true);
      
      // Record this attempt for analytics (could be logged to your backend)
      console.log("AdminPage: Admin Login button clicked, showing challenge.", new Date());
      
      // You could potentially add a delay here to make it feel more secure
      // or add a CAPTCHA or other verification step
  };

  // Enhanced challenge submission with more Moroccan flavor
  const handleChallengeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    setIsSubmittingChallenge(true); // Show loading state on button
    console.log(`AdminPage: Challenge submitted by: ${challengerName || 'Anonymous'} at ${new Date()}`);

    // Enhanced delay to build anticipation
    toast({
        title: "3la slamtek a l'batal!",
        description: `Yak a ${challengerName || 'Sidi l\'Modir'}, ghadi ncheckiw wach nta houwa li kan9elbo 3lih!`,
        className: "toast-info",
    });

    // More dramatic delay for suspense
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Proceed to Google Sign-In
    startGoogleSignIn();
  };

  // Enhanced Logout with Moroccan flavor
  const handleLogout = async () => {
    setError(null);
    console.log("AdminPage: Logging out...");
    try {
      await signOut(auth);
      console.log("AdminPage: Logout successful.");
      toast({ 
        title: "Bslama a Sidi l'Admin!", 
        description: "Khrejti b najah. Allah ysahel!", 
      });
      // Reset login timestamp
      setLoginTimestamp(null);
    } catch (error: any) {
      console.error("AdminPage: Error signing out:", error);
      const errorMessage = "W9e3 chi ghalat f lkhrouj. 3awed.";
      setError(errorMessage);
      toast({
        title: "Ghalat f Lkhrouj",
        description: errorMessage,
        variant: "destructive",
        className: "toast-error",
      });
    }
  };

  useEffect(() => {
    console.log("AdminPage useEffect: Checking user state. Loading:", authLoading, "User:", user?.email);

    if (!authLoading && user?.email && ALLOWED_ADMIN_EMAILS.includes(user.email)) {
      console.log("AdminPage useEffect: Authorized admin user found. Fetching prayers from Prisma.");
      setLoadingPrayers(true);
      setError(null);

      const fetchPrayersFromPrisma = async () => {
        try {
          const prayersData = await getPrayers();
          setPrayers(Array.isArray(prayersData) ? prayersData : []);
          setLoadingPrayers(false);
          console.log("AdminPage useEffect: Prayers fetched successfully from Prisma. Loaded prayers:", Array.isArray(prayersData) ? prayersData.length : 0);
        } catch (err: any) {
          console.error("AdminPage useEffect: Failed to fetch prayers from Prisma:", err);
          const errorMessage = "W9e3 ghalat f jib l d3awi men database. Vérifier connexion.";
          setError(errorMessage);
          toast({
             title: "Ghalat f Jib Data!",
             description: errorMessage,
             variant: "destructive",
             className: "toast-error",
          });
          setPrayers([]);
          setLoadingPrayers(false);
        }
      };

      fetchPrayersFromPrisma();

    } else if (!authLoading) {
         console.log("AdminPage useEffect: User not logged in or not authorized admin. Clearing prayers and stopping loading.");
         setPrayers([]);
         setLoadingPrayers(false);
         if (user?.email && !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
             console.warn(`AdminPage useEffect: Unauthorized user (${user.email}) detected after auth check. Forcing logout.`);
             handleLogout(); // Force logout
         }
     } else {
         console.log("AdminPage useEffect: Auth still loading...");
     }
  }, [user, authLoading, toast]);

  // Loading state for authentication check
  if (authLoading) {
     console.log("AdminPage: Displaying auth loading skeleton.");
     return (
        <div className="flex justify-center items-center h-screen bg-background">
             <Skeleton className="h-12 w-12 rounded-full bg-primary/20 animate-pulse" />
        </div>
     );
  }

  // ENHANCED login card with stronger Moroccan challenge
  if (!user) {
    console.log("AdminPage: User not authenticated. Displaying enhanced login card.");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-[hsl(var(--primary)/0.1)] p-4">
         <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-border/50 shadow-xl">
             <CardHeader>
                 <CardTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2">
                     <Shield size={24} /> Zone Protégée: Admin
                 </CardTitle>
                 <CardDescription className="text-center text-muted-foreground">
                      Hadi hiya l'montaqa l'ma7miya. Ghir l'admin li 3endo l7a9 ydkhal!
                 </CardDescription>
             </CardHeader>
             <CardContent className="flex flex-col items-center gap-4">
                 {/* Display general UI errors */}
                 {error && (
                      <p className={`text-sm text-center font-semibold flex items-center justify-center gap-1 p-2 rounded-md border ${error.startsWith("Accès interdit") ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'}`}>
                         {error.startsWith("Accès interdit") ? <ShieldAlert size={16}/> : <AlertTriangle size={16}/>} {error}
                      </p>
                  )}

                {/* ENHANCED Challenge Dialog */}
                <AlertDialog open={showChallenge} onOpenChange={setShowChallenge}>
                     {/* The button that TRIGGERS the dialog */}
                     <AlertDialogTrigger asChild>
                        <Button onClick={handleLoginClick} className="w-full bg-button-primary-gradient text-primary-foreground hover:opacity-90 shadow-md">
                             <Lock size={16} className="mr-2" /> Bab L'Admin (Zone Interdite)
                        </Button>
                     </AlertDialogTrigger>
                     
                     {/* The ENHANCED dialog CONTENT */}
                     <AlertDialogContent className="bg-card/95 border-secondary shadow-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-center text-2xl font-bold text-secondary flex items-center justify-center gap-2">
                                <VenetianMask size={24} /> Bessah Neta Hewa Admin?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-center text-muted-foreground pt-2">
                                Wa hadi blasa 5assa! Chkoun nta bezzaf 3lik? Ila ma3endeky ta salahiya, 
                                sir f7alek 7san! Ila kan 3endek l7e9, goulna chnowa smitk!
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                         
                         {/* Enhanced warning section */}
                         <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-md p-3 text-amber-600 text-sm mb-4">
                            <p className="flex items-center gap-2">
                              <AlertTriangle size={16} /> 
                              <span className="font-semibold">T7dir! Ghi l'admin li kaysta7e9 ydkhal hna.</span>
                            </p>
                            <p className="mt-1 pl-6">Kula mo7awala massjla w ghatji 3lik, la tnsa!</p>
                         </div>
                         
                         {/* Challenge Form */}
                         <form onSubmit={handleChallengeSubmit} className="space-y-4">
                             <Input
                                id="challengerName"
                                type="text"
                                placeholder="Smitk kamla, wach bessah nta l'admin?"
                                value={challengerName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setChallengerName(e.target.value)}
                                required
                                className="bg-input border-border focus:ring-primary focus:border-primary text-center font-semibold"
                                aria-label="Challenger Name"
                            />
                            
                            
                            <AlertDialogFooter className="pt-2">
                                <AlertDialogCancel className="border-destructive/50 text-destructive hover:bg-destructive/10">
                                  Safi, ghadi nemchi!
                                </AlertDialogCancel>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingChallenge}
                                    className="bg-button-dual text-accent-foreground hover:opacity-90"
                                >
                                    {isSubmittingChallenge ? <Loader size={16} className="mr-1 animate-spin"/> : <UserCheck size={16} className="mr-1"/>}
                                    {isSubmittingChallenge ? "Kan vérifiw..." : "Ana Houwa L'Admin!"}
                                </Button>
                            </AlertDialogFooter>
                        </form>
                     </AlertDialogContent>
                </AlertDialog>
             </CardContent>
         </Card>
      </div>
    );
  }

  // Defensive check: if somehow an unauthorized user gets past the login check
  if (!user.email || !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
      console.warn(`AdminPage: Rendering reached with unauthorized user ${user.email}. Should have been logged out.`);
      return (
           <div className="flex flex-col items-center justify-center min-h-screen bg-destructive/10 p-4 text-destructive">
               <ShieldAlert size={48} className="mb-4" />
               <p className="text-lg font-semibold">Dkhoul Mamnou3!</p>
               <p>Machi nta l'Admin.</p>
           </div>
      );
  }

  // Admin dashboard after successful login
  console.log("AdminPage: Authorized admin user authenticated. Displaying dashboard.");
  return (
      <div className="container mx-auto p-4 md:p-8 bg-gradient-to-br from-background to-[hsl(var(--primary)/0.1)] min-h-screen text-foreground">
        <div className="flex justify-between items-center mb-6 md:mb-10 pb-4 border-b border-border/30">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center gap-2">
             <LayoutDashboard size={28} className="text-secondary"/> Admin Dashboard
          </h1>
          <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">Mrhe7ba bik a {user.email}</span>
             <Button onClick={handleLogout} variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                <LogOut size={16} className="mr-1"/> Khrouj
             </Button>
          </div>
        </div>

         {/* Display general errors (like data loading errors) */}
         {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-md text-sm flex items-center gap-2">
                 <AlertTriangle size={16}/> {error}
              </div>
          )}

        <Card className="bg-card/90 border-border/50 shadow-lg backdrop-blur-sm">
            <CardHeader>
                <CardTitle>D3awi li Wslou</CardTitle>
                 <CardDescription>D3awi li tsayfto men l'overlay.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[60vh] md:h-[70vh] w-full rounded-md border border-border/30">
                    <Table>
                       <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-md z-10">
                         <TableRow>
                           <TableHead className="w-[70%] text-secondary">Nass dyal Douaa</TableHead>
                           <TableHead className="text-right text-secondary">W9tach Tsifat</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {loadingPrayers ? (
                            Array.from({ length: 5 }).map((_, index) => (
                              <TableRow key={`skeleton-${index}`}>
                                <TableCell><Skeleton className="h-4 w-full bg-muted/40" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto bg-muted/40" /></TableCell>
                              </TableRow>
                            ))
                         ) : (
                            Array.isArray(prayers) && prayers.length > 0 ? (
                               prayers.map((prayer) => (
                                 <TableRow key={prayer.id} className="hover:bg-muted/20 transition-colors">
                                   <TableCell className="font-medium py-3">{prayer.text ?? 'Ma kteb walou'}</TableCell>
                                   <TableCell className="text-right text-muted-foreground text-xs py-3">
                                      {formatDate(prayer.submittedAt)}
                                   </TableCell>
                                 </TableRow>
                               ))
                            ) : (
                               <TableRow>
                                 <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                   Ba9i ma wslat ta chi d3iwa.
                                 </TableCell>
                               </TableRow>
                            )
                         )}
                       </TableBody>
                        <TableCaption className="py-4">{loadingPrayers ? "Kan telechargiw d3awi..." : `Total D3awi: ${Array.isArray(prayers) ? prayers.length : 0}`}</TableCaption>
                    </Table>
                 </ScrollArea>
            </CardContent>
        </Card>
      </div>
  );
}