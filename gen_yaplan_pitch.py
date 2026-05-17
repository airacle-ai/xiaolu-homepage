#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
芽计 YaPlan  —  汇报PPT  v4
设计参考：招商银行年报 / 内部汇报风格
  · 主色：CMB红 #E2231A  辅助深色：#1A1A1A  浅灰背景：#F7F7F7
  · 纯白底色，极致留白，数字大而醒目
  · 横向平行线作为装饰语言（源自CMB logo解构）
  · 标题下方细红线分隔，而非重色块
  · 数据卡片：超大数字 + 灰色说明文字，无边框干扰
  · 全局字体：微软雅黑，层级严格 22/16/13/11/9pt
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from lxml import etree
import os

# ── 路径 ─────────────────────────────────────────────
TEMPLATE_PATH = (
    "/home/aitist/.omnara/attachments/"
    "68fb5f1e-0cb1-4990-8dcc-090bff582919/"
    "AI______PPT__-a1c0b1595097a4d7c911b423.pptx"
)
OUTPUT_PATH = (
    "/mnt/c/Users/oyzh8/Desktop/win_code/docker/"
    "omnara_workspace/steve/xiaolu-homepage/yaplan-pitch.pptx"
)
IMG_DIR      = "/mnt/c/Users/oyzh8/Desktop/win_code/docker/omnara_workspace/steve/xiaolu-homepage"
IMG_SHOWCASE = os.path.join(IMG_DIR, "screenshot_0.jpg")
IMG_AI_FLOW  = os.path.join(IMG_DIR, "screenshot_1.png")
IMG_INSURE   = os.path.join(IMG_DIR, "screenshot_2.png")
IMG_MINDMAP  = os.path.join(IMG_DIR, "screenshot_3.png")
IMG_ARCH     = os.path.join(IMG_DIR, "screenshot_4.png")

# ── 招商银行风格色彩系统 ──────────────────────────────
CMB_RED      = RGBColor(0xE2, 0x23, 0x1A)   # 招行品牌红
CMB_DARK     = RGBColor(0x1A, 0x1A, 0x1A)   # 标题深黑
CMB_GRAY1    = RGBColor(0x4D, 0x4D, 0x4D)   # 正文深灰
CMB_GRAY2    = RGBColor(0x88, 0x88, 0x88)   # 辅助文字灰
CMB_GRAY3    = RGBColor(0xC8, 0xC8, 0xC8)   # 线条浅灰
CMB_BG       = RGBColor(0xF7, 0xF7, 0xF7)   # 卡片底色
CMB_WHITE    = RGBColor(0xFF, 0xFF, 0xFF)
CMB_NAVY     = RGBColor(0x08, 0x25, 0x4D)   # 深蓝（仅用于封面/强调）
CMB_TEAL     = RGBColor(0x00, 0x7A, 0x87)   # 蓝绿（数据系2）
CMB_AMBER    = RGBColor(0xD4, 0x8B, 0x00)   # 金色（数据系3）
CMB_GREEN    = RGBColor(0x2D, 0x9C, 0x65)   # 绿色（数据系4）

# 数据可视化 4色（克制，不超过4色）
VIS = [CMB_RED, CMB_TEAL, CMB_AMBER, CMB_GREEN]

FONT   = "微软雅黑"
TOTAL  = 12
W, H   = 13.333, 7.5   # 幻灯片宽高（英寸）


# ═══════════════════════════════════════════════════════
# 基础工具函数
# ═══════════════════════════════════════════════════════

def _set_cell_bg(cell, rgb):
    """设置表格单元格背景色"""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    solidFill = etree.SubElement(tcPr, qn('a:solidFill'))
    srgbClr = etree.SubElement(solidFill, qn('a:srgbClr'))
    srgbClr.set('val', f'{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}')


