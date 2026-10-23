// Capture only PBS Firebase action links, then remove action credentials before other scripts run.
(function(){'use strict';const query=new URLSearchParams(location.search);let mode=query.get('mode'),code=query.get('oobCode');const apiKey=query.get('apiKey');let invalid=false;
if(mode||code){invalid=!['resetPassword','verifyEmail'].includes(mode)||!code||code.length>2048||query.getAll('mode').length!==1||query.getAll('oobCode').length!==1||query.getAll('apiKey').length>1||!!apiKey&&apiKey!=='AIzaSyBJ1x9K2o9z2aCDb5j5zdd9TkhqoC05dKY';}
if(location.search||location.hash)history.replaceState(null,'',location.pathname);
window.PBSFirebaseAction={get mode(){return mode;},get code(){return invalid?null:code;},invalid,clear(){mode=null;code=null;}};
})();
