
"use client";

import { type FunctionComponent, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MessageSquare, Loader, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { savePrayer } from '@/services/prayer-service';
import type { ToastProps } from '@/components/ui/toast';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

interface WelcomeOverlayProps {
  onClose: () => void;
}

export const WelcomeOverlay: FunctionComponent<WelcomeOverlayProps> = ({ onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prayerInputRef = useRef<HTMLInputElement>(null);
  const [prayer, setPrayer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast(); // Initialize toast hook

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });

    tl.fromTo(contentRef.current, { opacity: 1, y: 0 }, { opacity: 0, y: -50, ease: 'power1.out' });
    tl.to(overlayRef.current, { backgroundColor: 'hsl(var(--background) / 0.5)', ease: 'none' }, 0);

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const startFadeOut = () => {
    console.log("WelcomeOverlay: Starting fade out animation..."); // Keep for debug log
    if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            console.log("WelcomeOverlay: Fade out animation complete."); // Keep for debug log
            // onClose is now called immediately in handleEnterClick
          },
        });
    } else {
         console.error("WelcomeOverlay: Overlay ref not found, cannot start fade out animation."); // Keep internal error log
         // Fallback if animation target doesn't exist - onClose should have been called
         setIsSubmitting(false); // Reset state just in case
    }
  };


  const handleEnterClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("WelcomeOverlay: Enter button clicked. Submitting:", prayer.trim() !== ''); // Keep for debug log

    let toastOptions: ToastProps & { title: string; description: string; } = {
       title: "شكراً!",
       description: "دعاءك وصل. الله يقبل.",
       className: "toast-success"
    };

    let savePromise: Promise<any> | null = null;
    const prayerText = prayer.trim();

    if (prayerText) {
      try {
         console.log("WelcomeOverlay: Attempting to save prayer via Prisma service..."); // Keep for debug log
         savePromise = savePrayer(prayerText);
         console.log("WelcomeOverlay: savePrayer called."); // Keep for debug log
         toastOptions.description = `دعاءك وصل: "${prayerText}". الله يقبل.`;
      } catch (error: any) {
          console.error("WelcomeOverlay: Error calling savePrayer:", error); // Keep internal error log
          setIsSubmitting(false);
          toast({ // Show toast error
              title: "Ghalat!",
              description: error.message || "وقع مشكل قبل ما نصيفطو الدعاء.",
              variant: "destructive",
              className: "toast-error"
          });
          return;
      }
    } else {
         console.log("WelcomeOverlay: No prayer text entered."); // Keep for debug log
         toastOptions = {
            title: "دعاء؟",
            description: "نسيتي مكتبتيش دعاء؟ ماشي مشكل، دخل.",
             className: "toast-info"
        };
    }

    toast(toastOptions); // Show feedback toast immediately
    console.log("WelcomeOverlay: Toast shown. Calling onClose and starting fadeOut..."); // Keep for debug log

    onClose(); // Close the overlay UI immediately
    startFadeOut(); // Start visual fade out

    if (savePromise) {
       try {
          await savePromise;
          console.log("WelcomeOverlay: Prisma prayer saved successfully."); // Keep for debug log
       } catch (error: any) {
          console.error("WelcomeOverlay: Error SAVING prayer via Prisma service:", error); // Keep internal error log
           toast({ // Show asynchronous error toast if save fails
               title: "Ghalat!",
               description: error.message || "وقع مشكل ملي كنا نسجلو الدعاء ديالك.",
               variant: "destructive",
               className: "toast-error"
           });
       } finally {
           setIsSubmitting(false); // Reset submitting state after operation attempt
       }
    } else {
        setIsSubmitting(false); // Reset if no prayer was submitted
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--primary)/0.1)] backdrop-blur-sm overflow-y-auto p-4"
    >
      <div ref={containerRef} className="w-full max-w-2xl text-center">
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
                   placeholder="Kteb D3iwa Dylek Hena..."
                   value={prayer}
                   onChange={(e) => setPrayer(e.target.value)}
                   disabled={isSubmitting}
                   className="pl-10 bg-input border-border focus:ring-primary focus:border-primary"
                   aria-label="Prayer input"
                 />
             </div>
           </div>

           <div className="flex flex-col items-center space-y-4">
               <Button
                 onClick={handleEnterClick}
                 disabled={isSubmitting}
                 className={cn(
                    "bg-button-primary-gradient text-primary-foreground text-lg px-8 py-3 rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 hover:shadow-primary/40 transform hover:-translate-y-1 focus:ring-4 focus:ring-primary/50",
                    isSubmitting && "cursor-not-allowed opacity-70"
                 )}
                 size="lg"
               >
                 {isSubmitting ? (
                    <>
                        <Loader className="mr-2 h-5 w-5 animate-spin" />
                        Kantssenaw...
                    </>
                 ) : (
                    "Yallah, Dkhel l IDE!"
                 )}
               </Button>

                <Link href="/admin" passHref legacyBehavior>
                  <Button
                    variant="link"
                    className="text-muted-foreground hover:text-primary transition-colors text-xs"
                    size="sm"
                    aria-label="Admin Login"
                  >
                     <Shield size={14} className="mr-1" /> Admin Login
                  </Button>
                </Link>
           </div>

           <p className="mt-10 text-xs text-muted-foreground/70">
              Made by <a href="mailto:mouaadidoufkir2@gmail.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-secondary hover:text-primary transition-colors">MOUAAD IDOUFKIR</a> - Passionate Fullstack Developer
           </p>
         </div>
      </div>
    </div>
  );
};

    