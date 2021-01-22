'use strict'

define([
    'gx/ethereum-blockies/blockies.min',
    'lib/refreshlistener',
    'lib/utils'
], function(
    MakeBlockies,
    RefreshListener,
    Utils
) {

    var showAddFollowerModal = function(vnode, e) {

        e.preventDefault();

        var modalContent = {view: function(){
            return [
                m("div.modal-header",
                m("h5.modal-title","Follow account"),
                    m("button.close", {type:"button", "data-dismiss":"modal"},
                        m("span", m.trust("&times;"))
                    )
                ),
                m("div.modal-body",
                    m("form",
                        m("div.form-group",
                            m("label", {for:"peerAddress"}, "Account"),
                            m("input.form-control", {type:"text", id:"followAccount"})
                        )
                    )
                ),
                m("div.modal-footer",
                    m("button.btn btn-primary", {type:"button", onclick: addFollower.bind(null, vnode)}, "Add"),
                    m("button.btn btn-secondary", {type:"button", "data-dismiss":"modal"},"Cancel")
                )
            ]
        }}

        m.mount($('.modal-content').get(0), modalContent);
        $('#modal').modal('show');
        $('#followAccount').focus();
    }

    var addFollower = function(vnode) {
        var addressString = $('#followAccount').val();

        try {
            ethers.utils.getAddress(addressString);
        } catch(err) {
            $.growl.error({message: "Could not add follower, most likely invalid address"});
            return;
        }

        libwip2p.Following.add(addressString);
        $('#modal').modal('hide');

        vnode.state.renderedRows = libwip2p.Following.getAll().map(function(accountRow) {
            return renderAccountRow(vnode, accountRow);
        })
    }

    var removeFollower = function(vnode, account, e) {
        e.preventDefault();
        libwip2p.Following.remove(account);
        vnode.state.renderedRows = libwip2p.Following.getAll().map(function(accountRow) {
            return renderAccountRow(vnode, accountRow);
        })
    }

    var renderAccountRow = function(vnode, accountRow) {
        var newPaste;
        var timestamp = Math.round(Date.now() / 1000);
        if (accountRow.account == null)
            return m("div", "Error with account");
        if (accountRow.newPaste > 0)
            newPaste = m("span.badge badge-danger", {style:"margin-left:5px;font-size:14px;"}, "New paste ", Utils.secondsToHuman(timestamp - accountRow.newPaste), " ago");
        return m("div", {style:"min-height:50px;"},
            m("a", {href:"#", onclick: removeFollower.bind(null, vnode, accountRow.account)}, m("i.fas fa-trash", {style:"float:right;margin-left:10px;margin-top:5px;"})),
            m(m.route.Link, {href:"/view/" + accountRow.account},
                m("img", {src: MakeBlockies(accountRow.account), style:"margin-right:10px;float:left;height:40px;width:40px;border-radius:15%;"}),
                m("span", {style:'word-wrap:break-word;font-family:"Courier New", Courier, monospace;color:#000000;'}, accountRow.account),
                newPaste
            ),
            m("hr")

        )
    }

    return {
        oninit: function(vnode) {

            libwip2p.Following.checkAllForUpdates();

            vnode.state.renderedRows = libwip2p.Following.getAll().map(function(accountRow) {
                return renderAccountRow(vnode, accountRow);
            })

            vnode.state.followersEventsHandler = function() {
                vnode.state.renderedRows = libwip2p.Following.getAll().map(function(accountRow) {
                    return renderAccountRow(vnode, accountRow);
                })
                m.redraw();
            }
            libwip2p.Following.events.on('update', vnode.state.followersEventsHandler);
        },

        ondestroy: function(vnode) {
            libwip2p.Following.events.off('update', vnode.state.followersEventsHandler);
        },

        view: function(vnode) {
            return m("div.row",
                m("div.col offset-md-1 col-md-10",
                    m("h4", {style:"text-align:center;"}, "Following"),
                    m("button.btn btn-primary", {style:"margin-bottom:10px;", onclick: showAddFollowerModal.bind(null, vnode)}, m("i.fas fa-plus"), " Follow"),
                    vnode.state.renderedRows.map(function(row) {
                        return row;
                    })
                )
            )
        }
    }

})
