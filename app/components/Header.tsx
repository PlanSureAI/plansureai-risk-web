import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  size?: "large" | "small";
  hideNav?: boolean;
};

export function Header({ size = "small", hideNav = false }: HeaderProps) {
  const logoWidth = size === "large" ? 150 : 110;
  const logoHeight = Math.round(logoWidth * 0.25);

  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1">
        <Link href="/" className="flex items-center">
          <Image
            src="/plansureai-wordmark.png"
            alt="PlanSureAI"
            width={logoWidth}
            height={logoHeight}
            priority={size === "large"}
          />
        </Link>

        {!hideNav && (
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-700">
            <Link href="/zero-bill-homes" className="hover:text-zinc-900">
              Zero-Bill Homes
            </Link>
            <Link href="/epc" className="hover:text-zinc-900">
              EPC explorer
            </Link>
            <Link href="/sites" className="hover:text-zinc-900">
              Dashboard
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
