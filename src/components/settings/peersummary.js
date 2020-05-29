'use strict';

define([
  'gx/ethereum-blockies/blockies.min',
  './peerinfo',
], function(
  MakeBlockies,
  PeerInfo
) {

  var onInfoClick = function(vnode, e) {
    e.preventDefault();
    if (vnode.state.peerInfo == null) {
      vnode.state.peerInfo = m(PeerInfo, {peer: vnode.attrs.peer});
    } else {
      vnode.state.peerInfo = null;
    }
  }

  return {

    oninit: function(vnode) {
      vnode.state.peerInfo = null;
    },

    view: function(vnode) {

      var blockie = m("div", {style:"height:40px;width:40px;"});
      var versionElement;

      if (vnode.attrs.peer.peerId) {
        blockie = m("a", {href:"#", onclick: onInfoClick.bind(null, vnode)},
          m("img", {src: MakeBlockies(vnode.attrs.peer.peerId), style:"height:40px;width:40px;border-radius:15%;"})
        );
        versionElement = m("div", {style:"display:inline-block;margin-left:20px;vertical-align:top;"},
          m("span", {style:"font-weight:bold;"}, "Version"),
          m("br"),
          vnode.attrs.peer.version
        )
      }

      return m("div",
        m("div", {style:"display:inline-block;vertical-align:top;margin-top:4px;"}, blockie),
        m("div", {style:"display:inline-block;margin-left:15px;vertical-align:top;min-width:200px;"},
          m("span", {style:"font-weight:bold;"}, "Preferred Endpoint"),
          m("br"),
          vnode.attrs.peer.preferredEndpoint
        ),
        versionElement,
        vnode.state.peerInfo
      );
    }
  }
})
