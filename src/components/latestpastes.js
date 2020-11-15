'use strict';

define([
    'gx/ethereum-blockies/blockies.min',
    'lib/utils',
    'lib/refreshlistener'
], function(
    MakeBlockies,
    Utils,
    RefreshListener
) {

    var fetchLatestPastes = function(vnode) {

      var self = this;

      //Peers.sendMessage({method: "ui_getLatestPastes"})
      libwip2p.Peers.getActivePeerSession()
      .then((session)=>{
        if (session.connState == 4) {
          return session.sendMessage({method: "bundle_getRecent"})
        } else {
          throw new Error("peerSession not ready")
        }
      })
      .then(function(result){

          vnode.state.queryInProgress = false;

          if (result.error) {
              //console.error(result.error);
              if (result.error.message)
                $.growl.error({message: result.error.message});
              else
                $.growl.error({message: result.error});
              return;
          }

          if (Array.isArray(result.result)) {
            vnode.state.latestPastes = result.result;
          } else {
            $.growl.error({message: "unknown response"});
            vnode.state.latestPastes = [];
          }

          m.redraw();
      })
      .catch(function(err) {
        //console.log(err)
        if (err == 'peerSession not ready') {}
        else if (err.message == 'peerSession not ready') {}
        else {
          console.log(err);
          console.error("Problem communicating with peer, most likely a Cross-Origin policy problem (CORS)");
          $.growl.error({message: "Error communicating with peer, check browser console for logs."});
          vnode.state.queryInProgress = false;
        }
      })
    }

    return {

        oninit: function(vnode) {
            vnode.state.latestPastes = [];
            vnode.state.queryInProgress = true;

            vnode.state.newPasteHandler = function() {
              vnode.state.latestPastes = [];
              vnode.state.queryInProgress = true;
              fetchLatestPastes(vnode);
            }
            libwip2p.Peers.events.on('bundlereceived', vnode.state.newPasteHandler)

            vnode.state.peerConnectHandler = function() {
              vnode.state.latestPastes = [];
              vnode.state.queryInProgress = true;
              fetchLatestPastes(vnode);
            }
            libwip2p.Peers.events.on('peerconnected', vnode.state.peerConnectHandler)

            vnode.state.peerDisconnectHandler = function() {
              vnode.state.latestPastes = [];
              vnode.state.queryInProgress = false;
              m.redraw();
            }
            libwip2p.Peers.events.on('peerdisconnected', vnode.state.peerDisconnectHandler)

            vnode.state.latestPastes = [];
            vnode.state.queryInProgress = true;
            fetchLatestPastes(vnode);
        },

        onremove: function(vnode) {
          libwip2p.Peers.events.off('peerconnected', vnode.state.peerConnectHandler);
          libwip2p.Peers.events.off('peerdisconnected', vnode.state.peerDisconnectHandler);
          libwip2p.Peers.events.off('bundlereceived', vnode.state.newPasteHandler);
        },

        view: function(vnode) {

            if (vnode.state.queryInProgress) {
                return m("div", m("strong","Latest updates:"),
                    m("br"),
                    m("div.spinner-border")
                )
            }

            var curDate = Math.round(Date.now() / 1000);
            return m("div", m("strong","Latest updates:"),
                vnode.state.debug,
                vnode.state.latestPastes.map(function(row, idx) {

                    var account = row[0]
                    var timestamp = row[1]
                    var byteSize = row[2];
                    var pasteCount = row[3];

                    var pasteBadgeColor;
                    if (pasteCount == 1)
                        pasteBadgeColor = "success";
                    else
                        pasteBadgeColor = "primary";


                    var borderBottom = "border-bottom:1px solid #cccccc;";
                    if (idx == 7)
                        borderBottom = "";

                    var timeSince = Utils.secondsToHuman(curDate - timestamp);
                    if (timeSince != "Just now")
                        timeSince += ' ago';
                    timeSince = "Signed " + timeSince

                    return m("div", {style:"margin-bottom:5px;max-width:300px;" + borderBottom},
                        m("a", {href:"/view/" + account, oncreate:m.route.link, style:"outline: none;"},
                            m("img", {src: MakeBlockies(account), style:"margin-bottom:5px;margin-right: 10px;height:32px;width:32px;border-radius:15%;"})
                        ),
                        function(){
                            if (byteSize > 0)
                                return m("span.badge badge-secondary", {style:"margin-right:5px;"}, m("i.fas fa-save"), " ", byteSize, " byte", (byteSize == 1) ? "" : "s");
                            else
                                return m("span.badge badge-secondary", {style:"margin-right:5px;"}, m("i.fas fa-save"), " Hash only");
                        }(),
                        m("span.badge badge-" + pasteBadgeColor, m("i.fas fa-paste"), " ", (pasteCount == 1) ? "First post" : pasteCount + " updates"),
                        m("div", timeSince)
                    )
                })
            )
        }

    }
})
