import * as chai from "chai";
import { Context } from "./ctx";
import {
  closeTreasury,
  createTreasury,
  distribute,
  setTreasuryIsCloseable,
  TREASURY_PROGRAM,
  TreasuryOwner,
} from "../helpers/treasury";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { transfer } from "../helpers/utils";

chai.use(chaiAsPromised);

const ctx = new Context();
before(async () => await ctx.airdrop());
after(async () => await ctx.refund());

describe("treasury", () => {
  it("createTreasury (errors)", async () => {
    const wrongOwners = ctx.treasury1Owners.map((x) => ({ ...x }));
    wrongOwners[0].shareBps = 1;

    await expect(
      createTreasury({
        treasury: ctx.treasury1,
        owners: wrongOwners,
        authority: ctx.treasuryAuthority.publicKey,
        payer: ctx.payer,
      }),
    ).to.be.rejectedWith("InvalidBpsTotal");

    wrongOwners[0].shareBps = 10000;

    await expect(
      createTreasury({
        treasury: ctx.treasury1,
        owners: wrongOwners,
        authority: ctx.treasuryAuthority.publicKey,
        payer: ctx.payer,
      }),
    ).to.be.rejectedWith("InvalidBpsTotal");
  });

  it("createTreasury", async () => {
    await createTreasury({
      treasury: ctx.treasury1,
      owners: ctx.treasury1Owners,
      authority: ctx.treasuryAuthority.publicKey,
      payer: ctx.payer,
    });

    const treasury = await TREASURY_PROGRAM.account.treasury.fetch(
      ctx.treasury1.publicKey,
    );
    expect(treasury.isCloseable).to.eql(false);
    expect(treasury.authority).to.eql(ctx.treasuryAuthority.publicKey);
    expect(treasury.payer).to.eql(ctx.payer.publicKey);
    expect(treasury.owners).to.eql(ctx.treasury1Owners);

    await createTreasury({
      treasury: ctx.treasury2,
      owners: ctx.treasury2Owners,
      authority: ctx.treasuryAuthority.publicKey,
      payer: ctx.payer,
    });
  });

  it("createTreasury (26 owners)", async () => {
    await createTreasury({
      treasury: ctx.treasury3,
      owners: ctx.treasury3Owners,
      authority: ctx.treasuryAuthority.publicKey,
      payer: ctx.payer,
    });

    const treasury = await TREASURY_PROGRAM.account.treasury.fetch(
      ctx.treasury3.publicKey,
    );
    expect(treasury.owners.length).to.eql(26);
  });

  it("createTreasury (27 owners fails)", async () => {
    await expect(createTreasury({
      treasury: ctx.treasury4,
      owners: ctx.treasury4Owners,
      authority: ctx.treasuryAuthority.publicKey,
      payer: ctx.payer,
    })).to.be.rejectedWith("Transaction too large");
  });

  it("distribute (errors)", async () => {
    await expect(
      distribute({
        treasury: ctx.treasury1.publicKey,
        owners: ctx.treasury1Owners.slice(2).map((owner) => owner.address),
      }),
    ).to.be.rejectedWith("InvalidOwnersCount");

    await expect(
      distribute({
        treasury: ctx.treasury1.publicKey,
        owners: ctx.treasury1Owners.map((owner) => owner.address).concat([
          ctx.hacker.publicKey,
        ]),
      }),
    ).to.be.rejectedWith("InvalidOwnersCount");

    const wrongOwners = ctx.treasury1Owners.map((owner) => owner.address);
    wrongOwners[0] = ctx.hacker.publicKey;

    await expect(
      distribute({
        treasury: ctx.treasury1.publicKey,
        owners: wrongOwners,
      }),
    ).to.be.rejectedWith("OwnerNotFound");

    const wrongOwners2 = ctx.treasury1Owners.map((owner) => owner.address);
    wrongOwners2[0] = wrongOwners2[wrongOwners2.length - 1];

    await expect(
      distribute({
        treasury: ctx.treasury1.publicKey,
        owners: wrongOwners2,
      }),
    ).to.be.rejectedWith("DuplicateOwner");
  });

  it("distribute (four equal owners)", async () => {
    for (
      const donation of [
        { amount: 20_000_000, rem: 0, acc: 0 },
        { amount: 20_000_001, rem: 1, acc: 0 },
        { amount: 19_999_999, rem: 0, acc: 1 },
        { amount: 19_789_382, rem: 2, acc: 0 },
        { amount: 19_789_382, rem: 0, acc: 2 },
      ]
    ) {
      await testDistribute(
        ctx.treasury1.publicKey,
        ctx.treasury1Owners,
        donation,
      );
    }
  });

  it("distribute (highly skewed owners)", async () => {
    for (
      const donation of [
        { amount: 20_000_000, rem: 0, acc: 0 },
        { amount: 20_000_001, rem: 1, acc: 0 },
        { amount: 19_999_999, rem: 0, acc: 1 },
        { amount: 19_789_382, rem: 9382, acc: 0 },
        { amount: 19_780_618, rem: 0, acc: 9382 },
        { amount: 19_999_000, rem: 9000, acc: 0 },
        { amount: 19_990_900, rem: 900, acc: 0 },
      ]
    ) {
      await testDistribute(
        ctx.treasury2.publicKey,
        ctx.treasury2Owners,
        donation,
      );
    }
  });

  it("distribute (26 owners)", async () => {
    const amount = 209_999_999;
    const gcd = 16; // gcd of 384 and 384 + 10000 % 26
    const mod = 10000 / gcd;
    const rem = amount % mod;
    expect(rem).to.be.eql(624);
    await testDistribute(ctx.treasury3.publicKey, ctx.treasury3Owners, {
      amount,
      rem,
      acc: 0,
    });
  });

  it("closeTreasury (errors)", async () => {
    await expect(
      closeTreasury({
        treasury: ctx.treasury1.publicKey,
        payer: ctx.payer.publicKey,
      }),
    ).to.be.rejectedWith("TreasuryIsNotCloseable");
  });

  it("setTreasuryIsCloseable", async () => {
    await setTreasuryIsCloseable({
      treasury: ctx.treasury1.publicKey,
      authority: ctx.treasuryAuthority,
    });

    const treasury = await TREASURY_PROGRAM.account.treasury.fetch(
      ctx.treasury1.publicKey,
    );
    expect(treasury.isCloseable).to.eql(true);
  });

  it("closeTreasury (errors)", async () => {
    await transfer(
      ctx.provider.connection,
      ctx.payer,
      ctx.treasury1.publicKey,
      20_000,
    );

    await expect(
      closeTreasury({
        treasury: ctx.treasury1.publicKey,
        payer: ctx.payer.publicKey,
      }),
    ).to.be.rejectedWith("TreasuryIsNotEmpty");
  });

  it("closeTreasury", async () => {
    await distribute({
      treasury: ctx.treasury1.publicKey,
      owners: ctx.treasury1Owners.map((owner) => owner.address),
    });

    await closeTreasury({
      treasury: ctx.treasury1.publicKey,
      payer: ctx.payer.publicKey,
    });

    expect(
      await ctx.provider.connection.getAccountInfo(
        ctx.treasury1.publicKey,
      ),
    ).to.eql(null);
  });
});

