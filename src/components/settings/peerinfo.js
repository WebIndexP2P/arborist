'use strict';

define(function() {
  return {
    view: function(vnode) {
      return m("div",
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Remote Peer Id:"),
          m("div.col-md-9 col-sm-8", {style:"word-break:break-all;"}, vnode.attrs.peer.peerId)
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Merklehead:"),
          m("div.col-md-9 col-sm-8", {style:"word-break:break-all;"}, vnode.attrs.peer.merklehead)
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Tree Root:"),
          m("div.col-md-9 col-sm-8", {style:"word-break:break-all;"}, vnode.attrs.peer.rootAccount)
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Sequence Seed:"),
          m("div.col-md-9 col-sm-8", vnode.attrs.peer.sequenceSeed)
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Latest Sequence No:"),
          m("div.col-md-9 col-sm-8", vnode.attrs.peer.latestSequenceNo)
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Endpoints:"),
          m("div.col-md-9 col-sm-8", JSON.stringify(vnode.attrs.peer.endpoints))
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Trusted:"),
          m("div.col-md-9 col-sm-8", (vnode.attrs.peer.trusted)?"true":"false")
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Created:"),
          m("div.col-md-9 col-sm-8", vnode.attrs.peer.created)
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Last Attempt:"),
          m("div.col-md-9 col-sm-8", vnode.attrs.peer.lastAttempt)
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Last Comms:"),
          m("div.col-md-9 col-sm-8", vnode.attrs.peer.lastComms)
        ),
        m("div.row",
          m("div.col-md-3 col-sm-4", {style:"font-weight:bold;"}, "Last Error:"),
          m("div.col-md-9 col-sm-8", vnode.attrs.peer.lastError)
        )
      );
    }
  }
})
