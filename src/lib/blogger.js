'use strict';

define([
  'lib/pastedoc'
], function(
  PasteDoc
){

  // this singleton module fetches and publishes blog posts
  // it caches the blog list for an account
  // change the account, the cache gets cleared

  var cachedAccount = null;
  var cachedRootDoc = null;

  var fetchBlogList = function(account) {
    return new Promise(async (resolve, reject)=>{

      if (cachedAccount != account || cachedRootDoc == null) {
        //console.log('fetching blogList from remote')
        cachedRootDoc = null;
        return libwip2p.Peers.getActivePeerSession()
        .then((session)=>{
          return session.sendMessage({
            method: "bundle_get",
            params: [{account: account}]
          })
        })
        .then(function(response){
          if (response.error) {
            return reject(response.error);
          }
          return PasteDoc.deserialize(response.result.cborData)
          .then(function(pasteDoc){
            cachedAccount = account;
            if (typeof pasteDoc == 'string' || pasteDoc == null) {
              cachedRootDoc = {}
            } else {
              cachedRootDoc = pasteDoc;
            }

            if (cachedRootDoc.blogger == null) {
              cachedRootDoc.blogger = [];
            }

            return resolve(cachedRootDoc.blogger);
          })
        })
        .catch((err)=>{
          reject(err);
        })
      } else {
        //console.log('using cache')
        resolve(cachedRootDoc.blogger);
      }
    })
  }

  var fetchBlogPost = function(account, postId) {
    return fetchBlogList(account)
    .then(()=>{
      for (var a = 0; a < cachedRootDoc.blogger.length; a++) {
        if (cachedRootDoc.blogger[a].id == postId)
          return cachedRootDoc.blogger[a];
      }
      return null;
    })
  }

  var getNextId = function(account) {
    return fetchBlogList(account)
    .then((blogList)=>{
      var maxId = 0;
      for (var a = 0; a < blogList.length; a++) {
        if (blogList[a].id > maxId)
          maxId = blogList[a].id;
      }
      return maxId + 1;
    })
  }

  var publishBlogPost = function(post, account) {
    var multihashHex;
    var signatureHex;
    var cborBufferAsBase64;

    return fetchBlogList(account)
    .then((blogList)=>{
      if (blogList == null) {
        throw "rootDoc appears to be a string, convert to object to post a blog post";
      }

      blogList.push(post);
    })
    .then(()=>{
      return PasteDoc.serializeToBuffer(cachedRootDoc)
    })
    .then(function(_cborBuffer){
      cborBufferAsBase64 = _cborBuffer.toString('base64');
      return PasteDoc.getCid(_cborBuffer);
    })
    .then(function(cid) {
      multihashHex = '0x' + cid.multihash.toString('hex');
      return libwip2p.Account.sign(post.d, '0x' + cid.multihash.toString('hex'));
    })
    .then(function(_signatureHex) {
      signatureHex = _signatureHex;
    })
    .then(()=>{
      return libwip2p.Peers.getActivePeerSession();
    })
    .then((session)=>{
      return session.sendMessage({
          method: "bundle_save",
          params: [{
            account: account,
            timestamp: post.d,
            multihash: multihashHex,
            signature: signatureHex,
            cborData: [ cborBufferAsBase64 ]
          }]
      })
    })
  }

  var clearCacheFor = function(account) {
    if (cachedAccount == null)
      return;

    if (cachedAccount.toLowerCase() == account.toLowerCase()) {
      cachedRootDoc = null;
    }
  }

  return {
    fetchBlogList: fetchBlogList,
    fetchBlogPost: fetchBlogPost,
    getNextId: getNextId,
    publishBlogPost: publishBlogPost,
    clearCacheFor: clearCacheFor
  }

})
