import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell } from '@ton/core';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { Number } from '../wrappers/Number';

const change_number = 0xe072d0d1;
const change_number_notification = 0x5c690c2f;

describe('Number', () => {
    let numberCode: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let number: SandboxContract<Number>;

    beforeAll(async () => {
        numberCode = await compile('Number');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        number = blockchain.openContract(
            Number.createFromConfig(
                {
                    number: 0,
                },
                numberCode,
            ),
        );
        const deployResult = await number.sendDeploy(deployer.getSender(), toNano('0.05'));
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: number.address,
            deploy: true,
            success: true,
        });

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: number.address,
            success: true,
            op: change_number,
        });

        expect(deployResult.transactions).toHaveTransaction({
            from: number.address,
            to: deployer.address,
            success: true,
            op: change_number_notification,
        });
    });

    it('should change number', async () => {
        expect(await number.getNumber()).toEqual(BigInt(1));
    });
});
