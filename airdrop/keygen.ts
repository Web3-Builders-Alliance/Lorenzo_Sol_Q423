import { Keypair } from "@solana/web3.js";

//Generate a new keypair
const kp = Keypair.generate();

console.log(
  `You're generating a new Solana wallet: 
    ${kp.publicKey.toBase58()}
    
    To save your wallet, copy and paste the following into a JSON file:
    [${kp.secretKey}]
    `
);
