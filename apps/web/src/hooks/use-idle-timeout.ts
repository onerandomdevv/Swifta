'use client';

import { useEffect, useRef } from 'react';

/**
 * A custom hook that tracks user inactivity.
 * Listens for mouse movements, clicks, scrolling, and keyboard presses.
 * If no activity is detected within `timeoutMinutes`, the `onIdle` callback is executed.
 */
export function useIdleTimeout(timeoutMinutes: number, onIdle: () => void) {
  const timeoutId = useRef<NodeJS.Timeout>();
  const lastActiveTime = useRef<number>(Date.now());
  const onIdleRef = useRef(onIdle);

  // Keep the latest callback reference to avoid re-triggering effects
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActiveTime.current >= timeoutMs) {
        onIdleRef.current();
      }
    };

    const updateActivity = () => {
      lastActiveTime.current = Date.now();
    };

    // Events to monitor for activity
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mouseWheel',
      'touchstart',
      'touchmove',
    ];

    // Attach listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for idle every 30 seconds (or timeoutMs/2 if timeout is very short)
    const checkInterval = Math.min(30 * 1000, timeoutMs / 2);
    timeoutId.current = setInterval(checkIdle, checkInterval);

    return () => {
      // Cleanup listeners and intervals
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      if (timeoutId.current) {
        clearInterval(timeoutId.current);
      }
    };
  }, [timeoutMinutes]);
}
