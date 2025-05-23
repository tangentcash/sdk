export var Messages;
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
            this.signature = 'recsighash';
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
})(Messages || (Messages = {}));
export var Ledger;
(function (Ledger) {
    class Transaction extends Messages.Authentic {
        constructor() {
            super(...arguments);
            this.asset = 'assetid';
            this.gasPrice = 'decimal';
            this.gasLimit = 'uint256';
            this.nonce = 'uint64';
            this.conservative = 'boolean';
        }
    }
    Ledger.Transaction = Transaction;
    class DelegationTransaction extends Messages.Authentic {
        constructor() {
            super(...arguments);
            this.asset = 'assetid';
            this.gasPrice = 'decimal';
            this.gasLimit = 'uint256';
            this.nonce = 'uint64';
            this.manager = 'pubkeyhash';
        }
    }
    Ledger.DelegationTransaction = DelegationTransaction;
    class ConsensusTransaction extends Messages.Authentic {
        constructor() {
            super(...arguments);
            this.asset = 'assetid';
            this.gasPrice = 'decimal';
            this.gasLimit = 'uint256';
            this.nonce = 'uint64';
        }
    }
    Ledger.ConsensusTransaction = ConsensusTransaction;
})(Ledger || (Ledger = {}));
export var States;
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
})(States || (States = {}));
export var Transactions;
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
    class Rollup extends Ledger.Transaction {
        getType() { return Rollup.typename; }
    }
    Rollup.typename = 'rollup';
    Transactions.Rollup = Rollup;
    class Certification extends Ledger.Transaction {
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
        getType() { return Certification.typename; }
    }
    Certification.typename = 'certification';
    Transactions.Certification = Certification;
    class DepositoryAccount extends Ledger.DelegationTransaction {
        constructor() {
            super(...arguments);
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
            this.securityLevel = 'uint8';
            this.acceptsAccountRequests = 'boolean';
            this.acceptsWithdrawalRequests = 'boolean';
        }
        getType() { return DepositoryAdjustment.typename; }
    }
    DepositoryAdjustment.typename = 'depository_adjustment';
    Transactions.DepositoryAdjustment = DepositoryAdjustment;
    class DepositoryRegrouping extends Ledger.Transaction {
        constructor() {
            super(...arguments);
            this.participants = [
                'asset', 'assetid',
                'manager', 'pubkeyhash',
                'owner', 'pubkeyhash'
            ];
        }
        getType() { return DepositoryRegrouping.typename; }
    }
    DepositoryRegrouping.typename = 'depository_regrouping';
    Transactions.DepositoryRegrouping = DepositoryRegrouping;
})(Transactions || (Transactions = {}));
