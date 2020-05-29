'use strict';

define([
  'lib/utils',
  'lib/blogger',
  'components/blogger/list'
], function(
  Utils,
  Blogger,
  BlogList
) {

  // if just account param, show the list
  // if also the id, then render the blog post

  var fetchContent = function(vnode) {

    if (vnode.state.targetAccount == m.route.param().account && vnode.state.postId == m.route.param().id) {
      return;
    }

    vnode.state.targetAccount = m.route.param().account;
    vnode.state.postId = m.route.param().id;
    vnode.state.blogPost = null;
    vnode.state.errorMessage = null;

    if (vnode.state.postId == null) {
      Blogger.fetchBlogList(vnode.state.targetAccount)
      .then((blogList)=>{
        vnode.state.blogList = blogList;
        m.redraw();
      })
    } else {
      Blogger.fetchBlogPost(vnode.state.targetAccount, vnode.state.postId)
      .then((blogPost)=>{
        if (blogPost == null) {
          vnode.state.errorMessage = m("div", "Blog post not found");
          vnode.state.blogPost = "";
        } else
          vnode.state.blogPost = blogPost;
        m.redraw();
      })
    }
  }

  return {

    oninit: function(vnode) {
      vnode.state.targetAccount = null;
      vnode.state.postId = null;
      vnode.state.blogList = null;
      vnode.state.blogPost = null;

      fetchContent(vnode);
    },

    onbeforeupdate: function(vnode) {
      fetchContent(vnode);
    },

    view: function(vnode) {
      return m("div.row",
        m("div.col offset-md-1 col-md-10",
          m("h4", {style:"text-align:center;"}, "Blogger"),
          (function(){
            if (vnode.state.blogPost == null) {
              return m(BlogList, {account: vnode.state.targetAccount, blogList: vnode.state.blogList})
            } else {
              var displayDate;
              if (vnode.state.blogPost.d) {
                var tmpDate = new Date(vnode.state.blogPost.d * 1000);
                displayDate = "Published on " + Utils.dateSimpleFormat(tmpDate);
              }
              var author;
              if (vnode.state.blogPost.a)
                author = " by " + vnode.state.blogPost.a;
              return m("div",
                m("h2", vnode.state.blogPost.t),
                m("div", displayDate, author),
                m("hr"),
                m("div", vnode.state.blogPost.b),
                vnode.state.errorMessage
              )
            }
          })()
        )
      )
    }
  }

})
