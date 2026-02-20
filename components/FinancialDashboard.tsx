"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Cpu,
  Megaphone,
  TrendingUp,
} from "lucide-react";

interface FinancialSummary {
  totalCostUsd: number;
  totalRevenueUsd: number;
  netProfitUsd: number;
  profitMarginPercent: number;
  apiCallCount: number;
  adsServedCount: number;
}

function formatUsd(amount: number): string {
  if (Math.abs(amount) < 0.01) {
    return `$${amount.toFixed(6)}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function FinancialDashboard() {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/financials");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Silently fail — dashboard is non-critical
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const isProfitable = data ? data.netProfitUsd >= 0 : true;
  const hasActivity = data ? data.apiCallCount > 0 || data.adsServedCount > 0 : false;

  // Calculate bar widths (relative to whichever is larger)
  const maxBar = data ? Math.max(data.totalCostUsd, data.totalRevenueUsd, 0.000001) : 1;
  const costBarPercent = data ? (data.totalCostUsd / maxBar) * 100 : 0;
  const revenueBarPercent = data ? (data.totalRevenueUsd / maxBar) * 100 : 0;

  return (
    <div className="border-t border-gray-200 px-3 py-2">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between text-[11px] font-semibold text-gray-700"
      >
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3 w-3 text-gray-500" />
          <span>Financials</span>
          {hasActivity && (
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  isProfitable ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isProfitable ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </span>
          )}
        </div>
        {collapsed ? (
          <ChevronDown className="h-3 w-3 text-gray-400" />
        ) : (
          <ChevronUp className="h-3 w-3 text-gray-400" />
        )}
      </button>

      {!collapsed && (
        <div className="mt-2 space-y-2">
          {/* Net Profit — hero stat */}
          <div
            className={`rounded-lg px-2.5 py-2 text-center ${
              isProfitable
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">
              Net Profit
            </div>
            <div
              className={`text-lg font-bold tabular-nums ${
                isProfitable ? "text-green-700" : "text-red-700"
              }`}
            >
              {data ? (data.netProfitUsd >= 0 ? "+" : "") + formatUsd(data.netProfitUsd) : "—"}
            </div>
          </div>

          {/* Cost bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <Cpu className="h-2.5 w-2.5" />
                <span>Compute Cost</span>
              </div>
              <span className="font-mono tabular-nums">
                {data ? formatUsd(data.totalCostUsd) : "—"}
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-red-400 transition-all duration-500"
                style={{ width: `${Math.max(costBarPercent, hasActivity ? 2 : 0)}%` }}
              />
            </div>
          </div>

          {/* Revenue bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <Megaphone className="h-2.5 w-2.5" />
                <span>Ad Revenue</span>
              </div>
              <span className="font-mono tabular-nums">
                {data ? formatUsd(data.totalRevenueUsd) : "—"}
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-400 transition-all duration-500"
                style={{ width: `${Math.max(revenueBarPercent, 0)}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Cpu className="h-2.5 w-2.5" />
              <span>{data?.apiCallCount ?? 0} API calls</span>
            </div>
            <div className="flex items-center gap-1">
              <Megaphone className="h-2.5 w-2.5" />
              <span>{data?.adsServedCount ?? 0} ads served</span>
            </div>
          </div>

          {/* Profit margin */}
          {data && data.totalRevenueUsd > 0 && (
            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
              <TrendingUp className="h-2.5 w-2.5" />
              <span>
                Margin: {data.profitMarginPercent.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
