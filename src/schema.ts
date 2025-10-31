export namespace Messages {
  export class Uniform {
    type: string = 'uint32';
  }

  export class Authentic extends Uniform {
    signature: string = 'hashsig';
  }
  
  export function asSigningSchema(schema: any): any {
    const signingSchema = {
      ...schema,
      getType: schema.getType
    };
    for (let key in new Messages.Authentic()) {
      delete signingSchema[key];
    }
    return { type: 'uint32', ...signingSchema };
  }
}

export namespace Ledger {
  export class Transaction extends Messages.Authentic {
    asset: string = 'assetid';
    gasPrice: string = 'decimal';
    gasLimit: string = 'uint256';
    nonce: string = 'uint64';
  }

  export class Commitment extends Messages.Authentic {
    asset: string = 'assetid';
    gasLimit: string = 'uint256';
    nonce: string = 'uint64';
  }

  export class Unknown extends Messages.Authentic {
    asset: string = 'assetid';
    gasPrice: string = 'decimal?';
    gasLimit: string = 'uint256';
    nonce: string = 'uint64';
    typeless: string = 'typeless';
    getType: (() => number) | null = null;
  }
}

export namespace States {
  export class AccountBalance {
    static typename: string = 'account_balance';
  }

  export class DepositoryBalance {
    static typename: string = 'depository_balance';
  }

  export class DepositoryPolicy {
    static typename: string = 'depository_policy';
  }

  export class WitnessAccount {
    static typename: string = 'witness_account';
  }

  export class WitnessTransaction {
    static typename: string = 'witness_transaction';
  }
}

export namespace Transactions {
  export namespace Transfer {
    export class One extends Ledger.Transaction {
      static typename: string = 'transfer';
      to: string = 'pubkeyhash';
      value: string = 'decimal';
  
      getType() { return One.typename; }
    }
  
    export class Many extends Ledger.Transaction {
      static typename: string = 'transfer';
      to: string[] = [
        'to', 'pubkeyhash',
        'value', 'decimal'
      ];
  
      getType() { return Many.typename; }
    }
  }

  export class Call extends Ledger.Transaction {
    static typename: string = 'call';
    callable: string = 'pubkeyhash';
    function: string = 'string';
    value: string = 'decimal';
    args: string = 'args';

    getType() { return Call.typename; }
  }

  export class Rollup extends Ledger.Transaction {
    static typename: string = 'rollup';

    getType() { return Rollup.typename; }
  }

  export class ValidatorAdjustment extends Ledger.Transaction {
    static typename: string = 'validator_adjustment';
    blockProduction: string = 'uint8';
    participationStakes: string[] = [
      'asset', 'assetid',
      'stake', 'decimal'
    ];
    attestationStakes: string[] = [
      'asset', 'assetid',
      'stake', 'decimal'
    ];

    getType() { return ValidatorAdjustment.typename; }
  }

  export class DepositoryAccount extends Ledger.Commitment {
    static typename: string = 'depository_account';
    manager: string = 'pubkeyhash';
    routingAddress: string = 'string';

    getType() { return DepositoryAccount.typename; }
  }

  export class DepositoryWithdrawal extends Ledger.Transaction {
    static typename: string = 'depository_withdrawal';
    onlyIfNotInQueue: string = 'boolean';
    fromManager: string = 'pubkeyhash';
    toManager: string = 'pubkeyhash';
    to: string[] = [
      'to', 'string',
      'value', 'decimal'
    ];

    getType() { return DepositoryWithdrawal.typename; }
  }

  export class DepositoryAdjustment extends Ledger.Transaction {
    static typename: string = 'depository_adjustment';
    incomingFee: string = 'decimal';
    outgoingFee: string = 'decimal';
    participationThreshold: string = 'decimal';
    securityLevel: string = 'uint8';
    acceptsAccountRequests: string = 'boolean';
    acceptsWithdrawalRequests: string = 'boolean';

    getType() { return DepositoryAdjustment.typename; }
  }

  export class DepositoryMigration extends Ledger.Transaction {
    static typename: string = 'depository_migration';
    participants: string[] = [
      'asset', 'assetid',
      'manager', 'pubkeyhash',
      'owner', 'pubkeyhash'
    ];

    getType() { return DepositoryMigration.typename; }
  }

  export const typenames: Record<string, string> = {
    'transfer': 'Transfer',   
    'upgrade': 'Create program',
    'call': 'Call program',
    'rollup': 'Rollup',
    'validator_adjustment': 'Adjust validator',
    'depository_account': 'Order off-chain address',
    'depository_account_finalization': 'Issue off-chain address',
    'depository_withdrawal': 'Order off-chain withdrawal',
    'depository_withdrawal_finalization': 'Issue off-chain transaction',
    'depository_attestation': 'Process off-chain transaction',
    'depository_adjustment': 'Adjust depository',
    'depository_migration': 'Order depository signer migration',
    'depository_migration_finalization': 'Migrate depository signer'
  };
}