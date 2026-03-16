import mongoose, { Schema, Document } from 'mongoose';

/**
 * Roles disponibles en el sistema.
 */
export enum UserRole {
    DIRECTOR = 'DIRECTOR',
    SECRETARY = 'SECRETARY',
    PRECEPTOR = 'PRECEPTOR',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    PENDING = 'PENDING'
}

/**
 * Interfaz del documento de Usuario para Mongoose.
 */
export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    role: UserRole;
    authenticators?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        image: {
            type: String
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.PENDING
        },
        authenticators: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Authenticator'
            }
        ],
    },
    {
        timestamps: true // Automáticamente maneja createdAt y updatedAt
    }
);

// Prevenir la sobreescritura del modelo en recargas de desarrollo (Next.js HMR)
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
