'use strict';

define([
    'lib/utils'
], function(
    Utils
) {

    var IpldWalk = function() {
        this.cborDoc = null;
        this.cborBuf = null;
        this.cummulativeSize = 0;
        this.curIpldPath = [];
        this.curCid = null;
        this.pinnedFlat = {};
        this.isReady = false;
        this.onPinChange = null;

        this.fetchSource = 'ipfs';
    }

    IpldWalk.prototype.setFetchSource = function(source) {
        if (source != 'ipfs' && source != 'wip2p') {
            throw new Error('Unknown source type');
        }

        this.fetchSource = source;
    }

    IpldWalk.prototype.navigateDown = function(path, cid) {

        var self = this;

        if (path == '/') {
            this.curIpldPath.push({path: "root", cid: cid});
        } else {
            this.curIpldPath.push({path: path, cid: cid});
        }

        return this.fetch(cid);
    }

    IpldWalk.prototype.navigateUp = function(depth) {
        this.curIpldPath.splice(depth +1);
        return this.fetch(this.curIpldPath[depth].cid);
    }

    IpldWalk.prototype.fetch = function(cid) {

        var self = this;

        //console.log('fetch - ' + cid);

        return (function(){
            if (self.fetchSource == 'ipfs') {
                return fetchBytesFromIpfs(cid)
            } else {
                return fetchBytesFromWip2p(cid)
            }
        })()
        .then(function(buf) {

            self.cborBuf = buf;
            self.curCid = cid;

            var isDagCbor = false;
            try {
                var tmpCid = new Cids(cid);
                if (tmpCid.codec == 'dag-cbor')
                    isDagCbor = true;
            } catch(err) {
                console.log(err)
            }

            if (isDagCbor)
                return IpldDagCbor.util.deserialize(buf);
        })
        .then(function(cborDoc){
            if (cborDoc != null)
                self.cborDoc = cborDoc;
            else {
                self.cborDoc = null;
                //console.log('no cbor doc found')
            }
            self.isReady = true;
        })
    }

    IpldWalk.prototype.pin = function() {
        if (this.isPinned(this.curCid) == false) {
            this.pinnedFlat[this.curCid] = this.cborBuf;
            this.cummulativeSize += this.cborBuf.length;

            if (typeof this.onPinChange == 'function')
                this.onPinChange();
        }
    }

    IpldWalk.prototype.getCummulativeSize = function() {
        return this.cummulativeSize;
    }

    IpldWalk.prototype.getPinCount = function() {
        return Object.keys(this.pinnedFlat).length;
    }

    IpldWalk.prototype.getPath = function() {
        return this.curIpldPath;
    }

    IpldWalk.prototype.getLinks = function() {
        return this.recurseForLinks("", this.cborDoc);
    }

    IpldWalk.prototype.getContent = function() {
        return JSON.stringify(recurseConvertLinks(this.cborDoc), null, "   ");
    }

    IpldWalk.prototype.getContentRaw = function() {
        return this.cborDoc;
    }

    IpldWalk.prototype.isPinned = function(cid) {
        return this.pinnedFlat.hasOwnProperty(cid);
    }

    IpldWalk.prototype.isParentPinned = function() {
        if (this.curIpldPath.length == 1)
            return true;

        var parentCid = this.curIpldPath[this.curIpldPath.length - 2].cid;
        return this.isPinned(parentCid);
    }

    IpldWalk.prototype.recurseForLinks = function(path, obj) {
        var links = []
        for (var prop in obj) {
            var newPath;
            if (path == "")
                newPath = prop;
            else
                newPath = path + "/" + prop;
            if (obj[prop].constructor.name == 'CID') {
                links.push({
                    path: newPath,
                    cid: obj[prop].toString(),
                    isPinned: this.isPinned(obj[prop].toString())
                });
            } else if (typeof obj[prop] == 'object') {
                var tmpLinks = this.recurseForLinks(newPath, obj[prop]);
                //console.log(tmpLinks);
                links = links.concat(tmpLinks);
            }
        }
        return links;
    }

    IpldWalk.prototype.getPinnedAsBase64 = function() {
        var tmpObj = {};
        for (var prop in this.pinnedFlat) {
            var cid = new Cid(prop);
            tmpObj[cid.multihash.toString('base64')] = this.pinnedFlat[prop].toString('base64');
        }
        return tmpObj;
    }

    var recurseConvertLinks = function(obj) {
        var newObj = {}
        for (var prop in obj) {
            if (obj[prop].constructor.name == 'CID') {
                newObj[prop] = obj[prop].toString();
            } else if (typeof obj[prop] == 'object') {
                newObj[prop] = recurseConvertLinks(obj[prop]);
            } else {
                newObj[prop] = obj[prop];
            }
        }
        return newObj;
    }

    var fetchBytesFromIpfs = function(cid) {
        return new Promise(function(resolve, reject) {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", window.preferedIpfsApi + "/api/v0/block/get?arg=" + cid, true);
            oReq.responseType = "arraybuffer";

            oReq.onload = function (oEvent) {
                var byteArray = Bufferjs.Buffer.from(oReq.response);
                resolve(byteArray);
            }

            oReq.onerror = function(err) {
                reject(new Error("Could not communicate with IPFS node @ " + window.preferedIpfsApi));
            }

            oReq.send(null);
        })
    }

    var fetchBytesFromWip2p = function(cid) {
        return new Promise(function(resolve, reject) {
          libwip2p.Peers.getActivePeerSession()
          .then((session)=>{
            return session.sendMessage({
              method: "doc_get",
              params: [cid]
            })
          })
          .then(function(response){

              if (response.error) {
                  reject(response.error.message);
                  return;
              }

              if (response.result == "CID not found") {
                  reject(response.result);
                  return;
              }

              var buf = buffer.Buffer.from(response.result.substr(2), 'hex');
              resolve(buf);
          })
        })
    }

    return IpldWalk;

})
