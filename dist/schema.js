"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transactions = exports.States = exports.Ledger = exports.Messages = void 0;
var Messages;
(function (Messages) {
    class Uniform {
        constructor() {
            this.type = 'uint32';
        }
    }
    Messages.Uniform = Uniform;
    class Authentic extends Uniform {
        constructor() {
            super(...arguments);
            this.signature = 'hashsig';
        }
    }
    Messages.Authentic = Authentic;
    function asSigningSchema(schema) {
        const signingSchema = {
            ...schema,
            getType: schema.getType
        };
        for (let key in new Messages.Authentic()) {
            delete signingSchema[key];
        }
        return { type: 'uint32', ...signingSchema };
    }
    Messages.asSigningSchema = asSigningSchema;
})(Messages || (exports.Messages = Messages = {}));
var Ledger;
(function (Ledger) {
    class Transaction extends Messages.Authentic {
        constructor() {
            super(...arguments);
            this.asset = 'assetid';
            this.gasPrice = 'decimal';
            this.gasLimit = 'uint256';
            this.nonce = 'uint64';
        }
    }
    Ledger.Transaction = Transaction;
    class Commitment extends Messages.Authentic {
        constructor() {
            super(...arguments);
            this.asset = 'assetid';
            this.gasLimit = 'uint256';
            this.nonce = 'uint64';
        }
    }
    Ledger.Commitment = Commitment;
    class Unknown extends Messages.Authentic {
        constructor() {
            super(...arguments);
            this.asset = 'assetid';
            this.gasPrice = 'decimal?';
            this.gasLimit = 'uint256';
            this.nonce = 'uint64';
            this.typeless = 'typeless';
            this.getType = null;
        }
    }
    Ledger.Unknown = Unknown;
})(Ledger || (exports.Ledger = Ledger = {}));
var States;
(function (States) {
    class AccountBalance {
    }
    AccountBalance.typename = 'account_balance';
    States.AccountBalance = AccountBalance;
    class BridgeInstance {
    }
    BridgeInstance.typename = 'bridge_instance';
    States.BridgeInstance = BridgeInstance;
    class BridgeBalance {
    }
    BridgeBalance.typename = 'bridge_balance';
    States.BridgeBalance = BridgeBalance;
    class WitnessAccount {
    }
    WitnessAccount.typename = 'witness_account';
    States.WitnessAccount = WitnessAccount;
    class WitnessTransaction {
    }
    WitnessTransaction.typename = 'witness_transaction';
    States.WitnessTransaction = WitnessTransaction;
})(States || (exports.States = States = {}));
var Transactions;
(function (Transactions) {
    let Transfer;
    (function (Transfer) {
        class One extends Ledger.Transaction {
            constructor() {
                super(...arguments);
                this.to = 'pubkeyhash';
                this.value = 'decimal';
            }
            getType() { return One.typename; }
        }
        One.typename = 'transfer';
        Transfer.One = One;
        class Many extends Ledger.Transaction {
            constructor() {
                super(...arguments);
                this.to = [
                    'to', 'pubkeyhash',
                    'value', 'decimal'
                ];
            }
            getType() { return Many.typename; }
        }
        Many.typename = 'transfer';
        Transfer.Many = Many;
    })(Transfer = Transactions.Transfer || (Transactions.Transfer = {}));
    class Call extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.callable = 'pubkeyhash';
            this.function = 'string';
            this.pays = [
                'asset', 'assetid',
                'value', 'decimal'
            ];
            this.args = 'args';
        }
        getType() { return Call.typename; }
    }
    Call.typename = 'call';
    Transactions.Call = Call;
    class Rollup extends Ledger.Transaction {
        getType() { return Rollup.typename; }
    }
    Rollup.typename = 'rollup';
    Transactions.Rollup = Rollup;
    class Setup extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.migrations = [
                'broadcastHash', 'uint256',
                'participant', 'pubkeyhash'
            ];
            this.attestations = [
                'asset', 'assetid',
                'stake', 'decimal',
                'hasMinFee', 'boolean',
                'minFee', 'decimal?'
            ];
            this.bridges = [
                'asset', 'assetid',
                'securityLevel', 'uint8',
                'feeRate', 'decimal'
            ];
            this.hasParticipation = 'boolean';
            this.participationStake = 'decimal?';
            this.hasProduction = 'boolean';
            this.productionStake = 'decimal?';
        }
        getType() { return Setup.typename; }
    }
    Setup.typename = 'setup';
    Transactions.Setup = Setup;
    class Route extends Ledger.Commitment {
        constructor() {
            super(...arguments);
            this.bridgeHash = 'uint256';
            this.routingAddress = 'string';
        }
        getType() { return Route.typename; }
    }
    Route.typename = 'route';
    Transactions.Route = Route;
    class Withdraw extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.bridgeHash = 'uint256';
            this.address = 'string';
            this.value = 'decimal';
        }
        getType() { return Withdraw.typename; }
    }
    Withdraw.typename = 'withdraw';
    Transactions.Withdraw = Withdraw;
    class Anticast extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.broadcastHash = 'uint256';
        }
        getType() { return Anticast.typename; }
    }
    Anticast.typename = 'anticast';
    Transactions.Anticast = Anticast;
    Transactions.typenames = {
        'transfer': 'Transfer',
        'deploy': 'Deploy',
        'call': 'Call',
        'rollup': 'Rollup',
        'setup': 'Setup validator',
        'migrate': 'Bridge migrate',
        'attestate': 'Bridge transaction',
        'route': 'Create bridge',
        'bind': 'Bind bridge',
        'withdraw': 'Bridge withdraw',
        'broadcast': 'Bridge broadcast',
        'anticast': 'Bridge protest'
    };
})(Transactions || (exports.Transactions = Transactions = {}));
