import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  uniColor?: boolean;
};

export const Logo = ({ className, uniColor }: LogoProps) => {
  const lightSrc = "/images/vokos_logo_black_&_blue.svg";
  const darkSrc = "/images/vokos_logo_white_&_blue.svg";

  return (
    <>
      <Image src={lightSrc} alt="Vokos" width={220} height={48} className={cn("h-8 w-auto dark:hidden", className)} priority={false} />
      <Image src={darkSrc} alt="Vokos" width={220} height={48} className={cn("hidden h-8 w-auto dark:block", className)} priority={false} />
    </>
  );
};

export const LogoIcon = ({ className, uniColor }: LogoProps) => {
  const lightSrc = "/images/vokos_submark_black.svg";
  const darkSrc = "/images/vokos_submark_white.svg";

  return (
    <>
      <Image src={lightSrc} alt="Vokos" width={220} height={48} className={cn("size-8 dark:hidden", className)} priority={false} />
      <Image src={darkSrc} alt="Vokos" width={220} height={48} className={cn("hidden size-8 dark:block", className)} priority={false} />
    </>
  );
};
