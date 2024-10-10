use crate::{error::*, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseTreasury<'info> {
    /// CHECK: it's checked to be the treasury payer
    payer: AccountInfo<'info>,
    #[account(mut, has_one = payer, close = payer)]
    treasury: Account<'info, Treasury>,
}

pub fn close_treasury(ctx: Context<CloseTreasury>) -> Result<()> {
    let treasury = &ctx.accounts.treasury;
    require!(treasury.is_closeable, TreasuryError::TreasuryIsNotCloseable);
    let treasury_rent =
        Rent::get()?.minimum_balance(AsRef::<AccountInfo>::as_ref(treasury).data_len());
    let total_treasury_balance = treasury.get_lamports() - treasury_rent;
    let remaining_balance = treasury.get_remaining_balance(total_treasury_balance);
    require!(
        total_treasury_balance == remaining_balance,
        TreasuryError::TreasuryIsNotEmpty,
    );
    Ok(())
}
