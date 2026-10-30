import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'purple' | 'blue' | 'danger' | 'success' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none'
}) => {
  let glowClasses = 'glass-panel';

  if (glow === 'purple') {
    glowClasses = 'glass-panel-glow';
  } else if (glow === 'danger') {
    glowClasses = 'glass-panel-danger';
  } else if (glow === 'success') {
    glowClasses = 'glass-panel-success';
  }

  return (
    <div className={`rounded-2xl p-6 transition-all duration-300 ${glowClasses} ${className}`}>
      {children}
    </div>
  );
};

