import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  size?: "large" | "small";
};

export function Header({ size = "small" }: HeaderProps) {
  const logoWidth = size === "large" ? 150 : 110;
  const logoHeight = Math.round(logoWidth * 0.25);

  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-1">
        <Link href="/" className="flex items-center">
          <Image
            src="/plansureai-wordmark.png"
            alt="PlanSureAI"
            width={logoWidth}
            height={logoHeight}
            priority={size === "large"}
          />
        </Link>

      </div>
    </header>
  );
}
