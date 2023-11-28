import {
  Address,
  AnchorProvider,
  Program,
  Wallet,
} from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import wallet from "../wba-wallet.json";
import { IDL, Week1 } from "./programs/week1";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment: "confirmed",
});

// Create our program
const program = new Program<Week1>(
  IDL,
  "ctf1VWeMtgxa24zZevsXqDg6xvcMVy4FbP3cxLCpGha" as Address,
  provider
);

// Create the PDA for our CTF-Week1 profile
const profilePda = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), keypair.publicKey.toBuffer()],
  program.programId
)[0];

(async () => {
  try {
    const txhash = await program.methods
      .completeCtf()
      .accounts({
        profile: profilePda,
        owner: keypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
