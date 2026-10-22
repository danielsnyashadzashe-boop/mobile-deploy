/**
 * Keeps a screen up to date without the CTA pulling down: reloads quietly every
 * 30 seconds while the screen is open, when they come back to the screen, and when
 * the app returns to the foreground. Tip outcomes (paid, failed, not completed) are
 * settled on the server within 5 to 15 minutes, so they appear here on their own.
 */
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useLiveRefresh(reload: () => unknown, intervalMs = 30000) {
  const latest = useRef(reload);
  useEffect(() => { latest.current = reload; }, [reload]);
  const first = useRef(true);

  useFocusEffect(
    useCallback(() => {
      // The screen's own first load already ran; refresh on every later return.
      if (first.current) first.current = false;
      else latest.current();
      const timer = setInterval(() => {
        if (AppState.currentState === 'active') latest.current();
      }, intervalMs);
      const sub = AppState.addEventListener('change', s => { if (s === 'active') latest.current(); });
      return () => { clearInterval(timer); sub.remove(); };
    }, [intervalMs]),
  );
}
