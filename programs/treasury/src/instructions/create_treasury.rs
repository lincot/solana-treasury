use crate::{error::*, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
// the first argument is a vector, so its length is encoded as a `u16`,
// no need to parse the entire vec
#[instruction(owners_len: u16)]
pub struct CreateTreasury<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + Treasury::space(owners_len as _),
    )]
    treasury: Account<'info, Treasury>,
    system_program: Program<'info, System>,
}

pub fn create_treasury(
    ctx: Context<CreateTreasury>,
    owners: Vec<TreasuryOwner>,
    authority: Pubkey,
) -> Result<()> {
    let mut bps_sum = 0u16;
    for owner in &owners {
        bps_sum = bps_sum
            .checked_add(owner.share_bps)
            .ok_or(TreasuryError::InvalidBpsTotal)?;
    }
    if bps_sum != 10_000 {
        return err!(TreasuryError::InvalidBpsTotal);
    }

    let treasury = &mut ctx.accounts.treasury;
    treasury.is_closeable = false;
    treasury.authority = authority;
    treasury.payer = ctx.accounts.payer.key();
    treasury.owners = owners;

    Ok(())
}
