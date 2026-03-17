'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook para detectar pulsaciones largas (long press).
 * Ideal para disparar menús contextuales en dispositivos móviles.
 */
export function useLongPress(
  callback: (e: any) => void,
  { threshold = 500, onCancel = () => {} } = {}
) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMovedRef = useRef(false);

  const start = useCallback(
    (event: any) => {
      // Prevenir que se dispare si ya está en curso (ej: multitouch)
      if (timerRef.current) return;

      setIsPressing(true);
      isMovedRef.current = false;

      timerRef.current = setTimeout(() => {
        if (!isMovedRef.current) {
          callback(event);
        }
        timerRef.current = null;
        setIsPressing(false);
      }, threshold);
    },
    [callback, threshold]
  );

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const handleMove = useCallback(() => {
    // Si el usuario mueve el dedo significativamente durante la presión, cancelamos
    isMovedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onCancel();
    }
    setIsPressing(false);
  }, [onCancel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: handleMove,
    isPressing,
  };
}
