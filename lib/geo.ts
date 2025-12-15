export async function resolveCensusTract(address: string) {
  const res = await fetch(
    `/api/geo/resolve-tract?address=${encodeURIComponent(address)}`
  );

  if (!res.ok) {
    throw new Error("Unable to resolve census tract");
  }

  return res.json() as Promise<{ tract_id: string }>;
}
