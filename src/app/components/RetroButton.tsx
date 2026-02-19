interface RetroButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'danger' | 'default';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RetroButton({ 
  children, 
  onClick, 
  variant = 'default', 
  disabled = false,
  size = 'md',
  className = ''
}: RetroButtonProps) {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 border-blue-700 text-white',
    success: 'bg-green-500 hover:bg-green-600 border-green-700 text-white',
    danger: 'bg-red-500 hover:bg-red-600 border-red-700 text-white',
    default: 'bg-purple-500 hover:bg-purple-600 border-purple-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-6 py-2 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        border-b-4
        font-bold
        rounded-lg
        shadow-lg
        transition-all
        active:translate-y-1
        active:border-b-2
        disabled:opacity-50
        disabled:cursor-not-allowed
        uppercase
        tracking-wider
        ${className}
      `}
      style={{
        fontFamily: "'Press Start 2P', cursive",
        imageRendering: 'pixelated',
      }}
    >
      {children}
    </button>
  );
}
