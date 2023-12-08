import { createMint } from "@solana/spl-token";
import { Commitment, Connection, Keypair } from "@solana/web3.js";
import wallet from "../wba-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  commitment
);

(async () => {
  try {
    // Token Mint Account
    const mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      0
    );
    console.log(mint.toBase58());
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
