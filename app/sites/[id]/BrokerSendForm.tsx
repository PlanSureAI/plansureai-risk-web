"use client";

type Broker = {
  id: string;
  name: string;
  firm: string | null;
  email: string;
};

export function BrokerSendForm({
  brokers,
  siteName,
}: {
  brokers: Broker[];
  siteName: string | null;
}) {
  const subject = `PlanSureAI pack - ${siteName ?? "Site"}`;

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <span className="text-zinc-600">Send pack to broker:</span>
      <select
        className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs"
        onChange={(e) => {
          const brokerId = e.target.value;
          if (brokerId === "__add") {
            window.location.href = "/brokers/new";
            return;
          }
          const broker = brokers.find((b) => b.id === brokerId);
          if (!broker) return;
          const body = encodeURIComponent(
            `Hi ${broker.name},\n\nI've attached the PlanSureAI finance pack for this small site. Could we discuss funding options?\n\nThanks.`
          );
          window.location.href = `mailto:${broker.email}?subject=${encodeURIComponent(
            subject
          )}&body=${body}`;
        }}
        defaultValue=""
      >
        <option value="" disabled>
          Select broker
        </option>
        <option value="__add">+ Add new broker</option>
        {brokers.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} {b.firm ? `– ${b.firm}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
