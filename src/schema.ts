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

  export class BridgeInstance {
    static typename: string = 'bridge_instance';
  }

  export class BridgeBalance {
    static typename: string = 'bridge_balance';
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
    pays: string[] = [
      'asset', 'assetid',
      'value', 'decimal'
    ];
    args: string = 'args';

    getType() { return Call.typename; }
  }

  export class Rollup extends Ledger.Transaction {
    static typename: string = 'rollup';

    getType() { return Rollup.typename; }
  }

  export class Setup extends Ledger.Transaction {
    static typename: string = 'setup';
    migrations: string[] = [
      'broadcastHash', 'uint256',
      'participant', 'pubkeyhash'
    ];
    attestations: string[] = [
      'asset', 'assetid',
      'stake', 'decimal',
      'hasMinFee', 'boolean',
      'minFee', 'decimal?'
    ];
    bridges: string[] = [
      'asset', 'assetid',
      'securityLevel', 'uint8',
      'feeRate', 'decimal'
    ];
    hasParticipation: string = 'boolean';
    participationStake: string = 'decimal?';
    hasProduction: string = 'boolean';
    productionStake: string = 'decimal?';

    getType() { return Setup.typename; }
  }

  export class Route extends Ledger.Commitment {
    static typename: string = 'route';
    bridgeHash: string = 'uint256';
    routingAddress: string = 'string';

    getType() { return Route.typename; }
  }

  export class Withdraw extends Ledger.Transaction {
    static typename: string = 'withdraw';
    bridgeHash: string = 'uint256';
    address: string = 'string';
    value: string = 'decimal';

    getType() { return Withdraw.typename; }
  }

  export class Anticast extends Ledger.Transaction {
    static typename: string = 'anticast';
    broadcastHash: string = 'uint256';

    getType() { return Anticast.typename; }
  }

  export const typenames: Record<string, string> = {
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
}