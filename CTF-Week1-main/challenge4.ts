import { createBundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import {
  Address,
  AnchorProvider,
  Program,
  Wallet,
} from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { IDL, Week1 } from "./programs/week1";

import {
  createFungible,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createGenericFile,
  createSignerFromKeypair,
  percentAmount,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { readFile } from "fs/promises";
import wallet from "../wba-wallet.json";

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

// Use the PDA for our CTF-Week1 profile
const profilePda = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), keypair.publicKey.toBuffer()],
  program.programId
)[0];

// Paste here the mint address for challenge1 token
const mint = new PublicKey("hxNccNVP8WJn92ABMhuB4bLXbXqy7YgpJCQ6UCftABw");

// Create the PDA for the Challenge1 Vault
const vault = PublicKey.findProgramAddressSync(
  [Buffer.from("vault4"), keypair.publicKey.toBuffer(), mint.toBuffer()],
  program.programId
)[0];

const metadata_program = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Create PDA for token metadata
const metadata_seeds = [
  Buffer.from("metadata"),
  metadata_program.toBuffer(),
  mint.toBuffer(),
];
const metadata = PublicKey.findProgramAddressSync(
  metadata_seeds,
  metadata_program
)[0];

const umi = createUmi(connection).use(mplTokenMetadata());
const umiKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signerKeypair = createSignerFromKeypair(umi, umiKeypair);
umi.use(signerIdentity(signerKeypair));

const uploadMetadata = async () => {
  const bundlrUploader = createBundlrUploader(umi);
  const content = await readFile("./images/wba.jpg");
  const image = createGenericFile(content, "wba.jpg");
  const [imageUri] = await bundlrUploader.upload([image]);

  const metadata = {
    name: "WBA",
    symbol: "WBA",
    description: "WBA Token",
    image: imageUri,
  };

  const metadataUri = await bundlrUploader.uploadJson(metadata);

  return metadataUri;
};

(async () => {
  const metadataUri = await uploadMetadata();
  const metadataTx = await createFungible(umi, {
    mint: publicKey(mint),
    name: "WBA",
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(5),
  }).sendAndConfirm(umi);

  // NB if you get TokenAccountNotFoundError, wait a few seconds and try again!
  // Create the ATA for your Wallet
  const ownerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    mint,
    keypair.publicKey,
    true,
    "confirmed"
  );

  // Mint some tokens!
  const mintTx = await mintTo(
    connection,
    keypair,
    mint,
    ownerAta.address,
    keypair.publicKey,
    10_000_000
  );

  // Complete the Challenge!
  const completeTx = await program.methods
    .completeChallenge4()
    .accounts({
      owner: keypair.publicKey,
      ata: ownerAta.address,
      profile: profilePda,
      vault,
      metadata,
      mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      metadataProgram: metadata_program,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();

  console.log(`Success! Check out your TX here:
  https://explorer.solana.com/tx/${completeTx}?cluster=devnet`);
})();
