'use strict';

define(()=>{

    var recurseConvertObj = function(vnode, obj, depth, parentProp) {

        if (depth == null)
            depth = 1;

        var renderedProps = [];

        if (obj == null) {
            renderedProps = m("span.json-value", "null")
        } else if (Buffer.isBuffer(obj) == true) {
            renderedProps.push(m("pre", '0x', obj.toString('hex')));
        } else if (Array.isArray(obj) == true) {
            renderedProps.push(m("span.json-key", "["));
            var comma = ",";
            for (var prop in obj) {
                if (renderedProps.length == Object.keys(obj).length)
                    comma = "";
                renderedProps.push(m("div", {style:"margin-left:" + (depth * 10).toString() + "px"}, recurseConvertObj(vnode, obj[prop], depth + 1, prop), comma));
            }
            renderedProps.push(m("div.json-key", "]"));
        } else if (obj.hasOwnProperty('asCID')) {
            renderedProps = m("a", {href:"#", onclick: vnode.attrs.onLinkClick.bind(null, parentProp, obj.toString()), style:'font-family:"Courier New", Courier, monospace;word-wrap:break-word;'}, obj.toString());
        } else if (typeof obj == 'object') {
            renderedProps.push(m("span.json-key", " {"));
            for (var prop in obj) {
                renderedProps.push(
                    m("div", {style:"margin-left:" + (depth * 10).toString() + "px"}, m("span.json-key", {style:"word-wrap: break-word;"}, "\"", prop, "\": "), recurseConvertObj(vnode, obj[prop], depth + 1, prop))
                )
            }
            renderedProps.push(m("span.json-key", "}"));
        } else if (typeof obj == 'string') {
            renderedProps = m("span.json-string", "\"", obj, "\"");
        } else if (typeof obj == 'number') {
            renderedProps = m("span.json-value", obj);
        } else if (typeof obj == 'boolean') {
            renderedProps = m("span.json-value", (obj)?"true":"false")
        }

        return renderedProps;
    }

    return {

        oninit: function(vnode) {
          vnode.state.elements = m("div",
            recurseConvertObj(vnode, vnode.attrs.iplddoc)
          )
        },

        onbeforeupdate: function(vnode) {
          vnode.state.elements = m("div",
            recurseConvertObj(vnode, vnode.attrs.iplddoc)
          )
        },

        view: function(vnode) {
            return vnode.state.elements;
        }
    }

})
