let scores=[], counts;
window.onload=(async(event)=>{scores=await fetch('https://api.countforlife.xyz/scores/list',{method:'POST',headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}}).then(r=>r.json()).then(d=>d.data.filter((s)=>!s.user.bot));counts = await fetch('https://api.countforlife.xyz/counts/retrieve',{method:'POST',headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}}).then(r=>r.json());generateRows('easy',document.getElementsByClassName("headings")[0].lastElementChild)});function generateRows(type,btn){scores.sort((a,b)=>b[type]-a[type])
let map=scores.map((v,i)=>`
      <div class="lbrow" onclick="expandUser(this)">
        <h5>${i+1}</h5>
        <img src="${v.user.avatar}">
        <h6>${v.user.tag}</h6>
        <span class="score">${v.invites}</span>
        <span class="score">${v.messages}</span>
        <span class="score">${v.premium}</span>
        <span class="score">${v.hard}</span>
        <span class="score">${v.easy}</span>
        <div class="keycounts">
          ${v.keycounts.length?`<div>
            ${v.keycounts.map((k=>`<h4>${k.name}</h4><span>${k.count}</span>`)).join('<br>')}
          </div>`:''}
          ${v.snipes.length?`<div>
            <h4 class="snipes">Snipes</h4>
            <br>
            ${v.snipes.map((s=>`<span class="snipes">${s}</span>`)).join('<br>')}
          </div>`:''}
        </div>
      </div>
    `).join('');
    document.getElementById("leaderboardRows").innerHTML=map;
    document.getElementById("countsEasy").innerHTML=counts.easy;
    document.getElementById("countsHard").innerHTML=counts.hard;
    document.getElementById("countsPre").innerHTML=counts.premium;
    document.getElementsByClassName("container")[0].style.display="block";let previous=document.getElementsByClassName("sortedby")
for(i=0;previous.length;i++){previous[i].classList.remove('sortedby');}
btn.classList.add('sortedby');document.getElementsByClassName("loader")[0].style.display="none";}
function expandUser(row){if(!row.lastElementChild.style.height||row.lastElementChild.style.height=='0px'){row.lastElementChild.style.height=row.lastElementChild.scrollHeight+'px';}else{row.lastElementChild.style.height='0px';}}