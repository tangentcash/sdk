import { ByteUtil, Hashing } from "./algorithm";
import { States, Transactions } from "./schema";

export class Types {
  static AccountBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.AccountBalance.typename));
  static BridgeBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.BridgeBalance.typename));
  static BridgePolicy = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.BridgePolicy.typename));
  static WitnessAccount = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessAccount.typename));
  static WitnessTransaction = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessTransaction.typename));
  static Rollup = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Rollup.typename));
  static BridgeAccount = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.BridgeAccount.typename));
  static BridgeMigration = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.BridgeMigration.typename));
}