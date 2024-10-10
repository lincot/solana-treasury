use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetTreasuryIsCloseable<'info> {
    authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    treasury: Account<'info, Treasury>,
}

pub fn set_treasury_is_closeable(ctx: Context<SetTreasuryIsCloseable>) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    treasury.is_closeable = true;
    Ok(())
}
