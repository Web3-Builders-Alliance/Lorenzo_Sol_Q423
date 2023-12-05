use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("z2Q9wm9JsYtyVdicqtPS2WeDjVaKNBgV83pNHiGmTdA");

#[program]
pub mod wba_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.vault_state.owner = ctx.accounts.owner.key();
        ctx.accounts.vault_state.auth_bump = ctx.bumps.vault_auth;
        ctx.accounts.vault_state.vault_bump = ctx.bumps.vault;
        ctx.accounts.vault_state.score = 0;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_context, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Vault::LEN
    )]
    pub vault_state: Account<'info, Vault>,

    #[account(
        seeds = [b"auth", vault_state.key().as_ref()],
        bump
    )]
    /// CHECK: no need to check this
    pub vault_auth: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault_auth.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        // constraint = vault_state.owner == owner.key()
        has_one = owner
    )]
    pub vault_state: Account<'info, Vault>,

    #[account(
        seeds = [b"auth", vault_state.key().as_ref()],
        bump
    )]
    /// CHECK: no need to check this
    pub vault_auth: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault_auth.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Vault {
    owner: Pubkey,
    auth_bump: u8,
    vault_bump: u8,
    score: u8,
}

impl Vault {
    const LEN: usize = 8 + 32 + 1 + 1 + 1;
}
