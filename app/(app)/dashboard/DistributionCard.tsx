"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Bucket = {
  label: string;
  value: number;
};

type DistributionCardProps = {
  title: string;
  data: Bucket[];
  summary?: string | null;
};

export default function DistributionCard({ title, data, summary }: DistributionCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-500" />
          {title}
        </h2>
        <span className="text-[11px] text-slate-500">Count</span>
      </div>
      <div className="mt-3 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
            barSize={10}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={60} tick={{ fontSize: 11 }} />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} fill="#0ea5e9" />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
              contentStyle={{ fontSize: 11 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1 text-xs text-slate-600">
        {data.map((item) => (
          <li key={item.label} className="flex justify-between">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </li>
        ))}
      </ul>
      {summary ? <p className="mt-2 text-[11px] text-slate-500">{summary}</p> : null}
    </div>
  );
}
