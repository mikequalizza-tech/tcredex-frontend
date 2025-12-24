import Link from "next/link";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
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
}: LogoProps) {
  
  if (variant === 'icon') {
    const iconWidth = iconWidthSizes[size];
    return (
      <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="tCredex">
        <img
          src="/brand/tcredex_icon_64.png"
          alt="tCredex"
          width={iconWidth}
          height={iconWidth}
          style={{ width: iconWidth, height: iconWidth }}
        />
      </Link>
    );
  }

  const width = widthSizes[size];
  const height = Math.round(width / 4);
  
  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="tCredex">
      <img
        src="/brand/tcredex_transparent_256x64.png"
        alt="tCredex"
        width={width}
        height={height}
        style={{ width: width, height: 'auto' }}
      />
    </Link>
  );
}
