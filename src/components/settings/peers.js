'use strict';

define([
    './peersummary'
], function(
    PeerSummary
) {

    var setActive = function(peerIdx) {
        libwip2p.Peers.setActive(peerIdx);
        return false;
    }

    var blockPeer = function(peerIdx) {
        libwip2p.Peers.block(peerIdx);
        return false;
    }

    var unblockPeer = function(peerIdx) {
        libwip2p.Peers.unblock(peerIdx);
        return false;
    }

    var removePeer = function(peerIdx) {
        libwip2p.Peers.remove(peerIdx);
        return false;
    }

    var showAddPeerModal = function(vnode, e) {

        e.preventDefault();

        var modalContent = {view: function(){
            return [
                m("div.modal-header",
                m("h5.modal-title","Add Peer"),
                m("button.close", {type:"button", "data-dismiss":"modal"},
                    m("span", m.trust("&times;"))
                )
                ),
                m("div.modal-body",
                    m("form",
                        m("div.form-group",
                            m("label", {for:"peerAddress"}, "Peer Address"),
                            m("input.form-control", {type:"text", id:"peerAddress"})
                        )
                    )
                ),
                m("div.modal-footer",
                    m("button.btn btn-primary", {type:"button", onclick: addPeer}, "Proceed"),
                    m("button.btn btn-secondary", {type:"button", "data-dismiss":"modal"},"Cancel")
                )
            ]
        }}

        m.mount($('.modal-content').get(0), modalContent);
        $('#modal').modal('show');
        $('#peerAddress').focus();
    }

    var addPeer = function() {
        var address = $('#peerAddress').val();
        if (address.startsWith('ws://') && window.location.protocol == 'https:') {
            $.growl.error({message:"Cannot add a HTTP peer to a HTTPS hosted UI."})
        } else {
            libwip2p.Peers.addPeer(address)
            .then(()=>{
              $('#modal').modal('hide');
              m.redraw();
            })
        }
    }


    return {

        view: function(vnode) {

            return m("div.row", {style:"margin-bottom:20px;"},
                m("div.col",
                    m("div",
                        m("button.btn btn-primary float-right", {onclick: showAddPeerModal.bind(null, vnode)}, m("i.fas fa-plus")),
                        m("h4", {style:"text-align:center;"}, "Peers")
                    ),
                    m("ul.list-group",
                        libwip2p.Peers.getPeers().map(function(peer, peerIdx){
                            //console.log(peer)
                            var rowColor = "";

                            var setActiveElement = m("a.dropdown-item", {href:"#", onclick: setActive.bind(null, peerIdx)}, m("i.fas fa-check", {style:"width:25px;"}), "Set active");
                            var removePeerElement = m("a.dropdown-item", {href:"#", onclick: removePeer.bind(null, peerIdx)}, m("i.fas fa-trash", {style:"width:25px;"}), "Remove Peer");
                            var blockPeerElement = m("a.dropdown-item", {href:"#", onclick: blockPeer.bind(null, peerIdx)}, m("i.fas fa-ban", {style:"width:25px;"}), "Block Peer");
                            var toggleTrustedPeerElement = m("a.dropdown-item", {href:"#", onclick: function(){}}, m("i.fas fa-user-check", {style:"width:25px;"}), "Toggle Trusted");
                            var ignorePeerChangesElement = m("a.dropdown-item", {href:"#", onclick: function(){}}, m("i.fas fa-user-shield", {style:"width:25px;"}), "Ignore PeerId changes");

                            if (peer.active) {
                                rowColor = " list-group-item-success";
                                setActiveElement = null;
                                removePeerElement = null;
                                blockPeerElement = null;
                            } else if (peer.block) {
                                rowColor = " list-group-item-danger";
                                setActiveElement = null;
                                blockPeerElement = m("a.dropdown-item", {href:"#", onclick: unblockPeer.bind(null, peerIdx)}, m("i.fas fa-ban", {style:"width:25px;"}), "Unblock Peer");
                            }

                            var dropdown = m("div.dropdown peerdropdown", {style:"position:absolute;right:10px;z-index:3;"},
                              m("button.btn btn-light btn-sm", {"data-toggle":"dropdown"}, m("i.fas fa-cog")),
                              m("div.dropdown-menu dropdown-menu-right dropdown-menu-lg-left",
                                setActiveElement,
                                removePeerElement,
                                blockPeerElement,
                                toggleTrustedPeerElement,
                                ignorePeerChangesElement
                              )
                            )

                            if (peer.hasOwnProperty('active') && peer.active == true) {
                                dropdown = null;
                            }

                            return m("li.list-group-item" + rowColor,
                              dropdown,
                              m(PeerSummary, {peer: peer})
                            );
                        })
                    )
                )
            )
        }

    }

})
