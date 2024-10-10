import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair } from "@solana/web3.js";
import { airdrop, transferEverything } from "../helpers/utils";
import { TreasuryOwner } from "../helpers/treasury";

export class Context {
  provider: AnchorProvider;
  payer: Keypair;

  airdropKeypairs: Keypair[];
  fromKeypairs: Keypair[];

  hacker: Keypair = new Keypair();

  treasuryAuthority: Keypair = new Keypair();

  treasury1: Keypair = new Keypair();
  treasury1OwnerKeypairs: Keypair[];
  treasury1Owners: TreasuryOwner[];

  treasury2: Keypair = new Keypair();
  treasury2OwnerKeypairs: Keypair[];
  treasury2Owners: TreasuryOwner[];

  treasury3: Keypair = new Keypair();
  treasury3OwnerKeypairs: Keypair[];
  treasury3Owners: TreasuryOwner[];

  treasury4: Keypair = new Keypair();
  treasury4OwnerKeypairs: Keypair[];
  treasury4Owners: TreasuryOwner[];

  constructor() {
    this.provider = anchor.AnchorProvider.env();
    anchor.setProvider(this.provider);
    this.payer = (this.provider.wallet as NodeWallet).payer;

    this.treasury1OwnerKeypairs = Array.from(
      { length: 4 },
      () => new Keypair(),
    );
    this.treasury1Owners = [2500, 2500, 2500, 2500].map((share, i) => ({
      address: this.treasury1OwnerKeypairs[i].publicKey,
      shareBps: share,
    }));

    this.treasury2OwnerKeypairs = Array.from(
      { length: 5 },
      () => new Keypair(),
    );
    this.treasury2Owners = [9996, 1, 1, 1, 1].map((share, i) => ({
      address: this.treasury2OwnerKeypairs[i].publicKey,
      shareBps: share,
    }));

    this.treasury3OwnerKeypairs = Array.from(
      { length: 26 },
      () => new Keypair(),
    );
    this.treasury3Owners = this.treasury3OwnerKeypairs.map((owner) => ({
      address: owner.publicKey,
      shareBps: Math.floor(10000 / this.treasury3OwnerKeypairs.length),
    }));
    this.treasury3Owners[0].shareBps += 10000 %
      this.treasury3OwnerKeypairs.length;

    this.treasury4OwnerKeypairs = Array.from(
      { length: 27 },
      () => new Keypair(),
    );
    this.treasury4Owners = this.treasury4OwnerKeypairs.map((owner) => ({
      address: owner.publicKey,
      shareBps: Math.floor(10000 / this.treasury4OwnerKeypairs.length),
    }));
    this.treasury4Owners[0].shareBps += 10000 %
      this.treasury4OwnerKeypairs.length;

    this.airdropKeypairs = [...this.treasury2OwnerKeypairs.slice(1)];
    this.fromKeypairs = [
      ...this.airdropKeypairs,
      ...this.treasury1OwnerKeypairs,
    ];
  }

  async airdrop(): Promise<void> {
    await airdrop(
      this.provider.connection,
      this.airdropKeypairs.map((k) => k.publicKey),
      this.payer,
    );
  }

  async refund(): Promise<void> {
    await transferEverything(
      this.provider.connection,
      this.fromKeypairs,
      this.payer,
    );
  }
}
