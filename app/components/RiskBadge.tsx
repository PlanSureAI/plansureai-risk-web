import type { RiskLevel } from "@/lib/risk/types";

type RiskBadgeProps = {
  riskLevel: RiskLevel;
  riskScore: number;
  onClick?: () => void;
  className?: string;
};

export function RiskBadge({
  riskLevel,
  riskScore,
  onClick,
  className = "",
}: RiskBadgeProps) {
  const colors: Record<RiskLevel, string> = {
    LOW: "bg-green-100 text-green-800 border-green-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
    HIGH: "bg-orange-100 text-orange-800 border-orange-300",
    EXTREME: "bg-red-100 text-red-800 border-red-300",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`inline-flex flex-col items-center gap-0.5 rounded-md border px-3 py-1.5 text-xs font-medium ${colors[riskLevel]} ${
        onClick ? "cursor-pointer transition-opacity hover:opacity-80" : ""
      } ${className}`}
      title={`Overall risk score: ${riskScore}`}
    >
      <span className="text-sm font-bold">{riskScore.toFixed(1)}</span>
      <span className="text-[10px] uppercase tracking-wide">{riskLevel}</span>
    </Component>
  );
}
