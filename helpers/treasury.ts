import { IdlTypes, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, TransactionSignature } from "@solana/web3.js";
import { Treasury } from "../target/types/treasury";

export const TREASURY_PROGRAM: Program<Treasury> = anchor.workspace.Treasury;
export type TreasuryOwner = IdlTypes<Treasury>["treasuryOwner"];

export type CreateTreasuryInput = {
  treasury: Keypair;
  owners: TreasuryOwner[];
  authority: PublicKey;
  payer: Keypair;
};

export async function createTreasury(
  {
    treasury,
    owners,
    authority,
    payer,
  }: CreateTreasuryInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await TREASURY_PROGRAM.methods
    .createTreasury(owners, authority)
    .accounts({
      payer: payer.publicKey,
      treasury: treasury.publicKey,
    })
    .signers([treasury, payer])
    .rpc();
  return { transactionSignature };
}

export type DistributeInput = {
  treasury: PublicKey;
  owners: PublicKey[];
};

export async function distribute(
  {
    treasury,
    owners,
  }: DistributeInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await TREASURY_PROGRAM.methods
    .distribute()
    .accounts({
      treasury,
    })
    .remainingAccounts(owners.map((owner) => ({
      pubkey: owner,
      isSigner: false,
      isWritable: true,
    })))
    .rpc();
  return { transactionSignature };
}

export type SetTreasuryIsCloseableInput = {
  treasury: PublicKey;
  authority: Keypair;
};

export async function setTreasuryIsCloseable(
  {
    treasury,
    authority,
  }: SetTreasuryIsCloseableInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await TREASURY_PROGRAM.methods
    .setTreasuryIsCloseable()
    .accountsStrict({
      treasury,
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();
  return { transactionSignature };
}

export type CloseTreasuryInput = {
  treasury: PublicKey;
  payer: PublicKey;
};

export async function closeTreasury(
  {
    treasury,
    payer,
  }: CloseTreasuryInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await TREASURY_PROGRAM.methods
    .closeTreasury()
    .accountsStrict({
      treasury,
      payer,
    })
    .rpc();
  return { transactionSignature };
}
