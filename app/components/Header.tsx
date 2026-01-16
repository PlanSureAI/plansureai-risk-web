import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  size?: "large" | "small";
  hideNav?: boolean;
  homeHref?: string;
  navVariant?: "app" | "marketing";
};

export function Header({
  size = "small",
  hideNav = false,
  homeHref = "/",
  navVariant = "marketing",
}: HeaderProps) {
  const logoWidth = size === "large" ? 160 : 140;
  const logoHeight = Math.round(logoWidth * 0.25);

  const zeroBillHref = "/zero-bill-homes";
  const epcHref = navVariant === "app" ? "/epc" : "/epc";
  const dashboardHref = "/dashboard";

  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1">
        <Link href={homeHref} className="flex items-center">
          <Image
            src="/logo.png"
            alt="PlanSureAI"
            width={logoWidth}
            height={logoHeight}
            priority={size === "large"}
          />
        </Link>

        {!hideNav && (
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-700">
            <Link href="/" className="hover:text-zinc-900">
              Home
            </Link>
            <Link href={zeroBillHref} className="hover:text-zinc-900">
              Zero-Bill Homes
            </Link>
            <Link href={epcHref} className="hover:text-zinc-900">
              EPC explorer
            </Link>
            <Link href={dashboardHref} className="hover:text-zinc-900">
              Dashboard
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
