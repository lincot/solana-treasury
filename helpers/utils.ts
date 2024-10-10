import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export async function airdrop(
  connection: Connection,
  toPubkeys: PublicKey[],
  fromKeypair: Keypair,
): Promise<void> {
  const amount = 500_000_000;
  await connection.confirmTransaction({
    signature: await connection.requestAirdrop(
      fromKeypair.publicKey,
      amount * (toPubkeys.length + 1),
    ),
    ...(await connection.getLatestBlockhash()),
  });

  if (toPubkeys.length == 0) {
    return;
  }

  const tx = new Transaction();
  for (const toPubkey of toPubkeys) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        lamports: amount,
        toPubkey,
      }),
    );
  }
  await sendAndConfirmTransaction(connection, tx, [fromKeypair]);
}

export async function transfer(
  connection: Connection,
  from: Keypair,
  to: PublicKey,
  lamports: number,
): Promise<void> {
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports,
      }),
    ),
    [from],
  );
}

export async function transferEverything(
  connection: Connection,
  fromKeypairs: Keypair[],
  toKeypair: Keypair,
): Promise<void> {
  if (fromKeypairs.length == 0) {
    return;
  }

  const tx = new Transaction();
  for (const fromKeypair of fromKeypairs) {
    const lamports = await connection.getBalance(fromKeypair.publicKey);

    tx.add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        lamports,
        toPubkey: toKeypair.publicKey,
      }),
    );
  }

  tx.feePayer = toKeypair.publicKey;

  await sendAndConfirmTransaction(
    connection,
    tx,
    [toKeypair].concat(fromKeypairs),
  );
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
