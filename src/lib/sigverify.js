'use strict';

define([
  'gx/buffer.js/buffer'
], function(
  Bufferjs
) {

    var verify = function(account, timestamp, multihash, signature) {

        var objToSign = [timestamp, multihash];
        var stringToSign = JSON.stringify(objToSign);
        var hash = ethers.utils.hashMessage(stringToSign);
        var derivedAccountString = ethers.utils.recoverAddress(hash, signature);

        return derivedAccountString.toLowerCase() == account.toLowerCase();
    }

    return verify;
})
