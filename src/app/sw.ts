import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/dashboard';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;
  
  const promiseChain = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any[]) => {
    let matchingClient = null;
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen || windowClient.url.includes('/dashboard')) {
        matchingClient = windowClient;
        break;
      }
    }
    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return self.clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});
