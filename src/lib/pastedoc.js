'use strict';

define([
    'gx/js-ipld-cbor-native-sha256/ipldcbor.min',
    'gx/js-cid/cids.min',
    'gx/buffer.js/buffer',
], function(
    IpldCbor,
    Cid,
    Bufferjs
) {

    var serializeToBuffer = function(stringPasteDoc) {
        return new Promise(function(resolve, reject) {
            var pasteDoc = {};

            var tmpDoc;
            try {
              tmpDoc = JSON.parse(stringPasteDoc);
            } catch (err) {
              tmpDoc = stringPasteDoc;
            }

            pasteDoc = tmpDoc;

            var encodedDoc = encodeSpecials(pasteDoc);

            var cborData = IpldCbor.util.serialize(encodedDoc);
            resolve(cborData);
        })
    }

    var deserialize = function(byteData) {
      //console.log(byteData)
      if (Array.isArray(byteData)) {
        byteData = byteData[0]
      }

      return new Promise(function(resolve, reject){
          var bCbor;
          if (Bufferjs.Buffer.isBuffer(byteData))
              bCbor = byteData;
          else
              bCbor = Bufferjs.Buffer.from(byteData, 'base64');

          let pasteDoc = null;
          try {
            pasteDoc = libipfs.dagCbor.decode(bCbor);
          } catch(err) {
            pasteDoc = libipfs.dagPB.decode(bCbor);
          }

          if (pasteDoc == null) {
            pasteDoc = bCbor
          }

          if (Buffer.isBuffer(pasteDoc)) {
            pasteDoc = '0x' + pasteDoc.toString('hex');
          } else {
            decodeSpecials(pasteDoc);
          }

          resolve(pasteDoc);
      })
    }

    var decodeSpecials = function(obj) {

        for (var key in obj) {
            if (obj[key] == null) { // do nothing
              obj[key] = null;
            } else if (obj[key].constructor.name == 'CID') {
                var cid = new Cid(obj[key]);
                obj[key] = {"/": cid.toString()}
            } else if (Bufferjs.Buffer.isBuffer(obj[key])) {
                obj[key] = '0x' + obj[key].toString('hex');
            } else if (typeof obj[key] == 'object') {
                decodeSpecials(obj[key]);
            }
        }

    }

    var getCid = function(data) {
        return new Promise(function(resolve, reject) {
            var bCbor;
            if (Bufferjs.Buffer.isBuffer(data) == false)
              bCbor = Bufferjs.Buffer.from(data, 'base64');
            else {
              bCbor = data;
            }
            IpldCbor.util.cid(bCbor)
            .then(function(cid) {
                resolve(cid);
            })
        })
    }

    var encodeSpecials = function(obj) {

        // if the data is a string
        if (typeof obj == 'string') {
            if (obj.startsWith('0x'))
                return Bufferjs.Buffer.from(obj.substr(2), 'hex');
            else
                return obj;
        }

        if (typeof obj == 'number')
            return obj;

        if (Object.keys(obj).length == 1 && obj.hasOwnProperty("/")) {
            return new Cid(obj["/"]);
        }

        var newObj;
        if (Array.isArray(obj))
          newObj = []
        else
          newObj = {}

        for (var key in obj) {

            if (obj[key] == null) {
                newObj[key] = null;
            } else if (typeof obj[key] == 'object') {
                if (Object.keys(obj[key]).length == 1 && obj[key].hasOwnProperty('/')) {
                    try {
                      var c = new Cid(obj[key]["/"]);
                      newObj[key] = c;
                    } catch (err) {
                      console.log("appears to be an invalid CID");
                    }
                } else {
                    // recurse into child objects
                    newObj[key] = encodeSpecials(obj[key]);
                }
            } else if (typeof obj[key] == 'string' && obj[key].startsWith('0x') == true) {
                var re = /^0x[\dA-F]+$/i;
                if (re.test(obj[key])) {
                    // replace binary strings with Buffers
                    try {
                      newObj[key] = Bufferjs.Buffer.from(obj[key].substr(2), 'hex');
                    } catch (e) {
                      newObj[key] = obj[key];
                    }
                } else {
                  newObj[key] = obj[key];
                }
            } else {
              newObj[key] = obj[key];
            }
        }

        return newObj;
    }

    return {
        serializeToBuffer: serializeToBuffer,
        deserialize: deserialize,
        getCid: getCid
    }
})
