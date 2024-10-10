import { createTreasury, TREASURY_PROGRAM } from "../helpers/treasury";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { createEqualTreasuryOwners, setup, testDistribute } from "./utils";

describe("26 owners", () => {
  const { connection, payer } = setup();
  const treasuryAuthority = new Keypair();
  const treasury = new Keypair();
  const [_, owners] = createEqualTreasuryOwners(26);

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
    expect(treasuryAccount.owners.length).to.eql(26);
  });

  it("distribute", async () => {
    const amount = 209_999_999;
    const gcd = 16; // gcd of 384 and 384 + 10000 % 26
    const mod = 10000 / gcd;
    const rem = amount % mod;
    expect(rem).to.be.eql(624);
    await testDistribute(connection, payer, treasury.publicKey, owners, {
      amount,
      rem,
      acc: 0,
    });
  });
});

describe("27 owners", () => {
  const { connection: _connection, payer } = setup();
  const treasuryAuthority = new Keypair();
  const treasury = new Keypair();
  const [_, owners] = createEqualTreasuryOwners(27);

  it("createTreasury fails", async () => {
    await expect(createTreasury({
      treasury,
      owners,
      authority: treasuryAuthority.publicKey,
      payer,
    })).to.be.rejectedWith("Transaction too large");
  });
});
