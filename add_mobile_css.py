# -*- coding: utf-8 -*-
"""
一次性脚本：把  <link rel="stylesheet" href="css/mobile.css">
自动插进本目录及子目录下所有 .html 文件的 </head> 之前。

用法：
  1. 把本文件放到网站根目录（和 index.html 同一层）
  2. 双击运行，或在命令行执行：  python add_mobile_css.py
  3. 看输出确认无误后，把改动上传 GitHub

说明：
  - 子目录（如 blog/）里的页面会自动写成 ../css/mobile.css
  - 已经加过的文件自动跳过，重复运行是安全的
  - 本脚本不需要上传到仓库，跑完即可删除
"""
import io
import os
import re
import sys

MARK = "css/mobile.css"
ROOT = os.path.dirname(os.path.abspath(__file__))

changed, skipped, nohead, failed = [], [], [], []

for dirpath, dirnames, filenames in os.walk(ROOT):
    # 跳过 .git 等隐藏目录
    dirnames[:] = [d for d in dirnames if not d.startswith(".")]

    for fn in filenames:
        if not fn.lower().endswith(".html"):
            continue
        path = os.path.join(dirpath, fn)
        rel = os.path.relpath(path, ROOT)
        try:
            with io.open(path, "r", encoding="utf-8") as f:
                html = f.read()
        except Exception as e:
            failed.append((rel, "读取失败: %s" % e))
            continue

        if MARK in html:
            skipped.append(rel)
            continue

        # 按目录深度算相对路径：根目录 -> css/...，blog/ -> ../css/...
        reldir = os.path.relpath(dirpath, ROOT)
        depth = 0 if reldir == "." else reldir.count(os.sep) + 1
        link = '<link rel="stylesheet" href="%scss/mobile.css">\n' % ("../" * depth)

        m = re.search(r"</head\s*>", html, re.IGNORECASE)
        if not m:
            nohead.append(rel)
            continue

        html = html[: m.start()] + link + html[m.start():]
        try:
            with io.open(path, "w", encoding="utf-8") as f:
                f.write(html)
            changed.append(rel)
        except Exception as e:
            failed.append((rel, "写入失败: %s" % e))

print("=" * 52)
print("已插入 %d 个文件：" % len(changed))
for x in changed:
    print("  + " + x)
if skipped:
    print("已有引用、跳过 %d 个：" % len(skipped))
    for x in skipped:
        print("  = " + x)
if nohead:
    print("!! 以下文件没找到 </head>，请手动添加：")
    for x in nohead:
        print("  ? " + x)
if failed:
    print("!! 以下文件处理失败：")
    for x, why in failed:
        print("  ! %s（%s）" % (x, why))
if not (changed or skipped or nohead or failed):
    print("没有找到任何 .html 文件 —— 请确认脚本放在网站根目录。")
print("=" * 52)

try:
    input("完成。按回车键退出…")
except EOFError:
    pass
