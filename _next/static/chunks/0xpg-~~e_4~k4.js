(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,3160,e=>{"use strict";var t=e.i(18050),r=e.i(18566);e.s(["default",0,function(){let e=(0,r.useRouter)();return(0,t.jsxs)("button",{onClick:()=>e.back(),className:"inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all duration-300 group mb-6 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full shadow-sm",children:[(0,t.jsx)("svg",{className:"w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2.5,d:"M10 19l-7-7m0 0l7-7m-7 7h18"})}),"Back"]})}])},53749,e=>{"use strict";var t=e.i(18050),r=e.i(71645),l=e.i(3160);e.s(["default",0,function(){let e=(0,r.useRef)(null);return(0,r.useEffect)(()=>{if(!e.current)return;let t=(e=>{let t=e.querySelector("#gridBackground"),r=e.querySelector("#tileLayer"),l=e.querySelector("#scoreDisplay"),a=e.querySelector("#bestScoreDisplay"),o=e.querySelector("#btnNewGame"),s=e.querySelector("#btnExport"),i=e.querySelector("#btnImport"),n=e.querySelector("#importFileInput"),d=e.querySelector("#modalOverlay"),c=e.querySelector("#modalEmoji"),f=e.querySelector("#modalTitle"),u=e.querySelector("#modalMessage"),p=e.querySelector("#modalButtons"),m=e.querySelector("#gameBoardContainer");if(!t||!r||!l||!a||!o||!s||!i||!n||!d||!c||!f||!u||!p||!m)return void console.error("2048 游戏初始化失败：缺少必要的 DOM 元素");let x=[],g=new Map,h=new Map,b=1,w=0,v=0,y=!1,k=!1,j=!1,N=null,L=(e,t)=>{let r,{cellSize:l,gap:a}={cellSize:parseInt((r=getComputedStyle(document.documentElement)).getPropertyValue("--cell-size").trim())||100,gap:parseInt(r.getPropertyValue("--gap").trim())||12};return{left:t*(l+a),top:e*(l+a),size:l}};if(16!==t.children.length){t.innerHTML="";for(let e=0;e<16;e++){let e=document.createElement("div");e.className="grid-cell",t.appendChild(e)}}let z=()=>{l.textContent=String(w),a.textContent=String(v)},S=()=>{try{localStorage.setItem("2048_bestScore",String(v))}catch(e){}},E=e=>{let t=document.createElement("div");t.className="tile",t.setAttribute("data-value",String(e.value)),t.textContent=String(e.value);let{left:r,top:l,size:a}=L(e.row,e.col);return t.style.left=r+"px",t.style.top=l+"px",t.style.width=a+"px",t.style.height=a+"px",e.value>65536&&t.classList.add("super-large"),t},C=()=>{r.innerHTML="",h.clear();let e=document.createDocumentFragment();for(let[t,r]of g){let l=E(r);h.set(t,l),e.appendChild(l)}r.appendChild(e),requestAnimationFrame(()=>{for(let[e,t]of g)if(t.isNew){let r=h.get(e);r&&(r.classList.add("new-tile"),setTimeout(()=>r.classList.remove("new-tile"),260)),t.isNew=!1}})},T=()=>{let e=[];for(let t=0;t<4;t++)for(let r=0;r<4;r++)null===x[t][r]&&e.push({row:t,col:r});if(0===e.length)return null;let{row:t,col:r}=e[Math.floor(Math.random()*e.length)],l=.9>Math.random()?2:4,a=b++;return x[t][r]=a,g.set(a,{id:a,value:l,row:t,col:r,isNew:!0,mergedFrom:null}),{id:a,row:t,col:r,value:l}},I=()=>{let e=[];for(let t=0;t<4;t++)for(let r=0;r<4;r++){let l=x[t][r];e.push(null===l?"0":String(g.get(l)?.value??"0"))}return e.join(",")},M=(e,t)=>{let r=0,l=e.map(e=>({...e,mergedFrom:null})),a=[],o=0,s=new Set;for(;o<l.length;)if(!(o<l.length-1)||l[o].value!==l[o+1].value||s.has(o)||s.has(o+1))a.push({id:l[o].id,value:l[o].value,mergedFrom:null}),o+=1;else{let e=2*l[o].value;r+=e,a.push({id:null,value:e,mergedFrom:[l[o].id,l[o+1].id]}),s.add(o),s.add(o+1),o+=2}return{tiles:a,scoreGain:r}},F=()=>{d.style.display="none",p.innerHTML=""},q=()=>{c.textContent="😢",f.textContent="游戏结束",u.textContent="没有可用的移动了。\n别灰心，再来一局吧！",p.innerHTML=`
          <button class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95" id="btnModalNewGame">🔄 新游戏</button>
          <button class="px-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95" id="btnModalClose">✕ 关闭</button>
        `,d.style.display="flex";let e=document.getElementById("btnModalNewGame"),t=document.getElementById("btnModalClose");e?.addEventListener("click",()=>{F(),O()}),t?.addEventListener("click",F)},A=e=>{if(!j&&!k){if(j=!0,!(e=>{let t=I(),o=[],s=[],i=new Set,n=0;for(let t of(e=>{let t=[];if("left"===e)for(let e=0;e<4;e++){let r=[];for(let t=0;t<4;t++)r.push({row:e,col:t});t.push(r)}else if("right"===e)for(let e=0;e<4;e++){let r=[];for(let t=3;t>=0;t--)r.push({row:e,col:t});t.push(r)}else if("up"===e)for(let e=0;e<4;e++){let r=[];for(let t=0;t<4;t++)r.push({row:t,col:e});t.push(r)}else if("down"===e)for(let e=0;e<4;e++){let r=[];for(let t=3;t>=0;t--)r.push({row:t,col:e});t.push(r)}return t})(e)){let e=[];for(let{row:r,col:l}of t){let t=x[r][l];if(null!==t){let a=g.get(t);e.push({id:t,value:a.value,origRow:r,origCol:l})}}if(0===e.length)continue;let r=M(e,t);for(let{row:e,col:l}of(n+=r.scoreGain,t))x[e][l]=null;for(let e=0;e<r.tiles.length;e++){let l=r.tiles[e],a=t[e];if(l.mergedFrom){let e=b++;x[a.row][a.col]=e,g.set(e,{id:e,value:l.value,row:a.row,col:a.col,isNew:!1,mergedFrom:l.mergedFrom}),s.push({tileId1:l.mergedFrom[0],tileId2:l.mergedFrom[1],mergedId:e,value:l.value,row:a.row,col:a.col}),i.add(l.mergedFrom[0]),i.add(l.mergedFrom[1])}else if(l.id){x[a.row][a.col]=l.id;let e=g.get(l.id);(e.row!==a.row||e.col!==a.col)&&(o.push({tileId:l.id,fromRow:e.row,fromCol:e.col,toRow:a.row,toCol:a.col}),e.row=a.row,e.col=a.col)}}}for(let e of i)g.delete(e);n>0&&(w+=n,z(),w>v&&(v=w,S(),z(),a.classList.remove("pop"),a.offsetWidth,a.classList.add("pop"),setTimeout(()=>a.classList.remove("pop"),420)));let d=t!==I();return d&&((e,t,a)=>{for(let[e,r]of h){if(t.has(e))continue;let l=g.get(e);if(l){let{left:e,top:t,size:a}=L(l.row,l.col);r.style.left=e+"px",r.style.top=t+"px",r.style.width=a+"px",r.style.height=a+"px"}}for(let t of e){let e=h.get(t.tileId1),r=h.get(t.tileId2),{left:l,top:a,size:o}=L(t.row,t.col);e&&(e.style.left=l+"px",e.style.top=a+"px",e.style.width=o+"px",e.style.height=o+"px",e.style.opacity="0",e.style.zIndex="3",e.style.transition="left 0.12s ease, top 0.12s ease, opacity 0.08s ease 0.08s, transform 0.1s ease"),r&&(r.style.left=l+"px",r.style.top=a+"px",r.style.width=o+"px",r.style.height=o+"px",r.style.opacity="0",r.style.zIndex="3",r.style.transition="left 0.12s ease, top 0.12s ease, opacity 0.08s ease 0.08s, transform 0.1s ease")}setTimeout(()=>{for(let e of t){let t=h.get(e);t&&(t.remove(),h.delete(e))}for(let t of e){let e=g.get(t.mergedId);if(e){let l=E(e);l.classList.add("merging"),h.set(t.mergedId,l),r.appendChild(l),setTimeout(()=>l.classList.remove("merging"),220)}}if(a&&a.id){let e=g.get(a.id);if(e){let t=E(e);t.classList.add("new-tile"),h.set(a.id,t),r.appendChild(t),setTimeout(()=>{t.classList.remove("new-tile"),e&&(e.isNew=!1)},260)}}},100),e.length>0&&(l.classList.remove("pop"),l.offsetWidth,l.classList.add("pop"),setTimeout(()=>l.classList.remove("pop"),420))})(s,i,T()),d})(e)){j=!1;return}N&&clearTimeout(N),N=setTimeout(()=>{if(j=!1,N=null,(()=>{if(y)return!1;for(let[,e]of g)if(e.value>=2048)return!0;return!1})()){let e,t;c.textContent="🎉",f.textContent="恭喜获胜！",u.textContent="你成功拼出了 2048！\n太厉害了！是否继续挑战更高分数？",p.innerHTML=`
          <button class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95" id="btnContinue">🚀 继续游戏</button>
          <button class="px-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95" id="btnModalNewGame">🔄 新游戏</button>
        `,d.style.display="flex",e=document.getElementById("btnContinue"),t=document.getElementById("btnModalNewGame"),e?.addEventListener("click",()=>{y=!0,F(),m.focus()}),t?.addEventListener("click",()=>{F(),O()})}else(()=>{for(let e=0;e<4;e++)for(let t=0;t<4;t++)if(null===x[e][t])return!1;for(let e=0;e<4;e++)for(let t=0;t<3;t++)if(g.get(x[e][t])?.value===g.get(x[e][t+1])?.value)return!1;for(let e=0;e<3;e++)for(let t=0;t<4;t++)if(g.get(x[e][t])?.value===g.get(x[e+1][t])?.value)return!1;return!0})()&&(k=!0,q())},270)}},B=e=>{let t=document.querySelector(".toast-msg");t&&t.remove();let r=document.createElement("div");r.className="toast-msg",r.textContent=e,r.style.cssText=`
          position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
          background: #3c3a32; color: #f9f6f2; padding: 12px 24px; border-radius: 25px;
          font-size: 0.9rem; font-weight: 600; z-index: 2000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          animation: toastIn 0.35s ease forwards; pointer-events: none; white-space: nowrap;
          font-family: inherit;
        `,document.body.appendChild(r),setTimeout(()=>{r.style.animation="toastOut 0.3s ease forwards",setTimeout(()=>r.remove(),300)},2500)},O=()=>{x=Array.from({length:4},()=>[,,,,].fill(null)),g.clear(),h.clear(),r.innerHTML="",b=1,w=0,y=!1,k=!1,j=!1,N&&clearTimeout(N),z(),T(),T(),C(),F(),m.focus()},P=e=>{if("flex"===d.style.display){"Escape"===e.key&&(F(),m.focus());return}let t=null;switch(e.key){case"ArrowLeft":case"Left":t="left";break;case"ArrowRight":case"Right":t="right";break;case"ArrowUp":case"Up":t="up";break;case"ArrowDown":case"Down":t="down";break;default:return}e.preventDefault(),A(t)};document.addEventListener("keydown",P),o.addEventListener("click",O),s.addEventListener("click",()=>{let e={version:1,grid:[],score:w,hasWon:y,isGameOver:k,timestamp:new Date().toISOString()};for(let t=0;t<4;t++){let r=[];for(let e=0;e<4;e++){let l=x[t][e];r.push(null===l?0:g.get(l)?.value??0)}e.grid.push(r)}let t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),r=URL.createObjectURL(t),l=document.createElement("a");l.href=r,l.download=`2048-save-${Date.now()}.json`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(r),B("✅ 存档已导出")}),i.addEventListener("click",()=>n.click()),n.addEventListener("change",e=>{let t=e.target;if(t.files&&t.files.length>0){var l;let e;l=t.files[0],(e=new FileReader).onload=e=>{try{let t=JSON.parse(e.target?.result);if(!(e=>{if(!e||"object"!=typeof e||!Array.isArray(e.grid)||4!==e.grid.length)return!1;for(let t of e.grid){if(!Array.isArray(t)||4!==t.length)return!1;for(let e of t)if("number"!=typeof e||isNaN(e)||e<0)return!1}return!("number"!=typeof e.score||isNaN(e.score))&&!(e.score<0)})(t))return void B("❌ 存档数据格式无效，请检查文件");x=Array.from({length:4},()=>[,,,,].fill(null)),g.clear(),h.clear(),r.innerHTML="",b=1,j=!1,N&&clearTimeout(N);for(let e=0;e<4;e++)for(let r=0;r<4;r++){let l=t.grid[e][r];if(l>0){let t=b++;x[e][r]=t,g.set(t,{id:t,value:l,row:e,col:r,isNew:!1,mergedFrom:null})}}w=t.score,y=t.hasWon||!1,k=t.isGameOver||!1,w>v&&(v=w,S()),z(),C(),F(),k&&setTimeout(()=>q(),300),B("✅ 存档已成功导入")}catch{B("❌ 无法解析存档文件，请确认是有效的JSON文件")}},e.onerror=()=>B("❌ 读取文件失败，请重试"),e.readAsText(l),t.value=""}}),d.addEventListener("click",e=>{e.target===d&&(F(),m.focus())});let R=0,D=0,G=e=>{1===e.touches.length&&(R=e.touches[0].clientX,D=e.touches[0].clientY)},U=e=>{if(j||k||"flex"===d.style.display)return;let t=(e.changedTouches[0]?.clientX||R)-R,r=(e.changedTouches[0]?.clientY||D)-D,l=Math.abs(t),a=Math.abs(r);30>Math.max(l,a)||(e.preventDefault(),A(l>a?t>0?"right":"left":r>0?"down":"up"))};m.addEventListener("touchstart",G,{passive:!0}),m.addEventListener("touchend",U),m.setAttribute("tabindex","0"),m.style.outline="none",m.addEventListener("click",()=>m.focus());let H=()=>{let e=getComputedStyle(document.documentElement),t=4*(parseInt(e.getPropertyValue("--cell-size").trim())||100)+3*(parseInt(e.getPropertyValue("--gap").trim())||12);r.style.width=t+"px",r.style.height=t+"px",r.style.top=e.getPropertyValue("--grid-padding").trim()||"12px",r.style.left=e.getPropertyValue("--grid-padding").trim()||"12px"};window.addEventListener("resize",H);try{let e=localStorage.getItem("2048_bestScore");if(null!==e){let t=parseInt(e,10);!isNaN(t)&&t>=0&&(v=t)}}catch(e){}return H(),O(),()=>{document.removeEventListener("keydown",P),window.removeEventListener("resize",H),m.removeEventListener("touchstart",G),m.removeEventListener("touchend",U),N&&clearTimeout(N),d.style.display="none"}})(e.current);return()=>{t&&t()}},[]),(0,t.jsxs)("div",{className:"w-[70%] mx-auto py-8 px-4",children:[(0,t.jsx)(l.default,{}),(0,t.jsx)("h1",{className:"text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2",children:"2048"}),(0,t.jsx)("p",{className:"text-sm text-slate-500 dark:text-slate-400 mb-8",children:"经典数字拼图游戏，使用方向键移动方块，合并相同数字拼出 2048！"}),(0,t.jsxs)("div",{ref:e,className:"flex flex-wrap gap-6 items-start justify-center w-full",children:[(0,t.jsxs)("div",{className:"game-board-container",id:"gameBoardContainer",children:[(0,t.jsx)("div",{className:"grid-background",id:"gridBackground"}),(0,t.jsx)("div",{className:"tile-layer",id:"tileLayer"})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-4 min-w-[200px] max-w-[220px]",children:[(0,t.jsxs)("div",{className:"flex gap-2.5",children:[(0,t.jsxs)("div",{className:"flex-1 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl px-4 py-2.5 text-center",children:[(0,t.jsx)("div",{className:"text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest",children:"得分"}),(0,t.jsx)("div",{className:"text-xl md:text-2xl font-black text-slate-900 dark:text-white score-value",id:"scoreDisplay",children:"0"})]}),(0,t.jsxs)("div",{className:"flex-1 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl px-4 py-2.5 text-center",children:[(0,t.jsx)("div",{className:"text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest",children:"最高分"}),(0,t.jsx)("div",{className:"text-xl md:text-2xl font-black text-slate-900 dark:text-white score-value",id:"bestScoreDisplay",children:"0"})]})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-2",children:[(0,t.jsx)("button",{className:"w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95",id:"btnNewGame",children:"🔄 新游戏"}),(0,t.jsx)("button",{className:"w-full px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95",id:"btnExport",children:"📤 导出存档"}),(0,t.jsx)("button",{className:"w-full px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95",id:"btnImport",children:"📥 导入存档"}),(0,t.jsx)("input",{type:"file",id:"importFileInput",accept:".json",style:{display:"none"}})]}),(0,t.jsxs)("div",{className:"rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4",children:[(0,t.jsx)("h3",{className:"text-xs font-black text-slate-700 dark:text-slate-300 mb-2.5",children:"操作说明"}),(0,t.jsxs)("ul",{children:[(0,t.jsxs)("li",{className:"flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none",children:[(0,t.jsx)("span",{children:"⌨️"}),(0,t.jsxs)("span",{children:["方向键 ",(0,t.jsx)("span",{className:"inline-block bg-white/60 dark:bg-slate-700/60 px-1 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-white/40 dark:border-white/10",children:"↑↓←→"})," 移动"]})]}),(0,t.jsxs)("li",{className:"flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none",children:[(0,t.jsx)("span",{children:"➕"}),(0,t.jsx)("span",{children:"相同数字合并得分"})]}),(0,t.jsxs)("li",{className:"flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none",children:[(0,t.jsx)("span",{children:"💾"}),(0,t.jsx)("span",{children:"存档可保存/恢复进度"})]}),(0,t.jsxs)("li",{className:"flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none",children:[(0,t.jsx)("span",{children:"🏆"}),(0,t.jsx)("span",{children:"拼出 2048 获胜！"})]}),(0,t.jsxs)("li",{className:"flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none",children:[(0,t.jsx)("span",{children:"📱"}),(0,t.jsx)("span",{children:"支持触摸滑动"})]})]})]})]}),(0,t.jsx)("div",{className:"fixed inset-0 bg-black/55 z-[1000] flex items-center justify-center",id:"modalOverlay",style:{display:"none"},children:(0,t.jsxs)("div",{className:"rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 text-center max-w-[380px] w-[90%]",children:[(0,t.jsx)("span",{className:"text-4xl block mb-1.5",id:"modalEmoji",children:"🎉"}),(0,t.jsx)("h2",{className:"text-lg font-black text-slate-900 dark:text-white mb-2",id:"modalTitle",children:"恭喜！"}),(0,t.jsx)("p",{className:"text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed",id:"modalMessage",children:"你达到了2048！"}),(0,t.jsx)("div",{className:"flex gap-2 flex-wrap justify-center",id:"modalButtons"})]})})]}),(0,t.jsx)("style",{children:`
        :root {
          --cell-size: 100px;
          --gap: 12px;
          --grid-padding: 12px;
          --tile-size: 100px;
          --grid-bg: #cbd5e1;
          --cell-bg: #f1f5f9;
        }
        .dark {
          --grid-bg: #334155;
          --cell-bg: #475569;
        }

        .game-board-container {
          position: relative;
          background: var(--grid-bg);
          border-radius: 16px;
          padding: var(--grid-padding);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          width: fit-content;
        }

        .grid-background {
          display: grid;
          grid-template-columns: repeat(4, var(--cell-size));
          grid-template-rows: repeat(4, var(--cell-size));
          gap: var(--gap);
          position: relative;
          z-index: 1;
        }
        .grid-cell {
          background: var(--cell-bg);
          border-radius: 10px;
        }

        .tile-layer {
          position: absolute;
          top: var(--grid-padding);
          left: var(--grid-padding);
          z-index: 2;
          pointer-events: none;
        }

        .tile {
          position: absolute;
          width: var(--tile-size);
          height: var(--tile-size);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 2.2rem;
          color: #475569;
          transition: left 0.15s ease, top 0.15s ease, transform 0.12s ease;
          will-change: left, top, transform;
          line-height: 1;
        }
        .tile.merging { animation: mergePop 0.2s ease forwards; z-index: 10; }
        .tile.new-tile { animation: fadeInPop 0.25s ease forwards; z-index: 5; }

        @keyframes scorePop {
          0% { transform: scale(1); }
          30% { transform: scale(1.25); color: #818cf8; }
          100% { transform: scale(1); }
        }
        @keyframes mergePop {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        @keyframes fadeInPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes toastIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastOut {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-15px); }
        }

        .score-value.pop {
          animation: scorePop 0.4s ease;
        }

        .tile[data-value="2"]   { background: #e0e7ff; color: #475569; }
        .tile[data-value="4"]   { background: #c7d2fe; color: #475569; }
        .tile[data-value="8"]   { background: #a5b4fc; color: #ffffff; }
        .tile[data-value="16"]  { background: #818cf8; color: #ffffff; }
        .tile[data-value="32"]  { background: #6366f1; color: #ffffff; }
        .tile[data-value="64"]  { background: #4f46e5; color: #ffffff; }
        .tile[data-value="128"] { background: #8b5cf6; color: #ffffff; font-size: 1.9rem; }
        .tile[data-value="256"] { background: #7c3aed; color: #ffffff; font-size: 1.9rem; }
        .tile[data-value="512"] { background: #6d28d9; color: #ffffff; font-size: 1.9rem; }
        .tile[data-value="1024"] { background: #10b981; color: #ffffff; font-size: 1.55rem; }
        .tile[data-value="2048"] { background: #34d399; color: #ffffff; font-size: 1.55rem; box-shadow: 0 0 20px rgba(52, 211, 153, 0.5); }
        .tile[data-value="4096"] { background: #f59e0b; color: #ffffff; font-size: 1.4rem; }
        .tile[data-value="8192"] { background: #d97706; color: #ffffff; font-size: 1.3rem; }
        .tile[data-value="16384"] { background: #b45309; color: #ffffff; font-size: 1.1rem; }
        .tile[data-value="32768"] { background: #78350f; color: #ffffff; font-size: 1rem; }
        .tile[data-value="65536"] { background: #451a03; color: #ffffff; font-size: 0.85rem; }
        .tile.super-large { background: #451a03; color: #ffffff; font-size: 0.9rem; }

        @media (max-width: 700px) {
          :root { --cell-size: 70px; --gap: 8px; --grid-padding: 8px; --tile-size: 70px; }
          .tile { font-size: 1.5rem; }
        }
        @media (max-width: 380px) {
          :root { --cell-size: 58px; --gap: 6px; --grid-padding: 6px; --tile-size: 58px; }
          .tile { font-size: 1.2rem; border-radius: 5px; }
        }
      `})]})}])}]);