import { ByteUtil, Hashing } from "./algorithm";
import { States, Transactions } from "./schema";

export class Types
{
  static AccountBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.AccountBalance.typename));
  static AccountProgram = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.AccountBalance.typename));
  static DepositoryBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.DepositoryBalance.typename));
  static DepositoryPolicy = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.DepositoryPolicy.typename));
  static WitnessAccount = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessAccount.typename));
  static WitnessTransaction = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessTransaction.typename));
  static Rollup = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Rollup.typename));
  static DepositoryAccount = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.DepositoryAccount.typename));
  static DepositoryRegrouping = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.DepositoryRegrouping.typename));
}