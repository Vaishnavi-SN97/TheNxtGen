interface PixelPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function PixelPanel({ children, className = '', variant = 'default' }: PixelPanelProps) {
  const variants = {
    default: 'bg-purple-100 border-purple-400',
    primary: 'bg-blue-100 border-blue-400',
    success: 'bg-green-100 border-green-400',
    warning: 'bg-yellow-100 border-yellow-400',
  };

  return (
    <div 
      className={`
        ${variants[variant]}
        border-4 rounded-lg
        shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)]
        p-4
        ${className}
      `}
      style={{
        imageRendering: 'pixelated',
      }}
    >
      {children}
    </div>
  );
}
