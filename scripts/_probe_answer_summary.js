// 判别「一卷一报」的小结是怎么拼出来的：直接跑 scripts/xueshen-gf.js 里的原文函数
//   enqueueScriptEvent / buildAnswerSummary / reportAnswerSummary
// 假 DOM、假后端，只判三件事：
//   1) 「填上」只算点完回读确认过的（code 1/2），没点上的（0）和不支持的（-1）都要进卡点清单
//   2) 上报的字段口径（platform/total/filled/src/score/threshold/unanswered）
//   3) 没 token / 没题 / 网络炸了，都不能把答题和交卷卡住
//
//   node scripts/_probe_answer_summary.js          ← 跑当前文件
//   node scripts/_probe_answer_summary.js --pre    ← 跑 HEAD（本次改动前），必须变红
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const vm = require("vm");

const PRE = process.argv.includes("--pre");
const ROOT = path.join(__dirname, "..");
let src;
if (process.env.XS_PROBE_SRC) {
  // 变异测试用：指向一份改坏的副本，验证本探针的断言真的抓得住（不是白给的绿）
  src = fs.readFileSync(process.env.XS_PROBE_SRC, "utf8");
} else if (PRE) {
  src = cp.execSync('git show HEAD:scripts/xueshen-gf.js', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
} else {
  src = fs.readFileSync(path.join(__dirname, "xueshen-gf.js"), "utf8");
}

function sliceArrow(name) {
  const key = "  const " + name + " = ";
  const start = src.indexOf(key);
  if (start < 0) throw new Error("找不到 " + name);
  const end = src.indexOf("\n  };", start);
  if (end < 0) throw new Error("找不到 " + name + " 结尾");
  return src.slice(start + key.length, end + 4);
}

let red = 0;
const fails = [];
function check(label, cond, detail) {
  if (!cond) { red++; fails.push(label); }
  console.log(`${cond ? "ok   " : "RED  "} ${label}${cond || !detail ? "" : "\n         ↳ " + detail}`);
}

// ── 依赖注入：脚本原文里的自由变量全部挂到 sandbox 全局（箭头函数的 this 也在这层）
// 探针只切函数原文，顶层 const 不在里面 → 上限从源码读，别在测试里抄一份数字（改了常量测试还绿＝白测）
const UNFILLED_LIMIT = Number((src.match(/const ANSWER_SUMMARY_LIMIT\s*=\s*(\d+)/) || [])[1]);

function makeCtx(opts = {}) {
  const calls = [];
  const hashed = [];
  const sandbox = {
    ANSWER_SUMMARY_LIMIT: UNFILLED_LIMIT,
    console,
    Promise,
    location: { href: "https://ananas.chaoxing.com/exam/mock" },
    getScriptLogToken: () => (opts.token === undefined ? "tok-123" : opts.token),
    getDateTime: () => "2026-09-21 10:22:31",
    getScriptInfo: () => ({ version: "5.3.7" }),
    localBackendJson: (url, body, token) => {
      calls.push({ url, body, token });
      if (opts.fail) return Promise.reject(new Error("网络断了"));
      return Promise.resolve({ code: opts.code || 200 });
    },
    createAnswerRecordCacheKey: (q) => "KEY:" + String((q && q.title) || "").slice(0, 12),
    sha256Text: (k) => {
      hashed.push(String(k));
      return Promise.resolve("H-" + String(k).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8));
    },
    useSettingStore: () => ({ config: { basicConfig: { accuracy: { value: opts.threshold === undefined ? 80 : opts.threshold } } } })
  };
  const ctx = vm.createContext(sandbox);
  return { ctx, sandbox, calls, hashed };
}

// 取原文函数，顺手挂回 sandbox 全局：reportAnswerSummary 是按名字调另外两个的
function load(name, made) {
  const fn = vm.runInContext("(" + sliceArrow(name) + ")", made.ctx);
  made.sandbox[name] = fn;
  return fn;
}

// 一条题目：answer.code 是脚本自报的填充状态，src 是答案来源，msg 是失败原因
const Q = (title, type, answer) => ({ title, type, answer });

