(() => {
  const products = window.CN_PRODUCTS || [];
  const categories = ["厨房用品","家居百货","美妆个护","汽车配件","健身器材","宠物用品"];
  const pages = [{type:"cover"}];
  categories.forEach(category => {
    const items = products.filter(p => p.category === category);
    if (!items.length) return;
    pages.push({type:"divider", category});
    for (let i=0;i<items.length;i+=10) pages.push({type:"products",category,items:items.slice(i,i+10)});
  });
  const root=document.querySelector("#pages"), input=document.querySelector("#page"), total=document.querySelector("#total"), stage=document.querySelector("#stage");
  const price=v=>v==null?"价格待定":new Intl.NumberFormat("zh-CN",{maximumFractionDigits:2}).format(v);
  const card=p=>`<article class="card"><div class="photo">${p.image?`<img src="${p.image}" alt="${p.name}">`:""}</div><div class="copy"><h2>${p.code} ${p.name}</h2>${p.variants.map(v=>`${v.spec?`<p>采购规格：${v.spec}</p>`:""}${v.carton==null?"":`<p>装箱数：${Number(v.carton).toLocaleString("zh-CN")}/箱</p>`}<p>批发价：${price(v.price)}</p>`).join("")}</div></article>`;
  pages.forEach((p,i)=>{
    const s=document.createElement("section"); s.className=`sheet ${p.type}`; s.dataset.page=i+1;
    if(p.type==="cover") s.innerHTML=`<div class="cover-mark"><i></i><b>GAIVOTA</b></div><h1>产品目录</h1><p>2026 · 中文批发版</p>`;
    if(p.type==="divider") s.innerHTML=`<div class="divider-shape"></div><h1>${p.category}</h1>`;
    if(p.type==="products") s.innerHTML=`<div class="grid">${p.items.map(card).join("")}</div><span class="number">${String(i+1).padStart(2,"0")}</span>`;
    root.append(s);
  });
  const sheets=[...document.querySelectorAll(".sheet")]; total.textContent=pages.length; input.max=pages.length; let current=0,zoom=1;
  const go=n=>{current=Math.max(0,Math.min(n,sheets.length-1));sheets[current].scrollIntoView({behavior:"smooth",block:"start"});input.value=current+1;document.querySelector("#prev").disabled=current===0;document.querySelector("#next").disabled=current===sheets.length-1};
  new IntersectionObserver(es=>{const v=es.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(v){current=Number(v.target.dataset.page)-1;input.value=current+1;}},{root:stage,threshold:[.4,.65]}).observe(sheets[0]);
  sheets.slice(1).forEach(s=>new IntersectionObserver(es=>{if(es[0].isIntersecting){current=Number(s.dataset.page)-1;input.value=current+1;}},{root:stage,threshold:.6}).observe(s));
  document.querySelector("#prev").onclick=()=>go(current-1);document.querySelector("#next").onclick=()=>go(current+1);input.onchange=()=>go(Number(input.value)-1);
  const setZoom=()=>{root.style.setProperty("--zoom",zoom);document.querySelector("#zoom").textContent=`${Math.round(zoom*100)}%`};
  document.querySelector("#smaller").onclick=()=>{zoom=Math.max(.6,zoom-.1);setZoom()};document.querySelector("#larger").onclick=()=>{zoom=Math.min(1.4,zoom+.1);setZoom()};document.querySelector("#fit").onclick=()=>{zoom=1;setZoom()};go(0);
})();
