const r=await fetch('http://192.168.31.188:3080/api/creativeStudio/listProjects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'p1',method:'creativeStudio/listProjects',payload:{args:{}}})});
const j=await r.json();const list=j.result?.value?.projects??j.result?.value??[];
const id=(list.find(p=>p.name==='考研市场中台')||{}).id;
const r2=await fetch('http://192.168.31.188:3080/api/creativeStudio/getProject',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'p2',method:'creativeStudio/getProject',payload:{args:{id}}})});
const j2=await r2.json();const p=j2.result.value;
console.log(JSON.stringify({counts:p.nodes.reduce((a,n)=>{a[n.priority]=(a[n.priority]||0)+1;return a;},{}),sample:p.nodes.slice(0,3).map(n=>[n.title.slice(0,8),n.priority])}));
