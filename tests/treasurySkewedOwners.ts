import { createTreasury } from "../helpers/treasury";
import { Keypair } from "@solana/web3.js";
import { createTreasuryOwners, setup, testDistribute } from "./utils";
import { disperse, transferEverything } from "../helpers/utils";

describe("highly skewed owners", () => {
  const { connection, payer } = setup();
  const treasuryAuthority = new Keypair();
  const treasury = new Keypair();
  const [ownerKeypairs, owners] = createTreasuryOwners([
    9996,
    1,
    1,
    1,
    1,
  ]);

  before(async () => {
    await disperse(
      connection,
      ownerKeypairs.slice(1).map((owner) => owner.publicKey),
      payer,
      100_000_000,
    );
  });

  after(async () => {
    await transferEverything(connection, ownerKeypairs.slice(1), payer);
  });

  it("createTreasury", async () => {
    await createTreasury({
      treasury,
      owners,
      authority: treasuryAuthority.publicKey,
      payer,
    });
  });

  it("distribute", async () => {
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
        connection,
        payer,
        treasury.publicKey,
        owners,
        donation,
      );
    }
  });
});
