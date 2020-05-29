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

    var showAddInvitedModal = function(vnode, e) {

        e.preventDefault();

        var inviterLevel = vnode.attrs.account.accountDetails.activeLevel;
        var updateTargetLvl = function(e) {
          e.redraw = false;
          e.preventDefault();

          var lvlGap = parseInt($('#addInviteLevel').val());
          if (isNaN(lvlGap))
            lvlGap = 0;
          var targetLevel = inviterLevel + lvlGap + 1;
          $('#inviteTargetLvl').text(targetLevel);
        }

        var modalContent = {
          view: function(){

            return [
                m("div.modal-header",
                m("h5.modal-title","Add Invite"),
                m("button.close", {type:"button", "data-dismiss":"modal"},
                    m("span", m.trust("&times;"))
                )
                ),
                m("div.modal-body",
                    m("form",
                        m("div.form-group",
                            m("label", {for:"addInviteAccount"}, "Account"),
                            m("input.form-control", {type:"text", id:"addInviteAccount"})
                        ),
                        m("div.row",
                          m("div.col-4",
                            m("div.form-group",
                                m("label", {for:"addInviteLevel"}, "Level gap"),
                                m("input.form-control", {oninput: updateTargetLvl, type:"text", id:"addInviteLevel"})
                            )
                          ),
                          m("div.col-4",
                            m("div", "Actual Level"),
                            m("div", {style:"margin-top:7px;",id:"inviteTargetLvl"}, inviterLevel + 1)
                          )
                        )
                    )
                ),
                m("div.modal-footer",
                    m("button.btn btn-primary", {type:"button", onclick: onInviteAddProceedClick.bind(null, vnode)}, "Proceed"),
                    m("button.btn btn-secondary", {type:"button", "data-dismiss":"modal"},"Cancel")
                )
            ]
        }}

        m.mount($('.modal-content').get(0), modalContent);
        $('#modal').modal('show');
        $('#addInviteAccount').focus();
    }

    var onInviteAddProceedClick = function(vnode, e) {
      e.preventDefault();
      var targetAccount = $('#addInviteAccount').val();
      var lvlGap = parseInt($('#addInviteLevel').val());
      var timestamp = Math.round((new Date()).getTime() / 1000);

      var newInvite = {account: targetAccount, timestamp: timestamp}
      if (isNaN(lvlGap) == false) {
        newInvite.lvl = lvlGap;
      }

      var bShouldPublish = true;
      libwip2p.Invites.add(newInvite, bShouldPublish)
      .then((result)=>{
        $('#modal').modal('hide');
      })
      .catch((err)=>{
        console.log(err);
        $.growl.error({message: err})
      });

    }

    return {

        view: function(vnode) {

          if (vnode.attrs.account == null)
            return null;

          var inviteButton;
          if (vnode.attrs.account.isOwnAccount) {
            inviteButton = m("button.btn btn-primary float-right", {
              style:"position: absolute;top:7px;right:10px;",
              onclick: showAddInvitedModal.bind(null, vnode)
            },
              m("i.fa fa-plus"),
              " Add invite"
            );
          }

          return m("div.card border-primary",
            m("div.card-header text-center",
              m("h5", "Invited"),
              inviteButton
            ),
            m("div.card-body",
              (function(){
                if (vnode.attrs.account.accountDetails.invited.length == 0) {
                  return m("div", "No invites");
                } else {
                  return m("div.table-responsive",
                    m("table.table",
                      m("thead",
                          m("th", "Account"),
                          m("th", "Assigned Level"),
                          m("th", "Timestamp")
                      ),
                      m("tbody",
                        vnode.attrs.account.accountDetails.invited.map((invite)=>{
                          return m("tr",
                            m("td",
                              m("a", {href:"/invites/" + invite.account, oncreate: m.route.link},
                                m("img", {src: MakeBlockies(invite.account), style:"height:32px;width:32px;border-radius:15%;float:left;margin-right:5px;"}),
                                m("div", {style:"padding-top:7px;word-wrap:break-word;overflow-wrap:break-word;"}, invite.account)
                              )
                            ),
                            m("td", vnode.attrs.account.accountDetails.activeLevel + invite.lvlgap + 1),
                            m("td", m(TimestampCycler, {timestamp: invite.timestamp}))
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
