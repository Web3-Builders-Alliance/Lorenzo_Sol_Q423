import {
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createBundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import wallet from "../wba-wallet.json";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");
const bundlrUploader = createBundlrUploader(umi);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

(async () => {
  try {
    // Follow this JSON structure
    // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure
    const image =
      "https://arweave.net/zAsSPUX26oxC5atpzjdxdzWnyelupobb4HdHf1vS-tQ";
    const metadata = {
      name: "Generug#1",
      symbol: "GENRU",
      description: "An extremely rare rug",
      image,
      attributes: [{ trait_type: "Background", value: "Green" }],
      properties: {
        files: [
          {
            type: "image/png",
            uri: "https://arweave.net/zAsSPUX26oxC5atpzjdxdzWnyelupobb4HdHf1vS-tQ",
          },
        ],
      },
      creators: [
        {
          address: keypair.publicKey,
          share: 100,
        },
      ],
    };
    const myUri = await bundlrUploader.uploadJson(metadata);
    console.log("Your metadata URI: ", myUri);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
