// 判别「填上了没有」：用脚本文件里的原文函数
//   超星：getChoiceOptionContainer / isChoiceOptionSelected / getChoiceOptionSig / selectChoiceOption / fillQuestion
//   智慧树：smartAnswerLogic 内的 fillChoice + clickChoiceOption（连 normalize/cleanText 一起取原文）
// 配一个「点一下切换选中态、并把选中态用某种真实存在的标记暴露出来」的假 DOM，
// 比对脚本自报的 filled 与假 DOM 的真实选中态。
//
//   node scripts/_probe_fill_stateful.js                     ← 跑当前文件
//   node scripts/_probe_fill_stateful.js --pre               ← 跑修复前的版本（HEAD），必须变红
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const vm = require("vm");

// ---- 取源码：默认当前工作区文件；--pre 则从 git HEAD 取修复前的原文 ----
const PRE = process.argv.includes("--pre");
let src;
if (PRE) {
  src = cp.execSync('git show HEAD:scripts/xueshen-gf.js', { cwd: path.join(__dirname, ".."), maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
} else {
  src = fs.readFileSync(path.join(__dirname, "xueshen-gf.js"), "utf8");
}

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

// ── 假选项行：mode 决定平台把「选中」暴露成什么标记
//    aria      aria-checked="true"            （超星 zj/zy 组件）
//    input     内部 input[type=checkbox].checked（ElementUI / 原生表单）
//    attr      内部 input 只有 checked 属性、property 恒为 false（超星 jQuery attr 写法）
//    marker    内部出现 .check_answer 子元素   （超星 ks 原有假设）
//    class     自身 className 出现 is-checked   （常见自绘选项）
//    none      点了什么可观测的东西都不变        （点击落空）
function makeOption(letter, mode = "aria") {
  const row = {
    __letter: letter,
    __clicks: 0,
    __selected: false,
    textContent: "",
    innerHTML: "",
    className: "optionLi",
    __attrs: {},
    closest(sel) {
      return sel === ".answerBg" ? row : null;
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(row.__attrs, name) ? row.__attrs[name] : null;
    },
    click() {
      row.__clicks += 1;
      if (mode === "none") return;
      row.__selected = !row.__selected;
      row.__sync();
    },
    dispatchEvent(ev) {
      if (String(ev && ev.type) === "click") row.click();
      return true;
    },
    querySelector(sel) {
      if (sel && sel.indexOf("check_answer") >= 0) {
        return mode === "marker" && row.__selected ? { __marker: true } : null;
      }
      return null;
    },
    querySelectorAll(sel) {
      if (sel && sel.indexOf("input") === 0) {
        return mode === "input" || mode === "attr" ? [row.__input] : [];
      }
      return [];
    },
    __sync() {
      if (mode === "aria") {
        if (row.__selected) row.__attrs["aria-checked"] = "true";
        else delete row.__attrs["aria-checked"];
      } else if (mode === "input") {
        row.__input.checked = row.__selected;
      } else if (mode === "attr") {
        // jQuery 的 attr('checked','checked')：只写属性，不碰 property
        if (row.__selected) row.__input.__attrs.checked = "checked";
        else delete row.__input.__attrs.checked;
      } else if (mode === "class") {
        row.className = row.__selected ? "optionLi is-checked" : "optionLi";
      }
    }
  };
  row.__input = {
    type: "checkbox",
    checked: false,
    __attrs: {},
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(row.__input.__attrs, name) ? row.__input.__attrs[name] : null;
    }
  };
  return row;
}
const stateOf = (rows) => rows.filter((r) => r.__selected).map((r) => r.__letter).join("") || "无";

let red = 0;
const fails = [];
function check(label, cond, detail) {
  if (!cond) {
    red++;
    fails.push(label);
  }
  console.log(`${cond ? "ok   " : "RED  "} ${label}${cond || !detail ? "" : "\n         ↳ " + detail}`);
}

// helper 在修复前确实不存在，但当前版本取不到就是探针自身的问题，必须抛出来（静默降级会把红测成绿）
function orPre(label, fn, preFallback) {
  try {
    return fn();
  } catch (e) {
    if (!PRE) throw new Error(`${label} 取原文失败：${e.message}`);
    return preFallback || null;
  }
}

// ── 超星 ks 全链路
function cxFill(question, rows) {
  const sandbox = {
    type: "ks",
    _window: { MouseEvent: class { constructor(t, o) { this.type = t; Object.assign(this, o); } } },
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
  const grab = (name, preFallback) => {
    sandbox[name] = orPre(name, () => vm.runInContext("(" + slicePublicField(name) + ")", sandbox), preFallback);
  };
  grab("getChoiceOptionContainer");
  grab("getChoiceOptionInputs", (c) => {
    const n = c.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    return n ? [...n] : [];
  });
  grab("isChoiceInputChecked", (i) => i.checked === true); // 修复前只认 property
  grab("isChoiceOptionSelected");
  grab("getChoiceOptionSig", null); // 修复前没有这个函数
  grab("selectChoiceOption");
  sandbox.resolveBlankAnswers = () => [];
  sandbox.resolveJudgeAnswer = () => "";
  const fill = vm.runInContext("(" + slicePublicField("fillQuestion") + ")", sandbox);
  const options = {};
  ["甲", "乙", "丙", "丁"].forEach((t, i) => {
    options[t] = rows[i];
  });
  question.options = options;
  question.element = { querySelectorAll: () => [], querySelector: () => null };
  return fill(question);
}

console.log(`源码：${PRE ? "HEAD（修复前，预期出现红条）" : "当前工作区（预期全绿）"}`);
console.log("\n═══ A. 超星考试 ks：脚本报的 filled vs 假 DOM 真实勾选 ═══");
for (const mode of ["aria", "input", "attr", "marker", "class"]) {
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, mode));
  const f1 = cxFill({ type: "1", answer: { answer: ["A", "C"] } }, rows);
  const s1 = stateOf(rows);
  const f2 = cxFill({ type: "1", answer: { answer: ["A", "C"] } }, rows);
  const s2 = stateOf(rows);
  console.log(`  标记=${mode}：第1遍 filled=${f1} 勾选=${s1}；第2遍 filled=${f2} 勾选=${s2}`);
  check(`A1[${mode}] 第1遍真勾上 A、C`, s1 === "AC" && f1 === true, `勾选=${s1} filled=${f1}`);
  check(`A2[${mode}] 同一题再答一遍不抵消`, s2 === "AC" && f2 === true,
    `勾选=${s2}（两遍都报 filled=true 却把答案点没了）`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, "none"));
  const f = cxFill({ type: "1", answer: { answer: ["A", "C"] } }, rows);
  console.log(`  点击落空（无可观测变化）：filled=${f} 勾选=${stateOf(rows)}`);
  check("A3 点击落空时 filled 必须为 false", f === false,
    `实际 filled=${f} → 点完不回读状态，correctNum/accuracy 虚高，空卷也照常交卷`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, "aria"));
  cxFill({ type: "0", answer: { answer: ["B"] } }, rows);
  check("A4 对照：单选只点 1 个", rows.filter((r) => r.__selected).length === 1 && rows[1].__clicks === 1,
    `点击数=${rows.map((r) => r.__clicks).join(",")} 勾选=${stateOf(rows)}`);
}