type Donation = { amount: number; rem: number; acc: number };

async function testDistribute(
  treasury: PublicKey,
  treasuryOwners: TreasuryOwner[],
  donation: Donation,
) {
  const amount = donation.amount;
  const distributedAmount = amount + donation.acc - donation.rem;

  await transfer(
    ctx.provider.connection,
    ctx.payer,
    treasury,
    amount,
  );

  const balancesBefore = await Promise.all(
    treasuryOwners.map((owner) =>
      ctx.provider.connection.getBalance(owner.address)
    ),
  );
  const treasuryBalanceBefore = await ctx.provider.connection.getBalance(
    treasury,
  );

  await distribute({
    treasury,
    owners: treasuryOwners.map((owner) => owner.address),
  });

  const balancesAfter = await Promise.all(
    treasuryOwners.map((owner) =>
      ctx.provider.connection.getBalance(owner.address)
    ),
  );
  const treasuryBalanceAfter = await ctx.provider.connection.getBalance(
    treasury,
  );

  expect(treasuryBalanceBefore - treasuryBalanceAfter).to.eql(
    distributedAmount,
  );
  for (let i = 0; i < treasuryOwners.length; i++) {
    expect(balancesAfter[i] - balancesBefore[i]).to.eql(
      Math.floor(
        distributedAmount * treasuryOwners[i].shareBps / 10000,
      ),
    );
  }
}
