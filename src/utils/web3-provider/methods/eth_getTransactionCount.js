import utils from 'web3-utils';
import { toPayload } from '../jsonrpc';
import EthCalls from '../web3Calls';
import store from 'store';
import BigNumber from 'bignumber.js';
import sanitizeHex from '@/helpers/sanitizeHex';

export default async ({ payload, requestManager }, res, next) => {
  if (payload.method !== 'eth_getTransactionCount') return next();
  console.log('do');
  const ethCalls = new EthCalls(requestManager);
  const addr = payload.params[0];
  let cached = {};
  if (store.get(utils.sha3(addr)) === undefined) {
    cached = {
      nonce: '0x00',
      timestamp: 0
    };
    store.set(utils.sha3(addr), cached);
  } else {
    cached = store.get(utils.sha3(addr));
  }
  console.log('you');
  const timeDiff =
    Math.round((new Date().getTime() - cached.timestamp) / 1000) / 60;
  if (timeDiff > 1) {
    console.log('want', addr);
    const liveNonce = await ethCalls.getTransactionCount(addr);
    console.log('i got past want');
    const liveNonceBN = new BigNumber(liveNonce);
    const cachedNonceBN = new BigNumber(cached.nonce);
    if (timeDiff > 15) {
      console.log('to');
      cached = {
        nonce: sanitizeHex(liveNonceBN.toString(16)),
        timestamp: +new Date()
      };
    } else if (liveNonceBN.isGreaterThan(cachedNonceBN)) {
      console.log('build');
      cached = {
        nonce: sanitizeHex(liveNonceBN.toString(16)),
        timestamp: +new Date()
      };
    }
    console.log('a');
    store.set(utils.sha3(addr), cached);
  }
  console.log('snowman');
  res(null, toPayload(payload.id, cached.nonce));
};
