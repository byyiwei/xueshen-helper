// 从 scripts/xueshen-gf.js 里切出「原文」的 normalizeLocalBackendAnswers 直接求值，
// 不重写等价逻辑：这样跑的就是线上脚本的那一份。
//   node scripts/_probe_answer_client.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "xueshen-gf.js");
const src = fs.readFileSync(file, "utf8");

function sliceFn(name) {
  const start = src.indexOf(`const ${name} = (`);
  if (start < 0) throw new Error(`找不到函数 ${name}`);
  const end = src.indexOf("\n  };", start);
  if (end < 0) throw new Error(`找不到 ${name} 结尾`);
  return src.slice(start, end + 5);
}

const code = sliceFn("normalizeLocalBackendAnswers");
process.stdout.write("== 取到的脚本原文 ==\n" + code + "\n\n");
// eslint-disable-next-line no-eval
const normalizeLocalBackendAnswers = eval("(" + code.replace(/^const\s+\w+\s*=\s*/, "") .replace(/;\s*$/, "") + ")");

// 期望：字母序列按字母拆；文本答案（填空/简答的英文单词）必须整串保留。
const cases = [
  ["多选字母", "ABD", ["A", "B", "D"]],
  ["多选逗号", "A,B", ["A", "B"]],
  ["多选带空格", "A, B, D", ["A", "B", "D"]],
  ["判断 正确", "正确", ["正确"]],
  ["判断 错误", "错误", ["错误"]],
  ["简答 中文长句", "马克思主义中国化就是把马克思主义基本原理同中国具体实际相结合", ["马克思主义中国化就是把马克思主义基本原理同中国具体实际相结合"]],
  ["填空 缩写 HTTP", "HTTP", ["HTTP"]],
  ["填空 单词 Python", "Python", ["Python"]],
  ["填空 缩写 DNA", "DNA", ["DNA"]],
  ["判断 英文 true", "true", ["true"]],
  ["填空 单词 maybe", "maybe", ["maybe"]],
  ["简答 英文单词 Yes", "Yes", ["Yes"]],
  ["选项正文含顿号", "甲、乙", ["甲、乙"]],
  ["选项正文带标点", "（1）坚持党的领导", ["（1）坚持党的领导"]],
];

let red = 0;
for (const [label, input, want] of cases) {
  const out = normalizeLocalBackendAnswers(input);
  const broken = JSON.stringify(out) !== JSON.stringify(want);
  if (broken) red++;
  console.log(`${broken ? "RED  " : "ok   "} ${label.padEnd(16)} ${JSON.stringify(input).padEnd(24)} → ${JSON.stringify(out)}`);
}
console.log(`\n红条数：${red}（文本答案被逐字母拆开的用例）`);
process.exit(red ? 1 : 0);
