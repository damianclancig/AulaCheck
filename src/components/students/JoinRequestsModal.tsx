'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, XCircle, User } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { JoinRequest } from '@/types/models';

interface JoinRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onRequestProcessed: () => void;
}

export function JoinRequestsModal({ isOpen, onClose, courseId, onRequestProcessed }: JoinRequestsModalProps) {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, courseId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/courses/${courseId}/join-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al cargar solicitudes');

      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/courses/${courseId}/join-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action }),
      });

      if (!response.ok) throw new Error('Error al procesar solicitud');

      // Remove from list
      setRequests(requests.filter(r => r._id.toString() !== requestId));
      onRequestProcessed();
    } catch (error) {
      console.error(error);
      alert('Error al procesar la solicitud');
    } finally {
      setProcessing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Solicitudes Pendientes ({requests.length})
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((request) => (
                <div key={request._id.toString()} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {request.firstName} {request.lastName}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {request.email && (
                          <p>📧 {request.email}</p>
                        )}
                        {request.phone && (
                          <p>📱 {request.phone}</p>
                        )}
                        {request.externalId && (
                          <p>🆔 Legajo: {request.externalId}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Solicitado: {new Date(request.createdAt).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleProcess(request._id.toString(), 'approve')}
                        disabled={processing === request._id.toString()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                      >
                        {processing === request._id.toString() ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleProcess(request._id.toString(), 'reject')}
                        disabled={processing === request._id.toString()}
                        className="px-4 py-2 bg-red-50 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
