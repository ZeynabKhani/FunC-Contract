import { toNano, Cell } from '@ton/core';
import { NetworkProvider, compile } from '@ton/blueprint';
import * as dotenv from 'dotenv';
import { Number } from '../wrappers/Number';
dotenv.config();

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    if ((await provider.provider(sender.address!).getState()).state.type != 'active') {
        console.log('wallet is not deployed');
    }
    const numberCode = await compile('Number');

    const number = Number.createFromConfig(
        {
            number: 0,
        },
        numberCode,
    );
    console.log('Number address:', number.address.toString());
    const numberContract = provider.open(number);
    await numberContract.sendDeploy(sender, toNano('0.05'));
    await provider.waitForDeploy(numberContract.address);
}
