"use client";

import React, { useEffect } from 'react';

export const PWARegistration: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, notify user
                    showUpdateNotification();
                  }
                });
              }
            });
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle PWA install prompt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let deferredPrompt: any = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;

      // Show install button or notification
      showInstallPrompt();
    });

    const showInstallPrompt = () => {
      // Create install prompt
      const installButton = document.createElement('button');
      installButton.innerText = 'Install App';
      installButton.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      installButton.onclick = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to install prompt: ${outcome}`);
          deferredPrompt = null;
          installButton.remove();
        }
      };

      document.body.appendChild(installButton);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (installButton.parentNode) {
          installButton.remove();
        }
      }, 10000);
    };

    const showUpdateNotification = () => {
      const updateButton = document.createElement('button');
      updateButton.innerText = 'Update Available';
      updateButton.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      updateButton.onclick = () => {
        window.location.reload();
      };

      document.body.appendChild(updateButton);
    };

    // Handle online/offline status
    const handleOnlineStatus = () => {
      const status = navigator.onLine ? 'online' : 'offline';
      console.log(`App is ${status}`);

      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('app:network-status', {
        detail: { online: navigator.onLine }
      }));
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return null;
};

// Hook to use network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleStatusChange = (event: CustomEvent) => {
      setIsOnline(event.detail.online);
    };

    window.addEventListener('app:network-status', handleStatusChange as EventListener);

    return () => {
      window.removeEventListener('app:network-status', handleStatusChange as EventListener);
    };
  }, []);

  return isOnline;
};