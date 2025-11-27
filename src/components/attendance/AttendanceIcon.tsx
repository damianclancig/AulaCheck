'use client';

import { Check, XCircle, Clock } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceIconProps {
  status?: AttendanceStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function AttendanceIcon({ status, size = 'md' }: AttendanceIconProps) {
  if (!status) {
    return <span className="text-gray-300 text-sm">-</span>;
  }
  
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  
  switch (status) {
    case 'present':
      return <Check className={`${iconSize} text-green-600`} />;
    case 'absent':
      return <XCircle className={`${iconSize} text-red-600`} />;
    case 'late':
      return <Clock className={`${iconSize} text-yellow-600`} />;
    default:
      return <span className="text-gray-300 text-sm">-</span>;
  }
}
