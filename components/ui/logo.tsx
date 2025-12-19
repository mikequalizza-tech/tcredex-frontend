import Link from "next/link";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
  showBackground?: boolean;
}

const widthSizes = {
  sm: 120,
  md: 160,
  lg: 200,
  xl: 280,
};

const iconWidthSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export default function Logo({ 
  size = 'md', 
  variant = 'full', 
  className = '',
  showBackground = false 
}: LogoProps) {
  
  if (variant === 'icon') {
    const iconWidth = iconWidthSizes[size];
    return (
      <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="tCredex">
        <svg
          width={iconWidth}
          height={iconWidth}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="tCredex Icon"
        >
          <rect width="100" height="100" rx="20" fill="url(#paint0_linear_icon)"/>
          <path d="M35 25H65V75H50V40H35V25Z" fill="white"/>
          <path d="M25 65L45 45H35V65H25Z" fill="white"/>
          <defs>
            <linearGradient id="paint0_linear_icon" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0000FF"/>
              <stop offset="1" stopColor="#8000FF"/>
            </linearGradient>
          </defs>
        </svg>
      </Link>
    );
  }

  const width = widthSizes[size];
  const height = width / 4;
  
  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="tCredex">
      <svg
        width={width}
        height={height}
        viewBox="0 0 800 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="tCredex Logo"
      >
        {/* Background - only if showBackground is true */}
        {showBackground && <rect width="800" height="200" fill="#2A2A2A" rx="8" />}
        
        {/* The Icon */}
        <rect x="10" y="50" width="100" height="100" rx="20" fill="url(#paint0_linear_logo)"/>
        <path d="M45 75H75V125H60V90H45V75Z" fill="white"/>
        <path d="M35 115L55 95H45V115H35Z" fill="white"/>
        
        {/* The Text */}
        <text x="130" y="125" fill="white" fontFamily="Arial, sans-serif" fontSize="80" fontWeight="bold">
          tCredex
        </text>
        <text x="425" y="125" fill="#00FFFF" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold">
          .com
        </text>
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="paint0_linear_logo" x1="10" y1="50" x2="110" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0000FF"/>
            <stop offset="1" stopColor="#8000FF"/>
          </linearGradient>
        </defs>
      </svg>
    </Link>
  );
}

// Export icon-only version for specific use cases
export function LogoIcon({ size = 'md', className = '' }: Omit<LogoProps, 'variant'>) {
  return <Logo size={size} variant="icon" className={className} />;
}

// Export standalone SVG component (no Link wrapper) for external use
export function LogoSVG({ 
  width = 200, 
  showBackground = false,
  className = '' 
}: { 
  width?: number; 
  showBackground?: boolean;
  className?: string;
}) {
  const height = width / 4;
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="tCredex Logo"
    >
      {showBackground && <rect width="800" height="200" fill="#2A2A2A" rx="8" />}
      
      <rect x="10" y="50" width="100" height="100" rx="20" fill="url(#paint0_linear_standalone)"/>
      <path d="M45 75H75V125H60V90H45V75Z" fill="white"/>
      <path d="M35 115L55 95H45V115H35Z" fill="white"/>
      
      <text x="130" y="125" fill="white" fontFamily="Arial, sans-serif" fontSize="80" fontWeight="bold">
        tCredex
      </text>
      <text x="425" y="125" fill="#00FFFF" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold">
        .com
      </text>
      
      <defs>
        <linearGradient id="paint0_linear_standalone" x1="10" y1="50" x2="110" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0000FF"/>
          <stop offset="1" stopColor="#8000FF"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
