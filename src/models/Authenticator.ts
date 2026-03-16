import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interfaz del documento del Autenticador (WebAuthn) para Mongoose.
 */
export interface IAuthenticator extends Document {
    credentialID: Buffer;
    credentialPublicKey: Buffer;
    counter: number;
    credentialDeviceType: string;
    credentialBackedUp: boolean;
    transports?: string[];
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    lastUsedAt: Date;
}

const AuthenticatorSchema: Schema = new Schema(
    {
        credentialID: {
            type: Buffer,
            required: true,
            unique: true
        },
        credentialPublicKey: {
            type: Buffer,
            required: true
        },
        counter: {
            type: Number,
            required: true,
            default: 0
        },
        credentialDeviceType: {
            type: String,
            required: true
        },
        credentialBackedUp: {
            type: Boolean,
            required: true
        },
        transports: {
            type: [String],
            default: []
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastUsedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Índice para búsquedas rápidas por userId
AuthenticatorSchema.index({ userId: 1 });

const Authenticator = mongoose.models.Authenticator || mongoose.model<IAuthenticator>('Authenticator', AuthenticatorSchema);

export default Authenticator;
