(function(){'use strict';
const permitted=['pqs.html#account-panel','pbrs.html#account-panel','pbb.html#account-panel','pseq.html#account-panel','consultation.html?use=all#account-panel'];
const target=window.PBSAccountDestination,link=document.getElementById('account-return');
if(link&&permitted.includes(target))link.setAttribute('href',target);
})();
