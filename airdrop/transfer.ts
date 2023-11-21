import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const from = Keypair.fromSecretKey(new Uint8Array(wallet));
const to = new PublicKey("8iv48dSbx1YNvJ1UfcrLnYcgPiM2uPQoGtS2aJ3qt3My");
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    // Get Account SOL Balance
    const balance = await connection.getBalance(from.publicKey);

    // Get Latest Blockhash
    const latestBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Fake instructions to calc tx fee
    const instructionsFee = [
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance,
      }),
    ];

    // Fake tx message to calc tx fee
    const txMsgFee = new TransactionMessage({
      payerKey: from.publicKey,
      instructions: instructionsFee,
      recentBlockhash: latestBlockhash,
    }).compileToV0Message();

    // Fee for the transaction
    const fee = (await connection.getFeeForMessage(txMsgFee)).value;

    if (!fee) throw new Error("Fee not available");

    // Real instructions
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance - fee,
      }),
    ];

    // Real tx message
    const txMsg = new TransactionMessage({
      payerKey: from.publicKey,
      instructions: instructions,
      recentBlockhash: latestBlockhash,
    }).compileToV0Message();

    // Real tx
    const tx = new VersionedTransaction(txMsg);
    tx.sign([from]);

    const txhash = await connection.sendTransaction(tx);

    console.log(`Success! Check out your TX here:
    https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