console.log("\n═══ B. 智慧树 smartAnswerLogic：真·fillChoice ═══");
function zhsFillChoice(answers, rows, type = "多选题") {
  const sandbox = {
    MouseEvent: class {
      constructor(t, o) {
        this.type = t;
        Object.assign(this, o || {});
      }
    }
  };
  vm.createContext(sandbox);
  sandbox.cleanText = vm.runInContext("(" + sliceNested("cleanText") + ")", sandbox);
  sandbox.normalize = vm.runInContext("(" + sliceNested("normalize") + ")", sandbox);
  sandbox.isInputChecked = orPre("isInputChecked", () => vm.runInContext("(" + sliceNested("isInputChecked") + ")", sandbox),
    (i) => i.checked === true); // 修复前只认 property
  orPre("choiceOption*", () => {
    sandbox.choiceOptionSelected = vm.runInContext("(" + sliceNested("choiceOptionSelected") + ")", sandbox);
    sandbox.choiceOptionSig = vm.runInContext("(" + sliceNested("choiceOptionSig") + ")", sandbox);
    sandbox.clickChoiceOption = vm.runInContext("(" + sliceNested("clickChoiceOption") + ")", sandbox);
    return true;
  }); // 修复前没有这三个 helper，fillChoice 里直接 option.click()
  const fn = vm.runInContext("(" + sliceNested("fillChoice") + ")", sandbox);
  const question = { type, optionEls: rows, element: { querySelectorAll: () => [] } };
  return fn(question, answers);
}
for (const mode of ["aria", "input", "attr", "class"]) {
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, mode));
  const ret = zhsFillChoice(["A", "C"], rows);
  console.log(`  标记=${mode}：返回=${ret} 勾选=${stateOf(rows)} 点击数=${rows.map((r) => `${r.__letter}:${r.__clicks}`).join(" ")}`);
  check(`B1[${mode}] 每个命中项只派发 1 次点击`, rows.every((r) => r.__clicks <= 1),
    `${rows.filter((r) => r.__clicks > 1).map((r) => r.__letter + "×" + r.__clicks).join(" ")} 次点击（click + dispatchEvent 连发两次）`);
  check(`B2[${mode}] 返回 true 时选项确实处于勾选态`, ret === true && stateOf(rows) === "AC",
    `返回${ret} 勾选${stateOf(rows)}`);
  const ret2 = zhsFillChoice(["A", "C"], rows);
  check(`B3[${mode}] 再答一遍不抵消`, ret2 === true && stateOf(rows) === "AC",
    `返回${ret2} 勾选=${stateOf(rows)}`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, "aria"));
  zhsFillChoice(["A", "E"], rows);
  check("B4 越界字母只作废该字母，A 仍要勾上", rows[0].__selected === true,
    `A 勾选=${rows[0].__selected}（一个越界字母让整组字母答案全部作废）`);
}
{
  const rows = ["A", "B", "C", "D"].map((l) => makeOption(l, "none"));
  const ret = zhsFillChoice(["A", "C"], rows);
  check("B5 智慧树点击落空时不得报成功", ret === false, `返回=${ret}`);
}

