import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, ExpirationPlugin, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addEventListener: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    location: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clients: any;
  }
}

declare const self: WorkerGlobalScope;

const customCaching = [
  {
    matcher: ({ request, url }: { request: Request; url: URL }) => 
      request.destination === 'image' && !url.pathname.includes('/_next/image'),
    handler: new CacheFirst({
      cacheName: 'static-image-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 31536000, // 1 year
        }),
      ],
    }),
  },
  {
    matcher: ({ request }: { request: Request }) => request.destination === 'font',
    handler: new CacheFirst({
      cacheName: 'static-font-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 31536000, // 1 year
        }),
      ],
    }),
  },
  {
    matcher: ({ url }: { url: URL }) => url.pathname.includes('/_next/image'),
    handler: new StaleWhileRevalidate({
      cacheName: 'next-image-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 86400 * 30, // 30 days
        }),
      ],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCaching,
});

serwist.addEventListeners();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/dashboard';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const urlToOpen = new URL(targetUrl, (self as any).location.origin).href;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promiseChain = (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any[]) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (self as any).clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});
