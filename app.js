/* رفتار فروشگاه، مستقل از کتابخانه‌های خارجی */
(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const toast = text => {
    const el = $("#toast"); el.textContent = text; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
  };
  const cleanUser = value => String(value || "").trim().replace(/^@/, "");
  const validUser = value => /^[A-Za-z0-9_]{5,32}$/.test(cleanUser(value)) && !/^your_telegram_username$/i.test(cleanUser(value));
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const cfg = window.CONFIG;
  if (!cfg) { document.body.innerHTML = "<main style='padding:3rem;font-family:system-ui'>خطا: فایل config.js بارگذاری نشد.</main>"; return; }
  document.title = `${cfg.brandName} | دوره‌های پایتون`;
  $("#brandName").textContent = cfg.brandName; $("#footerBrand").textContent = cfg.brandName;
  $("#tagline").textContent = cfg.tagline;
  document.querySelector('meta[name="description"]').content = cfg.description;
  document.querySelector('meta[property="og:title"]').content = `${cfg.brandName} | آموزش کاربردی`;
  document.querySelector('meta[property="og:description"]').content = cfg.description;
  const canonical = document.querySelector('link[rel="canonical"]'); canonical.href = cfg.domain;
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) { ogUrl=document.createElement("meta"); ogUrl.setAttribute("property","og:url"); document.head.appendChild(ogUrl); }
  ogUrl.content = cfg.domain;
  $("#year").textContent = new Date().getFullYear();
  const products = $("#products");
  products.innerHTML = cfg.products.map((p,i) => `<article class="product" id="product-${escapeHtml(p.id)}">${p.badge ? `<span class="product-badge">${escapeHtml(p.badge)}</span>` : ""}<span class="product-symbol" aria-hidden="true">${i ? "◇" : "⌘"}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.summary)}</p><ul class="feature-list">${p.features.map(f=>`<li>${escapeHtml(f)}</li>`).join("")}</ul><div class="product-bottom"><div><span class="price-label">قیمت دوره</span><span class="price">${escapeHtml(p.price)}</span></div><button class="button primary buy-btn" type="button" data-product="${escapeHtml(p.id)}" aria-label="خرید و ارسال فیش برای ${escapeHtml(p.title)}">خرید و ارسال فیش ←</button></div></article>`).join("");
  const support = cleanUser(cfg.supportTelegramUsername);
  if (validUser(support)) { $("#supportLink").href = `https://t.me/${encodeURIComponent(support)}`; $("#supportLink").target="_blank"; $("#supportLink").rel="noopener noreferrer"; }
  else { $("#supportLink").href="#checkout"; $("#supportLink").addEventListener("click", e=>{e.preventDefault();toast("برای پشتیبانی، supportTelegramUsername را در config.js تنظیم کنید.");}); }
  const modal=$("#checkout"), form=$("#buyerForm"), send=$("#sendReceipt"), help=$("#telegramHelp");
  let selected=null, lastFocus=null;
  function openCheckout(product) {
    selected=product; lastFocus=document.activeElement;
    $("#selectedProduct").textContent=product.title; $("#modalPrice").textContent=product.price;
    $("#cardNumber").textContent=cfg.cardNumber; $("#cardOwner").textContent=cfg.cardOwner;
    $("#messagePreview").hidden=true; $("#readyMessage").textContent="";
    const ready=validUser(cfg.telegramUsername); send.disabled=!ready;
    help.textContent=ready ? "پس از ثبت اطلاعات, متن پیام آماده کپی می‌شود. فیش را خودتان در تلگرام ضمیمه کنید." : "برای فعال شدن ارسال، telegramUsername را با نام کاربری معتبر در config.js تنظیم کنید (بدون @).";
    modal.hidden=false; document.body.style.overflow="hidden"; $("#buyerName").focus();
  }
  function closeModal() { modal.hidden=true; document.body.style.overflow=""; if(lastFocus) lastFocus.focus(); }
  products.addEventListener("click", e=>{const b=e.target.closest("[data-product]");if(!b)return;const product=cfg.products.find(x=>x.id===b.dataset.product);if(product)openCheckout(product);});
  $("#closeModal").addEventListener("click",closeModal);
  modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeModal();if(e.key==="Tab"&&!modal.hidden){const f=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')].filter(x=>x.offsetParent);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
  async function copy(text) {
    try { if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else { const area=document.createElement("textarea"); area.value=text; area.style.position="fixed"; area.style.opacity="0"; document.body.appendChild(area); area.select(); const ok=document.execCommand("copy"); area.remove(); if(!ok)throw Error("copy failed"); }
      return true;
    } catch (_) { return false; }
  }
  $("#copyCard").addEventListener("click",async()=>toast(await copy(cfg.cardNumber)?"شماره کارت کپی شد.":"کپی نشد؛ شماره کارت را دستی انتخاب کنید."));
  function normalizedPhone(v){return String(v).trim().replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));}
  function makeMessage(name,phone){return `سلام، برای ثبت‌نام در «${selected.title}» پیام می‌دهم.
مبلغ دوره: ${selected.price}
نام: ${name}
شماره موبایل: ${phone}
فیش پرداخت را پیوست کرده‌ام. لطفاً پس از بررسی دستی راهنمای دسترسی را ارسال کنید.`;}
  form.addEventListener("submit",async e=>{
    e.preventDefault(); if(!selected||!validUser(cfg.telegramUsername))return;
    const name=$("#buyerName").value.trim(), phone=normalizedPhone($("#buyerPhone").value);
    if(name.length<2||phone.replace(/\D/g,"").length<8){toast("نام و شماره موبایل معتبر وارد کنید.");return;}
    // فقط اطلاعات لازم برای آماده‌سازی پیام نگهداری می‌شود؛ اطلاعات حساس پرداخت دریافت نمی‌شود.
    try { localStorage.setItem("educational-store-buyer",JSON.stringify({name,phone})); } catch(_){ }
    const message=makeMessage(name,phone); $("#readyMessage").textContent=message; $("#messagePreview").hidden=false;
    const username=cleanUser(cfg.telegramUsername), url=`https://t.me/${encodeURIComponent(username)}`;
    const copied=await copy(message); toast(copied?"متن آماده کپی شد؛ فیش را در گفت‌وگو ضمیمه کنید.":"متن آماده نمایش داده شد؛ آن را دستی کپی کنید.");
    window.open(url,"_blank","noopener,noreferrer");
  });
  $("#copyMessage").addEventListener("click",async()=>toast(await copy($("#readyMessage").textContent)?"متن پیام کپی شد.":"کپی نشد؛ متن را دستی انتخاب کنید."));
  try { const old=JSON.parse(localStorage.getItem("educational-store-buyer")||"null"); if(old&&typeof old.name==="string"&&typeof old.phone==="string"){ $("#buyerName").value=old.name; $("#buyerPhone").value=old.phone; } } catch(_){ }
  const menu=$(".menu-toggle"), nav=$("#navLinks");
  menu.addEventListener("click",()=>{const isOpen=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(isOpen));menu.setAttribute("aria-label",isOpen?"بستن منو":"باز کردن منو");});
  nav.addEventListener("click",e=>{if(e.target.closest("a")){nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","باز کردن منو");}});
})();
