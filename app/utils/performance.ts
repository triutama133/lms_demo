"use client";

import { useEffect } from 'react';

// Performance monitoring hook for Core Web Vitals
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Basic performance monitoring (web-vitals can be added later if needed)
    console.log('Performance monitoring initialized');

    // Track navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log('Navigation Timing:', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
      });
    }

    // Track resource loading
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const slowResources = resources.filter((resource) => resource.duration > 1000);

    if (slowResources.length > 0) {
      console.log('Slow resources (>1s):', slowResources.map((resource) => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
      })));
    }

  }, []);
};

// Performance monitoring component - moved to separate component file
// Use the usePerformanceMonitoring hook in your components instead

// Utility function to measure component render time
export const measureRenderTime = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 16.67) { // More than one frame at 60fps
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (slow render)`);
    } else {
      console.log(`${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  };
};

// Hook to track user interactions
export const useInteractionTracking = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 50),
        timestamp: Date.now(),
      };

      // Send to analytics
      console.log('User interaction:', elementInfo);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
};

// Error tracking utility
export const trackError = (error: Error, context?: string) => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);

  // Send to error tracking service
  // Example: sendToErrorTracker(error, context);
};

// Performance optimization utilities
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};