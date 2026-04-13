import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

export default function BrandLogo({ className = "h-9 w-auto", alt = "Innotech Engineering" }: BrandLogoProps) {
  return (
    <>
      <img src={logoLight} alt={alt} className={`${className} dark:hidden`} />
      <img src={logoDark} alt={alt} className={`${className} hidden dark:block`} />
    </>
  );
}
