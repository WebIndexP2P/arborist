'use strict';

define([
  'lib/utils'
], function(
  Utils
) {

  return {

    oninit: function(vnode) {
    },

    view: function(vnode) {
      if (vnode.attrs.blogList == null)
        return null;
      return vnode.attrs.blogList.map(function(blogpost){
        var displayDate;
        if (blogpost.d) {
          var tmpDate = new Date(blogpost.d * 1000);
          displayDate = "Published on " + Utils.dateSimpleFormat(tmpDate);
        }
        var wordCount = blogpost.b.split(" ").length;
        var mins = Math.ceil(wordCount / 200);
        return m("div", {style:"margin-bottom:20px;"},
          m("h4", blogpost.t,
            m("a", {
                href:"/blogger/" + vnode.attrs.account + '/' + blogpost.id,
                oncreate: m.route.link
              },
              m("i.fa fa-link", {style:"font-size:14px;margin-left:20px;"})
            )
          ),
          m("div", displayDate),
          m("div", wordCount + ' word', (wordCount == 1)? "" : "s", " - ", mins, " min read")
        );
      })
    }
  }

})
