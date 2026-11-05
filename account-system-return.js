(function(){'use strict';
const permitted=['pqs.html#account-panel','pbrs.html#account-panel','pbb.html#account-panel','pseq.html#account-panel','consultation.html?use=all#account-panel'];
const target=window.PBSAccountDestination,link=document.getElementById('account-return');
if(link&&permitted.includes(target)){
 link.setAttribute('href',target);
 const product=window.PBSAccountSystem;
 if(['pqs','pbrs','pbb','pseq'].includes(product)){
  const name=product.toUpperCase();
  link.textContent='Return to '+name+' sign-in';
  const heading=document.querySelector('h1');if(heading)heading.textContent=name+' account access';
  document.title=name+' · PBS account';
  const signIn=document.querySelector('#account-create a');if(signIn)signIn.setAttribute('href',target);
 }
}
})();

