// 判别「填上了没有」：用脚本文件里的原文函数
//   超星：getChoiceOptionContainer / isChoiceOptionSelected / selectChoiceOption / fillQuestion
//   智慧树：smartAnswerLogic 内的 fillChoice（连 normalize/cleanText 一起取原文）
// 配一个「点一下就切换选中状态」的假 DOM，比对脚本自报的 filled 与假 DOM 的真实选中态。
//
//   node scripts/_probe_fill_stateful.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "xueshen-gf.js"), "utf8");

function slicePublicField(name) {
  const key = `__publicField(this, "${name}", `;
  const start = src.indexOf(key);
  if (start < 0) throw new Error("找不到 " + name);
  const marker = "\n      });";
  const end = src.indexOf(marker, start);
  if (end < 0) throw new Error("找不到 " + name + " 结尾");
  return src.slice(start + key.length, end + marker.length - 2);
}
function sliceTop(name) {
  const start = src.indexOf(`const ${name} = (`);
  if (start < 0) throw new Error("找不到 " + name);
  const end = src.indexOf("\n  };", start);
  return src.slice(start, end + 5).replace(/^const\s+\w+\s*=\s*/, "").replace(/;\s*$/, "");
}
// 取 smartAnswerLogic 内部（4 空格缩进）的原文函数
function sliceNested(name, indent = 4) {
  const pad = " ".repeat(indent);
  const key = pad + "const " + name + " = (";
  const start = src.indexOf(key);
  if (start < 0) throw new Error("找不到 " + name);
  const bodyStart = start + key.length - 1;
  const lineEnd = src.indexOf("\n", bodyStart);
  const oneLine = src.slice(bodyStart, lineEnd).replace(/\s+$/, "");
  if (oneLine.endsWith(";")) return oneLine.slice(0, -1);
  const close = src.indexOf("\n" + pad + "};", lineEnd);
  if (close < 0) throw new Error("找不到 " + name + " 结尾");
  return src.slice(bodyStart, close + 2 + indent);
}

const collectImgSrcs = vm.runInNewContext("(" + sliceTop("collectImgSrcs") + ")");
const imgSrcsMatch = vm.runInNewContext("(" + sliceTop("imgSrcsMatch") + ")");

// 假选项行：click() 切换选中；hasCheckClass 决定 .check_answer 这个标记类在真实 DOM 里有没有
function makeOption(letter, { toggleOnClick = true, hasCheckClass = false } = {}) {
  const row = {
    __letter: letter,
    __state: { selected: false },
    __clicks: 0,
    textContent: "",
    innerHTML: "",
    closest(sel) {
      return sel === ".answerBg" ? row : null;
    },
    click() {
      row.__clicks += 1;
      if (toggleOnClick) row.__state.selected = !row.__state.selected;
    },
    dispatchEvent(ev) {
      if (String(ev && ev.type) === "click") row.click();
      return true;
    },
    querySelector(sel) {
      if (sel && sel.indexOf("check_answer") >= 0) {
        return hasCheckClass && row.__state.selected ? { __marker: true } : null;
      }
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
  return row;
}
const stateOf = (rows) => rows.filter((r) => r.__state.selected).map((r) => r.__letter).join("") || "无";

let red = 0;
function check(label, cond, detail) {
  if (!cond) red++;
  console.log(`${cond ? "ok   " : "RED  "} ${label}${cond || !detail ? "" : "\n         ↳ " + detail}`);
}

// ── 超星 ks 全链路（真·选中态三件套 + 真·fillQuestion）
function cxFill(question, rows) {
  const sandbox = {
    type: "ks",
    _window: {},
    removeHtml: (s) => String(s == null ? "" : s).replace(/<[^>]+>/g, ""),
    clearMark: (s) => String(s == null ? "" : s).replace(/^[A-Za-z][.、．]\s*/, "").replace(/\s+/g, ""),
    collectImgSrcs,
    imgSrcsMatch,
    log: { insertLog: () => {} },
    setting: { tabIndex: "0" },
    fillLineQuestion: () => false,
    fillCompositeChoiceQuestion: () => false,
    buildAnswerGroups: (a) => [a]
  };
  vm.createContext(sandbox);
  // 三个函数互相以 this.* 调用，必须同处一个上下文
  sandbox.getChoiceOptionContainer = vm.runInContext("(" + slicePublicField("getChoiceOptionContainer") + ")", sandbox);
  sandbox.isChoiceOptionSelected = vm.runInContext("(" + slicePublicField("isChoiceOptionSelected") + ")", sandbox);
  sandbox.selectChoiceOption = vm.runInContext("(" + slicePublicField("selectChoiceOption") + ")", sandbox);
  const fill = vm.runInContext("(" + slicePublicField("fillQuestion") + ")", sandbox);
  const options = {};
  ["甲", "乙", "丙", "丁"].forEach((t, i) => {
    options[t] = rows[i];
  });
  question.options = options;
  question.element = { querySelectorAll: () => [] };
  return fill(question);
}

console.log("═══ A. 超星考试 ks：脚本报的 filled vs 假 DOM 真实勾选 ═══");
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l));
  const f1 = cxFill({ type: "1", answer: { answer: ["A", "C"] } }, rows);
  const s1 = stateOf(rows);
  const f2 = cxFill({ type: "1", answer: { answer: ["A", "C"] } }, rows);
  const s2 = stateOf(rows);
  console.log(`  第1遍 filled=${f1} 勾选=${s1}；第2遍 filled=${f2} 勾选=${s2}`);
  check("A1 第1遍真勾上 A、C", s1 === "AC", `实际 ${s1}`);
  check("A2 同一题再答一遍不抵消", s2 === "AC",
    `实际 ${s2}，两遍都报 filled=true。isChoiceOptionSelected(7969) 判已选只认 .check_answer/.check_answer_dx，全脚本仅此一处引用`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, { toggleOnClick: false }));
  const f = cxFill({ type: "1", answer: { answer: ["A", "C"] } }, rows);
  console.log(`  点击落空（没有监听/结构不匹配）：filled=${f} 勾选=${stateOf(rows)}`);
  check("A3 点击落空时 filled 必须为 false", f === false,
    `实际 filled=${f} → selectChoiceOption(7980) 点完无条件 return true，答题循环(7857)据此 correctNum += 1，正确率虚高且照常交卷`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, { hasCheckClass: true }));
  cxFill({ type: "1", answer: { answer: ["A", "C"] } }, rows);
  const s1 = stateOf(rows);
  cxFill({ type: "1", answer: { answer: ["A", "C"] } }, rows);
  const s2 = stateOf(rows);
  console.log(`  若 .check_answer 真存在：第1遍=${s1} 第2遍=${s2}`);
  check("A4 有 .check_answer 标记时第二遍安全", s1 === "AC" && s2 === "AC", `实际 ${s1} / ${s2}`);
}

