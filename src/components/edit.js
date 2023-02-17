'use strict';

define([
    'lib/refreshlistener',
    'lib/blogger',
    'components/limits',
    'components/ipldbreadcrumbs'
], function(
    RefreshListener,
    Blogger,
    Limits,
    IpldBreadcrumbs
) {

    var onPrepareClick = function(vnode) {

        vnode.state.warnings = [];

        var rawData = $('#frm-data').val();
        var timestamp = Math.round((new Date()).getTime() / 1000);

        // ensure timestamp is newer
        if (vnode.state.existingTimestamp >= timestamp) {
            vnode.state.warnings.push("Timestamp not newer than existing, check your computer clock.");
            return false;
        }

        try {
          rawData = JSON.parse(rawData)
        } catch(err){}

        vnode.state.linkedSet.update(vnode.state.currentPath, rawData, {encodeFromText: true})
        vnode.state.cid = vnode.state.linkedSet.rootNode.cid.toString();
        vnode.state.byteSize = vnode.state.linkedSet.getDocSizeAtPath(vnode.state.currentPath);
        vnode.state.links = vnode.state.linkedSet.getLinksWithPath(vnode.state.currentPath, {onlyDagCborLinks: true});
        
        vnode.state.linkedSet.sign()
        .then(()=>{
          vnode.state.signature = "0x" + vnode.state.linkedSet.signature.toString('hex');
          vnode.state.btnPrepareAndSignEnabled = false;
          vnode.state.btnPublishEnabled = true;

          renderCidAndSig(vnode);
          renderBtnPrepareAndSign(vnode);
          renderBtnPublish(vnode)
          m.redraw();
          setTimeout(()=>{
            document.getElementById("btnPublishBreak").scrollIntoView(false);
          }, 50)          
        })
        /*
            //if (vnode.state.byteSize > vnode.state.accountDetails.activeSizeLimit) {
            //    vnode.state.warnings.push("The paste data is larger than this account is currently allowed. Consider moving some of the data into a separate IPLD doc on IPFS and link to it. Click on the CID link below to manually upload via your configured IPFS node.")
        */
    }

    var onPublishClick = function(vnode, e) {

        e.preventDefault();

        vnode.state.btnPublishEnabled = false;
        renderBtnPublish(vnode);
        vnode.state.publishProgress = "publishing";
        m.redraw();
        document.getElementById("btnPublishBreak").scrollIntoView(false);

        vnode.state.linkedSet.publish()
        .then(function(response) {
            if (response.error) {
                vnode.state.publishProgress = "error";
                if (response.error.message)
                    $.growl.error({message: response.error.message})
                else
                    $.growl.error({message: response.error})
            } else {
                vnode.state.publishProgress = "done";
                RefreshListener.trigger('newpaste');
                Blogger.clearCacheFor(libwip2p.Account.getWallet().address);

                // if we follow ourselves? manually add the new timestamp which will refresh the following status
                var account = libwip2p.Account.getWallet().address;
                if (libwip2p.Following.isFollowing(account)) {
                    libwip2p.Following.addNewPaste(account, vnode.state.sigBundle.timestamp);
                }

                vnode.state.linkedSet = null;
                vnode.state.currentPath = "/";
                fetchAccountDetails(vnode);
            }
        })
        .catch(function(err){
            if (err.message)
                $.growl.error({message: err.message})
            else
                $.growl.error({message: err})
        })
    }

    var onRequestInviteStatus = function(vnode, e) {
      var session;
      libwip2p.Peers.getActivePeerSession()
      .then((_session)=>{
        session = _session;
        return session.sendMessage({
          method: "ui_requestInvite",
          params: ["status"]
        })
      })
      .then(function(response){
        if (!response.result.key && !response.result.nokey) {
          $.growl.error({message: 'no invites available from this peer'})
        } else if (response.result.key) {
          // show invite modal
          showInviteModal(vnode, response.result.nokey);
        } else {
          doRequestInvite(vnode)
        }
      })
      .catch((err)=>{
        var errStr;
        errStr = err.message;
        if (err.message == 'account already exists') {
          errStr = 'account has already been auto-invited';
        }
        $.growl.error({message: errStr})
      })
    }

    var doRequestInvite = function(vnode, key) {
      var session;
      libwip2p.Peers.getActivePeerSession()
      .then((_session)=>{
        session = _session;
        var params = [];
        if (key != null)
          params.push(key)
        return session.sendMessage({
          method: "ui_requestInvite",
          params: params
        })
      })
      .then(function(response){
        if (response.error) {
          $.growl.error({message: response.error})
        } else {
          vnode.state.btnRequestInvite = null;
          vnode.state.accountNotFound = null;
          vnode.state.cidAndSig = null;
          vnode.state.btnPrepareAndSignEnabled = true;

          renderBtnPrepareAndSign(vnode);
          fetchAccountDetails(vnode);
          $('#modal').modal('hide');
        }
      })
      .catch((err)=>{
        $.growl.error({message: err.message})
        console.log(err)
      })
    }

    var onManualUploadToIpfs = function(vnode, e) {
        e.preventDefault();
        new Promise(function(resolve, reject) {
            var boundary = '----IPFSUPLOADBOUNDARY' + (Math.random() * 100000) + '.' + (Math.random() * 100000);
            var payload = Buffer.concat([
                Buffer.from('--' + boundary + "\r\nContent-Disposition: form-data; name=\"path\"\r\nContent-Type: application/octet-stream\r\n\r\n", 'utf8'),
                vnode.state.sigBundle.cborPasteDoc,
                Buffer.from("\r\n--" + boundary + "--")
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

    var renderCidAndSig = function(vnode) {
      vnode.state.cidAndSig = m("div.alert alert-primary",
        m("div.dropdown", m("span.badge bg-primary", "CID"), " = ", m("a", {href: "#", "data-bs-toggle":"dropdown", style:'word-wrap:break-word;font-family:"Courier New", Courier, monospace;'}, vnode.state.cid),
          m("div.dropdown-menu",
            m("a.dropdown-item", {href:"#", onclick: onManualUploadToIpfs.bind(null, vnode)}, m("i.fas fa-upload"), " Upload to IPFS"),
            m("a.dropdown-item", {target:"_blank", href:window.preferedIpfsGateway + '/api/v0/dag/get?arg=' + vnode.state.cid}, m("i.fas fa-binoculars"), " View IPFS content"),
            m(m.route.Link, {selector:"a.dropdown-item", href:"/ipfscheck/" + vnode.state.cid, oncreate: m.route.link}, m("i.fas fa-globe"), " IPFS Dist. Checker"),
            m(m.route.Link, {selector:"a.dropdown-item", href:"/ipldview/" + vnode.state.cid}, m("i.fas fa-project-diagram"), " IPLD Viewer")
          )
        ),
        m("div", {style:'margin-top:5px;word-wrap:break-word;font-family:"Courier New", Courier, monospace;'}, m("span.badge bg-primary", "Signature"), " = ", vnode.state.signature)
      )
    }

    var renderBtnPublish = function(vnode) {
        if (vnode.state.btnPublishEnabled == false) {
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

    var renderBtnRequestInvite = function(vnode) {
        if (vnode.state.queryInProgress) {
          vnode.state.btnRequestInvite = null
          return;
        }

        if (vnode.state.accountDetails == 'account not found' || vnode.state.accountDetails == null) {
            vnode.state.btnRequestInvite = m("button.btn.btn-secondary btn-warning", {onclick:onRequestInviteStatus.bind(this, vnode), style:"margin-bottom:5px;"},
                m("i.fas fa-user-plus"), " ",
                "Request invite"
            )
        } else {
            vnode.state.btnRequestInvite = null
        }
    }

    var renderBtnPrepareAndSign = function(vnode) {
        if (vnode.state.btnPrepareAndSignEnabled == false) {
            vnode.state.btnPrepareAndSign = m("button.btn.btn-secondary disabled", {style:"margin-bottom:5px;"},
                m("i.fas fa-pen"), " ",
                "Prepare & Sign"
            )
        } else {
            vnode.state.btnPrepareAndSign = m("button.btn.btn-primary", {style:"margin-bottom:5px;", onclick: onPrepareClick.bind(this, vnode)},
                m("i.fas fa-pen"), " ",
                "Prepare & Sign"
            )
        }
    }

    var onMsgChange = function(vnode, e) {

        // update our state vars
        if (vnode.state.msg == e.target.value)
            return;

        vnode.state.cidAndSig = null;
        vnode.state.msg = e.target.value;        
        vnode.state.signature = null;
        vnode.state.byteSize = 'recalc';
        vnode.state.cid = null;
        vnode.state.warnings = [];

        vnode.state.btnPublishEnabled = false;
        vnode.state.btnPrepareAndSignEnabled = true;

        renderBtnPrepareAndSign(vnode);
        renderBtnPublish(vnode);
    }

    var fetchAccountDetails = function(vnode) {
        vnode.state.queryInProgress = true;
        vnode.state.msg = "";

        return libwip2p.Account.fetchDetails(vnode.state.account)
        .then(function(accountDetails) {

          vnode.state.accountDetails = accountDetails;
          vnode.state.byteSize = 0;

            if (accountDetails == 'account not found') {
              vnode.state.queryInProgress = false;
              vnode.state.accountNotFound = true;
              renderBtnRequestInvite(vnode);
              m.redraw();
              return;
            }

            if (vnode.state.accountDetails.hasOwnProperty('activeSizeLimit') == false || vnode.state.accountDetails.activeSizeLimit == 0) {
              vnode.state.accountDetails.activeSizeLimit = 64 * 1024;
            }

            let ls = new libwip2p.LinkedSet()
            ls.address = vnode.state.account;
            vnode.state.linkedSet = ls;
            ls.fetch(vnode.state.account, "/")
            .then((content)=>{
              vnode.state.byteSize = ls.rootNode.sizeBytes
              vnode.state.msg = ls.getContentByPath("/", {outputAsText: true, dontResolveCidsInContent: true})
              if (vnode.state.msg == '{}') {
                vnode.state.msg = "";
              }
              vnode.state.links = ls.getLinksWithPath(vnode.state.currentPath, {onlyDagCborLinks: true});

              vnode.state.queryInProgress = false;
              m.redraw();
            }) 
        })
        .catch(function(err){
          if (err == 'peerSession not ready') {}
          else if (err.message == 'peerSession not ready') {}
          else if (err == 'account not found') {
            vnode.state.queryInProgress = false;
            vnode.state.activeSizeLimit = 32;
            vnode.state.accountNotFound = true;
            renderBtnRequestInvite(vnode);
            m.redraw();
          } else {
            //console.log(err);
            if (err.message)
              $.growl.error({message: err.message});
            else
              $.growl.error({message: err});
          }
        })
    }

    var onPasteRecalc = function(vnode, e) {
        if (vnode.state.msg == "") {
          vnode.state.byteSize = 0;
          return;
        }

        let ls = new libwip2p.LinkedSet()
        ls.update("/", vnode.state.msg, {createMissing: true, encodeFromText: true})

        vnode.state.byteSize = ls.rootNode.sizeBytes;
    }

    var onPageReload = function(vnode, e) {
        e.preventDefault();

        vnode.state.limits = {};
        vnode.state.msg = null;
        vnode.state.nextUpgradeText = null;
        vnode.state.warnings = [];

        vnode.state.hashOnlyWarning = null;
        vnode.state.cidAndSig = null;
        vnode.state.signature = null;
        vnode.state.remainingBytes = 'pending';
        vnode.state.cid = null;
        vnode.state.publishProgress = null;
        vnode.state.btnPublishEnabled = false;
        vnode.state.btnPrepareAndSignEnabled = true;

        renderBtnPublish(vnode);
        renderBtnPrepareAndSign(vnode);


        fetchAccountDetails(vnode);
        //fetchLimits(vnode);

        window.scrollTo(0,0);
    }

    var showInviteModal = function(vnode, showNoKey, e) {

      if (e != null) {
        e.preventDefault();
      }

      var enableKeyBtn = false;
      var key;
      var checkKey = function(e) {
        e.redraw=false;
        key = $('#inviteKey').val()
        var newStatus;
        if (key.length == 32) {
          newStatus = true;
        } else {
          newStatus = false;
        }
        if (enableKeyBtn != newStatus) {
          enableKeyBtn = newStatus;
          e.redraw=true;
        }
      }

      var modalContent = {
        view: function(){
          return [
              m("div.modal-header",
              m("h5.modal-title","Request Invite"),
                  m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
              ),
              m("div.modal-body",
                  m("form",
                      m("div.form-group",
                          m("label", {for:"peerAddress"}, "Invite Key"),
                          m("input.form-control", {type:"text", id:"inviteKey",
                           onchange: checkKey,
                           onkeypress: checkKey,
                           onpaste: checkKey,
                           oninput: checkKey
                          })
                      )
                  )
              ),
              m("div.modal-footer",
                m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"}, "Cancel"),
                (function(){
                  var btns = []
                  if (showNoKey) {
                    if (enableKeyBtn) {
                      btns.push(m("button.btn btn-warning disabled", {type:"button"}, "Request without key"))
                    } else {
                      btns.push(m("button.btn btn-warning", {type:"button", onclick: doRequestInvite.bind(null, vnode, null)}, "Request without key"))
                    }
                  }
                  if (enableKeyBtn) {
                      btns.push(m("button.btn btn-primary", {type:"button", onclick: doRequestInvite.bind(null, vnode, key)}, "Request using invite key"))
                  } else {
                      btns.push(m("button.btn btn-primary disabled", {type:"button"}, "Request using invite key"))
                  }
                  return btns;
                })()
              )
          ]
      }}

      m.mount($('.modal-content').get(0), modalContent);
      $('#modal').modal('show');
      $('#inviteKey').focus();
    }

    let onLinkifyClick = function(vnode) {
      let linkifyPath = document.getElementById("linkifyPath").value;

      let ls = vnode.state.linkedSet;
      try {
        if (ls.isPathACid(linkifyPath)) {
          vnode.state.linkifyError = m("div.invalid-feedback", {style:"display:inherit;"}, "already linked")
          return;
        } else {
          ls.linkify(linkifyPath)
        }
      } catch(err) {
        if (typeof err == 'object') {
          vnode.state.linkifyError = m("div.invalid-feedback", {style:"display:inherit;"}, err.message)
        } else {
          vnode.state.linkifyError = m("div.invalid-feedback", {style:"display:inherit;"}, err)
        }
        m.redraw();
        return;
      }
      
      vnode.state.byteSize = ls.rootNode.sizeBytes
      vnode.state.msg = ls.getContentByPath(vnode.state.currentPath, {outputAsText: true, dontResolveCidsInContent: true})
      vnode.state.links = ls.getLinksWithPath(vnode.state.currentPath, {onlyDagCborLinks: true});

      vnode.state.btnPrepareAndSignEnabled = true;
      vnode.state.btnPublishEnabled = false;
      vnode.state.cid = null;
      vnode.state.signature = null;
      vnode.state.cidAndSig = null;

      renderBtnPrepareAndSign(vnode);
      renderBtnPublish(vnode)
      m.redraw();
    }

    let onNavigateClick = function(path, cid, vnode, e){
      e.preventDefault()
      
      if (vnode.state.currentPath == "/") {
        vnode.state.currentPath = path;
      } else {
        vnode.state.currentPath += path;
      }
      
      let ls = vnode.state.linkedSet;
      let ln = ls.getContentByPath(vnode.state.currentPath, {preferLinkedNode: true})

      if (ln.docBytes == null || ln.docBytes.length == 0) {
        ls.fetchCid(cid)
        .then((result)=>{
          vnode.state.byteSize = ln.sizeBytes
          vnode.state.msg = ls.getContentByPath(vnode.state.currentPath, {outputAsText: true, dontResolveCidsInContent: true})
          vnode.state.links = ln.getLinksWithPath({onlyDagCborLinks: true});
          m.redraw();
        })
      } else {
        vnode.state.byteSize = ln.sizeBytes
        vnode.state.msg = ls.getContentByPath(vnode.state.currentPath, {outputAsText: true, dontResolveCidsInContent: true})
        vnode.state.links = ln.getLinksWithPath({onlyDagCborLinks: true});
        m.redraw();
      }
    }

    let onBreadcrumbClick = (vnode, idx)=>{
      let pathParts = vnode.state.currentPath.split("/")
      pathParts.splice(0,1)
      pathParts.splice(idx, pathParts.length)
      vnode.state.currentPath = "/" + pathParts.join("/")

      let ls = vnode.state.linkedSet;
      vnode.state.byteSize = ls.rootNode.sizeBytes
      vnode.state.msg = ls.getContentByPath(vnode.state.currentPath, {outputAsText: true, dontResolveCidsInContent: true})
      vnode.state.links = ls.getLinksWithPath(vnode.state.currentPath, {onlyDagCborLinks: true});
    }

    return {
        oninit: function(vnode) {

            vnode.state.signature = null;
            vnode.state.lastMsgChange = null;
            vnode.state.queryInProgress = true;
            vnode.state.publishProgress = null;

            vnode.state.btnPrepareAndSign = null;
            vnode.state.btnPublish = null;
            vnode.state.btnPublishEnabled = false;
            vnode.state.btnRequestInvite = null;

            vnode.state.linkedSet = null;
            vnode.state.links = []
            vnode.state.currentPath = "/"

            vnode.state.warnings = [];

            renderBtnPrepareAndSign(vnode);
            renderBtnPublish(vnode);
            //renderBtnRequestInvite(vnode);

            // what to do if account changes
            vnode.state.accountChangeSubscriptionIdx = libwip2p.Account.subscribeAccountChange(function() {

                vnode.state.msg = null;
                vnode.state.warnings = [];

                vnode.state.hashOnlyWarning = null;
                vnode.state.cidAndSig = null;
                vnode.state.signature = null;
                vnode.state.cid = null;
                vnode.state.publishProgress = null;
                vnode.state.btnPublishEnabled = false;

                renderBtnPrepareAndSign(vnode);
                renderBtnPublish(vnode);

                vnode.state.account = libwip2p.Account.getWallet().address;
                vnode.state.accountDetails = null;
                fetchAccountDetails(vnode);
            })

            vnode.state.peerConnectHandler = function() {
              vnode.state.accountDetails = null;
              fetchAccountDetails(vnode);
            }
            libwip2p.Peers.events.on('peerconnected', vnode.state.peerConnectHandler)

            vnode.state.peerDisconnectHandler = function() {
              vnode.state.queryInProgress = false;
              m.redraw();
            }
            libwip2p.Peers.events.on('peerdisconnected', vnode.state.peerDisconnectHandler)

            vnode.state.account = libwip2p.Account.getWallet().address;
            vnode.state.accountDetails = null;

            libwip2p.Peers.getActivePeerSession()
            .then((session)=>{
              if (session.connState == 4) {
                fetchAccountDetails(vnode);
              }
            });
        },

        onremove: function(vnode) {
            libwip2p.Account.unsubscribeAccountChange(vnode.state.accountChangeSubscriptionIdx);
            libwip2p.Peers.events.off('peerconnected', vnode.state.peerConnectHandler);
            libwip2p.Peers.events.off('peerdisconnected', vnode.state.peerDisconnectHandler);
        },

        view: function(vnode) {

            var readOnly = false;
            var pageReload = null;
            var publishingText;
            if (vnode.state.publishProgress == "publishing") {
                readOnly = true;
                publishingText = m("span", {style:"font-weight:bold;"}, "Publishing to peer...");
                pageReload = m("button.btn btn-secondary disabled", m("i.fas fa-sync"), " ", "Reload page");
            } else if (vnode.state.publishProgress == "done") {
                readOnly = true;
                publishingText = m("span", {style:"font-weight:bold;"}, "Publish complete.");
                pageReload = m("button.btn btn-primary", {onclick: onPageReload.bind(null, vnode)}, m("i.fas fa-sync"), " ", "Reload page")
            } else if (vnode.state.publishProgress == "error") {
                readOnly = true;
                publishingText = m("span", {style:"font-weight:bold;"}, "Publish error.");
                pageReload = m("button.btn btn-primary", {onclick: onPageReload.bind(null, vnode)}, m("i.fas fa-sync"), " ", "Reload page")
            }

            return m("div",
                m("div",
                    m("div",
                      "Content:", m(IpldBreadcrumbs, {onLinkClick: onBreadcrumbClick.bind(null, vnode), wrapperStyle: "margin-left:10px;display:inline-block;", path: ("root" + vnode.state.currentPath).split("/")}),
                    ),
                    (function(){
                        if (vnode.state.queryInProgress == true) {
                            return m("div.spinner-border", {style:"margin-bottom:15px;"})
                        } else {
                            return m("textarea.form-control", {
                                id:"frm-data", style:"max-widthx:800px;height:300px;",
                                oninput: onMsgChange.bind(this, vnode),
                                value: vnode.state.msg,
                                readonly: readOnly
                            })
                        }
                    })(),
                    m("div", {style:"margin-top:10px;"},
                      m("div", "Links:"),
                      m("div", {style:"border:1px solid #ced4da;border-radius:5px;padding:10px;"},
                        m("div.input-group", {style:"max-width:600px;"},
                          m("input.form-control", {type:"text", id:"linkifyPath", placeholder:"/root/some/path"}),
                          m("button.btn btn-outline-secondary", {onclick: onLinkifyClick.bind(null, vnode)}, "Linkify"),                          
                        ),
                        vnode.state.linkifyError,                        
                        m("div", {style:"margin-top:10px;"},
                          (()=>{
                            if (vnode.state.links.length == 0) {
                              return m("div", "No links")
                            }
                          })(),
                          m("table.table table-striped",
                          m("tbody",
                              vnode.state.links.map((link, idx)=>{
                                return m("tr", m("td",
                                  m("div.col-12", 
                                    m(m.route.Link, {href:"#", onclick: onNavigateClick.bind(null, link.path, link.cid, vnode)}, link.path),
                                    " --> ", 
                                    m(m.route.Link, {href:"#", style:"font-family:andale mono, monospace;word-break: break-all;"}, link.cid)
                                  )
                                ))
                              })
                            )
                          )
                        )
                      )                      
                    ),                  
                    m(Limits, {
                        pasteRecalcCallback: onPasteRecalc.bind(this, vnode),
                        accountDetails: vnode.state.accountDetails,
                        byteSize: vnode.state.byteSize
                    }),
                    m("br"),
                    vnode.state.warnings.map(function(warning) {
                        return m("div.alert alert-danger", m("i.fas fa-exclamation-triangle"), " ", warning);
                    }),
                    (function(){
                      if (vnode.state.accountNotFound) {
                        return m("div.alert alert-warning", m("i.fas fa-exclamation-triangle"), " ", "Account not found, request an invite to publish.");
                      }
                    })(),
                    vnode.state.cidAndSig,
                    vnode.state.publishWarnings,
                    vnode.state.btnPrepareAndSign, " ",
                    vnode.state.btnPublish, " ",
                    vnode.state.btnRequestInvite, " ",
                    publishingText, " ",
                    pageReload,
                    m("div", {id:"btnPublishBreak", style:"padding-bottom:20px;"})
                )
            )
        }
    }
})
