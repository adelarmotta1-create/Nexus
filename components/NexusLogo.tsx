import React, { useId } from 'react';

export const NexusLogo: React.FC<{ size?: number, className?: string }> = ({ size = 40, className = "" }) => {
  // Generates a unique ID for this specific instance of the logo
  // This ensures the gradient works even if multiple logos are on screen
  const uniqueId = useId();
  const gradientId = `nexusGradient-${uniqueId}`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="10" y1="8" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#9333EA" /> {/* Purple-600 */}
        </linearGradient>
      </defs>
      {/* Left Pillar - Solid Blue */}
      <path d="M11 6V34" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round"/>
      {/* Right Pillar - Solid Purple */}
      <path d="M29 6V34" stroke="#8B5CF6" strokeWidth="5" strokeLinecap="round"/>
      {/* The Connection (Nexus) - Uses the Unique Gradient ID */}
      <path d="M11 6L29 34" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};