use anchor_lang::prelude::*;

pub mod contexts;
use contexts::*;

pub mod state;
use state::*;

declare_id!("DLzPsjVZKtPCBySmdVibvquTAxFaggu8VRJHserH4BQP");

#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, receive: u64) -> Result<()> {
        ctx.accounts.deposit(seed, receive, &ctx.bumps)
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit()?;
        ctx.accounts.withdraw()?;
        ctx.accounts.close()
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.withdraw()?;
        ctx.accounts.close()
    }
}
