use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct Treasury {
    pub is_closeable: bool,
    pub authority: Pubkey,
    pub payer: Pubkey,
    pub owners: Vec<TreasuryOwner>,
}

impl Treasury {
    pub fn space(owners_count: usize) -> usize {
        let space_is_closeable = 1;
        let space_authority = 32;
        let space_payer = 32;
        let space_owners = 4 + TreasuryOwner::space() * owners_count;
        space_is_closeable + space_authority + space_payer + space_owners
    }
}

impl Treasury {
    /// Calculates the amount that cannot be evenly distributed based on the
    /// owners' shares in basis points. In the worst-case scenario, it is
    /// equal to `balance % 10000`.
    pub fn get_remaining_balance(&self, balance: u64) -> u64 {
        let gcd_bps = self
            .owners
            .iter()
            .map(|owner| owner.share_bps)
            .reduce(num_integer::gcd)
            .unwrap_or(1);
        let reduced_divisor = 10000 / gcd_bps;
        balance % reduced_divisor as u64
    }
}

/// One of the treasury owners, recipient of a share of the treasury balance.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct TreasuryOwner {
    pub address: Pubkey,
    pub share_bps: u16,
}

impl TreasuryOwner {
    pub const fn space() -> usize {
        32 + 2
    }

    /// Calculates the owner's proportional share of a given amount.
    pub fn get_share(&self, amount: u64) -> u64 {
        ((amount as u128)
            .checked_mul(self.share_bps as u128)
            .unwrap()
            / 10_000) as u64
    }
}
