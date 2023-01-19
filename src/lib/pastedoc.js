'use strict';

define(()=>{

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

            console.log(encodedDoc)

            var cborData = libipfs.dagCbor.encode(encodedDoc);
            let bCborData = Buffer.from(cborData)
            resolve(bCborData);
        })
    }

    var deserialize = function(byteData) {
      //console.log(byteData)
      if (Array.isArray(byteData)) {
        byteData = byteData[0]
      }

      return new Promise(function(resolve, reject){
          var bCbor;
          if (Buffer.isBuffer(byteData))
              bCbor = byteData;
          else
              bCbor = Buffer.from(byteData, 'base64');

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
            } else if (obj[key].hasOwnProperty('asCID')) {
                //var cid = new Cid(obj[key]);
                var cid = obj[key];
                obj[key] = {"/": cid.toString()}
            } else if (Buffer.isBuffer(obj[key])) {
                obj[key] = '0x' + obj[key].toString('hex');
            } else if (typeof obj[key] == 'object') {
                decodeSpecials(obj[key]);
            }
        }

    }

    var getCid = function(data) {
        return new Promise(function(resolve, reject) {
            var bCbor;
            if (Buffer.isBuffer(data) == false)
              bCbor = Buffer.from(data, 'base64');
            else {
              bCbor = data;
            }

            let digest = sha256.digest(bCbor)
            var cid = Cid.create(1, dagCbor.code, digest)
            resolve(cid);
        })
    }

    var encodeSpecials = function(obj) {

        // if the data is a string
        if (typeof obj == 'string') {
            if (obj.startsWith('0x'))
                return Buffer.from(obj.substr(2), 'hex');
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
                      var c = Cid.parse(obj[key]["/"]);
                      newObj[key] = c;
                    } catch (err) {
                      console.log(err)
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
                      newObj[key] = Buffer.from(obj[key].substr(2), 'hex');
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

    const sha256 = window.libipfs.multiformats.hasher.from({
      name: 'sha2-256',
      code: 0x12,
      encode: (input) => libipfs.shajs('sha256').update(input).digest()
    })
    var dagCbor = window.libipfs.dagCbor;

    return {
        serializeToBuffer: serializeToBuffer,
        deserialize: deserialize,
        getCid: getCid
    }
})
