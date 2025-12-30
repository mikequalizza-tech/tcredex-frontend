import DealMap from "@/components/maps/DealMap";
import DealCard from "@/components/DealCard";
import { fetchDeals } from "@/lib/supabase/queries";
import { mapDealToCard } from "@/lib/utils/dealCardMapper";

export default async function CDEMapPage() {
  const deals = await fetchDeals();
  const dealCards = deals.map(mapDealToCard);

  return (
    <main className="relative min-h-screen bg-slate-900 text-white">
      {/* Left-side map */}
      <div className="fixed left-0 top-0 bottom-0 w-2/3 z-0">
        <DealMap />
      </div>

      {/* Right-side card feed */}
      <div className="absolute top-0 right-0 w-1/3 h-full overflow-y-auto bg-slate-950 p-4 shadow-lg z-10">
        <h2 className="text-lg font-semibold mb-4">CDE Deal Matching View</h2>
        <div className="space-y-4">
          {dealCards.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    </main>
  );
}
