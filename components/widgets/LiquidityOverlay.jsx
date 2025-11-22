export default function LiquidityOverlay({ market }) {
  if (!market) return null;

  const color =
    market.signal === 'overheated' ? 'bg-red-500' :
    market.signal === 'cold' ? 'bg-blue-500' :
    'bg-green-500';

  return (
    <div className="fixed bottom-4 left-4 p-3 rounded text-white shadow-lg flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <div className="text-sm">
        <div className="font-bold">Market: {market.signal}</div>
        <div className="text-xs">
          Regime: {market.state.regime} | Pressure: {market.state.pressure.toFixed(2)} | Velocity: {market.velocity.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