console.log("\n═══ B. 智慧树 smartAnswerLogic：真·fillChoice ═══");
function zhsFillChoice(answers, rows, type = "多选题") {
  const sandbox = {
    MouseEvent: class {
      constructor(t) {
        this.type = t;
        this.bubbles = true;
      }
    }
  };
  vm.createContext(sandbox);
  sandbox.cleanText = vm.runInContext("(" + sliceNested("cleanText") + ")", sandbox);
  sandbox.normalize = vm.runInContext("(" + sliceNested("normalize") + ")", sandbox);
  const fn = vm.runInContext("(" + sliceNested("fillChoice") + ")", sandbox);
  const question = { type, optionEls: rows, element: { querySelectorAll: () => [] } };
  return fn(question, answers);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, { toggleOnClick: false }));
  const ret = zhsFillChoice(["A", "C"], rows);
  console.log(`  返回=${ret}；每个命中项派发了几次点击：${rows.map((r) => `${r.__letter}:${r.__clicks}`).join(" ")}`);
  check("B1 每个选项只派发 1 次点击", rows.every((r) => r.__clicks <= 1),
    `实际 ${rows.filter((r) => r.__clicks > 1).map((r) => r.__letter + "×" + r.__clicks).join(" ")} → 11583/11584 click() 与 dispatchEvent(click) 连发两次`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l));
  const ret = zhsFillChoice(["A", "C"], rows);
  console.log(`  切换式选项行：返回=${ret} 勾选=${stateOf(rows)}`);
  check("B2 返回 true 时选项确实处于勾选态", ret === true && stateOf(rows) === "AC",
    `实际 返回${ret} 勾选${stateOf(rows)}（智慧树选项若是切换语义，双发即抵消；对照 12082-12087 作者自己的 clickNativeFirst 是「点一次、看状态变了没、没变再补点」）`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, { toggleOnClick: false }));
  const ret = zhsFillChoice(["A", "E"], rows);
  console.log(`  答案 ["A","E"] 但 DOM 只有 4 个选项：返回=${ret} 点击数=${rows.reduce((s, r) => s + r.__clicks, 0)}`);
  check("B3 越界字母只作废该字母，A 仍要勾上", rows[0].__clicks === 1,
    `实际 A 被点击 ${rows[0].__clicks} 次 → 11575 letterMappingOk 是一票否决（maxLetterIdx 越界则整组字母答案全部作废）`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, { toggleOnClick: false }));
  cxFill({ type: "1", answer: { answer: ["A", "E"] } }, rows);
  console.log(`  同样的 ["A","E"]，超星链路：A 点击 ${rows[0].__clicks} 次`);
  check("B4 对照：超星 8091 逐字母过滤，A 照样勾上", rows[0].__clicks === 1);
}

console.log(`\n红条数：${red}`);
process.exit(red ? 1 : 0);
