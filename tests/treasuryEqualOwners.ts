import {
  closeTreasury,
  createTreasury,
  distribute,
  setTreasuryIsCloseable,
  TREASURY_PROGRAM,
} from "../helpers/treasury";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { createEqualTreasuryOwners, setup, testDistribute } from "./utils";
import { transfer } from "../helpers/utils";

describe("4 equal owners", () => {
  const { connection, payer } = setup();
  const treasuryAuthority = new Keypair();
  const treasury = new Keypair();
  const [_, owners] = createEqualTreasuryOwners(4);

  it("createTreasury (errors)", async () => {
    const wrongOwners = owners.map((x) => ({ ...x }));
    wrongOwners[0].shareBps = 1;

    await expect(
      createTreasury({
        treasury,
        owners: wrongOwners,
        authority: treasuryAuthority.publicKey,
        payer,
      }),
    ).to.be.rejectedWith("InvalidBpsTotal");

    wrongOwners[0].shareBps = 10000;

    await expect(
      createTreasury({
        treasury,
        owners: wrongOwners,
        authority: treasuryAuthority.publicKey,
        payer,
      }),
    ).to.be.rejectedWith("InvalidBpsTotal");
  });

  it("createTreasury", async () => {
    await createTreasury({
      treasury,
      owners,
      authority: treasuryAuthority.publicKey,
      payer,
    });

    const treasuryAccount = await TREASURY_PROGRAM.account.treasury.fetch(
      treasury.publicKey,
    );
    expect(treasuryAccount.isCloseable).to.eql(false);
    expect(treasuryAccount.authority).to.eql(treasuryAuthority.publicKey);
    expect(treasuryAccount.payer).to.eql(payer.publicKey);
    expect(treasuryAccount.owners).to.eql(owners);
  });

  it("distribute (errors)", async () => {
    await expect(
      distribute({
        treasury: treasury.publicKey,
        owners: owners.slice(2).map((owner) => owner.address),
      }),
    ).to.be.rejectedWith("InvalidOwnersCount");

    await expect(
      distribute({
        treasury: treasury.publicKey,
        owners: owners.map((owner) => owner.address).concat([
          new Keypair().publicKey,
        ]),
      }),
    ).to.be.rejectedWith("InvalidOwnersCount");

    const wrongOwners = owners.map((owner) => owner.address);
    wrongOwners[0] = new Keypair().publicKey;

    await expect(
      distribute({
        treasury: treasury.publicKey,
        owners: wrongOwners,
      }),
    ).to.be.rejectedWith("OwnerNotFound");

    const wrongOwners2 = owners.map((owner) => owner.address);
    wrongOwners2[0] = wrongOwners2[wrongOwners2.length - 1];

    await expect(
      distribute({
        treasury: treasury.publicKey,
        owners: wrongOwners2,
      }),
    ).to.be.rejectedWith("DuplicateOwner");
  });

  it("distribute", async () => {
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
        connection,
        payer,
        treasury.publicKey,
        owners,
        donation,
      );
    }
  });

  it("closeTreasury (errors)", async () => {
    await expect(
      closeTreasury({
        treasury: treasury.publicKey,
        payer: payer.publicKey,
      }),
    ).to.be.rejectedWith("TreasuryIsNotCloseable");
  });

  it("setTreasuryIsCloseable", async () => {
    await setTreasuryIsCloseable({
      treasury: treasury.publicKey,
      authority: treasuryAuthority,
    });

    const treasuryAccount = await TREASURY_PROGRAM.account.treasury.fetch(
      treasury.publicKey,
    );
    expect(treasuryAccount.isCloseable).to.eql(true);
  });

  it("closeTreasury (errors)", async () => {
    await transfer(
      connection,
      payer,
      treasury.publicKey,
      20_000,
    );

    await expect(
      closeTreasury({
        treasury: treasury.publicKey,
        payer: payer.publicKey,
      }),
    ).to.be.rejectedWith("TreasuryIsNotEmpty");
  });

  it("closeTreasury", async () => {
    await distribute({
      treasury: treasury.publicKey,
      owners: owners.map((owner) => owner.address),
    });

    await closeTreasury({
      treasury: treasury.publicKey,
      payer: payer.publicKey,
    });

    expect(
      await connection.getAccountInfo(
        treasury.publicKey,
      ),
    ).to.eql(null);
  });
});
