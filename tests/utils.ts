import * as anchor from "@coral-xyz/anchor";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { distribute, TreasuryOwner } from "../helpers/treasury";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { transfer } from "../helpers/utils";

export function setup(): { connection: Connection; payer: Keypair } {
  chai.use(chaiAsPromised);
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;
  return { connection, payer };
}

export type Donation = { amount: number; rem: number; acc: number };

export async function testDistribute(
  connection: Connection,
  payer: Keypair,
  treasury: PublicKey,
  treasuryOwners: TreasuryOwner[],
  donation: Donation,
) {
  const amount = donation.amount;
  const distributedAmount = amount + donation.acc - donation.rem;

  await transfer(
    connection,
    payer,
    treasury,
    amount,
  );

  const balancesBefore = await Promise.all(
    treasuryOwners.map((owner) => connection.getBalance(owner.address)),
  );
  const treasuryBalanceBefore = await connection.getBalance(
    treasury,
  );

  await distribute({
    treasury,
    owners: treasuryOwners.map((owner) => owner.address),
  });

  const balancesAfter = await Promise.all(
    treasuryOwners.map((owner) => connection.getBalance(owner.address)),
  );
  const treasuryBalanceAfter = await connection.getBalance(
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

export function createTreasuryOwners(
  shares: number[],
): [Keypair[], TreasuryOwner[]] {
  const ownerKeypairs = Array.from(
    { length: shares.length },
    () => new Keypair(),
  );
  const owners = shares.map((share, i) => ({
    address: ownerKeypairs[i].publicKey,
    shareBps: share,
  }));
  return [ownerKeypairs, owners];
}

export function createEqualTreasuryOwners(
  numOwners: number,
): [Keypair[], TreasuryOwner[]] {
  const shares = Array(numOwners).fill(Math.floor(10000 / numOwners));
  shares[0] += 10000 % numOwners;
  return createTreasuryOwners(shares);
}
