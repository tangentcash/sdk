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
    class DepositoryBalance {
    }
    DepositoryBalance.typename = 'depository_balance';
    States.DepositoryBalance = DepositoryBalance;
    class DepositoryPolicy {
    }
    DepositoryPolicy.typename = 'depository_policy';
    States.DepositoryPolicy = DepositoryPolicy;
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
            this.value = 'decimal';
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
    class ValidatorAdjustment extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.blockProduction = 'uint8';
            this.participationStakes = [
                'asset', 'assetid',
                'stake', 'decimal'
            ];
            this.attestationStakes = [
                'asset', 'assetid',
                'stake', 'decimal'
            ];
        }
        getType() { return ValidatorAdjustment.typename; }
    }
    ValidatorAdjustment.typename = 'validator_adjustment';
    Transactions.ValidatorAdjustment = ValidatorAdjustment;
    class DepositoryAccount extends Ledger.Commitment {
        constructor() {
            super(...arguments);
            this.manager = 'pubkeyhash';
            this.routingAddress = 'string';
        }
        getType() { return DepositoryAccount.typename; }
    }
    DepositoryAccount.typename = 'depository_account';
    Transactions.DepositoryAccount = DepositoryAccount;
    class DepositoryWithdrawal extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.onlyIfNotInQueue = 'boolean';
            this.fromManager = 'pubkeyhash';
            this.toManager = 'pubkeyhash';
            this.to = [
                'to', 'string',
                'value', 'decimal'
            ];
        }
        getType() { return DepositoryWithdrawal.typename; }
    }
    DepositoryWithdrawal.typename = 'depository_withdrawal';
    Transactions.DepositoryWithdrawal = DepositoryWithdrawal;
    class DepositoryAdjustment extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.incomingFee = 'decimal';
            this.outgoingFee = 'decimal';
            this.participationThreshold = 'decimal';
            this.securityLevel = 'uint8';
            this.acceptsAccountRequests = 'boolean';
            this.acceptsWithdrawalRequests = 'boolean';
        }
        getType() { return DepositoryAdjustment.typename; }
    }
    DepositoryAdjustment.typename = 'depository_adjustment';
    Transactions.DepositoryAdjustment = DepositoryAdjustment;
    class DepositoryMigration extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.participants = [
                'asset', 'assetid',
                'manager', 'pubkeyhash',
                'owner', 'pubkeyhash'
            ];
        }
        getType() { return DepositoryMigration.typename; }
    }
    DepositoryMigration.typename = 'depository_migration';
    Transactions.DepositoryMigration = DepositoryMigration;
    Transactions.typenames = {
        'transfer': 'Transfer',
        'upgrade': 'Create program',
        'call': 'Call program',
        'rollup': 'Rollup',
        'validator_adjustment': 'Adjust validator',
        'depository_account': 'Order bridge address',
        'depository_account_finalization': 'Issue bridge address',
        'depository_withdrawal': 'Order bridge withdrawal',
        'depository_withdrawal_finalization': 'Issue bridge transaction',
        'depository_attestation': 'Process bridge transaction',
        'depository_adjustment': 'Adjust bridge',
        'depository_migration': 'Order bridge signer migration',
        'depository_migration_finalization': 'Migrate bridge signer'
    };
})(Transactions || (exports.Transactions = Transactions = {}));
