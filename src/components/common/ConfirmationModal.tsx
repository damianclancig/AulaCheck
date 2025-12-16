'use client';

import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'info',
    isLoading = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    icon: <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />,
                    iconBg: 'bg-red-100 dark:bg-red-900/30',
                    buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    buttonText: 'text-white'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />,
                    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
                    buttonText: 'text-white'
                };
            case 'info':
            default:
                return {
                    icon: <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
                    buttonText: 'text-white'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full overflow-hidden transform transition-all sm:my-8 border border-gray-100 dark:border-gray-800">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md transition-colors"
                    >
                        <span className="sr-only">Cerrar</span>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="sm:flex sm:items-start">
                        <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10 mb-4 sm:mb-0`}>
                            {styles.icon}
                        </div>
                        <div className="sm:mt-0 sm:ml-4 text-center sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                            styles.buttonBg,
                            styles.buttonText
                        )}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}
