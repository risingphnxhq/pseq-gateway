(function(){'use strict';
const sections=[['saved-assessment','Assessment and current answers'],['working-plan-builder','Working plan inputs'],['case-history','Saved business consultation'],['execution-record','Registered monthly work and receipts'],['workspace','Working consultation draft']];
function remove(){document.getElementById('pbs-print-view')?.remove();}
window.addEventListener('beforeprint',()=>{remove();const out=document.createElement('section');out.id='pbs-print-view';const title=document.createElement('h1');title.textContent='PBS business workspace';const note=document.createElement('p');note.textContent='Private working copy · '+new Date().toISOString()+'. Printing does not submit work, accept quality, confirm payment or establish business or funding readiness. Form text is an unsent draft unless a saved submission receipt identifies it.';out.append(title,note);
 for(const [id,label]of sections){const source=document.getElementById(id);if(!source||source.hidden||!source.textContent.trim())continue;const clone=source.cloneNode(true),original=[...source.querySelectorAll('input,textarea,select')],controls=[...clone.querySelectorAll('input,textarea,select')];
  controls.forEach((c,i)=>{const real=original[i];if(['password','email','file','checkbox','hidden'].includes(real.type)){c.remove();return;}const text=document.createElement('p');text.className='printed-work-text';text.textContent=real.tagName==='SELECT'?(real.selectedOptions?.[0]?.textContent||real.value||'Unknown'):(real.value||'Not supplied');c.replaceWith(text);});
  for(const el of clone.querySelectorAll('button,script,[hidden],.checkline'))el.remove();for(const el of clone.querySelectorAll('[id]'))el.removeAttribute('id');clone.removeAttribute('id');for(const d of clone.querySelectorAll('details'))d.setAttribute('open','');
  const h=document.createElement('h2');h.textContent=label;out.append(h,clone);
 }document.body.append(out);
});window.addEventListener('afterprint',remove);
})();
