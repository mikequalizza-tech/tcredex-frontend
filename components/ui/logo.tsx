import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const logoSizes = {
  sm: { src: '/brand/tcredex_transparent_256x64.png', width: 100, height: 25 },
  md: { src: '/brand/tcredex_transparent_512x128.png', width: 140, height: 35 },
  lg: { src: '/brand/tcredex_transparent_1024x256.png', width: 200, height: 50 },
  xl: { src: '/brand/tcredex_transparent_2048x512.png', width: 300, height: 75 },
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const { src, width, height } = logoSizes[size];
  
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
