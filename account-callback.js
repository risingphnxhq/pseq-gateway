(function(){'use strict';
const hash=new URLSearchParams(window.location.hash.slice(1)),query=new URLSearchParams(window.location.search);
const callback={type:hash.get('type')||query.get('type'),access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),token_hash:query.get('token_hash'),error:hash.has('error')||query.has('error')||query.has('code')||hash.has('error_description')||query.has('error_description')};
window.PBSAccountCallback=callback;
if(window.location.hash||window.location.search)window.history.replaceState(null,'',window.location.pathname);
})();