def tb(slide, text, l, t, w, h,
       sz=11, bold=False, color=None, align='left',
       italic=False, wrap=True):
    """单段文本框"""
    box = slide.shapes.add_textbox(
        Inches(l), Inches(t), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = {'c': PP_ALIGN.CENTER, 'r': PP_ALIGN.RIGHT}.get(
        align[0].lower(), PP_ALIGN.LEFT)
    for run in p.runs:
        run.font.name   = FONT
        run.font.size   = Pt(sz)
        run.font.bold   = bold
        run.font.italic = italic
        if color:
            run.font.color.rgb = color
    return box


def mtb(slide, lines, l, t, w, h,
        sz=11, bold=False, color=None, align='left', gap=2):
    """多行文本框（行间距可调）"""
    box = slide.shapes.add_textbox(
        Inches(l), Inches(t), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line
        p.alignment = {'c': PP_ALIGN.CENTER, 'r': PP_ALIGN.RIGHT}.get(
            align[0].lower(), PP_ALIGN.LEFT)
        if gap and i > 0:
            p.space_before = Pt(gap)
        for run in p.runs:
            run.font.name = FONT
            run.font.size = Pt(sz)
            run.font.bold = bold
            if color:
                run.font.color.rgb = color
    return box


def rec(slide, l, t, w, h,
        fill=None, line=None, lw=0.75):
    """矩形"""
    sh = slide.shapes.add_shape(
        1, Inches(l), Inches(t), Inches(w), Inches(h))
    sh.fill.solid() if fill else sh.fill.background()
    if fill:
        sh.fill.fore_color.rgb = fill
    if line:
        sh.line.color.rgb = line
        sh.line.width = Pt(lw)
    else:
        sh.line.fill.background()
    return sh


def hbar(slide, l, t, w, color=CMB_GRAY3, h=0.016):
    """水平细线"""
    rec(slide, l, t, w, h, fill=color)


def redbar(slide, l, t, w=0.04, h=0.38):
    """小红色竖条（标题左侧装饰）"""
    rec(slide, l, t, w, h, fill=CMB_RED)


# ── CMB平行线装饰（来自logo解构） ─────────────────────
def cmb_lines(slide, l, t, n=5, gap=0.11, lh=0.03, w=1.2, color=CMB_RED, alpha_decay=True):
    """n 条等距水平细线，色彩从深到浅"""
    for i in range(n):
        opacity = 1.0 - i * 0.18 if alpha_decay else 1.0
        r = int(color[0] + (255 - color[0]) * (1 - opacity))
        g = int(color[1] + (255 - color[1]) * (1 - opacity))
        b = int(color[2] + (255 - color[2]) * (1 - opacity))
        rec(slide, l, t + i * gap, w, lh,
            fill=RGBColor(r, g, b))


# ── 标准标题区 ─────────────────────────────────────────
def slide_title(slide, title, subtitle=None, num=1, tag=None):
    """
    CMB风格标题：
    · 左上角红色细竖线（0.04" 宽）
    · 标题文字（CMB_DARK, 22pt, bold）
    · 标题下方1pt红色细横线
    · 右上角章节标签（深背景，白字，小号）
    · 右下角页码 + 品牌
    """
    # 左竖线
    rec(slide, 0.45, 0.28, 0.04, 0.62, fill=CMB_RED)
    # 主标题
    tb(slide, title, 0.62, 0.30, 11.2, 0.58,
       sz=22, bold=True, color=CMB_DARK)
    # 标题下红线
    rec(slide, 0.45, 0.92, 12.4, 0.018, fill=CMB_RED)
    # 副标题
    if subtitle:
        tb(slide, subtitle, 0.62, 0.96, 11.2, 0.36,
           sz=10, color=CMB_GRAY2)
    # 右上章节标签
    if tag:
        rec(slide, 11.0, 0.22, 2.15, 0.32, fill=CMB_DARK)
        tb(slide, tag, 11.0, 0.22, 2.15, 0.32,
           sz=8, color=CMB_WHITE, align='c')
    # 右下页码 + 品牌
    tb(slide, f"{num:02d}  /  {TOTAL:02d}",
       12.05, 7.12, 1.1, 0.28, sz=8, color=CMB_GRAY2, align='r')
    tb(slide, "芽计  YaPlan",
       10.3, 7.12, 1.6, 0.28, sz=8, color=CMB_GRAY2, align='r')


# ── 内容区节标题（章节内分区） ─────────────────────────
def section_head(slide, text, l, t, w=None):
    """小节标题：左红色竖条 + 文字 + 下细线"""
    redbar(slide, l, t, w=0.035, h=0.32)
    tb(slide, text, l + 0.1, t + 0.01, (w or 5.0) - 0.15, 0.30,
       sz=12, bold=True, color=CMB_DARK)
    hbar(slide, l, t + 0.33, (w or 5.0), color=CMB_GRAY3)


# ── 大数字统计卡片（CMB风格：数字为主视觉） ────────────
def big_stat(slide, l, t, w, h,
             number, unit, label,
             num_color=CMB_RED, bg=None):
    """
    纯白（或浅灰）背景，超大数字，灰色说明文字
    无多余边框，靠数字大小传达权重
    """
    if bg:
        rec(slide, l, t, w, h, fill=bg)
    tb(slide, number, l + 0.12, t + 0.10, w - 0.15, h * 0.55,
       sz=36, bold=True, color=num_color)
    if unit:
        tb(slide, unit, l + 0.12, t + h * 0.54, w - 0.15, 0.30,
           sz=11, color=CMB_GRAY1)
    tb(slide, label, l + 0.12, t + h * 0.72, w - 0.15, h * 0.26,
       sz=10, color=CMB_GRAY2)


# ── 功能卡片（极简版：顶部细红线 + 白底） ───────────────
def feature_card(slide, l, t, w, h,
                 title, body_lines,
                 accent=CMB_RED,
                 title_sz=12, body_sz=10.5):
    """顶部 3px accent 线 + 白底卡片"""
    rec(slide, l, t, w, h, fill=CMB_BG)
    rec(slide, l, t, w, 0.032, fill=accent)
    tb(slide, title, l + 0.18, t + 0.10, w - 0.28, 0.34,
       sz=title_sz, bold=True, color=CMB_DARK)
    hbar(slide, l + 0.14, t + 0.46, w - 0.26, color=CMB_GRAY3)
    mtb(slide, body_lines,
        l + 0.18, t + 0.52, w - 0.28, h - 0.62,
        sz=body_sz, color=CMB_GRAY1, gap=3)


# ── 截图占位框 ─────────────────────────────────────────
def ph(slide, l, t, w, h, label, note="", accent=CMB_RED):
    """轻量灰底占位框，告知需插入内容"""
    rec(slide, l, t, w, h, fill=RGBColor(0xF2, 0xF2, 0xF2),
        line=accent, lw=0.75)
    mid = t + h / 2
    tb(slide, "📷", l, mid - 0.45, w, 0.45, sz=20, align='c', color=CMB_GRAY2)
    tb(slide, label, l, mid + 0.05, w, 0.35,
       sz=10, bold=True, color=accent, align='c')
    if note:
        tb(slide, note, l, mid + 0.45, w, 0.30,
           sz=9, color=CMB_GRAY2, align='c')


# ═══════════════════════════════════════════════════════
# 初始化演示文稿
# ═══════════════════════════════════════════════════════
print("加载模板…")
Presentation(TEMPLATE_PATH)          # 仅验证路径有效
prs = Presentation()
prs.slide_width  = Inches(W)
prs.slide_height = Inches(H)
blank = prs.slide_layouts[6]         # 空白版式


# ═══════════════════════════════════════════════════════
# Slide 1  产品画布 · Lean Canvas
# ═══════════════════════════════════════════════════════
print("Slide 01 — 产品画布…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "产品画布  ·  Lean Canvas", num=1, tag="产品画布")

# CMB平行线装饰（右上）
cmb_lines(sl, 10.9, 0.25, n=5, gap=0.10, w=2.2, color=CMB_RED)

# 三列（左蓝/中白/右绿），用细竖线分隔
col_x    = [0.45, 4.62, 8.78]
col_w    = 3.95
col_top  = 1.35
col_h    = 5.6
col_accent = [CMB_TEAL, CMB_RED, CMB_GREEN]
col_titles = ["🎯  问题与痛点", "💡  解决方案（攒·保·理·教）", "✦  独特价值主张"]
col_bodies = [
    ["① 教育支出焦虑，缺乏整体规划框架",
     "② 保险配置混乱，面对销售话术无从判断",
     "③ 焦虑型课外消费泛滥，38% 属情绪驱动",
     "④ 零花钱给了，却不知如何引导"],
    ["攒  AI双情景教育金测算与定投计划",
     "保  保单OCR解读，非销售保险配置建议",
     "理  多模态记账+焦虑消费3层检测+冷静期",
     "教  三罐子零花钱+劳动奖励+财商小课堂"],
    ['"第一个对你说「不」的财务顾问"',
     "纯规划、不销售",
     "焦虑消费识别（行业首创）",
     "生活化比喻翻译金融术语",
     "0–18 岁全周期陪伴"],
]
for i, (cx, accent, ttl, body) in enumerate(
        zip(col_x, col_accent, col_titles, col_bodies)):
    rec(sl, cx, col_top, col_w, col_h, fill=CMB_WHITE)
    rec(sl, cx, col_top, col_w, 0.038, fill=accent)   # 顶部accent线
    tb(sl, ttl, cx + 0.18, col_top + 0.10, col_w - 0.26, 0.38,
       sz=12, bold=True, color=accent)
    hbar(sl, cx + 0.14, col_top + 0.50, col_w - 0.26, color=CMB_GRAY3)
    mtb(sl, ["• " + b for b in body],
        cx + 0.18, col_top + 0.58, col_w - 0.26, 4.65,
        sz=11, color=CMB_GRAY1, gap=4)
    # 列间分隔线
    if i < 2:
        rec(sl, cx + col_w, col_top, 0.016, col_h, fill=CMB_GRAY3)

# 底部三信息条（统一深底白字）
bottom_items = [
    (0.45,  "用户  0–18 岁子女城市中产家庭",   CMB_TEAL),
    (4.62,  "商业模式  Freemium  ¥99–199 / 月", CMB_RED),
    (8.78,  "技术  Claude API · 多模态OCR",     CMB_GREEN),
]
for bx, btxt, baccent in bottom_items:
    rec(sl, bx, 6.98, 3.95, 0.40, fill=CMB_DARK)
    rec(sl, bx, 6.98, 0.04, 0.40, fill=baccent)
    tb(sl, btxt, bx + 0.12, 7.0, 3.75, 0.36,
       sz=10, color=CMB_WHITE, align='c')

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 2  用户需求 · 三阶段家庭画像
# ═══════════════════════════════════════════════════════
print("Slide 02 — 三阶段家庭画像…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "用户需求分析  ·  三阶段家庭画像",
            num=2, tag="用户研究  01/03")

stages = [
    (0.45,  CMB_TEAL,  "新生期  0–3岁",
     "25–35岁双职工，月入 1.5–4 万",
     ["早教课值不值？被销售话术困扰",
      "保险该买哪些？配置从何判断",
      "教育金何时开始、怎么存最科学"],
     "¥3,200"),
    (4.62,  CMB_RED,   "成长期  4–12岁",
     "30–42岁中产，月入 2.5–8 万",
     ["课外班军备竞赛，月花 8,000+",
      "教育金储备进度严重滞后",
      "同伴压力导致盲目跟风报班"],
     "¥6,800"),
    (8.78,  CMB_AMBER, "冲刺期  13–18岁",
     "40–52岁，月入 4–12 万",
     ["出国 vs 国内？200–500 万差距",
      "留学费用无独立测算工具",
      "资产不动产化，流动性不足"],
     "¥12,400"),
]
for sx, accent, period, user, pains, spend in stages:
    # 顶部色条
    rec(sl, sx, 1.32, 3.95, 0.50, fill=accent)
    tb(sl, period, sx + 0.12, 1.33, 3.72, 0.46,
       sz=14, bold=True, color=CMB_WHITE, align='c')
    # 内容区（白底）
    rec(sl, sx, 1.82, 3.95, 5.06, fill=CMB_WHITE)
    tb(sl, user, sx + 0.18, 1.90, 3.6, 0.34, sz=10, color=CMB_GRAY2)
    hbar(sl, sx + 0.14, 2.26, 3.68, color=CMB_GRAY3)
    tb(sl, "核心痛点", sx + 0.18, 2.34, 3.6, 0.28,
       sz=10, bold=True, color=CMB_DARK)
    mtb(sl, ["→  " + p for p in pains],
        sx + 0.18, 2.66, 3.6, 1.85,
        sz=10.5, color=CMB_GRAY1, gap=3)
    hbar(sl, sx + 0.14, 4.55, 3.68, color=CMB_GRAY3)
    tb(sl, "月均教育支出",
       sx + 0.18, 4.62, 3.6, 0.28, sz=9, color=CMB_GRAY2)
    tb(sl, spend,
       sx + 0.18, 4.92, 3.6, 0.90, sz=36, bold=True, color=accent)
    # 列间线
    if sx < 8.0:
        rec(sl, sx + 3.95, 1.32, 0.016, 5.56, fill=CMB_GRAY3)

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 3  用户需求 · 焦虑消费识别
# ═══════════════════════════════════════════════════════
print("Slide 03 — 焦虑消费识别…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "用户需求分析  ·  焦虑型消费识别",
            num=3, tag="用户研究  02/03")

# 顶部三个大数字卡片
for i, (num, unit, label, accent) in enumerate([
    ("38",  "%",      "育儿支出属焦虑驱动",          CMB_RED),
    ("87",  "%",      "报名后曾后悔的课程占比",       CMB_AMBER),
    ("2,100", "元/月", "芽计用户月均识别的焦虑消费",  CMB_GREEN),
]):
    x = 0.45 + i * 4.29
    rec(sl, x, 1.32, 4.15, 1.48, fill=CMB_WHITE)
    rec(sl, x, 1.32, 4.15, 0.030, fill=accent)
    big_stat(sl, x, 1.32, 4.15, 1.48, num, unit, label,
             num_color=accent, bg=None)

# 左侧：焦虑型
hbar(sl, 0.45, 2.98, 12.43, color=CMB_GRAY3)
section_head(sl, "❌  焦虑驱动型消费", 0.45, 3.08, w=5.8)
rec(sl, 0.45, 3.46, 5.8, 3.42, fill=RGBColor(0xFF, 0xF5, 0xF4))
rec(sl, 0.45, 3.46, 0.04, 3.42, fill=CMB_RED)
mtb(sl, [
    "•  看到 KOL 推荐，冲动下单",
    "•  听说别人家孩子都在学",
    "•  周末深夜突击报班",
    "•  无 ROI 评估，跟风即买",
    "•  孩子不感兴趣，仍续费",
], 0.60, 3.56, 5.52, 3.20, sz=12, color=CMB_GRAY1, gap=5)

# 中间箭头标注
rec(sl, 6.36, 3.46, 0.78, 3.42, fill=CMB_RED)
tb(sl, "芽\n计\n识\n别", 6.36, 3.72, 0.78, 2.90,
   sz=13, bold=True, color=CMB_WHITE, align='c')

# 右侧：理性型
section_head(sl, "✅  理性规划型消费", 7.24, 3.08, w=5.65)
rec(sl, 7.24, 3.46, 5.64, 3.42, fill=RGBColor(0xF4, 0xFB, 0xF6))
rec(sl, 7.24, 3.46, 0.04, 3.42, fill=CMB_GREEN)
mtb(sl, [
    "•  基于孩子兴趣和意愿决策",
    "•  有明确学习目标和退出机制",
    "•  评估性价比后理性决定",
    "•  定期复盘课程出勤与效果",
    "•  纳入家庭月度预算管控",
], 7.40, 3.56, 5.36, 3.20, sz=12, color=CMB_GRAY1, gap=5)

tb(sl,
   "芽计通过  行为信号  ×  NLP语义情绪  ×  综合评分  三层机制，在消费决策前给出理性提醒",
   0.45, 7.0, 12.4, 0.35, sz=9, color=CMB_GRAY2, align='c')

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 4  用户需求 · 市场规模
# ═══════════════════════════════════════════════════════
print("Slide 04 — 市场规模…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "用户需求分析  ·  市场规模与机会",
            num=4, tag="用户研究  03/03")

# 左侧嵌套 TAM/SAM/SOM
tam_data = [
    (0.45, 1.32, 8.1, 5.68, RGBColor(0xF0, 0xF4, 0xFF),
     "TAM  总市场：2.1 亿有子女家庭  /  潜在规模 ¥6,300 亿",
     CMB_TEAL),
    (1.0,  1.90, 7.0, 4.52, RGBColor(0xFF, 0xF5, 0xF4),
     "SAM  可触达：4,200 万城市中产家庭  /  ¥1,260 亿",
     CMB_RED),
    (1.7,  2.55, 5.6, 3.22, RGBColor(0xF4, 0xFB, 0xF6),
     "SOM  3年目标：210 万家庭  /  ¥6.3 亿 ARR",
     CMB_GREEN),
]
for lx, tp, w, h, bg, txt, accent in tam_data:
    rec(sl, lx, tp, w, h, fill=bg, line=accent, lw=0.8)
    tb(sl, txt, lx + 0.2, tp + 0.12, w - 0.3, 0.36,
       sz=11, bold=True, color=accent)

# 右侧 4 个大数字卡片（无边框风格）
hbar(sl, 8.68, 1.32, 4.5, color=CMB_RED, h=0.030)
for i, (num, unit, label, accent) in enumerate([
    ("68",  "%",   "受访家长缺乏系统财务规划",    CMB_RED),
    ("3.2", "万元", "城市家庭年均课外教育支出",   CMB_TEAL),
    ("92",  "%",   "愿为精准规划付费的家长",      CMB_GREEN),
    ("18",  "年",  "单用户周期  ·  LTV ≈ ¥3,582", CMB_AMBER),
]):
    y = 1.36 + i * 1.42
    hbar(sl, 8.68, y + 1.38, 4.5, color=CMB_GRAY3) if i < 3 else None
    big_stat(sl, 8.68, y + 0.04, 4.5, 1.30,
             num, unit, label, num_color=accent)

tb(sl, "数据来源：艾瑞咨询 2025  /  国家统计局  /  CFPS 家庭追踪调查",
   0.5, 7.1, 9.0, 0.28, sz=8, color=CMB_GRAY2)

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 5  产品方案 · 攒·保·理·教 四模块
# ═══════════════════════════════════════════════════════
print("Slide 05 — 四模块框架…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "产品方案  ·  攒·保·理·教  四模块定位",
            num=5, tag="产品方案  01/07")

# 框架说明条
rec(sl, 0.45, 1.32, 12.43, 0.40, fill=CMB_DARK)
rec(sl, 0.45, 1.32, 0.04, 0.40, fill=CMB_RED)
tb(sl, "所有功能通过对话式 AI 串联  ·  角色定位：🏥 家庭财务医生（客观专业）× 👩‍🎓 成长陪伴学姐（温暖懂孩子）",
   0.58, 1.33, 12.2, 0.36, sz=10.5, color=CMB_WHITE)

modules = [
    (0.45, 1.85, CMB_TEAL,  "📈  攒  ·  教育金规划",
     ["PMT 公式精准测算教育金缺口",
      "双情景：国内 ¥45 万  /  出国 ¥120 万",
      "开学季动态校准，每年复盘调整",
      '比喻：¥36 万缺口 = 360 次家庭大餐']),
    (6.88, 1.85, CMB_RED,   "🛡️  保  ·  保险配置",
     ["保单 OCR 解读关键条款",
      "先大人后小孩配置优先级",
      "非销售承诺，只分析不导流",
      "通俗险种比喻库，拒绝行话"]),
    (0.45, 4.55, CMB_AMBER, "💸  理  ·  支出管理",
     ["拍票据 / 截图 / 语音多模态记账",
      "3 层焦虑消费检测引擎（行业首创）",
      "24 h 购物车冷静期机制",
      "兴趣班 ROI 热力表可视化"]),
    (6.88, 4.55, CMB_GREEN, "💰  教  ·  财商教育",
     ["三罐子零花钱模型（自由/储蓄/分享）",
      "义务家务 vs 额外任务劳动机制",
      "AI 发零花钱时推送财商故事",
      "月度宝贝成长报告"]),
]
for lx, tp, accent, ttl, body in modules:
    feature_card(sl, lx, tp, 6.28, 2.54,
                 ttl, body, accent=accent,
                 title_sz=13, body_sz=11)

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 6  产品方案 · 差异化定位
# ═══════════════════════════════════════════════════════
print("Slide 06 — 竞品对比…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "产品方案  ·  差异化定位",
            num=6, tag="产品方案  02/07")

table_data = [
    ["功能维度",       "芽计  YaPlan",    "挖财",       "支付宝财富",   "Greenlight"],
    ["焦虑消费识别",   "✅  行业首创",    "—",           "—",            "—"],
    ["保单 OCR 解读",  "✅  通俗解析",    "—",           "—",            "—"],
    ["非销售导向",     "✅  无返佣",      "❌  有广告",  "❌  有佣金",   "✅  基础"],
    ["教育金测算",     "✅  双情景",      "弱",          "弱",           "—"],
    ["亲子财商教育",   "✅  三罐子+绘本", "—",           "—",            "✅  基础"],
    ["生活化比喻库",   "✅  内置系统",    "—",           "—",            "—"],
]
rows, cols = len(table_data), 5
col_w = [2.65, 3.0, 1.82, 1.82, 1.82]

tbl = sl.shapes.add_table(
    rows, cols,
    Inches(0.45), Inches(1.32),
    Inches(sum(col_w)), Inches(rows * 0.56)
).table
for ci, cw in enumerate(col_w):
    tbl.columns[ci].width = Inches(cw)

for ri, row in enumerate(table_data):
    for ci, val in enumerate(row):
        cell = tbl.cell(ri, ci)
        cell.text = val
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        for run in p.runs:
            run.font.name = FONT
            run.font.size = Pt(11)
            if ri == 0:
                run.font.bold = True
                run.font.color.rgb = CMB_WHITE
            elif ci == 1:
                run.font.bold = True
                run.font.color.rgb = (CMB_RED   if "✅" in val else
                                      CMB_GRAY2  if ("—" in val or "❌" in val) else
                                      CMB_DARK)
            else:
                run.font.color.rgb = (CMB_GREEN  if "✅" in val else
                                      CMB_GRAY2  if ("—" in val or "❌" in val) else
                                      CMB_GRAY1)
        fill = cell.fill
        fill.solid()
        if ri == 0:
            fill.fore_color.rgb = CMB_DARK
        elif ci == 1:
            fill.fore_color.rgb = RGBColor(0xFF, 0xF5, 0xF4)
        elif ri % 2 == 0:
            fill.fore_color.rgb = CMB_BG
        else:
            fill.fore_color.rgb = CMB_WHITE

# 底部三大差异化标签
hbar(sl, 0.45, 5.68, 12.43, color=CMB_RED, h=0.030)
for i, (accent, icon_title, sub) in enumerate([
    (CMB_TEAL,  "🧠  焦虑识别引擎",   "行业首创  ·  三层检测"),
    (CMB_RED,   "📊  非销售导向",      "信任经济壁垒"),
    (CMB_GREEN, "💬  金融语言翻译器",  "术语  →  生活比喻"),
]):
    lx = 0.45 + i * 4.29
    rec(sl, lx, 5.82, 4.15, 1.06, fill=accent)
    tb(sl, icon_title, lx + 0.14, 5.88, 3.9, 0.42,
       sz=13, bold=True, color=CMB_WHITE, align='c')
    tb(sl, sub, lx + 0.14, 6.30, 3.9, 0.42,
       sz=10, color=CMB_WHITE, align='c')

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 7  产品方案 · AI 能力运用
# ═══════════════════════════════════════════════════════
print("Slide 07 — AI 能力…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "产品方案  ·  AI 能力运用",
            num=7, tag="产品方案  03/07")

# 角色定位条
rec(sl, 0.45, 1.32, 12.43, 0.42, fill=CMB_DARK)
rec(sl, 0.45, 1.32, 0.04, 0.42, fill=CMB_RED)
tb(sl, "AI 双重角色：🏥 家庭财务医生（客观、专业、不卖东西）"
       "  ×  👩‍🎓 成长陪伴学姐（温暖、真实、懂孩子）",
   0.58, 1.33, 12.2, 0.38, sz=10.5, color=CMB_WHITE)

# 左侧：5步流程（竖向时间轴）
steps = [
    (CMB_TEAL,  "1  对话采集", "自然语言问答，采集家庭基本信息"),
    (CMB_TEAL,  "2  需求挖掘", "识别显性需求与隐性焦虑来源"),
    (CMB_AMBER, "3  方案生成", "PMT 计算 + 双情景 + 生活化比喻"),
    (CMB_RED,   "4  焦虑检测", "行为信号 + NLP语义 + 综合评分三层"),
    (CMB_GREEN, "5  动态复盘", "月度小报 + 季度报告 + 年度校准"),
]
for i, (accent, stitle, sdesc) in enumerate(steps):
    y = 1.90 + i * 0.98
    rec(sl, 0.45, y, 6.28, 0.84, fill=CMB_BG)
    rec(sl, 0.45, y, 0.04, 0.84, fill=accent)
    rec(sl, 0.55, y + 0.22, 0.38, 0.38, fill=accent)
    tb(sl, stitle.split("  ")[0], 0.56, y + 0.22, 0.36, 0.38,
       sz=13, bold=True, color=CMB_WHITE, align='c')
    tb(sl, stitle.split("  ")[1], 1.05, y + 0.08, 5.55, 0.34,
       sz=12, bold=True, color=CMB_DARK)
    tb(sl, sdesc, 1.05, y + 0.44, 5.55, 0.32,
       sz=10, color=CMB_GRAY1)
    if i < 4:
        rec(sl, 0.69, y + 0.84, 0.016, 0.16, fill=accent)

# 右侧：多模态 + 对话示例 + 技术说明
section_head(sl, "多模态输入能力", 6.88, 1.90, w=6.2)
for j, (icon, desc) in enumerate([
    ("📸  拍票据",   "OCR 自动归类"),
    ("🎙  语音记账",  "自然语言录入"),
    ("📄  截图保单",  "AI 提取条款"),
]):
    lx = 6.88 + j * 2.06
    rec(sl, lx, 2.28, 1.98, 1.38, fill=CMB_WHITE,
        line=CMB_GRAY3, lw=0.6)
    rec(sl, lx, 2.28, 1.98, 0.028, fill=CMB_TEAL)
    tb(sl, icon, lx + 0.1, 2.36, 1.8, 0.38,
       sz=11, bold=True, color=CMB_DARK)
    tb(sl, desc, lx + 0.1, 2.78, 1.8, 0.36,
       sz=10, color=CMB_GRAY2)

section_head(sl, "对话示例", 6.88, 3.80, w=6.2)
rec(sl, 6.88, 4.18, 6.2, 1.32, fill=RGBColor(0xF0, 0xF4, 0xFF))
rec(sl, 6.88, 4.18, 0.04, 1.32, fill=CMB_TEAL)
mtb(sl, [
    "用户：「5 岁女儿，想出国，月入 3–5 万」",
    "→  芽计：「目标 ¥120 万，月投 ¥4,900，",
    "    相当于每天少一杯奶茶 + 咖啡 ☕」",
], 7.06, 4.28, 5.9, 1.12, sz=11, color=CMB_NAVY)

section_head(sl, "焦虑检测三层引擎", 6.88, 5.66, w=6.2)
rec(sl, 6.88, 6.04, 6.2, 0.80, fill=RGBColor(0xFF, 0xF5, 0xF4))
rec(sl, 6.88, 6.04, 0.04, 0.80, fill=CMB_RED)
tb(sl, "Layer 1  行为信号  →  Layer 2  NLP语义情绪  →  Layer 3  综合风险评分",
   7.06, 6.14, 5.9, 0.55, sz=10.5, color=CMB_DARK)

tb(sl, "底层：Claude API  ·  多模态 OCR  ·  规则引擎",
   6.88, 7.0, 6.2, 0.30, sz=9, color=CMB_GRAY2, align='c')

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 8  产品方案 · 商业模式
# ═══════════════════════════════════════════════════════
print("Slide 08 — 商业模式…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "产品方案  ·  商业模式",
            num=8, tag="产品方案  04/07")

pricing = [
    (0.45,  CMB_GRAY2,  "免费版  Free",     "",
     ["基础教育金测算（单情景）",
      "AI 规划对话  3 次 / 月",
      "支出分类记录",
      "焦虑消费基础识别"],
     False),
    (4.62,  CMB_RED,    "标准版  ¥99 / 月", "推荐",
     ["无限 AI 规划对话",
      "焦虑消费深度识别 + 预警",
      "保单 OCR 解读",
      "月度亲子财务小报",
      "兴趣班 ROI 热力表"],
     True),
    (8.78,  CMB_NAVY,   "高级版  ¥199 / 月", "",
     ["全部标准版功能",
      "专属 1v1 顾问服务",
      "家庭多账号管理",
      "年度财务体检报告",
      "优先体验新功能"],
     False),
]
for lx, accent, plan, badge, features, highlight in pricing:
    tp = 1.32 if not highlight else 1.20
    h  = 4.30 if not highlight else 4.55
    rec(sl, lx, tp, 3.95, h, fill=CMB_WHITE)
    rec(sl, lx, tp, 3.95, 0.56, fill=accent)
    tb(sl, plan, lx + 0.12, tp + 0.08, 3.72, 0.42,
       sz=13, bold=True, color=CMB_WHITE, align='c')
    if badge:
        rec(sl, lx + 2.96, tp, 0.99, 0.32, fill=CMB_RED)
        tb(sl, badge, lx + 2.96, tp + 0.02, 0.99, 0.28,
           sz=9, bold=True, color=CMB_WHITE, align='c')
    hbar(sl, lx + 0.14, tp + 0.60, 3.68, color=CMB_GRAY3)
    for j, feat in enumerate(features):
        tb(sl, f"✓  {feat}",
           lx + 0.18, tp + 0.70 + j * 0.60, 3.62, 0.50,
           sz=11, color=CMB_GRAY1)
    # 底部边框
    rec(sl, lx, tp, 3.95, h, line=accent, lw=0.6)

# 增长飞轮
hbar(sl, 0.45, 5.95, 12.43, color=CMB_RED, h=0.030)
flywheel = ["免费体验", "价值验证", "付费转化", "口碑传播", "更多用户"]
for i, node in enumerate(flywheel):
    lx = 0.65 + i * 2.44
    rec(sl, lx, 6.12, 2.0, 0.68, fill=CMB_RED)
    tb(sl, node, lx, 6.17, 2.0, 0.58,
       sz=11, bold=True, color=CMB_WHITE, align='c')
    if i < 4:
        tb(sl, "→", lx + 2.0, 6.23, 0.44, 0.44,
           sz=16, bold=True, color=CMB_RED, align='c')

rec(sl, 0.45, 6.96, 12.43, 0.38, fill=CMB_BG)
tb(sl, "3年路径：免费用户 100 万  →  付费转化 10%  →  标准版 ARR ¥9,900 万",
   0.65, 7.0, 12.1, 0.30, sz=10, color=CMB_GRAY1, align='c')

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 9  产品原型 · 五大核心界面
# ═══════════════════════════════════════════════════════
print("Slide 09 — 原型展示①…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "产品原型  ·  五大核心界面",
            num=9, tag="产品方案  05/07")

# 左侧：真实原型截图
if os.path.exists(IMG_SHOWCASE):
    sl.shapes.add_picture(
        IMG_SHOWCASE,
        Inches(0.45), Inches(1.35),
        Inches(8.45), Inches(4.68))
else:
    ph(sl, 0.45, 1.35, 8.45, 4.68,
       "请插入  ·  showcase.html 全屏截图",
       "screenshot_0.jpg   2000×1108 px")

# 右侧：五屏功能注释（CMB风格竖排）
rec(sl, 9.1, 1.35, 0.016, 4.68, fill=CMB_RED)

screens = [
    (CMB_TEAL,  "🏠  首页",  "教育金健康度实时预警\n焦虑消费占比红色标注"),
    (CMB_RED,   "📋  规划",  "双情景教育金测算\n保单 OCR 一键解读"),
    (CMB_AMBER, "💳  账单",  "五色饼图支出分析\n焦虑消费双预警"),
    (CMB_TEAL,  "🤖  AI",   "7 轮对话生成规划报告\n生活化比喻实时输出"),
    (CMB_GREEN, "💰  财商",  "三罐子零花钱管理\n劳动奖励任务清单"),
]
for i, (accent, name, desc) in enumerate(screens):
    y = 1.40 + i * 0.96
    rec(sl, 9.18, y, 0.04, 0.80, fill=accent)
    tb(sl, name, 9.30, y + 0.02, 1.8, 0.32,
       sz=11, bold=True, color=accent)
    mtb(sl, desc.split('\n'),
        9.30, y + 0.34, 3.85, 0.50,
        sz=9.5, color=CMB_GRAY1)
    if i < 4:
        hbar(sl, 9.18, y + 0.88, 4.0, color=CMB_GRAY3)

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 10  产品原型 · AI对话流程 & 保险决策树
# ═══════════════════════════════════════════════════════
print("Slide 10 — 原型展示②…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "产品原型  ·  AI 对话流程  &  保险配置决策树",
            num=10, tag="产品方案  06/07")

# 中间分隔线
rec(sl, 6.62, 1.32, 0.016, 5.86, fill=CMB_GRAY3)

# 左：AI 对话流程图
section_head(sl, "AI 入户对话流程图", 0.45, 1.32, w=6.0)
if os.path.exists(IMG_AI_FLOW):
    # 1488×1226 → 宽5.9" → 高4.86"
    sl.shapes.add_picture(
        IMG_AI_FLOW,
        Inches(0.45), Inches(1.75),
        Inches(5.96), Inches(4.91))
else:
    ph(sl, 0.45, 1.75, 5.96, 4.91,
       "请插入  ·  ai对话.png",
       "AI 入户对话流程图   1488×1226 px",
       accent=CMB_TEAL)

# 右：保险决策树
section_head(sl, "保险配置决策树", 6.80, 1.32, w=6.08)
if os.path.exists(IMG_INSURE):
    # 1494×1410 → 宽5.96" → 高5.63" → 限高4.91"
    _iw, _ih = 5.96, min(round(5.96 * 1410 / 1494, 2), 4.91)
    sl.shapes.add_picture(
        IMG_INSURE,
        Inches(6.80), Inches(1.75),
        Inches(_iw), Inches(_ih))
else:
    ph(sl, 6.80, 1.75, 5.96, 4.91,
       "请插入  ·  保险决策树.png",
       "1494×1410 px",
       accent=CMB_RED)

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 11  产品原型 · 功能架构 & 财商模块
# ═══════════════════════════════════════════════════════
print("Slide 11 — 原型展示③…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "产品原型  ·  功能架构  &  财商教育模块",
            num=11, tag="产品方案  07/07")

rec(sl, 6.62, 1.32, 0.016, 5.86, fill=CMB_GRAY3)

# 左：功能思维导图 + 系统技术架构
section_head(sl, "功能思维导图", 0.45, 1.32, w=6.0)
_mm_h = round(5.96 * 1062 / 1832, 2)   # ≈ 3.45"
if os.path.exists(IMG_MINDMAP):
    sl.shapes.add_picture(
        IMG_MINDMAP,
        Inches(0.45), Inches(1.75),
        Inches(5.96), Inches(_mm_h))
else:
    ph(sl, 0.45, 1.75, 5.96, _mm_h,
       "请插入  ·  功能思维导图.png",
       "1832×1062 px", accent=CMB_AMBER)

_arch_top = 1.75 + _mm_h + 0.22
_arch_h   = min(7.22 - _arch_top, round(5.96 * 1222 / 1999, 2))
section_head(sl, "系统技术架构", 0.45, _arch_top - 0.20, w=6.0)
if os.path.exists(IMG_ARCH) and _arch_h > 0.5:
    sl.shapes.add_picture(
        IMG_ARCH,
        Inches(0.45), Inches(_arch_top),
        Inches(5.96), Inches(_arch_h))
else:
    ph(sl, 0.45, _arch_top, 5.96, max(_arch_h, 0.8),
       "请插入  ·  系统技术架构.png",
       "1999×1222 px", accent=CMB_NAVY)

# 右：财商三卡片
fn_cards = [
    (CMB_AMBER, "🫙  三罐子零花钱",
     ["自由支配罐  6 成",
      "储蓄罐  3 成",
      "分享罐  1 成",
      "AI 给出比例参考建议"]),
    (CMB_GREEN, "✅  劳动奖励机制",
     ["义务家务不计薪（培养责任感）",
      "额外任务有报酬",
      "财商绘本讲给 AI 听  +¥10",
      "月度任务清单可视化"]),
    (CMB_TEAL,  "🤖  AI 财商学姐",
     ["发零花钱时推送财商故事",
      "月度宝贝成长报告",
      "18 岁前完成基础财商体系",
      "亲子共同参与激励机制"]),
]
for i, (accent, ttl, body) in enumerate(fn_cards):
    feature_card(sl, 6.80, 1.32 + i * 1.97, 6.08, 1.84,
                 ttl, body, accent=accent,
                 title_sz=12, body_sz=10.5)

print("  完成")


# ═══════════════════════════════════════════════════════
# Slide 12  关键问题思考
# ═══════════════════════════════════════════════════════
print("Slide 12 — 关键问题…")
sl = prs.slides.add_slide(blank)
slide_title(sl, "关键问题思考", num=12)

# CMB装饰线（右上）
cmb_lines(sl, 10.8, 0.22, n=6, gap=0.10, w=2.35, color=CMB_RED)

qa = [
    (CMB_RED,   "01",
     "数据隐私边界：如何在本地加密与云端 AI 之间取得平衡？",
     "家庭财务数据极度敏感。芽计答案：核心数据端侧 AES-256 加密，AI 仅接触脱敏摘要，"
     "用户可随时断开云同步，数据主权完整保留。"),
    (CMB_AMBER, "02",
     "AI 建议的监管合规：财务建议是否构成「投资顾问」？",
     "中国监管对投资建议有严格界定。芽计定位为「决策辅助工具」而非投资顾问，"
     "核心输出均为信息参考，内容经合规审查，不提供具体标的推荐。"),
    (CMB_GREEN, "03",
     "如何避免成为新的焦虑制造者？",
     "产品第一原则——先帮家长说「不」，再说「怎么做」。"
     "月度小报的第一行永远是：「本月您帮孩子节省了 ¥X 焦虑消费」。"),
]
for i, (accent, num_text, question, answer) in enumerate(qa):
    y = 1.35 + i * 1.85
    rec(sl, 0.45, y, 12.43, 1.72, fill=CMB_WHITE)
    rec(sl, 0.45, y, 12.43, 0.028, fill=accent)   # 顶部accent线
    rec(sl, 0.45, y + 0.028, 0.04, 1.69, fill=accent)  # 左侧细竖线
    # 数字
    tb(sl, num_text, 0.60, y + 0.28, 0.88, 1.0,
       sz=40, bold=True, color=accent)
    # 问题
    tb(sl, question, 1.60, y + 0.12, 10.72, 0.44,
       sz=13, bold=True, color=CMB_DARK)
    hbar(sl, 1.60, y + 0.58, 10.72, color=CMB_GRAY3)
    # 回答
    tb(sl, answer, 1.60, y + 0.66, 10.72, 0.96,
       sz=11, color=CMB_GRAY1)

# 底部金句（CMB深底白字）
rec(sl, 0.45, 6.95, 12.43, 0.42, fill=CMB_DARK)
rec(sl, 0.45, 6.95, 0.04, 0.42, fill=CMB_RED)
tb(sl,
   '"我们相信，最好的财务顾问不是推销产品，而是帮你想清楚。"  —  芽计  YaPlan',
   0.62, 6.97, 12.15, 0.38,
   sz=12, bold=True, color=CMB_WHITE, align='c')

print("  完成")


# ═══════════════════════════════════════════════════════
# 保存
# ═══════════════════════════════════════════════════════
print(f"\n保存  →  {OUTPUT_PATH}")
prs.save(OUTPUT_PATH)
print("✅  yaplan-pitch.pptx（招商银行风格）已生成")
