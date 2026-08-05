importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

// Fetch the Firebase configuration dynamically
fetch('/api/firebase-config')
  .then((response) => response.json())
  .then((config) => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification.title || 'Skiply Notification';
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/nav-logo.png',
        data: payload.data, // This carries the url or action
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch((err) => console.error('Failed to initialize Firebase Service Worker', err));

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        if (windowClient.url.includes(targetUrl) || windowClient.url.includes('/dashboard')) {
          matchingClient = windowClient;
          break;
        }
      }
      if (matchingClient) {
        return matchingClient.focus();
      } else {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
