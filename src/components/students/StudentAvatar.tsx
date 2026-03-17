'use client'

import { cn } from '@/lib/utils'

interface StudentAvatarProps {
  firstName: string
  lastName: string
  isInactive?: boolean
  className?: string
}

export function StudentAvatar({ firstName, lastName, isInactive, className }: StudentAvatarProps) {
  // Obtener las iniciales del primer nombre y primer apellido
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  
  return (
    <div
      className={cn(
        "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors overflow-hidden",
        isInactive 
          ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" 
          : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
        className
      )}
    >
      <span className="text-base font-bold leading-none select-none tracking-tighter">
        {initials}
      </span>
    </div>
  )
}