console.log("\n═══ C. 判断题极性 / 填空逐空 ═══");
{
  const cases = [["正确", "true"], ["错误", "false"], ["不对", "false"], ["√", "true"], ["×", "false"], ["是", "true"], ["否", "false"], ["AB", ""], ["", ""]];
  const sandbox = vm.createContext({});
  let resolveJudge;
  try {
    resolveJudge = vm.runInContext("(" + slicePublicField("resolveJudgeAnswer") + ")", sandbox);
  } catch (_) {
    resolveJudge = null;
  }
  if (!resolveJudge) {
    check("C1 修复前没有 resolveJudgeAnswer（预期这条在 --pre 下红）", false, "旧代码把认不出的答案默认当「对」");
  } else {
    const bad = cases.filter(([inp, want]) => resolveJudge(inp) !== want);
    check("C1 判断题极性判定（含「不对」否定式、认不出不默认对）", bad.length === 0,
      bad.map(([i, w]) => `${JSON.stringify(i)}→${JSON.stringify(resolveJudge(i))}≠${JSON.stringify(w)}`).join("；"));
  }
}
{
  const sandbox = vm.createContext({});
  let resolveBlank;
  try {
    resolveBlank = vm.runInContext("(" + slicePublicField("resolveBlankAnswers") + ")", sandbox);
  } catch (_) {
    resolveBlank = null;
  }
  if (!resolveBlank) {
    check("C2 修复前没有 resolveBlankAnswers（预期这条在 --pre 下红）", false, "旧代码按下标取答案，第 2 空拿到 undefined");
  } else {
    const got = JSON.stringify([
      resolveBlank(["甲,乙,丙"], 3),
      resolveBlank(["甲", "乙"], 2),
      resolveBlank(["A、B"], 2),
      resolveBlank(["一个很长的、带顿号的句子"], 1),
      resolveBlank([null, undefined, "x"], 2),
      resolveBlank(["甲"], 2) // 只有 1 个答案、页面 2 个空：不得复制成两份（ocsjs 的同款护栏）
    ]);
    const want = JSON.stringify([["甲", "乙", "丙"], ["甲", "乙"], ["A", "B"], ["一个很长的、带顿号的句子"], ["x"], ["甲"]]);
    check("C3 填空逐空切分（够数不拆、不够才拆、缺空不复制）", got === want, `${got}\n         期望=${want}`);
  }
}

console.log(`\n红条数：${red}${PRE ? "（修复前应当 > 0）" : ""}`);
if (red) console.log("红条清单：" + fails.join(" | "));
process.exit(red ? 1 : 0);
