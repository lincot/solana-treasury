use crate::{error::*, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Distribute<'info> {
    #[account(mut)]
    treasury: Account<'info, Treasury>,
}

pub fn distribute(ctx: Context<Distribute>) -> Result<()> {
    let treasury = &ctx.accounts.treasury;

    require!(
        ctx.remaining_accounts.len() == treasury.owners.len(),
        TreasuryError::InvalidOwnersCount,
    );

    let treasury_rent =
        Rent::get()?.minimum_balance(AsRef::<AccountInfo>::as_ref(treasury).data_len());
    let total_treasury_balance = treasury.get_lamports() - treasury_rent;
    let remaining_balance = treasury.get_remaining_balance(total_treasury_balance);
    let treasury_balance = total_treasury_balance - remaining_balance;
    **AsRef::<AccountInfo>::as_ref(treasury).try_borrow_mut_lamports()? =
        treasury_rent + remaining_balance;

    let mut paid_owners = vec![false; treasury.owners.len()];

    for account in ctx.remaining_accounts {
        let (owner, is_paid) = treasury
            .owners
            .iter()
            .zip(&mut paid_owners)
            .find(|(owner, _)| owner.address == account.key())
            .ok_or(TreasuryError::OwnerNotFound)?;
        if *is_paid {
            return Err(TreasuryError::DuplicateOwner.into());
        }
        *is_paid = true;

        let lamports = owner.get_share(treasury_balance);
        account.add_lamports(lamports)?;
    }

    Ok(())
}
