import {
  Address,
  AnchorProvider,
  Program,
  Wallet,
  web3,
} from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { IDL, WbaPrereq } from "./programs/wba_prereq";
import wallet from "./wba-wallet.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection(web3.clusterApiUrl("devnet"));
const github = Buffer.from("arion125", "utf8");

// AnchorProvider and Program setup
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment: "confirmed",
});
const programId = "HC2oqz2p6DEWfrahenqdq2moUcga9c9biqRBcdK3XKU1" as Address;
const program = new Program<WbaPrereq>(IDL, programId, provider);

// Get PDA from seed
const seeds = [Buffer.from("prereq", "utf-8"), keypair.publicKey.toBuffer()];
const [pda, _bump] = PublicKey.findProgramAddressSync(seeds, program.programId);

(async () => {
  try {
    const txhash = await program.methods
      .complete(github)
      .accounts({
        signer: keypair.publicKey,
        prereq: pda,
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
