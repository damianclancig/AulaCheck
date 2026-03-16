'use client';

import { useState, useCallback } from 'react';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';

export const usePasskeys = () => {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSupported = useCallback(() => {
        return browserSupportsWebAuthn();
    }, []);

    const registerPasskey = useCallback(async () => {
        setIsPending(true);
        setError(null);
        try {
            // 1. Obtener opciones del servidor
            const resp = await fetch('/api/auth/passkey/register-options');
            if (!resp.ok) throw new Error('Error al obtener opciones de registro');
            const options = await resp.json();

            // 2. Iniciar registro de biometría en el navegador
            const attestationResponse = await startRegistration(options);

            // 3. Enviar respuesta al servidor para verificación
            const verifyResp = await fetch('/api/auth/passkey/register-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attestationResponse),
            });

            const verification = await verifyResp.json();
            if (!verification.verified) throw new Error('La verificación del registro falló');

            return true;
        } catch (err: any) {
            const isCancel = err.name === 'NotAllowedError' || err.name === 'AbortError';
            
            if (!isCancel) {
                console.error('Registration Error:', err);
                setError(err.message || 'Error durante el registro de Passkey');
            }
            
            return false;
        } finally {
            setIsPending(false);
        }
    }, []);

    const authenticatePasskey = useCallback(async (useConditionalUI = false) => {
        setIsPending(true);
        setError(null);
        try {
            // 1. Obtener opciones de autenticación
            const resp = await fetch('/api/auth/passkey/login-options');
            if (!resp.ok) throw new Error('Error al obtener opciones de autenticación');
            const options = await resp.json();

            // 2. Iniciar autenticación
            const assertionResponse = await startAuthentication({
                ...options,
                useConditionalUI,
            });

            // 3. Verificar en el servidor
            const verifyResp = await fetch('/api/auth/passkey/login-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assertionResponse),
            });

            const verification = await verifyResp.json();
            if (!verification.verified) throw new Error('La verificación de identidad falló');

            return {
                verified: true,
                email: verification.email
            };
        } catch (err: any) {
            // Ignorar AbortError o NotAllowedError en Conditional UI (común en cancelaciones de autofill)
            const isCancel = err.name === 'AbortError' || err.name === 'NotAllowedError';
            
            if (isCancel && useConditionalUI) {
                console.warn('Authentication ceremony cancelled or aborted (Conditional UI)');
                return null;
            }

            if (!isCancel) {
                console.error('WebAuthn Error:', err);
            }
            
            if (err.name === 'NotAllowedError' && !useConditionalUI) {
                setError('Operación cancelada o tiempo de espera agotado');
            } else if (!isCancel) {
                setError(err.message || 'Error durante la autenticación');
            }
            return null;
        } finally {
            setIsPending(false);
        }
    }, []);

    return {
        isPending,
        error,
        isSupported,
        registerPasskey,
        authenticatePasskey
    };
};
