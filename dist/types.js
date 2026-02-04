"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = void 0;
const algorithm_1 = require("./algorithm");
const schema_1 = require("./schema");
class Types {
}
exports.Types = Types;
Types.AccountBalance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.AccountBalance.typename));
Types.BridgeInstance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.BridgeInstance.typename));
Types.BridgeBalance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.BridgeBalance.typename));
Types.WitnessAccount = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.WitnessAccount.typename));
Types.WitnessTransaction = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.WitnessTransaction.typename));
Types.Rollup = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Rollup.typename));
Types.Setup = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Setup.typename));
Types.Route = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Route.typename));
Types.Withdraw = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Withdraw.typename));
