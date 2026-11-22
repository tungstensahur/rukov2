/* ---------- v48: the Roblox Studio look for Ruko Studio ---------- */
/* Only paint. The editor's markup and behaviour stay where they are (14-…), this file just styles
   it the way Studio looks: a grey ribbon of grouped buttons, an Explorer and a Properties panel
   side by side on the right, and the screen UI drawn over the viewport. */
(function () {
  if (window.RKSTUDIOLOOK) return;
  window.RKSTUDIOLOOK = 1;
  const css = `
/* ---------- ribbon and title ---------- */
#stu{--rk-bg:#17181c;--rk-panel:#212226;--rk-panel2:#2a2b30;--rk-line:#35373d;--rk-line2:#45474f;
 --rk-tx:#e7e8ea;--rk-mut:#9b9ea7;--rk-acc:#00a2ff;--rk-acc2:#ff8a1f;border-radius:8px;box-shadow:0 18px 44px #0007}
#stu button{border-radius:4px;font-size:12.5px;background:#2a2b30}
#stu button:hover{background:#32343a;border-color:var(--rk-line2)}
#stu button.on,#stu button.pri,#stu button.on:hover,#stu button.pri:hover{background:#00a2ff;border-color:#00a2ff;color:#fff;box-shadow:none}
#stu input,#stu select{border-radius:4px;background:#1b1c20}
#stu>.stu-top{background:#242529;border-bottom:1px solid var(--rk-line);min-height:46px;padding:6px 10px}
#stu>.stu-top>b{background:#1b1c20;border-radius:4px;padding:5px 10px;font-weight:600}
#stu>.stu-ribbon{display:flex;align-items:stretch;gap:0;padding:3px 4px;background:#242529;border-bottom:1px solid var(--rk-line);overflow-x:auto;scrollbar-width:thin}
#stu .stu-grp{display:flex;flex-direction:column;justify-content:space-between;gap:3px;padding:0 8px;border-right:1px solid var(--rk-line)}
#stu .stu-grp:last-child{border-right:0}
#stu .stu-grp>span{font-size:9.5px;color:#878b94;text-align:center;letter-spacing:.06em}
#stu .stu-gb{display:flex;gap:4px;align-items:center}
#stu .stu-gb button{min-height:30px;padding:5px 9px;font-size:12px;background:#2e3036}
#stu .stu-gb select{min-height:30px;padding:4px 6px;font-size:12px;margin:0}
/* ---------- panels ---------- */
#stu>.stu-main{grid-template-columns:210px minmax(0,1fr) 330px}
#stu .stu-h{position:sticky;top:-12px;z-index:3;margin:-12px -12px 8px;padding:6px 10px;background:#2a2c31;
 border-bottom:1px solid var(--rk-line);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#c6cad2;font-weight:700}
#stu .stu-pn{min-height:0;padding:12px}
#stu .stu-tb .stu-h{margin:-10px -10px 8px}
@media(min-width:981px){#stu .stu-tabs{display:none}
 #stu .stu-side>.stu-pn.on{display:block}
 #stu .stu-side>.stu-pn[data-p=ex]{flex:1.05}
 #stu .stu-side>.stu-pn[data-p=props]{flex:1;border-top:1px solid var(--rk-line)}}
/* ---------- explorer tree ---------- */
#stu .rk-k{padding-left:10px;margin-left:5px;border-left:1px solid var(--rk-line)}
#stu .rk-n:not(.open)>.rk-k{display:none}
#stu .rk-nh{display:flex;align-items:center;gap:5px;padding:4px 5px;border-radius:4px;cursor:pointer;font-size:12.5px;color:#dfe2e8}
#stu .rk-nh:hover{background:#2c2e35}
#stu .rk-nh .rk-ar{font-style:normal;font-size:9px;color:#84888f;width:9px}
#stu .rk-nh b{font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#stu .rk-nh em{font-style:normal;font-size:10px;background:#34373e;color:#bcc0c8;border-radius:9px;padding:0 6px}
#stu .rk-n[data-n=ws]>.rk-nh b,#stu .rk-n[data-n=sp]>.rk-nh b{color:#fff}
#stu .ex{display:flex;align-items:center;gap:6px;padding:4px 6px;font-size:12.5px;border-radius:4px}
#stu .ex.sel{background:#00a2ff26;outline:1px solid #00a2ff99}
/* ---------- screen UI drawn over the viewport ---------- */
#stu .stu-ui{position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
#stu .stu-ui .rk-u{position:absolute;pointer-events:auto;cursor:move;box-sizing:border-box}
#stu .rk-u-panel{background:#0b0e18b8;border:1px solid #ffffff26;border-radius:12px}
#stu .rk-u-label{font-weight:800;line-height:1.25;color:#fff;text-shadow:0 2px 6px #000a;white-space:pre-wrap}
#stu .rk-u-bar{background:#00000073;border:1px solid #ffffff2e;border-radius:9px;overflow:hidden}
#stu .rk-u-bar i{display:block;height:100%;background:#35c4a0}
#stu .rk-u-bar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000}
#stu .rk-u-button{background:#2f80ede0;color:#fff;border:1px solid #ffffff33;border-radius:11px;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}
#stu .rk-u.sel{outline:2px dashed #00a2ff;outline-offset:2px}
#stu .stu-bp{position:absolute;left:10px;top:8px;z-index:4;font-size:11px;color:#c6cad2;background:#0b0e15cc;
 border:1px solid var(--rk-line);border-radius:4px;padding:3px 8px;pointer-events:none}
/* ---------- phones ---------- */
@media(max-width:980px){
 #stu .stu-h{margin:-10px -12px 8px;position:static}
 #stu .stu-bp{display:none}
 #stu>.stu-ribbon{padding:2px 2px 3px}
 #stu .stu-grp>span{display:none}
 #stu .stu-grp{padding:0 5px}
 #stu .stu-gb button{min-height:32px;padding:5px 8px}
}`;
  const st = document.createElement('style');
  st.id = 'rk48-ststudio';
  st.textContent = css;
  document.head.appendChild(st);
})();
