import { NextResponse } from "next/server";
import { getFinancialSummary } from "@/lib/financials";

export async function GET() {
  return NextResponse.json(getFinancialSummary());
}
