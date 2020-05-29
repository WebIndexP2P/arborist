'use strict';

define([
    'gx/js-cid/cids.min',
    'lib/pastedoc',
    'lib/refreshlistener',
    'lib/ipldwalk',
    'components/limits',
    'components/importtreeview'
], function(
    Cid,
    PasteDoc,
    RefreshListener,
    IpldWalk,
    Limits,
    ImportTreeView
) {

    var onGoClick = function(vnode) {

        //reset form state
        vnode.state.errorMessage = null;
        vnode.state.warnings = [];
        vnode.state.btnGoEnabled = false;
        vnode.state.btnPrepareAndSignState = 'hidden';
        vnode.state.btnPublishState = 'hidden';
        vnode.state.signature = null;
        vnode.state.publishProgress = null;

        renderBtnGoElement(vnode);
        renderBtnPrepareAndSign(vnode);
        renderBtnPublish(vnode);
        renderSigElement(vnode);
        renderPublishProgress(vnode);

        var tmpCid;
        try {
            tmpCid = new Cid(vnode.state.cid);
        } catch(err) {
            vnode.state.errorMessage = m("div.alert alert-danger", "Invalid CID")
            vnode.state.btnGoEnabled = true;
            renderBtnGoElement(vnode);
            return;
        }

        if (tmpCid.codec != 'dag-cbor') {
            vnode.state.errorMessage = m("div.alert alert-danger", "Pastes can only be in dag-cbor format")
            vnode.state.btnGoEnabled = true;
            renderBtnGoElement(vnode);
            return;
        }

        // we didn't bail, so redraw state changes
        m.redraw();

        vnode.state.ipldwalk = new IpldWalk();
        vnode.state.ipldwalk.onPinChange = calcRemainingBytes.bind(null, vnode);
        vnode.state.ipldwalk.navigateDown("/", vnode.state.cid.toString())
        .then(function() {

            vnode.state.btnGoEnabled = true;
            vnode.state.btnPrepareAndSignState = 'enabled';
            vnode.state.btnPublishState = 'disabled';

            renderBtnPrepareAndSign(vnode);
            renderBtnPublish(vnode);

            calcRemainingBytes(vnode);
            renderBtnGoElement(vnode);

            m.redraw();
        })
        .catch(function(err){
            vnode.state.btnGoEnabled = true;
            renderBtnGoElement(vnode);
            m.redraw();

            console.error(err);
            $.growl.error({message: err.message});
        })
    }

    var onInput = function(vnode, e) {
        if (e.keyCode && e.keyCode == 13) {
            onGoClick(vnode);
        } else {
            vnode.state.cid = e.target.value;
        }
    }

    var onPublishClick = function(vnode) {
        vnode.state.btnPublishState = "disabled";
        vnode.state.publishProgress = "publishing";
        renderBtnPublish(vnode);
        renderPublishProgress(vnode);

        m.redraw();
        //document.getElementById("btnPublishBreak").scrollIntoView(false);

        var postData = {
            account: vnode.state.account,
            timestamp: vnode.state.sigBundle.timestamp,
            mhash_b64: vnode.state.sigBundle.bMultihash.toString('base64'),
            sig_b64: vnode.state.sigBundle.bSignature.toString('base64'),
            pastedata: vnode.state.ipldwalk.getPinnedAsBase64()
        }

        return PasteDoc.post(postData)
        .then(function(response) {
            if (response.error) {
                vnode.state.publishProgress = "error";
                $.growl.error({message: response.error.message});
            } else {
                vnode.state.publishProgress = "done";
                RefreshListener.trigger('latestpastes');

                // if we follow ourselves? manually add the new timestamp which will refresh the following status
                if (Following.isFollowing(vnode.state.account)) {
                    Following.addNewPaste(vnode.state.account, vnode.state.sigBundle.timestamp);
                }
            }
            renderPublishProgress(vnode);
        })
        .catch(function(err){
            $.growl.error({message: err.message})
        })
    }

    var onPrepareClick = function(vnode) {
        vnode.state.warnings = [];

        var rootCid = vnode.state.cid;
        var timestamp = Math.round((new Date()).getTime() / 1000);

        // check remaining bytes (add to warnings if needed)
        calcRemainingBytes(vnode);

        // ensure they have pastes available
        if (vnode.state.limits.remainingPastes == 0) {
            vnode.state.warnings.push("This account has no more pastes available at the moment. Publish will fail.");
        }

        vnode.state.sigBundle = {};

        var cid = new Cid(rootCid);
        vnode.state.sigBundle.bMultihash = cid.multihash;

        var signature = Account.sign(timestamp, '0x' + cid.multihash.toString('hex'));
        vnode.state.sigBundle.bSignature = Bufferjs.Buffer.from(signature.substr(2));
        vnode.state.signature = '0x' + vnode.state.sigBundle.bSignature.toString('hex');
        vnode.state.sigBundle.timestamp = timestamp;

        renderSigElement(vnode);
        vnode.state.btnPrepareAndSignState = 'disabled';
        vnode.state.btnPublishState = 'enabled';
        renderBtnPublish(vnode);
        renderBtnPrepareAndSign(vnode);
        m.redraw();
        //document.getElementById("btnPublishBreak").scrollIntoView(false);
    }

    var onPageReloadClick = function(vnode) {
        if (vnode.state.publishProgress == 'error') {
            vnode.state.errorMessage = null;

            vnode.state.btnPublishState = 'hidden';
            vnode.state.btnPrepareAndSignState = 'hidden';
            vnode.state.btnGoEnabled = true;

            vnode.state.btnGoElement = null;
            vnode.state.sigElement = null;

            vnode.state.btnPublish = null;
            vnode.state.btnPrepareAndSign = null;
            vnode.state.btnReload = null;
            vnode.state.txtPublishStatus = null;

            vnode.state.warnings = [];
            vnode.state.limits = {}

            renderCummulativeStatsElement(vnode);
            renderBtnGoElement(vnode);

            vnode.state.account = Account.getWallet().address;
            fetchLimits(vnode);
        } else {
            m.route.set('/view/' + vnode.state.account);
        }
    }

    var renderPublishProgress = function(vnode) {
        if (vnode.state.publishProgress == null)
            vnode.state.txtPublishStatus = null;
            vnode.state.btnReload = null;
        if (vnode.state.publishProgress == "publishing") {
            vnode.state.txtPublishStatus = m("span", {style:"margin-left:5px;margin-right:5px;font-weight:bold;"}, "Publishing to peer...");
            vnode.state.btnReload = m("button.btn btn-secondary disabled", m("i.fas fa-sync"), " ", "Reload page");
        } else if (vnode.state.publishProgress == "done") {
            vnode.state.txtPublishStatus = m("span", {style:"margin-left:5px;margin-right:5px;font-weight:bold;"}, "Publish complete.");
            vnode.state.btnReload = m("button.btn btn-primary", {onclick: onPageReloadClick.bind(null, vnode)}, m("i.fas fa-binoculars"), " ", "View paste")
        } else if (vnode.state.publishProgress == "error") {
            vnode.state.txtPublishStatus = m("span", {style:"margin-left:5px;margin-right:5px;font-weight:bold;"}, "Publish error.");
            vnode.state.btnReload = m("button.btn btn-primary", {onclick: onPageReloadClick.bind(null, vnode)}, m("i.fas fa-sync"), " ", "Reload page")
        }
    }

    var renderSigElement = function(vnode) {
        if (vnode.state.signature == null) {
            vnode.state.sigElement = null;
            return;
        }
        vnode.state.sigElement = m("div.alert alert-primary",
            m("div", {style:'margin-top:5px;word-wrap:break-word;font-family:"Courier New", Courier, monospace;'}, m("span.badge badge-primary", "Signature"), " = ", vnode.state.signature)
        )
    }

    var renderBtnPrepareAndSign = function(vnode) {
        if (vnode.state.btnPrepareAndSignState == 'hidden') {
            vnode.state.btnPrepareAndSign = null;
            return;
        }
        if (vnode.state.btnPrepareAndSignState == 'disabled') {
            vnode.state.btnPrepareAndSign = m("button.btn.btn-secondary disabled", {style:"margin-bottom:5px;margin-right:5px;"},
                m("i.fas fa-pen"), " ",
                "Prepare & Sign"
            )
        } else {
            vnode.state.btnPrepareAndSign = m("button.btn.btn-primary", {style:"margin-bottom:5px;margin-right:5px;", onclick: onPrepareClick.bind(this, vnode)},
                m("i.fas fa-pen"), " ",
                "Prepare & Sign"
            )
        }
    }

    var renderBtnPublish = function(vnode) {
        if (vnode.state.btnPublishState == 'hidden') {
            vnode.state.btnPublish = null;
            return;
        }
        if (vnode.state.btnPublishState == "disabled") {
            vnode.state.btnPublish = m("button.btn.btn-secondary disabled", {style:"margin-bottom:5px;"},
                m("i.fas fa-cloud-upload-alt"), " ",
                "Publish"
            )
        } else {
            vnode.state.btnPublish = m("button.btn.btn-primary", {style:"margin-bottom:5px;", onclick: onPublishClick.bind(this, vnode)},
                m("i.fas fa-cloud-upload-alt"), " ",
                "Publish"
            )
        }
    }

    var renderBtnGoElement = function(vnode) {
        if (vnode.state.btnGoEnabled)
            vnode.state.btnGoElement = m("button.btn btn-outline-primary", {onclick: onGoClick.bind(null, vnode)}, "Go");
        else
            vnode.state.btnGoElement = m("button.btn btn-outline-primary disabled", "Searching...");
    }

    var fetchDetails = function(vnode) {
        libwip2p.Account.fetchDetails(vnode.state.account)
        .then(function(details) {
            vnode.state.accountDetails = details;
            m.redraw();
        })
        .catch(function(err){
            console.log(err);
            $.growl.error({message: err.message});
        })
    }

    return {

        oninit: function(vnode) {

            vnode.state.cid = "";

            vnode.state.errorMessage = null;

            vnode.state.btnPublishState = 'hidden';
            vnode.state.btnPrepareAndSignState = 'hidden';
            vnode.state.btnGoEnabled = true;

            vnode.state.btnGoElement = null;
            vnode.state.sigElement = null;

            vnode.state.btnPublish = null;
            vnode.state.btnPrepareAndSign = null;
            vnode.state.btnReload = null;
            vnode.state.txtPublishStatus = null;

            vnode.state.warnings = [];

            vnode.state.ipldwalk = null;
            vnode.state.ipldDocCount = 0;
            vnode.state.cummulativeSize = 0;

            renderBtnGoElement(vnode);

            vnode.state.account = libwip2p.Account.getWallet().address;

            vnode.state.peerConnectHandler = function() {
              fetchDetails(vnode);
            }
            libwip2p.Peers.events.on('peerconnect', vnode.state.peerConnectHandler)
        },

        onremove: function(vnode) {
          libwip2p.Peers.events.off('peerconnect', vnode.state.peerConnectHandler)
        },

        view: function(vnode) {

            //console.log('importpaste.js - onview')

            return m("div.row",
                m("div.col offset-md-1 col-md-10",
                    m("h4", {style:"text-align:center;"}, "Import Paste"),
                    m("div.form-group",
                        m("label", "CID:"),
                        m("div.input-group mb-3",
                            m("input.form-control", {type:"text", value: vnode.state.cid, onkeyup: onInput.bind(null, vnode), oninput: onInput.bind(null, vnode)}),
                            m("div.input-group-append",
                                vnode.state.btnGoElement
                            )
                        )
                    ),
                    vnode.state.errorMessage,
                    m(ImportTreeView, {ipldwalk: vnode.state.ipldwalk}),
                    m("hr"),
                    m(Limits, {
                      accountDetails: vnode.state.accountDetails,
                      byteSize: vnode.state.cummulativeSize
                    }),
                    vnode.state.warnings.map(function(warning) {
                        return m("div.alert alert-danger", m("i.fas fa-exclamation-triangle"), " ", warning);
                    }),
                    vnode.state.sigElement,
                    vnode.state.btnPrepareAndSign,
                    vnode.state.btnPublish,
                    vnode.state.txtPublishStatus,
                    vnode.state.btnReload
                )
            )
        }

    }
})
