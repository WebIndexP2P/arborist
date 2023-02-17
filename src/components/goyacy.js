'use strict';

define(function() {

  var fetchYacyNodes = function(vnode) {
    vnode.state.ls = new libwip2p.LinkedSet();
    libwip2p.Peers.getActivePeerSession()
    .then((session)=>{
      if (session.connState == 4) {
        vnode.state.ls.fetch("0x7309653c893088d194a8c58c72a6f5d1a29fc77a", "/yacy")
        .then((result)=>{
          vnode.state.yacyNodes = result;
          m.redraw();
        })
      }
    })
  }

  var doSearch = function(vnode) {
    var query = $('#searchBox').val();
    var idx = Math.floor(Math.random() * vnode.state.yacyNodes.length)
    var targetUrl = vnode.state.yacyNodes[idx] + '/yacysearch.html?query=' + query;
    window.open(targetUrl, "_blank");
  }

  return {

    oninit: function(vnode) {
      vnode.state.yacyNodes = null;
      vnode.state.showNodes = false;

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
        m("div.row",
          m("div.col-12", {style:"text-align:center;"},
            m("div", {style:"vertical-align:top;margin-top:-10px;display:inline-block;font-size:70px;color:#2080c0;font-weight:bold;"}, m("i","Go")),
            m("img", {src:"assets/yacy.png", height:80})
          )
        ),
        m("div.row", {style:"margin-bottom:20px;"},
          m("div.col-12", {style:"text-align:center;"},
            m("h5", "Search via public Yacy nodes"),
            m("div.row",
              m("div.col-12 col-md-9 col-lg-7 offset-md-2 offset-lg-3",
                m("div.input-group mb-3",
                  m("input.form-control", {type:"text", id:"searchBox"}),
                  m("button.btn btn-outline-secondary", {onclick: doSearch.bind(null, vnode)}, "Search")
                )
              )
            ),
            (function(){
              if (vnode.state.showNodes == true) {
                return null;
              }
              return m("div", m("a", {href:"#", onclick: function(){
                vnode.state.showNodes = true;
                return false;
              }}, "Show public nodes"))
            })(),
            (function(){
              if (vnode.state.yacyNodes == null) {
                return m("div.spinner-border")
              }
              if (vnode.state.showNodes == false) {
                return null;
              }

              return vnode.state.yacyNodes.map(function(node, idx){
                return m("div", m("a", {style:"font-size:18px;", href: node, target: "_blank"}, node))
              })
            })()
          )
        )
      )
    }
  }
})
