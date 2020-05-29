'use strict';

define([
  'lib/refreshlistener',
  'lib/blogger',
  'components/blogger/list',
  'components/blogger/form',
  'components/account_input'
], function(
  RefreshListener,
  Blogger,
  BlogList,
  BlogForm,
  AccountInput
) {

  var publishPost = function(vnode, e) {

    e.preventDefault();

    var title = $('#blogTitle').val();
    var author = $('#blogAuthor').val();
    var body = $('#blogBody').val();

    if (title.length == 0 || body.length == 0) {
      $.growl.error({message: "details cannot be empty"});
      return false;
    }

    var post = {
      t: title,
      b: body,
      d: Math.round((new Date()).getTime() / 1000)
    }

    if (author)
      post.a = author;

    Blogger.getNextId(libwip2p.Account.getWallet().address)
    .then((newId)=>{
      post.id = newId;
      return Blogger.publishBlogPost(post, libwip2p.Account.getWallet().address);
    })
    .then(function(response) {
      if (response.error) {
        $.growl.error({message: response.error});
      } else {
        if (response.result == 'ok') {
          // if successful
          renderNewPostButton(vnode);
          vnode.state.newPostForm = null;
          m.redraw();
        }
        else {
          $.growl.error({message: response.result});
        }
      }
    })
    .catch((err)=>{
      if (err.message)
        $.growl.error({message: err.message});
      else
        $.growl.error({message: err});
      console.log(err);
    })

    return false;
  }

  var renderNewPostForm = function(vnode) {
    vnode.state.newPostButton = null;
    vnode.state.newPostForm = m(BlogForm, {onCancel: cancelNewPost.bind(null, vnode), onPublish: publishPost.bind(null, vnode)});
  }

  var cancelNewPost = function(vnode) {
    renderNewPostButton(vnode);
    vnode.state.newPostForm = null;
    return false;
  }

  var renderNewPostButton = function(vnode){
    vnode.state.newPostButton = m("div.text-center",
      m("button.btn btn-primary", {style:"margin-top:29px;", onclick: renderNewPostForm.bind(null, vnode)}, m("i.fa fa-pen"), " Write a new blog")
    )
  }

  var fetchExistingBlogs = function(vnode) {
    Blogger.fetchBlogList(libwip2p.Account.getWallet().address)
    .then((blogList)=>{
      if (blogList == null) {
        //$.growl.error({message: "rootDoc is a string, convert to object {} to add a blog post"});
        console.log('rootDoc is a string, convert to object {} to add a blog post')
        vnode.state.blogList = [];
      } else {
        vnode.state.blogList = blogList;
      }
      m.redraw();
    })
    .catch((err)=>{
      if (err.message) {
        $.growl.error({message: err.message});
      } else {
        if (err != 'account not found' && err != 'peerSession not ready')
          $.growl.error({message: err});
      }
      if (err != 'account not found' && err != 'peerSession not ready')
        console.log(err);
    })
  }

  var onGoClick = function(address) {
    m.route.set("/blogger/:account", {account: address})
  }

  return {

    oninit: function(vnode) {

      vnode.state.newPostForm = null;
      vnode.state.newPostButton = null;

      fetchExistingBlogs(vnode);
      renderNewPostButton(vnode);

      vnode.state.peerConnectHandler = RefreshListener.subscribe('peerconnected', function() {
        fetchExistingBlogs(vnode);
      })
    },

    onremove: function(vnode) {
        RefreshListener.unsubscribe('peerconnected', vnode.state.peerConnectHandler);
    },

    view: function(vnode) {
      return m("div.row",
        m("div.col offset-md-1 col-md-10",
          m("h4", {style:"text-align:center;"}, "Blogger"),

          (function(){
            if (vnode.state.newPostForm == null) {
              return m("div.row",
                m("div.col-md-6",
                  m(AccountInput, {label: "Blogger address:", onGo: onGoClick})
                ),
                m("div.col-md-6",
                  vnode.state.newPostButton,
                )
              )
            }
          })(),

          vnode.state.newPostForm,
          (function(){
            if (vnode.state.newPostForm != null || vnode.state.blogList == null)
              return;
            return m(BlogList, {account: libwip2p.Account.getWallet().address, blogList: vnode.state.blogList});
          })()
        )
      )
    }

  }

})
