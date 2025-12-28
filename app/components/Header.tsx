import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  size?: "large" | "small";
};

export function Header({ size = "small" }: HeaderProps) {
  const logoWidth = size === "large" ? 180 : 120;
  const logoHeight = Math.round(logoWidth * 0.22);

  return (
    <header className="w-full border-b border-neutral-200">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
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
