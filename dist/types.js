import { ByteUtil, Hashing } from "./algorithm";
import { States, Transactions } from "./schema";
export class Types {
}
Types.AccountBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.AccountBalance.typename));
Types.ValidatorProduction = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.ValidatorProduction.typename));
Types.DepositoryBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.DepositoryBalance.typename));
Types.DepositoryPolicy = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.DepositoryPolicy.typename));
Types.WitnessAccount = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessAccount.typename));
Types.WitnessTransaction = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessTransaction.typename));
Types.Rollup = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Rollup.typename));
Types.DepositoryAccount = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.DepositoryAccount.typename));
Types.DepositoryRegrouping = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.DepositoryRegrouping.typename));
