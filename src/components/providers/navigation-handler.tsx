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
        // The browser already popped the native history state.
        // We update our manual stack.
        historyStack.current.pop();
        const intendedPath = historyStack.current[historyStack.current.length - 1];
        
        // If the browser natively went to home instead of the intended previous page,
        // we forcefully replace the state back to what our stack expects.
        if (window.location.pathname === '/' && intendedPath !== '/') {
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
