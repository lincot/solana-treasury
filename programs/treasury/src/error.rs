use anchor_lang::prelude::*;

#[error_code]
pub enum TreasuryError {
    /// 6000 0x1770
    #[msg("The sum of all basis points (bps) must equal 10000")]
    InvalidBpsTotal,

    /// 6001 0x1771
    #[msg("The specified account is not listed as an owner in the treasury")]
    OwnerNotFound,

    /// 6002 0x1772
    #[msg("An owner has been provided more than once")]
    DuplicateOwner,

    /// 6003 0x1773
    #[msg("The number of owners provided does not match the expected count")]
    InvalidOwnersCount,

    /// 6004 0x1774
    #[msg("The treasury is not marked closeable")]
    TreasuryIsNotCloseable,

    /// 6005 0x1775
    #[msg("The treasury is not empty")]
    TreasuryIsNotEmpty,
}
