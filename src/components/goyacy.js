'use strict';

define(function() {

  var fetchYacyNodes = function(vnode) {
    vnode.state.bs = new libwip2p.BranchSet();
    libwip2p.Peers.getActivePeerSession()
    .then((session)=>{
      if (session.connState == 4) {
        vnode.state.bs.FetchByAccount("0x7309653c893088d194a8c58c72a6f5d1a29fc77a", "/yacy")
        .then((result)=>{
          vnode.state.yacyNodes = result;
          m.redraw();
        })
      }
    })
  }

  return {

    oninit: function(vnode) {
      vnode.state.yacyNodes = null;

      vnode.state.peerChangeHandler = function() {
        fetchYacyNodes(vnode);
      }
      libwip2p.Peers.events.on('peerconnected', vnode.state.peerChangeHandler)

      libwip2p.Peers.getActivePeerSession()
      .then((session)=>{
        if (session.connState == 4)
          fetchYacyNodes(vnode);
      })
      .catch((err)=>{})

    },

    view: function(vnode) {

      return m("div.container",
        m("div", {style:"margin-bottom:10px;"},
          m("div", {style:"vertical-align:top;margin-top:-10px;display:inline-block;font-size:70px;color:#2080c0;font-weight:bold;"}, "Go"),
          m("img", {src:"assets/yacy.png", height:80})
        ),
        m("h5", "Find a public Yacy node."),
        m("div", {style:"margin-bottom:20px;"},
          (function(){
            if (vnode.state.yacyNodes == null) {
              return m("div.spinner-border")
            }

            return vnode.state.yacyNodes.map(function(node, idx){
              return m("div", m("a", {style:"font-size:18px;", href: node, target: "_blank"}, node))
            })
          })()
        )
      )
    }
  }
})
