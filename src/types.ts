import { ByteUtil, Hashing } from "./algorithm";
import { States, Transactions } from "./schema";

export class Types {
  static AccountBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.AccountBalance.typename));
  static BridgeInstance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.BridgeInstance.typename));
  static BridgeQueue = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.BridgeQueue.typename));
  static BridgeBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.BridgeBalance.typename));
  static WitnessAccount = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessAccount.typename));
  static WitnessTransaction = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessTransaction.typename));
  static Rollup = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Rollup.typename));
  static Setup = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Setup.typename));
  static Route = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Route.typename));
  static Withdraw = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Withdraw.typename));
}