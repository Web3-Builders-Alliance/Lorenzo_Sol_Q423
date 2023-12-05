import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { createHash } from "crypto";
import { AnchorVoteSolb } from "../target/types/anchor_vote_solb";

describe("anchor-vote-solb", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();

  const program = anchor.workspace.AnchorVoteSolb as Program<AnchorVoteSolb>;

  const signer = anchor.web3.Keypair.generate();

  const site = "google.com";

  const hash = createHash("sha256");
  hash.update(Buffer.from(site));

  let seeds = [hash.digest()];

  const vote = anchor.web3.PublicKey.findProgramAddressSync(
    seeds,
    program.programId
  )[0];

  it("Initialize", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize("google.com")
      .accounts({ signer: signer.publicKey, vote })
      .signers([signer])
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
