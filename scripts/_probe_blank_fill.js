// 把 scripts/_probe_fill_blank_shapes.py 产出的后端答案，喂进文件里原文的
// normalizeLocalBackendAnswers + 原文 fillQuestion 的 填空(type=2)/简答(type=4,5) 分支，
// 看每空的编辑器到底收到了什么。UE 用替身记录 setContent 的入参。
//
//   1) python scripts/_probe_fill_blank_shapes.py
//   2) node  scripts/_probe_blank_fill.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "xueshen-gf.js"), "utf8");

function sliceFn(name) {
  const start = src.indexOf(`const ${name} = (`);
  if (start < 0) throw new Error("找不到 " + name);
  const end = src.indexOf("\n  };", start);
  return src.slice(start, end + 5).replace(/^const\s+\w+\s*=\s*/, "").replace(/;\s*$/, "");
}
function slicePublicField(name) {
  const key = `__publicField(this, "${name}", `;
  const start = src.indexOf(key);
  if (start < 0) throw new Error("找不到 " + name);
  const marker = "\n      });";
  const end = src.indexOf(marker, start);
  return src.slice(start + key.length, end + marker.length - 2);
}

const normalizeLocalBackendAnswers = vm.runInNewContext("(" + sliceFn("normalizeLocalBackendAnswers") + ")");

// blankCount = 页面上有几个空；expect = 每个空应当收到什么
function runFill(type, backendAnswer, blankCount, editorThrows = false) {
  const seen = [];
  const textareas = [];
  for (let i = 0; i < blankCount; i++) textareas.push({ name: `content_${i}`, value: null });
  const element = {
    querySelectorAll: () => textareas,
    querySelector: () => (textareas.length ? textareas[0] : null)
  };
  const question = { type, element, answer: { answer: backendAnswer } };
  const sandbox = {
    type: "ks",
    _window: {
      UE: {
        getEditor: (name) => ({
          setContent: (v) => {
            if (editorThrows) throw new Error("UE 未就绪");
            seen.push({ name, v });
          }
        })
      }
    },
    removeHtml: (s) => String(s == null ? "" : s),
    clearMark: (s) => String(s == null ? "" : s),
    selectChoiceOption: () => true,
    isChoiceOptionSelected: () => false,
    getChoiceOptionContainer: (el) => el,
    collectImgSrcs: () => [],
    imgSrcsMatch: () => false,
    log: { insertLog: () => {} },
    setting: { tabIndex: "0" },
    fillLineQuestion: () => false,
    fillCompositeChoiceQuestion: () => false,
    buildAnswerGroups: (a) => [a]
  };
  vm.createContext(sandbox);
  const fill = vm.runInContext("(" + slicePublicField("fillQuestion") + ")", sandbox);
  let err = "", filled;
  try {
    filled = fill(question);
  } catch (e) {
    err = e.constructor.name + ": " + e.message;
  }
  return { seen, filled, err, cleared: textareas.filter((t) => t.value === "").length };
}

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "_probe_blank_cases.json"), "utf8"));
// 按后端答案原文定位（python 侧的 note 有重复，不用它当键）
const byAnswer = (val) => cases.find((c) => c.backend_answer === val);

// 每例：[后端答案原文, 页面几个空, 每空该收到什么]
const TABLE = [
  ["北京，上海", 2, ["北京", "上海"]],
  ["北京,上海", 2, ["北京", "上海"]],
  ["['北京', '上海']", 2, ["北京", "上海"]],
  ["H2O。", 1, ["H2O"]],
  ["apple", 1, ["apple"]],
  ["超文本传输协议", 1, ["超文本传输协议"]],
  ["S 优势、W 劣势、O 机会、T 威胁，四要素缺一不可", 1, ["S 优势、W 劣势、O 机会、T 威胁，四要素缺一不可"]],
  ["HyperText Transfer Protocol", 1, ["HyperText Transfer Protocol"]],
  ["消费者新增一单位商品所获得的额外满足感", 1, ["消费者新增一单位商品所获得的额外满足感"]]
];

let red = 0;
console.log("═══ 填空(2空) / 简答 / 名词解释：每空实际收到什么 ═══");
for (const [answer, blanks, expect] of TABLE) {
  const c = byAnswer(answer);
  if (!c) {
    red++;
    console.log(`RED   没找到后端答案 ${JSON.stringify(answer)} 对应的用例`);
    continue;
  }
  const answers = normalizeLocalBackendAnswers(c.backend_answer);
  const r = runFill(c.type, answers, blanks);
  const got = r.seen.map((s) => s.v);
  const ok = got.length === expect.length && expect.every((e, i) => got[i] === e);
  if (!ok) red++;
  console.log(`${ok ? "ok   " : "RED  "} [${c.label}]（页面 ${blanks} 个空）`);
  console.log(`        后端=${JSON.stringify(c.backend_answer)} → 脚本拆=${JSON.stringify(answers)}`);
  console.log(`        写入=${JSON.stringify(got)} filled=${r.filled}${r.err ? " 抛错=" + r.err : ""}`);
  if (!ok) console.log(`        应为=${JSON.stringify(expect)}`);
}

console.log("\n═══ 超星填空分支的两个副作用 ═══");
{
  const r = runFill("2", ["北京", "上海"], 2, true);
  const ok = r.cleared === 0;
  if (!ok) red++;
  console.log(`${ok ? "ok   " : "RED  "} UE 取不到时不该把文本框清空：被清空的框=${r.cleared} filled=${r.filled}`);
  console.log("        ↳ 8136 行 catch 里 textareaElement.value = \"\"；UE 未就绪会把用户已填内容抹掉");
}
{
  const r = runFill("4", [], 1);
  const ok = !r.err && r.filled === false;
  if (!ok) red++;
  console.log(`${ok ? "ok   " : "RED  "} 空答案应当只报没填上、不抛错：${r.err || "无抛错"} filled=${r.filled}`);
  console.log("        ↳ 8173 行 setContent(answer[0]) 收到 undefined 也算成功，7859 行据此 correctNum += 1");
}

console.log(`\n红条数：${red}`);
process.exit(red ? 1 : 0);
