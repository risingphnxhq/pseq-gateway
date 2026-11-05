// Capture only PBS Firebase action links; never navigate to an arbitrary continue URL.
(function(){'use strict';const query=new URLSearchParams(location.search);let mode=query.get('mode'),code=query.get('oobCode');const apiKey=query.get('apiKey');let invalid=false;
if(mode||code){invalid=!['resetPassword','verifyEmail'].includes(mode)||!code||code.length>2048||query.getAll('mode').length!==1||query.getAll('oobCode').length!==1||query.getAll('apiKey').length>1||!!apiKey&&apiKey!=='AIzaSyBJ1x9K2o9z2aCDb5j5zdd9TkhqoC05dKY';}
const systems=['pqs','pbrs','pbb','pseq'];
function selected(params){if(params.getAll('use').length!==1)return null;const value=params.get('use').toLowerCase();return systems.includes(value)?value:null;}
let product=selected(query);
if(query.has('continueUrl')){try{if(query.getAll('continueUrl').length!==1)throw Error();const url=new URL(query.get('continueUrl'));if(url.origin!=='https://pseq.risingphoenixhq.com'||url.pathname!=='/account.html'||url.hash)throw Error();const continuation=selected(url.searchParams);if(product&&continuation&&product!==continuation)throw Error();product=product||continuation;}catch{invalid=true;product=null;}}
window.PBSAccountSystem=product;
window.PBSAccountDestination=product?product+'.html#account-panel':'consultation.html?use=all#account-panel';
if(location.search||location.hash)history.replaceState(null,'',location.pathname);
window.PBSFirebaseAction={get mode(){return mode;},get code(){return invalid?null:code;},invalid,clear(){mode=null;code=null;}};
})();


