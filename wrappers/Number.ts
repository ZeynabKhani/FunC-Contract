import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Slice,
    toNano,
} from '@ton/core';

const change_number = 0xe072d0d1;
const change_number_notification = 0x5c690c2f;

export type NumberConfig = {
    number: number;
};

export function numberConfigToCell(config: NumberConfig): Cell {
    return beginCell().storeUint(config.number, 8).endCell();
}

export class Number implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Number(address);
    }

    static createFromConfig(config: NumberConfig, code: Cell, workchain = 0) {
        const data = numberConfigToCell(config);
        const init = { code, data };
        return new Number(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value / BigInt(2),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });

        await this.changeNumber(provider, via, 1);
    }

    async changeNumber(provider: ContractProvider, via: Sender, new_number: number) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(change_number, 32).storeUint(new_number, 8).endCell(),
            value: toNano('0.01'),
        });
    }

    static hexToAscii(hexString: string) {
        var hex = hexString.toString();
        var str = '';
        for (var n = 0; n < hex.length; n += 2) {
            str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
        }
        return str;
    }

    static parseEvent(event: Slice) {
        const op = event.loadUint(32);
        if (op == change_number_notification) {
            const eventString = this.hexToAscii(event.loadUint(13 * 8).toString(16)!);
            if (eventString == 'ChangedNumber') {
                const number = event.loadUint(8);
                return number;
            } else {
                return console.log('Not a supported event');
            }
        }
    }

    async getNumber(provider: ContractProvider) {
        const res = await provider.get('get_number', []);
        let number = res.stack.readBigNumber();
        return number;
    }
}
