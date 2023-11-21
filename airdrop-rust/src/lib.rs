mod programs;

#[cfg(test)]
mod tests {
    use crate::programs::wba_prereq::{CompleteArgs, WbaPrereqProgram};
    use solana_client::rpc_client::RpcClient;
    use solana_program::message::Message;
    use solana_program::system_instruction::transfer;
    use solana_sdk::pubkey::Pubkey;
    use solana_sdk::{
        signature::{read_keypair_file, Keypair, Signer},
        system_program,
        transaction::Transaction,
    };
    use std::str::FromStr;

    const RPC_URL: &str = "https://api.devnet.solana.com";

    #[test]
    fn keygen() {
        let kp = Keypair::new();
        println!(
            "You've generate a new Solana wallet {}",
            kp.pubkey().to_string()
        );
        println!("To save your wallet, copy and paste the following into a JSON file:");
        println!("{:?}", kp.to_bytes());
    }

    #[test]
    fn airdrop() {
        // Import our keypair
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");
        // Connected to Solana Devnet RPC Client
        let client = RpcClient::new(RPC_URL);

        match client.request_airdrop(&keypair.pubkey(), 2_000_000_000u64) {
            Ok(s) => {
                println!("Success! Check out your TX here:");
                println!(
                    "https://explorer.solana.com/tx/{}?cluster=devnet",
                    s.to_string()
                );
            }
            Err(e) => println!("Oops, something went wrong: {}", e.to_string()),
        };
    }

    #[test]
    fn transfer_sol() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");
        let to_pubkey = Pubkey::from_str("8iv48dSbx1YNvJ1UfcrLnYcgPiM2uPQoGtS2aJ3qt3My").unwrap();
        let client = RpcClient::new(RPC_URL);
        let recent_blockhash = client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");
        let balance = client
            .get_balance(&keypair.pubkey())
            .expect("Failed to load balance");
        let msg = Message::new_with_blockhash(
            &[transfer(&keypair.pubkey(), &to_pubkey, balance)],
            Some(&keypair.pubkey()),
            &recent_blockhash,
        );
        let fee = client.get_fee_for_message(&msg).expect("Failed to get fee");
        let transaction = Transaction::new_signed_with_payer(
            &[transfer(&keypair.pubkey(), &to_pubkey, balance - fee)],
            Some(&keypair.pubkey()),
            &vec![&keypair],
            recent_blockhash,
        );
        let signature = client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");

        println!(
            "Success! Check out your TX here:
                https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }

    #[test]
    fn complete() {
        let rpc_client = RpcClient::new(RPC_URL);
        let signer = read_keypair_file("wba-wallet.json").expect("Couldn't find wallet file");
        let prereq = WbaPrereqProgram::derive_program_address(&[
            b"prereq",
            signer.pubkey().to_bytes().as_ref(),
        ]);
        let args = CompleteArgs {
            github: b"arion125".to_vec(),
        };
        let blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");
        let transaction = WbaPrereqProgram::complete(
            &[&signer.pubkey(), &prereq, &system_program::id()],
            &args,
            Some(&signer.pubkey()),
            &[&signer],
            blockhash,
        );
        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");
        // Print our transaction out
        println!(
            "Success! Check out your TX here: https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }
}
