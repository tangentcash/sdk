"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = void 0;
const algorithm_1 = require("./algorithm");
const schema_1 = require("./schema");
class Types {
}
exports.Types = Types;
Types.AccountBalance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.AccountBalance.typename));
Types.ValidatorProduction = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.ValidatorProduction.typename));
Types.DepositoryBalance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.DepositoryBalance.typename));
Types.DepositoryPolicy = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.DepositoryPolicy.typename));
Types.WitnessAccount = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.WitnessAccount.typename));
Types.WitnessTransaction = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.WitnessTransaction.typename));
Types.Rollup = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Rollup.typename));
Types.DepositoryAccount = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.DepositoryAccount.typename));
Types.DepositoryRegrouping = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.DepositoryRegrouping.typename));
