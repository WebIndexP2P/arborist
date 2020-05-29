'use strict'

define([
    'gx/ethereum-blockies/blockies.min',
    'components/timestampcycler'
], function(
    MakeBlockies,
    TimestampCycler
) {

    var onAccountClick = function(account, e) {
        e.preventDefault();
        m.route.set("/invites/:account", {account: account});
    }

    return {

      oncreate: function(vnode) {
        $('[data-toggle="tooltip"]').tooltip();
      },

        view: function(vnode) {

          if (vnode.attrs.account == null)
            return null;

          return m("div.card border-success",
            m("div.card-header text-center", m("h5", "Inviters")),
            m("div.card-body",
              (function(){
                if (vnode.attrs.account.accountDetails.activeLevel == 0) {
                  return m("div", "Root inviters have no effect");
                }
                if (vnode.attrs.account.accountDetails.inviters.length == 0) {
                  return m("div", "No invites");
                } else {
                  return m("div.table-responsive",
                    m("table.table",
                      m("thead",
                          m("th", "Account"),
                          m("th", "Invite Level"),
                          m("th", "Timestamp")
                      ),
                      m("tbody",
                        vnode.attrs.account.accountDetails.inviters.map((account)=>{
                          var isActiveElement;
                          if (account.account.toLowerCase() == vnode.attrs.account.accountDetails.activeInviter.toLowerCase()) {
                            isActiveElement = m("i.fa fa-check-circle text-success", {style:"margin-left:5px;font-size:25px;", "data-toggle":"tooltip","title":"Active Inviter"})
                          }
                          return m("tr",
                            m("td",
                              m("a", {href:"/invites/" + account.account, oncreate: m.route.link},
                                m("img", {src: MakeBlockies(account.account), style:"height:32px;width:32px;border-radius:15%;float:left;margin-right:5px;"}),
                                m("span", {style:"padding-top:7px;word-wrap:break-word;overflow-wrap:break-word;"}, account.account)
                              ),
                              isActiveElement
                            ),
                            m("td", account.inviterLevel + account.lvlgap + 1),
                            m("td", m(TimestampCycler, {timestamp: account.timestamp}))
                          )
                        })
                      )
                    )
                  )
                }
              })()
            )
          )
        }

    }

})
