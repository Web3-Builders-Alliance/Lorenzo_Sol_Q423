import bs58 from "bs58";

export function base58ToWallet(sk: string) {
  let convertedSk = bs58.decode(sk);
  return convertedSk;
}

export function walletToBase58(sk: number[]) {
  let convertedSk = bs58.encode(sk);
  return convertedSk;
}
