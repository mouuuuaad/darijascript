
'use client';

import { type FunctionComponent, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MessageSquare, Loader, Shield } from 'lucide-react'; // Add Loader & Shield icon
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase/client'; // Import Firestore instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
import type { ToastProps } from '@/components/ui/toast'; // Import ToastProps type
import Link from 'next/link'; // Import Link for navigation

gsap.registerPlugin(ScrollTrigger); // Register ScrollTrigger

interface WelcomeOverlayProps {
  onClose: () => void;
}

export const WelcomeOverlay: FunctionComponent<WelcomeOverlayProps> = ({ onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prayerInputRef = useRef<HTMLInputElement>(null);
  const [prayer, setPrayer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state
  const { toast } = useToast();

  useEffect(() => {
    // Initial overlay fade-in
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });

    // Content animation (like Angular.dev intro) - basic example
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top', // Animate as user scrolls down
        scrub: 1, // Smooth scrubbing effect
        // markers: true, // For debugging scroll trigger positions
      },
    });

    // Example: Animate opacity and scale of content as user scrolls
    tl.fromTo(contentRef.current,
        { opacity: 1, y: 0 },
        { opacity: 0, y: -50, ease: 'power1.out' }
    );
    // Example: Animate background color of the overlay
    tl.to(overlayRef.current, { backgroundColor: 'hsl(var(--background) / 0.5)', ease: 'none' }, 0); // Fade background slower


    // Prevent body scroll when overlay is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = ''; // Re-enable scroll on close
    };
  }, []);

  const startFadeOut = () => {
    console.log("Starting fade out animation..."); // Log: Start animation
    // Ensure overlayRef.current exists before animating
    if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            console.log("Fade out animation complete."); // Log: Animation complete
            // onClose is now called in handleEnterClick *before* this animation starts
            setIsSubmitting(false); // Reset submitting state after animation finishes
          },
        });
    } else {
         console.error("Overlay ref not found, cannot start fade out animation.");
         // Fallback if animation target doesn't exist
         setIsSubmitting(false);
         // onClose should have already been called in handleEnterClick
    }
  };


  const handleEnterClick = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true); // Set submitting state immediately

    // Default success message
    let toastOptions: ToastProps & { title: string; description: string; } = {
       title: "شكراً!",
       description: "دعاءك وصل. الله يقبل.",
       className: "toast-success"
    };

    let firestorePromise: Promise<any> | null = null;

    // Prepare Firestore save if prayer is not empty
    if (prayer.trim()) {
      const prayersCollection = collection(firestore, 'prayers');
      firestorePromise = addDoc(prayersCollection, {
        text: prayer.trim(),
        submittedAt: serverTimestamp(), // Use server timestamp
      });
    }

    // Show appropriate toast message immediately
    if (prayer.trim()) {
        toastOptions.description = `دعاءك وصل: "${prayer}". الله يقبل.`;
    } else {
         toastOptions = {
            title: "دعاء؟",
            description: "نسيتي مكتبتيش دعاء؟ ماشي مشكل، دخل.",
             className: "toast-info"
        };
    }
    toast(toastOptions);
    console.log("Toast shown. Calling onClose and starting fadeOut...");

    // Call onClose immediately to trigger state change in parent
    onClose();

    // Start the fade-out animation visually
    startFadeOut();

    // Wait for Firestore operation (if any) in the background
    // and show error toast *if* it fails, without blocking UI exit
    if (firestorePromise) {
       try {
          await firestorePromise;
          // Success toast already shown
       } catch (error) {
          console.error("Error adding prayer to Firestore:", error);
          // Show error toast asynchronously
           toast({
               title: "Ghalat!",
               description: "وقع مشكل ملي كنا نسجلو الدعاء ديالك. حاول مرة أخرى.",
               variant: "destructive",
               className: "toast-error"
           });
           // No need to call setIsSubmitting(false) here, it's handled by animation onComplete
       }
    } else {
        // If no prayer was submitted, ensure submitting state is reset by animation onComplete
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--primary)/0.1)] backdrop-blur-sm overflow-y-auto p-4"
       // style={{ backgroundColor: 'hsl(var(--background) / 0.95)' }} // Start with near-opaque background
    >
      <div ref={containerRef} className="w-full max-w-2xl text-center">
         {/* Add extra space for scroll testing */}
         {/* <div className="h-[150vh]"> Trigger scroll effects */}
         <div ref={contentRef} className="bg-card/80 backdrop-blur-md border border-border/30 rounded-xl shadow-2xl p-8 md:p-12 text-foreground transform transition-transform duration-500 hover:scale-[1.02] my-20">
           <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
             Salam! Mer7ba bik f DarijaScript IDE ✨
           </h1>
           <p className="text-lg md:text-xl text-muted-foreground mb-6">
             Hada blassa fin t9der tkteb w tjarreb l code dyal <strong className="text-primary">DarijaScript</strong>,
             lougha dial lbarmaja b Darija lmeghribia. Sawbtha bach nsehhel 3la drari w lbnat ytle3mo l code b tari9a dialna.
             Yallah, bda!
           </p>

           <div className="mb-8 max-w-md mx-auto">
              <label htmlFor="prayerInput" className="block text-sm font-medium text-muted-foreground mb-2">
                 3afak, kteb chi d3iwa zwina m3aya f had l input 🙏 :
              </label>
              <div className="relative">
                 <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 <Input
                   ref={prayerInputRef}
                   id="prayerInput"
                   type="text"
                   placeholder="Lah ysehel 3lik khoya Moad..."
                   value={prayer}
                   onChange={(e) => setPrayer(e.target.value)}
                   disabled={isSubmitting} // Disable input while submitting
                   className="pl-10 bg-input border-border focus:ring-primary focus:border-primary"
                 />
             </div>
           </div>

           <div className="flex flex-col items-center space-y-4"> {/* Wrapper for buttons */}
               <Button
                 onClick={handleEnterClick}
                 disabled={isSubmitting} // Disable button while submitting
                 className="bg-button-primary-gradient text-primary-foreground text-lg px-8 py-3 rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 hover:shadow-primary/40 transform hover:-translate-y-1 focus:ring-4 focus:ring-primary/50"
                 size="lg"
               >
                 {isSubmitting ? (
                    <>
                        <Loader className="mr-2 h-5 w-5 animate-spin" />
                        Kantssenaw... {/* Loading text */}
                    </>
                 ) : (
                    "Yallah, Dkhel l IDE!"
                 )}
               </Button>

                {/* New Admin Link Button */}
                <Link href="/admin" passHref legacyBehavior>
                  <Button
                    variant="link"
                    className="text-muted-foreground hover:text-primary transition-colors text-xs"
                    size="sm"
                  >
                     <Shield size={14} className="mr-1" /> Admin Login
                  </Button>
                </Link>
           </div>

           <p className="mt-10 text-xs text-muted-foreground/70">
              Made with ❤️ by <a href="https://github.com/MOUAADIDO" target="_blank" rel="noopener noreferrer" className="font-semibold text-secondary hover:text-primary transition-colors">MOUAAD IDOUFKIR</a> - Passionate Fullstack Developer
           </p>
         </div>
         {/* </div> */}
      </div>
    </div>
  );
};
