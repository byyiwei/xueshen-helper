// 端到端判别：后端 normalize_ai_answer 的输出 → 脚本原文的 normalizeLocalBackendAnswers
// → 脚本原文的 fillQuestion(选择题分支) 实际点了哪几个框。
// 全部用文件里的原文代码，不重写等价逻辑。
//   1) python scripts/_probe_e2e_answers.py --py   （产出 cases.json）
//   2) node  scripts/_probe_e2e_fill.js            （跑填充，打印命中项）
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "xueshen-gf.js"), "utf8");

function sliceFn(name) {
  const start = src.indexOf(`const ${name} = (`);
  if (start < 0) throw new Error("找不到 " + name);
  const end = src.indexOf("\n  };", start);
  return src.slice(start, end + 5);
}
function slicePublicField(name) {
  const key = `__publicField(this, "${name}", `;
  const start = src.indexOf(key);
  if (start < 0) throw new Error("找不到 " + name);
  const marker = "\n      });";
  const end = src.indexOf(marker, start);
  if (end < 0) throw new Error("找不到 " + name + " 结尾");
  // 去掉尾巴的 ");"（那是 __publicField(...) 调用的闭括号），只留箭头函数本体
  return src.slice(start + key.length, end + marker.length - 2);
}

const normalizeLocalBackendAnswers = vm.runInNewContext("(" + sliceFn("normalizeLocalBackendAnswers").replace(/^const\s+\w+\s*=\s*/, "") .replace(/;\s*$/, "") + ")");
const collectImgSrcs = vm.runInNewContext("(" + sliceFn("collectImgSrcs").replace(/^const\s+\w+\s*=\s*/, "").replace(/;\s*$/, "") + ")");
const imgSrcsMatch = vm.runInNewContext("(" + sliceFn("imgSrcsMatch").replace(/^const\s+\w+\s*=\s*/, "").replace(/;\s*$/, "") + ")");
const fillQuestionSrc = slicePublicField("fillQuestion");

// fillQuestion 是箭头函数：.call() 改不了它的 this，this 就是 vm 上下文的全局对象。
// 所以把 this.* 的替身直接挂到 sandbox 全局上。
function runFill(type, optionTexts, answerArr) {
  const ticked = [];
  const options = {};
  optionTexts.forEach((t) => { options[t] = { __key: t }; });
  const question = { type, options, element: { querySelectorAll: () => [] }, answer: { answer: answerArr } };
  const sandbox = {
    _window: {},
    removeHtml: (s) => String(s == null ? "" : s),
    clearMark: (s) => String(s == null ? "" : s).replace(/\s+/g, ""),
    selectChoiceOption: (el) => { if (el && el.__key) ticked.push(el.__key); return true; },
    isChoiceOptionSelected: () => false,
    getChoiceOptionContainer: (el) => el,
    log: { insertLog: () => {} },
    setting: { tabIndex: "0" },
    fillLineQuestion: () => false,
    fillCompositeChoiceQuestion: () => false,
    buildAnswerGroups: (a) => [a],
    collectImgSrcs,
    imgSrcsMatch
  };
  vm.createContext(sandbox);
  const fn = vm.runInContext("(" + fillQuestionSrc + ")", sandbox);
  let err = "";
  let filled;
  try {
    filled = fn(question);
  } catch (e) {
    err = e.message;
  }
  return { ticked, filled, err };
}

const MULTI = ["甲", "乙", "丙", "丁"];
const EN = ["apple", "banana", "cat", "dog", "egg"];
const IMGOPT = ['<img src="https://c.com/a/aaa111.png"/>', '<img src="https://c.com/a/bbb222.png"/>'];

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "_probe_cases.json"), "utf8"));
let red = 0;
for (const c of cases) {
  const answers = normalizeLocalBackendAnswers(c.backend_answer);
  const r = runFill(c.type, c.options, answers);
  const got = r.ticked.join("+") || (r.err ? "抛错:" + r.err : "一个都没点");
  const ok = got === c.expect_fill;
  if (!ok) red++;
  console.log(
    `${ok ? "ok   " : "RED  "} [${c.label}] AI原文=${JSON.stringify(c.ai_reply)}` +
    `\n        后端返回=${JSON.stringify(c.backend_answer)}` +
    `\n        脚本拆成=${JSON.stringify(answers)}  →  实际勾中=${got}` +
    `${ok ? "" : `\n        应勾中=${c.expect_fill}`}`
  );
}
console.log(`\n红条数：${red} / ${cases.length}`);
process.exit(red ? 1 : 0);
