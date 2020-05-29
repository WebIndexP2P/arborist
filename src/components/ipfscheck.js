'use strict';

define([
    'lib/pastedoc',
    'lib/refreshlistener'
], function(
    PasteDoc,
    RefreshListener
) {

    var defaultIpfsPubNodesProvider = "0xdf66019796d5214d1dad0aa671f70e1e079aee10";

    var fetchIPs = function(vnode) {
      vnode.state.ipsLoaded = m("span.badge badge-warning", {style:"float:right;"}, "loading nodes...");
      return libwip2p.Peers.getActivePeerSession()
      .then((session)=>{
        return session.sendMessage({
          method: "bundle_get",
          params: [{account:defaultIpfsPubNodesProvider}]
        })
      })
      .then(function(response){
        if (response.error) {
          $.growl.error({message: "Could not load public IPFS nodes"});
          return [];
        }

        return PasteDoc.deserialize(response.result.cborData)
        .then(function(doc) {
          var opennodes = []
          for (var a = 0; a < Object.keys(doc).length; a++) {
              opennodes.push(doc[a])
          }
          return opennodes;
        })
      })
      .catch((err)=>{
        console.log(err)
        vnode.state.ipsLoaded = null;
        vnode.state.openNodes = []
      })
    }

    var randomIntFromInterval = function(min, max) { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    var addFiveAndGo = function(vnode) {

        var candidates = [];
        for (var a = 0; a < vnode.state.openNodes.length; a++) {
            var key = vnode.state.openNodes[a].h;
            if (key == null)
                key = vnode.state.openNodes[a].i;

            vnode.state.openNodes[a].key = key;

            if (vnode.state.scannedNodesIndex.hasOwnProperty(key) == true)
                continue;

            if (vnode.state.useCorsProxy == false) {
                if (window.location.protocol == 'https:' && vnode.state.openNodes[a].hasOwnProperty('i'))
                    continue;
                if (vnode.state.openNodes[a].hasOwnProperty('a') == false)
                    continue;
            }

            candidates.push(vnode.state.openNodes[a]);
        }

        if (candidates.length == 0) {
            $.growl.warning({message: "No more public nodes"});
            return;
        }

        if (vnode.state.cid.length < 20) {
            $.growl.error({message: "Requires a valid content hash (CID)"});
            return;
        }

        vnode.state.goBtnDisabled = true;


        for (let b = 0; b < 5; b++) {
            let idx = randomIntFromInterval(0, candidates.length - 1);
            var nodeToCheck = candidates[idx];
            let key = nodeToCheck.key;
            if (nodeToCheck.hasOwnProperty('h'))
                nodeToCheck.url = "https://" + nodeToCheck.h;
            else
                nodeToCheck.url = "http://" + nodeToCheck.i + ":8080";

            vnode.state.scannedNodesIndex[nodeToCheck.key] = nodeToCheck;
            vnode.state.scannedNodesSequence.unshift(nodeToCheck.key);
            candidates.splice(idx, 1);

            nodeToCheck.state = 'pending';
            setTimeout(function() {
                doCheck(vnode, key);
            }, b * 500);

            if (candidates.length == 0)
                break;
        }

        setTimeout(function() {
            vnode.state.goBtnDisabled = false;
            m.redraw();
        }, 3000);

        m.redraw();
    }

    var doCheck = function(vnode, nodeKey) {

        var node = vnode.state.scannedNodesIndex[nodeKey];
        node.state = 'checking';
        m.redraw();

        var url;
        if (vnode.state.useCorsProxy) {
            var path = "/ipfs/";
            if (node.po)
                path = node.po;
            url = "https://cors-anywhere.herokuapp.com/" + node.url + path + vnode.state.cid;
        } else {
            //url = node.url + "/ipfs/" + cid;
            url = node.url + "/api/v0/dag/get?arg=" + vnode.state.cid;
        }

        m.request({
            method: "GET",
            url: url,
            extract: function(xhr, options){
                //console.log(xhr)
                //console.log(options)
                return xhr.responseText;
            }
        })
        .then(function(response){
            //console.log(response)
            node.state = 'success'
            m.redraw();
        })
        .catch(function(err) {
            //console.log(err)
            if (err.message.indexOf("unknown node type") >= 0 ||
                err.message.indexOf("unrecognized node type") >= 0) {
                node.state = 'success'
            } else {
                node.state = 'fail'
                if (err.message.indexOf("The number of requests is limited to") >= 0) {
                    $.growl.error({message: err.message});
                }
            }
            m.redraw();
        })
    }

    var toggleCorsProxy = function(vnode) {
        if (vnode.state.useCorsProxy) {
            vnode.state.useCorsProxy = false;
        } else {
            vnode.state.useCorsProxy = true;
        }
    }

    return {

        oninit: function(vnode) {

            vnode.state.ips = [];
            vnode.state.scannedNodesIndex = {};
            vnode.state.scannedNodesSequence = [];
            vnode.state.ipsLoaded = null;
            vnode.state.goBtnDisabled = false;
            vnode.state.useCorsProxy = true;
            vnode.state.cid = "";
            vnode.state.openNodes = [];

            if (m.route.param().cid)
                vnode.state.cid = m.route.param().cid;

            vnode.state.peerConnectHandler = function() {
              fetchIPs(vnode)
              .then(function(opennodes) {
                  if (Array.isArray(opennodes)) {
                    vnode.state.openNodes = opennodes;
                  }
                  vnode.state.ipsLoaded = m("span.badge badge-success", {style:"float:right;"}, vnode.state.openNodes.length + " public IPFS nodes loaded");
                  m.redraw();
              })
            }
            libwip2p.Peers.events.on('peerconnected', vnode.state.peerConnectHandler)

            fetchIPs(vnode)
            .then(function(opennodes) {
                if (Array.isArray(opennodes)) {
                  vnode.state.openNodes = opennodes;
                }
                vnode.state.ipsLoaded = m("span.badge badge-success", {style:"float:right;"}, vnode.state.openNodes.length + " public IPFS nodes loaded");
                m.redraw();
            })
        },

        onremove: function(vnode) {
          libwip2p.Peers.events.off('peerconnected', vnode.state.peerConnectHandler);
        },

        view: function(vnode) {

            var goBtn;
            if (vnode.state.goBtnDisabled) {
                goBtn = m("button.btn btn-outline-secondary disabled", "Go")
            } else {
                goBtn = m("button.btn btn-outline-primary", {onclick:addFiveAndGo.bind(null, vnode)}, "Go")
            }

            var corsCheckbox = {type:"checkbox", checked: true, onclick: toggleCorsProxy.bind(null, vnode)};
            if (vnode.state.useCorsProxy == false) {
                corsCheckbox.checked = false;
            }

            return m("div.row",
                m("div.col offset-md-1 col-md-10",
                    m("h4", {style:"text-align:center;"}, "IPFS Distribution Checker"),
                    m("div.form-group",
                        vnode.state.ipsLoaded,
                        m("label", "Content Hash (CID)"),
                        m("div.input-group mb-3",
                            m("input.form-control", {id:"ipfscheck_cid", type:"text", value: vnode.state.cid, onchange: function(e){vnode.state.cid = e.target.value;}}),
                            m("div.input-group-append",
                                goBtn
                            )
                        ),
                        m("div.form-check", {style:"margin-bottom:10px;"},
                            m("input.form-check-input", corsCheckbox),
                            m("label.form-check-label",
                                "Use CORS proxy (", m("a", {target:"_blank", href:"https://cors-anywhere.herokuapp.com/"}, "https://cors-anywhere.herokuapp.com/"), ")"
                            )
                        ),
                        m("ul.list-group",
                            vnode.state.scannedNodesSequence.map(function(key) {
                                var node = vnode.state.scannedNodesIndex[key];

                                var badgeColor = 'warning';
                                if (node.state == 'success') badgeColor = 'success';
                                else if (node.state == 'fail') badgeColor = 'danger';
                                else if (node.state == 'pending') badgeColor = 'info';

                                return m("li.list-group-item",
                                    node.url,
                                    m("span.badge badge-" + badgeColor, {style:"float:right;"}, node.state)
                                )
                            })
                        )
                    )
                )
            )
        }

    }

})
