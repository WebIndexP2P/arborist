'use strict'

define([
    'components/invites/invited',
    'components/invites/inviters',
    'components/invites/accountheader'
], function(
    Invited,
    Inviters,
    AccountHeader
) {

    var queryAccount = function(vnode) {

        vnode.state.error = null;
        vnode.state.loading = m("div", m("div.spinner-border"));
        vnode.state.request = null;
        vnode.state.invites = null;
        vnode.state.accountHeaderData = null;

        libwip2p.Account.fetchDetails(vnode.state.targetAccount, {includePaste: false, includeInvites: true})
        .then((accountDetails)=>{

          vnode.state.accountDetails = accountDetails;
          if (vnode.state.accountDetails.inviters == null) {
            vnode.state.accountDetails.inviters = [];
          }
          if (vnode.state.accountDetails.invited == null) {
            vnode.state.accountDetails.invited = [];
          }
          vnode.state.accountHeaderData = {
            account: vnode.state.targetAccount,
            isOwnAccount: vnode.state.isOwnAccount,
            accountDetails: vnode.state.accountDetails
          }
          vnode.state.loading = null;
        })
        .catch((err)=> {
          if (err == "peer session not ready" || err.message == 'peerSession not ready') {
          } else {
            //console.log(err)
            vnode.state.error = err;
            vnode.state.loading = null;
          }
        })
        .then(()=>{
          m.redraw();
        })
    }

    return {

        oninit: function(vnode) {

          vnode.state.isOwnAccount = false;
          vnode.state.loading = m("div", m("div.spinner-border"));

          // check our url params
          var params = m.route.param();
          if (params.hasOwnProperty('account')) {
              vnode.state.targetAccount = params.account;
          } else {
              vnode.state.targetAccount = libwip2p.Account.getWallet().address;
              vnode.state.isOwnAccount = true;

              // Subscribe to account change events
              vnode.state.accountCallbackIdx = libwip2p.Account.subscribeAccountChange(()=>{
                  vnode.state.targetAccount = libwip2p.Account.getWallet().address();
                  queryAccount(vnode);
              })
          }

          vnode.state.RefreshContentHandler = function(){
              queryAccount(vnode)
          }
          libwip2p.Peers.events.on('peerconnected', vnode.state.RefreshContentHandler)
          libwip2p.Peers.events.on('bundlepublished', vnode.state.RefreshContentHandler)

          libwip2p.Peers.getActivePeerSession()
          .then((session)=>{
            if (session != null) {
              queryAccount(vnode);
            }
          })
        },

        onupdate: function(vnode) {
          var newAccount;
          var params = m.route.param();
          if (params.hasOwnProperty('account')) {
            newAccount = params.account;
            vnode.state.isOwnAccount = false;
          } else {
            newAccount = libwip2p.Account.getWallet().address;
            vnode.state.isOwnAccount = true;
          }

          if (vnode.state.targetAccount != newAccount) {
            vnode.state.targetAccount = newAccount;
            queryAccount(vnode);
          }
        },

        onremove: function(vnode) {
          libwip2p.Peers.events.off('peerconnected', vnode.state.RefreshContentHandler)
          libwip2p.Peers.events.off('bundlepublished', vnode.state.RefreshContentHandler)

          if (vnode.state.accountCallbackIdx != null)
              libwip2p.Account.unsubscribeAccountChange(vnode.state.accountCallbackIdx);
        },

        view: function(vnode) {

          return m("div",
            m("div.row",
              m("div.col offset-md-2 col-md-8",
                m("h4", {style:"text-align:center;"}, "Invites for")
              )
            ),
            function(){
              if (vnode.state.loading != null) {
                return vnode.state.loading;
              } else if (vnode.state.error != null) {
                return m("div.alert alert-danger", vnode.state.error);
              } else {
                return m("div",
                  m("div", {style:"margin-bottom:10px;"},
                    m(AccountHeader, vnode.state.accountHeaderData)
                  ),
                  m("div", {style:"margin-bottom:10px;"},
                    m(Inviters, {account: vnode.state.accountHeaderData})
                  ),
                  m(Invited, {account: vnode.state.accountHeaderData}),
                  m("div", m.trust("&nbsp;"))
                )
              }
            }()
          )
        }

    }
})