(async () => {
  console.log("脚本来源：" + (PRE ? "HEAD（本次改动前，预期出现红条）" : path.join(__dirname, "xueshen-gf.js")));

  // 上报只是加一行日志：谁在调用点加了 await，自动交卷就会被一次网络请求卡住
  check("调用点不许 await reportAnswerSummary", !/await\s+reportAnswerSummary\(/.test(src),
    "带 await 的调用点=" + (src.match(/await\s+reportAnswerSummary\(/g) || []).length);

  // 4 题：题库直答 1、模型答 1、点了没生效 1、题型不支持 1
  const questions = [
    Q("已知集合 A={1,2}，则 A 的子集个数是（ ）", "0", { code: 1, src: "bank" }),
    Q("下列说法正确的是（ ）", "1", { code: 2, src: "ai" }),
    Q("下列关于细胞器的叙述，正确的有（ ）", "1", { code: 0, src: "cache", msg: "选项未渲染" }),
    Q("把下列国家与其首都连起来", "11", { code: -1, msg: "该题型暂不支持" })
  ];

  const made = makeCtx();
  let build = null, report = null;
  try {
    load("enqueueScriptEvent", made);
    build = load("buildAnswerSummary", made);
    report = load("reportAnswerSummary", made);
  } catch (e) {
    if (!PRE) throw e;
    check("HEAD 里有这套「一卷一报」函数（没有就是本次要加的东西，预期红）", false, e.message);
  }

  if (build) {
    const s = await build("cx-zy", questions);
    check("填上的只有 code 1/2（共 2 题）", s.filled === 2, "filled=" + s.filled);
    check("code 0（点了没生效）算没填上", s.unfilled === 2 && s.unanswered.some(u => u.code === 0),
      "unfilled=" + s.unfilled + " codes=" + s.unanswered.map(u => u.code).join(","));
    check("code -1（题型不支持）也要进卡点清单，否则「没填上 2」只有 1 条能解释",
      s.unanswered.some(u => u.code === -1), "codes=" + s.unanswered.map(u => u.code).join(","));
    check("卡点条数与没填上数对得上（后台要能拼平）", s.unanswered.length === s.unfilled,
      "unanswered=" + s.unanswered.length + " unfilled=" + s.unfilled);
    check("来源分开计：题库 1 / 缓存 0 / 模型 1", s.src.bank === 1 && s.src.cache === 0 && s.src.ai === 1, JSON.stringify(s.src));
    check("没点上的那道题不贡献来源计数，否则题库命中率虚高", s.src.unknown === 0, JSON.stringify(s.src));
    check("score 恒为 null：平台交卷后不回吐分数，不承诺判对率", s.score === null, "score=" + s.score);
    check("threshold 取自用户设置（默认 80）", s.threshold === 80, "threshold=" + s.threshold);
    const stuck = s.unanswered.find(u => u.code === 0);
    check("卡点带题干片段，后台才知道卡的是哪道题", /细胞器/.test(stuck.title), "title=" + JSON.stringify(stuck.title));
    check("卡点带原始 code 与后端报文 reason", stuck.code === 0 && stuck.reason === "选项未渲染", JSON.stringify(stuck));
    check("卡点带题目指纹（同一道题反复卡才归得出来）", /^H-/.test(stuck.hash), "hash=" + stuck.hash);

    // 脏输入：HTML 标签、超长题干、超长报文、缺 answer、null
    const dirty = await build("cx-ks", [
      Q("<p>  第一章&nbsp;&nbsp;" + "长".repeat(120) + "  </p>", "0", { code: 0, msg: "E".repeat(200) }),
      { title: "无 answer 字段", type: "0" },
      null
    ]);
    check("题干去标签后压成一行，且截到 60 字",
      dirty.unanswered[0].title.length === 60 && !/[<>]/.test(dirty.unanswered[0].title),
      "len=" + dirty.unanswered[0].title.length + " " + JSON.stringify(dirty.unanswered[0].title.slice(0, 24)));
    check("reason 截到 80 字（报文再长也不撑爆日志）", dirty.unanswered[0].reason.length === 80, "len=" + dirty.unanswered[0].reason.length);
    check("没有 answer 的题算没填上，不抛异常", dirty.total === 3 && dirty.filled === 0,
      JSON.stringify({ total: dirty.total, filled: dirty.filled }));
    check("空题号列表算 total=0", (await build("cx-zy", [])).total === 0);
    check("非数组入参不炸", (await build("cx-zy", null)).total === 0);

    // 一场 200 题全没填上：指纹是逐题 await 算的，不设上限＝答完还要排 200 次哈希
    check("卡点上限读得到（脚本源码里声明的常量）", UNFILLED_LIMIT, 40);
    const bigCtx = makeCtx();
    load("buildAnswerSummary", bigCtx);
    const big = await bigCtx.sandbox.buildAnswerSummary("cx-ks",
      Array.from({ length: 200 }, (_, i) => Q("第" + i + "题 下列说法正确的是（ ）", "0", { code: -1004, msg: "题库没有该题" })));
    check("200 题全卡住也只算 40 个指纹（后台只吃前 40 条，不给交卷前添一长串等待）",
      bigCtx.hashed.length === UNFILLED_LIMIT && big.unanswered.length === UNFILLED_LIMIT,
      "sha256 调用=" + bigCtx.hashed.length + " 上报卡点=" + big.unanswered.length);
    check("卡到上限不改计数：total/filled/unfilled 照实报",
      big.total === 200 && big.filled === 0 && big.unfilled === 200,
      JSON.stringify({ total: big.total, filled: big.filled, unfilled: big.unfilled }));
  }

  if (report) {
    const body = makeCtx();
    load("enqueueScriptEvent", body);
    load("buildAnswerSummary", body);
    const r = load("reportAnswerSummary", body);

    const okResult = await r("cx-zy", questions);
    check("有题就上报，一场一条", body.calls.length === 1 && okResult === true, "calls=" + body.calls.length + " result=" + okResult);
    check("走的是已有的 /api/script-logs，不新增公开接口", /\/api\/script-logs$/.test(body.calls[0].url), body.calls[0].url);
    const item = body.calls[0].body.logs[0];
    check("小结自成一条：logs 只 1 项、event_type=answer_summary", body.calls[0].body.logs.length === 1 && item.event_type === "answer_summary",
      JSON.stringify(body.calls[0].body.logs.map(l => l.event_type)));
    check("明细落在 extra 里，带 platform/total/filled/src/score",
      item.extra.platform === "cx-zy" && item.extra.total === 4 && item.extra.filled === 2 && item.extra.score === null && item.extra.src.bank === 1,
      JSON.stringify(item.extra));
    check("小结带脚本版本号，才能按版本看修复前后差别", item.extra.script_version === "5.3.7", "v=" + item.extra.script_version);
    check("小结标题带平台与题数，日志列表一眼可读", /^\[答题小结\] cx-zy 共4题 填上2题$/.test(item.message), item.message);

    const empty = makeCtx();
    load("enqueueScriptEvent", empty);
    load("buildAnswerSummary", empty);
    const emptyResult = await load("reportAnswerSummary", empty)("cx-zy", []);
    check("整场零题不发请求（不给日志表灌空行）", empty.calls.length === 0 && emptyResult === false, "calls=" + empty.calls.length);

    const noToken = makeCtx({ token: "" });
    load("enqueueScriptEvent", noToken);
    load("buildAnswerSummary", noToken);
    const noTokenResult = await load("reportAnswerSummary", noToken)("cx-zy", questions);
    check("没登录态就不发请求，也不报错", noToken.calls.length === 0 && noTokenResult === false, "calls=" + noToken.calls.length);

    const boom = makeCtx({ fail: true });
    load("enqueueScriptEvent", boom);
    load("buildAnswerSummary", boom);
    let threw = false, boomResult = null;
    try {
      boomResult = await load("reportAnswerSummary", boom)("cx-zy", questions);
    } catch (e) {
      threw = true;
    }
    check("上报失败不抛出：答题末尾调用它，不能因此卡住自动交卷", !threw && boomResult === false, threw ? "抛出了异常" : "result=" + boomResult);

    const rejected = makeCtx({ code: 401 });
    load("enqueueScriptEvent", rejected);
    load("buildAnswerSummary", rejected);
    const rejectedResult = await load("reportAnswerSummary", rejected)("cx-zy", questions);
    check("后端非 200 时返回 false，不谎报已上报", rejectedResult === false, "result=" + rejectedResult);
  }

  console.log("\n红条数：" + red + (red ? "  →  " + fails.join(" | ") : ""));
  process.exit(red ? 1 : 0);
})().catch((e) => {
  console.error("探针自身出错：" + ((e && e.stack) || e));
  process.exit(2);
});
