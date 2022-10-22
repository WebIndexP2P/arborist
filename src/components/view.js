'use strict'

define([
   'lib/sigverify',
   'lib/pastedoc',
   'lib/refreshlistener',

   'components/timestampcycler',

   'gx/ethereum-blockies/blockies.min',
   'gx/js-cid/cids.min',
   'gx/buffer.js/buffer'
], function(
    SigVerify,
    PasteDoc,
    RefreshListener,

    TimestampCycler,

    MakeBlockies,
    Cids,
    Bufferjs
) {

    var doQuery = function(vnode) {

        if (vnode.state.queryInProgress) {
            console.error("Query already in progress");
            return;
        } else
            vnode.state.queryInProgress = true;

        vnode.state.result = {};
        vnode.state.error = null;
        m.redraw();

        libwip2p.Peers.getActivePeerSession()
        .then((session)=>{
          if (session.connState == 4) {
            return session.sendMessage({
                method: "bundle_get",
                params: [{account:vnode.state.account}]
            })
          } else {
              vnode.state.queryInProgress = false;
              throw new Error('peerSession not ready');
          }
        })
        .then(function(response){

            if (response.error != null) {
                if (response.error.message)
                  vnode.state.error = response.error.message;
                else
                  vnode.state.error = response.error;
                //console.warn(response.error);
                vnode.state.queryInProgress = false;
                m.redraw();
                return;
            }

            vnode.state.result = response.result;

            // if following, mark as read
            libwip2p.Following.markAsRead(vnode.state.account, vnode.state.result.timestamp);
            vnode.state.queryInProgress = false;

            if (vnode.state.result.multihash) {
              var mhashBuf = buffer.Buffer.from(vnode.state.result.multihash.substr(2), 'hex');
              var cid = new Cids(1, 'dag-cbor', mhashBuf);
              vnode.state.cid = cid.toString();
              vnode.state.cidLink = m("a", {"data-toggle":"dropdown", href:"#"}, vnode.state.cid);
            }

            // only do the cbor stuff if it exists
            if (vnode.state.result.hasOwnProperty('cborData')) {

                PasteDoc.getCid(vnode.state.result.cborData[0])
                .then(function(clientCalcedCid) {
                    if (clientCalcedCid == vnode.state.cid) {
                        vnode.state.cidVerifyCheck = m("i.fas fa-check-circle", {style:"color:green;font-size:30px;"})
                    } else {
                        vnode.state.cidVerifyCheck = m("i.fas fa-times-circle", {style:"color:red;font-size:30px;"})
                    }
                })

                PasteDoc.deserialize(vnode.state.result.cborData[0])
                .then(function(pasteDoc){
                    if (typeof pasteDoc == 'string') {
                      vnode.state.decodedData = pasteDoc;
                    } else {
                      vnode.state.decodedData = JSON.stringify(pasteDoc, null, '   ');
                    }
                    m.redraw();
                })
                .catch((err)=>{
                  vnode.state.error = err.message;
                  m.redraw();
                });

            }

            // verify sig asynchronously
            setTimeout(function(){
                var sigVerify = SigVerify(vnode.state.account, vnode.state.result.timestamp, vnode.state.result.multihash, vnode.state.result.signature);
                if (sigVerify)
                    vnode.state.sigVerifyCheck = m("i.fas fa-check-circle", {style:"color:green;font-size:30px;"})
                else
                    vnode.state.sigVerifyCheck = m("i.fas fa-times-circle", {style:"color:red;font-size:30px;"})
                m.redraw();
            }, 50);

        })
        .catch((err)=>{
          vnode.state.queryInProgress = false;
          if (err == 'peerSession not ready') {}
          else {
              //console.error(err)
              vnode.state.error = err;
              m.redraw()
          }
        })
    }

    var toggleFollowing = function(vnode) {
        if (vnode.state.isFollowing)
            libwip2.Following.remove(vnode.state.account);
        else
            libwip2p.Following.add(vnode.state.account, vnode.state.result.timestamp);

        vnode.state.isFollowing = libwip2p.Following.isFollowing(vnode.state.account);
    }

    var onManualUploadToIpfs = function(vnode, e) {
        e.preventDefault();

        var bCbor = Bufferjs.Buffer.from(vnode.state.result.cborData[0], 'base64');

        new Promise(function(resolve, reject) {
            var boundary = '----IPFSUPLOADBOUNDARY' + (Math.random() * 100000) + '.' + (Math.random() * 100000);
            var payload = buffer.Buffer.concat([
                buffer.Buffer.from('--' + boundary + "\r\nContent-Disposition: form-data; name=\"path\"\r\nContent-Type: application/octet-stream\r\n\r\n", 'utf8'),
                bCbor,
                buffer.Buffer.from("\r\n--" + boundary + "--")
            ]);

            var oReq = new XMLHttpRequest();
            oReq.open("POST", window.preferedIpfsApi + "/api/v0/block/put?format=cbor", true);

            oReq.onload = function (oEvent) {
                resolve(JSON.parse(oReq.response));
            }

            oReq.onerror = function(err) {
                reject(new Error("Could not communicate with IPFS node @ " + window.preferedIpfsApi));
            }

            oReq.setRequestHeader('Content-Type', "multipart/form-data; boundary=" + boundary);
            oReq.send(payload);
        })
        .then(function(response){
            if (response.Key == vnode.state.cid) {
                $.growl.notice({message: "Content successfully added to IPFS"})
            } else {
                $.growl.error({message: "Uploaded CID does not match our CID?"})
                console.error(response);
            }
        })
        .catch(function(err){
            $.growl.error({message: "Add to IPFS failed"})
            console.error(err);
        })
    }

    return {

        onupdate: function(vnode) {
            // if we are updating the view and our account no longer matches, requery
            if (vnode.state.lastQueryAccount != m.route.param().account) {

                vnode.state.account = m.route.param().account;
                vnode.state.isFollowing = libwip2p.Following.isFollowing(vnode.state.account);
                vnode.state.sigVerifyCheck = m("i.fas fa-question-circle", {style:"font-size:30px;color:grey;"});
                vnode.state.cidVerifyCheck = m("i.fas fa-question-circle", {style:"font-size:30px;color:grey;"});
                vnode.state.lastQueryAccount = vnode.state.account;
                vnode.state.decodedData = "";
                vnode.state.cidLink = "";
                doQuery(vnode);
            }
        },

        oninit: function(vnode) {

            vnode.state.account = m.route.param().account;

            vnode.state.isFollowing = libwip2p.Following.isFollowing(vnode.state.account);

            vnode.state.decodedData = "";
            vnode.state.lastQueryAccount = vnode.state.account;
            vnode.state.queryInProgress = false;
            vnode.state.sigVerifyCheck = m("i.fas fa-question-circle", {style:"font-size:30px;color:grey;"});
            vnode.state.cidVerifyCheck = m("i.fas fa-question-circle", {style:"font-size:30px;color:grey;"});
            vnode.state.result = {};

            vnode.state.peerChangeHandler = function() {
              vnode.state.sigVerifyCheck = m("i.fas fa-question-circle", {style:"font-size:30px;color:grey;"});
              vnode.state.cidVerifyCheck = m("i.fas fa-question-circle", {style:"font-size:30px;color:grey;"});
              vnode.state.result = {};
              doQuery(vnode);
            }
            libwip2p.Peers.events.on('peerconnected', vnode.state.peerChangeHandler)

            libwip2p.Peers.getActivePeerSession()
            .then((session)=>{
                if (session.connState == 4)
                    doQuery(vnode);
            })
            .catch((err)=>{

            })
        },

        onremove: function(vnode) {
          libwip2p.Peers.events.off('peerconnected', vnode.state.peerChangeHandler)
        },

        view: function(vnode) {

            if (vnode.state.error)
                return m("div.alert alert-danger", vnode.state.error);

            var followBtn = "Follow";
            if (vnode.state.isFollowing)
                followBtn = "Unfollow";

            return [
                m("div", "Account: ",
                    m("img", {src: MakeBlockies(vnode.state.account), style:"margin-right: 10px;height:32px;width:32px;border-radius:15%;"}),
                    m("span", {style:'word-wrap:break-word;font-family:"Courier New", Courier, monospace;'}, vnode.state.account),
                    m("button.btn btn-sm btn-outline-secondary", {
                        style:"margin-left:10px;",
                        onclick: toggleFollowing.bind(null, vnode)
                    }, followBtn)
                ),
                m("div", "Timestamp: ", m(TimestampCycler, {timestamp: vnode.state.result.timestamp})),
                m("div.dropdown", {style:'word-wrap:break-word;'},
                    "Cid: ", vnode.state.cidLink,
                    m("div.dropdown-menu",
                        m("a.dropdown-item", {href:"#", onclick: onManualUploadToIpfs.bind(null, vnode)}, m("i.fas fa-upload"), " Upload to IPFS"),
                        m("a.dropdown-item", {target:"_blank", href:window.preferedIpfsGateway + '/api/v0/dag/get?arg=' + vnode.state.cid}, m("i.fas fa-binoculars"), " View IPFS content"),
                        m(m.route.Link, {class:"dropdown-item", href:"/ipfscheck/" + vnode.state.cid}, m("i.fas fa-globe"), " IPFS Dist. Checker"),
                        m(m.route.Link, {class:"dropdown-item", href:"/ipldview/" + vnode.state.cid}, m("i.fas fa-project-diagram"), " IPLD Viewer")
                    )
                ),
                (function() {
                    if (vnode.state.result.cborData) {
                        return m("pre", vnode.state.decodedData);
                    } else {
                        if (vnode.state.queryInProgress)
                            return m("div.spinner-border", {style:"margin-top:10px;margin-left:20px;"})
                        else
                            return m("div.alert alert-info", {style:"margin-top:20px;"}, m("i.fas fa-exclamation-triangle"), " Either data was not provided or was too large to be saved. Click on the Cid link above to try access via IPFS.");
                    }
                })(),
                m("div.row", {style:"margin-top:50px;margin-bottom:20px;"},
                    m("div.col-sm-6", [
                        m("div", {style:"font-weight:bold;"}, "Signature: "),
                        m("div", {style:'word-wrap:break-word;font-family:"Courier New", Courier, monospace;max-width:330px;'}, vnode.state.result.signature)
                    ]),
                    m("div.col-sm-6",
                        m("div", {style:"font-weight:bold;"}, "Browser/client side verification:"),
                        m("div", "Signature: ", vnode.state.sigVerifyCheck),
                        m("div", "Content hash: ", vnode.state.cidVerifyCheck)
                    )
                )
            ]

        }
    }

})
