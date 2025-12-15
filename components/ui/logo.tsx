import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
}

const logoSizes = {
  sm: { src: '/brand/tcredex_256x64.png', width: 128, height: 32 },
  md: { src: '/brand/tcredex_512x128.png', width: 160, height: 40 },
  lg: { src: '/brand/tcredex_1024x256.png', width: 200, height: 50 },
  xl: { src: '/brand/tcredex_2048x512.png', width: 280, height: 70 },
};

const iconSizes = {
  sm: { src: '/brand/tcredex_icon_32.png', width: 32, height: 32 },
  md: { src: '/brand/tcredex_icon_64.png', width: 40, height: 40 },
  lg: { src: '/brand/tcredex_icon_128.png', width: 48, height: 48 },
  xl: { src: '/brand/tcredex_icon_512.png', width: 64, height: 64 },
};

export default function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const sizeConfig = variant === 'icon' ? iconSizes : logoSizes;
  const { src, width, height } = sizeConfig[size];
  
  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="tCredex">
      <Image 
        src={src}
        alt="tCredex Logo" 
        width={width}
        height={height}
        priority
        className="h-auto w-auto"
      />
    </Link>
  );
}

// Export icon-only version for specific use cases
export function LogoIcon({ size = 'md', className = '' }: Omit<LogoProps, 'variant'>) {
  return <Logo size={size} variant="icon" className={className} />;
}
