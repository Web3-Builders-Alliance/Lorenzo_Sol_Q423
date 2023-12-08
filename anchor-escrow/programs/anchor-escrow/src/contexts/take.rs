use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, transfer, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    pub maker: SystemAccount<'info>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(
    init_if_needed,
    payer = taker,
    associated_token::mint = mint_a,
    associated_token::authority = taker
  )]
    pub taker_ata_a: Account<'info, TokenAccount>,
    #[account(
    mut,
    associated_token::mint = mint_b,
    associated_token::authority = taker
  )]
    pub taker_ata_b: Account<'info, TokenAccount>,
    #[account(
    init_if_needed,
    payer = taker,
    associated_token::mint = mint_b,
    associated_token::authority = maker
  )]
    pub maker_ata_b: Account<'info, TokenAccount>,
    #[account(
      mut,
      seeds = [b"signer", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
      has_one = mint_a,
      has_one = mint_b,
      bump = escrow.bump
  )]
    pub escrow: Account<'info, Escrow>,
    #[account(
      mut,
      associated_token::mint = mint_a,
      associated_token::authority = escrow
  )]
    pub vault: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Take<'info> {
    pub fn deposit(&mut self) -> Result<()> {
        let transfer_accounts = Transfer {
            from: self.taker_ata_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            authority: self.taker.to_account_info(),
        };

        let cpi_context = CpiContext::new(self.token_program.to_account_info(), transfer_accounts);

        transfer(cpi_context, self.escrow.receive)
    }

    pub fn withdraw(&mut self) -> Result<()> {
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"signer",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let transfer_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_accounts,
            &signer_seeds,
        );

        transfer(cpi_context, self.escrow.receive)
    }

    pub fn close(&mut self) -> Result<()> {
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"signer",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_accounts,
            &signer_seeds,
        );

        close_account(cpi_context)
    }
}
