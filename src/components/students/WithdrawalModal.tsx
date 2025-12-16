'use client';

import { X, UserMinus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, note?: string) => void;
    studentName: string;
    isLoading?: boolean;
}

export function WithdrawalModal({
    isOpen,
    onClose,
    onConfirm,
    studentName,
    isLoading = false,
}: WithdrawalModalProps) {
    const [reason, setReason] = useState<string>('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason) {
            setError('Por favor selecciona un motivo');
            return;
        }
        onConfirm(reason, note);
    };

    const handleReasonChange = (newReason: string) => {
        setReason(newReason);
        if (newReason) setError('');
        if (newReason !== 'other') setNote('');
    };

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
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10 mb-4 sm:mb-0">
                            <UserMinus className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="sm:mt-0 sm:ml-4 text-center sm:text-left flex-1">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                Dar de baja al alumno
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Estás por dar de baja a <span className="font-semibold text-gray-700 dark:text-gray-200">{studentName}</span>.
                                    El alumno no se eliminará de la base de datos para mantener sus registros históricos, pero ya no aparecerá en las listas de asistencia.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Motivo de baja *
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: 'course_change', label: 'Cambio de curso' },
                                                { value: 'school_change', label: 'Cambio de escuela' },
                                                { value: 'other', label: 'Otro motivo' },
                                            ].map((option) => (
                                                <label key={option.value} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <input
                                                        type="radio"
                                                        name="withdrawal-reason"
                                                        value={option.value}
                                                        checked={reason === option.value}
                                                        onChange={(e) => handleReasonChange(e.target.value)}
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {reason === 'other' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Especificar motivo (opcional)
                                            </label>
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Ingrese detalles adicionales..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 min-h-[80px] resize-none"
                                            />
                                        </div>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Baja
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
