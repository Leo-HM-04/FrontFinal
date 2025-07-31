import React from 'react';

interface UrgencyBadgeProps {
  isUrgent: boolean;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ isUrgent }) => {
  if (!isUrgent) return null;
  return (
    <span className="ml-2 text-xs font-bold text-red-600 flex items-center gap-1" aria-label="Urgente">
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="inline w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      ¡Urgente!
    </span>
  );
};
