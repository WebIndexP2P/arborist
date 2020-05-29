'use strict';

define([
    'lib/utils'
], function(
    Utils
){

    var onLinkClick = function(vnode, path, cid, e) {
        e.preventDefault();
        vnode.attrs.ipldwalk.navigateDown(path, cid)
        .then(function() {
            m.redraw();
        })
    }

    var onShowContentClick = function(vnode) {
        if (vnode.state.contentElement == null)
            vnode.state.contentElement = m("pre", {style:"word-wrap: break-word;"}, vnode.attrs.ipldwalk.getContent());
        else
            vnode.state.contentElement = null;
    }

    var onPinClick = function(vnode, e) {
        e.preventDefault();
        vnode.attrs.ipldwalk.pin();
    }

    var onCrumbClick = function(vnode, depth, e) {
        e.preventDefault();
        if (depth == vnode.attrs.ipldwalk.getPath().length - 1)
            return;
        vnode.attrs.ipldwalk.navigateUp(depth)
        .then(function() {
            m.redraw();
        })
    }

    return {

        oninit: function(vnode) {
            vnode.state.contentElement = null;
        },

        view: function(vnode) {

            //console.log('importtreeview.js - onview');

            if (vnode.attrs.ipldwalk == null || vnode.attrs.ipldwalk.isReady == false)
                return null;

            return m("div",
                m("nav",
                    m("ol.breadcrumb",
                        vnode.attrs.ipldwalk.getPath().map(function(pathpart, idx) {
                            return m("li.breadcrumb-item", m("a", {href:"#", onclick: onCrumbClick.bind(null, vnode, idx)}, pathpart.path));
                        })
                    )
                ),
                m("div", {style:"font-weight:bold;"}, "CID:",
                    (function(){
                        var isPinned = vnode.attrs.ipldwalk.isPinned(vnode.attrs.ipldwalk.curCid);
                        var badgeColor = " badge-warning";
                        var elements = []
                        if (isPinned)
                            badgeColor = " badge-success";

                        elements.push(m("span.badge" + badgeColor, {style:"display:inline;white-space:normal;word-wrap:break-word;margin-left:5px;margin-bottom:5px;"}, vnode.attrs.ipldwalk.curCid));

                        if (vnode.attrs.ipldwalk.isPinned(vnode.attrs.ipldwalk.curCid) == false && vnode.attrs.ipldwalk.isParentPinned() == true)
                            elements.push(m("button.btn btn-sm btn-outline-primary", {style:"margin-left:5px;", onclick: onPinClick.bind(null, vnode)}, m("i.fas fa-thumbtack")))
                        else
                            elements.push(m("span", m.trust("&nbsp;")))

                        return elements;
                    })()
                ),
                m("div", {style:"font-weight:bold;margin-top:5px;margin-bottom:5px;"}, "Content:", m('button.btn btn-sm btn-outline-primary', {style:"margin-left:5px;", onclick: onShowContentClick.bind(null, vnode)}, "Toggle content")),
                vnode.state.contentElement,
                m("div", {style:"font-weight:bold;"}, "Links:"),
                vnode.attrs.ipldwalk.getLinks().map(function(link) {
                    var shrunkCid = link.cid.substr(0,11) + "..." + link.cid.substr(link.cid.length - 6);
                    var color = "warning";
                    if (link.isPinned)
                        color = "success";

                    return m("div", {style:"margin-bottom:5px;"}, link.path, "/", m("a", {href:"#", onclick: onLinkClick.bind(null, vnode, link.path, link.cid)}, m('span.badge badge-' + color, shrunkCid)));
                }),
                m("hr"),
                m("div", "Pin count: ", vnode.attrs.ipldwalk.getPinCount()),
                m("div", "Cummulative size: ", vnode.attrs.ipldwalk.getCummulativeSize() + ' bytes')
            )
        }
    }
})