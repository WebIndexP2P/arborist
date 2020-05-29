'use strict';

define([
  'gx/ethereum-blockies/blockies.min',
  'components/timestampcycler'
], function(
  MakeBlockies,
  TimestampCycler
) {

    var onBackToActiveClick = function(e) {
        e.preventDefault();
        m.route.set("/invites");
    }

    var onShowAccountDetailsClick = function(vnode, e) {
        e.preventDefault();
        vnode.state.showAccountDetails = true;
    }

    return {

        oninit: function(vnode) {

          if (vnode.attrs.accountDetails != null && vnode.attrs.accountDetails.lastPostTimestamp != null)
              vnode.state.lastPostSince = Utils.timeSinceEpoch(vnode.attrs.accountDetails.lastPostTimestamp) + " ago";
          else
              vnode.state.lastPostSince = "";

          vnode.state.showAccountDetails = false;
        },

        view: function(vnode) {

          if (vnode.attrs.account == null)
            return null;

          return m("div.card",
            m("div.card-header text-center",
              m("span",
                m("img", {src: MakeBlockies(vnode.attrs.account), style:"height:48px;width:48px;border-radius:15%;floatx:left;margin-right:5px;"}),
                m("span", {style:"padding-top:13px;font-size:18px;word-wrap:break-word;overflow-wrap:anywhere;"}, vnode.attrs.account)
              )
            ),
            m("div.card-body",
              m("div.row",
                m("div.col", m("b", "Invite level: ")),
                m("div.col", (vnode.attrs.accountDetails.activeLevel == 0)?"Root account":vnode.attrs.accountDetails.activeLevel)
              ),
              m("div.row",
                m("div.col", m("b", "Post count (local): ")),
                m("div.col", vnode.attrs.accountDetails.postCount)
              ),
              (function(){
                if (vnode.attrs.accountDetails.activeLevel > 0) {
                  return m("div.row",
                    m("div.col", m("b", "Invite Timestamp: ")),
                    m("div.col", m(TimestampCycler, {timestamp: vnode.attrs.accountDetails.activeTimestamp}))
                  )
                }
              })(),
              m("div.row",
                m("div.col", m("b", "Invite Accept Order: ")),
                m("div.col", "n/a")
              ),
              vnode.state.backtoAccountBtn
            )
          )
        }

    }

})
