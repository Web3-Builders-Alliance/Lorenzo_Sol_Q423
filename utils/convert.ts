import bs58 from "bs58";
// import promptSync from "prompt-sync";

export function base58ToWallet(sk: string) {
  // const prompt = promptSync();
  // let sk = prompt("Enter your b58 private key: ");
  let convertedSk = bs58.decode(sk);
  console.log(`[${convertedSk}]`);
}

export function walletToBase58(sk: string) {
  // const prompt = promptSync();
  // let sk = prompt("Enter your wallet private key: ");
  let skj = JSON.parse(sk);
  let convertedSk = bs58.encode(skj);
  console.log(convertedSk);
}
