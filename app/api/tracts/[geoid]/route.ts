import { NextRequest, NextResponse } from "next/server";
import { lookupTract } from "@/lib/tracts/tractData";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ geoid: string }> }
) {
  const { geoid } = await params;

  if (!geoid || geoid.length !== 11) {
    return NextResponse.json(
      { error: "Invalid GEOID. Must be 11 digits." },
      { status: 400 }
    );
  }

  const tract = await lookupTract(geoid);

  if (!tract) {
    return NextResponse.json(
      { error: "Tract not found or not NMTC eligible" },
      { status: 404 }
    );
  }

  // Canonical response format
  return NextResponse.json({
    geoid: tract.geoid,
    state: tract.stateAbbr,
    county: tract.county,
    poverty_rate: tract.poverty,
    mfi_pct: tract.income,
    unemployment_rate: tract.unemployment,

    flags: {
      nmtc_eligible: tract.eligible,
      severely_distressed: tract.severelyDistressed,
      persistent_poverty: false, // TODO: add to data
      non_metro: false, // TODO: add to data
      oz: false, // TODO: add OZ overlay
      brownfield: false, // TODO: add brownfield data
      uts: false, // TODO: add underserved state flag
    },
  });
}
