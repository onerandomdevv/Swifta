export function koboToNaira(kobo: bigint): string {
  const naira = Number(kobo) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(naira);
}

export function nairaToKobo(naira: number): bigint {
  return BigInt(Math.round(naira * 100));
}

export function formatKobo(kobo: bigint): string {
  return koboToNaira(kobo);
}
