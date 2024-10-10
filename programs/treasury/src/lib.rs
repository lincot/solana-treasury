use crate::{instructions::*, state::*};
use anchor_lang::prelude::*;

pub mod error;
mod instructions;
pub mod state;
// mod utils;

declare_id!("trEAyqsPxpWpuvWYMJ5pFxxH8c8zcSZjRftuc4UY811");

#[program]
pub mod treasury {
    use super::*;

    pub fn create_treasury(
        ctx: Context<CreateTreasury>,
        owners: Vec<TreasuryOwner>,
        authority: Pubkey,
    ) -> Result<()> {
        instructions::create_treasury(ctx, owners, authority)
    }

    pub fn distribute(ctx: Context<Distribute>) -> Result<()> {
        instructions::distribute(ctx)
    }

    pub fn set_treasury_is_closeable(ctx: Context<SetTreasuryIsCloseable>) -> Result<()> {
        instructions::set_treasury_is_closeable(ctx)
    }

    pub fn close_treasury(ctx: Context<CloseTreasury>) -> Result<()> {
        instructions::close_treasury(ctx)
    }
}
