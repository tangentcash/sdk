"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = void 0;
const algorithm_1 = require("./algorithm");
const schema_1 = require("./schema");
class Types {
}
exports.Types = Types;
Types.AccountBalance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.AccountBalance.typename));
Types.BridgeBalance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.BridgeBalance.typename));
Types.BridgePolicy = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.BridgePolicy.typename));
Types.WitnessAccount = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.WitnessAccount.typename));
Types.WitnessTransaction = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.WitnessTransaction.typename));
Types.Rollup = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Rollup.typename));
Types.BridgeAccount = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.BridgeAccount.typename));
Types.BridgeMigration = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.BridgeMigration.typename));
