/* ══════════════════════════════════════════════════════════════
   suwen-edu.cn · 手机菜单修复  js/mobile.js
   ──────────────────────────────────────────────────────────────
   问题：手机上点汉堡按钮没有任何反应。

   本脚本做三件事：
   1. 找页面里的抽屉容器 .sheet / #sheet
   2. 如果没有，就用导航栏里已有的下拉菜单内容自动生成一个
      （链接全部来自页面现有的 .nitem > .drop，不新增任何内容）
   3. 重新绑定汉堡按钮的开关，并处理返回键、Esc、背景锁滚动

   引入方式：在每个 html 的 </head> 之前加
       <script src="js/mobile.js" defer></script>
   blog/ 子目录里写 ../js/mobile.js
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function init() {
    try {
      var nav = document.querySelector('.nav');
      if (!nav) return;

      var burger = nav.querySelector('.burger');
      if (!burger) return;

      // 防止重复初始化
      if (burger.getAttribute('data-mfix') === '1') return;

      var sheet = document.getElementById('sheet') || document.querySelector('.sheet');

      /* ---- 抽屉不存在 → 用导航里现成的链接生成 ---- */
      if (!sheet) {
        sheet = buildSheet(nav);
        if (!sheet) return;
        document.body.appendChild(sheet);
      }
      if (!sheet.id) sheet.id = 'sheet';

      /* ---- 换掉按钮以清除可能已存在的旧监听，避免开了又被关 ---- */
      var fresh = burger.cloneNode(true);
      burger.parentNode.replaceChild(fresh, burger);
      burger = fresh;
      burger.setAttribute('data-mfix', '1');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-controls', 'sheet');
      if (burger.tagName === 'BUTTON') burger.type = 'button';

      var open = false;

      function setOpen(v) {
        open = !!v;
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          sheet.className += ' on';
          document.documentElement.style.overflow = 'hidden';
        } else {
          sheet.className = sheet.className.replace(/\s*\bon\b/g, '');
          document.documentElement.style.overflow = '';
        }
      }

      burger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // 若页面原有脚本在我们之后才绑定，这一行可阻止它重复触发
        // （否则会出现"开了立刻又关"的现象）
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        setOpen(!open);
      });

      // 点抽屉里的链接后关闭（不拦截跳转）
      sheet.addEventListener('click', function (e) {
        var n = e.target;
        while (n && n !== sheet) {
          if (n.tagName === 'A') { setOpen(false); return; }
          n = n.parentNode;
        }
      });

      document.addEventListener('keydown', function (e) {
        if (open && (e.key === 'Escape' || e.keyCode === 27)) setOpen(false);
      });

      // 转到宽屏时自动收起，避免抽屉卡在打开状态
      window.addEventListener('resize', function () {
        if (open && window.innerWidth > 1080) setOpen(false);
      });

      setOpen(false);
    } catch (err) {
      // 出错也不能影响页面其他部分
      if (window.console) console.warn('[mobile.js]', err);
    }
  }

  /* ---- 依据导航栏现有结构生成抽屉 ---- */
  function buildSheet(nav) {
    var items = nav.querySelectorAll('.nitem');
    if (!items.length) return null;

    var sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.id = 'sheet';

    var buyLink = null;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var drop = item.querySelector('.drop');

      // 直接子级的按钮或链接 —— 作为分组标题
      var head = null;
      for (var c = 0; c < item.children.length; c++) {
        var ch = item.children[c];
        if (ch.tagName === 'BUTTON' || ch.tagName === 'A') { head = ch; break; }
      }

      // 课程 CTA：单独提到最下面做主按钮
      if (item.className.indexOf('navcta') > -1) {
        if (head && head.tagName === 'A') {
          buyLink = document.createElement('a');
          buyLink.href = head.getAttribute('href') || '#';
          buyLink.className = 'sbuy';
          buyLink.appendChild(document.createTextNode(text(head)));
        }
      }

      if (drop) {
        var links = drop.querySelectorAll('a');
        if (links.length) {
          var label = head && head.tagName === 'BUTTON' ? text(head) : '';
          if (!label && item.className.indexOf('navcta') > -1) label = '课程';
          if (label) sheet.appendChild(groupLabel(label));
          for (var j = 0; j < links.length; j++) {
            sheet.appendChild(cloneLink(links[j]));
          }
        }
      } else if (head && head.tagName === 'A' && item.className.indexOf('navcta') === -1) {
        sheet.appendChild(cloneLink(head));
      }
    }

    if (buyLink) sheet.appendChild(buyLink);
    return sheet.children.length ? sheet : null;
  }

  function groupLabel(t) {
    var d = document.createElement('div');
    d.className = 'gl';
    d.appendChild(document.createTextNode(t));
    return d;
  }

  function cloneLink(a) {
    var out = document.createElement('a');
    out.href = a.getAttribute('href') || '#';
    var small = a.querySelector('small');
    var main = text(a);
    if (small) main = main.replace(text(small), '');
    out.appendChild(document.createTextNode(trim(main)));
    if (small) {
      var s = document.createElement('small');
      s.appendChild(document.createTextNode(text(small)));
      out.appendChild(s);
    }
    return out;
  }

  function text(el) {
    return (el.textContent || el.innerText || '');
  }

  function trim(s) {
    return s.replace(/^\s+|\s+$/g, '');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
