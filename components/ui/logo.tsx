import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex shrink-0" aria-label="TCredex">
      <Image src="/brand/logo-tcredex-cropped.png" alt="TCredex Logo" width={120} height={40} />
    </Link>
  );
}
