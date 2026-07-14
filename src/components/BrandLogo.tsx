import logo from "@/assets/logo.png";

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

export default function BrandLogo({ className = "h-9 w-auto", alt = "Assist Portal" }: BrandLogoProps) {
  return <img src={logo} alt={alt} className={className} />;
}
