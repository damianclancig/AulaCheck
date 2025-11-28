'use client';

import { useState } from 'react';
import { X, Copy, Check, RefreshCw, Link2, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { QRCodeSVG } from 'qrcode.react';

interface InviteStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  currentJoinCode?: string;
  allowJoinRequests: boolean;
}

export function InviteStudentsModal({ 
  isOpen, 
  onClose, 
  courseId, 
  courseName,
  currentJoinCode,
  allowJoinRequests 
}: InviteStudentsModalProps) {
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState(currentJoinCode || '');
  const [isEnabled, setIsEnabled] = useState(allowJoinRequests);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const joinUrl = `${window.location.origin}/join/${joinCode}`;

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/courses/${courseId}/join-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al generar código');

      const data = await response.json();
      setJoinCode(data.joinCode);
      setIsEnabled(true);
    } catch (error) {
      console.error(error);
      alert('Error al generar el código de invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('¿Desactivar el link de invitación? Los alumnos ya no podrán usarlo.')) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/courses/${courseId}/join-code`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al desactivar');

      setIsEnabled(false);
      alert('Link de invitación desactivado');
    } catch (error) {
      console.error(error);
      alert('Error al desactivar el link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invitar Alumnos</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <p>Comparte este link con tus alumnos. Ellos podrán registrarse desde su celular y tú aprobarás las solicitudes.</p>
              </div>
            </div>
          </div>

          {!joinCode ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">Genera un link de invitación para que los alumnos se registren solos</p>
              <button
                onClick={handleGenerateCode}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Generar Link de Invitación
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link de Invitación {isEnabled ? '(Activo)' : '(Desactivado)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 border-2 border-indigo-200 dark:border-indigo-800 transition-colors">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  📱 Escanea el QR en clase
                </p>
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <QRCodeSVG 
                    value={joinUrl} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                  Los alumnos pueden escanear este código con su celular
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerar Código
                </button>
                {isEnabled && (
                  <button
                    onClick={handleDisable}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                  >
                    Desactivar Link
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
