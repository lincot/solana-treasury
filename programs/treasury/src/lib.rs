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

    /// Initializes a new treasury with the provided owners and authority.
    ///
    /// # Arguments
    /// * `owners` - The vector of treasury owners defining the distribution shares.
    /// * `authority` - The authority public key for managing the treasury.
    pub fn create_treasury(
        ctx: Context<CreateTreasury>,
        owners: Vec<TreasuryOwner>,
        authority: Pubkey,
    ) -> Result<()> {
        instructions::create_treasury(ctx, owners, authority)
    }

    /// Distributes the treasury funds according to the owner shares.
    /// The accounts of owners must be supplied in the `remaining_accounts`.
    pub fn distribute(ctx: Context<Distribute>) -> Result<()> {
        instructions::distribute(ctx)
    }

    /// Marks the treasury as closeable, allowing it to be closed later.
    pub fn set_treasury_is_closeable(ctx: Context<SetTreasuryIsCloseable>) -> Result<()> {
        instructions::set_treasury_is_closeable(ctx)
    }

    /// Closes the treasury, transferring remaining funds back to the payer.
    /// For this to succeed, the treasury must be marked closeable and all the
    /// funds must be distributed.
    pub fn close_treasury(ctx: Context<CloseTreasury>) -> Result<()> {
        instructions::close_treasury(ctx)
    }
}
