'use strict';

define(function(){

    var onCrumbClick = (vnode, idx)=>{
        if (vnode.attrs.onLinkClick)
            vnode.attrs.onLinkClick(idx);
        return false;
    }

    return {
        view: (vnode)=>{
            return m("nav", {style:vnode.attrs.wrapperStyle},
                m("ol.breadcrumb", {style:"margin-bottom:0px;"},
                    vnode.attrs.path.map(function(pathpart, idx) {
                        return m("li.breadcrumb-item", m("a", {href:"#", style:"text-decoration:none;", onclick: onCrumbClick.bind(null, vnode, idx)}, pathpart));
                    })
                )
            )
        }
    }

})
