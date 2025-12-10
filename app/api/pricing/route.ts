import { NextRequest } from 'next/server';

const PRICING_META = {
  fee_base: 0.018,
  threshold: 10_000_000,
  fee_over_threshold: 0.015,
  notes: "1.8% up to $10M gross; 1.5% from $10M+, on NMTC/HTC/LIHTC basis."
};

export async function GET(req: NextRequest) {
  return Response.json(PRICING_META);
}