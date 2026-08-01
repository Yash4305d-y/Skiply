'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NavigationHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const historyStack = useRef<string[]>([]);

  useEffect(() => {
    if (historyStack.current[historyStack.current.length - 1] !== pathname) {
      historyStack.current.push(pathname);
    }
  }, [pathname]);


  // For standard PWAs, Next.js sometimes breaks the history stack on mobile.
  // We can intercept the physical back button (popstate) and force our tracked state
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (historyStack.current.length > 1) {
        const currentPath = window.location.pathname;
        const topOfStack = historyStack.current[historyStack.current.length - 1];
        
        if (currentPath === topOfStack) {
          // Pathname didn't change (this was a modal closing or dummy state pop)
          // We do not pop our history stack.
          return;
        }

        // It was a real page back navigation
        historyStack.current.pop();
        const intendedPath = historyStack.current[historyStack.current.length - 1];
        
        // Android PWA bug workaround: it went to '/' instead of intended previous page
        if (currentPath === '/' && intendedPath !== '/') {
          router.replace(intendedPath);
        }
      } else {
        // Stack empty, naturally go to home or close
        historyStack.current = ['/'];
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  return null;
}
