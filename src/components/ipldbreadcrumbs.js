'use strict';

define(function(){

    var onCrumbClick = function(vnode, idx) {
        if (vnode.attrs.onLinkClick)
            vnode.attrs.onLinkClick(idx);
        return false;
    }

    return {  
        view: function(vnode) {
            return m("nav",
                m("ol.breadcrumb",
                    vnode.attrs.path.map(function(pathpart, idx) {
                        return m("li.breadcrumb-item", m("a", {href:"#", onclick: onCrumbClick.bind(null, vnode, idx)}, pathpart.path));
                    })
                )
            )
        }
    }
    
})