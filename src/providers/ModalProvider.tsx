'use client';

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';

interface ModalOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm?: () => Promise<void> | void;
}

interface ModalContextType {
  showConfirm: (options: ModalOptions) => Promise<boolean>;
  showAlert: (options: Omit<ModalOptions, 'cancelText'>) => Promise<void>;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);
  const [isAlert, setIsAlert] = useState(false);

  const showConfirm = useCallback((opts: ModalOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setIsAlert(false);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const showAlert = useCallback((opts: Omit<ModalOptions, 'cancelText'>) => {
    return new Promise<void>((resolve) => {
      setOptions(opts as ModalOptions);
      setIsAlert(true);
      setResolvePromise(() => resolve as unknown as ((value: boolean) => void));
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(false); // Retorna false al cancelar un confirm
    }
    // Añadimos pequeño timeout para que de tiempo a la animación de cierre antes de resetear estado
    setTimeout(() => {
      setOptions(null);
      setResolvePromise(null);
    }, 200);
  }, [resolvePromise]);

  const handleConfirm = useCallback(async () => {
    if (options?.onConfirm) {
      setIsLoading(true);
      try {
        await options.onConfirm();
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(true); // Retorna true si fue confirmado con éxito
    }
    
    setTimeout(() => {
      setOptions(null);
      setResolvePromise(null);
    }, 200);
  }, [options, resolvePromise]);

  return (
    <ModalContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      {options && (
        <ConfirmationModal
          isOpen={isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={options.title}
          description={options.description}
          confirmText={options.confirmText || 'Aceptar'}
          cancelText={options.cancelText}
          variant={options.variant}
          isLoading={isLoading}
          hideCancel={isAlert}
        />
      )}
    </ModalContext.Provider>
  );
}
