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
    conservative: string = 'boolean';
  }

  export class DelegationTransaction extends Messages.Authentic {
    asset: string = 'assetid';
    gasPrice: string = 'decimal';
    gasLimit: string = 'uint256';
    nonce: string = 'uint64';
    manager: string = 'pubkeyhash';
  }

  export class ConsensusTransaction extends Messages.Authentic {
    asset: string = 'assetid';
    gasPrice: string = 'decimal';
    gasLimit: string = 'uint256';
    nonce: string = 'uint64';
  }

  export class UnknownTransaction extends Messages.Authentic {
    asset: string = 'assetid';
    gasPrice: string = 'decimal';
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

  export class AccountProgram {
    static typename: string = 'account_program';
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
      to: string = 'subpubkeyhash';
      value: string = 'decimal';
  
      getType() { return One.typename; }
    }
  
    export class Many extends Ledger.Transaction {
      static typename: string = 'transfer';
      to: string[] = [
        'to', 'subpubkeyhash',
        'value', 'decimal'
      ];
  
      getType() { return Many.typename; }
    }
  }

  export namespace Refuel {
    export class One extends Ledger.Transaction {
      static typename: string = 'refuel';
      to: string = 'subpubkeyhash';
      value: string = 'uint256';
  
      getType() { return One.typename; }
    }
  
    export class Many extends Ledger.Transaction {
      static typename: string = 'refuel';
      to: string[] = [
        'to', 'subpubkeyhash',
        'value', 'uint256'
      ];
  
      getType() { return Many.typename; }
    }
  }

  export class Rollup extends Ledger.Transaction {
    static typename: string = 'rollup';

    getType() { return Rollup.typename; }
  }

  export class Certification extends Ledger.Transaction {
    static typename: string = 'certification';
    blockProduction: string = 'uint8';
    participationStakes: string[] = [
      'asset', 'assetid',
      'stake', 'decimal'
    ];
    attestationStakes: string[] = [
      'asset', 'assetid',
      'stake', 'decimal'
    ];

    getType() { return Certification.typename; }
  }

  export class DepositoryAccount extends Ledger.DelegationTransaction {
    static typename: string = 'depository_account';
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
    securityLevel: string = 'uint8';
    acceptsAccountRequests: string = 'boolean';
    acceptsWithdrawalRequests: string = 'boolean';

    getType() { return DepositoryAdjustment.typename; }
  }

  export class DepositoryRegrouping extends Ledger.Transaction {
    static typename: string = 'depository_regrouping';
    participants: string[] = [
      'asset', 'assetid',
      'manager', 'pubkeyhash',
      'owner', 'pubkeyhash'
    ];

    getType() { return DepositoryRegrouping.typename; }
  }

  export const typenames: Record<string, string> = {
    'transfer': 'Transfer',   
    'upgrade': 'Program creation',
    'call': 'Program call',
    'rollup': 'Rollup',
    'certification': 'Validator certification',
    'routing_account': 'Routing address registration',
    'depository_account': 'Depository address selection',
    'depository_account_finalization': 'Depository address registration',
    'depository_withdrawal': 'Depository withdrawal',
    'depository_withdrawal_finalization': 'Depository withdrawal confirmation',
    'depository_transaction': 'Depository transaction',
    'depository_adjustment': 'Depository policy renewal',
    'depository_regrouping': 'Depository group selection',
    'depository_regrouping_preparation': 'Depository group announcement',
    'depository_regrouping_commitment': 'Depository group migration',
    'depository_regrouping_finalization': 'Depository group confirmation'
  };
}