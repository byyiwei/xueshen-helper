// ==UserScript==
// @name         超星学习通｜知到智慧树 免费网课助手 - 学神助手｜自动答题｜免费搜题｜全平台刷课｜海量题库
// @namespace    IPYIWEI
// @version      6.0.8
// @updateURL    https://xs.openget.cn/scripts/xueshen-sc.user.js
// @downloadURL  https://xs.openget.cn/scripts/xueshen-sc.user.js
// @author       IPYIWEI
// @keywords     超星学习通,知到智慧树,学习通,智慧树,免费刷课,自动答题,免费搜题,刷课脚本,网课助手,网课答案,油猴脚本,chaoxing,zhihuishu
// @description  超星学习通、知到智慧树免费网课助手（刷课脚本）：自动刷课、自动答题、视频倍速、自动切换任务点，海量题库每日更新，支持免费搜题查网课答案。同时支持青书学堂、出头科技、雨课堂、云班课、智慧职教、国家开放大学、中国大学MOOC、U校园、学堂在线、绎通云、山东专技、西财在线｜DeepSeek AI 兜底作答｜字体加密解析
// @description:zh-CN 超星学习通、知到智慧树免费网课助手（刷课脚本）：自动刷课、自动答题、视频倍速、自动切换任务点，海量题库每日更新，支持免费搜题查网课答案。同时支持青书学堂、出头科技、雨课堂、云班课、智慧职教、国家开放大学、中国大学MOOC、U校园、学堂在线、绎通云、山东专技、西财在线｜DeepSeek AI 兜底作答｜字体加密解析
// @homepageURL  https://xs.openget.cn/
// @supportURL   https://xs.openget.cn/user.html
// @license      Proprietary
// @antifeature payment 部分高级功能需付费（AI 答题额度、自有模型）
// @original-author enncy
// @original-license MIT
// @original-script https://github.com/ocsjs/ocsjs
// @changelog    v6.0.8 (2026-10-31)
// @changelog    1. 与油猴版对齐版本号，无功能变化
// @changelog    v6.0.7 (2026-10-31)
// @changelog    1. 按脚本猫规则补充付费功能标注（@antifeature payment）与开源引用声明（@original-*）
// @changelog    2. 精简 @keywords，去掉堆砌的关键词
// @changelog    v6.0.6 (2026-10-31)
// @changelog    1. 脚本描述补充「刷课脚本、学习通刷课、免费搜题、网课答案」等搜索关键词，功能不变
// @changelog    v6.0.5 (2026-10-31)
// @changelog    1. 脚本更名为「超星学习通｜知到智慧树 免费网课助手」，提升学习通、超星、智慧树搜索曝光，功能不变
// @changelog    v6.0.4 (2026-10-31)
// @changelog    1. 设置页、答题页的面板高度收紧，内容多时在面板里滚动，不再把窗口撑得很高
// @changelog    2. 智慧树「掌握度」答题提速：点击、等待、翻页的节奏都压紧了，同一页答完更快
// @changelog    3. 开始答题前批量取题库答案，一次最多 20 题：题库里有的直接作答，没有的照常问 AI，速度更快、准确率不变
// @changelog    4. 六套主题配色统一，首页按钮去掉紫色渐变
// @changelog    v6.0.3 (2026-10-30)
// @changelog    1. 修复：脚本自动切页签时会把你正在看的「设置 / 搜题 / 记录」抢走，现在只有停在首页或日志时才自动切
// @changelog    2. 智慧树答题页按当前页面自动换内容：答题、考试、测验页显示答题，掌握度页显示掌握度，不再固定放切换按钮
// @changelog    v6.0.2 (2026-10-30)
// @changelog    1. 智慧树「掌握度」合并进「答题」：答题页顶部多了「答题 / 掌握度满分」切换，菜单栏少一个重复项
// @changelog    2. 「立即更新」现在会打开脚本安装地址，油猴 / 脚本猫直接弹更新页，不再跳到一串源码
// @changelog    3. 脚本更新地址换到自己的服务器，国内访问更快，不用再连 GitHub
// @changelog    4. 智慧树 AI 随堂练习改为按题库答案作答，多选题也会全部选上（原来是随机点一个，多选永远选不全）
// @changelog    v6.0.1 (2026-10-30)
// @changelog    v6.0.0 (2026-10-30)
// @changelog    1. 智慧树新版作业页修复：以前答完一题得刷新页面才能接着答，现在答完自动点「下一题」、等新题出来继续
// @changelog    2. 页面按钮结构变了也能找到「下一题」（按文字找），找不到也不再中断整个答题流程
// @changelog    1. 新平台新增「自动答题」：进入作业或考试页点扫描，脚本抓题、后端给答案、自动填到选项上
// @changelog    2. 单选、多选、判断、填空、简答都能处理，题目在 iframe 里也能抓到
// @changelog    3. 只自动填答案，不替你点提交；答完自己检查再交卷
// @changelog    4. 识别不到题目时点「诊断」，把页面结构写进日志，方便按真实页面补适配
// @changelog    5. 超星 / 智慧树 / 青书 / 出头 的答题页原样保留，逻辑一行未改
// @changelog    6. 雨课堂、中国大学MOOC 按真实页面结构精确识别题目，识别不到时自动退回通用识别
// @changelog    7. 云班课、绎通云、国家开放大学、西财在线同样按真实页面结构识别；电大考试站 ouchn.edu.cn 也纳入
// @changelog    8. 脚本更名「学神助手·网课助手｜全平台自动刷课」，14 个平台的名称、简称和网址都写进关键词，搜哪个平台都能出来
// @changelog    v5.6.3 (2026-10-30)
// @changelog    1. 新增 10 个平台：雨课堂、云班课、智慧职教（含 AI 版 / 2 版）、国家开放大学（含 syxy 版）、中国大学 MOOC、U 校园、学堂在线、绎通云、山东专技、西财在线
// @changelog    2. 视频助手：进入课程页自动播放、播完自动点下一节、文档页自动向下滚动，播放器在 iframe 里也能找到
// @changelog    3. 新平台不显示「答题」页签（还没有做这些平台的抓题作答），「搜题」「记录」照常可用
// @changelog    4. 不再单独放「视频」页签，倍速和翻页直接复用「设置」里的「视频倍速」「自动切换章节」，新平台在设置里多一个「视频助手」开关
// @changelog    5. 设置项按平台显示：当前平台没有的功能不出现，名称里不再带「（智慧树）」「（新增平台）」这类后缀
// @changelog    6. 超星 / 智慧树 / 青书 / 出头 的逻辑一行未改，原有页面行为不变
// @changelog    v5.6.2 (2026-10-29)
// @changelog    1. 新增「掌握度满分」（智慧树）：按知识点逐个进入练习，答对记住答案、答错换下一组选项重答，一直刷到 100%
// @changelog    2. 掌握度答案按课程存在本地：可导出 / 导入纯文字题库，也能导出未入库清单
// @changelog    3. 智慧树新增「掌握度」面板：开始 / 继续、暂停、进度、题库导入导出、运行记录
// @changelog    4. 设置新增「掌握度满分（智慧树）」开关；关闭后掌握度页仍走原来的答题流程
// @changelog    5. 可用题库优先：先问题库和 AI，答不出来再按选项组合猜，尽量少消耗答题次数
// @changelog    6. 修复：智慧树面板里的「队列」「掌握度」页签点开是空白（面板不再依赖运行时模板编译）
// @changelog    7. 修复：导出的题库文件中文乱码（补齐 BOM）、导入题库会覆盖别的标签页进度、中途换页后重复刷同一个知识点
// @changelog    8. 以上改动只涉及智慧树，超星 / 青书 / 出头 不受影响
// @changelog    v5.6.1 (2026-10-29)
// @changelog    1. 智慧树答题补齐：掌握度页可自动翻页、每题等题干渲染完再解析、题干取不到时只看可见文字、作业页也能抓到试卷接口
// @changelog    2. 智慧树弹题：弹窗出现就处理（不再等视频暂停）、遇到验证码先等、读不到页面答案时兜底作答、AI 智慧课补上弹题处理
// @changelog    3. 新增「视频助手」「答题助手」两个开关（仅智慧树），关掉后进对应页面不自动开始
// @changelog    4. 新增课程队列：在「队列」页勾选课程，按顺序一门门刷完自动切课
// @changelog    5. 以上改动只涉及智慧树，超星 / 青书 / 出头 不受影响
// @changelog    6. 移除早已没有入口的「问 AI」聊天组件，脚本内不再引用任何第三方 AI 服务
// @changelog    v5.6.0 (2026-10-28)
// @changelog    1. 新增「青书学堂」支持：课件学习时长接口上报、作业自动作答（默认只保存不交卷）
// @changelog    2. 新增「出头科技」支持：章节学习时长上报、考试自动作答并逐题核对（交卷需手动）
// @changelog    3. 两个新平台均为接口直通，超星 / 智慧树 原有功能不受影响
// @changelog    4. 修复智慧树多选题答不全：题型统一归一化、按页面复选框识别多选，选项逐项点击并回读确认，不再漏选
// @changelog    v5.5.2 (2026-10-27)
// @changelog    1. 适配智慧树新版前端检测：视频倍速钳制 1.8x（平台红线）、考试页 XHR hook 原生伪装，答题/视频页不再弹「检测到异常脚本」
// @changelog    1. 「手动选择」新增处理方式：等待我选择后继续 / 跳过此题（不自动提交）
// @changelog    2. 等待模式：遇到相似题停下整条答题链，你在「题目结果」里点选后自动继续答后面的题
// @changelog    3. 跳过模式：该题留空、本轮不自动提交，等你有空自己处理
// @changelog    4. 还有题等你选择时，自动提交与自动切章都会暂停，选完自动补上，不会再被刷走
// @changelog    v5.5.0 (2026-10-19)
// @changelog    1. 题库「相似题」不再卡住：新增设置项「题库匹配方式」，可选自动选最优 / 手动选择
// @changelog    2. 自动选最优：按题面 6 : 选项 3 : 题型 1 加权算相似度，≥90% 才算同一题直接作答，低于阈值交给 AI 重答
// @changelog    3. 手动选择：命中相似题时不再乱答，作业入口列出候选（最多 5 条、标注相似度），点一下即填入
// @changelog    4. 手动选题不扣答题次数，只有真正拿到答案才计入额度
// @changelog    5. 修复题库回退检索：去符号后搜不到时改用原始题干再搜，减少明明有题却匹配不到
// @changelog    v5.4.0 (2026-09-22)
// @changelog    1. 新增「跳过已完成章节」开关：自动切章按目录完成状态优先跳到未完成章节
// @changelog    2. 任务点完成统一确认：监听任务上报与完成图标，未确认完成时停止自动跳转并提示手动确认
// @changelog    3. 视频/音频增加播放看门狗，暂停自动恢复重试；播完等待平台确认，超时刷新只刷一次
// @changelog    4. 文档(PPT/DOC/PDF)任务点重写：完成入口、幻灯翻页、旧版PPT滚动，完成后确认
// @changelog    5. 电子书与计时阅读按要求时长保持阅读，多轮确认完成
// @changelog    6. 任务链逐条容错，同一 iframe 任务不重复处理
// @changelog    v5.3.12 (2026-09-22)
// @changelog    1. 视频播完后若任务点未标记完成，立即刷新页面确认，避免干等卡住切章
// @changelog    2. 同一任务只自动刷新一次，刷新后复查完成态再继续切章
// @changelog    v5.3.11 (2026-09-22)
// @changelog    1. 修复切章入口及完成状态检测，执行前复核各自动操作开关
// @changelog    2. 定时刷新按开关控制，一键关闭包含定时刷新
// @changelog    3. 接通自定义编辑框开关，保留原生划词选区；开关值原样保留
// @changelog    v5.3.10 更新内容：
// @changelog    1. 倍速改用播放器真实速度，支持重复修改，播放器重置后自动恢复
// @changelog    2. 修复播放启动失败后无法重试，增加页面恢复、断网恢复后的播放检查
// @changelog    3. 定时刷新默认关闭；已有配置开启时，播放中/答题中也不会刷新页面
// @changelog    4. 多选逐项核验，漏选不计成功，重试时先清理旧选项
// @changelog    5. 图片上传保留选项与图片的对应关系，缺图时明确报错
// @changelog    6. 请求限流自动等待重试，统一前后端超时预算
// @changelog    7. 答题统计默认当天，支持按历史日期区间查询
// @changelog    v5.3.9 更新内容：
// @changelog    1. 答题小结不再写入「余额不足」：欠费不是答题卡点，不进填充率/卡点榜
// @changelog    2. 拿到答案但点不上时，不再被后续余额不足盖掉真实原因
// @changelog    3. 超星选项匹配与点击加固：兼容字母前缀差异，并尝试点 input/字母链
// @changelog    v5.3.8 更新内容：
// @changelog    1. 填充不再谎报：点击后回读选中态，没点上就记「没填上」，不会看着填了其实还是空的
// @changelog    2. 填空题按每个空分别填写，多余的答案不再挤进第一个空
// @changelog    3. 答案解析加固：列表形式的答案能拆开，英文单词不会被误当成选项字母
// @changelog    4. 每答完一卷回传一条小结（共几题、填上几题、哪几题没填上），后台按题型和平台定位卡点
// @changelog    v5.3.7 更新内容：
// @changelog    1. 渠道专属版加固：代理商未配置店铺链接时，脚本不再露出官方购买入口，续费只走渠道发放的卡密激活
// @changelog    2. 代理商门户可自助填写店铺链接，保存后重新下载的脚本即跳该地址
// @changelog    3. 官方版功能与行为无变化
// @changelog    v5.3.6 更新内容：
// @changelog    1. 修复图片题漏传：纯图题干不再被跳过，图片选项会采集并发送给模型
// @changelog    2. 智慧树 iframe 改为绑定题目 DOM，选项图/题干图都能下载
// @changelog    3. 超星图片选项按文件名勾选；填不上则跳过题库改走模型
// @changelog    v5.3.5 更新内容：
// @changelog    1. 修复多选题偶发只填一项：后端不再把 A,B 截成首选项，考试/智慧树页按复选框识别多选
// @changelog    2. 智慧树 iframe 支持 ABD / A,B,D 及 X型/不定项多选填充
// @changelog    v5.3.4 更新内容：
// @changelog    1. 修复无扩展名图片URL（超星部分CDN图）无法匹配填充的问题：图片比对改用URL末段哈希，兼容有无扩展名
// @changelog    2. 图片匹配加固：短哈希仅精确比对防误选，http/https与查询串差异不再影响匹配
// @changelog    v5.3.3 更新内容：
// @changelog    1. 彻底修复多选题填充：新增字母答案(A/ABD)按选项序号直接映射，考试页与超星/智慧树作业页全覆盖
// @changelog    2. 后端多选答案改返回结构化数组，支持E及更多选项字母，修复5个及以上选项无法匹配的问题
// @changelog    v5.3.2 更新内容：
// @changelog    1. 彻底修复多选题答案拆分问题：不再依赖分隔符切割，改用子串匹配，答案含任何标点都能正确全选
// @changelog    v5.3.1 更新内容：
// @changelog    1. 修复多选题答案无分隔符(如ABCD)无法全选的问题
// @changelog    2. 修复图片选项匹配失败：改用文件名提取比较，解决URL被normalize清空导致无法匹配
// @changelog    3. 修复月卡用户答题时显示"包月权益生效"而非正确答案的问题
// @changelog    v5.3.0 更新内容：
// @changelog    1. 修复含图片题目 AI 无法识别的问题：答题时自动提取题目中的图片并转 base64 发送给 AI 模型
// @changelog    2. 后端同步优化：图片下载失败时自动跳过并提示，不再因无效图片链接导致 AI 报错
// @changelog    v5.2.9 更新内容：
// @changelog    1. 新增脚本自动检测更新功能，发现新版本顶部提示一键更新
// @changelog    2. 兼容 Tampermonkey / ScriptCat / Greasemonkey 三大脚本管理器
// @changelog    v5.2.8 更新内容：
// @changelog    1. 修复包月用户答题菜单答案显示"包月权益生效，本题不扣点"的问题，后端返回200但无答案时正确提示"未找到答案"
// @changelog    v5.2.7 更新内容：
// @changelog    1. 网页搜题未命中提示优化：后端返回 200 但无答案时，提示"未找到答案"而非"本地题库未命中"
// @changelog    v5.2.6 更新内容：
// @changelog    1. 网页搜题升级：搜题结果返回题库中所有相关题目与答案（多结果展示），与后台查询一致，解决只返回单条的问题
// @changelog    2. 网页搜题免费、登录后可用、每日限 30 次（由服务端统一控制）
// @changelog    v5.2.5 更新内容：
// @changelog    1. 优化 AI 答题超时处理：后端自动重试/切换模型耗时较长时，前端答题请求不再提前超时（120s→240s、180s→300s），重试成功后自动填充答案
// @changelog    v5.2.4 更新内容：
// @changelog    1. 账号登录移至标题栏下方常驻，切换任意页面Tab登录状态均可见
// @changelog    2. 视频倍速支持最高16倍，可在设置中自定义，设置后即时生效无需刷新页面
// @changelog    3. 首页新增"QQ频道"入口，一键加入腾讯频道
// @changelog    4. 最小化悬浮球及旋转光晕缩小，界面更精简
// @changelog    5. 修复视频倍速设置偶发失效问题
// @changelog    v5.2.3 更新内容：
// @changelog    1. 账号自动登录稳定性优化（仅 401/403 清除登录记忆，网络异常保留登录状态）
// @changelog    2. 登录 Token 有效期延长至 180 天，减少频繁重新登录
// @changelog    v5.2.2 更新内容：
// @changelog    1. 优化账号登录记忆：仅在 Token 真正失效时才要求重新登录，网络波动不再误清登录状态
// @changelog    2. 后端登录 Token 有效期延长至 180 天，减少频繁重新登录
// @changelog    v5.2.1 更新内容：
// @changelog    1. 新增江西开放大学继续教育平台(jxrtvu.com)域名支持
// @changelog    v5.2.0 更新内容：
// @changelog    1. 首页新增"推广返利"入口，一键跳转推广赚钱页面
// @changelog    2. 账号登录区移除推广按钮，精简界面
// @changelog    3. 推广返利说明动态读取后台配置（佣金比例/冷却天数/最低提现）
// @changelog    4. 后台推广数据统计新增已提现/待审核金额卡片
// @changelog    5. 提现申请列表新增今日/已通过/待审核金额合计
// @changelog    6. 收款信息美化：支付宝/微信双卡片布局，单图替换模式
// @changelog    7. 提现申请强制校验收款二维码，未上传不可提交
// @changelog    8. 修复admin页面推广返利模块渲染异常
// @icon         https://xs.openget.cn/static/icon.jpg
// @match        *://*.chaoxing.com/*
// @match        *://*.neauce.com/*
// @match        *://*.zhihuishu.com/*
// @match        *://*.edu.cn/*
// @match        *://*.jxrtvu.com/*
// @match        *://*.o-learn.cn/*
// @match        *://*.qingshuxuetang.com/*
// @match        *://*.web2.superchutou.com/*
// @match        *://*.yuketang.cn/*
// @match        *://*.mosoteach.cn/*
// @match        *://*.icve.com.cn/*
// @match        *://*.ouchn.cn/*
// @match        *://*.ouchn.edu.cn/*
// @match        *://*.icourse163.org/*
// @match        *://*.unipus.cn/*
// @match        *://*.xuetangx.com/*
// @match        *://*.ytccr.com/*
// @match        *://*.treewises.com/*
// @match        *://*.swufe-online.com/*
// @require      https://xs.openget.cn/libs/vue/3.4.31/vue.global.prod.js
// @require      https://xs.openget.cn/libs/vue-demi/0.14.7/index.iife.js
// @require      data:application/javascript,window.Vue%3DVue%3B
// @require      https://xs.openget.cn/libs/pinia/2.1.7/pinia.iife.min.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/dayjs.min.js
// @require      https://xs.openget.cn/libs/dompurify/3.1.6/purify.min.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/customParseFormat.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/weekday.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/localeData.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/weekOfYear.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/weekYear.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/advancedFormat.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/quarterOfYear.js
// @require      https://xs.openget.cn/libs/ant-design-vue/4.2.6/antd.min.js
// @require      https://xs.openget.cn/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://xs.openget.cn/libs/rxjs/7.8.1/rxjs.umd.min.js
// @require      https://xs.openget.cn/libs/marked/16.1.1/lib/marked.umd.min.js
// @resource     ttf   https://xs.openget.cn/libs/ttf/table.json
// @resource     ttf2  https://xs.openget.cn/libs/ttf2/table.json
// @connect      chaoxing.com
// @connect      zhihuishu.com
// @connect      xs.openget.cn
// @connect      *.o-learn.cn
// @connect      qingshuxuetang.com
// @connect      web2.superchutou.com
// @connect      *.webtrn.cn
// @connect      127.0.0.1
// @connect      localhost
// @grant        GM_getResourceText
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM.openInTab
// @grant        unsafeWindow
// @run-at       document-start
// @tag          自动学习
// @tag          AI答题
// @tag          超星学习通
// @tag          智慧树
// @tag          网课
// ==/UserScript==

(e=>{globalThis.__abcCSS=e})(' .theme-light{--t-bg:#f5f6f8;--t-surface:#fff;--t-surface2:#f0f2f5;--t-border:#e2e5ea;--t-border2:#d1d5db;--t-text:#1a1a2e;--t-text2:#4b5563;--t-text3:#6b7280;--t-primary:#2563eb;--t-primary-bg:#eff6ff;--t-primary-border:#bfdbfe;--t-primary-2:#1d4ed8;--t-accent:#1d4ed8;--t-success:#16a34a;--t-warning:#b45309;--t-danger:#dc2626;--t-info:#0891b2;--t-pink:#db2777;--t-shadow:rgba(0,0,0,.08);--t-shadow2:rgba(0,0,0,.04)}.theme-dark{--t-bg:#0d1117;--t-surface:#161b22;--t-surface2:#1c2330;--t-border:#30363d;--t-border2:#484f58;--t-text:#e6edf3;--t-text2:#9198a1;--t-text3:#6e7681;--t-primary:#3b82f6;--t-primary-bg:rgba(59,130,246,.1);--t-primary-border:rgba(59,130,246,.3);--t-primary-2:#2563eb;--t-accent:#2563eb;--t-success:#3fb950;--t-warning:#d29922;--t-danger:#f85149;--t-info:#22d3ee;--t-pink:#f472b6;--t-shadow:rgba(0,0,0,.3);--t-shadow2:rgba(0,0,0,.15)}.theme-graphite{--t-bg:#1c1c1e;--t-surface:#2c2c2e;--t-surface2:#3a3a3c;--t-border:#3d3d41;--t-border2:#545458;--t-text:#f2f2f7;--t-text2:#a1a1aa;--t-text3:#98989f;--t-primary:#0a84ff;--t-primary-bg:rgba(10,132,255,.16);--t-primary-border:rgba(10,132,255,.4);--t-primary-2:#0060df;--t-accent:#0060df;--t-success:#30d158;--t-warning:#ff9f0a;--t-danger:#ff453a;--t-info:#64d2ff;--t-pink:#ff375f;--t-shadow:rgba(0,0,0,.5);--t-shadow2:rgba(0,0,0,.3)}.theme-mist{--t-bg:#eef2f8;--t-surface:#ffffff;--t-surface2:#e7edf6;--t-border:#dbe3ee;--t-border2:#c7d2e0;--t-text:#1d2733;--t-text2:#4d5a6a;--t-text3:#64707f;--t-primary:#2f6fd0;--t-primary-bg:#e9f0fc;--t-primary-border:#c4daf6;--t-primary-2:#2459ab;--t-accent:#2459ab;--t-success:#1f9d55;--t-warning:#b26a00;--t-danger:#d02f2f;--t-info:#0f7f9e;--t-pink:#c73d7a;--t-shadow:rgba(23,42,71,.12);--t-shadow2:rgba(23,42,71,.06)}.theme-sand{--t-bg:#f6f2ea;--t-surface:#fffdf9;--t-surface2:#f2ebe0;--t-border:#e7ded0;--t-border2:#d8ccb9;--t-text:#2a251e;--t-text2:#5a5348;--t-text3:#7c7264;--t-primary:#a4632c;--t-primary-bg:#f7ede2;--t-primary-border:#e6cfb5;--t-primary-2:#8a4f1f;--t-accent:#8a4f1f;--t-success:#3f7d4e;--t-warning:#a86a00;--t-danger:#b23a2f;--t-info:#2f7f8a;--t-pink:#b04a6d;--t-shadow:rgba(74,58,36,.14);--t-shadow2:rgba(74,58,36,.07)}.theme-glass{--t-bg:rgba(248,249,251,.55);--t-surface:rgba(255,255,255,.55);--t-surface2:rgba(243,245,249,.6);--t-border:rgba(255,255,255,.6);--t-border2:rgba(0,0,0,.1);--t-text:#1d1d1f;--t-text2:#4b4b52;--t-text3:#6e6e75;--t-primary:#0071e3;--t-primary-bg:rgba(0,113,227,.1);--t-primary-border:rgba(0,113,227,.28);--t-primary-2:#0058b8;--t-accent:#0058b8;--t-success:#248a3d;--t-warning:#b45f00;--t-danger:#d70015;--t-info:#0a7ea4;--t-pink:#d6336c;--t-shadow:rgba(0,0,0,.16);--t-shadow2:rgba(0,0,0,.06)}.main-box.theme-graphite{border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06)}.main-box.theme-mist{border-radius:12px;box-shadow:0 14px 38px rgba(23,42,71,.12),0 0 0 1px rgba(255,255,255,.9)}.main-box.theme-sand{border-radius:12px;box-shadow:0 14px 38px rgba(74,58,36,.16),0 0 0 1px rgba(255,253,247,.9)}.main-box.theme-glass{position:relative;z-index:1;background:radial-gradient(130% 90% at 0% 0%,rgba(255,255,255,.6),rgba(255,255,255,0) 62%),linear-gradient(165deg,rgba(252,254,255,.52),rgba(236,243,252,.38));-webkit-backdrop-filter:blur(34px) saturate(190%);backdrop-filter:blur(34px) saturate(190%);border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.55),inset 0 1px 0 rgba(255,255,255,.85)}.main-box.theme-glass:hover{box-shadow:0 24px 60px rgba(0,0,0,.24),0 0 0 1px rgba(255,255,255,.7),inset 0 1px 0 rgba(255,255,255,.9)}.main-box.theme-glass .box-header{background:rgba(255,255,255,.34);border-bottom:1px solid rgba(255,255,255,.6);-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%)}.main-box.theme-glass .login-bar{background:rgba(255,255,255,.32)!important;border-bottom-color:rgba(255,255,255,.6)!important}.main-box.theme-glass .ant-tabs{background:rgba(238,244,255,.44)!important;border-right:1px solid rgba(255,255,255,.55)!important;-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%)}.main-box.theme-glass .ant-tabs-tab{border-radius:8px!important}.main-box.theme-glass .ant-tabs-tab-active{background:rgba(0,113,227,.12)!important}.main-box.theme-glass .ant-tabs-tab-active:after{display:none}.theme-menu{position:absolute;top:38px;right:8px;z-index:100002;min-width:140px;padding:6px;border-radius:12px;background:var(--t-surface);border:1px solid var(--t-border);box-shadow:0 14px 36px var(--t-shadow);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%)}.theme-menu-title{padding:4px 10px 6px;font-size:11px;color:var(--t-text3);letter-spacing:.4px}.theme-menu-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;font-size:12px;color:var(--t-text);cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}.theme-menu-item:hover{background:var(--t-primary-bg);color:var(--t-primary)}.theme-menu-item.active{background:var(--t-primary-bg);color:var(--t-primary);font-weight:600}.theme-menu-item .dot{width:12px;height:12px;border-radius:50%;flex:none;border:1px solid var(--t-border2)}.theme-menu-item .dot-dark{background:#0d1117;border-color:rgba(255,255,255,.35)}.theme-menu-item .dot-light{background:#fff;border-color:rgba(0,0,0,.14)}.theme-menu-item .dot-glass{background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(170,200,240,.85))}.theme-menu-item .dot-graphite{background:#3c3c3e;border-color:#9a9aa0}.theme-menu-item .dot-mist{background:#dbe6f4;border-color:#c7d2e0}.theme-menu-item .dot-sand{background:#f3e7d3;border-color:#d8ccb9}.theme-glass .theme-menu{background:rgba(255,255,255,.72);border-color:rgba(255,255,255,.7);box-shadow:0 16px 40px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.9)}.main-box.theme-glass.theme-glass-flat{background:linear-gradient(165deg,#f7faff,#e4edfa);-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:0 16px 42px rgba(28,58,110,.18),0 0 0 1px rgba(255,255,255,.9),inset 0 1px 0 #fff}.main-box.theme-glass.theme-glass-flat .box-header{background:#eaf1fb;border-bottom-color:#dbe6f4}.main-box.theme-glass.theme-glass-flat .login-bar{background:#f0f5fd!important;border-bottom-color:#dbe6f4!important}.main-box.theme-glass.theme-glass-flat .ant-tabs{background:#e3ecf9!important;border-right-color:#dbe6f4!important;-webkit-backdrop-filter:none;backdrop-filter:none}.theme-glass.theme-glass-flat .theme-menu{background:#f8fbff;border-color:#e3ecf9}.glass-aura{position:absolute;inset:-10px;z-index:0;border-radius:22px;pointer-events:none;opacity:.85;filter:blur(26px);background:radial-gradient(56% 50% at 14% 6%,rgba(122,184,255,.4),rgba(122,184,255,0) 70%),radial-gradient(44% 42% at 92% 20%,rgba(168,150,255,.26),rgba(168,150,255,0) 72%),radial-gradient(58% 54% at 78% 98%,rgba(120,225,210,.3),rgba(120,225,210,0) 74%);animation:glassAuraDrift 18s ease-in-out infinite alternate}@keyframes glassAuraDrift{0%{transform:translate3d(0,0,0) scale(1)}100%{transform:translate3d(0,-8px,0) scale(1.05)}}.theme-glass-flat .glass-aura{display:none}.log-wrap{font:13px "Segoe UI",system-ui,-apple-system,sans-serif}.log-wrap{display:flex;flex-direction:column;height:100%}.log-wrap .console{flex:1;min-height:200px;max-height:calc(100vh - 120px);width:100%;box-sizing:border-box;overflow-y:scroll;background:var(--t-surface2);padding:10px 12px;color:var(--t-text2);font-size:12px;border-radius:8px;border:1px solid var(--t-border)}.log-wrap .console>div{padding:3px 0;line-height:1.6}.log-wrap .console>div>span:first-child{color:var(--t-text3);font-variant-numeric:tabular-nums}.log-wrap .console>div>span:nth-child(2){font-size:11px;letter-spacing:.2px}.log-wrap .console div span{margin:0 3px}.log-wrap .console div span .module{background:var(--t-primary);color:#fff;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600}.log-wrap .console .log{color:var(--t-text2)}.log-wrap .console .warning{color:var(--t-warning);font-weight:600}.home-wrap[data-v-137ea562]{font:14px "Segoe UI",system-ui,-apple-system,sans-serif;color:var(--t-text)}.home-wrap a{color:var(--t-primary);text-decoration:none}.home-wrap a:hover{text-decoration:underline}.home-wrap ol li{line-height:26px;list-style-type:decimal;list-style-position:inside;color:var(--t-text2)}.home-wrap .tips ul li span{color:var(--t-warning)}.home-wrap .hero{padding:16px 14px;margin:8px;background:linear-gradient(135deg,var(--t-primary),var(--t-primary-2));border-radius:8px;color:#fff;text-align:center}.home-wrap .hero .hero-title{font-size:18px;font-weight:700;margin-bottom:4px}.home-wrap .hero .hero-sub{font-size:12px;opacity:.85}.home-wrap .home-section{margin:8px;padding:12px 14px;background:var(--t-surface);border:1px solid var(--t-border);border-radius:8px}.home-wrap .home-section .section-title{font-size:13px;font-weight:700;color:var(--t-text);margin-bottom:8px;display:flex;align-items:center;gap:4px}.home-wrap .home-section ul{list-style:none;padding:0;margin:0}.home-wrap .home-section ul li{list-style:none;padding:4px 0;color:var(--t-text2);font-size:12px;line-height:1.6}.collapsible-section{cursor:pointer;user-select:none;transition:background .15s}.collapsible-section:hover{background:var(--t-surface2)}.collapsible-section .section-title{justify-content:space-between;gap:8px;margin-bottom:0}.collapse-icon{font-size:14px;color:var(--t-text3);font-weight:700;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:var(--t-surface2);transition:all .15s}.collapsible-section:hover .collapse-icon{background:var(--t-primary-bg);color:var(--t-primary)}.home-card-btn{display:block;margin-top:8px;padding:10px 12px;background:linear-gradient(135deg,var(--t-primary),var(--t-primary-2));border-radius:8px;color:#fff!important;text-align:center;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s,transform .15s}.home-card-btn:hover{opacity:.9;transform:translateY(-1px);color:#fff!important}.home-wrap .login-box{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px}.home-wrap .login-box input{height:30px;width:140px;padding:0 8px;border:1px solid var(--t-border2);border-radius:4px;background:var(--t-surface);color:var(--t-text);font-size:12px;outline:none}.home-wrap .login-box input:focus{border-color:var(--t-primary)}.home-wrap .login-box button{height:30px;padding:0 12px;border:none;border-radius:4px;font-size:12px;cursor:pointer;font-weight:500;transition:opacity .15s}.home-wrap .login-box button:hover{opacity:.85}.home-wrap .login-box .btn-primary{background:var(--t-primary);color:#fff}.home-wrap .login-box .btn-ghost{background:var(--t-surface2);color:var(--t-text2);border:1px solid var(--t-border2)}.home-wrap .login-box .btn-outline{background:transparent;color:var(--t-primary);border:1px solid var(--t-primary)}.home-wrap .login-meta{display:flex;gap:8px;align-items:center;margin-top:6px;color:var(--t-text3);font-size:11px;flex-wrap:wrap}.home-wrap .login-msg{margin-top:6px;font-size:12px}.answer-wrap .search-info{-webkit-user-select:none;user-select:none;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;border:1px solid var(--t-border2);margin-right:4px;font-weight:600;font-size:11px;background:var(--t-surface2);color:var(--t-text3);flex-shrink:0}.answer-wrap .search-info.default{box-shadow:none}.answer-wrap .search-info.searching{box-shadow:0 0 6px 1px var(--t-primary-border);border-color:var(--t-primary);color:var(--t-primary);animation:pulse 1.2s ease infinite}.answer-wrap .search-info.success{color:#fff;border:0;background:var(--t-success)}.answer-wrap .search-info.ai-success{color:#fff;border:0;background:var(--t-accent)}.answer-wrap .search-info.warning{color:var(--t-warning);border:1px solid var(--t-warning)}.answer-wrap .answer-tips{font-size:12px;color:var(--t-text3)}.answer-wrap .answer-tips span{margin-right:4px}.answer-wrap .answer-tips .box-tips{display:flex;align-items:center}.answer-wrap .answer-tips .box-tips div{margin:0 4px 0 0!important}.answer-wrap .answer-tips .box-tips span{margin-right:8px}.answer-wrap .answer-list{flex-wrap:wrap;color:var(--t-text);display:flex}.answer-wrap .answer-list .search-info{cursor:pointer!important}.answer-wrap .answer-list div{margin:0 8px 8px 0!important;cursor:pointer!important}.answer-wrap .answer-detail{position:relative;max-height:200px;overflow-y:scroll;scroll-behavior:smooth}.answer-wrap .answer-detail .answer-item{margin-bottom:8px}.answer-wrap .answer-detail .answer-content{margin-top:4px;padding:9px 11px;border-radius:6px;background:var(--t-surface2);font-weight:600;color:var(--t-text);border-left:2px solid var(--t-primary);font-size:13px}.answer-wrap .answer-detail .answer-content .module{padding:1px 4px;border-radius:3px;color:var(--t-text3);border:1px solid var(--t-border2);font-size:10px}.ant-tooltip,.ant-select-dropdown{z-index:99999!important}.config-wrap{min-width:420px!important;width:420px!important;max-width:480px;color:var(--t-text);font-size:13px;padding:10px 16px;box-sizing:border-box}.config-wrap .config{margin-bottom:14px;display:flex;align-items:flex-start;gap:12px;min-height:32px}.config-wrap .config .config-name{display:flex;align-items:flex-start;width:120px;flex-shrink:0;font-size:12px;color:var(--t-text2);line-height:1.5;padding-top:7px}.config-wrap .config .config-input{flex:1;display:flex;align-items:center;justify-content:flex-start;gap:6px;min-width:0;padding-top:2px}.config-wrap .config .config-input .ant-select{width:100%!important;max-width:260px}.config-wrap .config .config-input .ant-input{width:100%!important;max-width:260px}.config-wrap .config .config-input .ant-input-number{width:100px!important}.config-wrap .config .config-input .ant-slider{flex:1;max-width:180px!important;margin:0 10px 0 0}.config-wrap .config-input .ant-input,.config-wrap .config-input .ant-input-affix-wrapper,.config-wrap .config-input .ant-input-number,.config-wrap .config-input .ant-select-selector{height:30px;box-sizing:border-box}.config-wrap .config-input .ant-input-number-input{height:28px}.config-wrap .buy-btn{background:var(--t-primary);padding:5px 12px;border-radius:4px;height:28px;color:#fff;cursor:pointer;font-weight:600;border:none;font-size:12px;white-space:nowrap}.config-wrap .buy-btn a{color:#fff}.config-wrap .switch-item{display:inline-flex!important;width:calc(50% - 6px)!important;margin-right:12px;margin-bottom:12px!important;vertical-align:top;box-sizing:border-box;gap:8px}.config-wrap .switch-item .config-name{flex:1;width:auto!important;padding-top:0;line-height:1.5;word-break:break-word}.config-wrap .switch-item .config-input{width:auto!important;flex:none;padding-top:0}.config-wrap .switch-item .ant-switch{margin-top:0!important}.config-wrap .switch-item:nth-of-type(2n){margin-right:0}.ant-message{z-index:999999!important}.online-search-wrap{color:var(--t-text);width:420px;box-sizing:border-box}.online-search-wrap .config{padding:8px 10px 4px;display:flex}.online-search-wrap .config .config-name{width:150px}.online-search-wrap .config .config-input{display:flex;justify-content:right;flex:1}.online-search-wrap .searth-input-wrap{padding:8px 10px 4px;display:flex}.online-search-wrap .searth-input-wrap .title{padding-top:5px}.online-search-wrap .searth-input-wrap .searth-input{margin-left:16px;flex:1}.online-search-wrap .search-btn{padding-right:10px;display:flex;justify-content:right}.online-search-wrap .result-list{margin-top:8px;max-height:calc(100vh - 200px);overflow:auto}.online-search-wrap .result-list .result-item{margin-bottom:10px}.online-search-wrap .result-list .result-item em{font-weight:600;color:var(--t-warning)}.online-search-wrap .result-list .result-answer{margin-top:4px;padding:9px 11px;border-radius:6px;background:var(--t-surface2);font-weight:600;color:var(--t-text);border-left:2px solid var(--t-primary)}div{margin:0}.ai-wrapper{width:420px}.ai-message-role-avatar{margin:0}.ai-message-content{margin:0;padding:9px 11px;border-radius:8px;background:var(--t-surface2);font-size:14px;-webkit-user-select:text;user-select:text;word-break:break-word;border:1px solid var(--t-border);position:relative;transition:all .2s ease}.ai-message-content pre{white-space:pre-wrap;background:var(--t-bg);color:var(--t-text);padding:10px;border-radius:4px;border:1px solid var(--t-border);font-size:13px}.ai-message-container{display:flex;flex-direction:column;align-items:flex-start}.ai-message-container.user-message{align-items:flex-end}.ai-message-list{height:calc(100vh - 160px);max-height:360px;min-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}.ai-message-item{width:100%}.user-avatar{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-primary-bg);margin-bottom:4px;font-size:13px}.ai-input-wrapper{padding:8px;margin-top:8px;border-radius:6px;border:1px solid var(--t-border);display:flex;align-items:center;justify-content:center;background:var(--t-surface)}.ai-input-wrapper textarea{flex:1;height:46px;border:none;margin-right:8px;background:transparent;color:var(--t-text);resize:none;outline:none}.send-message-btn{display:flex;align-items:center;justify-content:center;height:34px;border-radius:4px;border:none;padding:0 12px;background:var(--t-primary);color:#fff;cursor:pointer!important;gap:4px;font-weight:600;font-size:13px}.send-message-btn:hover{opacity:.85}.loading-container{display:flex;align-items:center;justify-content:center;gap:4px}.record-wrap{padding-bottom:6px}.record-tip{display:flex;align-items:center;justify-content:space-between;padding:0 8px 6px;color:var(--t-text3);font-size:11px}.record-filter{display:flex;gap:6px;padding:0 8px 8px;flex-wrap:wrap}.record-search-wrap{padding:0 8px 8px}.record-search{display:block;width:100%;box-sizing:border-box;padding:6px 10px;font-size:12px;color:var(--t-text);background:var(--t-surface);border:1px solid var(--t-border2);border-radius:6px;outline:none;transition:border-color .15s,box-shadow .15s}.record-search::placeholder{color:var(--t-text3)}.record-search:focus{border-color:var(--t-primary);box-shadow:0 0 0 2px var(--t-primary-bg)}.filter-btn{padding:4px 10px;color:var(--t-text2);background:var(--t-surface2);border:1px solid var(--t-border);border-radius:6px;cursor:pointer;transition:all .15s ease;font-size:11px}.filter-btn:hover{color:var(--t-primary);border-color:var(--t-primary-border);background:var(--t-primary-bg)}.filter-btn.active{color:var(--t-primary);border-color:var(--t-primary);background:var(--t-primary-bg)}.record-list{display:flex;flex-direction:column;gap:8px;padding:0 8px 6px;max-height:min(460px,calc(100vh - 240px));overflow-y:auto}.clear-btn{color:var(--t-text2);border-color:var(--t-border);background:var(--t-surface2);border-radius:3px;font-size:12px}.clear-btn:hover,.clear-btn:focus{color:var(--t-danger);border-color:var(--t-danger);background:rgba(220,38,38,.06)}.record-item{padding:9px 11px;border:1px solid var(--t-border);border-radius:8px;background:var(--t-surface);transition:border-color .15s}.record-item:hover{border-color:var(--t-border2)}.record-row{display:flex;align-items:flex-start;line-height:20px;font-size:12px}.record-label{width:60px;flex-shrink:0;color:var(--t-primary);font-weight:600;font-size:11px}.record-value{flex:1;color:var(--t-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tab-content{flex:1!important;min-width:420px!important;width:420px!important;min-height:320px;max-width:480px;max-height:min(640px,calc(100vh - 96px));overflow-y:auto;padding:8px 12px;box-sizing:border-box}.ant-tabs-nav-operations{display:none!important}.box-content{min-width:300px;display:flex!important;flex-direction:row!important;gap:0!important}.separator{display:flex;align-items:center;padding:16px 0 10px;font-size:13px;font-weight:700;color:var(--t-text);border-top:1px solid var(--t-border);margin-top:6px}.separator:first-child{border-top:none;margin-top:0}.tips{padding:10px 12px;background:rgba(217,119,6,.06);border:1px solid rgba(217,119,6,.15);border-radius:8px;width:-webkit-fill-available;margin:4px 0 14px;line-height:22px;letter-spacing:.2px;color:var(--t-warning);font-size:12px;box-sizing:border-box}.theme-dark .tips,.theme-graphite .tips{background:rgba(255,159,10,.1);border-color:rgba(255,159,10,.26)}.theme-glass .tips{background:rgba(180,95,0,.07);border-color:rgba(180,95,0,.2)}.tips button{background:var(--t-warning)!important;border-color:var(--t-warning)!important;color:#fff!important}.tips a{color:var(--t-primary);text-decoration:underline}.backend-dropdown-overlay{z-index:100001!important}.ant-dropdown-menu{background:var(--t-surface)!important;border:1px solid var(--t-border)!important;border-radius:4px!important;box-shadow:0 4px 16px var(--t-shadow)!important;padding:4px 0!important}.ant-dropdown-menu-item{color:var(--t-text)!important;font-size:12px!important;padding:6px 12px!important}.ant-dropdown-menu-item:hover{background:var(--t-primary-bg)!important;color:var(--t-primary)!important}.ant-dropdown-menu-item-divider{background-color:var(--t-border)!important}.main-wrap{position:fixed;top:0;z-index:99999!important;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;pointer-events:auto}.message-container{margin-bottom:4px;position:absolute;bottom:100%;left:50%;width:100%;transform:translate(-50%);min-width:280px}.main-box{padding:0;font:13px "Segoe UI",system-ui,-apple-system,sans-serif;color:var(--t-text);background:var(--t-bg);box-shadow:0 8px 32px var(--t-shadow),0 0 0 1px var(--t-border);border-radius:8px;letter-spacing:0;overflow:hidden;transition:box-shadow .2s;display:flex;flex-direction:column;max-height:calc(100vh - 60px)}.main-box:hover{box-shadow:0 12px 32px var(--t-shadow),0 0 0 1px var(--t-border2)}.main-box .box-header{display:flex;justify-content:space-between;align-items:center;height:36px;cursor:move;padding:0 10px;background:var(--t-surface);border-bottom:1px solid var(--t-border);flex-shrink:0}.main-box .box-header div{margin:0}.main-box .box-header .header-left{display:flex;align-items:center;gap:6px}.main-box .box-header .script-info{-webkit-user-select:none!important;user-select:none!important;font-weight:700;color:var(--t-primary);letter-spacing:0;font-size:13px;display:flex;align-items:center;gap:4px}.main-box .box-header .script-info:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--t-success);box-shadow:0 0 4px var(--t-success);margin-right:2px}.main-box .box-header .backend-entry{text-decoration:none;color:var(--t-text2);padding:3px 8px;border-radius:4px;cursor:pointer;-webkit-user-select:none!important;user-select:none!important;transition:all .15s ease;font-size:11px;background:var(--t-surface2);border:1px solid var(--t-border)}.main-box .box-header .backend-entry.active,.main-box .box-header .backend-entry:hover{color:var(--t-primary);background:var(--t-primary-bg);border-color:var(--t-primary-border)}.main-box .box-header .theme-toggle{width:28px;height:28px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-surface2);color:var(--t-text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s ease}.main-box .box-header .theme-toggle:hover{color:var(--t-primary);border-color:var(--t-primary-border);background:var(--t-primary-bg)}.main-box .box-header .shrink-btn{width:28px;height:28px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-surface2);color:var(--t-text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s ease}.main-box .box-header .shrink-btn:hover{color:var(--t-danger);border-color:var(--t-danger)}.main-box .box-content{display:flex;flex:1;overflow:hidden;min-height:0}.main-box .box-content.mini{display:none}.mini-ball{position:fixed;display:flex;align-items:center;gap:13px;height:64px;padding:0 30px 0 12px;border-radius:32px;background:linear-gradient(135deg,#0d1117 0%,#161b22 20%,#1a1a2e 40%,#16325c 60%,#1a1a2e 80%,#0d1117 100%);background-size:400% 400%;box-shadow:0 10px 24px rgba(0,0,0,.55),0 0 0 1.5px rgba(59,130,246,.2),0 0 10px rgba(59,130,246,.15),0 0 18px rgba(37,99,235,.09),0 0 26px rgba(59,130,246,.06),inset 0 1px 2px rgba(255,255,255,.08);cursor:pointer;z-index:9999999;user-select:none;transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease;animation:miniBallGradient 5s ease infinite,miniBallGlow 2.5s ease-in-out infinite}.mini-ball:hover{transform:scale(1.1) translateY(-4px);box-shadow:0 16px 44px rgba(0,0,0,.65),0 0 0 3px rgba(59,130,246,.35),0 0 20px rgba(59,130,246,.25),0 0 40px rgba(37,99,235,.2),0 0 64px rgba(59,130,246,.15),inset 0 1px 2px rgba(255,255,255,.12)}.mini-ball:active{transform:scale(.94)}.mini-ball-icon{width:48px;height:48px;border-radius:50%;background:rgba(59,130,246,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:800;letter-spacing:1px;backdrop-filter:blur(10px);box-shadow:inset 0 1px 2px rgba(255,255,255,.15),0 0 18px rgba(59,130,246,.15);animation:miniBallIconPulse 2s ease-in-out infinite;gap:1px}.mini-ball-count{font-size:8px;font-weight:700;color:#60a5fa;text-shadow:0 0 6px rgba(167,139,250,.5);line-height:1}.mini-ball:hover .mini-ball-icon{animation:miniBallIconWiggle .5s ease}.mini-ball-body{display:flex;flex-direction:column;align-items:flex-start;gap:3px}.mini-ball-text{color:#fff;font-size:15px;font-weight:800;white-space:nowrap;text-shadow:0 1px 4px rgba(0,0,0,.3);animation:miniBallTextSlide .5s cubic-bezier(.22,1,.36,1)}.mini-ball-sub{color:rgba(255,255,255,.88);font-size:11px;font-weight:500;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.25);animation:miniBallTextSlide .5s .1s cubic-bezier(.22,1,.36,1) both}.mini-ball-shine{position:absolute;inset:0;border-radius:32px;overflow:hidden;pointer-events:none}.mini-ball-shine:before{content:"";position:absolute;top:0;left:-100%;width:80%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transform:skewX(-20deg);animation:miniBallShine 3.5s ease-in-out infinite}.mini-ball-glow{position:absolute;inset:12px;border-radius:20px;background:linear-gradient(135deg,#1a1a2e,#16325c,#1e4f8f,#2f6fb5);filter:blur(5px);opacity:.1;z-index:-1;animation:miniBallGlowRotate 10s linear infinite}.mini-ball-orbits{position:absolute;inset:0;border-radius:32px;overflow:hidden;pointer-events:none}.mini-ball-orbits i{position:absolute;width:6px;height:6px;border-radius:50%;background:#60a5fa;box-shadow:0 0 10px #60a5fa;opacity:.65}.mini-ball-orbits i:first-child{top:10px;right:20px;animation:miniBallOrbit1 2.5s linear infinite}.mini-ball-orbits i:last-child{bottom:10px;left:24px;animation:miniBallOrbit2 3s linear infinite}@keyframes miniBallGradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@keyframes miniBallGlow{0%,100%{box-shadow:0 9px 22px rgba(0,0,0,.45),0 0 0 1.5px rgba(59,130,246,.18),0 0 10px rgba(59,130,246,.12),0 0 18px rgba(37,99,235,.09),0 0 26px rgba(59,130,246,.06),inset 0 1px 2px rgba(255,255,255,.06)}50%{box-shadow:0 10px 26px rgba(0,0,0,.5),0 0 0 1.5px rgba(59,130,246,.2),0 0 14px rgba(59,130,246,.16),0 0 24px rgba(59,130,246,.1),0 0 32px rgba(37,99,235,.08),inset 0 1px 2px rgba(255,255,255,.08)}}@keyframes miniBallGlowRotate{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes miniBallIconPulse{0%,100%{box-shadow:inset 0 1px 2px rgba(255,255,255,.15),0 0 0 0 rgba(59,130,246,.2)}50%{box-shadow:inset 0 1px 2px rgba(255,255,255,.15),0 0 0 14px rgba(59,130,246,0)}}@keyframes miniBallIconWiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}@keyframes miniBallTextSlide{0%{opacity:0;transform:translateX(-14px)}100%{opacity:1;transform:translateX(0)}}@keyframes miniBallShine{0%,100%{left:-100%}50%,70%{left:150%}}@keyframes miniBallOrbit1{0%{transform:translate(0,0) scale(1);opacity:.6}50%{transform:translate(-18px,14px) scale(.6);opacity:.2}100%{transform:translate(0,0) scale(1);opacity:.6}}@keyframes miniBallOrbit2{0%{transform:translate(0,0) scale(.6);opacity:.2}50%{transform:translate(14px,-12px) scale(1);opacity:.6}100%{transform:translate(0,0) scale(.6);opacity:.2}}.ant-btn{border-radius:6px!important;font-size:12px!important;transition:background-color .15s ease,border-color .15s ease,opacity .15s ease}.ant-btn-primary{background:var(--t-primary)!important;border-color:var(--t-primary)!important}.ant-btn-primary:hover{opacity:.85!important}.ant-input,.ant-input-affix-wrapper{background:var(--t-surface)!important;border-color:var(--t-border2)!important;border-radius:6px!important;color:var(--t-text)!important;font-size:12px!important}.ant-input:focus,.ant-input-affix-wrapper-focused{border-color:var(--t-primary)!important;box-shadow:0 0 0 2px var(--t-primary-border)!important}.ant-input:hover,.ant-input-affix-wrapper:hover{border-color:var(--t-border2)!important}.ant-input-number{background:var(--t-surface)!important;border-color:var(--t-border2)!important;border-radius:4px!important;color:var(--t-text)!important;font-size:12px!important}.ant-input-number-input{color:var(--t-text)!important;background:transparent!important}.ant-input-number-focused{border-color:var(--t-primary)!important;box-shadow:0 0 0 2px var(--t-primary-border)!important}.ant-input-number-handler-wrap{background:var(--t-surface2)!important;border-left-color:var(--t-border)!important}.ant-input-number-handler span{color:var(--t-text2)!important}.ant-select-selector{background:var(--t-surface)!important;border-color:var(--t-border2)!important;border-radius:6px!important;color:var(--t-text)!important;font-size:12px!important;min-height:30px!important}.config-wrap .ant-select{width:100%!important;max-width:220px}.ant-select-selection-item{color:var(--t-text)!important}.ant-select-arrow{color:var(--t-text3)!important}.ant-switch-checked{background:var(--t-primary)!important}.config-wrap .ant-switch{margin-top:2px}.ant-card{background:var(--t-surface)!important;border-color:var(--t-border)!important;border-radius:6px!important;color:var(--t-text)!important;font-size:12px!important}.ant-modal-content{background:var(--t-surface)!important;border:1px solid var(--t-border)!important;border-radius:6px!important}.ant-modal-header{background:var(--t-surface)!important;border-bottom:1px solid var(--t-border)!important}.ant-modal-title{color:var(--t-text)!important;font-size:14px!important}.ant-modal-close-icon{color:var(--t-text3)!important}.ant-modal-body{color:var(--t-text)!important}.ant-checkbox-checked .ant-checkbox-inner{background:var(--t-primary)!important;border-color:var(--t-primary)!important}.ant-radio-checked .ant-radio-inner{border-color:var(--t-primary)!important}.ant-radio-inner:after{background:var(--t-primary)!important}.ant-message-notice-content{background:var(--t-surface)!important;border:1px solid var(--t-border)!important;border-radius:4px!important;box-shadow:0 4px 16px var(--t-shadow)!important;color:var(--t-text)!important}.ant-tooltip-inner{background:var(--t-surface)!important;border:1px solid var(--t-border)!important;border-radius:3px!important;font-size:11px!important;color:var(--t-text)!important}.ant-alert{border-radius:6px!important;font-size:12px!important;margin-bottom:12px!important;padding:10px 12px!important}.ant-alert-message{color:var(--t-text)!important;line-height:1.8!important}.ant-alert .ant-btn-primary{background:var(--t-warning)!important;border-color:var(--t-warning)!important}.ant-tabs{display:flex!important;flex-direction:column!important;width:80px!important;flex-shrink:0;border-right:1px solid var(--t-border)!important;background:var(--t-surface)!important;margin:0!important;height:auto!important}.ant-tabs-nav{margin:0!important;width:80px!important;border:none!important}.ant-tabs-nav::before{border:none!important}.ant-tabs-nav-wrap{width:80px!important}.ant-tabs-nav-list{flex-direction:column!important;width:80px!important;gap:0!important}.ant-tabs-tab{padding:10px 4px!important;margin:0!important;justify-content:center!important;width:80px!important;font-size:12px!important;border:none!important;background:transparent!important;border-radius:0!important}.ant-tabs-tab .ant-tabs-tab-btn{font-size:12px!important;text-align:center!important;padding:0!important;color:var(--t-text)!important}.ant-tabs-tab:hover{background:var(--t-primary-bg)!important}.ant-tabs-tab-active{background:var(--t-primary-bg)!important;position:relative}.ant-tabs-tab-active:after{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--t-primary)}.ant-tabs-tab-active .ant-tabs-tab-btn{color:var(--t-primary)!important;font-weight:600!important}.ant-tabs-ink-bar{display:none!important}.ant-tabs-content-holder{display:none!important}.ant-tabs-content{display:none!important}.ant-tabs-top>.ant-tabs-nav::before{border:none!important}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes floatPulse{0%,100%{box-shadow:0 4px 16px var(--t-shadow),0 0 0 1px rgba(255,255,255,.1)}50%{box-shadow:0 4px 24px var(--t-shadow),0 0 0 3px var(--t-primary-border)}}@keyframes floatRing{0%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}}.main-box ::-webkit-scrollbar{width:6px;height:6px}.main-box ::-webkit-scrollbar-thumb{background:var(--t-border2);border-radius:3px}.main-box ::-webkit-scrollbar-thumb:hover{background:var(--t-text3)}.main-box ::-webkit-scrollbar-track{background:transparent}.main-box .console::-webkit-scrollbar{width:6px}.main-box button:focus-visible,.main-box [role=button]:focus-visible,.main-box a:focus-visible,.main-box input:focus-visible,.main-box textarea:focus-visible{outline:2px solid var(--t-primary);outline-offset:2px}@media (prefers-reduced-motion:reduce){.mini-ball,.mini-ball-icon,.mini-ball-text,.mini-ball-sub,.mini-ball-shine,.mini-ball-glow,.glass-aura,.answer-wrap .search-info.searching{animation:none!important}.main-box *,.mini-ball *{transition-duration:.01ms!important}}@media (max-width:560px){.main-box{max-width:calc(100vw - 12px)}.tab-content{min-width:0!important;width:auto!important;padding:8px!important}.config-wrap{min-width:0!important;width:auto!important;padding:6px 8px 6px 2px!important}.config-wrap .config{gap:8px;margin-bottom:12px}.config-wrap .config .config-name{width:74px!important;font-size:11px!important}.config-wrap .config .config-input{min-width:0}.config-wrap .config .config-input .ant-select,.config-wrap .config .config-input .ant-input{max-width:none!important}.config-wrap .config .config-input .ant-slider{max-width:none!important}.login-bar input{font-size:12px!important}.ant-tabs,.ant-tabs-nav,.ant-tabs-nav-wrap,.ant-tabs-nav-list{width:66px!important}.ant-tabs-tab{width:66px!important;padding:10px 2px!important}.ant-tabs-tab .ant-tabs-tab-btn{font-size:11px!important}} ');

(function (vue, Antd, pinia, marked, rxjs, md5, DOMPurify) {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  function bound01(n, max) {
    if (isOnePointZero(n)) {
      n = "100%";
    }
    var isPercent = isPercentage(n);
    n = max === 360 ? n : Math.min(max, Math.max(0, parseFloat(n)));
    if (isPercent) {
      n = parseInt(String(n * max), 10) / 100;
    }
    if (Math.abs(n - max) < 1e-6) {
      return 1;
    }
    if (max === 360) {
      n = (n < 0 ? n % max + max : n % max) / parseFloat(String(max));
    } else {
      n = n % max / parseFloat(String(max));
    }
    return n;
  }
  function isOnePointZero(n) {
    return typeof n === "string" && n.indexOf(".") !== -1 && parseFloat(n) === 1;
  }
  function isPercentage(n) {
    return typeof n === "string" && n.indexOf("%") !== -1;
  }
  function boundAlpha(a) {
    a = parseFloat(a);
    if (isNaN(a) || a < 0 || a > 1) {
      a = 1;
    }
    return a;
  }
  function convertToPercentage(n) {
    if (n <= 1) {
      return "".concat(Number(n) * 100, "%");
    }
    return n;
  }
  function pad2(c) {
    return c.length === 1 ? "0" + c : String(c);
  }
  function rgbToRgb(r, g, b) {
    return {
      r: bound01(r, 255) * 255,
      g: bound01(g, 255) * 255,
      b: bound01(b, 255) * 255
    };
  }
  function hue2rgb(p, q, t) {
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * (6 * t);
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  }
  function hslToRgb(h2, s, l) {
    var r;
    var g;
    var b;
    h2 = bound01(h2, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);
    if (s === 0) {
      g = l;
      b = l;
      r = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h2 + 1 / 3);
      g = hue2rgb(p, q, h2);
      b = hue2rgb(p, q, h2 - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }
  function rgbToHsv(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h2 = 0;
    var v = max;
    var d = max - min;
    var s = max === 0 ? 0 : d / max;
    if (max === min) {
      h2 = 0;
    } else {
      switch (max) {
        case r:
          h2 = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h2 = (b - r) / d + 2;
          break;
        case b:
          h2 = (r - g) / d + 4;
          break;
      }
      h2 /= 6;
    }
    return { h: h2, s, v };
  }
  function hsvToRgb(h2, s, v) {
    h2 = bound01(h2, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);
    var i = Math.floor(h2);
    var f = h2 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    var mod = i % 6;
    var r = [v, q, p, p, t, v][mod];
    var g = [t, v, v, q, p, p][mod];
    var b = [p, p, t, v, v, q][mod];
    return { r: r * 255, g: g * 255, b: b * 255 };
  }
  function rgbToHex(r, g, b, allow3Char) {
    var hex = [
      pad2(Math.round(r).toString(16)),
      pad2(Math.round(g).toString(16)),
      pad2(Math.round(b).toString(16))
    ];
    return hex.join("");
  }
  function convertHexToDecimal(h2) {
    return parseIntFromHex(h2) / 255;
  }
  function parseIntFromHex(val) {
    return parseInt(val, 16);
  }
  var names = {
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    black: "#000000",
    blanchedalmond: "#ffebcd",
    blue: "#0000ff",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkgrey: "#a9a9a9",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkslategrey: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dimgrey: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    goldenrod: "#daa520",
    gold: "#ffd700",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavenderblush: "#fff0f5",
    lavender: "#e6e6fa",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgray: "#d3d3d3",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370db",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#db7093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    rebeccapurple: "#663399",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    slategrey: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32"
  };
  function inputToRGB(color) {
    var rgb = { r: 0, g: 0, b: 0 };
    var a = 1;
    var s = null;
    var v = null;
    var l = null;
    var ok = false;
    var format = false;
    if (typeof color === "string") {
      color = stringInputToObject(color);
    }
    if (typeof color === "object") {
      if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
        rgb = rgbToRgb(color.r, color.g, color.b);
        ok = true;
        format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
      } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
        s = convertToPercentage(color.s);
        v = convertToPercentage(color.v);
        rgb = hsvToRgb(color.h, s, v);
        ok = true;
        format = "hsv";
      } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
        s = convertToPercentage(color.s);
        l = convertToPercentage(color.l);
        rgb = hslToRgb(color.h, s, l);
        ok = true;
        format = "hsl";
      }
      if (Object.prototype.hasOwnProperty.call(color, "a")) {
        a = color.a;
      }
    }
    a = boundAlpha(a);
    return {
      ok,
      format: color.format || format,
      r: Math.min(255, Math.max(rgb.r, 0)),
      g: Math.min(255, Math.max(rgb.g, 0)),
      b: Math.min(255, Math.max(rgb.b, 0)),
      a
    };
  }
  var CSS_INTEGER = "[-\\+]?\\d+%?";
  var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";
  var CSS_UNIT = "(?:".concat(CSS_NUMBER, ")|(?:").concat(CSS_INTEGER, ")");
  var PERMISSIVE_MATCH3 = "[\\s|\\(]+(".concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")\\s*\\)?");
  var PERMISSIVE_MATCH4 = "[\\s|\\(]+(".concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")\\s*\\)?");
  var matchers = {
    CSS_UNIT: new RegExp(CSS_UNIT),
    rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
    rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
    hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
    hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
    hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
    hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
    hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
  };
  function stringInputToObject(color) {
    color = color.trim().toLowerCase();
    if (color.length === 0) {
      return false;
    }
    var named = false;
    if (names[color]) {
      color = names[color];
      named = true;
    } else if (color === "transparent") {
      return { r: 0, g: 0, b: 0, a: 0, format: "name" };
    }
    var match = matchers.rgb.exec(color);
    if (match) {
      return { r: match[1], g: match[2], b: match[3] };
    }
    match = matchers.rgba.exec(color);
    if (match) {
      return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    match = matchers.hsl.exec(color);
    if (match) {
      return { h: match[1], s: match[2], l: match[3] };
    }
    match = matchers.hsla.exec(color);
    if (match) {
      return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    match = matchers.hsv.exec(color);
    if (match) {
      return { h: match[1], s: match[2], v: match[3] };
    }
    match = matchers.hsva.exec(color);
    if (match) {
      return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    match = matchers.hex8.exec(color);
    if (match) {
      return {
        r: parseIntFromHex(match[1]),
        g: parseIntFromHex(match[2]),
        b: parseIntFromHex(match[3]),
        a: convertHexToDecimal(match[4]),
        format: named ? "name" : "hex8"
      };
    }
    match = matchers.hex6.exec(color);
    if (match) {
      return {
        r: parseIntFromHex(match[1]),
        g: parseIntFromHex(match[2]),
        b: parseIntFromHex(match[3]),
        format: named ? "name" : "hex"
      };
    }
    match = matchers.hex4.exec(color);
    if (match) {
      return {
        r: parseIntFromHex(match[1] + match[1]),
        g: parseIntFromHex(match[2] + match[2]),
        b: parseIntFromHex(match[3] + match[3]),
        a: convertHexToDecimal(match[4] + match[4]),
        format: named ? "name" : "hex8"
      };
    }
    match = matchers.hex3.exec(color);
    if (match) {
      return {
        r: parseIntFromHex(match[1] + match[1]),
        g: parseIntFromHex(match[2] + match[2]),
        b: parseIntFromHex(match[3] + match[3]),
        format: named ? "name" : "hex"
      };
    }
    return false;
  }
  function isValidCSSUnit(color) {
    return Boolean(matchers.CSS_UNIT.exec(String(color)));
  }
  var hueStep = 2;
  var saturationStep = 0.16;
  var saturationStep2 = 0.05;
  var brightnessStep1 = 0.05;
  var brightnessStep2 = 0.15;
  var lightColorCount = 5;
  var darkColorCount = 4;
  var darkColorMap = [{
    index: 7,
    opacity: 0.15
  }, {
    index: 6,
    opacity: 0.25
  }, {
    index: 5,
    opacity: 0.3
  }, {
    index: 5,
    opacity: 0.45
  }, {
    index: 5,
    opacity: 0.65
  }, {
    index: 5,
    opacity: 0.85
  }, {
    index: 4,
    opacity: 0.9
  }, {
    index: 3,
    opacity: 0.95
  }, {
    index: 2,
    opacity: 0.97
  }, {
    index: 1,
    opacity: 0.98
  }];
  function toHsv(_ref) {
    var r = _ref.r, g = _ref.g, b = _ref.b;
    var hsv = rgbToHsv(r, g, b);
    return {
      h: hsv.h * 360,
      s: hsv.s,
      v: hsv.v
    };
  }
  function toHex(_ref2) {
    var r = _ref2.r, g = _ref2.g, b = _ref2.b;
    return "#".concat(rgbToHex(r, g, b));
  }
  function mix(rgb1, rgb2, amount) {
    var p = amount / 100;
    var rgb = {
      r: (rgb2.r - rgb1.r) * p + rgb1.r,
      g: (rgb2.g - rgb1.g) * p + rgb1.g,
      b: (rgb2.b - rgb1.b) * p + rgb1.b
    };
    return rgb;
  }
  function getHue(hsv, i, light) {
    var hue;
    if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
      hue = light ? Math.round(hsv.h) - hueStep * i : Math.round(hsv.h) + hueStep * i;
    } else {
      hue = light ? Math.round(hsv.h) + hueStep * i : Math.round(hsv.h) - hueStep * i;
    }
    if (hue < 0) {
      hue += 360;
    } else if (hue >= 360) {
      hue -= 360;
    }
    return hue;
  }
  function getSaturation(hsv, i, light) {
    if (hsv.h === 0 && hsv.s === 0) {
      return hsv.s;
    }
    var saturation;
    if (light) {
      saturation = hsv.s - saturationStep * i;
    } else if (i === darkColorCount) {
      saturation = hsv.s + saturationStep;
    } else {
      saturation = hsv.s + saturationStep2 * i;
    }
    if (saturation > 1) {
      saturation = 1;
    }
    if (light && i === lightColorCount && saturation > 0.1) {
      saturation = 0.1;
    }
    if (saturation < 0.06) {
      saturation = 0.06;
    }
    return Number(saturation.toFixed(2));
  }
  function getValue(hsv, i, light) {
    var value;
    if (light) {
      value = hsv.v + brightnessStep1 * i;
    } else {
      value = hsv.v - brightnessStep2 * i;
    }
    if (value > 1) {
      value = 1;
    }
    return Number(value.toFixed(2));
  }
  function generate$1(color) {
    var opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var patterns = [];
    var pColor = inputToRGB(color);
    for (var i = lightColorCount; i > 0; i -= 1) {
      var hsv = toHsv(pColor);
      var colorString = toHex(inputToRGB({
        h: getHue(hsv, i, true),
        s: getSaturation(hsv, i, true),
        v: getValue(hsv, i, true)
      }));
      patterns.push(colorString);
    }
    patterns.push(toHex(pColor));
    for (var _i = 1; _i <= darkColorCount; _i += 1) {
      var _hsv = toHsv(pColor);
      var _colorString = toHex(inputToRGB({
        h: getHue(_hsv, _i),
        s: getSaturation(_hsv, _i),
        v: getValue(_hsv, _i)
      }));
      patterns.push(_colorString);
    }
    if (opts.theme === "dark") {
      return darkColorMap.map(function(_ref3) {
        var index = _ref3.index, opacity = _ref3.opacity;
        var darkColorString = toHex(mix(inputToRGB(opts.backgroundColor || "#141414"), inputToRGB(patterns[index]), opacity * 100));
        return darkColorString;
      });
    }
    return patterns;
  }
  var presetPrimaryColors = {
    red: "#F5222D",
    volcano: "#FA541C",
    orange: "#FA8C16",
    gold: "#FAAD14",
    yellow: "#FADB14",
    lime: "#A0D911",
    green: "#52C41A",
    cyan: "#13C2C2",
    blue: "#1890FF",
    geekblue: "#2F54EB",
    purple: "#722ED1",
    magenta: "#EB2F96",
    grey: "#666666"
  };
  var presetPalettes = {};
  var presetDarkPalettes = {};
  Object.keys(presetPrimaryColors).forEach(function(key) {
    presetPalettes[key] = generate$1(presetPrimaryColors[key]);
    presetPalettes[key].primary = presetPalettes[key][5];
    presetDarkPalettes[key] = generate$1(presetPrimaryColors[key], {
      theme: "dark",
      backgroundColor: "#141414"
    });
    presetDarkPalettes[key].primary = presetDarkPalettes[key][5];
  });
  var blue = presetPalettes.blue;
  var contextKey = Symbol("iconContext");
  var useInjectIconContext = function useInjectIconContext2() {
    return vue.inject(contextKey, {
      prefixCls: vue.ref("anticon"),
      rootClassName: vue.ref(""),
      csp: vue.ref()
    });
  };
  function canUseDom() {
    return !!(typeof window !== "undefined" && window.document && window.document.createElement);
  }
  function contains(root, n) {
    if (!root) {
      return false;
    }
    if (root.contains) {
      return root.contains(n);
    }
    return false;
  }
  var APPEND_ORDER = "data-vc-order";
  var MARK_KEY = "vc-icon-key";
  var containerCache = /* @__PURE__ */ new Map();
  function getMark() {
    var _ref = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, mark = _ref.mark;
    if (mark) {
      return mark.startsWith("data-") ? mark : "data-".concat(mark);
    }
    return MARK_KEY;
  }
  function getContainer(option) {
    if (option.attachTo) {
      return option.attachTo;
    }
    var head = document.querySelector("head");
    return head || document.body;
  }
  function getOrder(prepend) {
    if (prepend === "queue") {
      return "prependQueue";
    }
    return prepend ? "prepend" : "append";
  }
  function findStyles(container) {
    return Array.from((containerCache.get(container) || container).children).filter(function(node) {
      return node.tagName === "STYLE";
    });
  }
  function injectCSS(css) {
    var option = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (!canUseDom()) {
      return null;
    }
    var csp = option.csp, prepend = option.prepend;
    var styleNode = document.createElement("style");
    styleNode.setAttribute(APPEND_ORDER, getOrder(prepend));
    if (csp && csp.nonce) {
      styleNode.nonce = csp.nonce;
    }
    styleNode.innerHTML = css;
    var container = getContainer(option);
    var firstChild = container.firstChild;
    if (prepend) {
      if (prepend === "queue") {
        var existStyle = findStyles(container).filter(function(node) {
          return ["prepend", "prependQueue"].includes(node.getAttribute(APPEND_ORDER));
        });
        if (existStyle.length) {
          container.insertBefore(styleNode, existStyle[existStyle.length - 1].nextSibling);
          return styleNode;
        }
      }
      container.insertBefore(styleNode, firstChild);
    } else {
      container.appendChild(styleNode);
    }
    return styleNode;
  }
  function findExistNode(key) {
    var option = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var container = getContainer(option);
    return findStyles(container).find(function(node) {
      return node.getAttribute(getMark(option)) === key;
    });
  }
  function syncRealContainer(container, option) {
    var cachedRealContainer = containerCache.get(container);
    if (!cachedRealContainer || !contains(document, cachedRealContainer)) {
      var placeholderStyle = injectCSS("", option);
      var parentNode = placeholderStyle.parentNode;
      containerCache.set(container, parentNode);
      container.removeChild(placeholderStyle);
    }
  }
  function updateCSS(css, key) {
    var option = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var container = getContainer(option);
    syncRealContainer(container, option);
    var existNode = findExistNode(key, option);
    if (existNode) {
      if (option.csp && option.csp.nonce && existNode.nonce !== option.csp.nonce) {
        existNode.nonce = option.csp.nonce;
      }
      if (existNode.innerHTML !== css) {
        existNode.innerHTML = css;
      }
      return existNode;
    }
    var newNode = injectCSS(css, option);
    newNode.setAttribute(getMark(option), key);
    return newNode;
  }
  function _objectSpread$8(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$8(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$8(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function warning(valid, message2) {
  }
  function isIconDefinition(target) {
    return typeof target === "object" && typeof target.name === "string" && typeof target.theme === "string" && (typeof target.icon === "object" || typeof target.icon === "function");
  }
  function generate(node, key, rootProps) {
    if (!rootProps) {
      return vue.h(node.tag, _objectSpread$8({
        key
      }, node.attrs), (node.children || []).map(function(child, index) {
        return generate(child, "".concat(key, "-").concat(node.tag, "-").concat(index));
      }));
    }
    return vue.h(node.tag, _objectSpread$8({
      key
    }, rootProps, node.attrs), (node.children || []).map(function(child, index) {
      return generate(child, "".concat(key, "-").concat(node.tag, "-").concat(index));
    }));
  }
  function getSecondaryColor(primaryColor) {
    return generate$1(primaryColor)[0];
  }
  function normalizeTwoToneColors(twoToneColor) {
    if (!twoToneColor) {
      return [];
    }
    return Array.isArray(twoToneColor) ? twoToneColor : [twoToneColor];
  }
  var iconStyles = "\n.anticon {\n  display: inline-block;\n  color: inherit;\n  font-style: normal;\n  line-height: 0;\n  text-align: center;\n  text-transform: none;\n  vertical-align: -0.125em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.anticon > * {\n  line-height: 1;\n}\n\n.anticon svg {\n  display: inline-block;\n}\n\n.anticon::before {\n  display: none;\n}\n\n.anticon .anticon-icon {\n  display: block;\n}\n\n.anticon[tabindex] {\n  cursor: pointer;\n}\n\n.anticon-spin::before,\n.anticon-spin {\n  display: inline-block;\n  -webkit-animation: loadingCircle 1s infinite linear;\n  animation: loadingCircle 1s infinite linear;\n}\n\n@-webkit-keyframes loadingCircle {\n  100% {\n    -webkit-transform: rotate(360deg);\n    transform: rotate(360deg);\n  }\n}\n\n@keyframes loadingCircle {\n  100% {\n    -webkit-transform: rotate(360deg);\n    transform: rotate(360deg);\n  }\n}\n";
  function getRoot(ele) {
    return ele && ele.getRootNode && ele.getRootNode();
  }
  function inShadow(ele) {
    if (!canUseDom()) {
      return false;
    }
    return getRoot(ele) instanceof ShadowRoot;
  }
  function getShadowRoot(ele) {
    return inShadow(ele) ? getRoot(ele) : null;
  }
  var useInsertStyles = function useInsertStyles2() {
    var _useInjectIconContext = useInjectIconContext(), prefixCls = _useInjectIconContext.prefixCls, csp = _useInjectIconContext.csp;
    var instance = vue.getCurrentInstance();
    var mergedStyleStr = iconStyles;
    if (prefixCls) {
      mergedStyleStr = mergedStyleStr.replace(/anticon/g, prefixCls.value);
    }
    vue.nextTick(function() {
      if (!canUseDom()) {
        return;
      }
      var ele = instance.vnode.el;
      var shadowRoot = getShadowRoot(ele);
      updateCSS(mergedStyleStr, "@ant-design-vue-icons", {
        prepend: true,
        csp: csp.value,
        attachTo: shadowRoot
      });
    });
  };
  var _excluded$1 = ["icon", "primaryColor", "secondaryColor"];
  function _objectWithoutProperties$1(source, excluded) {
    if (source == null) return {};
    var target = _objectWithoutPropertiesLoose$1(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }
    return target;
  }
  function _objectWithoutPropertiesLoose$1(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
    return target;
  }
  function _objectSpread$7(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$7(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$7(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var twoToneColorPalette = vue.reactive({
    primaryColor: "#333",
    secondaryColor: "#E6E6E6",
    calculated: false
  });
  function setTwoToneColors(_ref) {
    var primaryColor = _ref.primaryColor, secondaryColor = _ref.secondaryColor;
    twoToneColorPalette.primaryColor = primaryColor;
    twoToneColorPalette.secondaryColor = secondaryColor || getSecondaryColor(primaryColor);
    twoToneColorPalette.calculated = !!secondaryColor;
  }
  function getTwoToneColors() {
    return _objectSpread$7({}, twoToneColorPalette);
  }
  var IconBase = function IconBase2(props, context) {
    var _props$context$attrs = _objectSpread$7({}, props, context.attrs), icon = _props$context$attrs.icon, primaryColor = _props$context$attrs.primaryColor, secondaryColor = _props$context$attrs.secondaryColor, restProps = _objectWithoutProperties$1(_props$context$attrs, _excluded$1);
    var colors = twoToneColorPalette;
    if (primaryColor) {
      colors = {
        primaryColor,
        secondaryColor: secondaryColor || getSecondaryColor(primaryColor)
      };
    }
    warning(isIconDefinition(icon));
    if (!isIconDefinition(icon)) {
      return null;
    }
    var target = icon;
    if (target && typeof target.icon === "function") {
      target = _objectSpread$7({}, target, {
        icon: target.icon(colors.primaryColor, colors.secondaryColor)
      });
    }
    return generate(target.icon, "svg-".concat(target.name), _objectSpread$7({}, restProps, {
      "data-icon": target.name,
      width: "1em",
      height: "1em",
      fill: "currentColor",
      "aria-hidden": "true"
    }));
  };
  IconBase.props = {
    icon: Object,
    primaryColor: String,
    secondaryColor: String,
    focusable: String
  };
  IconBase.inheritAttrs = false;
  IconBase.displayName = "IconBase";
  IconBase.getTwoToneColors = getTwoToneColors;
  IconBase.setTwoToneColors = setTwoToneColors;
  function _slicedToArray$1(arr, i) {
    return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _unsupportedIterableToArray$1(arr, i) || _nonIterableRest$1();
  }
  function _nonIterableRest$1() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray$1(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray$1(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen);
  }
  function _arrayLikeToArray$1(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  }
  function _iterableToArrayLimit$1(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  function _arrayWithHoles$1(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function setTwoToneColor(twoToneColor) {
    var _normalizeTwoToneColo = normalizeTwoToneColors(twoToneColor), _normalizeTwoToneColo2 = _slicedToArray$1(_normalizeTwoToneColo, 2), primaryColor = _normalizeTwoToneColo2[0], secondaryColor = _normalizeTwoToneColo2[1];
    return IconBase.setTwoToneColors({
      primaryColor,
      secondaryColor
    });
  }
  function getTwoToneColor() {
    var colors = IconBase.getTwoToneColors();
    if (!colors.calculated) {
      return colors.primaryColor;
    }
    return [colors.primaryColor, colors.secondaryColor];
  }
  var InsertStyles = vue.defineComponent({
    name: "InsertStyles",
    setup: function setup() {
      useInsertStyles();
      return function() {
        return null;
      };
    }
  });
  var _excluded = ["class", "icon", "spin", "rotate", "tabindex", "twoToneColor", "onClick"];
  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  }
  function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function _objectSpread$6(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$6(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$6(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _objectWithoutProperties(source, excluded) {
    if (source == null) return {};
    var target = _objectWithoutPropertiesLoose(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }
    return target;
  }
  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
    return target;
  }
  setTwoToneColor(blue.primary);
  var Icon = function Icon2(props, context) {
    var _classObj;
    var _props$context$attrs = _objectSpread$6({}, props, context.attrs), cls = _props$context$attrs["class"], icon = _props$context$attrs.icon, spin = _props$context$attrs.spin, rotate = _props$context$attrs.rotate, tabindex = _props$context$attrs.tabindex, twoToneColor = _props$context$attrs.twoToneColor, onClick = _props$context$attrs.onClick, restProps = _objectWithoutProperties(_props$context$attrs, _excluded);
    var _useInjectIconContext = useInjectIconContext(), prefixCls = _useInjectIconContext.prefixCls, rootClassName = _useInjectIconContext.rootClassName;
    var classObj = (_classObj = {}, _defineProperty$6(_classObj, rootClassName.value, !!rootClassName.value), _defineProperty$6(_classObj, prefixCls.value, true), _defineProperty$6(_classObj, "".concat(prefixCls.value, "-").concat(icon.name), Boolean(icon.name)), _defineProperty$6(_classObj, "".concat(prefixCls.value, "-spin"), !!spin || icon.name === "loading"), _classObj);
    var iconTabIndex = tabindex;
    if (iconTabIndex === void 0 && onClick) {
      iconTabIndex = -1;
    }
    var svgStyle = rotate ? {
      msTransform: "rotate(".concat(rotate, "deg)"),
      transform: "rotate(".concat(rotate, "deg)")
    } : void 0;
    var _normalizeTwoToneColo = normalizeTwoToneColors(twoToneColor), _normalizeTwoToneColo2 = _slicedToArray(_normalizeTwoToneColo, 2), primaryColor = _normalizeTwoToneColo2[0], secondaryColor = _normalizeTwoToneColo2[1];
    return vue.createVNode("span", _objectSpread$6({
      "role": "img",
      "aria-label": icon.name
    }, restProps, {
      "onClick": onClick,
      "class": [classObj, cls],
      "tabindex": iconTabIndex
    }), [vue.createVNode(IconBase, {
      "icon": icon,
      "primaryColor": primaryColor,
      "secondaryColor": secondaryColor,
      "style": svgStyle
    }, null), vue.createVNode(InsertStyles, null, null)]);
  };
  Icon.props = {
    spin: Boolean,
    rotate: Number,
    icon: Object,
    twoToneColor: [String, Array]
  };
  Icon.displayName = "AntdIcon";
  Icon.inheritAttrs = false;
  Icon.getTwoToneColor = getTwoToneColor;
  Icon.setTwoToneColor = setTwoToneColor;
  var BulbOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M632 888H392c-4.4 0-8 3.6-8 8v32c0 17.7 14.3 32 32 32h192c17.7 0 32-14.3 32-32v-32c0-4.4-3.6-8-8-8zM512 64c-181.1 0-328 146.9-328 328 0 121.4 66 227.4 164 284.1V792c0 17.7 14.3 32 32 32h264c17.7 0 32-14.3 32-32V676.1c98-56.7 164-162.7 164-284.1 0-181.1-146.9-328-328-328zm127.9 549.8L604 634.6V752H420V634.6l-35.9-20.8C305.4 568.3 256 484.5 256 392c0-141.4 114.6-256 256-256s256 114.6 256 256c0 92.5-49.4 176.3-128.1 221.8z" } }] }, "name": "bulb", "theme": "outlined" };
  function _objectSpread$5(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$5(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$5(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var BulbOutlined = function BulbOutlined2(props, context) {
    var p = _objectSpread$5({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$5({}, p, {
      "icon": BulbOutlined$1
    }), null);
  };
  BulbOutlined.displayName = "BulbOutlined";
  BulbOutlined.inheritAttrs = false;
  var ExpandOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "defs", "attrs": {}, "children": [{ "tag": "style", "attrs": {} }] }, { "tag": "path", "attrs": { "d": "M342 88H120c-17.7 0-32 14.3-32 32v224c0 8.8 7.2 16 16 16h48c8.8 0 16-7.2 16-16V168h174c8.8 0 16-7.2 16-16v-48c0-8.8-7.2-16-16-16zm578 576h-48c-8.8 0-16 7.2-16 16v176H682c-8.8 0-16 7.2-16 16v48c0 8.8 7.2 16 16 16h222c17.7 0 32-14.3 32-32V680c0-8.8-7.2-16-16-16zM342 856H168V680c0-8.8-7.2-16-16-16h-48c-8.8 0-16 7.2-16 16v224c0 17.7 14.3 32 32 32h222c8.8 0 16-7.2 16-16v-48c0-8.8-7.2-16-16-16zM904 88H682c-8.8 0-16 7.2-16 16v48c0 8.8 7.2 16 16 16h174v176c0 8.8 7.2 16 16 16h48c8.8 0 16-7.2 16-16V120c0-17.7-14.3-32-32-32z" } }] }, "name": "expand", "theme": "outlined" };
  function _objectSpread$4(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$4(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$4(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var ExpandOutlined = function ExpandOutlined2(props, context) {
    var p = _objectSpread$4({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$4({}, p, {
      "icon": ExpandOutlined$1
    }), null);
  };
  ExpandOutlined.displayName = "ExpandOutlined";
  ExpandOutlined.inheritAttrs = false;
  var LoadingOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z" } }] }, "name": "loading", "theme": "outlined" };
  function _objectSpread$3(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$3(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$3(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var LoadingOutlined = function LoadingOutlined2(props, context) {
    var p = _objectSpread$3({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$3({}, p, {
      "icon": LoadingOutlined$1
    }), null);
  };
  LoadingOutlined.displayName = "LoadingOutlined";
  LoadingOutlined.inheritAttrs = false;
  var SendOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "defs", "attrs": {}, "children": [{ "tag": "style", "attrs": {} }] }, { "tag": "path", "attrs": { "d": "M931.4 498.9L94.9 79.5c-3.4-1.7-7.3-2.1-11-1.2a15.99 15.99 0 00-11.7 19.3l86.2 352.2c1.3 5.3 5.2 9.6 10.4 11.3l147.7 50.7-147.6 50.7c-5.2 1.8-9.1 6-10.3 11.3L72.2 926.5c-.9 3.7-.5 7.6 1.2 10.9 3.9 7.9 13.5 11.1 21.5 7.2l836.5-417c3.1-1.5 5.6-4.1 7.2-7.1 3.9-8 .7-17.6-7.2-21.6zM170.8 826.3l50.3-205.6 295.2-101.3c2.3-.8 4.2-2.6 5-5 1.4-4.2-.8-8.7-5-10.2L221.1 403 171 198.2l628 314.9-628.2 313.2z" } }] }, "name": "send", "theme": "outlined" };
  function _objectSpread$2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$2(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$2(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var SendOutlined = function SendOutlined2(props, context) {
    var p = _objectSpread$2({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$2({}, p, {
      "icon": SendOutlined$1
    }), null);
  };
  SendOutlined.displayName = "SendOutlined";
  SendOutlined.inheritAttrs = false;
  var SettingOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M924.8 625.7l-65.5-56c3.1-19 4.7-38.4 4.7-57.8s-1.6-38.8-4.7-57.8l65.5-56a32.03 32.03 0 009.3-35.2l-.9-2.6a443.74 443.74 0 00-79.7-137.9l-1.8-2.1a32.12 32.12 0 00-35.1-9.5l-81.3 28.9c-30-24.6-63.5-44-99.7-57.6l-15.7-85a32.05 32.05 0 00-25.8-25.7l-2.7-.5c-52.1-9.4-106.9-9.4-159 0l-2.7.5a32.05 32.05 0 00-25.8 25.7l-15.8 85.4a351.86 351.86 0 00-99 57.4l-81.9-29.1a32 32 0 00-35.1 9.5l-1.8 2.1a446.02 446.02 0 00-79.7 137.9l-.9 2.6c-4.5 12.5-.8 26.5 9.3 35.2l66.3 56.6c-3.1 18.8-4.6 38-4.6 57.1 0 19.2 1.5 38.4 4.6 57.1L99 625.5a32.03 32.03 0 00-9.3 35.2l.9 2.6c18.1 50.4 44.9 96.9 79.7 137.9l1.8 2.1a32.12 32.12 0 0035.1 9.5l81.9-29.1c29.8 24.5 63.1 43.9 99 57.4l15.8 85.4a32.05 32.05 0 0025.8 25.7l2.7.5a449.4 449.4 0 00159 0l2.7-.5a32.05 32.05 0 0025.8-25.7l15.7-85a350 350 0 0099.7-57.6l81.3 28.9a32 32 0 0035.1-9.5l1.8-2.1c34.8-41.1 61.6-87.5 79.7-137.9l.9-2.6c4.5-12.3.8-26.3-9.3-35zM788.3 465.9c2.5 15.1 3.8 30.6 3.8 46.1s-1.3 31-3.8 46.1l-6.6 40.1 74.7 63.9a370.03 370.03 0 01-42.6 73.6L721 702.8l-31.4 25.8c-23.9 19.6-50.5 35-79.3 45.8l-38.1 14.3-17.9 97a377.5 377.5 0 01-85 0l-17.9-97.2-37.8-14.5c-28.5-10.8-55-26.2-78.7-45.7l-31.4-25.9-93.4 33.2c-17-22.9-31.2-47.6-42.6-73.6l75.5-64.5-6.5-40c-2.4-14.9-3.7-30.3-3.7-45.5 0-15.3 1.2-30.6 3.7-45.5l6.5-40-75.5-64.5c11.3-26.1 25.6-50.7 42.6-73.6l93.4 33.2 31.4-25.9c23.7-19.5 50.2-34.9 78.7-45.7l37.9-14.3 17.9-97.2c28.1-3.2 56.8-3.2 85 0l17.9 97 38.1 14.3c28.7 10.8 55.4 26.2 79.3 45.8l31.4 25.8 92.8-32.9c17 22.9 31.2 47.6 42.6 73.6L781.8 426l6.5 39.9zM512 326c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm79.2 255.2A111.6 111.6 0 01512 614c-29.9 0-58-11.7-79.2-32.8A111.6 111.6 0 01400 502c0-29.9 11.7-58 32.8-79.2C454 401.6 482.1 390 512 390c29.9 0 58 11.6 79.2 32.8A111.6 111.6 0 01624 502c0 29.9-11.7 58-32.8 79.2z" } }] }, "name": "setting", "theme": "outlined" };
  function _objectSpread$1(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$1(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$1(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var SettingOutlined = function SettingOutlined2(props, context) {
    var p = _objectSpread$1({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$1({}, p, {
      "icon": SettingOutlined$1
    }), null);
  };
  SettingOutlined.displayName = "SettingOutlined";
  SettingOutlined.inheritAttrs = false;
  var ShrinkOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M881.7 187.4l-45.1-45.1a8.03 8.03 0 00-11.3 0L667.8 299.9l-54.7-54.7a7.94 7.94 0 00-13.5 4.7L576.1 439c-.6 5.2 3.7 9.5 8.9 8.9l189.2-23.5c6.6-.8 9.3-8.8 4.7-13.5l-54.7-54.7 157.6-157.6c3-3 3-8.1-.1-11.2zM439 576.1l-189.2 23.5c-6.6.8-9.3 8.9-4.7 13.5l54.7 54.7-157.5 157.5a8.03 8.03 0 000 11.3l45.1 45.1c3.1 3.1 8.2 3.1 11.3 0l157.6-157.6 54.7 54.7a7.94 7.94 0 0013.5-4.7L447.9 585a7.9 7.9 0 00-8.9-8.9z" } }] }, "name": "shrink", "theme": "outlined" };
  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var ShrinkOutlined = function ShrinkOutlined2(props, context) {
    var p = _objectSpread({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread({}, p, {
      "icon": ShrinkOutlined$1
    }), null);
  };
  ShrinkOutlined.displayName = "ShrinkOutlined";
  ShrinkOutlined.inheritAttrs = false;
  var _GM_getValue = /* @__PURE__ */ (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_info = /* @__PURE__ */ (() => typeof GM_info != "undefined" ? GM_info : void 0)();
  var _GM_setValue = /* @__PURE__ */ (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _unsafeWindow = /* @__PURE__ */ (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  const getScriptInfo = () => {
    return {
      name: _GM_info.script.name,
      author: _GM_info.script.author,
      namespace: _GM_info.script.namespace,
      version: _GM_info.script.version,
      description: _GM_info.script.description
    };
  };
  const LOCAL_USER_CENTER_URL = "https://xs.openget.cn/user?section=account";
  // >>> FX-INJECT:dist-channel
  // __DIST.shop stays empty in the official build, so every FX-CH site below
  // falls back to the official URL. build_distributor.py replaces this block.
  var __DIST = { shop: "", name: "", code: "" };
  // <<< FX-INJECT:dist-channel
  // 渠道版没配店铺链接时，续费类入口不许回落到官方购买页：那等于渠道自己把
  // 客户送回官网下单。此时链接整体置空，只留下面板里的卡密激活。
  // 官方版 __DIST.code 恒为空串，__noShop 永远是 false，行为零变化。
  const __noShop = !!(__DIST.code && !__DIST.shop);  // FX-CH:no-shop-guard
  const __noShopTip = "该渠道未开通在线购买，续费请向渠道索取卡密，在「账号」面板输入卡密激活";
  const __billHref = __DIST.shop || (__noShop ? "" : "https://xs.openget.cn/user?section=billing");  // FX-CH:no-shop-billing
  const localBackendJson = (url, data, token) => {
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        url,
        method: data ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          ...token ? { "Authorization": "Bearer " + token } : {}
        },
        data: data ? JSON.stringify(data) : void 0,
        timeout: 2e4,
        onload: (response) => {
          try {
            resolve(JSON.parse(response.responseText || "{}"));
          } catch (_) {
            resolve({ code: 500, msg: "本地后端响应解析失败" });
          }
        },
        onerror: () => resolve({ code: 500, msg: "无法连接本地后端" }),
        ontimeout: () => resolve({ code: 500, msg: "本地后端请求超时" })
      });
    });
  };
  const sha256Text = async (text) => {
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(text || ""));
    return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const getRememberedLogin = () => {
    try {
      return JSON.parse(_GM_getValue("localBackendLogin") || "{}") || {};
    } catch (_) {
      return {};
    }
  };
  const setRememberedLogin = (data) => {
    try {
      _GM_setValue("localBackendLogin", JSON.stringify(data || {}));
    } catch (_) {
    }
  };
  const syncLoginTokenToScriptKey = async (setting, loginToken) => {
    const keyRes = await localBackendJson("https://xs.openget.cn/api/user/script-key", null, loginToken);
    if (keyRes.code !== 200 || !keyRes.script_key) {
      return { ok: false, msg: keyRes.msg || "脚本密钥获取失败" };
    }
    setting.config.basicConfig.token.value = keyRes.script_key;
    try {
      abcCloudApplying = true;
      await fetchAndApplyAbcCloudConfig(setting, keyRes.script_key);
    } catch (_) {
    } finally {
      abcCloudApplying = false;
    }
    const profileRes = await localBackendJson("https://xs.openget.cn/api/user/profile", null, keyRes.script_key);
    setting.userInfo.remainCount = profileRes.code === 200 && profileRes.profile ? getProfileRemainingCount(profileRes.profile) : "已配置";
    if (profileRes.code === 200 && profileRes.profile) {
      setting.userInfo.activeMember = !!profileRes.profile.active_member;
      setting.userInfo.memberUntil = profileRes.profile.member_until || "";
      setting.userInfo.pointsBalance = Number(profileRes.profile.points_balance || 0);
    }
    persistSettingState(setting);
    return { ok: true, msg: "已自动登录并同步密钥" };
  };
  const persistSettingState = (setting) => {
    try {
      _GM_setValue("setting", JSON.stringify(setting.$state || setting));
    } catch (_) {
    }
  };
  const serializeAbcCloudConfig = (setting) => {
    const config = {};
    ["basicConfig", "examConfig", "cxConfig", "searchConfig"].forEach((section) => {
      config[section] = {};
      const group = setting.config && setting.config[section] || {};
      Object.keys(group).forEach((key) => {
        if (key === "token") return;
        if (group[key] && Object.prototype.hasOwnProperty.call(group[key], "value")) {
          config[section][key] = group[key].value;
        }
      });
    });
    return config;
  };
  const applyAbcCloudConfig = (setting, cloudConfig) => {
    if (!cloudConfig || typeof cloudConfig !== "object") return false;
    let changed = false;
    ["basicConfig", "examConfig", "cxConfig", "searchConfig"].forEach((section) => {
      const group = setting.config && setting.config[section];
      const source = cloudConfig[section] || {};
      if (!group || !source) return;
      Object.keys(source).forEach((key) => {
        if (key === "token") return;
        if (group[key] && Object.prototype.hasOwnProperty.call(group[key], "value") && group[key].value !== source[key]) {
          group[key].value = source[key];
          changed = true;
        }
      });
    });
    return changed;
  };
  const fetchAndApplyAbcCloudConfig = async (setting, token) => {
    if (!token) return false;
    const res = await localBackendJson("https://xs.openget.cn/api/user/settings", null, token);
    if (res.code === 200 && res.settings && res.settings.abcConfig) {
      const changed = applyAbcCloudConfig(setting, res.settings.abcConfig);
      if (changed) persistSettingState(setting);
      return changed;
    }
    return false;
  };
  let abcCloudSaveTimer = null;
  let abcCloudApplying = false;
  const scheduleSaveAbcCloudConfig = (setting, token) => {
    if (!token || abcCloudApplying) return;
    if (abcCloudSaveTimer) clearTimeout(abcCloudSaveTimer);
    abcCloudSaveTimer = setTimeout(async () => {
      const current = await localBackendJson("https://xs.openget.cn/api/user/settings", null, token);
      const settings = current.code === 200 && current.settings && typeof current.settings === "object" ? current.settings : {};
      settings.abcConfig = serializeAbcCloudConfig(setting);
      await localBackendJson("https://xs.openget.cn/api/user/settings", { settings }, token);
    }, 800);
  };
  let scriptLogQueue = [];
  let scriptLogFlushTimer = null;
  const plainLogText = (text) => {
    const div = document.createElement("div");
    div.innerHTML = String(text || "");
    return (div.textContent || div.innerText || String(text || "")).slice(0, 4000);
  };
  const getScriptLogToken = () => {
    try {
      const setting = useSettingStore();
      const scriptKey = setting.config && setting.config.basicConfig && setting.config.basicConfig.token && setting.config.basicConfig.token.value || "";
      if (scriptKey) return scriptKey;
      const remembered = getRememberedLogin();
      if (remembered && remembered.token) return remembered.token;
      return "";
    } catch (_) {
      try {
        const remembered = getRememberedLogin();
        if (remembered && remembered.token) return remembered.token;
      } catch (e2) {}
      return "";
    }
  };
  const flushScriptLogs = async () => {
    const token = getScriptLogToken();
    if (!token || !scriptLogQueue.length) return;
    const logs = scriptLogQueue.splice(0, 80);
    const res = await localBackendJson("https://xs.openget.cn/api/script-logs", { logs }, token);
    if (!res || res.code !== 200) {
      scriptLogQueue = logs.concat(scriptLogQueue).slice(-200);
    }
  };
  const enqueueScriptLog = (logItem) => {
    scriptLogQueue.push({
      event_type: logItem.type === "warning" ? "warning" : "log",
      level: logItem.type === "warning" ? "warning" : "info",
      message: plainLogText(logItem.text),
      page_url: location.href,
      extra: {
        tabIndex: logItem.tabIndex,
        time: logItem.time,
        script_version: getScriptInfo().version,
        raw_html: String(logItem.text || "").slice(0, 1000)
      },
      timestamp: Date.now()
    });
    if (scriptLogQueue.length > 200) scriptLogQueue = scriptLogQueue.slice(-200);
    if (scriptLogFlushTimer) clearTimeout(scriptLogFlushTimer);
    scriptLogFlushTimer = setTimeout(flushScriptLogs, 1200);
  };
  // 一场答题一条小结。不进 scriptLogQueue：那条队列有 200 条上限、还等 1200ms debounce，
  // 交卷后页面马上跳走，小结会被普通日志挤掉。这里单独直发。
  const enqueueScriptEvent = (extra, opts = {}) => {
    const token = getScriptLogToken();
    if (!token) return Promise.resolve(false);
    const item = {
      event_type: opts.eventType || "answer_summary",
      level: "info",
      message: String(opts.message || "").slice(0, 4000),
      page_url: location.href,
      extra: Object.assign({
        time: getDateTime(),
        script_version: getScriptInfo().version
      }, extra || {}),
      timestamp: Date.now()
    };
    return localBackendJson("https://xs.openget.cn/api/script-logs", { logs: [item] }, token).then(
      (res) => Boolean(res && res.code === 200)
    );
  };
  // 「一卷一报」：本场共几题、几题真填上了、答案分别来自题库/缓存/模型、哪几题没填上。
  // 只统计「点上了没有」——平台交卷后不回吐分数，score 恒为 null，别当成判对率。
  const ANSWER_SUMMARY_LIMIT = 40;
  // 余额不足不是答题能力问题，进统计只会把填充率/卡点榜刷脏，直接丢掉。
  const isQuotaFailReason = (msg) => /余额不足|题数不足|点数不足|insufficient.?quota|请到用户中心购买|请联系您的服务方/i.test(String(msg || ""));
  const buildAnswerSummary = async (platform, questions) => {
    const list = Array.isArray(questions) ? questions : [];
    let filled = 0;
    let skippedQuota = 0;
    const src = { bank: 0, cache: 0, ai: 0, unknown: 0 };
    const unanswered = [];
    for (const question of list) {
      const ans = question && question.answer || {};
      // code 1=题库直答、2=模型答，两者都代表填充后回读确认过；填不上时上面已改成 0
      if (ans.code === 1 || ans.code === 2) {
        filled += 1;
        if (ans.src === "bank" || ans.src === "cache" || ans.src === "ai") src[ans.src] += 1;
        else src.unknown += 1;
        continue;
      }
      // 余额不足：整题不进 total / unanswered
      if (isQuotaFailReason(ans.msg) || Number(ans.code) === 402) {
        skippedQuota += 1;
        continue;
      }
      // code -1 = 该题型脚本还不支持：压根没去点，但它确实没填上。
      // 留在卡点清单里，后台才拼得平「没填上」的数；否则填充率掉了一块却查不到原因。
      // 指纹要逐题 await 一次 sha256：一场 200 题全卡住的整卷，不设上限就是答完再排 200 次哈希，
      // 而后台只吃前 40 条，到量就停——total/filled 另有算法，不受这里影响。
      if (unanswered.length >= ANSWER_SUMMARY_LIMIT) continue;
      unanswered.push({
        type: String(question && question.type || "").slice(0, 20),
        // code 是排查用的原始状态：0=拿到了但点不上，-1004=题库没答案，其它=后端报错码
        code: Number(ans.code) || 0,
        // -1004 既可能是「题库没收录」也可能是「额度用尽/超时」，只有 msg 分得开
        reason: String(ans.msg || (Number(ans.code) === 0 ? "答案拿到了但没点上去" : "")).slice(0, 80),
        // 题干前 60 字：后台看到「这道题卡了 37 次」得能认出是哪道题，纯 hash 没人查得动
        title: String(question && question.title || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60),
        // 客户端指纹，仅用于「同一道题反复点不上」的归类；与后端 bank_call_logs.question_hash
        // 不是同一算法，不能拿来 join
        hash: await sha256Text(createAnswerRecordCacheKey(question)).catch(() => "")
      });
    }
    const total = list.length - skippedQuota;
    let threshold = 0;
    try {
      threshold = Number(useSettingStore().config.basicConfig.accuracy.value) || 0;
    } catch (_) {
    }
    return {
      platform: String(platform || "unknown").slice(0, 20),
      total,
      filled,
      unfilled: Math.max(0, total - filled),
      src,
      unanswered,
      accuracy: Number((filled / Math.max(total, 1) * 100).toFixed(1)),
      threshold,
      score: null
    };
  };
  // 不 await：答题刚结束就可能自动交卷，为一行日志把交卷卡住不值当。
  const reportAnswerSummary = (platform, questions) => {
    return buildAnswerSummary(platform, questions).then((summary) => {
      // 整场都是余额不足时 total=0，不写库
      if (!summary.total) return false;
      return enqueueScriptEvent(summary, {
        message: `[答题小结] ${summary.platform} 共${summary.total}题 填上${summary.filled}题`
      });
    }).catch((error) => {
      console.warn("answer summary report failed", error);
      return false;
    });
  };
  const formatDateTime = (dt) => {
    dt.getFullYear();
    dt.getMonth() + 1;
    dt.getDate();
    let hours = dt.getHours();
    let minutes = dt.getMinutes();
    let seconds = dt.getSeconds();
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };
  const pad = (n) => {
    return n < 10 ? "0" + n : n.toString();
  };
  const getDateTime = () => {
    let now = /* @__PURE__ */ new Date();
    return formatDateTime(now);
  };
  const useLogStore = pinia.defineStore("log", {
    state: () => ({
      logList: []
    }),
    actions: {
      insertLog(text, type = null, tabIndex = null) {
        const logItem = {
          text,
          time: getDateTime(),
          type,
          tabIndex
        };
        this.logList.push(logItem);
        enqueueScriptLog(logItem);
      }
    }
  });
  const _hoisted_1$8 = { class: "log-wrap" };
  const _hoisted_2$7 = ["innerHTML"];
  const _hoisted_3$6 = { key: 0 };
  const _sfc_main$9 = {
    __name: "UserLog",
    setup(__props) {
      const log = useLogStore();
      const logList = vue.ref(log.logList);
      const logDom = vue.ref(null);
      vue.watch(
        () => log.logList,
        () => {
          vue.nextTick(() => {
            logDom.value.scrollTop = logDom.value.scrollHeight;
          });
        },
        { deep: true }
      );
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$8, [
          vue.createElementVNode("div", {
            class: "console",
            ref_key: "logDom",
            ref: logDom
          }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(logList.value, (item, index) => {
              return vue.openBlock(), vue.createElementBlock("div", { key: index }, [
                vue.createElementVNode("span", null, vue.toDisplayString(item.time), 1),
                vue.createElementVNode("span", {
                  class: vue.normalizeClass(item.type == null ? "log" : "warning")
                }, "[" + vue.toDisplayString(item.type == null ? "日志" : "警告") + "]", 3),
                vue.createElementVNode("span", {
                  innerHTML: item.text
                }, null, 8, _hoisted_2$7)
              ]);
            }), 128)),
            logList.value.length == 0 ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_3$6, _cache[0] || (_cache[0] = [
              vue.createElementVNode("span", { class: "log" }, "[日志]", -1),
              vue.createElementVNode("span", null, "等待用户进入正确页面..", -1)
            ]))) : vue.createCommentVNode("", true)
          ], 512)
        ]);
      };
    }
  };
  function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(target)) {
      if (!(key in source)) continue;
      const tVal = target[key];
      const sVal = source[key];
      if (tVal !== null && typeof tVal === "object" && !Array.isArray(tVal) && sVal !== null && typeof sVal === "object" && !Array.isArray(sVal)) {
        result[key] = deepMerge(tVal, sVal);
      } else {
        result[key] = sVal;
      }
    }
    return result;
  }
  // 哪些平台有哪些能力：设置页按当前平台过滤，没这个功能的平台不显示对应设置
  const ANSWER_PLATFORM_KEYS = ["cx", "zhs", "qs", "ct"];
  const WATCH_PLATFORM_KEYS = ["ykt", "mskt", "icve", "ouchn", "mooc", "uschool", "xtzx", "ytccr", "sdzj", "xczx"];
  // 自动切换页签时，别抢用户手动点开的页签（设置、搜题、记录、队列）
  const AUTO_TAB_KEYS = ["0", "1"];
  const autoSetTab = (settingStore, key) => {
    try {
      if (settingStore && AUTO_TAB_KEYS.includes(String(settingStore.tabIndex))) settingStore.tabIndex = key;
    } catch (_) {}
  };
  const useSettingStore = pinia.defineStore("setting", {
    state: () => {
      const scriptInfo = getScriptInfo();
      const defaultTop = typeof window !== "undefined" ? `${Math.round(window.innerHeight * 0.2)}px` : "120px";
      const defaultSetting = {
        tabIndex: "0",
        version: scriptInfo.version,
        position: {
          right: "0px",
          top: defaultTop
        },
        shopLink: "",
        latestVersion: "",
        chatWebUrl: "",
        config: {
          cxConfig: {
            showCustomEditor: {
              text: "编辑时显示自定义编辑框",
              value: true,
              type: "switch",
              tips: "开启后，编辑时会显示自定义编辑框"
            },
            faceRecognitionNotify: {
              text: "出现人脸识别时通知我",
              value: true,
              type: "switch",
              tips: "开启后，出现人脸识别时会发送通知"
            }
          },
          basicConfig: {
            token: {
              text: "本地后端密钥",
              value: "",
              type: "input",
              tips: "点击上方“点我获取密钥”打开用户中心，登录后复制脚本密钥并填入这里；填写后刷新页面生效。",
              placeholder: "请粘贴用户中心生成的脚本密钥"
            },
            answerMode: {
              text: "答题模式",
              platforms: ANSWER_PLATFORM_KEYS,
              value: "questionBankAndAI",
              type: "select",
              tips: "纯题库：仅题库搜索；纯AI：仅AI答题；题库+AI：题库优先，无结果时AI答题",
              options: [
                { value: "questionBank", label: "纯题库" },
                { value: "ai", label: "纯AI" },
                { value: "questionBankAndAI", label: "题库+AI" }
              ]
            },
            matchMode: {
              text: "题库匹配方式",
              platforms: ANSWER_PLATFORM_KEYS,
              value: "auto",
              type: "select",
              tips: "自动：题库里有相似题时，按题面/选项相似度自动选最匹配的一条作答；手动：遇到相似题不自动作答，留空由你自行选择（作业入口会列出候选题）",
              options: [
                { value: "auto", label: "自动选最优" },
                { value: "manual", label: "手动选择" }
              ]
            },
            manualWaitMode: {
              text: "手动选择的处理",
              platforms: ANSWER_PLATFORM_KEYS,
              value: "wait",
              type: "select",
              tips: "仅「手动选择」时生效。等待：遇到相似题就停下来，等你选完再继续答后面的题、再提交；跳过：不等待，该题留空、本轮不自动提交，等你事后自己处理",
              options: [
                { value: "wait", label: "等待我选择后继续" },
                { value: "skip", label: "跳过此题（不自动提交）" }
              ]
            },
            videoPlayrate: {
              text: "视频倍速",
              value: 2,
              type: "input-number",
              min: 1,
              max: 16,
              step: 0.5,
              precision: 1,
              tips: "❗❗❗视频观看倍速（支持自定义，0.5 递增），高倍速可能面临进度清空风险，请慎重选择"
            },
            reqIntervalTime: {
              text: "搜题间隔（秒）",
              platforms: ANSWER_PLATFORM_KEYS,
              value: 2,
              type: "input-number",
              min: 1,
              max: 3,
              precision: 0,
              tips: "每题搜题间隔，不建议太低，避免服务器压力过大"
            },
            accuracy: {
              text: "正确率",
              platforms: ANSWER_PLATFORM_KEYS,
              value: 80,
              type: "slider",
              tips: "作业、测验、考试满足设定的正确率才会提交，不满足自动保存,建议80%"
            },
            autoSubmit: {
              text: "章节、作业自动提交",
              platforms: ANSWER_PLATFORM_KEYS,
              value: true,
              type: "switch",
              tips: "（建议开启）开启后，满足正确率则自动提交作业、章节，手动答题时建议关闭此功能"
            },
            autoChangeChapter: {
              text: "自动切换章节",
              value: true,
              type: "switch",
              tips: "（建议开启）开启后，自动切换章节，手动答题时，建议关闭"
            },
            skipFinishedChapter: {
              text: "跳过已完成章节",
              platforms: ANSWER_PLATFORM_KEYS,
              value: true,
              type: "switch",
              tips: "（建议开启）自动切章时优先跳到目录里未完成的章节，减少空跳"
            },
            autoAnswer: {
              text: "自动答题",
              platforms: ANSWER_PLATFORM_KEYS,
              value: true,
              type: "switch",
              tips: "手动答题时，建议关闭，学习时，建议开启"
            },
            autoRefresh: {
              text: "定时刷新（防卡死）",
              platforms: ANSWER_PLATFORM_KEYS,
              value: true,
              type: "switch",
              tips: "开启后每30分钟检查：前台空闲或视频持续30分钟无进展时刷新；正常播放、答题、后台时不刷新；关闭立即停止定时器"
            },
            assistVideo: {
              text: "视频助手",
              value: true,
              type: "switch",
              platforms: ["zhs"],
              tips: "关闭后进入学习页不会自动播放视频、不会自动切章节；答题助手打开后才会开始答题"
            },
            assistAnswer: {
              text: "答题助手",
              value: true,
              type: "switch",
              platforms: ["zhs"],
              tips: "关闭后进入作业/考试页不会自动作答，可手动点开"
            },
            masteryFull: {
              text: "掌握度满分",
              value: true,
              type: "switch",
              platforms: ["zhs"],
              tips: "开启后「答题」页会多一个「掌握度满分」切换，点开始就按知识点刷到 100%、记住答案并可导出题库；关闭则这些页面走原来的答题流程"
            },
            watchAssist: {
              text: "视频助手",
              value: true,
              type: "switch",
              platforms: WATCH_PLATFORM_KEYS,
              tips: "开启后进入课程页自动播放视频；倍速用上面的「视频倍速」，播完自动翻页用「自动切换章节」"
            }
          },
          examConfig: {
            autoSubmit: {
              value: false,
              text: "自动交卷",
              type: "switch",
              tips: "手动考试时建议关闭；自动考试答题完成后，将自动点击交卷。"
            }
          },
          searchConfig: {
            searchBySelectedText: {
              value: false,
              text: "划词搜题"
            }
          }
        },
        userInfo: {
          remainCount: 0,
          activeMember: false,
          memberUntil: "",
          pointsBalance: 0
        }
      };
      try {
        const localStore = JSON.parse(_GM_getValue("setting"));
        if (localStore) {
          const merged = deepMerge(defaultSetting, localStore);
          const vpConfig = merged.config && merged.config.basicConfig && merged.config.basicConfig.videoPlayrate;
          if (vpConfig) {
            vpConfig.type = "input-number";
            delete vpConfig.options;
            if (vpConfig.min === undefined) vpConfig.min = 1;
            if (vpConfig.max === undefined) vpConfig.max = 16;
            if (vpConfig.step === undefined) vpConfig.step = 0.5;
            if (vpConfig.precision === undefined) vpConfig.precision = 1;
          }
          for (const [section, entries] of Object.entries(defaultSetting.config)) {
            for (const [key, entry] of Object.entries(entries)) {
              const savedValue = merged.config[section][key].value;
              merged.config[section][key] = { ...entry, value: savedValue };
            }
          }
          merged.version = scriptInfo.version;
          return merged;
        }
      } catch (error) {
        console.log("localStore error:", error);
      }
      return defaultSetting;
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _hoisted_1$7 = { class: "home-wrap" };
  const _hoisted_2$6 = { class: "tips" };
  const _hoisted_3$5 = { key: 0 };
  const _hoisted_4$5 = ["innerHTML"];
  const _sfc_main$8 = {
    __name: "ScriptHome",
    setup(__props) {
      const scriptInfo = getScriptInfo();
      const setting = useSettingStore();
      const { latestVersion, chatWebUrl, shopLink } = pinia.storeToRefs(setting);
      const showTips = vue.ref(false);
      const showTutorial = vue.ref(false);
      const announce = vue.ref(null);
      vue.onMounted(async () => {
        const res = await localBackendJson("https://xs.openget.cn/api/v1/announce");
        if (res && res.code === 200 && res.data && res.data.enabled && res.data.text) {
          announce.value = res.data;
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$7, [
          announce.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: "announce",
            style: { "margin": "8px", "padding": "10px 12px", "background": "var(--t-surface)", "border": "1px solid var(--t-border)", "border-left": "3px solid var(--t-warning)", "border-radius": "8px", "color": "var(--t-text2)", "font-size": "12px", "line-height": "1.65", "white-space": "pre-line" }
          }, [
            vue.createElementVNode("div", { style: { "font-weight": "700", "font-size": "13px", "margin-bottom": "4px", "display": "flex", "align-items": "center", "gap": "6px", "color": "var(--t-warning)" } }, [
              vue.createTextVNode("公告 · "),
              vue.createTextVNode(vue.toDisplayString(announce.value.title), 1)
            ]),
            vue.createTextVNode(vue.toDisplayString(announce.value.text), 1)
          ])) : vue.createCommentVNode("", true),
          // >>> FX-STRIP:promo
          vue.createElementVNode("div", { class: "home-section", style: {"margin-top":"8px"} }, [
            vue.createElementVNode("div", { class: "section-title" }, "推广返利"),
            vue.createElementVNode("a", {
              class: "home-card-btn",
              href: "https://xs.openget.cn/user?section=promotion",
              target: "_blank"
            }, "去推广赚钱")
          ]),
          // <<< FX-STRIP:promo
          // >>> FX-STRIP:qq-channel
          vue.createElementVNode("div", { class: "home-section", style: {"margin-top":"8px"} }, [
            vue.createElementVNode("div", { class: "section-title" }, "QQ频道"),
            vue.createElementVNode("a", {
              class: "home-card-btn",
              href: "https://pd.qq.com/s/ga2bgmmf8",
              target: "_blank",
              style: { "background": "linear-gradient(135deg,#12b7f5,#0a6bff)", "border": "1px solid rgba(255,255,255,.35)" }
            }, [
              vue.createTextVNode("加入腾讯频道【学神助手】"),
              vue.createElementVNode("span", { style: { "display": "block", "font-size": "11px", "font-weight": "400", "opacity": ".9", "margin-top": "2px" } }, "频道号 pd22434767 · 点击立即加入")
            ])
          ]),
          // <<< FX-STRIP:qq-channel
          vue.createElementVNode("div", {
            class: "home-section collapsible-section",
            style: {"margin-top":"8px"}
          }, [
            vue.createElementVNode("div", {
              class: "section-title",
              title: "点击展开/收起",
              onClick: () => showTips.value = !showTips.value
            }, [
              vue.createTextVNode("使用提示"),
              vue.createElementVNode("span", {
                class: "collapse-icon"
              }, vue.toDisplayString(showTips.value ? "−" : "+"), 1)
            ])
          ]),
          showTips.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: "tips-content",
            style: { "margin": "0 8px 10px", "padding": "10px 12px", "background": "var(--t-surface)", "border": "1px solid var(--t-border)", "border-radius": "6px" }
          }, [
            vue.createElementVNode("ul", null, [
              // >>> FX-STRIP:scriptcat-update
              vue.unref(scriptInfo).version !== vue.unref(latestVersion) ? (vue.openBlock(), vue.createElementBlock("li", _hoisted_3$5, _cache[0] || (_cache[0] = [
                vue.createTextVNode("检测到脚本非最新版本，"),
                vue.createElementVNode("a", {
                  href: "https://scriptcat.org/zh-CN/script-show-page/2827",
                  target: "_blank"
                }, "点我更新", -1)
              ]))) : vue.createCommentVNode("", true),
              // <<< FX-STRIP:scriptcat-update
              _cache[1] || (_cache[1] = vue.createElementVNode("li", null, "请手动进入视频、作业、考试页面，脚本会自动运行。", -1)),
              _cache[2] || (_cache[2] = vue.createElementVNode("li", null, [
                vue.createTextVNode("如脚本无法正常运行，请使用 "),
                vue.createElementVNode("a", {
                  target: "_blank",
                  href: "https://www.google.com/intl/zh-CN/chrome/"
                }, "Chrome"),
                vue.createTextVNode(" 、 "),
                vue.createElementVNode("a", {
                  target: "_blank",
                  href: "https://www.firefox.com/"
                }, "火狐浏览器")
              ], -1)),
              vue.unref(chatWebUrl) ? (vue.openBlock(), vue.createElementBlock("li", {
                key: 1,
                innerHTML: vue.unref(chatWebUrl)
              }, null, 8, _hoisted_4$5)) : vue.createCommentVNode("", true)
            ])
          ])) : vue.createCommentVNode("", true),
          vue.createElementVNode("div", {
            class: "home-section collapsible-section",
            style: {"margin-top":"8px"}
          }, [
            vue.createElementVNode("div", {
              class: "section-title",
              title: "点击展开/收起",
              onClick: () => showTutorial.value = !showTutorial.value
            }, [
              vue.createTextVNode("使用教程"),
              vue.createElementVNode("span", {
                class: "collapse-icon"
              }, vue.toDisplayString(showTutorial.value ? "−" : "+"), 1)
            ])
          ]),
          showTutorial.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: "tutorial-content",
            style: { "margin": "0 8px 10px", "padding": "10px 12px", "background": "var(--t-surface)", "border": "1px solid var(--t-border)", "border-radius": "6px" }
          }, [
            vue.createElementVNode("ol", null, [
              vue.createElementVNode("li", null, "打开任意网课平台，等待脚本加载。"),
              vue.createElementVNode("li", null, "如果自动答题搜索不到，可尝试在线搜索，答案基本都有。"),
              vue.createElementVNode("li", null, "如果不支持当前网课，则不会有相应的提示以及设置面板。"),
              vue.createElementVNode("li", null, [
                vue.createElementVNode("span", null, "最后温馨提示: "),
                vue.createElementVNode("div", null, "- 禁止与其他脚本一起使用，否则出现答案选不上或者页面卡死，无限刷新，等问题一律后果自负。"),
                vue.createElementVNode("div", null, "- 请将浏览器页面保持最大化，或者缩小窗口，不能最小化，否则可能导致脚本卡死！")
              ])
            ])
          ])) : vue.createCommentVNode("", true),
        ]);
      };
    }
  };
  const ScriptHome = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-137ea562"]]);
  // 「模糊题手动选择」：最近一次带填题逻辑的处理器把自己登记在这里，
  // 这样「题目结果」里点选候选题时能用页面原本的填充逻辑（含超星/智慧树各自的点击方式）。
  const _questionFillHook = { handler: null };
  const registerQuestionFillHook = (handler) => {
    _questionFillHook.handler = handler || null;
  };
  const getQuestionFillHook = () => _questionFillHook.handler;
  // 手动选择完成后通知答题流程：等待中的 loop 会继续，搁置的提交/切章会补上
  const _manualPickListeners = /* @__PURE__ */ new Set();
  const onManualPickResolved = (fn) => {
    _manualPickListeners.add(fn);
    return () => _manualPickListeners.delete(fn);
  };
  const notifyManualPickResolved = (questionNo) => {
    for (const fn of _manualPickListeners) {
      try { fn(questionNo); } catch (_) { }
    }
  };
  const applyPickedCandidate = (index, candidate) => {
    const questionStore = useQuestionStore();
    const question = questionStore.questionList[index];
    const hook = getQuestionFillHook();
    if (!question || !hook || !hook.questions || !hook.questions[index]) return false;
    const real = hook.questions[index];
    const answer = normalizeLocalBackendAnswers(candidate && candidate.answer);
    if (!answer.length) return false;
    real.answer = { code: 1, answer, src: "bank" };
    question.answer = { code: 1, answer, src: "bank" };
    const filled = hook.fillQuestion(real, index);
    questionStore.questionList = [...questionStore.questionList];
    return !!filled;
  };
  const useQuestionStore = pinia.defineStore("questionStore", {
    state: () => ({
      questionList: [],
      currentQuestionIndex: 0,
      accuracy: -1,
      searchText: "",
      fuzzySearchResult: []
    }),
    actions: {
      clearQuestion() {
        this.questionList = [];
      },
      clearFuzzySearchResult() {
        this.fuzzySearchResult = [];
      }
    }
  });
  const _hoisted_1$6 = { class: "answer-wrap" };
  const _hoisted_2$5 = { class: "tips" };
  const _hoisted_3$4 = { class: "answer-tips" };
  const _hoisted_4$4 = { style: { "margin-bottom": "10px" } };
  const _hoisted_5$4 = { key: 0 };
  const _hoisted_6$4 = { key: 1 };
  const _hoisted_7$4 = { key: 2 };
  const _hoisted_8$4 = {
    key: 0,
    style: { "text-align": "center" }
  };
  const _hoisted_9$4 = { key: 1 };
  const _hoisted_10$2 = { class: "answer-list" };
  const _hoisted_11$2 = ["onClick"];
  const _hoisted_12$2 = { key: 0 };
  const _hoisted_13$1 = ["innerHTML"];
  const _hoisted_14$1 = { class: "answer-content" };
  const _hoisted_15 = ["innerHTML"];
  const _hoisted_16 = {
    key: 0,
    style: { "color": "#f94f17" }
  };
  const _sfc_main$7 = {
    __name: "AutoAnswer",
    emits: ["changeTab"],
    setup(__props, { emit: __emit }) {
      const codeMap = {
        1: "success",
        "-1": "default",
        2: "ai-success"
      };
      const questionStore = useQuestionStore();
      const selectedIndex = vue.ref(0);
      const answerDom = vue.ref(null);
      const setting = useSettingStore();
      const {
        questionList,
        currentQuestionIndex: currentIndex,
        accuracy
      } = pinia.storeToRefs(questionStore);
      const {
        userInfo
      } = pinia.storeToRefs(setting);
      const emit = __emit;
      const goSetting = () => {
        window.open(setting.shopLink || "https://xs.openget.cn/user?section=account", "_blank");
      };
      const tokenReady = vue.computed(() => {
        const remain = String(setting.userInfo.remainCount || "");
        return !!setting.config.basicConfig.token.value && remain && !["密钥未配置", "密钥无效", "null"].includes(remain);
      });
      const checkAnswer = (index) => {
        if (index > currentIndex.value) return;
        const dom = answerDom.value.getElementsByClassName("answer-item")[index];
        answerDom.value.scrollTo({ top: dom.offsetTop });
        selectedIndex.value = index;
      };
      const pickCandidate = (qIndex, candidate) => {
        const filled = applyPickedCandidate(qIndex, candidate);
        const q = questionList.value[qIndex];
        if (q && q.answer) {
          q.answer.picked = filled;
          if (filled) q.answer.code = 1;
        }
        questionList.value = [...questionList.value];
        useLogStore().insertLog(filled ? `第${qIndex + 1}题已按你选中的候选题填入答案` : `第${qIndex + 1}题候选答案没点上去，请手动勾选`, filled ? undefined : "warning");
        if (filled) notifyManualPickResolved(qIndex + 1);
      };
      return (_ctx, _cache) => {
        const _component_a_button = vue.resolveComponent("a-button");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$6, [
          vue.createElementVNode("div", _hoisted_2$5, [
            vue.createElementVNode("ul", null, [
              vue.createElementVNode("li", null, [
                _cache[1] || (_cache[1] = vue.createTextVNode(" 使用自动答题功能，请先 ")),
                vue.createVNode(_component_a_button, {
                  onClick: goSetting,
                  size: "small",
                  type: "primary",
                  danger: tokenReady.value
                }, {
                  icon: vue.withCtx(() => [
                    vue.createVNode(vue.unref(SettingOutlined))
                  ]),
                  default: vue.withCtx(() => [
                    vue.createTextVNode(vue.toDisplayString(tokenReady.value ? "已配置密钥" : "登录用户中心获取密钥"), 1)
                  ]),
                  _: 1
                })
              ]),
              _cache[2] || (_cache[2] = vue.createElementVNode("li", null, "如需手动答题，建议关闭自动切换功能", -1)),
              _cache[3] || (_cache[3] = vue.createElementVNode("li", null, "每次自动答题开始前，都会清空上一次的搜索结果", -1))
            ])
          ]),
          _cache[10] || (_cache[10] = vue.createElementVNode("div", {
            class: "separator",
            style: { "margin": "5px 0" }
          }, null, -1)),
          vue.createElementVNode("div", _hoisted_3$4, [
            vue.createElementVNode("div", _hoisted_4$4, [
              vue.createElementVNode("span", null, "答题进度：" + vue.toDisplayString(vue.unref(currentIndex)) + " / " + vue.toDisplayString(vue.unref(questionList).length), 1),
              _cache[5] || (_cache[5] = vue.createElementVNode("span", null, "｜", -1)),
              vue.createElementVNode("span", null, [
                _cache[4] || (_cache[4] = vue.createTextVNode(" 准确率： ")),
                vue.unref(questionList).length == 0 ? (vue.openBlock(), vue.createElementBlock("span", _hoisted_5$4, "未答题")) : vue.unref(accuracy) != -1 ? (vue.openBlock(), vue.createElementBlock("span", _hoisted_6$4, vue.toDisplayString(vue.unref(accuracy)) + "%", 1)) : (vue.openBlock(), vue.createElementBlock("span", _hoisted_7$4, "作业中.."))
              ]),
              _cache[6] || (_cache[6] = vue.createElementVNode("span", null, "｜", -1)),
              vue.createElementVNode("span", null, "剩余次数：" + vue.toDisplayString(vue.unref(userInfo).remainCount), 1)
            ]),
            _cache[7] || (_cache[7] = vue.createStaticVNode('<div class="box-tips"><div class="search-info searching"></div><span>搜索中</span><div class="search-info success"></div><span>题库答案</span><div class="search-info ai-success"></div><span>AI答案</span><div class="search-info warning"></div><span>异常</span></div>', 1))
          ]),
          _cache[11] || (_cache[11] = vue.createElementVNode("div", {
            class: "separator",
            style: { "margin": "5px 0" }
          }, null, -1)),
          vue.unref(questionList).length == 0 ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_8$4, " ❗️ 未检测到试题 ")) : (vue.openBlock(), vue.createElementBlock("div", _hoisted_9$4, [
            vue.createElementVNode("div", _hoisted_10$2, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(questionList), (question, index) => {
                var _a;
                return vue.openBlock(), vue.createElementBlock("div", {
                  onClick: ($event) => checkAnswer(index),
                  class: vue.normalizeClass(`search-info ${index === vue.unref(currentIndex) ? "searching" : ""} ${codeMap[(_a = question.answer) == null ? void 0 : _a.code] || "warning"}`),
                  key: index
                }, vue.toDisplayString(index + 1), 11, _hoisted_11$2);
              }), 128))
            ]),
            _cache[9] || (_cache[9] = vue.createElementVNode("div", {
              class: "separator",
              style: { "margin": "5px 0" }
            }, null, -1)),
            vue.unref(questionList).length != 0 ? (vue.openBlock(), vue.createElementBlock("div", {
              key: 0,
              ref_key: "answerDom",
              ref: answerDom,
              class: "answer-detail"
            }, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(currentIndex), (index) => {
                var _a, _b, _c, _d;
                return vue.openBlock(), vue.createElementBlock("div", {
                  class: "answer-item",
                  key: index
                }, [
                  index <= vue.unref(questionList).length ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_12$2, [
                    vue.createElementVNode("div", null, [
                      vue.createElementVNode("span", null, vue.toDisplayString(index) + ".", 1),
                      vue.createElementVNode("div", {
                        style: { "display": "inline-block" },
                        innerHTML: vue.unref(questionList)[index - 1].title
                      }, null, 8, _hoisted_13$1)
                    ]),
                    vue.createElementVNode("div", _hoisted_14$1, [
                      _cache[8] || (_cache[8] = vue.createElementVNode("span", null, "答案：", -1)),
                      vue.createElementVNode("div", {
                        innerHTML: (_b = (_a = vue.unref(questionList)[index - 1].answer) == null ? void 0 : _a.answer) == null ? void 0 : _b.join()
                      }, null, 8, _hoisted_15),
                      ((_c = vue.unref(questionList)[index - 1].answer) == null ? void 0 : _c.code) === 0 ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_16, "有答案（不完全匹配），请手动选择")) : vue.createCommentVNode("", true),
                      ((_d = vue.unref(questionList)[index - 1].answer) == null ? void 0 : _d.msg) ? (vue.openBlock(), vue.createElementBlock("div", {
                        key: 1,
                        style: { "color": "var(--t-text3)", "font-size": "12px", "margin-top": "2px", "word-break": "break-all" }
                      }, vue.toDisplayString(_d.msg), 1)) : vue.createCommentVNode("", true),
                      (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList((_a = vue.unref(questionList)[index - 1].answer) === null || _a === void 0 ? void 0 : _a.candidates, (cand, candIdx) => {
                        return vue.openBlock(), vue.createElementBlock("div", {
                          key: "cand-" + candIdx,
                          onClick: ($event) => pickCandidate(index - 1, cand),
                          style: { "margin-top": "6px", "padding": "6px 8px", "border": "1px solid var(--t-border)", "border-radius": "6px", "cursor": "pointer", "background": "var(--t-surface)" }
                        }, [
                          vue.createElementVNode("div", { style: { "font-weight": "600", "margin-bottom": "2px" } }, "候选" + (candIdx + 1) + "（相似度 " + vue.toDisplayString(cand.score) + "%）", 1),
                          vue.createElementVNode("div", { innerHTML: cand.question }, null, 8, ["innerHTML"]),
                          vue.createElementVNode("div", { innerHTML: "答案：" + vue.toDisplayString(cand.answer) }, null, 8, ["innerHTML"]),
                          vue.createElementVNode("div", { style: { "color": "var(--t-primary)", "margin-top": "2px" } }, "点击填入本题", 1)
                        ], 8, ["onClick"]);
                      }), 128))
                    ])
                  ])) : vue.createCommentVNode("", true)
                ]);
              }), 128))
            ], 512)) : vue.createCommentVNode("", true)
          ]))
        ]);
      };
    }
  };
  const _hoisted_1$5 = { class: "config-wrap" };
  const _hoisted_2$4 = { class: "tips" };
  const _hoisted_3$3 = { class: "buy-btn" };
  const _hoisted_4$3 = ["href"];
  const _hoisted_5$3 = { class: "separator" };
  const _hoisted_6$3 = {
    key: 0,
    class: "config"
  };
  const _hoisted_7$3 = { class: "config-name" };
  const _hoisted_8$3 = { class: "config-input" };
  const _hoisted_9$3 = { key: 5 };
  const _sfc_main$6 = {
    __name: "UserConfig",
    emits: ["autoRefreshPage"],
    setup(__props, { emit: __emit }) {
      const setting = useSettingStore();
      const { shopLink } = pinia.storeToRefs(setting);
      const emit = __emit;
      // 只显示当前平台真正有的功能：答题类只在超星/智慧树/青书/出头出现，
      // 视频类只在对应平台出现，名称里不再挂「（智慧树）」「（新增平台）」后缀
      const configSections = vue.computed(() => {
        const platformKey = resolvePlatformKey();
        const pick = (group) => {
          const result = {};
          Object.entries(group || {}).forEach(([name, field]) => {
            if (!field || typeof field !== "object") return;
            if (Array.isArray(field.platforms) && !field.platforms.includes(platformKey)) return;
            result[name] = field;
          });
          return result;
        };
        const isWatchSite = WATCH_PLATFORM_KEYS.includes(platformKey);
        const sections = [
          { label: "基本设置", configs: pick(setting.config.basicConfig), showRemainCount: true }
        ];
        if (!isWatchSite) sections.push({ label: "考试设置", configs: pick(setting.config.examConfig) });
        if (platformKey === "cx") sections.push({ label: "超星设置", configs: pick(setting.config.cxConfig) });
        return sections;
      });
      const remainDisplay = vue.computed(() => {
        const ui = setting.userInfo;
        if (ui.activeMember && ui.memberUntil) {
          return { label: "包月到期：", value: ui.memberUntil.split(" ")[0], isMember: true };
        }
        const balance = Number(ui.pointsBalance || ui.remainCount || 0);
        if (balance >= 999999 || String(ui.remainCount) === "无限") {
          return { label: "剩余次数：", value: "无限", isMember: false };
        }
        return { label: "剩余次数：", value: balance + " 次", isMember: false };
      });
      vue.watch(
        () => setting.config.basicConfig.token,
        (newVal) => {
          try {
            _GM_setValue("setting", JSON.stringify(setting.$state || setting));
          } catch (_) {
          }
          setTimeout(() => window.location.reload(), 350);
        },
        {
          deep: true
        }
      );
      vue.watch(
        () => setting.config.basicConfig.videoPlayrate,
        (newVal) => {
          const rate = newVal && newVal.value;
          if (rate) {
            applyVideoRateToPage(rate);
            useLogStore().insertLog(`已更新视频倍速为 ${rate}x（无需刷新页面）`);
          }
        },
        {
          deep: true
        }
      );

      const formatter = (value) => {
        return `${value}%`;
      };
      const closeAllAuto = () => {
        const hasAnyEnabled = setting.config.basicConfig.autoSubmit.value || setting.config.basicConfig.autoChangeChapter.value || setting.config.basicConfig.skipFinishedChapter.value || setting.config.basicConfig.autoAnswer.value || setting.config.examConfig.autoSubmit.value || setting.config.basicConfig.autoRefresh.value || setting.config.basicConfig.watchAssist.value;
        const newState = !hasAnyEnabled;
        setting.config.basicConfig.autoSubmit.value = newState;
        setting.config.basicConfig.autoChangeChapter.value = newState;
        setting.config.basicConfig.skipFinishedChapter.value = newState;
        setting.config.basicConfig.autoAnswer.value = newState;
        setting.config.examConfig.autoSubmit.value = newState;
        setting.config.basicConfig.autoRefresh.value = newState;
        setting.config.basicConfig.watchAssist.value = newState;
      };
      return (_ctx, _cache) => {
        const _component_a_slider = vue.resolveComponent("a-slider");
        const _component_a_input_number = vue.resolveComponent("a-input-number");
        const _component_a_switch = vue.resolveComponent("a-switch");
        const _component_a_input = vue.resolveComponent("a-input");
        const _component_a_select = vue.resolveComponent("a-select");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$5, [
          vue.createElementVNode("div", _hoisted_2$4, [
            vue.createElementVNode("ul", null, [
              vue.createElementVNode("li", null, [
                _cache[0] || (_cache[0] = vue.createTextVNode("自动答题功能需填写密钥， ")),
                vue.createElementVNode("span", _hoisted_3$3, [
                  vue.createVNode(vue.unref(BulbOutlined), { style: { "color": "#fff", "margin-right": "2px" } }),
                  vue.createElementVNode("a", {
                    href: vue.unref(shopLink),
                    target: "_blank"
                  }, "点我登录用户中心获取密钥 ", 8, _hoisted_4$3)
                ])
              ]),
              _cache[6] || (_cache[6] = vue.createElementVNode("li", null, "设置后进入章节测试，作业，考试页面即可自动答题", -1)),
              vue.createElementVNode("li", null, [
                _cache[1] || (_cache[1] = vue.createTextVNode("使用")),
                _cache[2] || (_cache[2] = vue.createElementVNode("span", { style: { "color": "#ef4444" } }, "AI、在线搜题", -1)),
                _cache[3] || (_cache[3] = vue.createTextVNode("，")),
                _cache[4] || (_cache[4] = vue.createElementVNode("span", { style: { "color": "#ef4444" } }, "关闭所有自动操作", -1)),
                _cache[5] || (_cache[5] = vue.createTextVNode("，防止冲突。 ")),
                vue.createElementVNode("span", {
                  onClick: closeAllAuto,
                  class: "buy-btn"
                }, "一键关闭/开启")
              ]),
              _cache[7] || (_cache[7] = vue.createElementVNode("li", null, [
                vue.createTextVNode("⚠️视频中出现题目，可以忽略，"),
                vue.createElementVNode("span", { style: { "color": "#ef4444" } }, "不影响学习进度")
              ], -1))
            ])
          ]),
          (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(configSections.value, (section) => {
            return vue.openBlock(), vue.createElementBlock(vue.Fragment, {
              key: section.label
            }, [
              vue.createElementVNode("div", _hoisted_5$3, vue.toDisplayString(section.label), 1),
              vue.createElementVNode("div", null, [
                section.showRemainCount ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_6$3, [
                  vue.createElementVNode("div", { style: { "color": "var(--t-text2)" } }, vue.toDisplayString(remainDisplay.value.label), 1),
                  vue.createElementVNode("a", {
                    href: __billHref || void 0,  // FX-CH:remain-billing
                    title: __billHref ? void 0 : __noShopTip,
                    target: "_blank",
                    style: { "color": remainDisplay.value.isMember ? "var(--t-primary)" : "var(--t-text)", "text-decoration": "none" }
                  }, vue.toDisplayString(remainDisplay.value.value + (__billHref ? "" : "（需卡密激活）")), 1)
                ])) : vue.createCommentVNode("", true),
                (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(section.configs, (config2) => {
                  return vue.openBlock(), vue.createElementBlock("div", { key: config2 }, [
                    vue.createElementVNode("div", {
                      class: vue.normalizeClass(["config", config2.type === "switch" ? "switch-item" : ""])
                    }, [
                      vue.createElementVNode("div", _hoisted_7$3, vue.toDisplayString(config2.text), 1),
                      vue.createElementVNode("div", _hoisted_8$3, [
                        config2.type === "slider" ? (vue.openBlock(), vue.createBlock(_component_a_slider, {
                          key: 0,
                          value: config2.value,
                          "onUpdate:value": ($event) => config2.value = $event,
                          "tip-formatter": formatter
                        }, null, 8, ["value", "onUpdate:value"])) : config2.type === "input-number" ? (vue.openBlock(), vue.createBlock(_component_a_input_number, {
                          key: 1,
                          precision: config2.precision,
                          step: config2.step,
                          value: config2.value,
                          onChange: ($event) => {
                            if ($event !== null && $event !== undefined) config2.value = $event;
                          },
                          min: config2.min,
                          max: config2.max
                        }, null, 8, ["value", "onChange", "min", "max", "precision", "step"])) : config2.type === "switch" ? (vue.openBlock(), vue.createBlock(_component_a_switch, {
                          key: 2,
                          size: "small",
                          checked: config2.value,
                          "onUpdate:checked": ($event) => config2.value = $event
                        }, null, 8, ["checked", "onUpdate:checked"])) : config2.type === "input" ? (vue.openBlock(), vue.createBlock(_component_a_input, {
                          key: 3,
                          value: config2.value,
                          "onUpdate:value": ($event) => config2.value = $event,
                          valueModifiers: { lazy: true, trim: true },
                          placeholder: config2.placeholder
                        }, null, 8, ["value", "onUpdate:value", "placeholder"])) : config2.type === "select" ? (vue.openBlock(), vue.createBlock(_component_a_select, {
                          key: 4,
                          style: { "width": "100px" },
                          ref_for: true,
                          ref: "select",
                          value: config2.value,
                          "onUpdate:value": ($event) => config2.value = $event,
                          options: config2.options
                        }, null, 8, ["value", "onUpdate:value", "options"])) : (vue.openBlock(), vue.createElementBlock("span", _hoisted_9$3, vue.toDisplayString(config2.value), 1))
                      ])
                    ], 2)
                  ]);
                }), 128))
              ])
            ], 64);
          }), 128))
        ]);
      };
    }
  };
  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms * 1e3));
  };
  const STORAGE_KEY = "answerRecords";
  const MAX_RECORDS = 200;
  const normalizeText = (value = "") => String(value).replace(/\s+/g, " ").trim();
  const normalizeOptions = (options = []) => [...Array.isArray(options) ? options : []].map((item) => normalizeText(item)).filter(Boolean).sort();
  const formatRequestTime = (timestamp) => {
    const date = new Date(timestamp);
    const pad3 = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad3(date.getMonth() + 1)}-${pad3(date.getDate())} ${pad3(date.getHours())}:${pad3(date.getMinutes())}:${pad3(date.getSeconds())}`;
  };
  const createAnswerRecordCacheKey = (question) => JSON.stringify({
    title: normalizeText(question == null ? void 0 : question.title),
    type: normalizeText(question == null ? void 0 : question.type),
    optionsText: normalizeOptions(question == null ? void 0 : question.optionsText)
  });
  const loadRecords = () => {
    try {
      const records = JSON.parse(_GM_getValue(STORAGE_KEY) || "[]");
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.log("load answer records error:", error);
      return [];
    }
  };
  const useAnswerRecordStore = pinia.defineStore("answerRecord", {
    state: () => ({
      records: loadRecords()
    }),
    getters: {
      displayRecords: (state) => state.records
    },
    actions: {
      persistRecords() {
        _GM_setValue(STORAGE_KEY, JSON.stringify(this.records));
      },
      insertRecord({ question, answer, token, source }) {
        const timestamp = Date.now();
        const record = {
          cacheKey: createAnswerRecordCacheKey(question),
          token: token || "",
          title: (question == null ? void 0 : question.title) || "",
          requestTime: formatRequestTime(timestamp),
          timestamp,
          answer: Array.isArray(answer) ? answer : [],
          type: (question == null ? void 0 : question.type) || "",
          optionsText: Array.isArray(question == null ? void 0 : question.optionsText) ? question.optionsText : [],
          workType: (question == null ? void 0 : question.workType) || "",
          refer: (question == null ? void 0 : question.refer) || "",
          source: source || "accurate"
        };
        this.records.unshift(record);
        this.records = this.records.slice(0, MAX_RECORDS);
        this.persistRecords();
        return record;
      },
      clearRecords() {
        this.records = [];
        this.persistRecords();
      }
    }
  });
  const getApiBaseUrl = () => {
    return "https://xs.openget.cn";
  };
  const LOCAL_BACKEND_ANSWER_URL = "https://xs.openget.cn/api/v1/cx";
  const LOCAL_BACKEND_SEARCH_URL = "https://xs.openget.cn/api/web/search";
  const TIMEOUT_ERROR_MSG$1 = "请求超时，请前往设置尝试切换节点..";
  const SERVER_MAINTENANCE_ERROR_MSG$1 = "服务器维护中，请前往设置尝试切换节点，自动学习功能正常使用..";
  const handleError$1 = (msg) => ({
    code: 10003,
    data: {
      answer: [],
      num: "",
      usenum: ""
    },
    msg
  });
  const getCookieValue = (name) => {
    const pageWindow = _unsafeWindow || window;
    if (typeof pageWindow.getCookie === "function") {
      return pageWindow.getCookie(name) || "";
    }
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  };
  const getLocalBackendToken = () => {
    const keys = [
      "GPTJsSetting.token",
      "chaoxing.com:GPTJsSetting.token",
      "mooc1.chaoxing.com:GPTJsSetting.token"
    ];
    for (const key of keys) {
      try {
        const v = localStorage.getItem(key);
        if (v) return v;
      } catch (_) {
      }
      try {
        const v = _GM_getValue ? _GM_getValue(key) : "";
        if (v) return v;
      } catch (_) {
      }
    }
    try {
      const raw = localStorage.getItem("GPTJsSetting.userInfo") || localStorage.getItem("chaoxing.com:GPTJsSetting.userInfo");
      const obj = raw ? JSON.parse(raw) : null;
      if (obj && obj.token) return obj.token;
    } catch (_) {
    }
    return "";
  };
  // 题型归一化：平台给的题型常带修饰（如「多项选择题」「多选题(2分)」），
  // 统一成后端认识的规范名称，避免多选被当成单选、只答一项
  const XS_TYPE_RULES = [
    { keywords: ["多选", "多项选择", "不定项", "X型"], name: "多选题" },
    { keywords: ["判断", "是非"], name: "判断题" },
    { keywords: ["填空", "完型", "完形"], name: "填空题" },
    { keywords: ["名词解释"], name: "名词解释" },
    { keywords: ["连线", "匹配"], name: "连线题" },
    { keywords: ["阅读理解"], name: "阅读理解" },
    { keywords: ["简答"], name: "简答题" },
    { keywords: ["论述"], name: "论述题" },
    { keywords: ["计算"], name: "计算题" },
    { keywords: ["单选", "单项选择", "A1型", "A2型", "A3型"], name: "单选题" }
  ];
  const normalizeQuestionTypeName = (type) => {
    const raw = String(type == null ? "" : type).trim();
    if (!raw) return "";
    if (/^\d{1,3}$/.test(raw)) return raw;
    if (/^[a-zA-Z]{3,}$/.test(raw)) return raw;
    const hit = XS_TYPE_RULES.find((rule) => rule.keywords.some((keyword) => raw.includes(keyword)));
    return hit ? hit.name : raw;
  };
  // 题型文字缺失或不准时的兜底：题目区域内出现复选框样式就按多选题处理，
  // 否则多选会被当成单选，只填一个选项
  const detectMultiChoiceDom = (root) => {
    if (!root || !root.querySelector) return false;
    if (root.nodeType === 9) return false;   // document 级容器会扫到别题的控件，不能作为依据
    try {
      if (root.querySelector("input[type='radio'], [role='radio']")) return false;
      if (root.querySelector("input[type='checkbox'], [role='checkbox']")) return true;
      const nodes = root.querySelectorAll("[class*='option'], [class*='Option'], label, li, [class*='checkbox']");
      for (const node of nodes) {
        const cls = String((node && node.className) || "");
        if (/el-checkbox-group|checkbox-views|checkbox-list|is-checkbox/i.test(cls)) return true;
      }
    } catch (_) {
    }
    return false;
  };
  const normalizeLocalBackendAnswers = (answer) => {
    if (Array.isArray(answer)) return answer.map((x) => String(x).trim()).filter(Boolean);
    const text = String(answer || "").replace(/。$/, "").trim();
    if (!text) return [];
    // 题库/模型偶尔给出 Python 字面量 "['北京', '上海']"，JSON.parse 不认单引号，先按字面量拆
    if (/^\[\s*'/.test(text) && /'\s*\]$/.test(text)) {
      const items = [];
      const re = /'((?:[^'\\]|\\.)*)'/g;
      let quoted;
      while ((quoted = re.exec(text))) {
        const item = quoted[1].replace(/\\(.)/g, "$1").trim();
        if (item) items.push(item);
      }
      if (items.length) return items;
    }
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    } catch (_) {
    }
    // 处理无分隔符的连续字母序列，如 "ABCD"/"ABCDE" → ["A","B","C","D","E"]
    // 只拆「全大写 + 严格递增」：小写词（apple）与乱序大写词（HTTP、DNA）都是填空/简答内容，
    // 拆成字母会点错选项；多选答案按字母序给，乱序说明它是一个词。
    if (/^[A-Z]{2,10}$/.test(text) && [...text].every((c, i) => i === 0 || c > text[i - 1])) {
      return text.split("").filter(Boolean);
    }
    // "A 正确" / "A、C 正确"：开头是选项字母、后面紧跟中文说明时按字母取，别整句丢给匹配。
    // 限定「短 + 中文收尾」：H2O（跟数字）与 SWOT 式简答长句都不是选项字母。
    const headLetters = (text.match(/^[A-Z](?:[\s、,，]?\s*[A-Z])*(?=[^A-Za-z]|$)/) || [""])[0];
    const headSeq = headLetters.replace(/[\s、,，]+/g, "").split("").filter(Boolean);
    const headTail = text.slice(headLetters.length);
    if (headSeq.length && text.length <= 12 && /^[\s、,，(（:：.。-]*[\u4e00-\u9fff]/.test(headTail)) {
      return headSeq;
    }
    if (/^[A-Z](?:[\s,，、;；|]+[A-Z])+$/.test(text.toUpperCase())) {
      return text.toUpperCase().split(/[\s,，、;；|]+/).filter(Boolean);
    }
    // 文本答案不再按分隔符拆分（选项内容可能包含任何标点），保留完整字符串由 fillChoice 子串匹配
    return [text];
  };
  const getImgUrlKey = (url) => {
    const clean = String(url || "").split(/[?#]/)[0].replace(/\/+$/, "");
    const seg = (clean.split("/").pop() || clean).replace(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i, "");
    return seg.toLowerCase();
  };
  const collectImgSrcs = (htmlOrEl) => {
    const out = [];
    const push = (u) => {
      const s = String(u || "").trim();
      if (s && !out.includes(s)) out.push(s);
    };
    if (htmlOrEl && htmlOrEl.querySelectorAll) {
      htmlOrEl.querySelectorAll("img").forEach((img) => push(img.getAttribute("data-src") || img.currentSrc || img.src || ""));
    }
    const s = typeof htmlOrEl === "string" ? htmlOrEl : "";
    const re = /<img[^>]+src=["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(s))) push(m[1]);
    if (s && /https?:\/\//i.test(s) && !/<img/i.test(s)) {
      (s.match(/https?:\/\/[^\s"'<>]+/gi) || []).forEach((u) => {
        if (/ananas\.chaoxing\.com|\/origin\/|\.(?:jpg|jpeg|png|gif|webp)(?:$|[?#])/i.test(u)) push(u);
      });
    }
    return out;
  };
  const imgSrcsMatch = (aSrcs, bSrcs) => {
    for (const a of aSrcs || []) {
      const ak = getImgUrlKey(a);
      if (!ak) continue;
      for (const b of bSrcs || []) {
        const bk = getImgUrlKey(b);
        if (ak === bk || (ak.length >= 8 && bk.length >= 8 && (ak.includes(bk) || bk.includes(ak)))) return true;
      }
    }
    return false;
  };
  const buildLocalBackendQuestionPayload = (question) => {
    return JSON.stringify({
      question: question.title || "",
      options: question.optionsText || [],
      type: question.type || "",
      platform: "abc-helper",
      refer: question.refer || location.href
    });
  };
  const getProfileRemainingCount = (profile) => {
    if (!profile) return 0;
    if (profile.active_member) return "无限";
    return Number(profile.points_balance || profile.remaining || 0);
  };
  const updateUserInfoFromProfile = (profile) => {
    try {
      const setting = useSettingStore();
      if (profile) {
        setting.userInfo.activeMember = !!profile.active_member;
        setting.userInfo.memberUntil = profile.member_until || "";
        setting.userInfo.pointsBalance = Number(profile.points_balance || 0);
      }
    } catch (_) {}
  };
  const formatLocalRemainCount = (value) => {
    if (value === "无限") return "无限";
    const n = Number(value || 0);
    return n >= 999999 ? "无限" : n;
  };
  const fetchLocalBackendProfile = async (token) => {
    token = token || "";
    if (!token) return null;
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        url: "https://xs.openget.cn/api/user/profile?v=xs-5.0",
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        },
        timeout: 15e3,
        onload: (response) => {
          try {
            const obj = JSON.parse(response.responseText || "{}");
            resolve(obj.code === 200 ? obj.profile : null);
          } catch (_) {
            resolve(null);
          }
        },
        onerror: () => resolve(null),
        ontimeout: () => resolve(null)
      });
    });
  };
  const _downloadImg = (url) => new Promise((resolve) => {
    if (/^data:image\/[^;]+;base64,/i.test(String(url))) { resolve(url); return; }
    if (!url || String(url).startsWith("blob:")) {
      resolve(null);
      return;
    }
    GM_xmlhttpRequest({
      url, method: 'GET', responseType: 'arraybuffer', timeout: 15000,
      onload: (res) => {
        try {
          if (res.status < 200 || res.status >= 300) { resolve(null); return; }
          const bytes = new Uint8Array(res.response);
          if (!bytes.length) { resolve(null); return; }
          let binary = '';
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk)
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
          const type = (res.responseHeaders.match(/content-type:\s*([^\s;\r\n]+)/i) || [])[1] || 'image/jpeg';
          if (!/^image\//i.test(type)) { resolve(null); return; }
          resolve('data:' + type + ';base64,' + btoa(binary));
        } catch (e) { resolve(null); }
      },
      onerror: () => resolve(null),
      ontimeout: () => resolve(null),
    });
  });
  // 「手动选择」时的处理方式：wait=停下来等我选完再继续；skip=跳过本题、本轮不自动提交
  const getManualWaitMode = () => {
    try {
      const setting = useSettingStore();
      const cfg = setting && setting.config && setting.config.basicConfig && setting.config.basicConfig.manualWaitMode;
      return cfg && cfg.value === "skip" ? "skip" : "wait";
    } catch (_) {
      return "wait";
    }
  };
  // 等待用户在第 index 题上点选候选答案；返回选中的答案数组，超时返回 null
  const waitForManualPick = (index) => new Promise((resolve) => {
    const qs = useQuestionStore();
    const started = Date.now();
    const LIMIT = 10 * 60 * 1000;   // 最多等 10 分钟，避免挂死整个任务
    const timer = setInterval(() => {
      const q = (qs.questionList || [])[index];
      const a = q && q.answer;
      if (a && a.picked && a.answer && a.answer.length) {
        clearInterval(timer);
        resolve(a.answer);
        return;
      }
      if (Date.now() - started > LIMIT) {
        clearInterval(timer);
        resolve(null);
      }
    }, 500);
  });
  // 等待手动选择期间，自动提交/自动切章必须先停下：否则空题会被当成未作答提交，或被刷走
  const hasPendingManualPick = () => {
    try {
      const qs = useQuestionStore();
      const list = (qs && qs.questionList) || [];
      return list.some((q) => q && q.answer && q.answer.src === "pick" && !q.answer.picked);
    } catch (_) {
      return false;
    }
  };
  const getQuestionMatchMode = () => {
    try {
      const setting = useSettingStore();
      const cfg = setting && setting.config && setting.config.basicConfig && setting.config.basicConfig.matchMode;
      return cfg && cfg.value === "manual" ? "manual" : "auto";
    } catch (_) {
      return "auto";
    }
  };
  const callLocalBackendAnswer = async (question, extra = {}) => {
    const setting = useSettingStore();
    const token = setting.config.basicConfig.token.value || getLocalBackendToken() || "";
    // 提取题目中的图片并下载为 base64（DOM + 题干/选项 HTML，避免纯图题漏传）
    const images = [];
    const imageSources = [];
    const seenImg = new Set();
    const pushImgSrc = (src) => {
      const u = String(src || "").trim();
      if (!u || seenImg.has(u)) return;
      seenImg.add(u);
    };
    const el = question.element;
    if (el && el.querySelectorAll) {
      el.querySelectorAll("img").forEach((img) => pushImgSrc(img.getAttribute("data-src") || img.currentSrc || img.src || ""));
    }
    const htmlBlobs = [question.title, ...(question.optionsText || [])];
    if (question.options && typeof question.options === "object") {
      Object.values(question.options).forEach((v) => {
        if (typeof v === "string") htmlBlobs.push(v);
      });
    }
    htmlBlobs.forEach((html) => {
      const re = /<img[^>]+src=["']([^"']+)["']/gi;
      let m;
      while ((m = re.exec(String(html || "")))) pushImgSrc(m[1]);
    });
    for (const src of seenImg) {
      const dataUrl = await _downloadImg(src);
      if (!dataUrl) return { code: -1005, data: { answer: [] }, msg: "图片下载失败，请刷新题目后重试" };
      images.push(dataUrl);
      imageSources.push(src);
    }
    const payloadObj = {
      question: question.title || "",
      options: question.optionsText || [],
      type: question.type || "",
      platform: "abc-helper",
      refer: question.refer || location.href
    };
    if (images.length) { payloadObj.images = images; payloadObj.image_sources = imageSources; }
    const payload = JSON.stringify(payloadObj);
    const data = "question=" + encodeURIComponent(payload)
      + "&u=" + encodeURIComponent(getCookieValue("_uid") || getCookieValue("UID") || "")
      + "&model_mode=auto"
      + "&match_mode=" + getQuestionMatchMode()
      + (extra && extra.skipBank ? "&skip_bank=1" : "");
    const _interval = Number(extra && extra.interval);
    await sleep(Number.isFinite(_interval) && _interval >= 0 ? _interval : setting.config.basicConfig.reqIntervalTime.value);
    const result = await new Promise((resolve) => {
      GM_xmlhttpRequest({
        url: LOCAL_BACKEND_ANSWER_URL + "?v=xs-5.0",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Authorization": token ? "Bearer " + token : ""
        },
        data,
        timeout: 24e4,
        onload: (response) => {
          try {
            const obj = JSON.parse(response.responseText || "{}");
            if (obj.code === 200 && obj.data && (obj.data.answer || (obj.data.multimatch && obj.data.candidates && obj.data.candidates.length))) {
              const candidates = Array.isArray(obj.data.candidates) ? obj.data.candidates : [];
              resolve({
                code: 1,
                data: {
                  answer: normalizeLocalBackendAnswers(obj.data.answer),
                  src: obj.data.bank ? "bank" : obj.data.cache ? "cache" : obj.data.multimatch ? "pick" : "ai",
                  multimatch: !!obj.data.multimatch && candidates.length > 0,
                  candidates,
                  remainCount: obj.data.remainCount !== void 0 ? formatLocalRemainCount(obj.data.remainCount) : getProfileRemainingCount(obj.data.profile)
                },
                msg: obj.data.multimatch ? (obj.msg || "题库中有多道相似题，请手动选择") : (obj.msg || (obj.data.bank ? "题库命中" : obj.data.cache ? "缓存命中" : "本地后端返回"))
              });
              if (obj.data.profile) updateUserInfoFromProfile(obj.data.profile);
            } else if (response.status === 401 || obj.code === 401) {
              resolve(handleError$1("本地后端未登录或登录态失效，请先登录用户中心"));
            } else {
              if (response.status === 429 || obj.code === 429 || /请求过于频繁/.test(obj.msg || "")) {
                const seconds = Number(((obj.msg || "").match(/(\d+)\s*秒/) || [])[1] || 6);
                resolve({ code: -1006, msg: obj.msg || "请求限流", retryAfter: Math.min(60, Math.max(1, seconds)) });
                return;
              }
              const is200NoAnswer = obj.code === 200 && !(obj.data && obj.data.answer);
              resolve({ code: -1004, data: { answer: [], remainCount: 0 }, msg: is200NoAnswer ? "未找到答案" : (obj.msg || "本地题库未命中") });
            }
          } catch (e) {
            resolve(handleError$1("本地后端响应解析失败"));
          }
        },
        onerror: () => resolve(handleError$1("无法连接本地后端 https://xs.openget.cn")),
        ontimeout: () => resolve(handleError$1("本地后端请求超时，请检查后端模型配置或稍后重试"))
      });
    });
    if (result.code === -1006 && (extra.retryCount || 0) < 2) {
      await sleep(result.retryAfter + 1);
      return callLocalBackendAnswer(question, { ...extra, retryCount: (extra.retryCount || 0) + 1 });
    }
    return result;
  };
  const saveAnswerRecord = ({ question, answer, source = "accurate" }) => {
    const setting = useSettingStore();
    const answerRecordStore = useAnswerRecordStore();
    return answerRecordStore.insertRecord({
      question,
      answer,
      token: setting.config.basicConfig.token.value,
      source
    });
  };
  const getAccurateAnswer = async (question) => {
    return callLocalBackendAnswer(question);
  };
  const fetchFuzzySearch = async (question) => {
    const setting = useSettingStore();
    const token = setting.config.basicConfig.token.value || getLocalBackendToken() || "";
    const data = "question=" + encodeURIComponent(question);
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        url: LOCAL_BACKEND_SEARCH_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Authorization": token ? "Bearer " + token : ""
        },
        data,
        timeout: 24e4,
        onload: (response) => {
          try {
            const obj = JSON.parse(response.responseText || "{}");
            if (obj.code === 200 && obj.data && obj.data.found) {
              const matches = obj.data.matches || [];
              const items = matches.map((m) => ({
                title: m.question || question,
                options: JSON.stringify(m.options || []),
                answer: JSON.stringify([m.answer || ""]),
                type: String(m.type || "8")
              }));
              resolve({ code: 1, data: { items }, msg: obj.msg || "success" });
            } else if (response.status === 401 || obj.code === 401) {
              resolve(handleError$1("本地后端未登录或登录态失效，请先登录用户中心"));
            } else {
              const miss = obj.data && obj.data.found === false;
              resolve({ code: obj.code || -1004, data: { items: [] }, msg: miss ? "题库暂未收录这道题" : (obj.msg || "未查询到答案") });
            }
          } catch (e) {
            resolve({ code: -1004, data: { items: [] }, msg: "搜索响应解析失败" });
          }
        },
        onerror: () => resolve({ code: -1004, data: { items: [] }, msg: "无法连接本地后端" }),
        ontimeout: () => resolve({ code: -1004, data: { items: [] }, msg: "搜索请求超时，请稍后重试" })
      });
    });
  };
  const getAIAnswer = async (question) => {
    return callLocalBackendAnswer(question, { skipBank: true });
  };
  const _hoisted_1$4 = { class: "online-search-wrap" };
  const _hoisted_2$3 = { class: "tips" };
  const _hoisted_3$2 = { class: "config" };
  const _hoisted_4$2 = { class: "config-input" };
  const _hoisted_5$2 = { class: "searth-input-wrap" };
  const _hoisted_6$2 = { class: "searth-input" };
  const _hoisted_7$2 = { class: "search-btn" };
  const _hoisted_8$2 = { class: "result-list" };
  const _hoisted_9$2 = ["innerHTML"];
  const _hoisted_10$1 = ["innerHTML"];
  const _hoisted_11$1 = ["innerHTML"];
  const _hoisted_12$1 = {
    key: 0,
    style: { "text-align": "center", "font-size": "15px" }
  };
  const _sfc_main$5 = {
    __name: "OnlineSearch",
    emits: ["changeTab"],
    setup(__props, { emit: __emit }) {
      const [messageApi, contextHolder] = Antd.message.useMessage();
      const setting = useSettingStore();
      const questionStore = useQuestionStore();
      const { searchText } = pinia.storeToRefs(questionStore);
      const errInfo = vue.ref("");
      const isLoading = vue.ref(false);
      const isComposing = vue.ref(false);
      const emit = __emit;
      const goSetting = () => {
        window.open(setting.shopLink || "https://xs.openget.cn/user?section=account", "_blank");
      };
      const tokenReady = vue.computed(() => {
        const remain = String(setting.userInfo.remainCount || "");
        return !!setting.config.basicConfig.token.value && remain && !["密钥未配置", "密钥无效", "null"].includes(remain);
      });
      const typeMap = {
        单选题: "0",
        多选题: "1",
        填空题: "2",
        判断题: "3",
        简答题: "4",
        问答题: "4",
        名词解释: "5",
        论述题: "6",
        计算题: "7",
        分录题: "9",
        资料题: "10",
        连线题: "11",
        匹配题: "11",
        排序题: "13",
        完型填空: "14",
        完形填空题: "14",
        阅读理解: "15",
        程序题: "17",
        口语题: "18",
        听力题: "19",
        共用选项题: "20",
        测评题: "21",
        钟表题: "23",
        选词填空: "24",
        选做题: "25",
        其它: "8"
      };
      const getTypeByCode = vue.computed(() => {
        return function(type) {
          let key = Object.keys(typeMap).find((key2) => typeMap[key2] === String(type));
          return key || "";
        };
      });
      const answerJoin = vue.computed(() => {
        return function(answerList) {
          try {
            return JSON.parse(answerList).join(";");
          } catch {
            return answerList;
          }
        };
      });
      const { fuzzySearchResult } = pinia.storeToRefs(questionStore);
      const fuzzySearch = async (e) => {
        e.preventDefault();
        if (!setting.config.basicConfig.token.value) {
          messageApi.info("未配置密钥，请先前往“设置”模块填写密钥..");
          return;
        }
        if (!searchText.value || isComposing.value) return;
        if (searchText.value) {
          errInfo.value = "";
          questionStore.clearFuzzySearchResult();
          isLoading.value = true;
          const res = await fetchFuzzySearch(searchText.value);
          isLoading.value = false;
          if (res.code === 1) {
            const {
              data: { items }
            } = res;
            questionStore.fuzzySearchResult = items;
          } else {
            errInfo.value = res.msg;
          }
        } else {
          messageApi.info("请输入题目..");
        }
      };
      return (_ctx, _cache) => {
        const _component_a_button = vue.resolveComponent("a-button");
        const _component_a_switch = vue.resolveComponent("a-switch");
        const _component_a_textarea = vue.resolveComponent("a-textarea");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$4, [
          vue.createVNode(vue.unref(contextHolder)),
          vue.createElementVNode("div", _hoisted_2$3, [
            vue.createElementVNode("ul", null, [
              vue.createElementVNode("li", null, [
                _cache[5] || (_cache[5] = vue.createTextVNode(" 使用在线搜题前，请先前往 ")),
                vue.createVNode(_component_a_button, {
                  onClick: goSetting,
                  size: "small",
                  type: "primary",
                  danger: tokenReady.value
                }, {
                  icon: vue.withCtx(() => [
                    vue.createVNode(vue.unref(SettingOutlined))
                  ]),
                  default: vue.withCtx(() => [
                    vue.createTextVNode(vue.toDisplayString(tokenReady.value ? "已配置密钥" : "登录用户中心获取密钥"), 1)
                  ]),
                  _: 1
                })
              ]),
              _cache[6] || (_cache[6] = vue.createElementVNode("li", null, "如需手动答题，建议关闭自动切换功能，防止操作冲突", -1))
            ])
          ]),
          vue.createElementVNode("div", _hoisted_3$2, [
            _cache[7] || (_cache[7] = vue.createElementVNode("div", { class: "config-name" }, "划词搜题", -1)),
            vue.createElementVNode("div", _hoisted_4$2, [
              vue.createVNode(_component_a_switch, {
                size: "small",
                checked: vue.unref(setting).config.searchConfig.searchBySelectedText.value,
                "onUpdate:checked": _cache[0] || (_cache[0] = ($event) => vue.unref(setting).config.searchConfig.searchBySelectedText.value = $event)
              }, null, 8, ["checked"])
            ])
          ]),
          vue.createElementVNode("div", _hoisted_5$2, [
            _cache[8] || (_cache[8] = vue.createElementVNode("div", { class: "title" }, "搜索题目", -1)),
            vue.createElementVNode("div", _hoisted_6$2, [
              vue.createVNode(_component_a_textarea, {
                onKeydown: vue.withKeys(vue.withModifiers(fuzzySearch, ["exact"]), ["enter"]),
                onCompositionstart: _cache[1] || (_cache[1] = ($event) => isComposing.value = true),
                onCompositionend: _cache[2] || (_cache[2] = ($event) => isComposing.value = false),
                value: vue.unref(searchText),
                "onUpdate:value": _cache[3] || (_cache[3] = ($event) => vue.isRef(searchText) ? searchText.value = $event : null),
                placeholder: "请输入题目",
                rows: 4
              }, null, 8, ["onKeydown", "value"])
            ])
          ]),
          vue.createElementVNode("div", _hoisted_7$2, [
            vue.createVNode(_component_a_button, {
              onClick: fuzzySearch,
              style: { "width": "120px" },
              type: "primary",
              size: "small"
            }, {
              default: vue.withCtx(() => _cache[9] || (_cache[9] = [
                vue.createTextVNode("搜索")
              ])),
              _: 1
            })
          ]),
          vue.createElementVNode("div", _hoisted_8$2, [
            vue.createElementVNode("div", { innerHTML: errInfo.value }, null, 8, _hoisted_9$2),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(fuzzySearchResult), (result, index) => {
              return vue.openBlock(), vue.createElementBlock("div", {
                class: "result-item",
                key: index
              }, [
                vue.createElementVNode("div", null, [
                  vue.createElementVNode("span", null, vue.toDisplayString(`${index + 1}.【${getTypeByCode.value(result.type)}】`), 1),
                  vue.createElementVNode("span", {
                    innerHTML: result.title
                  }, null, 8, _hoisted_10$1)
                ]),
                vue.createElementVNode("div", null, [
                  (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(JSON.parse(result.options), (option, index2) => {
                    return vue.openBlock(), vue.createElementBlock("div", { key: index2 }, [
                      vue.createElementVNode("span", null, vue.toDisplayString(String.fromCharCode(65 + index2)) + ".", 1),
                      vue.createElementVNode("span", null, vue.toDisplayString(option), 1)
                    ]);
                  }), 128))
                ]),
                vue.createElementVNode("div", {
                  class: "result-answer",
                  innerHTML: answerJoin.value(result.answer)
                }, null, 8, _hoisted_11$1)
              ]);
            }), 128)),
            isLoading.value ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_12$1, [
              _cache[10] || (_cache[10] = vue.createElementVNode("span", { style: { "margin-right": "10px" } }, "搜索中", -1)),
              vue.createVNode(vue.unref(LoadingOutlined))
            ])) : vue.createCommentVNode("", true)
          ])
        ]);
      };
    }
  };
  const _hoisted_1$2 = { class: "record-wrap" };
  const _hoisted_2$1 = { class: "record-tip" };
  const _hoisted_3 = { class: "record-filter" };
  const _hoisted_4 = ["onClick"];
  const _hoisted_5 = {
    key: 0,
    class: "record-list"
  };
  const _hoisted_6 = { class: "record-row" };
  const _hoisted_7 = ["title"];
  const _hoisted_8 = { class: "record-row" };
  const _hoisted_9 = ["title"];
  const _hoisted_10 = { class: "record-row" };
  const _hoisted_11 = ["title"];
  const _hoisted_12 = { class: "record-row" };
  const _hoisted_13 = ["title"];
  const _hoisted_14 = {
    key: 1,
    class: "tips"
  };
  const _sfc_main$3 = {
    __name: "AnswerRecord",
    setup(__props) {
      const answerRecordStore = useAnswerRecordStore();
      const { displayRecords } = pinia.storeToRefs(answerRecordStore);
      const activeFilter = vue.ref("all");
      const keyword = vue.ref("");
      const filterOptions = [
        { label: "所有", value: "all" },
        { label: "今天", value: "today" },
        { label: "昨天", value: "yesterday" },
        { label: "近一周", value: "week" },
        { label: "近一月", value: "month" }
      ];
      const getDayStart = (date = /* @__PURE__ */ new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const filteredRecords = vue.computed(() => {
        const now = Date.now();
        const todayStart = getDayStart();
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1e3;
        const kw = keyword.value.trim().toLowerCase();
        return displayRecords.value.filter((record) => {
          if (kw && !String(record.title || "").toLowerCase().includes(kw)) {
            return false;
          }
          const timestamp = record.timestamp || 0;
          if (activeFilter.value === "all") {
            return true;
          }
          if (activeFilter.value === "today") {
            return timestamp >= todayStart;
          }
          if (activeFilter.value === "yesterday") {
            return timestamp >= yesterdayStart && timestamp < todayStart;
          }
          if (activeFilter.value === "week") {
            return timestamp >= now - 7 * 24 * 60 * 60 * 1e3;
          }
          if (activeFilter.value === "month") {
            return timestamp >= now - 30 * 24 * 60 * 60 * 1e3;
          }
          return true;
        });
      });
      const clearRecords = () => {
        answerRecordStore.clearRecords();
      };
      const formatAnswer = (answer) => {
        if (!Array.isArray(answer) || answer.length === 0) return "-";
        return answer.join("；");
      };
      return (_ctx, _cache) => {
        const _component_a_button = vue.resolveComponent("a-button");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$2, [
          _cache[5] || (_cache[5] = vue.createElementVNode("div", { class: "separator" }, "▤ 记录", -1)),
          vue.createElementVNode("div", _hoisted_2$1, [
            vue.createElementVNode("span", null, vue.toDisplayString(keyword.value.trim() ? "找到 " + filteredRecords.value.length + " 条记录" : "最多保留 200 条答题记录，当前 " + filteredRecords.value.length + " 条"), 1),
            vue.createVNode(_component_a_button, {
              class: "clear-btn",
              size: "small",
              onClick: clearRecords
            }, {
              default: vue.withCtx(() => _cache[0] || (_cache[0] = [
                vue.createTextVNode("清空记录")
              ])),
              _: 1
            })
          ]),
          vue.createElementVNode("div", { class: "record-search-wrap" }, [
            vue.createElementVNode("input", {
              class: "record-search",
              value: keyword.value,
              placeholder: "按题目关键词搜索",
              onInput: ($event) => keyword.value = $event.target.value
            }, null, 8, ["value"])
          ]),
          vue.createElementVNode("div", _hoisted_3, [
            (vue.openBlock(), vue.createElementBlock(vue.Fragment, null, vue.renderList(filterOptions, (item) => {
              return vue.createElementVNode("button", {
                key: item.value,
                class: vue.normalizeClass(["filter-btn", { active: activeFilter.value === item.value }]),
                onClick: ($event) => activeFilter.value = item.value
              }, vue.toDisplayString(item.label), 11, _hoisted_4);
            }), 64))
          ]),
          filteredRecords.value.length ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_5, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(filteredRecords.value, (record) => {
              return vue.openBlock(), vue.createElementBlock("div", {
                key: `${record.cacheKey}-${record.timestamp}`,
                class: "record-item"
              }, [
                vue.createElementVNode("div", _hoisted_6, [
                  _cache[1] || (_cache[1] = vue.createElementVNode("span", { class: "record-label" }, "密钥", -1)),
                  vue.createElementVNode("span", {
                    class: "record-value",
                    title: record.token || "未配置"
                  }, vue.toDisplayString(record.token || "未配置"), 9, _hoisted_7)
                ]),
                vue.createElementVNode("div", _hoisted_8, [
                  _cache[2] || (_cache[2] = vue.createElementVNode("span", { class: "record-label" }, "题目", -1)),
                  vue.createElementVNode("span", {
                    class: "record-value",
                    title: record.title
                  }, vue.toDisplayString(record.title), 9, _hoisted_9)
                ]),
                vue.createElementVNode("div", _hoisted_10, [
                  _cache[3] || (_cache[3] = vue.createElementVNode("span", { class: "record-label" }, "答案", -1)),
                  vue.createElementVNode("span", {
                    class: "record-value",
                    title: formatAnswer(record.answer)
                  }, vue.toDisplayString(formatAnswer(record.answer)), 9, _hoisted_11)
                ]),
                vue.createElementVNode("div", _hoisted_12, [
                  _cache[4] || (_cache[4] = vue.createElementVNode("span", { class: "record-label" }, "请求时间", -1)),
                  vue.createElementVNode("span", {
                    class: "record-value",
                    title: record.requestTime
                  }, vue.toDisplayString(record.requestTime), 9, _hoisted_13)
                ])
              ]);
            }), 128))
          ])) : (vue.openBlock(), vue.createElementBlock("div", _hoisted_14, vue.toDisplayString(keyword.value.trim() ? "没有找到包含「" + keyword.value.trim() + "」的记录。" : " 当前筛选条件下暂无答题记录。成功搜到答案并扣次后，会自动写入本地缓存。 "), 1))
        ]);
      };
    }
  };
  const useMessageStore = pinia.defineStore("messageStore", {
    state: () => ({
      messageList: []
    }),
    actions: {
      insertMessage(text, type = "success") {
        const message2 = {
          text,
          type
        };
        this.messageList.push(message2);
      },
      clearMessage() {
        this.messageList = [];
      }
    }
  });
  const TIMEOUT_ERROR_MSG = "请求超时，请前往设置尝试切换节点..";
  const SERVER_MAINTENANCE_ERROR_MSG = "服务器维护中，请前往设置尝试切换节点，自动学习功能正常使用..";
  const handleError = (msg) => ({
    code: 10003,
    data: {
      answer: [],
      num: "",
      usenum: ""
    },
    msg
  });
  const fetchBasicInfo = async () => {
    const scriptInfo = getScriptInfo();
    return {
      code: 1,
      data: {
        shopLink: __DIST.shop || "https://xs.openget.cn/user?section=account",  // FX-CH:basic-info-shop
        version: scriptInfo.version,
        chatWebUrl: "已接入 AI 智能答题云服务"
      }
    };
  };
  const getTokenInfo = async () => {
    let token = "";
    try {
      const setting = useSettingStore();
      token = setting.config.basicConfig.token.value || getLocalBackendToken() || "";
    } catch (_) {
      token = getLocalBackendToken() || "";
    }
    const profile = await fetchLocalBackendProfile(token);
    const remainCount = getProfileRemainingCount(profile);
    return {
      code: profile ? 1 : 10003,
      data: {
        count: remainCount,
        usedCount: 0,
        remainCount
      },
      msg: profile ? "本地后端已同步题数" : "密钥无效或已过期，请到用户中心重新生成脚本密钥"
    };
  };
  const cxEditorDocuments = new WeakSet();
  let activeCxEditor = null, cxEditorWatcherInstalled = false;
  const installCxCustomEditor = (doc, setting) => {
    if (!doc || cxEditorDocuments.has(doc)) return;
    cxEditorDocuments.add(doc);
    if (!cxEditorWatcherInstalled) {
      cxEditorWatcherInstalled = true;
      vue.watch(() => setting.config.cxConfig.showCustomEditor.value, enabled => {
        if (!enabled && activeCxEditor) { activeCxEditor.remove(); activeCxEditor = null; }
      });
    }
    doc.addEventListener("focusin", event => {
      if (!setting.config.cxConfig.showCustomEditor.value) return;
      const target = event.target;
      if (!target || !target.matches || !target.matches('textarea, [contenteditable="true"]') || target.disabled || target.readOnly) return;
      if (target.closest('[data-xs-custom-editor], [data-xs-abc-app]')) return;
      const hostDoc = getTopDocument() || doc;
      if (activeCxEditor) activeCxEditor.remove();
      const panel = hostDoc.createElement("div");
      panel.setAttribute("data-xs-custom-editor", "true");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "自定义答案编辑框");
      panel.style.cssText = "position:fixed;right:24px;bottom:24px;width:360px;max-width:85vw;padding:16px;background:#fff;color:#111;border:1px solid #aaa;border-radius:8px;z-index:2147483647;box-shadow:0 4px 24px #0003";
      const label = hostDoc.createElement("div"); label.textContent = "编辑答案（应用后写回原输入框，不提交）";
      const editor = hostDoc.createElement("textarea");
      editor.value = target.tagName === "TEXTAREA" ? target.value : (target.innerText || target.textContent || "");
      editor.style.cssText = "box-sizing:border-box;width:100%;height:140px;margin:12px 0;color:#111;background:#fff";
      const apply = hostDoc.createElement("button"); apply.textContent = "应用";
      const close = hostDoc.createElement("button"); close.textContent = "取消";
      apply.type = close.type = "button";
      const dismiss = () => { panel.remove(); if (activeCxEditor === panel) activeCxEditor = null; };
      apply.onclick = () => {
        if (!setting.config.cxConfig.showCustomEditor.value || !target.isConnected) { dismiss(); return; }
        if (target.tagName === "TEXTAREA") target.value = editor.value;
        else target.textContent = editor.value;
        const EventType = target.ownerDocument.defaultView.Event;
        target.dispatchEvent(new EventType("input", {bubbles:true}));
        target.dispatchEvent(new EventType("change", {bubbles:true}));
        dismiss();
      };
      close.onclick = dismiss;
      panel.append(label, editor, apply, close); hostDoc.body.appendChild(panel);
      activeCxEditor = panel; editor.focus();
    });
    const installFrame = frame => { try { if (frame.contentDocument) installCxCustomEditor(frame.contentDocument, setting); } catch (_) {} };
    doc.querySelectorAll("iframe").forEach(installFrame);
    doc.addEventListener("load", event => { if (event.target && event.target.tagName === "IFRAME") installFrame(event.target); }, true);
  };
  const selectTextSearchLogic = async (iframeDocument, iframeWindow) => {
    const questionStore = useQuestionStore();
    const setting = useSettingStore();
    if (/chaoxing\.com$/.test(location.hostname)) installCxCustomEditor(iframeDocument, setting);
    _unsafeWindow.document.onselectstart = true;
    _unsafeWindow.document.oncontextmenu = true;
    _unsafeWindow.document.oncut = true;
    _unsafeWindow.document.oncopy = true;
    _unsafeWindow.document.onpaste = true;
    const getSelectedText = () => {
      if (!setting.config.searchConfig.searchBySelectedText.value) return;
      let selectedText = "";
      if (iframeWindow.getSelection) {
        selectedText = iframeWindow.getSelection().toString();
      } else if (iframeDocument.selection) {
        selectedText = iframeDocument.selection.createRange().text;
      }
      if (selectedText != "") {
        questionStore.searchText = selectedText;
        setting.tabIndex = "3";
      }
    };
    iframeDocument.addEventListener("mouseup", getSelectedText);
  };
  var Typr$1 = {};
  var Typr = {};
  Typr.parse = function(buff) {
    var bin = Typr._bin;
    var data = new Uint8Array(buff);
    var tag = bin.readASCII(data, 0, 4);
    if (tag == "ttcf") {
      var offset = 4;
      bin.readUshort(data, offset);
      offset += 2;
      bin.readUshort(data, offset);
      offset += 2;
      var numF = bin.readUint(data, offset);
      offset += 4;
      var fnts = [];
      for (var i = 0; i < numF; i++) {
        var foff = bin.readUint(data, offset);
        offset += 4;
        fnts.push(Typr._readFont(data, foff));
      }
      return fnts;
    } else
      return [Typr._readFont(data, 0)];
  };
  Typr._readFont = function(data, offset) {
    var bin = Typr._bin;
    var ooff = offset;
    bin.readFixed(data, offset);
    offset += 4;
    var numTables = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    var tags = [
      "cmap",
      "head",
      "hhea",
      "maxp",
      "hmtx",
      "name",
      "OS/2",
      "post",
      //"cvt",
      //"fpgm",
      "loca",
      "glyf",
      "kern",
      //"prep"
      //"gasp"
      "CFF ",
      "GPOS",
      "GSUB",
      "SVG "
      //"VORG",
    ];
    var obj = { _data: data, _offset: ooff };
    var tabs = {};
    for (var i = 0; i < numTables; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      bin.readUint(data, offset);
      offset += 4;
      var toffset = bin.readUint(data, offset);
      offset += 4;
      var length = bin.readUint(data, offset);
      offset += 4;
      tabs[tag] = { offset: toffset, length };
    }
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      if (tabs[t])
        obj[t.trim()] = Typr[t.trim()].parse(data, tabs[t].offset, tabs[t].length, obj);
    }
    return obj;
  };
  Typr._tabOffset = function(data, tab, foff) {
    var bin = Typr._bin;
    var numTables = bin.readUshort(data, foff + 4);
    var offset = foff + 12;
    for (var i = 0; i < numTables; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      bin.readUint(data, offset);
      offset += 4;
      var toffset = bin.readUint(data, offset);
      offset += 4;
      bin.readUint(data, offset);
      offset += 4;
      if (tag == tab)
        return toffset;
    }
    return 0;
  };
  Typr._bin = {
    readFixed: function(data, o) {
      return (data[o] << 8 | data[o + 1]) + (data[o + 2] << 8 | data[o + 3]) / (256 * 256 + 4);
    },
    readF2dot14: function(data, o) {
      var num = Typr._bin.readShort(data, o);
      return num / 16384;
    },
    readInt: function(buff, p) {
      return Typr._bin._view(buff).getInt32(p);
    },
    readInt8: function(buff, p) {
      return Typr._bin._view(buff).getInt8(p);
    },
    readShort: function(buff, p) {
      return Typr._bin._view(buff).getInt16(p);
    },
    readUshort: function(buff, p) {
      return Typr._bin._view(buff).getUint16(p);
    },
    readUshorts: function(buff, p, len) {
      var arr = [];
      for (var i = 0; i < len; i++)
        arr.push(Typr._bin.readUshort(buff, p + i * 2));
      return arr;
    },
    readUint: function(buff, p) {
      return Typr._bin._view(buff).getUint32(p);
    },
    readUint64: function(buff, p) {
      return Typr._bin.readUint(buff, p) * (4294967295 + 1) + Typr._bin.readUint(buff, p + 4);
    },
    readASCII: function(buff, p, l) {
      var s = "";
      for (var i = 0; i < l; i++)
        s += String.fromCharCode(buff[p + i]);
      return s;
    },
    readUnicode: function(buff, p, l) {
      var s = "";
      for (var i = 0; i < l; i++) {
        var c = buff[p++] << 8 | buff[p++];
        s += String.fromCharCode(c);
      }
      return s;
    },
    _tdec: typeof window !== "undefined" && window["TextDecoder"] ? new window["TextDecoder"]() : null,
    readUTF8: function(buff, p, l) {
      var tdec = Typr._bin._tdec;
      if (tdec && p == 0 && l == buff.length)
        return tdec["decode"](buff);
      return Typr._bin.readASCII(buff, p, l);
    },
    readBytes: function(buff, p, l) {
      var arr = [];
      for (var i = 0; i < l; i++)
        arr.push(buff[p + i]);
      return arr;
    },
    readASCIIArray: function(buff, p, l) {
      var s = [];
      for (var i = 0; i < l; i++)
        s.push(String.fromCharCode(buff[p + i]));
      return s;
    },
    _view: function(buff) {
      return buff._dataView || (buff._dataView = buff.buffer ? new DataView(buff.buffer, buff.byteOffset, buff.byteLength) : new DataView(new Uint8Array(buff).buffer));
    }
  };
  Typr._lctf = {};
  Typr._lctf.parse = function(data, offset, length, font, subt) {
    var bin = Typr._bin;
    var obj = {};
    var offset0 = offset;
    bin.readFixed(data, offset);
    offset += 4;
    var offScriptList = bin.readUshort(data, offset);
    offset += 2;
    var offFeatureList = bin.readUshort(data, offset);
    offset += 2;
    var offLookupList = bin.readUshort(data, offset);
    offset += 2;
    obj.scriptList = Typr._lctf.readScriptList(data, offset0 + offScriptList);
    obj.featureList = Typr._lctf.readFeatureList(data, offset0 + offFeatureList);
    obj.lookupList = Typr._lctf.readLookupList(data, offset0 + offLookupList, subt);
    return obj;
  };
  Typr._lctf.readLookupList = function(data, offset, subt) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = [];
    var count = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < count; i++) {
      var noff = bin.readUshort(data, offset);
      offset += 2;
      var lut = Typr._lctf.readLookupTable(data, offset0 + noff, subt);
      obj.push(lut);
    }
    return obj;
  };
  Typr._lctf.readLookupTable = function(data, offset, subt) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = { tabs: [] };
    obj.ltype = bin.readUshort(data, offset);
    offset += 2;
    obj.flag = bin.readUshort(data, offset);
    offset += 2;
    var cnt = bin.readUshort(data, offset);
    offset += 2;
    var ltype = obj.ltype;
    for (var i = 0; i < cnt; i++) {
      var noff = bin.readUshort(data, offset);
      offset += 2;
      var tab = subt(data, ltype, offset0 + noff, obj);
      obj.tabs.push(tab);
    }
    return obj;
  };
  Typr._lctf.numOfOnes = function(n) {
    var num = 0;
    for (var i = 0; i < 32; i++)
      if ((n >>> i & 1) != 0)
        num++;
    return num;
  };
  Typr._lctf.readClassDef = function(data, offset) {
    var bin = Typr._bin;
    var obj = [];
    var format = bin.readUshort(data, offset);
    offset += 2;
    if (format == 1) {
      var startGlyph = bin.readUshort(data, offset);
      offset += 2;
      var glyphCount = bin.readUshort(data, offset);
      offset += 2;
      for (var i = 0; i < glyphCount; i++) {
        obj.push(startGlyph + i);
        obj.push(startGlyph + i);
        obj.push(bin.readUshort(data, offset));
        offset += 2;
      }
    }
    if (format == 2) {
      var count = bin.readUshort(data, offset);
      offset += 2;
      for (var i = 0; i < count; i++) {
        obj.push(bin.readUshort(data, offset));
        offset += 2;
        obj.push(bin.readUshort(data, offset));
        offset += 2;
        obj.push(bin.readUshort(data, offset));
        offset += 2;
      }
    }
    return obj;
  };
  Typr._lctf.getInterval = function(tab, val) {
    for (var i = 0; i < tab.length; i += 3) {
      var start = tab[i], end = tab[i + 1];
      tab[i + 2];
      if (start <= val && val <= end)
        return i;
    }
    return -1;
  };
  Typr._lctf.readCoverage = function(data, offset) {
    var bin = Typr._bin;
    var cvg = {};
    cvg.fmt = bin.readUshort(data, offset);
    offset += 2;
    var count = bin.readUshort(data, offset);
    offset += 2;
    if (cvg.fmt == 1)
      cvg.tab = bin.readUshorts(data, offset, count);
    if (cvg.fmt == 2)
      cvg.tab = bin.readUshorts(data, offset, count * 3);
    return cvg;
  };
  Typr._lctf.coverageIndex = function(cvg, val) {
    var tab = cvg.tab;
    if (cvg.fmt == 1)
      return tab.indexOf(val);
    if (cvg.fmt == 2) {
      var ind = Typr._lctf.getInterval(tab, val);
      if (ind != -1)
        return tab[ind + 2] + (val - tab[ind]);
    }
    return -1;
  };
  Typr._lctf.readFeatureList = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = [];
    var count = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < count; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      var noff = bin.readUshort(data, offset);
      offset += 2;
      var feat = Typr._lctf.readFeatureTable(data, offset0 + noff);
      feat.tag = tag.trim();
      obj.push(feat);
    }
    return obj;
  };
  Typr._lctf.readFeatureTable = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var feat = {};
    var featureParams = bin.readUshort(data, offset);
    offset += 2;
    if (featureParams > 0) {
      feat.featureParams = offset0 + featureParams;
    }
    var lookupCount = bin.readUshort(data, offset);
    offset += 2;
    feat.tab = [];
    for (var i = 0; i < lookupCount; i++)
      feat.tab.push(bin.readUshort(data, offset + 2 * i));
    return feat;
  };
  Typr._lctf.readScriptList = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = {};
    var count = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < count; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      var noff = bin.readUshort(data, offset);
      offset += 2;
      obj[tag.trim()] = Typr._lctf.readScriptTable(data, offset0 + noff);
    }
    return obj;
  };
  Typr._lctf.readScriptTable = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = {};
    var defLangSysOff = bin.readUshort(data, offset);
    offset += 2;
    if (defLangSysOff > 0) {
      obj["default"] = Typr._lctf.readLangSysTable(data, offset0 + defLangSysOff);
    }
    var langSysCount = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < langSysCount; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      var langSysOff = bin.readUshort(data, offset);
      offset += 2;
      obj[tag.trim()] = Typr._lctf.readLangSysTable(data, offset0 + langSysOff);
    }
    return obj;
  };
  Typr._lctf.readLangSysTable = function(data, offset) {
    var bin = Typr._bin;
    var obj = {};
    bin.readUshort(data, offset);
    offset += 2;
    obj.reqFeature = bin.readUshort(data, offset);
    offset += 2;
    var featureCount = bin.readUshort(data, offset);
    offset += 2;
    obj.features = bin.readUshorts(data, offset, featureCount);
    return obj;
  };
  Typr.CFF = {};
  Typr.CFF.parse = function(data, offset, length) {
    var bin = Typr._bin;
    data = new Uint8Array(data.buffer, offset, length);
    offset = 0;
    data[offset];
    offset++;
    data[offset];
    offset++;
    data[offset];
    offset++;
    data[offset];
    offset++;
    var ninds = [];
    offset = Typr.CFF.readIndex(data, offset, ninds);
    var names2 = [];
    for (var i = 0; i < ninds.length - 1; i++)
      names2.push(bin.readASCII(data, offset + ninds[i], ninds[i + 1] - ninds[i]));
    offset += ninds[ninds.length - 1];
    var tdinds = [];
    offset = Typr.CFF.readIndex(data, offset, tdinds);
    var topDicts = [];
    for (var i = 0; i < tdinds.length - 1; i++)
      topDicts.push(Typr.CFF.readDict(data, offset + tdinds[i], offset + tdinds[i + 1]));
    offset += tdinds[tdinds.length - 1];
    var topdict = topDicts[0];
    var sinds = [];
    offset = Typr.CFF.readIndex(data, offset, sinds);
    var strings = [];
    for (var i = 0; i < sinds.length - 1; i++)
      strings.push(bin.readASCII(data, offset + sinds[i], sinds[i + 1] - sinds[i]));
    offset += sinds[sinds.length - 1];
    Typr.CFF.readSubrs(data, offset, topdict);
    if (topdict.CharStrings) {
      offset = topdict.CharStrings;
      var sinds = [];
      offset = Typr.CFF.readIndex(data, offset, sinds);
      var cstr = [];
      for (var i = 0; i < sinds.length - 1; i++)
        cstr.push(bin.readBytes(data, offset + sinds[i], sinds[i + 1] - sinds[i]));
      topdict.CharStrings = cstr;
    }
    if (topdict.ROS) {
      offset = topdict.FDArray;
      var fdind = [];
      offset = Typr.CFF.readIndex(data, offset, fdind);
      topdict.FDArray = [];
      for (var i = 0; i < fdind.length - 1; i++) {
        var dict = Typr.CFF.readDict(data, offset + fdind[i], offset + fdind[i + 1]);
        Typr.CFF._readFDict(data, dict, strings);
        topdict.FDArray.push(dict);
      }
      offset += fdind[fdind.length - 1];
      offset = topdict.FDSelect;
      topdict.FDSelect = [];
      var fmt = data[offset];
      offset++;
      if (fmt == 3) {
        var rns = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < rns + 1; i++) {
          topdict.FDSelect.push(bin.readUshort(data, offset), data[offset + 2]);
          offset += 3;
        }
      } else
        throw fmt;
    }
    if (topdict.Encoding)
      topdict.Encoding = Typr.CFF.readEncoding(data, topdict.Encoding, topdict.CharStrings.length);
    if (topdict.charset)
      topdict.charset = Typr.CFF.readCharset(data, topdict.charset, topdict.CharStrings.length);
    Typr.CFF._readFDict(data, topdict, strings);
    return topdict;
  };
  Typr.CFF._readFDict = function(data, dict, ss) {
    var offset;
    if (dict.Private) {
      offset = dict.Private[1];
      dict.Private = Typr.CFF.readDict(data, offset, offset + dict.Private[0]);
      if (dict.Private.Subrs)
        Typr.CFF.readSubrs(data, offset + dict.Private.Subrs, dict.Private);
    }
    for (var p in dict)
      if (["FamilyName", "FontName", "FullName", "Notice", "version", "Copyright"].indexOf(p) != -1)
        dict[p] = ss[dict[p] - 426 + 35];
  };
  Typr.CFF.readSubrs = function(data, offset, obj) {
    var bin = Typr._bin;
    var gsubinds = [];
    offset = Typr.CFF.readIndex(data, offset, gsubinds);
    var bias, nSubrs = gsubinds.length;
    if (nSubrs < 1240)
      bias = 107;
    else if (nSubrs < 33900)
      bias = 1131;
    else
      bias = 32768;
    obj.Bias = bias;
    obj.Subrs = [];
    for (var i = 0; i < gsubinds.length - 1; i++)
      obj.Subrs.push(bin.readBytes(data, offset + gsubinds[i], gsubinds[i + 1] - gsubinds[i]));
  };
  Typr.CFF.tableSE = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    82,
    83,
    84,
    85,
    86,
    87,
    88,
    89,
    90,
    91,
    92,
    93,
    94,
    95,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    96,
    97,
    98,
    99,
    100,
    101,
    102,
    103,
    104,
    105,
    106,
    107,
    108,
    109,
    110,
    0,
    111,
    112,
    113,
    114,
    0,
    115,
    116,
    117,
    118,
    119,
    120,
    121,
    122,
    0,
    123,
    0,
    124,
    125,
    126,
    127,
    128,
    129,
    130,
    131,
    0,
    132,
    133,
    0,
    134,
    135,
    136,
    137,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    138,
    0,
    139,
    0,
    0,
    0,
    0,
    140,
    141,
    142,
    143,
    0,
    0,
    0,
    0,
    0,
    144,
    0,
    0,
    0,
    145,
    0,
    0,
    146,
    147,
    148,
    149,
    0,
    0,
    0,
    0
  ];
  Typr.CFF.glyphByUnicode = function(cff, code) {
    for (var i = 0; i < cff.charset.length; i++)
      if (cff.charset[i] == code)
        return i;
    return -1;
  };
  Typr.CFF.glyphBySE = function(cff, charcode) {
    if (charcode < 0 || charcode > 255)
      return -1;
    return Typr.CFF.glyphByUnicode(cff, Typr.CFF.tableSE[charcode]);
  };
  Typr.CFF.readEncoding = function(data, offset, num) {
    Typr._bin;
    var array = [".notdef"];
    var format = data[offset];
    offset++;
    if (format == 0) {
      var nCodes = data[offset];
      offset++;
      for (var i = 0; i < nCodes; i++)
        array.push(data[offset + i]);
    } else
      throw "error: unknown encoding format: " + format;
    return array;
  };
  Typr.CFF.readCharset = function(data, offset, num) {
    var bin = Typr._bin;
    var charset = [".notdef"];
    var format = data[offset];
    offset++;
    if (format == 0) {
      for (var i = 0; i < num; i++) {
        var first = bin.readUshort(data, offset);
        offset += 2;
        charset.push(first);
      }
    } else if (format == 1 || format == 2) {
      while (charset.length < num) {
        var first = bin.readUshort(data, offset);
        offset += 2;
        var nLeft = 0;
        if (format == 1) {
          nLeft = data[offset];
          offset++;
        } else {
          nLeft = bin.readUshort(data, offset);
          offset += 2;
        }
        for (var i = 0; i <= nLeft; i++) {
          charset.push(first);
          first++;
        }
      }
    } else
      throw "error: format: " + format;
    return charset;
  };
  Typr.CFF.readIndex = function(data, offset, inds) {
    var bin = Typr._bin;
    var count = bin.readUshort(data, offset) + 1;
    offset += 2;
    var offsize = data[offset];
    offset++;
    if (offsize == 1)
      for (var i = 0; i < count; i++)
        inds.push(data[offset + i]);
    else if (offsize == 2)
      for (var i = 0; i < count; i++)
        inds.push(bin.readUshort(data, offset + i * 2));
    else if (offsize == 3)
      for (var i = 0; i < count; i++)
        inds.push(bin.readUint(data, offset + i * 3 - 1) & 16777215);
    else if (count != 1)
      throw "unsupported offset size: " + offsize + ", count: " + count;
    offset += count * offsize;
    return offset - 1;
  };
  Typr.CFF.getCharString = function(data, offset, o) {
    var bin = Typr._bin;
    var b0 = data[offset], b1 = data[offset + 1];
    data[offset + 2];
    data[offset + 3];
    data[offset + 4];
    var vs = 1;
    var op = null, val = null;
    if (b0 <= 20) {
      op = b0;
      vs = 1;
    }
    if (b0 == 12) {
      op = b0 * 100 + b1;
      vs = 2;
    }
    if (21 <= b0 && b0 <= 27) {
      op = b0;
      vs = 1;
    }
    if (b0 == 28) {
      val = bin.readShort(data, offset + 1);
      vs = 3;
    }
    if (29 <= b0 && b0 <= 31) {
      op = b0;
      vs = 1;
    }
    if (32 <= b0 && b0 <= 246) {
      val = b0 - 139;
      vs = 1;
    }
    if (247 <= b0 && b0 <= 250) {
      val = (b0 - 247) * 256 + b1 + 108;
      vs = 2;
    }
    if (251 <= b0 && b0 <= 254) {
      val = -(b0 - 251) * 256 - b1 - 108;
      vs = 2;
    }
    if (b0 == 255) {
      val = bin.readInt(data, offset + 1) / 65535;
      vs = 5;
    }
    o.val = val != null ? val : "o" + op;
    o.size = vs;
  };
  Typr.CFF.readCharString = function(data, offset, length) {
    var end = offset + length;
    var bin = Typr._bin;
    var arr = [];
    while (offset < end) {
      var b0 = data[offset], b1 = data[offset + 1];
      data[offset + 2];
      data[offset + 3];
      data[offset + 4];
      var vs = 1;
      var op = null, val = null;
      if (b0 <= 20) {
        op = b0;
        vs = 1;
      }
      if (b0 == 12) {
        op = b0 * 100 + b1;
        vs = 2;
      }
      if (b0 == 19 || b0 == 20) {
        op = b0;
        vs = 2;
      }
      if (21 <= b0 && b0 <= 27) {
        op = b0;
        vs = 1;
      }
      if (b0 == 28) {
        val = bin.readShort(data, offset + 1);
        vs = 3;
      }
      if (29 <= b0 && b0 <= 31) {
        op = b0;
        vs = 1;
      }
      if (32 <= b0 && b0 <= 246) {
        val = b0 - 139;
        vs = 1;
      }
      if (247 <= b0 && b0 <= 250) {
        val = (b0 - 247) * 256 + b1 + 108;
        vs = 2;
      }
      if (251 <= b0 && b0 <= 254) {
        val = -(b0 - 251) * 256 - b1 - 108;
        vs = 2;
      }
      if (b0 == 255) {
        val = bin.readInt(data, offset + 1) / 65535;
        vs = 5;
      }
      arr.push(val != null ? val : "o" + op);
      offset += vs;
    }
    return arr;
  };
  Typr.CFF.readDict = function(data, offset, end) {
    var bin = Typr._bin;
    var dict = {};
    var carr = [];
    while (offset < end) {
      var b0 = data[offset], b1 = data[offset + 1];
      data[offset + 2];
      data[offset + 3];
      data[offset + 4];
      var vs = 1;
      var key = null, val = null;
      if (b0 == 28) {
        val = bin.readShort(data, offset + 1);
        vs = 3;
      }
      if (b0 == 29) {
        val = bin.readInt(data, offset + 1);
        vs = 5;
      }
      if (32 <= b0 && b0 <= 246) {
        val = b0 - 139;
        vs = 1;
      }
      if (247 <= b0 && b0 <= 250) {
        val = (b0 - 247) * 256 + b1 + 108;
        vs = 2;
      }
      if (251 <= b0 && b0 <= 254) {
        val = -(b0 - 251) * 256 - b1 - 108;
        vs = 2;
      }
      if (b0 == 255) {
        val = bin.readInt(data, offset + 1) / 65535;
        vs = 5;
        throw "unknown number";
      }
      if (b0 == 30) {
        var nibs = [];
        vs = 1;
        while (true) {
          var b = data[offset + vs];
          vs++;
          var nib0 = b >> 4, nib1 = b & 15;
          if (nib0 != 15)
            nibs.push(nib0);
          if (nib1 != 15)
            nibs.push(nib1);
          if (nib1 == 15)
            break;
        }
        var s = "";
        var chars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ".", "e", "e-", "reserved", "-", "endOfNumber"];
        for (var i = 0; i < nibs.length; i++)
          s += chars[nibs[i]];
        val = parseFloat(s);
      }
      if (b0 <= 21) {
        var keys = [
          "version",
          "Notice",
          "FullName",
          "FamilyName",
          "Weight",
          "FontBBox",
          "BlueValues",
          "OtherBlues",
          "FamilyBlues",
          "FamilyOtherBlues",
          "StdHW",
          "StdVW",
          "escape",
          "UniqueID",
          "XUID",
          "charset",
          "Encoding",
          "CharStrings",
          "Private",
          "Subrs",
          "defaultWidthX",
          "nominalWidthX"
        ];
        key = keys[b0];
        vs = 1;
        if (b0 == 12) {
          var keys = [
            "Copyright",
            "isFixedPitch",
            "ItalicAngle",
            "UnderlinePosition",
            "UnderlineThickness",
            "PaintType",
            "CharstringType",
            "FontMatrix",
            "StrokeWidth",
            "BlueScale",
            "BlueShift",
            "BlueFuzz",
            "StemSnapH",
            "StemSnapV",
            "ForceBold",
            0,
            0,
            "LanguageGroup",
            "ExpansionFactor",
            "initialRandomSeed",
            "SyntheticBase",
            "PostScript",
            "BaseFontName",
            "BaseFontBlend",
            0,
            0,
            0,
            0,
            0,
            0,
            "ROS",
            "CIDFontVersion",
            "CIDFontRevision",
            "CIDFontType",
            "CIDCount",
            "UIDBase",
            "FDArray",
            "FDSelect",
            "FontName"
          ];
          key = keys[b1];
          vs = 2;
        }
      }
      if (key != null) {
        dict[key] = carr.length == 1 ? carr[0] : carr;
        carr = [];
      } else
        carr.push(val);
      offset += vs;
    }
    return dict;
  };
  Typr.cmap = {};
  Typr.cmap.parse = function(data, offset, length) {
    data = new Uint8Array(data.buffer, offset, length);
    offset = 0;
    var bin = Typr._bin;
    var obj = {};
    bin.readUshort(data, offset);
    offset += 2;
    var numTables = bin.readUshort(data, offset);
    offset += 2;
    var offs = [];
    obj.tables = [];
    for (var i = 0; i < numTables; i++) {
      var platformID = bin.readUshort(data, offset);
      offset += 2;
      var encodingID = bin.readUshort(data, offset);
      offset += 2;
      var noffset = bin.readUint(data, offset);
      offset += 4;
      var id = "p" + platformID + "e" + encodingID;
      var tind = offs.indexOf(noffset);
      if (tind == -1) {
        tind = obj.tables.length;
        var subt;
        offs.push(noffset);
        var format = bin.readUshort(data, noffset);
        if (format == 0)
          subt = Typr.cmap.parse0(data, noffset);
        else if (format == 4)
          subt = Typr.cmap.parse4(data, noffset);
        else if (format == 6)
          subt = Typr.cmap.parse6(data, noffset);
        else if (format == 12)
          subt = Typr.cmap.parse12(data, noffset);
        else
          console.warn("unknown format: " + format, platformID, encodingID, noffset);
        obj.tables.push(subt);
      }
      if (obj[id] != null)
        throw "multiple tables for one platform+encoding";
      obj[id] = tind;
    }
    return obj;
  };
  Typr.cmap.parse0 = function(data, offset) {
    var bin = Typr._bin;
    var obj = {};
    obj.format = bin.readUshort(data, offset);
    offset += 2;
    var len = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    obj.map = [];
    for (var i = 0; i < len - 6; i++)
      obj.map.push(data[offset + i]);
    return obj;
  };
  Typr.cmap.parse4 = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = {};
    obj.format = bin.readUshort(data, offset);
    offset += 2;
    var length = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    var segCountX2 = bin.readUshort(data, offset);
    offset += 2;
    var segCount = segCountX2 / 2;
    obj.searchRange = bin.readUshort(data, offset);
    offset += 2;
    obj.entrySelector = bin.readUshort(data, offset);
    offset += 2;
    obj.rangeShift = bin.readUshort(data, offset);
    offset += 2;
    obj.endCount = bin.readUshorts(data, offset, segCount);
    offset += segCount * 2;
    offset += 2;
    obj.startCount = bin.readUshorts(data, offset, segCount);
    offset += segCount * 2;
    obj.idDelta = [];
    for (var i = 0; i < segCount; i++) {
      obj.idDelta.push(bin.readShort(data, offset));
      offset += 2;
    }
    obj.idRangeOffset = bin.readUshorts(data, offset, segCount);
    offset += segCount * 2;
    obj.glyphIdArray = [];
    while (offset < offset0 + length) {
      obj.glyphIdArray.push(bin.readUshort(data, offset));
      offset += 2;
    }
    return obj;
  };
  Typr.cmap.parse6 = function(data, offset) {
    var bin = Typr._bin;
    var obj = {};
    obj.format = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    obj.firstCode = bin.readUshort(data, offset);
    offset += 2;
    var entryCount = bin.readUshort(data, offset);
    offset += 2;
    obj.glyphIdArray = [];
    for (var i = 0; i < entryCount; i++) {
      obj.glyphIdArray.push(bin.readUshort(data, offset));
      offset += 2;
    }
    return obj;
  };
  Typr.cmap.parse12 = function(data, offset) {
    var bin = Typr._bin;
    var obj = {};
    obj.format = bin.readUshort(data, offset);
    offset += 2;
    offset += 2;
    bin.readUint(data, offset);
    offset += 4;
    bin.readUint(data, offset);
    offset += 4;
    var nGroups = bin.readUint(data, offset);
    offset += 4;
    obj.groups = [];
    for (var i = 0; i < nGroups; i++) {
      var off = offset + i * 12;
      var startCharCode = bin.readUint(data, off + 0);
      var endCharCode = bin.readUint(data, off + 4);
      var startGlyphID = bin.readUint(data, off + 8);
      obj.groups.push([startCharCode, endCharCode, startGlyphID]);
    }
    return obj;
  };
  Typr.glyf = {};
  Typr.glyf.parse = function(data, offset, length, font) {
    var obj = [];
    for (var g = 0; g < font.maxp.numGlyphs; g++)
      obj.push(null);
    return obj;
  };
  Typr.glyf._parseGlyf = function(font, g) {
    var bin = Typr._bin;
    var data = font._data;
    var offset = Typr._tabOffset(data, "glyf", font._offset) + font.loca[g];
    if (font.loca[g] == font.loca[g + 1])
      return null;
    var gl = {};
    gl.noc = bin.readShort(data, offset);
    offset += 2;
    gl.xMin = bin.readShort(data, offset);
    offset += 2;
    gl.yMin = bin.readShort(data, offset);
    offset += 2;
    gl.xMax = bin.readShort(data, offset);
    offset += 2;
    gl.yMax = bin.readShort(data, offset);
    offset += 2;
    if (gl.xMin >= gl.xMax || gl.yMin >= gl.yMax)
      return null;
    if (gl.noc > 0) {
      gl.endPts = [];
      for (var i = 0; i < gl.noc; i++) {
        gl.endPts.push(bin.readUshort(data, offset));
        offset += 2;
      }
      var instructionLength = bin.readUshort(data, offset);
      offset += 2;
      if (data.length - offset < instructionLength)
        return null;
      gl.instructions = bin.readBytes(data, offset, instructionLength);
      offset += instructionLength;
      var crdnum = gl.endPts[gl.noc - 1] + 1;
      gl.flags = [];
      for (var i = 0; i < crdnum; i++) {
        var flag = data[offset];
        offset++;
        gl.flags.push(flag);
        if ((flag & 8) != 0) {
          var rep = data[offset];
          offset++;
          for (var j = 0; j < rep; j++) {
            gl.flags.push(flag);
            i++;
          }
        }
      }
      gl.xs = [];
      for (var i = 0; i < crdnum; i++) {
        var i8 = (gl.flags[i] & 2) != 0, same = (gl.flags[i] & 16) != 0;
        if (i8) {
          gl.xs.push(same ? data[offset] : -data[offset]);
          offset++;
        } else {
          if (same)
            gl.xs.push(0);
          else {
            gl.xs.push(bin.readShort(data, offset));
            offset += 2;
          }
        }
      }
      gl.ys = [];
      for (var i = 0; i < crdnum; i++) {
        var i8 = (gl.flags[i] & 4) != 0, same = (gl.flags[i] & 32) != 0;
        if (i8) {
          gl.ys.push(same ? data[offset] : -data[offset]);
          offset++;
        } else {
          if (same)
            gl.ys.push(0);
          else {
            gl.ys.push(bin.readShort(data, offset));
            offset += 2;
          }
        }
      }
      var x = 0, y = 0;
      for (var i = 0; i < crdnum; i++) {
        x += gl.xs[i];
        y += gl.ys[i];
        gl.xs[i] = x;
        gl.ys[i] = y;
      }
    } else {
      var ARG_1_AND_2_ARE_WORDS = 1 << 0;
      var ARGS_ARE_XY_VALUES = 1 << 1;
      var WE_HAVE_A_SCALE = 1 << 3;
      var MORE_COMPONENTS = 1 << 5;
      var WE_HAVE_AN_X_AND_Y_SCALE = 1 << 6;
      var WE_HAVE_A_TWO_BY_TWO = 1 << 7;
      var WE_HAVE_INSTRUCTIONS = 1 << 8;
      gl.parts = [];
      var flags;
      do {
        flags = bin.readUshort(data, offset);
        offset += 2;
        var part = { m: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }, p1: -1, p2: -1 };
        gl.parts.push(part);
        part.glyphIndex = bin.readUshort(data, offset);
        offset += 2;
        if (flags & ARG_1_AND_2_ARE_WORDS) {
          var arg1 = bin.readShort(data, offset);
          offset += 2;
          var arg2 = bin.readShort(data, offset);
          offset += 2;
        } else {
          var arg1 = bin.readInt8(data, offset);
          offset++;
          var arg2 = bin.readInt8(data, offset);
          offset++;
        }
        if (flags & ARGS_ARE_XY_VALUES) {
          part.m.tx = arg1;
          part.m.ty = arg2;
        } else {
          part.p1 = arg1;
          part.p2 = arg2;
        }
        if (flags & WE_HAVE_A_SCALE) {
          part.m.a = part.m.d = bin.readF2dot14(data, offset);
          offset += 2;
        } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
          part.m.a = bin.readF2dot14(data, offset);
          offset += 2;
          part.m.d = bin.readF2dot14(data, offset);
          offset += 2;
        } else if (flags & WE_HAVE_A_TWO_BY_TWO) {
          part.m.a = bin.readF2dot14(data, offset);
          offset += 2;
          part.m.b = bin.readF2dot14(data, offset);
          offset += 2;
          part.m.c = bin.readF2dot14(data, offset);
          offset += 2;
          part.m.d = bin.readF2dot14(data, offset);
          offset += 2;
        }
      } while (flags & MORE_COMPONENTS);
      if (flags & WE_HAVE_INSTRUCTIONS) {
        var numInstr = bin.readUshort(data, offset);
        offset += 2;
        gl.instr = [];
        for (var i = 0; i < numInstr; i++) {
          gl.instr.push(data[offset]);
          offset++;
        }
      }
    }
    return gl;
  };
  Typr.GPOS = {};
  Typr.GPOS.parse = function(data, offset, length, font) {
    return Typr._lctf.parse(data, offset, length, font, Typr.GPOS.subt);
  };
  Typr.GPOS.subt = function(data, ltype, offset, ltable) {
    var bin = Typr._bin, offset0 = offset, tab = {};
    tab.fmt = bin.readUshort(data, offset);
    offset += 2;
    if (ltype == 1 || ltype == 2 || ltype == 3 || ltype == 7 || ltype == 8 && tab.fmt <= 2) {
      var covOff = bin.readUshort(data, offset);
      offset += 2;
      tab.coverage = Typr._lctf.readCoverage(data, covOff + offset0);
    }
    if (ltype == 1 && tab.fmt == 1) {
      var valFmt1 = bin.readUshort(data, offset);
      offset += 2;
      var ones1 = Typr._lctf.numOfOnes(valFmt1);
      if (valFmt1 != 0)
        tab.pos = Typr.GPOS.readValueRecord(data, offset, valFmt1);
    } else if (ltype == 2 && tab.fmt >= 1 && tab.fmt <= 2) {
      var valFmt1 = bin.readUshort(data, offset);
      offset += 2;
      var valFmt2 = bin.readUshort(data, offset);
      offset += 2;
      var ones1 = Typr._lctf.numOfOnes(valFmt1);
      var ones2 = Typr._lctf.numOfOnes(valFmt2);
      if (tab.fmt == 1) {
        tab.pairsets = [];
        var psc = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < psc; i++) {
          var psoff = offset0 + bin.readUshort(data, offset);
          offset += 2;
          var pvc = bin.readUshort(data, psoff);
          psoff += 2;
          var arr = [];
          for (var j = 0; j < pvc; j++) {
            var gid2 = bin.readUshort(data, psoff);
            psoff += 2;
            var value1, value2;
            if (valFmt1 != 0) {
              value1 = Typr.GPOS.readValueRecord(data, psoff, valFmt1);
              psoff += ones1 * 2;
            }
            if (valFmt2 != 0) {
              value2 = Typr.GPOS.readValueRecord(data, psoff, valFmt2);
              psoff += ones2 * 2;
            }
            arr.push({ gid2, val1: value1, val2: value2 });
          }
          tab.pairsets.push(arr);
        }
      }
      if (tab.fmt == 2) {
        var classDef1 = bin.readUshort(data, offset);
        offset += 2;
        var classDef2 = bin.readUshort(data, offset);
        offset += 2;
        var class1Count = bin.readUshort(data, offset);
        offset += 2;
        var class2Count = bin.readUshort(data, offset);
        offset += 2;
        tab.classDef1 = Typr._lctf.readClassDef(data, offset0 + classDef1);
        tab.classDef2 = Typr._lctf.readClassDef(data, offset0 + classDef2);
        tab.matrix = [];
        for (var i = 0; i < class1Count; i++) {
          var row = [];
          for (var j = 0; j < class2Count; j++) {
            var value1 = null, value2 = null;
            if (valFmt1 != 0) {
              value1 = Typr.GPOS.readValueRecord(data, offset, valFmt1);
              offset += ones1 * 2;
            }
            if (valFmt2 != 0) {
              value2 = Typr.GPOS.readValueRecord(data, offset, valFmt2);
              offset += ones2 * 2;
            }
            row.push({ val1: value1, val2: value2 });
          }
          tab.matrix.push(row);
        }
      }
    } else if (ltype == 9 && tab.fmt == 1) {
      var extType = bin.readUshort(data, offset);
      offset += 2;
      var extOffset = bin.readUint(data, offset);
      offset += 4;
      if (ltable.ltype == 9) {
        ltable.ltype = extType;
      } else if (ltable.ltype != extType) {
        throw "invalid extension substitution";
      }
      return Typr.GPOS.subt(data, ltable.ltype, offset0 + extOffset);
    } else
      console.warn("unsupported GPOS table LookupType", ltype, "format", tab.fmt);
    return tab;
  };
  Typr.GPOS.readValueRecord = function(data, offset, valFmt) {
    var bin = Typr._bin;
    var arr = [];
    arr.push(valFmt & 1 ? bin.readShort(data, offset) : 0);
    offset += valFmt & 1 ? 2 : 0;
    arr.push(valFmt & 2 ? bin.readShort(data, offset) : 0);
    offset += valFmt & 2 ? 2 : 0;
    arr.push(valFmt & 4 ? bin.readShort(data, offset) : 0);
    offset += valFmt & 4 ? 2 : 0;
    arr.push(valFmt & 8 ? bin.readShort(data, offset) : 0);
    offset += valFmt & 8 ? 2 : 0;
    return arr;
  };
  Typr.GSUB = {};
  Typr.GSUB.parse = function(data, offset, length, font) {
    return Typr._lctf.parse(data, offset, length, font, Typr.GSUB.subt);
  };
  Typr.GSUB.subt = function(data, ltype, offset, ltable) {
    var bin = Typr._bin, offset0 = offset, tab = {};
    tab.fmt = bin.readUshort(data, offset);
    offset += 2;
    if (ltype != 1 && ltype != 4 && ltype != 5 && ltype != 6)
      return null;
    if (ltype == 1 || ltype == 4 || ltype == 5 && tab.fmt <= 2 || ltype == 6 && tab.fmt <= 2) {
      var covOff = bin.readUshort(data, offset);
      offset += 2;
      tab.coverage = Typr._lctf.readCoverage(data, offset0 + covOff);
    }
    if (ltype == 1 && tab.fmt >= 1 && tab.fmt <= 2) {
      if (tab.fmt == 1) {
        tab.delta = bin.readShort(data, offset);
        offset += 2;
      } else if (tab.fmt == 2) {
        var cnt = bin.readUshort(data, offset);
        offset += 2;
        tab.newg = bin.readUshorts(data, offset, cnt);
        offset += tab.newg.length * 2;
      }
    } else if (ltype == 4) {
      tab.vals = [];
      var cnt = bin.readUshort(data, offset);
      offset += 2;
      for (var i = 0; i < cnt; i++) {
        var loff = bin.readUshort(data, offset);
        offset += 2;
        tab.vals.push(Typr.GSUB.readLigatureSet(data, offset0 + loff));
      }
    } else if (ltype == 5 && tab.fmt == 2) {
      if (tab.fmt == 2) {
        var cDefOffset = bin.readUshort(data, offset);
        offset += 2;
        tab.cDef = Typr._lctf.readClassDef(data, offset0 + cDefOffset);
        tab.scset = [];
        var subClassSetCount = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < subClassSetCount; i++) {
          var scsOff = bin.readUshort(data, offset);
          offset += 2;
          tab.scset.push(scsOff == 0 ? null : Typr.GSUB.readSubClassSet(data, offset0 + scsOff));
        }
      }
    } else if (ltype == 6 && tab.fmt == 3) {
      if (tab.fmt == 3) {
        for (var i = 0; i < 3; i++) {
          var cnt = bin.readUshort(data, offset);
          offset += 2;
          var cvgs = [];
          for (var j = 0; j < cnt; j++)
            cvgs.push(Typr._lctf.readCoverage(data, offset0 + bin.readUshort(data, offset + j * 2)));
          offset += cnt * 2;
          if (i == 0)
            tab.backCvg = cvgs;
          if (i == 1)
            tab.inptCvg = cvgs;
          if (i == 2)
            tab.ahedCvg = cvgs;
        }
        var cnt = bin.readUshort(data, offset);
        offset += 2;
        tab.lookupRec = Typr.GSUB.readSubstLookupRecords(data, offset, cnt);
      }
    } else if (ltype == 7 && tab.fmt == 1) {
      var extType = bin.readUshort(data, offset);
      offset += 2;
      var extOffset = bin.readUint(data, offset);
      offset += 4;
      if (ltable.ltype == 9) {
        ltable.ltype = extType;
      } else if (ltable.ltype != extType) {
        throw "invalid extension substitution";
      }
      return Typr.GSUB.subt(data, ltable.ltype, offset0 + extOffset);
    } else
      console.warn("unsupported GSUB table LookupType", ltype, "format", tab.fmt);
    return tab;
  };
  Typr.GSUB.readSubClassSet = function(data, offset) {
    var rUs = Typr._bin.readUshort, offset0 = offset, lset = [];
    var cnt = rUs(data, offset);
    offset += 2;
    for (var i = 0; i < cnt; i++) {
      var loff = rUs(data, offset);
      offset += 2;
      lset.push(Typr.GSUB.readSubClassRule(data, offset0 + loff));
    }
    return lset;
  };
  Typr.GSUB.readSubClassRule = function(data, offset) {
    var rUs = Typr._bin.readUshort, rule = {};
    var gcount = rUs(data, offset);
    offset += 2;
    var scount = rUs(data, offset);
    offset += 2;
    rule.input = [];
    for (var i = 0; i < gcount - 1; i++) {
      rule.input.push(rUs(data, offset));
      offset += 2;
    }
    rule.substLookupRecords = Typr.GSUB.readSubstLookupRecords(data, offset, scount);
    return rule;
  };
  Typr.GSUB.readSubstLookupRecords = function(data, offset, cnt) {
    var rUs = Typr._bin.readUshort;
    var out = [];
    for (var i = 0; i < cnt; i++) {
      out.push(rUs(data, offset), rUs(data, offset + 2));
      offset += 4;
    }
    return out;
  };
  Typr.GSUB.readChainSubClassSet = function(data, offset) {
    var bin = Typr._bin, offset0 = offset, lset = [];
    var cnt = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < cnt; i++) {
      var loff = bin.readUshort(data, offset);
      offset += 2;
      lset.push(Typr.GSUB.readChainSubClassRule(data, offset0 + loff));
    }
    return lset;
  };
  Typr.GSUB.readChainSubClassRule = function(data, offset) {
    var bin = Typr._bin, rule = {};
    var pps = ["backtrack", "input", "lookahead"];
    for (var pi = 0; pi < pps.length; pi++) {
      var cnt = bin.readUshort(data, offset);
      offset += 2;
      if (pi == 1)
        cnt--;
      rule[pps[pi]] = bin.readUshorts(data, offset, cnt);
      offset += rule[pps[pi]].length * 2;
    }
    var cnt = bin.readUshort(data, offset);
    offset += 2;
    rule.subst = bin.readUshorts(data, offset, cnt * 2);
    offset += rule.subst.length * 2;
    return rule;
  };
  Typr.GSUB.readLigatureSet = function(data, offset) {
    var bin = Typr._bin, offset0 = offset, lset = [];
    var lcnt = bin.readUshort(data, offset);
    offset += 2;
    for (var j = 0; j < lcnt; j++) {
      var loff = bin.readUshort(data, offset);
      offset += 2;
      lset.push(Typr.GSUB.readLigature(data, offset0 + loff));
    }
    return lset;
  };
  Typr.GSUB.readLigature = function(data, offset) {
    var bin = Typr._bin, lig = { chain: [] };
    lig.nglyph = bin.readUshort(data, offset);
    offset += 2;
    var ccnt = bin.readUshort(data, offset);
    offset += 2;
    for (var k = 0; k < ccnt - 1; k++) {
      lig.chain.push(bin.readUshort(data, offset));
      offset += 2;
    }
    return lig;
  };
  Typr.head = {};
  Typr.head.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    bin.readFixed(data, offset);
    offset += 4;
    obj.fontRevision = bin.readFixed(data, offset);
    offset += 4;
    bin.readUint(data, offset);
    offset += 4;
    bin.readUint(data, offset);
    offset += 4;
    obj.flags = bin.readUshort(data, offset);
    offset += 2;
    obj.unitsPerEm = bin.readUshort(data, offset);
    offset += 2;
    obj.created = bin.readUint64(data, offset);
    offset += 8;
    obj.modified = bin.readUint64(data, offset);
    offset += 8;
    obj.xMin = bin.readShort(data, offset);
    offset += 2;
    obj.yMin = bin.readShort(data, offset);
    offset += 2;
    obj.xMax = bin.readShort(data, offset);
    offset += 2;
    obj.yMax = bin.readShort(data, offset);
    offset += 2;
    obj.macStyle = bin.readUshort(data, offset);
    offset += 2;
    obj.lowestRecPPEM = bin.readUshort(data, offset);
    offset += 2;
    obj.fontDirectionHint = bin.readShort(data, offset);
    offset += 2;
    obj.indexToLocFormat = bin.readShort(data, offset);
    offset += 2;
    obj.glyphDataFormat = bin.readShort(data, offset);
    offset += 2;
    return obj;
  };
  Typr.hhea = {};
  Typr.hhea.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    bin.readFixed(data, offset);
    offset += 4;
    obj.ascender = bin.readShort(data, offset);
    offset += 2;
    obj.descender = bin.readShort(data, offset);
    offset += 2;
    obj.lineGap = bin.readShort(data, offset);
    offset += 2;
    obj.advanceWidthMax = bin.readUshort(data, offset);
    offset += 2;
    obj.minLeftSideBearing = bin.readShort(data, offset);
    offset += 2;
    obj.minRightSideBearing = bin.readShort(data, offset);
    offset += 2;
    obj.xMaxExtent = bin.readShort(data, offset);
    offset += 2;
    obj.caretSlopeRise = bin.readShort(data, offset);
    offset += 2;
    obj.caretSlopeRun = bin.readShort(data, offset);
    offset += 2;
    obj.caretOffset = bin.readShort(data, offset);
    offset += 2;
    offset += 4 * 2;
    obj.metricDataFormat = bin.readShort(data, offset);
    offset += 2;
    obj.numberOfHMetrics = bin.readUshort(data, offset);
    offset += 2;
    return obj;
  };
  Typr.hmtx = {};
  Typr.hmtx.parse = function(data, offset, length, font) {
    var bin = Typr._bin;
    var obj = {};
    obj.aWidth = [];
    obj.lsBearing = [];
    var aw = 0, lsb = 0;
    for (var i = 0; i < font.maxp.numGlyphs; i++) {
      if (i < font.hhea.numberOfHMetrics) {
        aw = bin.readUshort(data, offset);
        offset += 2;
        lsb = bin.readShort(data, offset);
        offset += 2;
      }
      obj.aWidth.push(aw);
      obj.lsBearing.push(lsb);
    }
    return obj;
  };
  Typr.kern = {};
  Typr.kern.parse = function(data, offset, length, font) {
    var bin = Typr._bin;
    var version = bin.readUshort(data, offset);
    offset += 2;
    if (version == 1)
      return Typr.kern.parseV1(data, offset - 2, length, font);
    var nTables = bin.readUshort(data, offset);
    offset += 2;
    var map2 = { glyph1: [], rval: [] };
    for (var i = 0; i < nTables; i++) {
      offset += 2;
      var length = bin.readUshort(data, offset);
      offset += 2;
      var coverage = bin.readUshort(data, offset);
      offset += 2;
      var format = coverage >>> 8;
      format &= 15;
      if (format == 0)
        offset = Typr.kern.readFormat0(data, offset, map2);
      else
        throw "unknown kern table format: " + format;
    }
    return map2;
  };
  Typr.kern.parseV1 = function(data, offset, length, font) {
    var bin = Typr._bin;
    bin.readFixed(data, offset);
    offset += 4;
    var nTables = bin.readUint(data, offset);
    offset += 4;
    var map2 = { glyph1: [], rval: [] };
    for (var i = 0; i < nTables; i++) {
      bin.readUint(data, offset);
      offset += 4;
      var coverage = bin.readUshort(data, offset);
      offset += 2;
      bin.readUshort(data, offset);
      offset += 2;
      var format = coverage >>> 8;
      format &= 15;
      if (format == 0)
        offset = Typr.kern.readFormat0(data, offset, map2);
      else
        throw "unknown kern table format: " + format;
    }
    return map2;
  };
  Typr.kern.readFormat0 = function(data, offset, map2) {
    var bin = Typr._bin;
    var pleft = -1;
    var nPairs = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    for (var j = 0; j < nPairs; j++) {
      var left = bin.readUshort(data, offset);
      offset += 2;
      var right = bin.readUshort(data, offset);
      offset += 2;
      var value = bin.readShort(data, offset);
      offset += 2;
      if (left != pleft) {
        map2.glyph1.push(left);
        map2.rval.push({ glyph2: [], vals: [] });
      }
      var rval = map2.rval[map2.rval.length - 1];
      rval.glyph2.push(right);
      rval.vals.push(value);
      pleft = left;
    }
    return offset;
  };
  Typr.loca = {};
  Typr.loca.parse = function(data, offset, length, font) {
    var bin = Typr._bin;
    var obj = [];
    var ver = font.head.indexToLocFormat;
    var len = font.maxp.numGlyphs + 1;
    if (ver == 0)
      for (var i = 0; i < len; i++)
        obj.push(bin.readUshort(data, offset + (i << 1)) << 1);
    if (ver == 1)
      for (var i = 0; i < len; i++)
        obj.push(bin.readUint(data, offset + (i << 2)));
    return obj;
  };
  Typr.maxp = {};
  Typr.maxp.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    var ver = bin.readUint(data, offset);
    offset += 4;
    obj.numGlyphs = bin.readUshort(data, offset);
    offset += 2;
    if (ver == 65536) {
      obj.maxPoints = bin.readUshort(data, offset);
      offset += 2;
      obj.maxContours = bin.readUshort(data, offset);
      offset += 2;
      obj.maxCompositePoints = bin.readUshort(data, offset);
      offset += 2;
      obj.maxCompositeContours = bin.readUshort(data, offset);
      offset += 2;
      obj.maxZones = bin.readUshort(data, offset);
      offset += 2;
      obj.maxTwilightPoints = bin.readUshort(data, offset);
      offset += 2;
      obj.maxStorage = bin.readUshort(data, offset);
      offset += 2;
      obj.maxFunctionDefs = bin.readUshort(data, offset);
      offset += 2;
      obj.maxInstructionDefs = bin.readUshort(data, offset);
      offset += 2;
      obj.maxStackElements = bin.readUshort(data, offset);
      offset += 2;
      obj.maxSizeOfInstructions = bin.readUshort(data, offset);
      offset += 2;
      obj.maxComponentElements = bin.readUshort(data, offset);
      offset += 2;
      obj.maxComponentDepth = bin.readUshort(data, offset);
      offset += 2;
    }
    return obj;
  };
  Typr.name = {};
  Typr.name.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    bin.readUshort(data, offset);
    offset += 2;
    var count = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    var names2 = [
      "copyright",
      "fontFamily",
      "fontSubfamily",
      "ID",
      "fullName",
      "version",
      "postScriptName",
      "trademark",
      "manufacturer",
      "designer",
      "description",
      "urlVendor",
      "urlDesigner",
      "licence",
      "licenceURL",
      "---",
      "typoFamilyName",
      "typoSubfamilyName",
      "compatibleFull",
      "sampleText",
      "postScriptCID",
      "wwsFamilyName",
      "wwsSubfamilyName",
      "lightPalette",
      "darkPalette"
    ];
    var offset0 = offset;
    for (var i = 0; i < count; i++) {
      var platformID = bin.readUshort(data, offset);
      offset += 2;
      var encodingID = bin.readUshort(data, offset);
      offset += 2;
      var languageID = bin.readUshort(data, offset);
      offset += 2;
      var nameID = bin.readUshort(data, offset);
      offset += 2;
      var slen = bin.readUshort(data, offset);
      offset += 2;
      var noffset = bin.readUshort(data, offset);
      offset += 2;
      var cname = names2[nameID];
      var soff = offset0 + count * 12 + noffset;
      var str;
      if (platformID == 0)
        str = bin.readUnicode(data, soff, slen / 2);
      else if (platformID == 3 && encodingID == 0)
        str = bin.readUnicode(data, soff, slen / 2);
      else if (encodingID == 0)
        str = bin.readASCII(data, soff, slen);
      else if (encodingID == 1)
        str = bin.readUnicode(data, soff, slen / 2);
      else if (encodingID == 3)
        str = bin.readUnicode(data, soff, slen / 2);
      else if (platformID == 1) {
        str = bin.readASCII(data, soff, slen);
        console.warn("reading unknown MAC encoding " + encodingID + " as ASCII");
      } else
        throw "unknown encoding " + encodingID + ", platformID: " + platformID;
      var tid = "p" + platformID + "," + languageID.toString(16);
      if (obj[tid] == null)
        obj[tid] = {};
      obj[tid][cname !== void 0 ? cname : nameID] = str;
      obj[tid]._lang = languageID;
    }
    for (var p in obj)
      if (obj[p].postScriptName != null && obj[p]._lang == 1033)
        return obj[p];
    for (var p in obj)
      if (obj[p].postScriptName != null && obj[p]._lang == 0)
        return obj[p];
    for (var p in obj)
      if (obj[p].postScriptName != null && obj[p]._lang == 3084)
        return obj[p];
    for (var p in obj)
      if (obj[p].postScriptName != null)
        return obj[p];
    var tname;
    for (var p in obj) {
      tname = p;
      break;
    }
    console.warn("returning name table with languageID " + obj[tname]._lang);
    return obj[tname];
  };
  Typr["OS/2"] = {};
  Typr["OS/2"].parse = function(data, offset, length) {
    var bin = Typr._bin;
    var ver = bin.readUshort(data, offset);
    offset += 2;
    var obj = {};
    if (ver == 0)
      Typr["OS/2"].version0(data, offset, obj);
    else if (ver == 1)
      Typr["OS/2"].version1(data, offset, obj);
    else if (ver == 2 || ver == 3 || ver == 4)
      Typr["OS/2"].version2(data, offset, obj);
    else if (ver == 5)
      Typr["OS/2"].version5(data, offset, obj);
    else
      throw "unknown OS/2 table version: " + ver;
    return obj;
  };
  Typr["OS/2"].version0 = function(data, offset, obj) {
    var bin = Typr._bin;
    obj.xAvgCharWidth = bin.readShort(data, offset);
    offset += 2;
    obj.usWeightClass = bin.readUshort(data, offset);
    offset += 2;
    obj.usWidthClass = bin.readUshort(data, offset);
    offset += 2;
    obj.fsType = bin.readUshort(data, offset);
    offset += 2;
    obj.ySubscriptXSize = bin.readShort(data, offset);
    offset += 2;
    obj.ySubscriptYSize = bin.readShort(data, offset);
    offset += 2;
    obj.ySubscriptXOffset = bin.readShort(data, offset);
    offset += 2;
    obj.ySubscriptYOffset = bin.readShort(data, offset);
    offset += 2;
    obj.ySuperscriptXSize = bin.readShort(data, offset);
    offset += 2;
    obj.ySuperscriptYSize = bin.readShort(data, offset);
    offset += 2;
    obj.ySuperscriptXOffset = bin.readShort(data, offset);
    offset += 2;
    obj.ySuperscriptYOffset = bin.readShort(data, offset);
    offset += 2;
    obj.yStrikeoutSize = bin.readShort(data, offset);
    offset += 2;
    obj.yStrikeoutPosition = bin.readShort(data, offset);
    offset += 2;
    obj.sFamilyClass = bin.readShort(data, offset);
    offset += 2;
    obj.panose = bin.readBytes(data, offset, 10);
    offset += 10;
    obj.ulUnicodeRange1 = bin.readUint(data, offset);
    offset += 4;
    obj.ulUnicodeRange2 = bin.readUint(data, offset);
    offset += 4;
    obj.ulUnicodeRange3 = bin.readUint(data, offset);
    offset += 4;
    obj.ulUnicodeRange4 = bin.readUint(data, offset);
    offset += 4;
    obj.achVendID = [bin.readInt8(data, offset), bin.readInt8(data, offset + 1), bin.readInt8(data, offset + 2), bin.readInt8(data, offset + 3)];
    offset += 4;
    obj.fsSelection = bin.readUshort(data, offset);
    offset += 2;
    obj.usFirstCharIndex = bin.readUshort(data, offset);
    offset += 2;
    obj.usLastCharIndex = bin.readUshort(data, offset);
    offset += 2;
    obj.sTypoAscender = bin.readShort(data, offset);
    offset += 2;
    obj.sTypoDescender = bin.readShort(data, offset);
    offset += 2;
    obj.sTypoLineGap = bin.readShort(data, offset);
    offset += 2;
    obj.usWinAscent = bin.readUshort(data, offset);
    offset += 2;
    obj.usWinDescent = bin.readUshort(data, offset);
    offset += 2;
    return offset;
  };
  Typr["OS/2"].version1 = function(data, offset, obj) {
    var bin = Typr._bin;
    offset = Typr["OS/2"].version0(data, offset, obj);
    obj.ulCodePageRange1 = bin.readUint(data, offset);
    offset += 4;
    obj.ulCodePageRange2 = bin.readUint(data, offset);
    offset += 4;
    return offset;
  };
  Typr["OS/2"].version2 = function(data, offset, obj) {
    var bin = Typr._bin;
    offset = Typr["OS/2"].version1(data, offset, obj);
    obj.sxHeight = bin.readShort(data, offset);
    offset += 2;
    obj.sCapHeight = bin.readShort(data, offset);
    offset += 2;
    obj.usDefault = bin.readUshort(data, offset);
    offset += 2;
    obj.usBreak = bin.readUshort(data, offset);
    offset += 2;
    obj.usMaxContext = bin.readUshort(data, offset);
    offset += 2;
    return offset;
  };
  Typr["OS/2"].version5 = function(data, offset, obj) {
    var bin = Typr._bin;
    offset = Typr["OS/2"].version2(data, offset, obj);
    obj.usLowerOpticalPointSize = bin.readUshort(data, offset);
    offset += 2;
    obj.usUpperOpticalPointSize = bin.readUshort(data, offset);
    offset += 2;
    return offset;
  };
  Typr.post = {};
  Typr.post.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    obj.version = bin.readFixed(data, offset);
    offset += 4;
    obj.italicAngle = bin.readFixed(data, offset);
    offset += 4;
    obj.underlinePosition = bin.readShort(data, offset);
    offset += 2;
    obj.underlineThickness = bin.readShort(data, offset);
    offset += 2;
    return obj;
  };
  Typr.SVG = {};
  Typr.SVG.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = { entries: [] };
    var offset0 = offset;
    bin.readUshort(data, offset);
    offset += 2;
    var svgDocIndexOffset = bin.readUint(data, offset);
    offset += 4;
    bin.readUint(data, offset);
    offset += 4;
    offset = svgDocIndexOffset + offset0;
    var numEntries = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < numEntries; i++) {
      var startGlyphID = bin.readUshort(data, offset);
      offset += 2;
      var endGlyphID = bin.readUshort(data, offset);
      offset += 2;
      var svgDocOffset = bin.readUint(data, offset);
      offset += 4;
      var svgDocLength = bin.readUint(data, offset);
      offset += 4;
      var sbuf = new Uint8Array(data.buffer, offset0 + svgDocOffset + svgDocIndexOffset, svgDocLength);
      var svg = bin.readUTF8(sbuf, 0, sbuf.length);
      for (var f = startGlyphID; f <= endGlyphID; f++) {
        obj.entries[f] = svg;
      }
    }
    return obj;
  };
  Typr.SVG.toPath = function(str) {
    var pth = { cmds: [], crds: [] };
    if (str == null)
      return pth;
    var prsr = new DOMParser();
    var doc = prsr["parseFromString"](str, "image/svg+xml");
    var svg = doc.firstChild;
    while (svg.tagName != "svg")
      svg = svg.nextSibling;
    var vb = svg.getAttribute("viewBox");
    if (vb)
      vb = vb.trim().split(" ").map(parseFloat);
    else
      vb = [0, 0, 1e3, 1e3];
    Typr.SVG._toPath(svg.children, pth);
    for (var i = 0; i < pth.crds.length; i += 2) {
      var x = pth.crds[i], y = pth.crds[i + 1];
      x -= vb[0];
      y -= vb[1];
      y = -y;
      pth.crds[i] = x;
      pth.crds[i + 1] = y;
    }
    return pth;
  };
  Typr.SVG._toPath = function(nds, pth, fill) {
    for (var ni = 0; ni < nds.length; ni++) {
      var nd = nds[ni], tn = nd.tagName;
      var cfl = nd.getAttribute("fill");
      if (cfl == null)
        cfl = fill;
      if (tn == "g")
        Typr.SVG._toPath(nd.children, pth, cfl);
      else if (tn == "path") {
        pth.cmds.push(cfl ? cfl : "#000000");
        var d = nd.getAttribute("d");
        var toks = Typr.SVG._tokens(d);
        Typr.SVG._toksToPath(toks, pth);
        pth.cmds.push("X");
      } else if (tn == "defs") ;
      else
        console.warn(tn, nd);
    }
  };
  Typr.SVG._tokens = function(d) {
    var ts = [], off = 0, rn = false, cn = "";
    while (off < d.length) {
      var cc = d.charCodeAt(off), ch = d.charAt(off);
      off++;
      var isNum = 48 <= cc && cc <= 57 || ch == "." || ch == "-";
      if (rn) {
        if (ch == "-") {
          ts.push(parseFloat(cn));
          cn = ch;
        } else if (isNum)
          cn += ch;
        else {
          ts.push(parseFloat(cn));
          if (ch != "," && ch != " ")
            ts.push(ch);
          rn = false;
        }
      } else {
        if (isNum) {
          cn = ch;
          rn = true;
        } else if (ch != "," && ch != " ")
          ts.push(ch);
      }
    }
    if (rn)
      ts.push(parseFloat(cn));
    return ts;
  };
  Typr.SVG._toksToPath = function(ts, pth) {
    var i = 0, x = 0, y = 0, ox = 0, oy = 0;
    var pc = { "M": 2, "L": 2, "H": 1, "V": 1, "S": 4, "C": 6 };
    var cmds = pth.cmds, crds = pth.crds;
    while (i < ts.length) {
      var cmd = ts[i];
      i++;
      if (cmd == "z") {
        cmds.push("Z");
        x = ox;
        y = oy;
      } else {
        var cmu = cmd.toUpperCase();
        var ps = pc[cmu], reps = Typr.SVG._reps(ts, i, ps);
        for (var j = 0; j < reps; j++) {
          var xi = 0, yi = 0;
          if (cmd != cmu) {
            xi = x;
            yi = y;
          }
          if (cmu == "M") {
            x = xi + ts[i++];
            y = yi + ts[i++];
            cmds.push("M");
            crds.push(x, y);
            ox = x;
            oy = y;
          } else if (cmu == "L") {
            x = xi + ts[i++];
            y = yi + ts[i++];
            cmds.push("L");
            crds.push(x, y);
          } else if (cmu == "H") {
            x = xi + ts[i++];
            cmds.push("L");
            crds.push(x, y);
          } else if (cmu == "V") {
            y = yi + ts[i++];
            cmds.push("L");
            crds.push(x, y);
          } else if (cmu == "C") {
            var x1 = xi + ts[i++], y1 = yi + ts[i++], x2 = xi + ts[i++], y2 = yi + ts[i++], x3 = xi + ts[i++], y3 = yi + ts[i++];
            cmds.push("C");
            crds.push(x1, y1, x2, y2, x3, y3);
            x = x3;
            y = y3;
          } else if (cmu == "S") {
            var co = Math.max(crds.length - 4, 0);
            var x1 = x + x - crds[co], y1 = y + y - crds[co + 1];
            var x2 = xi + ts[i++], y2 = yi + ts[i++], x3 = xi + ts[i++], y3 = yi + ts[i++];
            cmds.push("C");
            crds.push(x1, y1, x2, y2, x3, y3);
            x = x3;
            y = y3;
          } else
            console.warn("Unknown SVG command " + cmd);
        }
      }
    }
  };
  Typr.SVG._reps = function(ts, off, ps) {
    var i = off;
    while (i < ts.length) {
      if (typeof ts[i] == "string")
        break;
      i += ps;
    }
    return (i - off) / ps;
  };
  if (Typr == null)
    Typr = {};
  if (Typr.U == null)
    Typr.U = {};
  Typr.U.codeToGlyph = function(font, code) {
    var cmap = font.cmap;
    for (var _i = 0, _a = [cmap.p0e4, cmap.p3e1, cmap.p3e10, cmap.p0e3, cmap.p1e0]; _i < _a.length; _i++) {
      var tind = _a[_i];
      if (tind == null)
        continue;
      var tab = cmap.tables[tind];
      if (tab.format == 0) {
        if (code >= tab.map.length)
          continue;
        return tab.map[code];
      } else if (tab.format == 4) {
        var sind = -1;
        for (var i = 0; i < tab.endCount.length; i++) {
          if (code <= tab.endCount[i]) {
            sind = i;
            break;
          }
        }
        if (sind == -1)
          continue;
        if (tab.startCount[sind] > code)
          continue;
        var gli = 0;
        if (tab.idRangeOffset[sind] != 0) {
          gli = tab.glyphIdArray[code - tab.startCount[sind] + (tab.idRangeOffset[sind] >> 1) - (tab.idRangeOffset.length - sind)];
        } else {
          gli = code + tab.idDelta[sind];
        }
        return gli & 65535;
      } else if (tab.format == 12) {
        if (code > tab.groups[tab.groups.length - 1][1])
          continue;
        for (var i = 0; i < tab.groups.length; i++) {
          var grp = tab.groups[i];
          if (grp[0] <= code && code <= grp[1])
            return grp[2] + (code - grp[0]);
        }
        continue;
      } else {
        throw "unknown cmap table format " + tab.format;
      }
    }
    return 0;
  };
  Typr.U.glyphToPath = function(font, gid) {
    var path = { cmds: [], crds: [] };
    if (font.SVG && font.SVG.entries[gid]) {
      var p = font.SVG.entries[gid];
      if (p == null)
        return path;
      if (typeof p == "string") {
        p = Typr.SVG.toPath(p);
        font.SVG.entries[gid] = p;
      }
      return p;
    } else if (font.CFF) {
      var state = { x: 0, y: 0, stack: [], nStems: 0, haveWidth: false, width: font.CFF.Private ? font.CFF.Private.defaultWidthX : 0, open: false };
      var cff = font.CFF, pdct = font.CFF.Private;
      if (cff.ROS) {
        var gi = 0;
        while (cff.FDSelect[gi + 2] <= gid)
          gi += 2;
        pdct = cff.FDArray[cff.FDSelect[gi + 1]].Private;
      }
      Typr.U._drawCFF(font.CFF.CharStrings[gid], state, cff, pdct, path);
    } else if (font.glyf) {
      Typr.U._drawGlyf(gid, font, path);
    }
    return path;
  };
  Typr.U._drawGlyf = function(gid, font, path) {
    var gl = font.glyf[gid];
    if (gl == null)
      gl = font.glyf[gid] = Typr.glyf._parseGlyf(font, gid);
    if (gl != null) {
      if (gl.noc > -1) {
        Typr.U._simpleGlyph(gl, path);
      } else {
        Typr.U._compoGlyph(gl, font, path);
      }
    }
  };
  Typr.U._simpleGlyph = function(gl, p) {
    for (var c = 0; c < gl.noc; c++) {
      var i0 = c == 0 ? 0 : gl.endPts[c - 1] + 1;
      var il = gl.endPts[c];
      for (var i = i0; i <= il; i++) {
        var pr = i == i0 ? il : i - 1;
        var nx = i == il ? i0 : i + 1;
        var onCurve = gl.flags[i] & 1;
        var prOnCurve = gl.flags[pr] & 1;
        var nxOnCurve = gl.flags[nx] & 1;
        var x = gl.xs[i], y = gl.ys[i];
        if (i == i0) {
          if (onCurve) {
            if (prOnCurve) {
              Typr.U.P.moveTo(p, gl.xs[pr], gl.ys[pr]);
            } else {
              Typr.U.P.moveTo(p, x, y);
              continue;
            }
          } else {
            if (prOnCurve) {
              Typr.U.P.moveTo(p, gl.xs[pr], gl.ys[pr]);
            } else {
              Typr.U.P.moveTo(p, (gl.xs[pr] + x) / 2, (gl.ys[pr] + y) / 2);
            }
          }
        }
        if (onCurve) {
          if (prOnCurve)
            Typr.U.P.lineTo(p, x, y);
        } else {
          if (nxOnCurve) {
            Typr.U.P.qcurveTo(p, x, y, gl.xs[nx], gl.ys[nx]);
          } else {
            Typr.U.P.qcurveTo(p, x, y, (x + gl.xs[nx]) / 2, (y + gl.ys[nx]) / 2);
          }
        }
      }
      Typr.U.P.closePath(p);
    }
  };
  Typr.U._compoGlyph = function(gl, font, p) {
    for (var j = 0; j < gl.parts.length; j++) {
      var path = { cmds: [], crds: [] };
      var prt = gl.parts[j];
      Typr.U._drawGlyf(prt.glyphIndex, font, path);
      var m = prt.m;
      for (var i = 0; i < path.crds.length; i += 2) {
        var x = path.crds[i], y = path.crds[i + 1];
        p.crds.push(x * m.a + y * m.b + m.tx);
        p.crds.push(x * m.c + y * m.d + m.ty);
      }
      for (var i = 0; i < path.cmds.length; i++) {
        p.cmds.push(path.cmds[i]);
      }
    }
  };
  Typr.U._getGlyphClass = function(g, cd) {
    var intr = Typr._lctf.getInterval(cd, g);
    return intr == -1 ? 0 : cd[intr + 2];
  };
  Typr.U.getPairAdjustment = function(font, g1, g2) {
    var hasGPOSkern = false;
    if (font.GPOS) {
      var gpos = font["GPOS"];
      var llist = gpos.lookupList, flist = gpos.featureList;
      var tused = [];
      for (var i = 0; i < flist.length; i++) {
        var fl = flist[i];
        if (fl.tag != "kern")
          continue;
        hasGPOSkern = true;
        for (var ti = 0; ti < fl.tab.length; ti++) {
          if (tused[fl.tab[ti]])
            continue;
          tused[fl.tab[ti]] = true;
          var tab = llist[fl.tab[ti]];
          for (var j = 0; j < tab.tabs.length; j++) {
            if (tab.tabs[j] == null)
              continue;
            var ltab = tab.tabs[j], ind;
            if (ltab.coverage) {
              ind = Typr._lctf.coverageIndex(ltab.coverage, g1);
              if (ind == -1)
                continue;
            }
            if (tab.ltype == 1) ;
            else if (tab.ltype == 2) {
              var adj = null;
              if (ltab.fmt == 1) {
                var right = ltab.pairsets[ind];
                for (var i = 0; i < right.length; i++) {
                  if (right[i].gid2 == g2)
                    adj = right[i];
                }
              } else if (ltab.fmt == 2) {
                var c1 = Typr.U._getGlyphClass(g1, ltab.classDef1);
                var c2 = Typr.U._getGlyphClass(g2, ltab.classDef2);
                adj = ltab.matrix[c1][c2];
              }
              if (adj) {
                var offset = 0;
                if (adj.val1 && adj.val1[2])
                  offset += adj.val1[2];
                if (adj.val2 && adj.val2[0])
                  offset += adj.val2[0];
                return offset;
              }
            }
          }
        }
      }
    }
    if (font.kern && !hasGPOSkern) {
      var ind1 = font.kern.glyph1.indexOf(g1);
      if (ind1 != -1) {
        var ind2 = font.kern.rval[ind1].glyph2.indexOf(g2);
        if (ind2 != -1)
          return font.kern.rval[ind1].vals[ind2];
      }
    }
    return 0;
  };
  Typr.U.stringToGlyphs = function(font, str) {
    var gls = [];
    for (var i = 0; i < str.length; i++) {
      var cc = str.codePointAt(i);
      if (cc > 65535)
        i++;
      gls.push(Typr.U.codeToGlyph(font, cc));
    }
    for (var i = 0; i < str.length; i++) {
      var cc = str.codePointAt(i);
      if (cc == 2367) {
        var t = gls[i - 1];
        gls[i - 1] = gls[i];
        gls[i] = t;
      }
      if (cc > 65535)
        i++;
    }
    var gsub = font["GSUB"];
    if (gsub == null)
      return gls;
    var llist = gsub.lookupList, flist = gsub.featureList;
    var cligs = [
      "rlig",
      "liga",
      "mset",
      "isol",
      "init",
      "fina",
      "medi",
      "half",
      "pres",
      "blws"
      /* Tibetan fonts like Himalaya.ttf */
    ];
    var tused = [];
    for (var fi = 0; fi < flist.length; fi++) {
      var fl = flist[fi];
      if (cligs.indexOf(fl.tag) == -1)
        continue;
      for (var ti = 0; ti < fl.tab.length; ti++) {
        if (tused[fl.tab[ti]])
          continue;
        tused[fl.tab[ti]] = true;
        var tab = llist[fl.tab[ti]];
        for (var ci = 0; ci < gls.length; ci++) {
          var feat = Typr.U._getWPfeature(str, ci);
          if ("isol,init,fina,medi".indexOf(fl.tag) != -1 && fl.tag != feat)
            continue;
          Typr.U._applySubs(gls, ci, tab, llist);
        }
      }
    }
    return gls;
  };
  Typr.U._getWPfeature = function(str, ci) {
    var wsep = '\n	" ,.:;!?()  ،';
    var R = "آأؤإاةدذرزوٱٲٳٵٶٷڈډڊڋڌڍڎڏڐڑڒړڔڕږڗژڙۀۃۄۅۆۇۈۉۊۋۍۏےۓەۮۯܐܕܖܗܘܙܞܨܪܬܯݍݙݚݛݫݬݱݳݴݸݹࡀࡆࡇࡉࡔࡧࡩࡪࢪࢫࢬࢮࢱࢲࢹૅેૉ૊૎૏ૐ૑૒૝ૡ૤૯஁ஃ஄அஉ஌எஏ஑னப஫஬";
    var L = "ꡲ્૗";
    var slft = ci == 0 || wsep.indexOf(str[ci - 1]) != -1;
    var srgt = ci == str.length - 1 || wsep.indexOf(str[ci + 1]) != -1;
    if (!slft && R.indexOf(str[ci - 1]) != -1)
      slft = true;
    if (!srgt && R.indexOf(str[ci]) != -1)
      srgt = true;
    if (!srgt && L.indexOf(str[ci + 1]) != -1)
      srgt = true;
    if (!slft && L.indexOf(str[ci]) != -1)
      slft = true;
    var feat = null;
    if (slft) {
      feat = srgt ? "isol" : "init";
    } else {
      feat = srgt ? "fina" : "medi";
    }
    return feat;
  };
  Typr.U._applySubs = function(gls, ci, tab, llist) {
    var rlim = gls.length - ci - 1;
    for (var j = 0; j < tab.tabs.length; j++) {
      if (tab.tabs[j] == null)
        continue;
      var ltab = tab.tabs[j], ind;
      if (ltab.coverage) {
        ind = Typr._lctf.coverageIndex(ltab.coverage, gls[ci]);
        if (ind == -1)
          continue;
      }
      if (tab.ltype == 1) {
        gls[ci];
        if (ltab.fmt == 1)
          gls[ci] = gls[ci] + ltab.delta;
        else
          gls[ci] = ltab.newg[ind];
      } else if (tab.ltype == 4) {
        var vals = ltab.vals[ind];
        for (var k = 0; k < vals.length; k++) {
          var lig = vals[k], rl = lig.chain.length;
          if (rl > rlim)
            continue;
          var good = true, em1 = 0;
          for (var l = 0; l < rl; l++) {
            while (gls[ci + em1 + (1 + l)] == -1)
              em1++;
            if (lig.chain[l] != gls[ci + em1 + (1 + l)])
              good = false;
          }
          if (!good)
            continue;
          gls[ci] = lig.nglyph;
          for (var l = 0; l < rl + em1; l++)
            gls[ci + l + 1] = -1;
          break;
        }
      } else if (tab.ltype == 5 && ltab.fmt == 2) {
        var cind = Typr._lctf.getInterval(ltab.cDef, gls[ci]);
        var cls = ltab.cDef[cind + 2], scs = ltab.scset[cls];
        for (var i = 0; i < scs.length; i++) {
          var sc = scs[i], inp = sc.input;
          if (inp.length > rlim)
            continue;
          var good = true;
          for (var l = 0; l < inp.length; l++) {
            var cind2 = Typr._lctf.getInterval(ltab.cDef, gls[ci + 1 + l]);
            if (cind == -1 && ltab.cDef[cind2 + 2] != inp[l]) {
              good = false;
              break;
            }
          }
          if (!good)
            continue;
          var lrs = sc.substLookupRecords;
          for (var k = 0; k < lrs.length; k += 2) {
            lrs[k];
            lrs[k + 1];
          }
        }
      } else if (tab.ltype == 6 && ltab.fmt == 3) {
        if (!Typr.U._glsCovered(gls, ltab.backCvg, ci - ltab.backCvg.length))
          continue;
        if (!Typr.U._glsCovered(gls, ltab.inptCvg, ci))
          continue;
        if (!Typr.U._glsCovered(gls, ltab.ahedCvg, ci + ltab.inptCvg.length))
          continue;
        var lr = ltab.lookupRec;
        for (var i = 0; i < lr.length; i += 2) {
          var cind = lr[i], tab2 = llist[lr[i + 1]];
          Typr.U._applySubs(gls, ci + cind, tab2, llist);
        }
      }
    }
  };
  Typr.U._glsCovered = function(gls, cvgs, ci) {
    for (var i = 0; i < cvgs.length; i++) {
      var ind = Typr._lctf.coverageIndex(cvgs[i], gls[ci + i]);
      if (ind == -1)
        return false;
    }
    return true;
  };
  Typr.U.glyphsToPath = function(font, gls, clr) {
    var tpath = { cmds: [], crds: [] };
    var x = 0;
    for (var i = 0; i < gls.length; i++) {
      var gid = gls[i];
      if (gid == -1)
        continue;
      var gid2 = i < gls.length - 1 && gls[i + 1] != -1 ? gls[i + 1] : 0;
      var path = Typr.U.glyphToPath(font, gid);
      for (var j = 0; j < path.crds.length; j += 2) {
        tpath.crds.push(path.crds[j] + x);
        tpath.crds.push(path.crds[j + 1]);
      }
      if (clr)
        tpath.cmds.push(clr);
      for (var j = 0; j < path.cmds.length; j++)
        tpath.cmds.push(path.cmds[j]);
      if (clr)
        tpath.cmds.push("X");
      x += font.hmtx.aWidth[gid];
      if (i < gls.length - 1)
        x += Typr.U.getPairAdjustment(font, gid, gid2);
    }
    return tpath;
  };
  Typr.U.pathToSVG = function(path, prec) {
    if (prec == null)
      prec = 5;
    var out = [], co = 0, lmap = { "M": 2, "L": 2, "Q": 4, "C": 6 };
    for (var i = 0; i < path.cmds.length; i++) {
      var cmd = path.cmds[i], cn = co + (lmap[cmd] ? lmap[cmd] : 0);
      out.push(cmd);
      while (co < cn) {
        var c = path.crds[co++];
        out.push(parseFloat(c.toFixed(prec)) + (co == cn ? "" : " "));
      }
    }
    return out.join("");
  };
  Typr.U.pathToContext = function(path, ctx) {
    var c = 0, crds = path.crds;
    for (var j = 0; j < path.cmds.length; j++) {
      var cmd = path.cmds[j];
      if (cmd == "M") {
        ctx.moveTo(crds[c], crds[c + 1]);
        c += 2;
      } else if (cmd == "L") {
        ctx.lineTo(crds[c], crds[c + 1]);
        c += 2;
      } else if (cmd == "C") {
        ctx.bezierCurveTo(crds[c], crds[c + 1], crds[c + 2], crds[c + 3], crds[c + 4], crds[c + 5]);
        c += 6;
      } else if (cmd == "Q") {
        ctx.quadraticCurveTo(crds[c], crds[c + 1], crds[c + 2], crds[c + 3]);
        c += 4;
      } else if (cmd.charAt(0) == "#") {
        ctx.beginPath();
        ctx.fillStyle = cmd;
      } else if (cmd == "Z") {
        ctx.closePath();
      } else if (cmd == "X") {
        ctx.fill();
      }
    }
  };
  Typr.U.P = {};
  Typr.U.P.moveTo = function(p, x, y) {
    p.cmds.push("M");
    p.crds.push(x, y);
  };
  Typr.U.P.lineTo = function(p, x, y) {
    p.cmds.push("L");
    p.crds.push(x, y);
  };
  Typr.U.P.curveTo = function(p, a, b, c, d, e, f) {
    p.cmds.push("C");
    p.crds.push(a, b, c, d, e, f);
  };
  Typr.U.P.qcurveTo = function(p, a, b, c, d) {
    p.cmds.push("Q");
    p.crds.push(a, b, c, d);
  };
  Typr.U.P.closePath = function(p) {
    p.cmds.push("Z");
  };
  Typr.U._drawCFF = function(cmds, state, font, pdct, p) {
    var stack = state.stack;
    var nStems = state.nStems, haveWidth = state.haveWidth, width = state.width, open = state.open;
    var i = 0;
    var x = state.x, y = state.y, c1x = 0, c1y = 0, c2x = 0, c2y = 0, c3x = 0, c3y = 0, c4x = 0, c4y = 0, jpx = 0, jpy = 0;
    var o = { val: 0, size: 0 };
    while (i < cmds.length) {
      Typr.CFF.getCharString(cmds, i, o);
      var v = o.val;
      i += o.size;
      if (v == "o1" || v == "o18") {
        var hasWidthArg;
        hasWidthArg = stack.length % 2 !== 0;
        if (hasWidthArg && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
        }
        nStems += stack.length >> 1;
        stack.length = 0;
        haveWidth = true;
      } else if (v == "o3" || v == "o23") {
        var hasWidthArg;
        hasWidthArg = stack.length % 2 !== 0;
        if (hasWidthArg && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
        }
        nStems += stack.length >> 1;
        stack.length = 0;
        haveWidth = true;
      } else if (v == "o4") {
        if (stack.length > 1 && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
          haveWidth = true;
        }
        if (open)
          Typr.U.P.closePath(p);
        y += stack.pop();
        Typr.U.P.moveTo(p, x, y);
        open = true;
      } else if (v == "o5") {
        while (stack.length > 0) {
          x += stack.shift();
          y += stack.shift();
          Typr.U.P.lineTo(p, x, y);
        }
      } else if (v == "o6" || v == "o7") {
        var count = stack.length;
        var isX = v == "o6";
        for (var j = 0; j < count; j++) {
          var sval = stack.shift();
          if (isX) {
            x += sval;
          } else {
            y += sval;
          }
          isX = !isX;
          Typr.U.P.lineTo(p, x, y);
        }
      } else if (v == "o8" || v == "o24") {
        var count = stack.length;
        var index = 0;
        while (index + 6 <= count) {
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          x = c2x + stack.shift();
          y = c2y + stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
          index += 6;
        }
        if (v == "o24") {
          x += stack.shift();
          y += stack.shift();
          Typr.U.P.lineTo(p, x, y);
        }
      } else if (v == "o11") {
        break;
      } else if (v == "o1234" || v == "o1235" || v == "o1236" || v == "o1237") {
        if (v == "o1234") {
          c1x = x + stack.shift();
          c1y = y;
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          jpx = c2x + stack.shift();
          jpy = c2y;
          c3x = jpx + stack.shift();
          c3y = c2y;
          c4x = c3x + stack.shift();
          c4y = y;
          x = c4x + stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
          Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
        }
        if (v == "o1235") {
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          jpx = c2x + stack.shift();
          jpy = c2y + stack.shift();
          c3x = jpx + stack.shift();
          c3y = jpy + stack.shift();
          c4x = c3x + stack.shift();
          c4y = c3y + stack.shift();
          x = c4x + stack.shift();
          y = c4y + stack.shift();
          stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
          Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
        }
        if (v == "o1236") {
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          jpx = c2x + stack.shift();
          jpy = c2y;
          c3x = jpx + stack.shift();
          c3y = c2y;
          c4x = c3x + stack.shift();
          c4y = c3y + stack.shift();
          x = c4x + stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
          Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
        }
        if (v == "o1237") {
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          jpx = c2x + stack.shift();
          jpy = c2y + stack.shift();
          c3x = jpx + stack.shift();
          c3y = jpy + stack.shift();
          c4x = c3x + stack.shift();
          c4y = c3y + stack.shift();
          if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
            x = c4x + stack.shift();
          } else {
            y = c4y + stack.shift();
          }
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
          Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
        }
      } else if (v == "o14") {
        if (stack.length > 0 && !haveWidth) {
          width = stack.shift() + font.nominalWidthX;
          haveWidth = true;
        }
        if (stack.length == 4) {
          var adx = stack.shift();
          var ady = stack.shift();
          var bchar = stack.shift();
          var achar = stack.shift();
          var bind2 = Typr.CFF.glyphBySE(font, bchar);
          var aind = Typr.CFF.glyphBySE(font, achar);
          Typr.U._drawCFF(font.CharStrings[bind2], state, font, pdct, p);
          state.x = adx;
          state.y = ady;
          Typr.U._drawCFF(font.CharStrings[aind], state, font, pdct, p);
        }
        if (open) {
          Typr.U.P.closePath(p);
          open = false;
        }
      } else if (v == "o19" || v == "o20") {
        var hasWidthArg;
        hasWidthArg = stack.length % 2 !== 0;
        if (hasWidthArg && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
        }
        nStems += stack.length >> 1;
        stack.length = 0;
        haveWidth = true;
        i += nStems + 7 >> 3;
      } else if (v == "o21") {
        if (stack.length > 2 && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
          haveWidth = true;
        }
        y += stack.pop();
        x += stack.pop();
        if (open)
          Typr.U.P.closePath(p);
        Typr.U.P.moveTo(p, x, y);
        open = true;
      } else if (v == "o22") {
        if (stack.length > 1 && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
          haveWidth = true;
        }
        x += stack.pop();
        if (open)
          Typr.U.P.closePath(p);
        Typr.U.P.moveTo(p, x, y);
        open = true;
      } else if (v == "o25") {
        while (stack.length > 6) {
          x += stack.shift();
          y += stack.shift();
          Typr.U.P.lineTo(p, x, y);
        }
        c1x = x + stack.shift();
        c1y = y + stack.shift();
        c2x = c1x + stack.shift();
        c2y = c1y + stack.shift();
        x = c2x + stack.shift();
        y = c2y + stack.shift();
        Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
      } else if (v == "o26") {
        if (stack.length % 2) {
          x += stack.shift();
        }
        while (stack.length > 0) {
          c1x = x;
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          x = c2x;
          y = c2y + stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
        }
      } else if (v == "o27") {
        if (stack.length % 2) {
          y += stack.shift();
        }
        while (stack.length > 0) {
          c1x = x + stack.shift();
          c1y = y;
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          x = c2x + stack.shift();
          y = c2y;
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
        }
      } else if (v == "o10" || v == "o29") {
        var obj = v == "o10" ? pdct : font;
        if (stack.length == 0) {
          console.warn("error: empty stack");
        } else {
          var ind = stack.pop();
          var subr = obj.Subrs[ind + obj.Bias];
          state.x = x;
          state.y = y;
          state.nStems = nStems;
          state.haveWidth = haveWidth;
          state.width = width;
          state.open = open;
          Typr.U._drawCFF(subr, state, font, pdct, p);
          x = state.x;
          y = state.y;
          nStems = state.nStems;
          haveWidth = state.haveWidth;
          width = state.width;
          open = state.open;
        }
      } else if (v == "o30" || v == "o31") {
        var count, count1 = stack.length;
        var index = 0;
        var alternate = v == "o31";
        count = count1 & ~2;
        index += count1 - count;
        while (index < count) {
          if (alternate) {
            c1x = x + stack.shift();
            c1y = y;
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            y = c2y + stack.shift();
            if (count - index == 5) {
              x = c2x + stack.shift();
              index++;
            } else {
              x = c2x;
            }
            alternate = false;
          } else {
            c1x = x;
            c1y = y + stack.shift();
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            x = c2x + stack.shift();
            if (count - index == 5) {
              y = c2y + stack.shift();
              index++;
            } else {
              y = c2y;
            }
            alternate = true;
          }
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
          index += 4;
        }
      } else if ((v + "").charAt(0) == "o") {
        console.warn("Unknown operation: " + v, cmds);
        throw v;
      } else
        stack.push(v);
    }
    state.x = x;
    state.y = y;
    state.nStems = nStems;
    state.haveWidth = haveWidth;
    state.width = width;
    state.open = open;
  };
  Typr$1.Typr = Typr;
  var Typr_js_1 = Typr$1;
  var friendlyTags = { "aalt": "Access All Alternates", "abvf": "Above-base Forms", "abvm": "Above - base Mark Positioning", "abvs": "Above - base Substitutions", "afrc": "Alternative Fractions", "akhn": "Akhands", "blwf": "Below - base Forms", "blwm": "Below - base Mark Positioning", "blws": "Below - base Substitutions", "calt": "Contextual Alternates", "case": "Case - Sensitive Forms", "ccmp": "Glyph Composition / Decomposition", "cfar": "Conjunct Form After Ro", "cjct": "Conjunct Forms", "clig": "Contextual Ligatures", "cpct": "Centered CJK Punctuation", "cpsp": "Capital Spacing", "cswh": "Contextual Swash", "curs": "Cursive Positioning", "c2pc": "Petite Capitals From Capitals", "c2sc": "Small Capitals From Capitals", "dist": "Distances", "dlig": "Discretionary Ligatures", "dnom": "Denominators", "dtls": "Dotless Forms", "expt": "Expert Forms", "falt": "Final Glyph on Line Alternates", "fin2": "Terminal Forms #2", "fin3": "Terminal Forms #3", "fina": "Terminal Forms", "flac": "Flattened accent forms", "frac": "Fractions", "fwid": "Full Widths", "half": "Half Forms", "haln": "Halant Forms", "halt": "Alternate Half Widths", "hist": "Historical Forms", "hkna": "Horizontal Kana Alternates", "hlig": "Historical Ligatures", "hngl": "Hangul", "hojo": "Hojo Kanji Forms(JIS X 0212 - 1990 Kanji Forms)", "hwid": "Half Widths", "init": "Initial Forms", "isol": "Isolated Forms", "ital": "Italics", "jalt": "Justification Alternates", "jp78": "JIS78 Forms", "jp83": "JIS83 Forms", "jp90": "JIS90 Forms", "jp04": "JIS2004 Forms", "kern": "Kerning", "lfbd": "Left Bounds", "liga": "Standard Ligatures", "ljmo": "Leading Jamo Forms", "lnum": "Lining Figures", "locl": "Localized Forms", "ltra": "Left - to - right alternates", "ltrm": "Left - to - right mirrored forms", "mark": "Mark Positioning", "med2": "Medial Forms #2", "medi": "Medial Forms", "mgrk": "Mathematical Greek", "mkmk": "Mark to Mark Positioning", "mset": "Mark Positioning via Substitution", "nalt": "Alternate Annotation Forms", "nlck": "NLC Kanji Forms", "nukt": "Nukta Forms", "numr": "Numerators", "onum": "Oldstyle Figures", "opbd": "Optical Bounds", "ordn": "Ordinals", "ornm": "Ornaments", "palt": "Proportional Alternate Widths", "pcap": "Petite Capitals", "pkna": "Proportional Kana", "pnum": "Proportional Figures", "pref": "Pre - Base Forms", "pres": "Pre - base Substitutions", "pstf": "Post - base Forms", "psts": "Post - base Substitutions", "pwid": "Proportional Widths", "qwid": "Quarter Widths", "rand": "Randomize", "rclt": "Required Contextual Alternates", "rkrf": "Rakar Forms", "rlig": "Required Ligatures", "rphf": "Reph Forms", "rtbd": "Right Bounds", "rtla": "Right - to - left alternates", "rtlm": "Right - to - left mirrored forms", "ruby": "Ruby Notation Forms", "rvrn": "Required Variation Alternates", "salt": "Stylistic Alternates", "sinf": "Scientific Inferiors", "size": "Optical size", "smcp": "Small Capitals", "smpl": "Simplified Forms", "ssty": "Math script style alternates", "stch": "Stretching Glyph Decomposition", "subs": "Subscript", "sups": "Superscript", "swsh": "Swash", "titl": "Titling", "tjmo": "Trailing Jamo Forms", "tnam": "Traditional Name Forms", "tnum": "Tabular Figures", "trad": "Traditional Forms", "twid": "Third Widths", "unic": "Unicase", "valt": "Alternate Vertical Metrics", "vatu": "Vattu Variants", "vert": "Vertical Writing", "vhal": "Alternate Vertical Half Metrics", "vjmo": "Vowel Jamo Forms", "vkna": "Vertical Kana Alternates", "vkrn": "Vertical Kerning", "vpal": "Proportional Alternate Vertical Metrics", "vrt2": "Vertical Alternates and Rotation", "vrtr": "Vertical Alternates for Rotation", "zero": "Slashed Zero" };
  var Font = (
    /** @class */
    function() {
      function Font2(data) {
        var obj = Typr_js_1.Typr.parse(data);
        if (!obj.length || typeof obj[0] !== "object" || typeof obj[0].hasOwnProperty !== "function") {
          throw "unable to parse font";
        }
        for (var n in obj[0]) {
          this[n] = obj[0][n];
        }
        this.enabledGSUB = {};
      }
      Font2.prototype.getFamilyName = function() {
        return this.name && (this.name.typoFamilyName || this.name.fontFamily) || "";
      };
      Font2.prototype.getSubFamilyName = function() {
        return this.name && (this.name.typoSubfamilyName || this.name.fontSubfamily) || "";
      };
      Font2.prototype.glyphToPath = function(gid) {
        return Typr_js_1.Typr.U.glyphToPath(this, gid);
      };
      Font2.prototype.getPairAdjustment = function(gid1, gid2) {
        return Typr_js_1.Typr.U.getPairAdjustment(this, gid1, gid2);
      };
      Font2.prototype.stringToGlyphs = function(str) {
        return Typr_js_1.Typr.U.stringToGlyphs(this, str);
      };
      Font2.prototype.glyphsToPath = function(gls) {
        return Typr_js_1.Typr.U.glyphsToPath(this, gls);
      };
      Font2.prototype.pathToSVG = function(path, prec) {
        return Typr_js_1.Typr.U.pathToSVG(path, prec);
      };
      Font2.prototype.pathToContext = function(path, ctx) {
        return Typr_js_1.Typr.U.pathToContext(path, ctx);
      };
      Font2.prototype.lookupFriendlyName = function(table, feature) {
        if (this[table] !== void 0) {
          var tbl = this[table];
          var feat = tbl.featureList[feature];
          return this.featureFriendlyName(feat);
        }
        return "";
      };
      Font2.prototype.featureFriendlyName = function(feature) {
        if (friendlyTags[feature.tag]) {
          return friendlyTags[feature.tag];
        }
        if (feature.tag.match(/ss[0-2][0-9]/)) {
          var name_1 = "Stylistic Set " + Number(feature.tag.substr(2, 2)).toString();
          if (feature.featureParams) {
            var version = Typr_js_1.Typr._bin.readUshort(this._data, feature.featureParams);
            if (version === 0) {
              var nameID = Typr_js_1.Typr._bin.readUshort(this._data, feature.featureParams + 2);
              if (this.name && this.name[nameID] !== void 0) {
                return name_1 + " - " + this.name[nameID];
              }
            }
          }
          return name_1;
        }
        if (feature.tag.match(/cv[0-9][0-9]/)) {
          return "Character Variant " + Number(feature.tag.substr(2, 2)).toString();
        }
        return "";
      };
      Font2.prototype.enableGSUB = function(featureNumber) {
        if (this.GSUB) {
          var feature = this.GSUB.featureList[featureNumber];
          if (feature) {
            for (var i = 0; i < feature.tab.length; ++i) {
              this.enabledGSUB[feature.tab[i]] = (this.enabledGSUB[feature.tab[i]] || 0) + 1;
            }
          }
        }
      };
      Font2.prototype.disableGSUB = function(featureNumber) {
        if (this.GSUB) {
          var feature = this.GSUB.featureList[featureNumber];
          if (feature) {
            for (var i = 0; i < feature.tab.length; ++i) {
              if (this.enabledGSUB[feature.tab[i]] > 1) {
                --this.enabledGSUB[feature.tab[i]];
              } else {
                delete this.enabledGSUB[feature.tab[i]];
              }
            }
          }
        }
      };
      Font2.prototype.codeToGlyph = function(code) {
        var g = Typr_js_1.Typr.U.codeToGlyph(this, code);
        if (this.GSUB) {
          var gls = [g];
          for (var n in this.enabledGSUB) {
            var l = this.GSUB.lookupList[n];
            Typr_js_1.Typr.U._applySubs(gls, 0, l, this.GSUB.lookupList);
          }
          if (gls.length === 1)
            return gls[0];
        }
        return g;
      };
      return Font2;
    }()
  );
  var Font_1 = Font;
  const base64ToUint8Array = (base64) => {
    const data = window.atob(base64);
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      buffer[i] = data.charCodeAt(i);
    }
    return buffer;
  };
  const parseResourceText = (resourceName) => {
    try {
      return JSON.parse(GM_getResourceText(resourceName));
    } catch (e) {
      console.log("parseResourceText error:", e);
      return null;
    }
  };
  const findEncryptedFontStyle = (document2) => {
    const styles = Array.from(document2.querySelectorAll("style"));
    return styles.find((style) => {
      var _a;
      return (_a = style.textContent) == null ? void 0 : _a.includes("font-cxsecret");
    });
  };
  const buildDecryptionTable = (font, lookupTable) => {
    const match = {};
    const CHINESE_CHAR_START = 19968;
    const CHINESE_CHAR_END = 40870;
    for (let charCode = CHINESE_CHAR_START; charCode < CHINESE_CHAR_END; charCode++) {
      const glyph = font.codeToGlyph(charCode);
      if (!glyph) continue;
      const path = font.glyphToPath(glyph);
      const hash = md5(JSON.stringify(path)).slice(24);
      match[charCode] = lookupTable[hash];
    }
    return match;
  };
  const replaceEncryptedText = (elements, decryptionTable) => {
    elements.forEach((el) => {
      let html = el.innerHTML;
      Object.entries(decryptionTable).forEach(([key, value]) => {
        const encryptedChar = String.fromCharCode(Number(key));
        const decryptedChar = String.fromCharCode(value);
        html = html.replace(new RegExp(encryptedChar, "g"), decryptedChar);
      });
      el.classList.remove("font-cxsecret");
      el.innerHTML = html;
    });
  };
  function decrypt(iframeDocument) {
    var _a, _b;
    const fontStyle = findEncryptedFontStyle(iframeDocument);
    if (!fontStyle) return;
    const fontData = (_b = (_a = fontStyle.textContent) == null ? void 0 : _a.match(/base64,([\w\W]+?)'/)) == null ? void 0 : _b[1];
    if (!fontData) return;
    const fontArray = base64ToUint8Array(fontData);
    const font = new Font_1(fontArray);
    const lookupTable = parseResourceText("ttf") || parseResourceText("ttf2");
    if (!lookupTable) return;
    const decryptionTable = buildDecryptionTable(font, lookupTable);
    const elements = iframeDocument.querySelectorAll(".font-cxsecret");
    replaceEncryptedText(elements, decryptionTable);
  }
  function isFunction(value) {
    return typeof value === "function";
  }
  function hasLift(source) {
    return isFunction(source === null || source === void 0 ? void 0 : source.lift);
  }
  function operate(init) {
    return function(source) {
      if (hasLift(source)) {
        return source.lift(function(liftedSource) {
          try {
            return init(liftedSource, this);
          } catch (err) {
            this.error(err);
          }
        });
      }
      throw new TypeError("Unable to lift unknown Observable type");
    };
  }
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, [])).next());
    });
  }
  function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1) throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2]) _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  }
  function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
      next: function() {
        if (o && i >= o.length) o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }
  function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  }
  function __spreadArray(to, from2, pack) {
    if (arguments.length === 2) for (var i = 0, l = from2.length, ar; i < l; i++) {
      if (ar || !(i in from2)) {
        if (!ar) ar = Array.prototype.slice.call(from2, 0, i);
        ar[i] = from2[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from2));
  }
  function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
  }
  function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
      return this;
    }, i;
    function awaitReturn(f) {
      return function(v) {
        return Promise.resolve(v).then(f, reject);
      };
    }
    function verb(n, f) {
      if (g[n]) {
        i[n] = function(v) {
          return new Promise(function(a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
        if (f) i[n] = f(i[n]);
      }
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v) {
      if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
  }
  function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
      return this;
    }, i);
    function verb(n) {
      i[n] = o[n] && function(v) {
        return new Promise(function(resolve, reject) {
          v = o[n](v), settle(resolve, reject, v.done, v.value);
        });
      };
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function(v2) {
        resolve({ value: v2, done: d });
      }, reject);
    }
  }
  typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message2) {
    var e = new Error(message2);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };
  var isArrayLike = function(x) {
    return x && typeof x.length === "number" && typeof x !== "function";
  };
  function isPromise(value) {
    return isFunction(value === null || value === void 0 ? void 0 : value.then);
  }
  function createErrorClass(createImpl) {
    var _super = function(instance) {
      Error.call(instance);
      instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
  }
  var UnsubscriptionError = createErrorClass(function(_super) {
    return function UnsubscriptionErrorImpl(errors) {
      _super(this);
      this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
        return i + 1 + ") " + err.toString();
      }).join("\n  ") : "";
      this.name = "UnsubscriptionError";
      this.errors = errors;
    };
  });
  function arrRemove(arr, item) {
    if (arr) {
      var index = arr.indexOf(item);
      0 <= index && arr.splice(index, 1);
    }
  }
  var Subscription = function() {
    function Subscription2(initialTeardown) {
      this.initialTeardown = initialTeardown;
      this.closed = false;
      this._parentage = null;
      this._finalizers = null;
    }
    Subscription2.prototype.unsubscribe = function() {
      var e_1, _a, e_2, _b;
      var errors;
      if (!this.closed) {
        this.closed = true;
        var _parentage = this._parentage;
        if (_parentage) {
          this._parentage = null;
          if (Array.isArray(_parentage)) {
            try {
              for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                var parent_1 = _parentage_1_1.value;
                parent_1.remove(this);
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
              } finally {
                if (e_1) throw e_1.error;
              }
            }
          } else {
            _parentage.remove(this);
          }
        }
        var initialFinalizer = this.initialTeardown;
        if (isFunction(initialFinalizer)) {
          try {
            initialFinalizer();
          } catch (e) {
            errors = e instanceof UnsubscriptionError ? e.errors : [e];
          }
        }
        var _finalizers = this._finalizers;
        if (_finalizers) {
          this._finalizers = null;
          try {
            for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
              var finalizer = _finalizers_1_1.value;
              try {
                execFinalizer(finalizer);
              } catch (err) {
                errors = errors !== null && errors !== void 0 ? errors : [];
                if (err instanceof UnsubscriptionError) {
                  errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                } else {
                  errors.push(err);
                }
              }
            }
          } catch (e_2_1) {
            e_2 = { error: e_2_1 };
          } finally {
            try {
              if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
            } finally {
              if (e_2) throw e_2.error;
            }
          }
        }
        if (errors) {
          throw new UnsubscriptionError(errors);
        }
      }
    };
    Subscription2.prototype.add = function(teardown) {
      var _a;
      if (teardown && teardown !== this) {
        if (this.closed) {
          execFinalizer(teardown);
        } else {
          if (teardown instanceof Subscription2) {
            if (teardown.closed || teardown._hasParent(this)) {
              return;
            }
            teardown._addParent(this);
          }
          (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
        }
      }
    };
    Subscription2.prototype._hasParent = function(parent) {
      var _parentage = this._parentage;
      return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
    };
    Subscription2.prototype._addParent = function(parent) {
      var _parentage = this._parentage;
      this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription2.prototype._removeParent = function(parent) {
      var _parentage = this._parentage;
      if (_parentage === parent) {
        this._parentage = null;
      } else if (Array.isArray(_parentage)) {
        arrRemove(_parentage, parent);
      }
    };
    Subscription2.prototype.remove = function(teardown) {
      var _finalizers = this._finalizers;
      _finalizers && arrRemove(_finalizers, teardown);
      if (teardown instanceof Subscription2) {
        teardown._removeParent(this);
      }
    };
    Subscription2.EMPTY = function() {
      var empty = new Subscription2();
      empty.closed = true;
      return empty;
    }();
    return Subscription2;
  }();
  Subscription.EMPTY;
  function isSubscription(value) {
    return value instanceof Subscription || value && "closed" in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe);
  }
  function execFinalizer(finalizer) {
    if (isFunction(finalizer)) {
      finalizer();
    } else {
      finalizer.unsubscribe();
    }
  }
  var config = {
    Promise: void 0,
    useDeprecatedNextContext: false
  };
  var timeoutProvider = {
    setTimeout: function(handler, timeout) {
      var args = [];
      for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
      }
      return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearTimeout: function(handle) {
      return clearTimeout(handle);
    },
    delegate: void 0
  };
  function reportUnhandledError(err) {
    timeoutProvider.setTimeout(function() {
      {
        throw err;
      }
    });
  }
  function noop() {
  }
  function errorContext(cb) {
    {
      cb();
    }
  }
  var Subscriber = function(_super) {
    __extends(Subscriber2, _super);
    function Subscriber2(destination) {
      var _this = _super.call(this) || this;
      _this.isStopped = false;
      if (destination) {
        _this.destination = destination;
        if (isSubscription(destination)) {
          destination.add(_this);
        }
      } else {
        _this.destination = EMPTY_OBSERVER;
      }
      return _this;
    }
    Subscriber2.create = function(next, error, complete) {
      return new SafeSubscriber(next, error, complete);
    };
    Subscriber2.prototype.next = function(value) {
      if (this.isStopped) ;
      else {
        this._next(value);
      }
    };
    Subscriber2.prototype.error = function(err) {
      if (this.isStopped) ;
      else {
        this.isStopped = true;
        this._error(err);
      }
    };
    Subscriber2.prototype.complete = function() {
      if (this.isStopped) ;
      else {
        this.isStopped = true;
        this._complete();
      }
    };
    Subscriber2.prototype.unsubscribe = function() {
      if (!this.closed) {
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
        this.destination = null;
      }
    };
    Subscriber2.prototype._next = function(value) {
      this.destination.next(value);
    };
    Subscriber2.prototype._error = function(err) {
      try {
        this.destination.error(err);
      } finally {
        this.unsubscribe();
      }
    };
    Subscriber2.prototype._complete = function() {
      try {
        this.destination.complete();
      } finally {
        this.unsubscribe();
      }
    };
    return Subscriber2;
  }(Subscription);
  var _bind = Function.prototype.bind;
  function bind(fn, thisArg) {
    return _bind.call(fn, thisArg);
  }
  var ConsumerObserver = function() {
    function ConsumerObserver2(partialObserver) {
      this.partialObserver = partialObserver;
    }
    ConsumerObserver2.prototype.next = function(value) {
      var partialObserver = this.partialObserver;
      if (partialObserver.next) {
        try {
          partialObserver.next(value);
        } catch (error) {
          handleUnhandledError(error);
        }
      }
    };
    ConsumerObserver2.prototype.error = function(err) {
      var partialObserver = this.partialObserver;
      if (partialObserver.error) {
        try {
          partialObserver.error(err);
        } catch (error) {
          handleUnhandledError(error);
        }
      } else {
        handleUnhandledError(err);
      }
    };
    ConsumerObserver2.prototype.complete = function() {
      var partialObserver = this.partialObserver;
      if (partialObserver.complete) {
        try {
          partialObserver.complete();
        } catch (error) {
          handleUnhandledError(error);
        }
      }
    };
    return ConsumerObserver2;
  }();
  var SafeSubscriber = function(_super) {
    __extends(SafeSubscriber2, _super);
    function SafeSubscriber2(observerOrNext, error, complete) {
      var _this = _super.call(this) || this;
      var partialObserver;
      if (isFunction(observerOrNext) || !observerOrNext) {
        partialObserver = {
          next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
          error: error !== null && error !== void 0 ? error : void 0,
          complete: complete !== null && complete !== void 0 ? complete : void 0
        };
      } else {
        var context_1;
        if (_this && config.useDeprecatedNextContext) {
          context_1 = Object.create(observerOrNext);
          context_1.unsubscribe = function() {
            return _this.unsubscribe();
          };
          partialObserver = {
            next: observerOrNext.next && bind(observerOrNext.next, context_1),
            error: observerOrNext.error && bind(observerOrNext.error, context_1),
            complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
          };
        } else {
          partialObserver = observerOrNext;
        }
      }
      _this.destination = new ConsumerObserver(partialObserver);
      return _this;
    }
    return SafeSubscriber2;
  }(Subscriber);
  function handleUnhandledError(error) {
    {
      reportUnhandledError(error);
    }
  }
  function defaultErrorHandler(err) {
    throw err;
  }
  var EMPTY_OBSERVER = {
    closed: true,
    next: noop,
    error: defaultErrorHandler,
    complete: noop
  };
  var observable = function() {
    return typeof Symbol === "function" && Symbol.observable || "@@observable";
  }();
  function identity(x) {
    return x;
  }
  function pipeFromArray(fns) {
    if (fns.length === 0) {
      return identity;
    }
    if (fns.length === 1) {
      return fns[0];
    }
    return function piped(input) {
      return fns.reduce(function(prev, fn) {
        return fn(prev);
      }, input);
    };
  }
  var Observable = function() {
    function Observable2(subscribe) {
      if (subscribe) {
        this._subscribe = subscribe;
      }
    }
    Observable2.prototype.lift = function(operator) {
      var observable2 = new Observable2();
      observable2.source = this;
      observable2.operator = operator;
      return observable2;
    };
    Observable2.prototype.subscribe = function(observerOrNext, error, complete) {
      var _this = this;
      var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
      errorContext(function() {
        var _a = _this, operator = _a.operator, source = _a.source;
        subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
      });
      return subscriber;
    };
    Observable2.prototype._trySubscribe = function(sink) {
      try {
        return this._subscribe(sink);
      } catch (err) {
        sink.error(err);
      }
    };
    Observable2.prototype.forEach = function(next, promiseCtor) {
      var _this = this;
      promiseCtor = getPromiseCtor(promiseCtor);
      return new promiseCtor(function(resolve, reject) {
        var subscriber = new SafeSubscriber({
          next: function(value) {
            try {
              next(value);
            } catch (err) {
              reject(err);
              subscriber.unsubscribe();
            }
          },
          error: reject,
          complete: resolve
        });
        _this.subscribe(subscriber);
      });
    };
    Observable2.prototype._subscribe = function(subscriber) {
      var _a;
      return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    Observable2.prototype[observable] = function() {
      return this;
    };
    Observable2.prototype.pipe = function() {
      var operations = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        operations[_i] = arguments[_i];
      }
      return pipeFromArray(operations)(this);
    };
    Observable2.prototype.toPromise = function(promiseCtor) {
      var _this = this;
      promiseCtor = getPromiseCtor(promiseCtor);
      return new promiseCtor(function(resolve, reject) {
        var value;
        _this.subscribe(function(x) {
          return value = x;
        }, function(err) {
          return reject(err);
        }, function() {
          return resolve(value);
        });
      });
    };
    Observable2.create = function(subscribe) {
      return new Observable2(subscribe);
    };
    return Observable2;
  }();
  function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
  }
  function isObserver(value) {
    return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
  }
  function isSubscriber(value) {
    return value && value instanceof Subscriber || isObserver(value) && isSubscription(value);
  }
  function isInteropObservable(input) {
    return isFunction(input[observable]);
  }
  function isAsyncIterable(obj) {
    return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
  }
  function createInvalidObservableTypeError(input) {
    return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
  }
  function getSymbolIterator() {
    if (typeof Symbol !== "function" || !Symbol.iterator) {
      return "@@iterator";
    }
    return Symbol.iterator;
  }
  var iterator = getSymbolIterator();
  function isIterable(input) {
    return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
  }
  function readableStreamLikeToAsyncGenerator(readableStream) {
    return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
      var reader, _a, value, done;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            reader = readableStream.getReader();
            _b.label = 1;
          case 1:
            _b.trys.push([1, , 9, 10]);
            _b.label = 2;
          case 2:
            return [4, __await(reader.read())];
          case 3:
            _a = _b.sent(), value = _a.value, done = _a.done;
            if (!done) return [3, 5];
            return [4, __await(void 0)];
          case 4:
            return [2, _b.sent()];
          case 5:
            return [4, __await(value)];
          case 6:
            return [4, _b.sent()];
          case 7:
            _b.sent();
            return [3, 2];
          case 8:
            return [3, 10];
          case 9:
            reader.releaseLock();
            return [7];
          case 10:
            return [2];
        }
      });
    });
  }
  function isReadableStreamLike(obj) {
    return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
  }
  function innerFrom(input) {
    if (input instanceof Observable) {
      return input;
    }
    if (input != null) {
      if (isInteropObservable(input)) {
        return fromInteropObservable(input);
      }
      if (isArrayLike(input)) {
        return fromArrayLike(input);
      }
      if (isPromise(input)) {
        return fromPromise(input);
      }
      if (isAsyncIterable(input)) {
        return fromAsyncIterable(input);
      }
      if (isIterable(input)) {
        return fromIterable(input);
      }
      if (isReadableStreamLike(input)) {
        return fromReadableStreamLike(input);
      }
    }
    throw createInvalidObservableTypeError(input);
  }
  function fromInteropObservable(obj) {
    return new Observable(function(subscriber) {
      var obs = obj[observable]();
      if (isFunction(obs.subscribe)) {
        return obs.subscribe(subscriber);
      }
      throw new TypeError("Provided object does not correctly implement Symbol.observable");
    });
  }
  function fromArrayLike(array) {
    return new Observable(function(subscriber) {
      for (var i = 0; i < array.length && !subscriber.closed; i++) {
        subscriber.next(array[i]);
      }
      subscriber.complete();
    });
  }
  function fromPromise(promise) {
    return new Observable(function(subscriber) {
      promise.then(function(value) {
        if (!subscriber.closed) {
          subscriber.next(value);
          subscriber.complete();
        }
      }, function(err) {
        return subscriber.error(err);
      }).then(null, reportUnhandledError);
    });
  }
  function fromIterable(iterable) {
    return new Observable(function(subscriber) {
      var e_1, _a;
      try {
        for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
          var value = iterable_1_1.value;
          subscriber.next(value);
          if (subscriber.closed) {
            return;
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      subscriber.complete();
    });
  }
  function fromAsyncIterable(asyncIterable) {
    return new Observable(function(subscriber) {
      process(asyncIterable, subscriber).catch(function(err) {
        return subscriber.error(err);
      });
    });
  }
  function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
  }
  function process(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function() {
      var value, e_2_1;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 5, 6, 11]);
            asyncIterable_1 = __asyncValues(asyncIterable);
            _b.label = 1;
          case 1:
            return [4, asyncIterable_1.next()];
          case 2:
            if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
            value = asyncIterable_1_1.value;
            subscriber.next(value);
            if (subscriber.closed) {
              return [2];
            }
            _b.label = 3;
          case 3:
            return [3, 1];
          case 4:
            return [3, 11];
          case 5:
            e_2_1 = _b.sent();
            e_2 = { error: e_2_1 };
            return [3, 11];
          case 6:
            _b.trys.push([6, , 9, 10]);
            if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
            return [4, _a.call(asyncIterable_1)];
          case 7:
            _b.sent();
            _b.label = 8;
          case 8:
            return [3, 10];
          case 9:
            if (e_2) throw e_2.error;
            return [7];
          case 10:
            return [7];
          case 11:
            subscriber.complete();
            return [2];
        }
      });
    });
  }
  function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
  }
  var OperatorSubscriber = function(_super) {
    __extends(OperatorSubscriber2, _super);
    function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
      var _this = _super.call(this, destination) || this;
      _this.onFinalize = onFinalize;
      _this.shouldUnsubscribe = shouldUnsubscribe;
      _this._next = onNext ? function(value) {
        try {
          onNext(value);
        } catch (err) {
          destination.error(err);
        }
      } : _super.prototype._next;
      _this._error = onError ? function(err) {
        try {
          onError(err);
        } catch (err2) {
          destination.error(err2);
        } finally {
          this.unsubscribe();
        }
      } : _super.prototype._error;
      _this._complete = onComplete ? function() {
        try {
          onComplete();
        } catch (err) {
          destination.error(err);
        } finally {
          this.unsubscribe();
        }
      } : _super.prototype._complete;
      return _this;
    }
    OperatorSubscriber2.prototype.unsubscribe = function() {
      var _a;
      if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
        var closed_1 = this.closed;
        _super.prototype.unsubscribe.call(this);
        !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
      }
    };
    return OperatorSubscriber2;
  }(Subscriber);
  function map(project, thisArg) {
    return operate(function(source, subscriber) {
      var index = 0;
      source.subscribe(createOperatorSubscriber(subscriber, function(value) {
        subscriber.next(project.call(thisArg, value, index++));
      }));
    });
  }
  function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
    var buffer = [];
    var active = 0;
    var index = 0;
    var isComplete = false;
    var checkComplete = function() {
      if (isComplete && !buffer.length && !active) {
        subscriber.complete();
      }
    };
    var outerNext = function(value) {
      return active < concurrent ? doInnerSub(value) : buffer.push(value);
    };
    var doInnerSub = function(value) {
      active++;
      var innerComplete = false;
      innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, function(innerValue) {
        {
          subscriber.next(innerValue);
        }
      }, function() {
        innerComplete = true;
      }, void 0, function() {
        if (innerComplete) {
          try {
            active--;
            var _loop_1 = function() {
              var bufferedValue = buffer.shift();
              if (innerSubScheduler) ;
              else {
                doInnerSub(bufferedValue);
              }
            };
            while (buffer.length && active < concurrent) {
              _loop_1();
            }
            checkComplete();
          } catch (err) {
            subscriber.error(err);
          }
        }
      }));
    };
    source.subscribe(createOperatorSubscriber(subscriber, outerNext, function() {
      isComplete = true;
      checkComplete();
    }));
    return function() {
    };
  }
  function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) {
      concurrent = Infinity;
    }
    if (isFunction(resultSelector)) {
      return mergeMap(function(a, i) {
        return map(function(b, ii) {
          return resultSelector(a, b, i, ii);
        })(innerFrom(project(a, i)));
      }, concurrent);
    } else if (typeof resultSelector === "number") {
      concurrent = resultSelector;
    }
    return operate(function(source, subscriber) {
      return mergeInternals(source, subscriber, project, concurrent);
    });
  }
  function mergeAll(concurrent) {
    return mergeMap(identity, concurrent);
  }
  function concatAll() {
    return mergeAll(1);
  }
  function concatMap(project, resultSelector) {
    return isFunction(resultSelector) ? mergeMap(project, resultSelector, 1) : mergeMap(project, 1);
  }
  class BasicQuestionHandler {
    constructor() {
      this._document = document;
      this._window = _unsafeWindow;
      this.questions = [];
      this.correctNum = 0;
      this.setting = useSettingStore();
      this.log = useLogStore();
      this.questionStore = useQuestionStore();
      this.parseHtml = () => {
        throw new Error("请使用继承类的重写方法");
      };
      this.fillQuestion = (question) => {
        throw new Error("请使用继承类的重写方法");
      };
      this.questionType = {
        "A1型选择题": "0",
        "X型选择题": "1",
        "单选题": "0",
        "单项选择题": "0",
        "单项选择": "0",
        "A1型题": "0",
        "多选题": "1",
        "多项选择题": "1",
        "多项选择": "1",
        "X型题": "1",
        "不定项选择题": "1",
        "不定项": "1",
        "填空题": "2",
        "判断题": "3",
        "是非题": "3",
        "简答题": "4",
        "名词解释": "5",
        "论述题": "6",
        "计算题": "7",
        "连线题": "11",
        "匹配题": "11",
        "完型填空": "14",
        "完形填空题": "14",
        "阅读理解": "15",
        "单选": "0",
        "A1型": "0",
        "多选": "1",
        "填空": "2",
        "判断": "3",
        "简答": "4",
        "论述": "6",
        "计算": "7",
        "思政元素": "2"
      };
      this.questionTypeKeywordRules = [
        {
          keywords: ["单项选择", "单选"],
          type: "0"
        },
        {
          keywords: ["多项选择", "多选", "不定项", "X型"],
          type: "1"
        },
        {
          keywords: ["填空", "思政元素"],
          type: "2"
        },
        {
          keywords: ["判断", "是非"],
          type: "3"
        },
        {
          keywords: ["简答"],
          type: "4"
        },
        {
          keywords: ["名词解释"],
          type: "5"
        },
        {
          keywords: ["论述"],
          type: "6"
        },
        {
          keywords: ["计算"],
          type: "7"
        },
        {
          keywords: ["连线", "匹配"],
          type: "11"
        },
        {
          keywords: ["完型填空", "完形填空"],
          type: "14"
        },
        {
          keywords: ["阅读理解"],
          type: "15"
        }
      ];
      this.removeHtml = (htmlStr, replacen = true) => {
        const textArea = document.createElement("textarea");
        textArea.innerHTML = htmlStr;
        htmlStr = textArea.value;
        htmlStr = htmlStr.replace(/[\t\r\xa0]/g, " ");
        htmlStr = htmlStr.replace(/[\u2000-\u200a]/g, " ");
        htmlStr = htmlStr.replace(/<br\s*\/?>/g, "\n");
        if (replacen) {
          htmlStr = htmlStr.replace(/<(\/)?(p|div).*?>/g, "\n");
        }
        htmlStr = htmlStr.replace(/ {2,}/g, " ");
        htmlStr = htmlStr.replace(/\n{2,}/g, "\n");
        htmlStr = htmlStr.replace(/<xmp.*?>/g, "<pre>");
        htmlStr = htmlStr.replace(/<\/xmp>/g, "</pre>");
        htmlStr = DOMPurify.sanitize(htmlStr, { ALLOWED_TAGS: ["img", "br", "sub", "sup"], ALLOWED_ATTR: ["src", "href"], ALLOW_DATA_ATTR: false, KEEP_CONTENT: true });
        htmlStr = htmlStr.replace(/<((?!img|sub|sup|br)[^>]+)>/g, "").replace(/<br\s*\/?>/g, "\n");
        let imgReg = /<img.*?src="(.*?)".*?>/g;
        let imgArr = htmlStr.match(imgReg);
        if (imgArr) {
          htmlStr = htmlStr.replace(new RegExp("<img([^>]*)(?<!\\/)>", "g"), "<img$1/>");
          imgArr.forEach((item) => {
            let src = item.match(/src="(.*?)"/);
            if (src) {
              if (src[1].indexOf("http") == -1 && !src[1].includes("data:image")) {
                if (src[1].startsWith("/")) {
                  htmlStr = htmlStr.replace(src[1], location.origin + src[1]);
                } else {
                  const fullURL = new URL(src[1], document.baseURI).href;
                  htmlStr = htmlStr.replace(src[1], fullURL);
                }
              }
            }
          });
        }
        return htmlStr.trim();
      };
      this.removeAllTags = (htmlStr) => {
        htmlStr = DOMPurify.sanitize(htmlStr, { ALLOWED_TAGS: ["img"], ALLOWED_ATTR: ["src", "href"], ALLOW_DATA_ATTR: false, KEEP_CONTENT: true });
        let imgReg = /<img.*?src="(.*?)".*?>/g;
        let imgArr = htmlStr.match(imgReg);
        if (imgArr) {
          htmlStr = htmlStr.replace(new RegExp("<img([^>]*)(?<!\\/)>", "g"), "<img$1/>");
          imgArr.forEach((item) => {
            let src = item.match(/src="(.*?)"/);
            if (src) {
              if (src[1].indexOf("http") == -1 && !src[1].includes("data:image")) {
                if (src[1].startsWith("/")) {
                  htmlStr = htmlStr.replace(src[1], location.origin + src[1]);
                } else {
                  const fullURL = new URL(src[1], document.baseURI).href;
                  htmlStr = htmlStr.replace(src[1], fullURL);
                }
              }
            }
          });
        } else {
          htmlStr = htmlStr.replace(/[\p{P}\s]/gu, "").toLowerCase();
        }
        htmlStr = htmlStr.replace(/&nbsp;|nbsp/g, "");
        return htmlStr.trim();
      };
      this.clean = (str) => {
        return str.replace(/^【.*?】\s*/, "").replace(/\s*（\d+\.\d+分）$/, "");
      };
      this.normalizeQuestionTypeText = (text = "") => {
        let normalizedText = String(text).normalize("NFKC").trim();
        normalizedText = normalizedText.replace(/<[^>]+>/g, "").replace(/[【】\[\]（）()]/g, "").replace(/[:：]/g, "").replace(/\s+/g, "").replace(/第\s*\d+\s*题/g, "").replace(/共\s*\d+(?:\.\d+)?\s*分/g, "").replace(/本题/g, "").replace(/题型/g, "").trim();
        const canonicalQuestionTypeMap = {
          "单项选择题": "单项选择",
          "单项选择": "单项选择",
          "单选题": "单项选择",
          "单选": "单项选择",
          "多项选择题": "多项选择",
          "多项选择": "多项选择",
          "多选题": "多项选择",
          "多选": "多项选择",
          "判断题": "判断",
          "判断": "判断",
          "是非题": "判断",
          "是非": "判断",
          "填空题": "填空",
          "填空": "填空",
          "简答题": "简答",
          "简答": "简答",
          "论述题": "论述",
          "论述": "论述",
          "计算题": "计算",
          "计算": "计算",
          "连线题": "连线",
          "连线": "连线",
          "匹配题": "匹配",
          "匹配": "匹配",
          "完型填空": "完形填空",
          "完形填空题": "完形填空",
          "完形填空": "完形填空",
          "阅读理解": "阅读理解"
        };
        return canonicalQuestionTypeMap[normalizedText] || normalizedText;
      };
      this.resolveQuestionType = (text = "") => {
        const normalizedText = this.normalizeQuestionTypeText(text);
        const exactQuestionTypeMap = Object.entries(this.questionType).reduce((result, [key, value]) => {
          result[this.normalizeQuestionTypeText(key)] = value;
          return result;
        }, {});
        if (exactQuestionTypeMap[normalizedText]) {
          return exactQuestionTypeMap[normalizedText];
        }
        const matchedRule = this.questionTypeKeywordRules.find(
          (rule) => rule.keywords.some((keyword) => normalizedText.includes(keyword))
        );
        return (matchedRule == null ? void 0 : matchedRule.type) || "999";
      };
      this.similarCharMap = {
        "ɑ": "α",
        // 国际音标 ɑ (U+0251) → 希腊字母 α (U+03B1)
        "Α": "A",
        // 希腊大写 Α → 拉丁大写 A
        "Β": "B",
        // 希腊大写 Β → 拉丁大写 B
        "Ε": "E",
        // 希腊大写 Ε → 拉丁大写 E
        "Ζ": "Z",
        // 希腊大写 Ζ → 拉丁大写 Z
        "Η": "H",
        // 希腊大写 Η → 拉丁大写 H
        "Ι": "I",
        // 希腊大写 Ι → 拉丁大写 I
        "Κ": "K",
        // 希腊大写 Κ → 拉丁大写 K
        "Μ": "M",
        // 希腊大写 Μ → 拉丁大写 M
        "Ν": "N",
        // 希腊大写 Ν → 拉丁大写 N
        "Ο": "O",
        // 希腊大写 Ο → 拉丁大写 O
        "Ρ": "P",
        // 希腊大写 Ρ → 拉丁大写 P
        "Τ": "T",
        // 希腊大写 Τ → 拉丁大写 T
        "Υ": "Y",
        // 希腊大写 Υ → 拉丁大写 Y
        "Χ": "X",
        // 希腊大写 Χ → 拉丁大写 X
        "ο": "o",
        // 希腊小写 ο → 拉丁小写 o
        "ν": "v"
        // 希腊小写 ν → 拉丁小写 v (有时相似)
      };
      this.clearMark = (str) => {
        let result = str;
        for (const [similar, standard] of Object.entries(this.similarCharMap)) {
          result = result.replace(new RegExp(similar, "g"), standard);
        }
        return result.replace(/[\p{P}\p{S}]/gu, "");
      };
    }
  }
  let QuestionHandler$1 = class QuestionHandler extends BasicQuestionHandler {
    constructor(type, iframe) {
      super();
      __publicField(this, "type");
      __publicField(this, "AI_ALLOW_QUESTION_TYPE", ["0", "1", "2", "3", "4", "5"]);
      __publicField(this, "answerSeparators", ["===", "#", "---", "###", "|", ";", "；"]);
      __publicField(this, "init", async () => {
        var _that = this;
        this.parseHtml();
        if (this.questions.length) {
          this.log.insertLog(
            `成功解析到${this.questions.length}个题目，开始答题..`
          );
          setTimeout(() => {
            autoSetTab(_that.setting, "2");
          }, 1e3);
          const { answerMode } = this.setting.config.basicConfig;
          const mode = answerMode.value;
          registerQuestionFillHook(this);
          for (const [index, question] of this.questions.entries()) {
            if (!this.setting.config.basicConfig.autoAnswer.value) break;
            this.questionStore.currentQuestionIndex = index;
            if (mode !== "ai") {
              const answerData = await getAccurateAnswer(question);
              if (!this.setting.config.basicConfig.autoAnswer.value) break;
              if (answerData.code === 1) {
                question.answer = {
                  code: answerData.data.multimatch ? 0 : 1,
                  answer: answerData.data.answer,
                  src: answerData.data.src
                };
                this.setting.userInfo.remainCount = formatLocalRemainCount(answerData.data.remainCount);
                if (answerData.data.multimatch) {
                  // 手动选择模式：题库有多道相似题，先不填，等用户自己挑
                  question.answer.msg = "存在多道相似题，请先手动选择后再填写";
                  this.log.insertLog(`第${index + 1}题有${answerData.data.candidates.length}道相似题，已暂停自动作答，请去「题目结果」里手动选择`);
                  continue;
                }
                saveAnswerRecord({
                  question,
                  answer: answerData.data.answer,
                  source: "accurate"
                });
                let fillSuccess = this.fillQuestion(question);
                if (["0", "1"].includes(question.type)) {
                  for (let attempt = 0; attempt < 3; attempt++) {
                    await sleep(0.2);
                    if (!this.setting.config.basicConfig.autoAnswer.value) break;
                    fillSuccess = this.fillQuestion(question);
                    if (fillSuccess) break;
                  }
                }
                if (fillSuccess) {
                  this.correctNum += 1;
                  continue;
                }
                question.answer.code = 0;
                question.answer.msg = "答案拿到了但没点上去";
                // 题库答案填不上（常见于图片选项），改走模型
              } else if (mode === "questionBank" || answerData.code !== -1004) {
                question.answer = {
                  code: answerData.code,
                  answer: [],
                  msg: answerData.msg
                };
                continue;
              }
            }
            if (this.AI_ALLOW_QUESTION_TYPE.includes(question.type)) {
              const answerData = await getAIAnswer(question);
              if (!this.setting.config.basicConfig.autoAnswer.value) break;
              if (answerData.code === 1) {
                question.answer = {
                  code: 2,
                  answer: answerData.data.answer,
                  src: answerData.data.src || "ai"
                };
                this.setting.userInfo.remainCount = formatLocalRemainCount(answerData.data.remainCount);
                saveAnswerRecord({
                  question,
                  answer: answerData.data.answer,
                  source: "ai"
                });
                let fillSuccess = this.fillQuestion(question);
                if (["0", "1"].includes(question.type)) {
                  for (let attempt = 0; attempt < 3; attempt++) {
                    await sleep(0.2);
                    if (!this.setting.config.basicConfig.autoAnswer.value) break;
                    fillSuccess = this.fillQuestion(question);
                    if (fillSuccess) break;
                  }
                }
                if (!fillSuccess) {
                  question.answer.code = 0;
                  question.answer.msg = "答案拿到了但没点上去";
                  continue;
                }
                this.correctNum += 1;
              } else if (!(question.answer && question.answer.code === 0 && Array.isArray(question.answer.answer) && question.answer.answer.length)) {
                // 前面已经「拿到答案但点不上」时，别被后续余额不足盖掉，否则统计会把填充问题算成欠费
                question.answer = {
                  code: answerData.code,
                  answer: [],
                  msg: answerData.msg
                };
              } else if (!question.answer.msg) {
                question.answer.msg = "答案拿到了但没点上去";
              }
            } else if (!(question.answer && question.answer.code === 0 && Array.isArray(question.answer.answer) && question.answer.answer.length)) {
              question.answer = {
                code: -1,
                answer: ["该题型不支持AI答题"]
              };
            }
          }
          this.questionStore.currentQuestionIndex += 1;
        } else
          this.log.insertLog(
            "没有解析到题目，请检查是否进入正确页面...",
            "warning"
          );
        setTimeout(() => {
          autoSetTab(_that.setting, "1");
        }, 2e3);
        reportAnswerSummary("cx-" + this.type, this.questions);
        if (this.questions.length === 0) return Promise.resolve("0");
        return Promise.resolve(
          (this.correctNum / this.questions.length * 100).toFixed(1)
        );
      });
      __publicField(this, "parseHtml", () => {
        this.questionStore.currentQuestionIndex = 0;
        if (!this._document) return [];
        if (["zj"].includes(this.type)) {
          const questionElements = this._document.querySelectorAll(".TiMu");
          this.addQuestions(questionElements);
        } else if (["zy", "ks"].includes(this.type)) {
          const questionElements = this._document.querySelectorAll(".questionLi");
          this.addQuestions(questionElements);
        }
        this.questionStore.questionList = this.questions;
      });
      __publicField(this, "getChoiceOptionContainer", (optionElement) => {
        if (!optionElement) return null;
        if (["ks"].includes(this.type)) {
          return optionElement.closest(".answerBg") || optionElement;
        }
        return optionElement;
      });
      __publicField(this, "getCxQuestionTypeFromCode", (code) => {
        if (Number.isNaN(code)) return "";
        if (code === 0) return "0";
        if (code === 1) return "1";
        if (code === 3) return "3";
        if ([2, 4, 5, 6, 7, 8, 9, 10].includes(code)) return "2";
        if (code === 11) return "11";
        if (code === 14) return "14";
        if (code === 15) return "15";
        return "";
      });
      __publicField(this, "getCxQuestionTypeInput", (element) => {
        if (!element) return null;
        if (["ks"].includes(this.type)) {
          return element.querySelector('input[name^="type"]');
        }
        return element.querySelector('input[id^="answertype"]');
      });
      __publicField(this, "resolveCxQuestionType", (element, questionTypeText) => {
        const typeInput = this.getCxQuestionTypeInput(element);
        const typeFromCode = this.getCxQuestionTypeFromCode(
          Number.parseInt((typeInput == null ? void 0 : typeInput.value) || "", 10)
        );
        if ((!typeFromCode || ["0", "1"].includes(typeFromCode)) &&
            (element.querySelector('input[type="checkbox"], [role="checkbox"]') || /多选|多项选择|不定项|X型/i.test(questionTypeText))) return "1";
        if (typeFromCode) return typeFromCode;
        return this.resolveQuestionType(questionTypeText);
      });
      __publicField(this, "getChoiceOptionInputs", (optionContainer) => {
        var _a;
        const inputs = (_a = optionContainer.querySelectorAll) == null ? void 0 : _a.call(optionContainer, 'input[type="radio"], input[type="checkbox"]');
        return inputs ? [...inputs] : [];
      });
      // 超星自己的脚本用 jQuery attr('checked','checked') 写选中态，回读也只认属性；
      // 浏览器在点击后不保证属性与 property 双向同步，所以两者任一为真即视为已选（与 ocsjs 口径一致）。
      __publicField(this, "isChoiceInputChecked", (input) => {
        var _a;
        if (input.checked === true) return true;
        return Boolean(((_a = input.getAttribute) == null ? void 0 : _a.call(input, "checked")) != null);
      });
      __publicField(this, "getChoiceOptionSig", (optionContainer) => {
        var _a;
        const inputs = this.getChoiceOptionInputs(optionContainer);
        return [
          String(optionContainer.className || ""),
          ((_a = optionContainer.getAttribute) == null ? void 0 : _a.call(optionContainer, "aria-checked")) || "",
          inputs.map((input) => this.isChoiceInputChecked(input) ? 1 : 0).join("")
        ].join("|");
      });
      __publicField(this, "isChoiceOptionSelected", (optionElement) => {
        var _a;
        const optionContainer = this.getChoiceOptionContainer(optionElement);
        if (!optionContainer) return false;
        // 原生 radio/checkbox 的 checked（property 或属性）与 aria-checked 是通用信号，先读它们：
        // 认不出已选会导致对已选项目再点一次，反而把它取消掉
        const inputs = this.getChoiceOptionInputs(optionContainer);
        if (inputs.some((input) => this.isChoiceInputChecked(input))) return true;
        if (optionContainer.getAttribute("aria-checked") === "true") return true;
        const tokens = String(optionContainer.className || "").toLowerCase().split(/\s+/);
        if (tokens.some((t) => t === "is-checked" || t === "ischecked" || t === "checked")) return true;
        if (["ks"].includes(this.type)) {
          return Boolean(
            optionContainer.querySelector(".check_answer, .check_answer_dx")
          );
        }
        return false;
      });
      __publicField(this, "selectChoiceOption", (optionElement) => {
        var _a;
        const optionContainer = this.getChoiceOptionContainer(optionElement);
        if (!optionContainer) return false;
        if (this.isChoiceOptionSelected(optionContainer)) return true;
        const tryClick = (el) => {
          if (!el) return;
          try {
            el.click();
          } catch (_) {
          }
        };
        // 超星章节/作业常把事件绑在字母链或 input 上，只点外层 li 可能没反应
        tryClick(optionContainer);
        if (this.isChoiceOptionSelected(optionContainer)) return true;
        const inputs = this.getChoiceOptionInputs(optionContainer);
        for (const input of inputs) {
          tryClick(input);
          if (this.isChoiceOptionSelected(optionContainer)) return true;
        }
        tryClick(optionContainer.querySelector && optionContainer.querySelector(".fl.before, a.before, label, .answer_p, span"));
        if (this.isChoiceOptionSelected(optionContainer)) return true;
        try {
          (_a = optionContainer.dispatchEvent) == null ? void 0 : _a.call(optionContainer, new this._window.MouseEvent("click", { bubbles: true }));
        } catch (_) {
        }
        return this.isChoiceOptionSelected(optionContainer);
      });
      __publicField(this, "optionTextMatches", (optionKey, answerText) => {
        const rawOpt = String(optionKey || "").trim();
        const rawAns = String(answerText || "").trim();
        if (!rawOpt || !rawAns) return false;
        if (rawOpt === rawAns) return true;
        const stripLead = (s) => String(s || "").replace(/^[A-Za-z][.、．)）:\s]*/, "").trim();
        const a = this.clearMark(rawAns);
        const b = this.clearMark(rawOpt);
        const a2 = this.clearMark(stripLead(rawAns));
        const b2 = this.clearMark(stripLead(rawOpt));
        if (a && b && a === b) return true;
        if (a2 && b2 && a2 === b2) return true;
        // 选项/答案一侧带了多余说明时，用包含关系兜底（要求足够长，防短串误撞）
        if (a2 && b2 && a2.length >= 4 && b2.length >= 4 && (a2.includes(b2) || b2.includes(a2))) return true;
        return false;
      });
      __publicField(this, "splitAnswer", (answer = "") => {
        const normalizedAnswer = String(answer || "").trim();
        if (!normalizedAnswer) return [];
        for (const separator of this.answerSeparators) {
          if (normalizedAnswer.includes(separator)) {
            return normalizedAnswer.split(separator).map((item) => item.trim()).filter(Boolean);
          }
        }
        return [normalizedAnswer];
      });
      __publicField(this, "buildAnswerGroups", (answers = []) => {
        if (!Array.isArray(answers)) return [this.splitAnswer(answers)];
        if (answers.length === 1) return [this.splitAnswer(answers[0])];
        const normalizedAnswers = answers.map((answer) => String(answer || "").trim()).filter(Boolean);
        const groups = [normalizedAnswers];
        normalizedAnswers.forEach((answer) => {
          const splitAnswers = this.splitAnswer(answer);
          if (splitAnswers.length > 1) groups.push(splitAnswers);
        });
        return groups;
      });
      __publicField(this, "findElementByAttr", (root, selector, attrName, attrValue) => {
        return [...root.querySelectorAll(selector)].find(
          (element) => element.getAttribute(attrName) === attrValue
        );
      });
      __publicField(this, "resolveBlankAnswers", (answers = [], blankCount = 1) => {
        const list = (Array.isArray(answers) ? answers : [answers]).map((a) => String(a == null ? "" : a).trim()).filter(Boolean);
        if (list.length >= blankCount) return list.slice(0, blankCount);
        const flat = [];
        list.forEach((a) => {
          a.split(/[,，、;；|]+/).forEach((piece) => {
            const trimmed = piece.trim();
            if (trimmed) flat.push(trimmed);
          });
        });
        return flat.slice(0, blankCount);
      });
      __publicField(this, "resolveJudgeAnswer", (rawAnswer) => {
        const text = String(rawAnswer == null ? "" : rawAnswer).replace(/\s+/g, "");
        if (!text) return "";
        const neg = /(错误|不对|非|否|误|错|×|✗|(^|[,，、;；(（【])(wrong|false|no|n|f)([,，、;；)）】]|$))/i;
        const pos = /(正确|对|是|√|✓|(^|[,，、;；(（【])(true|right|yes|t|y|ri)([,，、;；)）】]|$))/i;
        if (neg.test(text)) return "false";
        if (pos.test(text)) return "true";
        return "";
      });
      __publicField(this, "fillLineQuestion", (question) => {
        const answerGroups = this.buildAnswerGroups(question.answer.answer);
        const selectBoxes = question.element.querySelectorAll(
          ".line_answer_ct .selectBox, .thirdUlList .dept_select"
        );
        const answerInputs = question.element.querySelectorAll(
          ".line_answer input[name^='answer']"
        );
        if (!selectBoxes.length) return false;
        for (const answers of answerGroups) {
          if (!answers.length) continue;
          if (answerInputs.length && answers.length !== selectBoxes.length) continue;
          if (!answerInputs.length && answers.length !== selectBoxes.length) continue;
          let filledCount = 0;
          selectBoxes.forEach((box, index) => {
            var _a, _b;
            const answer = answers[index];
            if (!answer) return;
            const optionItem = this.findElementByAttr(box, "li[data]", "data", answer);
            const optionLink = optionItem == null ? void 0 : optionItem.querySelector("a");
            if (optionLink) {
              optionLink.click();
              filledCount += 1;
              return;
            }
            const selectOption = this.findElementByAttr(
              box,
              "option[value]",
              "value",
              answer
            );
            if (!selectOption) return;
            (_a = box.querySelector("option[selected]")) == null ? void 0 : _a.removeAttribute("selected");
            selectOption.setAttribute("selected", "");
            box.value = answer;
            const selectedText = (_b = box.parentElement) == null ? void 0 : _b.querySelector(".chosen-single span");
            if (selectedText) selectedText.textContent = answer;
            filledCount += 1;
          });
          if (filledCount === selectBoxes.length) return true;
        }
        return false;
      });
      __publicField(this, "fillCompositeChoiceQuestion", (question, containerSelector) => {
        const answerGroups = this.buildAnswerGroups(question.answer.answer);
        const containers = question.element.querySelectorAll(containerSelector);
        if (!containers.length) return false;
        for (const answers of answerGroups) {
          if (!answers.length) continue;
          let filledCount = 0;
          answers.forEach((answer, index) => {
            const container = containers[index];
            if (!container || !answer) return;
            const option = this.findElementByAttr(
              container,
              "span.saveSingleSelect[data]",
              "data",
              answer
            );
            if (!option) return;
            option.click();
            filledCount += 1;
          });
          if (filledCount > 0) return true;
        }
        return false;
      });
      __publicField(this, "fillQuestion", (question) => {
        var _a;
        if (!this._window) return false;
        let filled = false;
        if (question.type === "0" || question.type === "1") {
          const optionKeys = Object.keys(question.options);
          const targets = new Set();
          const answers = question.answer.answer || [];
          if (!answers.length) return false;
          for (const answer of answers) {
            const clearAnswer = this.removeHtml(String(answer));
            const text = String(clearAnswer).normalize("NFKC").trim();
            let matches = optionKeys.filter(k => k === clearAnswer);
            if (!matches.length) {
              const letters = text.replace(/[\s,，、;；|]+/g, "").toUpperCase();
              const textMatches = optionKeys.filter(k => this.optionTextMatches(k, clearAnswer) || this.optionTextMatches(k, answer));
              if (textMatches.length === 1 && letters.length > 1) matches = textMatches;
              else if (/^[A-Z]+$/.test(letters)) {
                if ([...letters].some(c => c.charCodeAt(0) - 65 >= optionKeys.length)) return false;
                matches = [...new Set([...letters].map(c => optionKeys[c.charCodeAt(0) - 65]))];
              } else {
                matches = textMatches;
                if (matches.length > 1) return false;
              }
            }
            if (!matches.length) {
              const imgs = collectImgSrcs(answer);
              matches = optionKeys.filter(k => imgSrcsMatch(imgs, collectImgSrcs(k).concat(collectImgSrcs(question.options[k]))));
              if (matches.length !== 1) return false;
            }
            matches.forEach(k => targets.add(k));
          }
          if (!targets.size || (question.type === "0" && targets.size !== 1)) return false;
          // 先清理旧答案，再逐项选择；只有最终选中集合完全一致才算填充成功。
          for (const key of optionKeys) {
            if (!targets.has(key) && this.isChoiceOptionSelected(question.options[key])) {
              const container = this.getChoiceOptionContainer(question.options[key]);
              try { container.click(); } catch (_) {}
              if (this.isChoiceOptionSelected(question.options[key])) {
                const input = this.getChoiceOptionInputs(container).find(i => this.isChoiceInputChecked(i));
                try { if (input) input.click(); } catch (_) {}
              }
            }
          }
          for (const key of targets) this.selectChoiceOption(question.options[key]);
          filled = optionKeys.every(key => this.isChoiceOptionSelected(question.options[key]) === targets.has(key));
        } else if (question.type === "2") {
          const textareaElements = question.element.querySelectorAll("textarea");
          if (textareaElements.length === 0) return false;
          const blankAnswers = this.resolveBlankAnswers(
            question.answer.answer,
            textareaElements.length
          );
          let blankFilled = 0;
          textareaElements.forEach((textareaElement, index) => {
            const blankAnswer = blankAnswers[index];
            if (!blankAnswer) return;
            try {
              const ueditor = this._window.UE.getEditor(textareaElement.name);
              ueditor.setContent(blankAnswer);
              blankFilled += 1;
            } catch (e) {
              try {
                textareaElement.value = blankAnswer;
                blankFilled += 1;
              } catch (_) {
              }
            }
          });
          filled = blankFilled > 0 && blankFilled === textareaElements.length;
        } else if (question.type === "3") {
          const answer = this.resolveJudgeAnswer(question.answer.answer[0]);
          if (!answer) {
            this.log.insertLog(
              `判断题答案无法判定对错，本题不填：${question.answer.answer[0] || "空"}`,
              "warning"
            );
            return false;
          }
          const trueOrFalse = {
            true: "对",
            false: "错"
          };
          for (const key in question.options) {
            if (["zj", "zy"].includes(this.type)) {
              if ((_a = question.options[key].getAttribute("aria-label")) == null ? void 0 : _a.includes(`${trueOrFalse[answer]}选择`)) {
                filled = this.selectChoiceOption(question.options[key]);
                break;
              }
            } else if (["ks"].includes(this.type)) {
              const optionElement = question.options[key].querySelector(
                `span[data='${answer}']`
              );
              if (!optionElement) continue;
              filled = this.selectChoiceOption(optionElement);
              break;
            }
          }
        } else if (question.type === "4" || question.type === "5" || question.type === "6") {
          const textareaElement = question.element.querySelector("textarea");
          if (!textareaElement) return false;
          const longAnswer = this.resolveBlankAnswers(question.answer.answer, 1)[0] || "";
          if (!longAnswer) return false;
          try {
            const ueditor = this._window.UE.getEditor(textareaElement.name);
            ueditor.setContent(longAnswer);
            filled = true;
          } catch (e) {
            try {
              textareaElement.value = longAnswer;
              filled = true;
            } catch (_) {
            }
          }
        } else if (question.type === "11") {
          filled = this.fillLineQuestion(question);
        } else if (question.type === "14") {
          filled = this.fillCompositeChoiceQuestion(question, ".filling_answer");
        } else if (question.type === "15") {
          filled = this.fillCompositeChoiceQuestion(question, ".reading_answer");
        } else {
          this.log.insertLog(
            `异常题型:type:${question.type}，请联系客服..`,
            "warning"
          );
          autoSetTab(this.setting, "1");
          return false;
        }
        return filled;
      });
      __publicField(this, "addQuestions", (questionElements) => {
        questionElements.forEach((element) => {
          var _a, _b, _c, _d;
          let questionTitle = "";
          let questionTypeText = "";
          let optionElements;
          let optionsObject = {};
          let optionTexts = [];
          if (["zj"].includes(this.type)) {
            questionTitle = this.removeHtml(
              ((_a = element.querySelector(".fontLabel")) == null ? void 0 : _a.innerHTML) || ""
            );
            questionTypeText = this.removeHtml(
              ((_b = element.querySelector(".newZy_TItle")) == null ? void 0 : _b.innerHTML) || ""
            );
            optionElements = element.querySelectorAll('[class*="before-after"]');
            [optionsObject, optionTexts] = this.extractOptions(
              optionElements,
              ".fl.after"
            );
          } else if (["zy", "ks"].includes(this.type)) {
            const titleElement = ((_c = element == null ? void 0 : element.querySelector("h3")) == null ? void 0 : _c.innerHTML) || "";
            const colorShallowElement = ((_d = element.querySelector(".colorShallow")) == null ? void 0 : _d.outerHTML) || "";
            if (["zy"].includes(this.type)) {
              questionTypeText = (element == null ? void 0 : element.getAttribute("typename")) || "";
            } else if (["ks"].includes(this.type)) {
              questionTypeText = this.removeHtml(colorShallowElement).slice(1, 4) || "";
            }
            questionTitle = this.removeHtml(
              colorShallowElement ? titleElement.replace(colorShallowElement, "") : titleElement
            );
            optionElements = element.querySelectorAll(".answerBg");
            [optionsObject, optionTexts] = this.extractOptions(
              optionElements,
              ".answer_p"
            );
          }
          const resolvedQuestionType = this.resolveCxQuestionType(
            element,
            questionTypeText
          );
          if (["14", "15"].includes(resolvedQuestionType)) {
            [optionsObject, optionTexts] = this.extractCompositeChoiceOptions(
              element,
              resolvedQuestionType
            );
          }
          if (resolvedQuestionType === "999") {
            this.log.insertLog(
              `未识别题型：${questionTypeText || "空题型"}，请反馈给开发者补充规则..`,
              "warning"
            );
          }
          this.questions.push({
            element,
            type: resolvedQuestionType,
            title: this.clean(questionTitle),
            optionsText: optionTexts,
            options: optionsObject,
            answer: { code: -1, answer: [] },
            workType: this.type,
            refer: this._window.location.href
          });
        });
      });
      this.type = type;
      if (iframe) {
        this._document = iframe.contentDocument;
        this._window = iframe.contentWindow;
      }
    }
    extractOptions(optionElements, optionSelector) {
      const optionsObject = {};
      const optionTexts = [];
      optionElements.forEach((optionElement, index) => {
        var _a;
        let optionTextContent = this.removeHtml(
          ((_a = optionElement.querySelector(optionSelector)) == null ? void 0 : _a.innerHTML) || ""
        );
        if (!optionTextContent || !String(optionTextContent).replace(/<img[^>]*>/gi, "").replace(/\s+/g, "")) {
          const img = optionElement.querySelector && optionElement.querySelector("img");
          const src = img ? (img.getAttribute("data-src") || img.currentSrc || img.src || "") : "";
          if (src) optionTextContent = `<img src="${src}"/>`;
          else if (!optionTextContent) optionTextContent = `选项${String.fromCharCode(65 + index)}`;
        }
        optionsObject[`${String.fromCharCode(65 + index)}. ${optionTextContent}`] = optionElement;
        optionTexts.push(optionTextContent);
      });
      return [optionsObject, optionTexts];
    }
    extractCompositeChoiceOptions(element, questionType) {
      const optionsObject = {};
      const optionTexts = [];
      const containerSelector = questionType === "14" ? ".filling_answer" : ".reading_answer";
      const optionElements = element.querySelectorAll(
        `${containerSelector} span.saveSingleSelect`
      );
      optionElements.forEach((optionElement) => {
        const optionTextContent = this.removeHtml(optionElement.innerHTML || "");
        if (!optionTextContent) return;
        optionsObject[optionTextContent] = optionElement;
        optionTexts.push(optionTextContent);
      });
      return [optionsObject, optionTexts];
    }
  };
  class IframeUtils {
    static getIframes(element) {
      return Array.from(element.querySelectorAll("iframe"));
    }
    static getAllNestedIframes(element) {
      const iframes = IframeUtils.getIframes(element);
      if (iframes.length === 0) {
        return rxjs.of([]);
      } else {
        return rxjs.from(iframes).pipe(
          mergeMap(
            (iframe) => new rxjs.Observable((subscriber) => {
              if (iframe.contentDocument) {
                const iframeDocument = iframe.contentDocument;
                const nestedIframes = IframeUtils.getAllNestedIframes(
                  iframeDocument.documentElement
                );
                nestedIframes.subscribe((nestedIframes2) => {
                  subscriber.next([iframe, ...nestedIframes2]);
                  subscriber.complete();
                });
              } else {
                subscriber.next([]);
                subscriber.complete();
              }
            })
          ),
          concatAll(),
          rxjs.toArray()
        );
      }
    }
  }
  const videoRateStates = new WeakMap();
  const hookVedio = (video, playbackRate = 2) => {
    const rate = Number(playbackRate);
    if (!video || !Number.isFinite(rate) || rate < 0.5 || rate > 16) return false;
    let state = videoRateStates.get(video);
    if (!state) {
      // 从媒体元素自己的原型链读取原生访问器，兼容 iframe 的独立 window。
      let proto = Object.getPrototypeOf(video), descriptor;
      while (proto && !descriptor) {
        descriptor = Object.getOwnPropertyDescriptor(proto, "playbackRate");
        proto = Object.getPrototypeOf(proto);
      }
      if (!descriptor || !descriptor.get || !descriptor.set) return false;
      state = { rate, descriptor };
      state.apply = () => {
        try {
          if (descriptor.get.call(video) !== state.rate) descriptor.set.call(video, state.rate);
          video.defaultPlaybackRate = state.rate;
        } catch (e) { useLogStore().insertLog("设置视频倍速失败：" + e.message); }
      };
      videoRateStates.set(video, state);
      ["loadedmetadata", "playing", "ratechange"].forEach(event => video.addEventListener(event, state.apply));
    }
    state.rate = (video.__xsRateRestricted || video.__xsFinishingAtNormalRate) ? 1 : rate;
    try {
      Object.defineProperty(video, "playbackRate", {
        configurable: true,
        get: () => state.descriptor.get.call(video),
        set: () => state.apply()
      });
    } catch (_) {}
    state.apply();
    return state.descriptor.get.call(video) === state.rate;
  };
  const applyVideoRateToPage = (rate) => {
    if (!Number.isFinite(Number(rate)) || Number(rate) < 0.5 || Number(rate) > 16) return;
    const applyOnDoc = (doc) => {
      if (!doc) return;
      doc.querySelectorAll("video, audio").forEach(el => hookVedio(el, rate));
    };
    const collectFrames = (doc, depth) => {
      if (depth > 3 || !doc) return;
      doc.querySelectorAll("iframe").forEach((frame) => {
        try {
          if (frame.contentDocument) {
            applyOnDoc(frame.contentDocument);
            collectFrames(frame.contentDocument, depth + 1);
          }
        } catch (e) {
        }
      });
    };
    applyOnDoc(document);
    collectFrames(document, 0);
  };
  const refreshMediaSamples = new WeakMap();
  const canRefreshStudyPage = (doc, seen = new Set()) => {
    if (!doc || doc.hidden || doc.visibilityState === "hidden" || seen.has(doc)) return false;
    seen.add(doc);
    if (doc.querySelector(".TiMu, .questionLi, textarea, [contenteditable='true']")) return false;
    let allowed = true;
    const media = [...doc.querySelectorAll("video, audio")];
    for (const el of media) {
      const now = Date.now(), position = Number(el.currentTime), source = el.currentSrc || el.src;
      const previous = refreshMediaSamples.get(el);
      if (!Number.isFinite(position) || !previous || previous.position !== position || previous.source !== source) {
        refreshMediaSamples.set(el, {position, source, since: now});
        allowed = false;
      } else if (now - previous.since < 1800000) allowed = false;
    }
    const frames = [...doc.querySelectorAll("iframe")];
    if (!media.length && !frames.length && doc.querySelector(".ans-job:not(.ans-job-finished)")) return false;
    for (const frame of frames) {
      try { if (!frame.contentDocument || !canRefreshStudyPage(frame.contentDocument, seen)) allowed = false; }
      catch (_) { allowed = false; }
    }
    return allowed;
  };
  const watchMediaRecovery = (media, { recover, checkComplete, onError, documents = [] }) => {
    let stopped = false, running = false;
    const listeners = [];
    const check = async () => {
      if (stopped || running) return;
      running = true;
      try {
        if (checkComplete()) return;
        if (!media.ended && media.paused) await recover();
      } catch (e) { if (onError) onError(e); }
      finally { running = false; }
    };
    const listen = (target, event) => {
      if (!target || !target.addEventListener) return;
      target.addEventListener(event, check);
      listeners.push([target, event]);
    };
    for (const doc of new Set(documents)) {
      ["visibilitychange", "resume"].forEach(event => listen(doc, event));
      ["pageshow", "online", "focus"].forEach(event => listen(doc.defaultView, event));
    }
    ["pause", "canplay", "ended"].forEach(event => listen(media, event));
    // 定时器是兜底；页面恢复时直接复核，不能依赖后台定时器准点执行。
    const timer = setInterval(check, 15000);
    return () => {
      stopped = true;
      clearInterval(timer);
      listeners.forEach(([target, event]) => target.removeEventListener(event, check));
    };
  };
  const FACE_CHECK_INTERVAL_SECONDS = 3;
  const FACE_RECOGNITION_TEXTS = [
    "人脸信息采集",
    "采集人脸信息",
    "请使用手机APP采集人脸信息后继续学习",
    "请扫描下方二维码进入"
  ];
  const GENERIC_FACE_RECOGNITION_TEXTS = [
    "人脸识别",
    "继续学习"
  ];
  let activeWaitPromise = null;
  const getTopDocument = () => {
    var _a, _b;
    try {
      return ((_a = window.top) == null ? void 0 : _a.document) || document;
    } catch {
      try {
        if (typeof unsafeWindow !== "undefined") {
          return ((_b = unsafeWindow.top) == null ? void 0 : _b.document) || document;
        }
      } catch {
        return document;
      }
    }
    return document;
  };
  const isVisible$1 = (element) => {
    var _a;
    if (!element) return false;
    const style = (_a = element.ownerDocument.defaultView) == null ? void 0 : _a.getComputedStyle(element);
    if (style && (style.display === "none" || style.visibility === "hidden")) {
      return false;
    }
    return element.offsetParent !== null || element.getClientRects().length > 0;
  };
  const getSearchDocuments = (extraDocuments = []) => {
    const docs = [];
    const queue = [getTopDocument(), document, ...extraDocuments].filter(Boolean);
    const seen = /* @__PURE__ */ new Set();
    while (queue.length) {
      const doc = queue.shift();
      if (!doc || seen.has(doc)) continue;
      seen.add(doc);
      docs.push(doc);
      try {
        Array.from(doc.querySelectorAll("iframe")).forEach((iframe) => {
          if (iframe.contentDocument) queue.push(iframe.contentDocument);
        });
      } catch {
      }
    }
    return docs;
  };
  const hasLegacyFaceRecognition = (doc) => {
    return Array.from(doc.querySelectorAll("#fcqrimg")).some((element) => {
      return Boolean(element.getAttribute("src")) && isVisible$1(element);
    });
  };
  const hasNewFaceRecognition = (doc) => {
    return Array.from(doc.querySelectorAll(".chapterVideoFaceMaskDiv")).some(isVisible$1);
  };
  const hasFaceRecognitionText = (doc) => {
    var _a, _b;
    const bodyText = ((_a = doc.body) == null ? void 0 : _a.innerText) || ((_b = doc.body) == null ? void 0 : _b.textContent) || "";
    if (FACE_RECOGNITION_TEXTS.some((keyword) => bodyText.includes(keyword))) {
      return true;
    }
    const visibleElements = Array.from(
      doc.querySelectorAll("div, section, article, body")
    ).filter(isVisible$1);
    return visibleElements.some((element) => {
      const text = element.innerText || element.textContent || "";
      const hasFaceText = GENERIC_FACE_RECOGNITION_TEXTS.some(
        (keyword) => text.includes(keyword)
      );
      const hasQRCode = Boolean(element.querySelector("canvas, img, svg"));
      return hasFaceText && (hasQRCode || text.includes("人脸"));
    });
  };
  const hasCxFaceRecognition = (extraDocuments = []) => {
    return getSearchDocuments(extraDocuments).some((doc) => {
      return hasLegacyFaceRecognition(doc) || hasNewFaceRecognition(doc) || hasFaceRecognitionText(doc);
    });
  };
  const waitForCxFaceRecognition = async ({
    log,
    setting,
    messageStore,
    extraDocuments = []
  } = {}) => {
    if (!hasCxFaceRecognition(extraDocuments)) return;
    if (activeWaitPromise) return activeWaitPromise;
    activeWaitPromise = (async () => {
      var _a, _b, _c;
      const message2 = "检测到人脸识别，请手动完成后脚本会继续运行。";
      log == null ? void 0 : log.insertLog(message2, "warning", 4);
      if ((_c = (_b = (_a = setting == null ? void 0 : setting.config) == null ? void 0 : _a.cxConfig) == null ? void 0 : _b.faceRecognitionNotify) == null ? void 0 : _c.value) {
        messageStore == null ? void 0 : messageStore.insertMessage(message2, "warning");
      }
      while (hasCxFaceRecognition(extraDocuments)) {
        await sleep(FACE_CHECK_INTERVAL_SECONDS);
      }
      log == null ? void 0 : log.insertLog("人脸识别已完成，继续处理当前任务。");
    })();
    try {
      return await activeWaitPromise;
    } finally {
      activeWaitPromise = null;
    }
  };


  const TASK_RESULT = {
    finished: "finished",
    unconfirmed: "unconfirmed",
    skipped: "skipped"
  };
  const BOOK_READ_EXTRA_SECONDS = 8;
  const BOOK_READ_MAX_ROUNDS = 4;
  const jobContainerOf = (target) => {
    if (!target) return null;
    if (target.tagName === "IFRAME") return target.closest(".ans-job") || target.parentElement;
    return target;
  };

  const JOB_CONFIRM_TIMEOUT = 8;
  const PLAYBACK_WATCHDOG_INTERVAL = 5;
  const PLAY_FAIL_HINT_THRESHOLD = 3;
  const parseJobReport = (responseText) => {
    try {
      const data = JSON.parse(responseText);
      return (data == null ? void 0 : data.status) === true || (data == null ? void 0 : data.status) === "true";
    } catch (error) {
      return String(responseText || "").includes("success");
    }
  };
  const watchJobReport = (iframeWindow) => {
    var _a;
    const prototype = (_a = iframeWindow == null ? void 0 : iframeWindow.XMLHttpRequest) == null ? void 0 : _a.prototype;
    if (!prototype) {
      return { result: Promise.resolve(false), restore: () => {} };
    }
    const originalOpen = prototype.open;
    const originalSend = prototype.send;
    let reportSettled = null;
    const result = new Promise((resolve) => {
      reportSettled = resolve;
    });
    prototype.open = function(method, url2, ...rest) {
      this.__xsJobRequestUrl = typeof url2 === "string" ? url2 : "";
      return originalOpen.call(this, method, url2, ...rest);
    };
    prototype.send = function(...args) {
      if (String(this.__xsJobRequestUrl || "").includes("/ananas/job")) {
        this.addEventListener("load", () => {
          try { reportSettled(parseJobReport(this.responseText)); } catch (_) { reportSettled(false); }
        });
        this.addEventListener("error", () => { try { reportSettled(false); } catch (_) {} });
      }
      return originalSend.apply(this, args);
    };
    return {
      result,
      restore: () => {
        prototype.open = originalOpen;
        prototype.send = originalSend;
      }
    };
  };
  const waitJobIconFinished = async (target, timeoutSec) => {
    const taskContainer = jobContainerOf(target);
    if (!taskContainer) return false;
    const deadline = Date.now() + timeoutSec * 1e3;
    while (Date.now() < deadline) {
      if (taskContainer.classList.contains("ans-job-finished")) return true;
      await sleep(0.5);
    }
    return taskContainer.classList.contains("ans-job-finished");
  };
  const confirmJobFinished = (target, reportResult, timeoutSec = JOB_CONFIRM_TIMEOUT) => {
    return new Promise((resolve) => {
      const taskContainer = jobContainerOf(target);
      const signals = [reportResult, waitJobIconFinished(taskContainer, timeoutSec)];
      let pending = signals.length;
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      signals.forEach((signal) => {
        Promise.resolve(signal).then((confirmed) => {
          if (confirmed) finish(true);
          else if (--pending === 0) finish(false);
        }).catch(() => {
          if (--pending === 0) finish(false);
        });
      });
      sleep(timeoutSec).then(() => finish(false));
    });
  };

  const cxChapterLogic = () => {
    const log = useLogStore();
    const init = () => {
      const currentUrl = window.location.href;
      if (!currentUrl.includes("&mooc2=1")) {
        window.location.href = currentUrl + "&mooc2=1";
      }
    };
    log.insertLog("进入学习页面，脚本开始工作中..");
    if (document.wasDiscarded) log.insertLog("检测到浏览器回收了后台页面；请将学习网站设为始终保持活动/不休眠，进度以平台记录为准", "warning");
    const setting = useSettingStore();
    const questionStore = useQuestionStore();
    const messageStore = useMessageStore();
    const setupFaceRecognitionWatcher = () => {
      setInterval(async () => {
        await waitForCxFaceRecognition({
          log,
          setting,
          messageStore
        });
      }, 3e3);
    };
    const processIframeTask = async () => {
      var _a;
      const documentElement = document.documentElement;
      const iframe = documentElement.querySelector("iframe");
      if (!iframe) {
        console.warn("No iframe found.");
        return;
      }
      if (setting.config.basicConfig.autoChangeChapter.value && ((_a = setting.config.basicConfig.skipFinishedChapter) == null ? void 0 : _a.value) && isCurrentChapterFinishedByCatalog() && await changeToNextUnfinishedChapter()) {
        return;
      }
      watchIframe(documentElement);
      iframe.addEventListener("load", function() {
        watchIframe(documentElement);
      });
    };
    const waitIframeLoad = async (iframe) => {
      return new Promise((resolve) => {
        const intervalId = setInterval(async () => {
          var _a;
          if (iframe.contentDocument && ((_a = iframe.contentDocument) == null ? void 0 : _a.readyState) == "complete") {
            resolve();
            clearInterval(intervalId);
          }
        }, 500);
      });
    };

    const hideCxWorkConfirmPopup = () => {
      var _a, _b, _c;
      try {
        const topWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow.top : window.top;
        const topDocument = (topWindow == null ? void 0 : topWindow.document) || document;
        (_c = (_b = (_a = topWindow == null ? void 0 : topWindow.$) == null ? void 0 : _a.call(topWindow, "#workpop")) == null ? void 0 : _b.hide) == null ? void 0 : _c.call(_b);
        const workPopup = topDocument.querySelector("#workpop");
        if (workPopup) {
          workPopup.style.display = "none";
        }
      } catch (error) {
        console.warn("hide work popup failed.", error);
      }
    };
    const processWork = async (iframe, iframeDocument, iframeWindow) => {
      var _a;
      const workName = ((_a = iframeDocument.documentElement.querySelector(
        "#RightCon > div.radiusBG > div > div.ceyan_name>h3"
      )) == null ? void 0 : _a.innerText) || "未知测验";
      log.insertLog(`发现测验：${workName}，正在解析..`);
      {
        if (!iframeDocument) return;
        if (iframeDocument.documentElement.innerText.includes("已完成") || iframeDocument.documentElement.innerText.includes("待批阅")) {
          log.insertLog("测验已经完成，跳转中..");
          return;
        }
        decrypt(iframeDocument);
        if (!setting.config.basicConfig.autoAnswer.value) {
          log.insertLog(
            `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
          );
          return;
        }
        questionStore.accuracy = -1;
        const accuracy = await new QuestionHandler$1("zj", iframe).init();
        questionStore.accuracy = accuracy;
        iframeWindow.alert = () => {
        };
        if (setting.config.basicConfig.autoSubmit.value && setting.config.basicConfig.autoAnswer.value && hasPendingManualPick()) {
          log.insertLog("还有题目等待手动选择，已暂停自动提交，请先去「题目结果」选择", "warning", 8);
          await iframeWindow.noSubmit();
        } else if (setting.config.basicConfig.autoSubmit.value && setting.config.basicConfig.autoAnswer.value) {
          log.insertLog("自动提交已开启，提交中...");
          if (accuracy < Number(setting.config.basicConfig.accuracy.value)) {
            log.insertLog(
              `正确率小于${setting.config.basicConfig.accuracy.value}%，暂存，如需调整正确率请前往<span class='module'>设置</span>模块中更改`,
              "warning",
              4
            );
            await iframeWindow.noSubmit();
          } else {
            log.insertLog(
              `正确率大于${setting.config.basicConfig.accuracy.value}%，提交中...`
            );
            await iframeWindow.btnBlueSubmit();
            await sleep(setting.config.basicConfig.reqIntervalTime.value / 2);
            if (!setting.config.basicConfig.autoSubmit.value || !setting.config.basicConfig.autoAnswer.value) return;
            await iframeWindow.submitCheckTimes();
            hideCxWorkConfirmPopup();
            log.insertLog("提交成功");
          }
        } else {
          log.insertLog(
            "自动提交未开启，已暂存，可前往<span class='module'>设置</span>模块中更改",
            "warning",
            4
          );
          await iframeWindow.noSubmit();
        }
        return;
      }
    };
    const setupInterceptor = () => {
      let currentUrl = window.location.href;
      setInterval(() => {
        if (currentUrl !== window.location.href) {
          currentUrl = window.location.href;
          processIframeTask();
        }
      }, 2e3);
    };
    const getTopLearningContext = () => {
      let topWindow = window, topDocument = document;
      try {
        topWindow = (typeof unsafeWindow !== "undefined" ? unsafeWindow.top : window.top) || window;
        topDocument = topWindow.document || document;
      } catch (_) {
        topWindow = window;
        topDocument = document;
      }
      return { topWindow, topDocument };
    };
    const getChapterIdFromTeacherAjax = (element) => {
      var _a, _b;
      return ((_b = (_a = element == null ? void 0 : element.getAttribute("onclick")) == null ? void 0 : _a.match(/\('(.*)','(.*)','(.*)'\)/)) == null ? void 0 : _b[3]) || "";
    };
    const getChapterName = (chapterInfo) => {
      var _a, _b, _c, _d, _e, _f, _g;
      return ((_d = (_c = (_b = (_a = chapterInfo == null ? void 0 : chapterInfo.element) == null ? void 0 : _a.parentElement) == null ? void 0 : _b.querySelector(".posCatalog_name")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || ((_g = (_f = (_e = chapterInfo == null ? void 0 : chapterInfo.element) == null ? void 0 : _e.parentElement) == null ? void 0 : _f.textContent) == null ? void 0 : _g.trim()) || "未知章节";
    };
    const parseUnfinishCount = (container) => {
      const element = container == null ? void 0 : container.querySelector(".jobUnfinishCount");
      if (!element) return null;
      const count = Number.parseInt(String(element.value ?? "").trim(), 10);
      return Number.isFinite(count) ? count : null;
    };
    const resolveChapterFinished = (container) => {
      if (!container) return null;
      if (container.querySelector(".icon_Completed")) return true;
      const count = parseUnfinishCount(container);
      return count === null ? null : count === 0;
    };
    const isChapterFinished = (chapter) => chapter.finished === true;
    const isChapterPending = (chapter) => chapter.finished === false;
    const isCurrentChapterFinishedByCatalog = () => {
      const { topDocument } = getTopLearningContext();
      const activeChapter = topDocument.querySelector(".posCatalog_active");
      if (!activeChapter) return false;
      return resolveChapterFinished(activeChapter) === true;
    };
    const isInFinalTab = () => {
      const { topDocument } = getTopLearningContext();
      const tabs = Array.from(topDocument.querySelectorAll("#prev_tab .prev_ul li"));
      if (tabs.length === 0) return true;
      return tabs[tabs.length - 1].classList.contains("active");
    };
    const isInFinalChapter = () => {
      const { topDocument } = getTopLearningContext();
      const chapterNodes = Array.from(topDocument.querySelectorAll(".posCatalog_select:not(.firstLayer)"));
      if (chapterNodes.length === 0) return false;
      return chapterNodes[chapterNodes.length - 1].classList.contains("posCatalog_active");
    };
    const hasLockedChapters = () => {
      const { topDocument } = getTopLearningContext();
      return topDocument.querySelectorAll(".catalog_points_sa, .catalog_points_er").length > 0;
    };
    const chapterEnterCounter = /* @__PURE__ */ new Map();
    const REPEAT_ENTER_MAX = 3;
    const isStuckOnSameChapter = () => {
      var _a;
      if (!hasLockedChapters()) return false;
      const { topDocument } = getTopLearningContext();
      const chapterId = (_a = topDocument.querySelector(".posCatalog_active")) == null ? void 0 : _a.getAttribute("id");
      if (!chapterId) return false;
      const count = (chapterEnterCounter.get(chapterId) || 0) + 1;
      if (count >= REPEAT_ENTER_MAX) {
        chapterEnterCounter.set(chapterId, 0);
        return true;
      }
      chapterEnterCounter.set(chapterId, count);
      return false;
    };
    const getChapterInfos = (topDocument) => {
      return Array.from(topDocument.querySelectorAll('[onclick^="getTeacherAjax"]')).map((element) => ({
        element,
        chapterId: getChapterIdFromTeacherAjax(element),
        finished: resolveChapterFinished(element.parentElement)
      })).filter((chapter) => chapter.chapterId);
    };
    const waitForChapterInfos = async (timeout = 10) => {
      const { topDocument } = getTopLearningContext();
      const deadline = Date.now() + timeout * 1e3;
      let lastCount = -1;
      while (Date.now() < deadline) {
        const chapters = getChapterInfos(topDocument);
        if (chapters.length > 0 && chapters.length === lastCount) {
          return { chapters, stable: true };
        }
        lastCount = chapters.length;
        await sleep(1);
      }
      return { chapters: getChapterInfos(topDocument), stable: false };
    };
    const findNextUnfinishedChapter = async () => {
      var _a;
      const { topDocument } = getTopLearningContext();
      const { chapters, stable } = await waitForChapterInfos();
      if (!chapters.length) return { hasCatalog: false, chapter: null, allFinished: false };
      const currentChapterId = ((_a = topDocument.querySelector("#curChapterId")) == null ? void 0 : _a.value) || "";
      const currentIndex = chapters.findIndex((chapter) => chapter.chapterId === currentChapterId);
      const orderedChapters = currentIndex >= 0 ? [...chapters.slice(currentIndex + 1), ...chapters.slice(0, currentIndex)] : chapters;
      return {
        hasCatalog: true,
        chapter: orderedChapters.find(isChapterPending) || null,
        allFinished: stable && !hasLockedChapters() && chapters.every(isChapterFinished)
      };
    };
    const jumpToChapter = async (chapterInfo) => {
      var _a, _b, _c;
      if (!chapterInfo) return false;
      const { topWindow, topDocument } = getTopLearningContext();
      const chapterId = chapterInfo.chapterId;
      const courseId = (_a = topDocument.querySelector("#curCourseId")) == null ? void 0 : _a.value;
      const classId = (_b = topDocument.querySelector("#curClazzId")) == null ? void 0 : _b.value;
      log.insertLog(`跳转到未完成章节：${getChapterName(chapterInfo)}`);
      if ((topWindow == null ? void 0 : topWindow.getTeacherAjax) && courseId && classId && chapterId) {
        topWindow.getTeacherAjax(courseId, classId, chapterId);
      } else {
        chapterInfo.element.click();
      }
      await sleep(1);
      (_c = topDocument.querySelector(".posCatalog_active")) == null ? void 0 : _c.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    };
    const changeToNextUnfinishedChapter = async () => {
      var _a;
      if (!((_a = setting.config.basicConfig.skipFinishedChapter) == null ? void 0 : _a.value)) return false;
      const { hasCatalog, chapter, allFinished } = await findNextUnfinishedChapter();
      if (!hasCatalog) {
        log.insertLog("未读取到章节任务点数据，已改用普通章节切换", "warning");
        return false;
      }
      if (allFinished) {
        log.insertLog("全部章节任务点已完成");
        return true;
      }
      if (!chapter) {
        if (hasLockedChapters()) {
          log.insertLog("后续章节尚未解锁，按顺序推进中");
        } else {
          log.insertLog("部分章节完成状态读取不到，已改用普通章节切换", "warning");
        }
        return false;
      }
      return jumpToChapter(chapter);
    };
    const changeToNextChapter = async (documentElement, isCurrent = () => true) => {
      const enabled = () => setting.config.basicConfig.autoChangeChapter.value && isCurrent();
      if (!enabled()) return false;
      if (hasPendingManualPick()) {
        log.insertLog("还有题目等待手动选择，已暂停自动切换章节；选完后继续", "warning", 8);
        return false;
      }
      if (isInFinalTab() && isStuckOnSameChapter()) {
        log.insertLog("已多次重复进入当前章节，可能存在需要手动完成的章节测试，请手动完成后再继续。", "warning", 4);
        return false;
      }
      if (isInFinalTab() && isCurrentChapterFinishedByCatalog() && await changeToNextUnfinishedChapter()) {
        return true;
      }
      if (isInFinalTab() && isInFinalChapter()) {
        const { hasCatalog, allFinished } = await findNextUnfinishedChapter();
        if (hasCatalog) {
          if (allFinished) {
            log.insertLog("全部章节任务点已完成");
          } else if (hasLockedChapters()) {
            log.insertLog("仍有未解锁的章节，请完成当前章节的任务点后继续", "warning", 4);
          } else {
            log.insertLog("已到最后一章，但仍有章节未完成，请手动切换到未完成的章节", "warning", 4);
          }
          return true;
        }
      }
      await sleep(setting.config.basicConfig.reqIntervalTime.value);
      if (!enabled()) return false;
      const { topWindow, topDocument } = getTopLearningContext();
      const course = topDocument.querySelector("#curCourseId"), chapter = topDocument.querySelector("#curChapterId"), clazz = topDocument.querySelector("#curClazzId");
      if (topWindow.PCount && typeof topWindow.PCount.next === "function" && course && chapter && clazz) {
        try {
          if (!enabled()) return false;
          topWindow._preChapterId = chapter.value;
          try {
            try {
              const active = topDocument.querySelector(".posCatalog_active");
              if (active) active.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch (_) {}
          } catch (_) {}
          await sleep(0.2);
          topWindow.PCount.next(String(topDocument.querySelectorAll("#prev_tab .prev_ul li").length), chapter.value, course.value, clazz.value, "");
          return true;
        } catch (error) { console.warn("PCount.next failed", error); }
      }
      for (const root of new Set([topDocument, documentElement, document])) {
        for (const button of root.querySelectorAll(".nextChapter, #prevNextFocusNext")) {
          if (button.disabled || button.getAttribute("aria-disabled") === "true" || button.style.display === "none") continue;
          if (!enabled()) return false;
          button.click(); return true;
        }
      }
      // 普通下一章找不到时，再尝试目录跳未完成章
      if (await changeToNextUnfinishedChapter()) return true;
      log.insertLog("未找到可用下一章入口，请检查是否已到最后一章或章节尚未解锁", "warning", 4);
      return false;
    };
    let currentWatchIframeTaskId = 0;
    let pendingChapterAdvance = null, advancingChapter = false;
    const advancePendingChapter = async () => {
      if (advancingChapter || !pendingChapterAdvance || !setting.config.basicConfig.autoChangeChapter.value) return;
      const pending = pendingChapterAdvance;
      advancingChapter = true;
      try {
        if (await changeToNextChapter(pending.root, () => pending.id === currentWatchIframeTaskId)) {
          if (pendingChapterAdvance === pending) pendingChapterAdvance = null;
        }
      } finally { advancingChapter = false; }
    };
    vue.watch(() => setting.config.basicConfig.autoChangeChapter.value, enabled => { if (enabled) advancePendingChapter(); });
    // 手动选择完成后，若之前因等待选择而搁置了切章，这里自动补上
    let manualPickWatchTimer = null;
    const watchPendingManualPick = () => {
      if (manualPickWatchTimer) return;
      manualPickWatchTimer = setInterval(() => {
        if (advancingChapter) return;
        if (hasPendingManualPick()) return;
        if (!pendingChapterAdvance) return;
        if (!setting.config.basicConfig.autoChangeChapter.value) return;
        advancePendingChapter();
      }, 2000);
    };
    watchPendingManualPick();
    let _afterPickBusy = false;
    const afterManualPickResolved = async (questionNo) => {
      if (_afterPickBusy || hasPendingManualPick()) return;
      _afterPickBusy = true;
      try {
        if (pendingChapterAdvance && setting.config.basicConfig.autoChangeChapter.value) {
          log.insertLog(`第${questionNo}题已手动选择，继续切换章节`);
          await advancePendingChapter();
        }
      } finally { _afterPickBusy = false; }
    };
    onManualPickResolved(afterManualPickResolved);
    const watchIframe = (documentElement) => {
      const thisTaskId = ++currentWatchIframeTaskId;
      pendingChapterAdvance = null;
      IframeUtils.getAllNestedIframes(documentElement).subscribe((allIframes) => {
        const taskResults = [];
        rxjs.from(allIframes).pipe(
          concatMap((iframe) => processIframe(iframe).catch((error) => {
            console.warn("[cx] 任务点处理异常。", error);
            log.insertLog("当前任务点处理异常", "warning");
            return TASK_RESULT.unconfirmed;
          }))
        ).subscribe({
          next: (result) => taskResults.push(result || TASK_RESULT.skipped),
          error: (error) => {
            console.warn("[cx] 任务链异常终止。", error);
            log.insertLog("任务链处理异常，请尝试刷新页面", "warning", 4);
          },
          complete: async () => {
            var _a, _b;
            const chapterName = ((_a = documentElement.querySelector(
              ".posCatalog_select.posCatalog_active>.posCatalog_name"
            )) == null ? void 0 : _a.innerText) || "未知章节";
            const currentTaskName = ((_b = document.querySelector(".prev_ul > li.active .spanText")) == null ? void 0 : _b.textContent.trim()) || "";
            if (thisTaskId !== currentWatchIframeTaskId) return;
            if (taskResults.includes(TASK_RESULT.unconfirmed)) {
              log.insertLog(
                `任务点 ${chapterName}-${currentTaskName} 未确认完成，已停止自动跳转，请手动确认后继续`,
                "warning",
                4
              );
              return;
            }
            log.insertLog(`任务点 ${chapterName}-${currentTaskName} 已处理完毕`);
            pendingChapterAdvance = { root: documentElement, id: thisTaskId };
            if (setting.config.basicConfig.autoChangeChapter.value) {
              await advancePendingChapter();
            } else {
              log.insertLog(
                `自动切换章节未开启，前往<span class='module'>设置</span>模块中更改`,
                "warning",
                4
              );
            }
          }
        });
      });
    };
    const logDocumentDiagnostics = (iframeWindow) => {
      var _a;
      try {
        const moduleDocument = iframeWindow.document;
        console.info("[cx] 文档模块结构未识别", {
          url: (_a = iframeWindow.location) == null ? void 0 : _a.href,
          innerIframes: Array.from(moduleDocument.querySelectorAll("iframe")).map((element) => element.src),
          scrollable: Array.from(moduleDocument.querySelectorAll("*")).filter((element) => element.scrollHeight > element.clientHeight + 5).slice(0, 10).map((element) => `${element.tagName}#${element.id}.${element.className}`)
        });
      } catch (error) {
        console.warn("[cx] 收集文档模块结构失败。", error);
      }
    };
    const readSlides = async (iframeWindow) => {
      const moduleDocument = iframeWindow.document;
      moduleDocument.querySelectorAll("audio").forEach((audio) => {
        audio.muted = true;
        audio.addEventListener("play", () => { audio.muted = true; });
      });
      if (typeof iframeWindow.swiperNext !== "function") return false;
      const slideCount = moduleDocument.querySelectorAll(".swiper-container .swiper-slide").length;
      for (let index = 0; index < slideCount; index += 1) {
        iframeWindow.swiperNext();
        await sleep(1);
      }
      return true;
    };
    const runDocumentTask = async (iframeWindow) => {
      const moduleDocument = iframeWindow.document;
      const hasFinishEntry = typeof iframeWindow.finishJob === "function";
      const isImageViewer = Boolean(moduleDocument.querySelector("#img.imglook"));
      const hasSlides = Boolean(moduleDocument.querySelector(".swiper-container"));
      const panView = moduleDocument.querySelector("#panView");
      if (hasFinishEntry && (isImageViewer || !hasSlides)) {
        iframeWindow.finishJob();
        return true;
      }
      if (hasSlides) return readSlides(iframeWindow);
      // 兼容旧版 PPT：滚动到底
      if (panView && panView.contentWindow) {
        try {
          const pptWindow = panView.contentWindow;
          const waitReady = () => new Promise((resolve) => {
            const tick = () => {
              if (pptWindow.document && pptWindow.document.readyState === "complete") resolve();
              else setTimeout(tick, 100);
            };
            tick();
          });
          await waitReady();
          pptWindow.scrollTo({ top: pptWindow.document.body.scrollHeight, behavior: "smooth" });
          await sleep(1);
          return true;
        } catch (_) {}
      }
      return false;
    };
    const processDocument = async (iframeWindow, iframe) => {
      log.insertLog("发现一个文档任务点，正在处理...");
      const reporter = watchJobReport(iframeWindow);
      try {
        const started = await runDocumentTask(iframeWindow);
        if (!started) {
          logDocumentDiagnostics(iframeWindow);
          log.insertLog("该文档任务点缺少可用的完成入口，请手动完成后继续", "warning", 4);
          return TASK_RESULT.unconfirmed;
        }
        const confirmed = await confirmJobFinished(iframe, reporter.result);
        if (!confirmed) {
          log.insertLog("文档任务点未确认完成，请手动确认", "warning", 4);
          return TASK_RESULT.unconfirmed;
        }
        log.insertLog("文档任务点已完成");
        return TASK_RESULT.finished;
      } finally {
        reporter.restore();
      }
    };
    const getBookRequiredSeconds = (iframeWindow) => {
      var _a;
      const readerSrc = ((_a = iframeWindow.document.querySelector('iframe[name="bookifame"]')) == null ? void 0 : _a.getAttribute("src")) || "";
      if (!readerSrc.includes("timing")) return 0;
      try {
        const timing = new URL(readerSrc, iframeWindow.location.href).searchParams.get("timing");
        const seconds = Number.parseInt(timing || "0", 10);
        return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
      } catch (error) {
        console.warn("[cx] 解析阅读时长失败。", error);
        return 0;
      }
    };
    const keepReading = async (requiredSeconds, iframe, reportResult) => {
      for (let round = 1; round <= BOOK_READ_MAX_ROUNDS; round += 1) {
        const confirmed = await confirmJobFinished(iframe, reportResult, requiredSeconds + BOOK_READ_EXTRA_SECONDS);
        if (confirmed) return true;
        if (round < BOOK_READ_MAX_ROUNDS) {
          log.insertLog(`阅读时长尚未达标，继续保持第 ${round + 1} 轮阅读`);
        }
      }
      return false;
    };

    const setupVideoQuizHandler = (iframeDocument) => {
      const intervalId = setInterval(() => {
        const quizContainer = iframeDocument.querySelector(".ans-timelineobjects");
        if (!quizContainer || quizContainer.offsetParent === null) return;
        const submitBtn = iframeDocument.querySelector("#videoquiz-submit");
        if (!submitBtn || submitBtn.style.display === "none" || submitBtn.offsetParent === null) return;
        quizContainer.style.display = "none";
        const quizBg = iframeDocument.querySelector(".ans-timelineobjectsbg");
        if (quizBg) quizBg.style.display = "none";
        log.insertLog("检测到视频弹题，已跳过。");
        const video = iframeDocument.querySelector("video");
        if (video) video.play();
      }, 2e3);
      return intervalId;
    };
    const isVideoPlaybackRateDisabled = (iframeDocument) => {
      const control = iframeDocument.querySelector(".vjs-playback-rate");
      // 菜单可能尚未渲染，缺菜单不等于平台明确禁止倍速。
      return !!(control && (control.getAttribute("aria-disabled") === "true" || control.classList.contains("vjs-disabled")));
    };
    const processMedia = async (mediaType, iframeDocument, iframe) => {
      return new Promise((resolve) => {
        const taskContainer = iframe && (iframe.closest(".ans-job") || iframe.parentElement);
        const iframeWindow = iframe && iframe.contentWindow;
        const userRate = setting.config.basicConfig.videoPlayrate.value;
        const isRateDisabled = mediaType === "video" && isVideoPlaybackRateDisabled(iframeDocument);
        const finalRate = isRateDisabled ? 1 : userRate;
        const MEDIA_CONFIRM_RELOAD_KEY = "xs-cx-media-confirm-reload";
        const mediaJobKey = (() => {
          try {
            const chapter = (document.querySelector("#curChapterId") || {}).value || "";
            const jobId = (taskContainer && (taskContainer.id || taskContainer.getAttribute("data") || "")) || "";
            const src = (iframe && iframe.src) || "";
            return `${location.pathname}|${chapter}|${jobId}|${src}`.slice(0, 240);
          } catch (_) {
            return `${mediaType}|${Date.now()}`;
          }
        })();
        const isJobFinished = () => !!(taskContainer && taskContainer.classList.contains("ans-job-finished"));
        log.insertLog(`发现一个${mediaType}，开始播放，倍速 ${finalRate}x`);
        let isExecuted = false;
        let isSpeedRestored = false;
        let hasPlaybackEnded = false;
        let isResolved = false;
        let observer = null;
        let quizHandlerId = null;
        let watchdogId = null;
        let stopRecovery = null;
        let jobWatcher = null;
        let isResuming = false;
        let pausedChecks = 0;
        if (isRateDisabled && userRate > 1) {
          log.insertLog(
            "视频禁止倍速，已临时调整为1倍速，强制倍速回导致任务点无法完成。"
          );
        }
        const intervalId = setInterval(async () => {
          const mediaElement = iframeDocument.documentElement.querySelector(mediaType);
          if (mediaElement && !isExecuted) {
            isExecuted = true;
            clearInterval(intervalId);
            // 播完刷新回来：复查任务点是否已画上完成态
            let afterConfirmReload = false;
            try {
              if (sessionStorage.getItem(MEDIA_CONFIRM_RELOAD_KEY) === mediaJobKey) {
                afterConfirmReload = true;
                sessionStorage.removeItem(MEDIA_CONFIRM_RELOAD_KEY);
              }
            } catch (_) {}
            if (afterConfirmReload && taskContainer) {
              log.insertLog(`${mediaType}刷新后复查任务点完成状态…`);
              if (await waitJobIconFinished(taskContainer, 5)) {
                log.insertLog(`${mediaType}刷新后任务点已确认完成`);
                resolve();
                return;
              }
              log.insertLog(`${mediaType}刷新后仍未标记完成，将重新播放`, "warning");
            }
            await waitForCxFaceRecognition({
              log,
              setting,
              messageStore,
              extraDocuments: [iframeDocument]
            });
            jobWatcher = watchJobReport(iframeWindow);
            mediaElement.muted = true;
            mediaElement.__xsRateRestricted = isRateDisabled;
            mediaElement.__xsFinishingAtNormalRate = false;
            if (mediaType === "video") {
              quizHandlerId = setupVideoQuizHandler(iframeDocument);
            }
            const applyPlaybackRate = (rate) => {
              delete mediaElement.playbackRate;
              hookVedio(mediaElement, rate);
            };
            const tryPlay = () => {
              var _a, _b;
              mediaElement.muted = true;
              (_b = (_a = mediaElement.play()) == null ? void 0 : _a.catch) == null ? void 0 : _b.call(_a, (error) => {
                console.warn("[cx] 起播失败，稍后重试。", error);
              });
            };
            const resumePlayback = async () => {
              if (hasPlaybackEnded || isResolved || isResuming || mediaElement.ended) return;
              isResuming = true;
              try {
                await waitForCxFaceRecognition({
                  log,
                  setting,
                  messageStore,
                  extraDocuments: [iframeDocument]
                });
                await sleep(1);
                if (hasPlaybackEnded || isResolved || mediaElement.ended) return;
                tryPlay();
              } finally {
                isResuming = false;
              }
            };
            const playingHandler = () => {
              pausedChecks = 0;
              applyPlaybackRate(isSpeedRestored ? 1 : finalRate);
            };
            mediaElement.addEventListener("playing", playingHandler);
            mediaElement.addEventListener("pause", resumePlayback);
            watchdogId = setInterval(() => {
              if (!mediaElement.paused || hasPlaybackEnded || isResolved) return;
              pausedChecks += 1;
              if (pausedChecks === PLAY_FAIL_HINT_THRESHOLD) {
                log.insertLog(
                  `${mediaType}尚未开始播放，可能是资源加载缓慢，仍在重试中`,
                  "warning",
                  4
                );
              }
              resumePlayback();
            }, PLAYBACK_WATCHDOG_INTERVAL * 1e3);
            const timeUpdateHandler = () => {
              if (!isSpeedRestored && mediaElement.duration - mediaElement.currentTime < 10) {
                isSpeedRestored = true;
                mediaElement.__xsFinishingAtNormalRate = true;
                applyPlaybackRate(1);
              }
            };
            if (finalRate > 1) {
              mediaElement.addEventListener("timeupdate", timeUpdateHandler);
            }
            const cleanup = () => {
              if (stopRecovery) { stopRecovery(); stopRecovery = null; }
              mediaElement.removeEventListener("playing", playingHandler);
              mediaElement.removeEventListener("pause", resumePlayback);
              mediaElement.removeEventListener("timeupdate", timeUpdateHandler);
              if (quizHandlerId) {
                clearInterval(quizHandlerId);
                quizHandlerId = null;
              }
              if (watchdogId) {
                clearInterval(watchdogId);
                watchdogId = null;
              }
              if (observer) {
                observer.disconnect();
                observer = null;
              }
              if (jobWatcher) {
                try { jobWatcher.restore(); } catch (_) {}
                jobWatcher = null;
              }
            };
            const finishTask = (result = TASK_RESULT.finished) => {
              if (isResolved) return;
              isResolved = true;
              cleanup();
              resolve(result);
            };
            const reloadToConfirmProgress = () => {
              try {
                if (sessionStorage.getItem(MEDIA_CONFIRM_RELOAD_KEY) === mediaJobKey) return false;
                sessionStorage.setItem(MEDIA_CONFIRM_RELOAD_KEY, mediaJobKey);
              } catch (_) {}
              log.insertLog(`${mediaType}进度未刷出完成态，立即刷新确认任务点`, "warning");
              cleanup();
              isResolved = true;
              setTimeout(() => {
                try { location.reload(); } catch (_) { window.location.reload(); }
              }, 300);
              return true;
            };
            mediaElement.addEventListener("ended", async () => {
              if (isResolved || hasPlaybackEnded) return;
              hasPlaybackEnded = true;
              if (!taskContainer) {
                log.insertLog(`${mediaType}已播放完成`);
                finishTask();
                return;
              }
              if (isJobFinished()) {
                log.insertLog(`${mediaType}任务点已完成，停止播放`);
                try { mediaElement.pause(); } catch (_) {}
                finishTask();
                return;
              }
              log.insertLog(`${mediaType}已播放完成，等待平台确认学习进度…`);
              const reportPromise = (jobWatcher && jobWatcher.result) || Promise.resolve(false);
              const confirmed = await confirmJobFinished(taskContainer, reportPromise, JOB_CONFIRM_TIMEOUT);
              if (isResolved) return;
              if (confirmed || isJobFinished()) {
                log.insertLog(`${mediaType}任务点已完成，停止播放`);
                try { mediaElement.pause(); } catch (_) {}
                finishTask();
                return;
              }
              // 平台常需刷新才画完成态：确认超时后立刻刷新（只刷一次）
              if (!reloadToConfirmProgress()) {
                log.insertLog(`${mediaType}已刷新过仍未确认，停止自动切章以免空跳`, "warning");
                try { mediaElement.pause(); } catch (_) {}
                finishTask(TASK_RESULT.unconfirmed);
              }
            });
            if (taskContainer) {
              observer = new MutationObserver(() => {
                if (taskContainer.classList.contains("ans-job-finished")) {
                  log.insertLog(`${mediaType}任务点已完成，停止播放`);
                  try { mediaElement.pause(); } catch (_) {}
                  finishTask();
                }
              });
              observer.observe(taskContainer, {
                attributes: true,
                attributeFilter: ["class"],
                subtree: true
              });
              if (isJobFinished()) {
                log.insertLog(`${mediaType}任务点已完成，停止播放`);
                try { mediaElement.pause(); } catch (_) {}
                finishTask();
              }
            }
            if (!isResolved) {
              stopRecovery = watchMediaRecovery(mediaElement, {
                documents: [document, iframeDocument],
                recover: resumePlayback,
                checkComplete: () => {
                  if (isResolved) return true;
                  if (isJobFinished()) {
                    try { mediaElement.pause(); } catch (_) {}
                    finishTask();
                    return true;
                  }
                  return false;
                },
                onError: e => log.insertLog("后台恢复播放失败，将继续重试：" + e.message, "warning")
              });
              applyPlaybackRate(finalRate);
              tryPlay();
              log.insertLog(`播放成功，当前实际播放倍速为${mediaElement.playbackRate || finalRate}x.`);
            }
          }
        }, 2500);
      });
    };

    const processRead = async (iframe, iframeWindow) => {
      try {
        const reporter = watchJobReport(iframeWindow);
        try {
          const triggerFinish = () => {
            try {
              if (iframeWindow && typeof iframeWindow.finishJob === "function" && iframeWindow.jobid) {
                iframeWindow.finishJob(iframeWindow.jobid);
                return true;
              }
            } catch (e) {}
            return false;
          };
          if (!triggerFinish()) {
            const subFrame = (iframe.contentDocument == null ? void 0 : iframe.contentDocument.querySelector('iframe[src*="readjob"]')) || null;
            const subWin = (subFrame == null ? void 0 : subFrame.contentWindow) || null;
            try {
              if (subWin && subWin.parent && typeof subWin.parent.finishJob === "function" && subWin.data && subWin.data.jobid) {
                subWin.parent.finishJob(subWin.data.jobid);
              }
            } catch (e) {}
          }
          if (await confirmJobFinished(iframe, reporter.result, 15)) {
            log.insertLog("阅读任务点已完成");
            return TASK_RESULT.finished;
          }
          log.insertLog("阅读任务完成超时，请手动检查", "warning", 4);
          return TASK_RESULT.unconfirmed;
        } finally {
          reporter.restore();
        }
      } catch (e) {
        return TASK_RESULT.unconfirmed;
      }
    };
    const processBook = async (iframeWindow, iframe) => {
      const requiredSeconds = getBookRequiredSeconds(iframeWindow);
      const reporter = watchJobReport(iframeWindow);
      try {
        if (requiredSeconds > 0) {
          log.insertLog(`发现一个计时阅读任务点，需保持约 ${requiredSeconds} 秒，请勿切换页面`);
          if (await keepReading(requiredSeconds, iframe, reporter.result)) {
            log.insertLog("计时阅读任务点已完成");
            return TASK_RESULT.finished;
          }
          log.insertLog("计时阅读任务点未确认完成，请手动确认", "warning", 4);
          return TASK_RESULT.unconfirmed;
        }
        log.insertLog("发现一个电子书任务点，正在处理...");
        const topWindow = (typeof unsafeWindow !== "undefined" ? unsafeWindow.top : window.top) || window.top;
        if (typeof (topWindow == null ? void 0 : topWindow.onchangepage) !== "function" || typeof iframeWindow.getFrameAttr !== "function") {
          log.insertLog("该电子书任务点缺少可用的翻页入口，请手动完成后继续", "warning", 4);
          return TASK_RESULT.unconfirmed;
        }
        topWindow.onchangepage(iframeWindow.getFrameAttr("end"));
        if (await confirmJobFinished(iframe, reporter.result)) {
          log.insertLog("电子书任务点已完成");
          return TASK_RESULT.finished;
        }
        log.insertLog("电子书任务点未确认完成，请手动确认", "warning", 4);
        return TASK_RESULT.unconfirmed;
      } finally {
        reporter.restore();
      }
    };
    const processLive = async (iframe, iframeWindow) => {
      try {
        if (iframeWindow) {
          const bodyTxt = (iframeWindow.document.body == null ? void 0 : iframeWindow.document.body.innerText) || "";
          if (bodyTxt.includes("已完成") && /观看|任务/.test(bodyTxt)) {
            log.insertLog("直播任务已完成，自动继续", "success", 4);
            return TASK_RESULT.finished;
          }
        }
        if (iframeWindow && !iframeWindow.__xsLiveOpened) {
          try {
            const card = (iframeWindow == null ? void 0 : iframeWindow.document) == null ? void 0 : iframeWindow.document.querySelector(".liveHref");
            if (card) {
              card.click();
              iframeWindow.__xsLiveOpened = true;
              log.insertLog("已自动打开直播回放，观看时长达到90%后将自动完成并跳转", "info", 4);
            } else {
              log.insertLog("当前直播未开播或不可回放", "warning", 4);
              return TASK_RESULT.finished;
            }
          } catch (e) {
          }
        }
        const readLiveProgress = () => {
          try {
            const info = iframeWindow.document.querySelector(".LiveInfo2");
            const txt = (info == null ? void 0 : info.textContent) || "";
            const m = txt.match(/观看进度为\s*([\d.]+)\s*%/);
            return m ? parseFloat(m[1]) : null;
          } catch (e) {
            return null;
          }
        };
        let waited = 0;
        while (waited < 3 * 60 * 60 * 1000) {
          const parentEl = iframe.parentElement;
          if (parentEl && parentEl.className.includes("ans-job-finished")) {
            log.insertLog("直播任务已完成，自动继续", "success", 4);
            return TASK_RESULT.finished;
          }
          const pct = readLiveProgress();
          if (pct !== null && pct >= 90) {
            log.insertLog("直播观看进度已达90%，刷新页面确认任务完成", "success", 4);
            try {
              iframeWindow.top.location.reload();
            } catch (e) {
              location.reload();
            }
            return TASK_RESULT.finished;
          }
          await sleep(30);
          waited += 30;
          if (waited % 600 === 0) {
            log.insertLog(`直播挂机中，已等待 ${Math.round(waited / 60000)} 分钟（进度${pct === null ? "未知" : pct + "%"}），请保持回放页在前台播放`, "warning", 4);
          }
        }
        log.insertLog("直播任务超时未完成，请手动检查", "warning", 4);
        return TASK_RESULT.unconfirmed;
      } catch (e) {
        return TASK_RESULT.unconfirmed;
      }
    };
    const inFlightTasks = /* @__PURE__ */ new WeakMap();
    const processIframe = (iframe) => {
      const cached = inFlightTasks.get(iframe);
      if (cached && cached.src === iframe.src && iframe.isConnected) {
        return cached.task;
      }
      const task = runIframeTask(iframe).finally(() => {
        var _a;
        if (((_a = inFlightTasks.get(iframe)) == null ? void 0 : _a.task) === task) {
          inFlightTasks.delete(iframe);
        }
      });
      inFlightTasks.set(iframe, { src: iframe.src, task });
      return task;
    };
    const runIframeTask = async (iframe) => {
      var _a, _b;
      const iframeSrc = iframe.src;
      const iframeDocument = iframe.contentDocument;
      const iframeWindow = iframe.contentWindow;
      if (!iframeDocument || !iframeWindow) return TASK_RESULT.skipped;
      if (iframeSrc.includes("javascript:")) return TASK_RESULT.skipped;
      await waitIframeLoad(iframe);
      const parentClass = ((_a = iframe.parentElement) == null ? void 0 : _a.className) || "";
      if (parentClass.includes("ans-job-finished")) return TASK_RESULT.skipped;
      if (iframeSrc.includes("modules/read")) {
        return processRead(iframe, iframeWindow);
      }
      if (iframeSrc.includes("modules/live")) {
        return processLive(iframe, iframeWindow);
      }
      if (iframeSrc.includes("api/work")) {
        selectTextSearchLogic(iframeDocument, iframeWindow);
        await processWork(iframe, iframeDocument, iframeWindow);
        return TASK_RESULT.finished;
      }
      const ansJobIcon = (_b = iframe.parentElement) == null ? void 0 : _b.querySelector(".ans-job-icon");
      if (ansJobIcon) {
        if (iframeSrc.includes("video")) {
          return await processMedia("video", iframeDocument, iframe) || TASK_RESULT.finished;
        }
        if (iframeSrc.includes("audio")) {
          return await processMedia("audio", iframeDocument, iframe) || TASK_RESULT.finished;
        }
        if (["ppt", "doc", "pptx", "docx", "pdf"].some((type) => iframeSrc.includes("modules/" + type))) {
          return processDocument(iframeWindow, iframe);
        }
        if (["innerbook"].some((type) => iframeSrc.includes("modules/" + type))) {
          return processBook(iframeWindow, iframe);
        }
      }
      return TASK_RESULT.skipped;
    };
    init();
    setupFaceRecognitionWatcher();
    processIframeTask();
    setupInterceptor();
  };
  const cxLiveReplayLogic = () => {
    const log = useLogStore();
    log.insertLog("进入直播回放页，脚本正在控制视频播放..");
    let notified = false;
    const getVideo = () => document.querySelector("video");
    const ensurePlaying = async () => {
      const v = getVideo();
      if (!v) return;
      if (v.paused || v.ended) {
        v.muted = true;
        try {
          await v.play();
        } catch (e) {
        }
      }
    };
    const isWatchedEnough = () => {
      const v = getVideo();
      if (!v || typeof watchTime === "undefined") return false;
      return watchTime >= v.duration * 0.9;
    };
    const checkTask = async () => {
      await ensurePlaying();
      if (notified || !isWatchedEnough()) return;
      notified = true;
      log.insertLog("直播观看进度已达90%，正在返回课程页确认完成", "success", 4);
      try {
        const opener = window.opener;
        if (opener && !opener.closed) {
          try {
            opener.location.reload();
          } catch (e) {
          }
        }
      } catch (e) {
      }
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
        }
      }, 1500);
    };
    setInterval(checkTask, 5000);
    setTimeout(checkTask, 1500);
  };
  const submitCxHomework = async (log, setting, accuracy, pageWindow) => {
    const enabled = () => setting.config.basicConfig.autoSubmit.value && setting.config.basicConfig.autoAnswer.value;
    if (!enabled()) return false;
    if (hasPendingManualPick()) {
      log.insertLog("还有题目等待手动选择，已暂停自动提交；选完后再提交", "warning", 8);
      return false;
    }
    const rate = Number(accuracy);
    if (!Number.isFinite(rate) || rate < Number(setting.config.basicConfig.accuracy.value)) {
      log.insertLog("未达到自动提交阈值，保留作业答案", "warning"); return false;
    }
    if (typeof pageWindow.btnBlueSubmit !== "function" || typeof pageWindow.submitCheckTimes !== "function") {
      log.insertLog("自动提交已开启，此作业页的提交入口未识别，请手动确认", "warning"); return false;
    }
    await pageWindow.btnBlueSubmit();
    await sleep(setting.config.basicConfig.reqIntervalTime.value / 2);
    if (!enabled()) return false;
    await pageWindow.submitCheckTimes();
    log.insertLog("已执行提交，请以平台显示的结果为准"); return true;
  };
  const cxHomeworkLogic = async () => {
    const log = useLogStore();
    const questionStore = useQuestionStore();
    const setting = useSettingStore();
    log.insertLog(`进入新版作业页面，开始准备答题..`);
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.insertLog(
        `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
      );
      return;
    }
    questionStore.accuracy = -1;
    const accuracy = await new QuestionHandler$1("zy").init();
    questionStore.accuracy = accuracy;
    log.insertLog(
      `答题完毕,正确率为${accuracy}%,详情请前往<span class='module'>答题</span>模块查看..`
    );
    await submitCxHomework(log, setting, accuracy, typeof unsafeWindow !== "undefined" ? unsafeWindow : window);
  };
  const isPreviewDisabled = () => {
    var _a, _b;
    return (_b = (_a = document.querySelector(".mark_info")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.includes("不允许整卷预览");
  };
  const isVisible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };
  const getVisibleElement = (selector) => [...document.querySelectorAll(selector)].find(isVisible);
  const getNextQuestionBtn = () => getVisibleElement('[onclick="getTheNextQuestion(1)"]');
  const getSubmitConfirmBtn = () => {
    const selectors = [
      ".popBottom a[onclick*='answerDirectSubmit']",
      "a[onclick*='answerDirectSubmit']",
      "a.confirm[onclick*='finalSubmit']"
    ];
    for (const selector of selectors) {
      const confirmBtn = getVisibleElement(selector);
      if (confirmBtn) return confirmBtn;
    }
    return null;
  };
  const waitForSubmitConfirmBtn = async () => {
    for (let i = 0; i < 10; i++) {
      const confirmBtn = getSubmitConfirmBtn();
      if (confirmBtn) return confirmBtn;
      await sleep(0.5);
    }
    return null;
  };
  const submitCxExam = async (log, setting) => {
    if (!setting.config.examConfig.autoSubmit.value) {
      log.insertLog(
        "自动交卷未开启，请前往<span class='module'>设置</span>模块中更改",
        "warning",
        4
      );
      return;
    }
    log.insertLog("自动交卷已开启，正在提交试卷");
    await sleep(setting.config.basicConfig.reqIntervalTime.value);
    if (!setting.config.examConfig.autoSubmit.value || !setting.config.basicConfig.autoAnswer.value) return;
    const submitBtn = getVisibleElement("div.sub-button.fr a.completeBtn");
    if (!submitBtn) {
      log.insertLog("未找到交卷按钮，请手动交卷", "warning", 4);
      return;
    }
    submitBtn.click();
    const confirmBtn = await waitForSubmitConfirmBtn();
    if (confirmBtn && setting.config.examConfig.autoSubmit.value && setting.config.basicConfig.autoAnswer.value) {
      confirmBtn.click();
      log.insertLog("已确认提交试卷");
      return;
    }
    log.insertLog("未找到提交确认按钮，请手动确认交卷", "warning", 4);
  };
  const runSingleQuestionExamLogic = async (log, setting) => {
    log.insertLog(
      "当前考试不允许整卷预览，将按单题页面顺序处理，请勿手动切换题目",
      "warning",
      4
    );
    while (setting.config.basicConfig.autoAnswer.value) {
      await new QuestionHandler$1("ks").init();
      if (!setting.config.basicConfig.autoAnswer.value) return;
      const nextBtn = getNextQuestionBtn();
      if (!nextBtn) break;
      nextBtn.click();
      log.insertLog("已切换到下一题，继续处理..");
      await sleep(1);
    }
    if (setting.config.basicConfig.autoAnswer.value) await submitCxExam(log, setting);
  };
  const enterCxExamPreviewLogic = async () => {
    const log = useLogStore();
    const setting = useSettingStore();
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.insertLog(
        `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
      );
      return;
    }
    if (isPreviewDisabled()) {
      await runSingleQuestionExamLogic(log, setting);
      return;
    }
    log.insertLog("进入考试开始页，正在切换到整卷预览..");
    for (let i = 0; i < 10; i++) {
      if (!setting.config.basicConfig.autoAnswer.value) return;
      const previewBtn = document.querySelector("div.sub-button a");
      if (previewBtn) {
        previewBtn.click();
        log.insertLog("已点击整卷预览，正在进入答题页面..");
        return;
      }
      await sleep(0.5);
    }
    log.insertLog("未找到整卷预览按钮，请手动点击", "warning", 4);
  };
  const cxExamLogic = async () => {
    const log = useLogStore();
    const setting = useSettingStore();
    log.insertLog(`进入新版考试页面，开始准备答题..`);
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.insertLog(
        `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
      );
      return;
    }
    await new QuestionHandler$1("ks").init();
    await submitCxExam(log, setting);
  };
  const cxRoutes = {
    match: [
      { keyword: "zhibo.chaoxing.com", tab: "0", logic: cxLiveReplayLogic },
      { keyword: "/base", tab: "0" },
      { keyword: "/space/index", tab: "0" },
      // 积分课程
      { keyword: "/plaza/?courseId", tab: "0" },
      { keyword: "mycourse/stu?courseid", tab: "0" },
      { keyword: "/mycourse/studentstudy", tab: "1", logic: cxChapterLogic },
      { keyword: "/mooc2/work/dowork", tab: "1", logic: cxHomeworkLogic },
      { keyword: "/examcode/examnotes", tab: "0", log: "等待用户进入答题页面中.." },
      { keyword: "exam-ans/exam/test/reVersionTestStartNew", tab: "1", logic: enterCxExamPreviewLogic },
      { keyword: "mooc-ans/exam/test/reVersionTestStartNew", tab: "1", logic: enterCxExamPreviewLogic },
      { keyword: "/exam/test/reVersionTestStartNew", tab: "1", logic: enterCxExamPreviewLogic },
      { keyword: "/mooc2/exam/preview", tab: "1", logic: cxExamLogic },
      { keyword: "exam/preview", tab: "1", logic: cxExamLogic }
    ],
    defaultRoute: {
      show: true,
      tab: "0"
    }
  };
  class QuestionHandler2 extends BasicQuestionHandler {
    constructor(type, iframe) {
      super();
      __publicField(this, "type");
      __publicField(this, "AI_ALLOW_QUESTION_TYPE", ["单选题", "多选题", "判断题", "多项选择题", "X型选择题", "X型题", "不定项选择题", "不定项"]);
      __publicField(this, "init", async () => {
        var _that = this;
        this.questions = [];
        this.parseHtml();
        if (this.questions.length) {
          this.log.insertLog(
            `成功解析到${this.questions.length}个题目，开始答题..`
          );
          setTimeout(() => {
            autoSetTab(_that.setting, "2");
          }, 1e3);
          const { answerMode } = this.setting.config.basicConfig;
          const mode = answerMode.value;
          // 一屏一题：页面渲染的题目节点比接口题目少，切题后必须等新题渲染出来
          const nodeCount = this._document ? this._document.querySelectorAll(".subject_node").length : 0;
          const pagedMode = nodeCount > 0 && nodeCount < this.questions.length;
          for (const [index, question] of this.questions.entries()) {
            this.questionStore.currentQuestionIndex = index;
            let fillFailed = false;
            let handled = false;
            if (mode !== "ai") {
              const answerData = await getAccurateAnswer(question);
              if (answerData.code === 1) {
                if (answerData.data.multimatch) {
                  // 手动选择模式：题库有多道相似题，先不填，等用户自己挑
                  question.answer = { code: 0, answer: [], src: "pick", msg: "存在多道相似题，请先手动选择后再填写", candidates: answerData.data.candidates };
                  if (getManualWaitMode() === "skip") {
                    this.log.insertLog(`第${index + 1}题有${answerData.data.candidates.length}道相似题，已按设置跳过（本轮不自动提交）`, "warning", 6);
                    continue;
                  }
                  this.log.insertLog(`第${index + 1}题有${answerData.data.candidates.length}道相似题，已暂停，等待你选择后继续…`, "warning", 8);
                  const picked = await waitForManualPick(index);
                  if (!picked) {
                    this.log.insertLog(`第${index + 1}题等待选择超时，已跳过（本轮不自动提交）`, "warning", 6);
                    continue;
                  }
                  question.answer = Object.assign({}, question.answer, { code: 1, answer: picked });
                  this.log.insertLog(`第${index + 1}题已按你的选择填入，继续答题`, void 0, 4);
                  continue;
                }
                question.answer = {
                  code: 1,
                  answer: answerData.data.answer,
                  src: answerData.data.src
                };
                this.setting.userInfo.remainCount = formatLocalRemainCount(answerData.data.remainCount);
                saveAnswerRecord({
                  question,
                  answer: answerData.data.answer,
                  source: "accurate"
                });
                const errorStatus = !this.fillQuestion(question, index);
                if (errorStatus) {
                  question.answer.code = 0;
                  question.answer.msg = "答案拿到了但没点上去";
                  fillFailed = true;
                } else {
                  this.correctNum += 1;
                  handled = true;
                }
              } else if (mode === "questionBank" || answerData.code !== -1004) {
                question.answer = {
                  code: answerData.code,
                  answer: [],
                  msg: answerData.msg
                };
                handled = true;
              }
            }
            if (!handled) {
              if (this.AI_ALLOW_QUESTION_TYPE.includes(question.type)) {
                const aiQuestion = {
                  ...question,
                  type: this.questionType[question.type] || question.type
                };
                const aiAnswerData = await getAIAnswer(aiQuestion);
                if (aiAnswerData.code === 1) {
                  question.answer = {
                    code: 2,
                    answer: aiAnswerData.data.answer,
                    src: aiAnswerData.data.src || "ai"
                  };
                  this.setting.userInfo.remainCount = formatLocalRemainCount(aiAnswerData.data.remainCount);
                  saveAnswerRecord({
                    question,
                    answer: aiAnswerData.data.answer,
                    source: "ai"
                  });
                  const errorStatus = !this.fillQuestion(question, index);
                  if (errorStatus) {
                    question.answer.code = 0;
                    question.answer.msg = "答案拿到了但没点上去";
                    fillFailed = true;
                  } else {
                    this.correctNum += 1;
                  }
                } else if (!(question.answer && question.answer.code === 0 && Array.isArray(question.answer.answer) && question.answer.answer.length)) {
                  question.answer = {
                    code: aiAnswerData.code,
                    answer: [],
                    msg: aiAnswerData.msg
                  };
                } else if (!question.answer.msg) {
                  question.answer.msg = "答案拿到了但没点上去";
                }
              } else if (!(question.answer && question.answer.code === 0 && Array.isArray(question.answer.answer) && question.answer.answer.length)) {
                question.answer = {
                  code: -1,
                  answer: ["该题型不支持AI答题"]
                };
              }
            }
            if (!fillFailed && this.type == "zy") {
              // 新版页面可能没有 switch-btn-box，原来直接取 [0].innerText 会抛错并中断整个答题流程，
              // 表现就是「答完第一题就不动了」。这里改成：先按原结构找，找不到再按按钮文字找「下一题」。
              let nextBtn = this._document.querySelector(
                "div.switch-btn-box > button:nth-child(2) > span"
              );
              if (!nextBtn || (nextBtn.innerText || nextBtn.textContent || "").trim() !== "下一题") {
                nextBtn = Array.from(this._document.querySelectorAll("button, span, a")).find(
                  (el) => el.children.length === 0 && (el.textContent || "").trim() === "下一题"
                );
              }
              if (nextBtn && (nextBtn.innerText || nextBtn.textContent || "").trim() === "下一题") {
                const visibleNode = () => Array.from(this._document.querySelectorAll(".subject_node")).find((n) => {
                  const rect = n.getBoundingClientRect();
                  return rect.width > 0 && rect.height > 0;
                });
                const prevText = pagedMode ? ((visibleNode() || {}).innerText || "") : "";
                nextBtn.click();
                // 一屏一题：等新题真的渲染出来再处理下一道，否则还会点到上一题的选项上
                if (pagedMode) {
                  for (let wait = 0; wait < 20; wait++) {
                    await sleep(0.3);
                    const node = visibleNode();
                    if (node && node.innerText && node.innerText !== prevText) break;
                  }
                }
              }
            }
          }
          this.questionStore.currentQuestionIndex += 1;
        } else
          this.log.insertLog(
            "没有解析到题目，请检查是否进入正确页面...",
            "warning"
          );
        setTimeout(() => {
          autoSetTab(_that.setting, "1");
        }, 2e3);
        reportAnswerSummary("zhs-web", this.questions);
        return Promise.resolve(
          (this.correctNum / this.questions.length * 100).toFixed(1)
        );
      });
      __publicField(this, "parseHtml", () => {
        this.questionStore.currentQuestionIndex = 0;
        if (!this._document) return [];
        this.addQuestions(this.questionStore.questionList);
        this.questionStore.questionList = this.questions;
      });
      __publicField(this, "fillQuestion", (question, index) => {
        let isSelected = false;
        if (!this._window) return;
        // 智慧树新版作业页一屏只渲染一道题，按题目序号取节点会取空，导致第二题起答不上、
        // 只能刷新页面才恢复。节点总数少于题目总数时，改为取「当前屏幕上那道题」
        // （和 OCS 每轮重新抓当前题的做法一致），并按文本记住答过的题，避免重复点。
        const allNodes = Array.from(document.querySelectorAll(".subject_node"));
        const total = (this.questions && this.questions.length) || 0;
        const paged = total > 0 && allNodes.length > 0 && allNodes.length < total;
        let subjectNode = allNodes[index];
        if (paged) {
          const normNode = (n) => this.removeHtml(n.innerHTML).replace(/\s+/g, "").slice(0, 40);
          const done = this.__answeredNodes || (this.__answeredNodes = new Set());
          const visible = allNodes.filter((n) => {
            const rect = n.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          const pool = visible.length ? visible : allNodes;
          subjectNode = pool.find((n) => !done.has(normNode(n))) || pool[pool.length - 1];
          done.add(normNode(subjectNode));
        }
        if (!subjectNode) return false;
        const optionsDOM = subjectNode.querySelectorAll(".node_detail");
        const normalizeOptText = (str) => String(str ?? "").replace(/^[A-Z][.、．]\s*/i, "").replace(/\s+/g, "").replace(/[^\p{L}\p{N}√×]/gu, "").toLowerCase();
        if (question.type === "单选题" || question.type === "多选题" || /多选|X型|不定项/.test(question.type || "")) {
          // 先把命中的选项序号收齐再去点，避免同一选项被点两次（多选题再点一次会取消勾选，
          // 表现就是「多选题只答一个」）
          const pickedIdx = new Set();
          const answerList = normalizeChoiceAnswerList(question.answer.answer);
          answerList.forEach((answer) => {
            // 字母答案映射：A / ABD / A,B,D → 按选项序号勾选
            const letterText = String(answer || "").trim();
            let letters = [];
            const prefixed = letterText.match(/^([A-Za-z])\s*[.、．)）:：]\s*(\S[\s\S]*)$/);
            if (prefixed) {
              const pIdx = prefixed[1].toUpperCase().charCodeAt(0) - 65;
              const pOpt = optionsDOM[pIdx];
              const pOptText = pOpt ? normalizeOptText(this.removeHtml(pOpt.innerHTML)) : "";
              const pBody = normalizeOptText(prefixed[2]);
              // 字母与选项正文对得上才按字母点，防止选项顺序被打乱时点错
              if (!pOptText || !pBody || pOptText.includes(pBody) || pBody.includes(pOptText)) letters = [prefixed[1].toUpperCase()];
            } else if (/^[A-Za-z]$/.test(letterText)) letters = [letterText.toUpperCase()];
            else if (/^[A-Za-z]{2,12}$/.test(letterText)) letters = letterText.toUpperCase().split("");
            else if (/^[A-Z](?:[\s,，、;；|]+[A-Z])+$/i.test(letterText)) letters = letterText.toUpperCase().split(/[\s,，、;；|]+/).filter(Boolean);
            optionsDOM.forEach((optionDOM, optIdx) => {
              if (letters.length) {
                if (letters.includes(String.fromCharCode(65 + optIdx))) pickedIdx.add(optIdx);
                return;
              }
              const optionText = this.removeHtml(optionDOM.innerHTML);
              const nAnswer = normalizeOptText(answer);
              const nOption = normalizeOptText(optionText);
              if (answer == optionText || this.removeAllTags(answer) == this.removeAllTags(optionText) || (nAnswer.length >= 2 && nOption && nOption.includes(nAnswer))) {
                pickedIdx.add(optIdx);
              } else if (imgSrcsMatch(collectImgSrcs(answer), collectImgSrcs(optionDOM).concat(collectImgSrcs(optionText)))) {
                pickedIdx.add(optIdx);
              }
            });
          });
          Array.from(pickedIdx).sort((a, b) => a - b).forEach((optIdx) => {
            const optionDOM = optionsDOM[optIdx];
            if (!optionDOM) return;
            isSelected = true;
            optionDOM.click();
          });
        } else if (question.type === "判断题") {
          let answer = "对";
          if (question.answer.answer[0].match(
            /(^|,)(正确|是|对|√|T|ri|right|true)(,|$)/
          )) {
            answer = "对";
          } else if (question.answer.answer[0].match(
            /(^|,)(错误|否|错|×|F|wr|wrong|false)(,|$)/
          )) {
            answer = "错";
          }
          optionsDOM.forEach((optionDOM) => {
            if (answer == this.removeHtml(optionDOM.innerHTML)) {
              isSelected = true;
              optionDOM.click();
            }
          });
        } else ;
        return isSelected;
      });
      __publicField(this, "extractOptions", (questionOptions, questionType) => {
        const optionsObject = {};
        const optionTexts = [];
        if (!questionOptions) return [optionsObject, optionTexts];
        questionOptions.forEach((questionOption) => {
          const optionTextContent = this.removeHtml(questionOption.content);
          optionsObject[optionTextContent] = questionOption.content;
          if (questionType !== "判断题") optionTexts.push(optionTextContent);
        });
        return [optionsObject, optionTexts];
      });
      __publicField(this, "addQuestions", (questions) => {
        questions.forEach((question) => {
          const questionTitle = this.removeHtml(question.name);
          const rawType = question && question.questionType;
          const apiTypeText = rawType && typeof rawType === "object" ? (rawType.name || rawType.code || "") : rawType;
          let questionType = normalizeQuestionTypeName(apiTypeText);
          const [optionsObject, optionTexts] = this.extractOptions(
            question.questionOptions,
            questionType
          );
          const subjectNodes = (this._document && this._document.querySelectorAll)
            ? this._document.querySelectorAll(".subject_node")
            : [];
          const subjectNode = subjectNodes[this.questions.length] || this._document || null;
          // 接口给的题型为空或写成单选、但页面选项是复选框时按多选题处理，避免只填一个选项
          if ((!questionType || questionType === "单选题") && detectMultiChoiceDom(subjectNode)) questionType = "多选题";
          this.questions.push({
            element: subjectNode,
            type: questionType,
            title: questionTitle,
            optionsText: optionTexts,
            options: optionsObject,
            answer: { code: -1, answer: [] },
            workType: "zhs",
            refer: this._window.location.href,
            id: "zhs"
          });
        });
      });
      this.type = type;
      if (iframe) {
        this._document = iframe.contentDocument;
        this._window = iframe.contentWindow;
      }
    }
  }
  const ANSWER_SHEET_EVENT = "ABC_ZHS_ANSWER_SHEET";
  const ANSWER_SHEET_URL = "getAnswerSheetInformation";
  const ANSWER_SHEET_KEY = Symbol.for("__xsASKey");
  const saveAnswerSheetPayload = (payload) => {
    const pageWindow = _unsafeWindow || window;
    pageWindow[ANSWER_SHEET_KEY] = payload;
    pageWindow.dispatchEvent(new CustomEvent(ANSWER_SHEET_EVENT, { detail: payload }));
  };
  const parseResponseText = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };
  const getRequestUrl = (input) => {
    if (typeof input === "string") return input;
    if (input == null ? void 0 : input.url) return input.url;
    return input ? String(input) : "";
  };
  const installAnswerSheetHook = () => {
    const pageWindow = _unsafeWindow || window;
    const hookFlag = Symbol.for("__xsAsHooked");
    if (pageWindow[hookFlag]) return;
    pageWindow[hookFlag] = true;
    const originalFetch = pageWindow.fetch;
    if (typeof originalFetch === "function") {
      pageWindow.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const requestUrl = getRequestUrl(args[0]);
        if (requestUrl.includes(ANSWER_SHEET_URL)) {
          response.clone().text().then((text) => {
            saveAnswerSheetPayload(parseResponseText(text));
          }).catch(() => {
          });
        }
        return response;
      };
      try {
        const fetchToString = originalFetch.toString.bind(originalFetch);
        Object.defineProperty(pageWindow.fetch, "toString", {
          value: fetchToString,
          writable: true, configurable: true
        });
      } catch (_) {}
    }
    const OriginalXHR = pageWindow.XMLHttpRequest;
    if (typeof OriginalXHR === "function" && !OriginalXHR[hookFlag]) {
      const originalOpen = OriginalXHR.prototype.open;
      const originalSend = OriginalXHR.prototype.send;
      const reqUrlKey = Symbol.for("__xsReqUrl");
      OriginalXHR[hookFlag] = true;
      OriginalXHR.prototype.open = function(method, url2, ...rest) {
        this[reqUrlKey] = url2 || "";
        return originalOpen.call(this, method, url2, ...rest);
      };
      try {
        const nativeOpenStr = originalOpen.toString.bind(originalOpen);
        Object.defineProperty(OriginalXHR.prototype.open, "toString", {
          value: nativeOpenStr, writable: true, configurable: true
        });
      } catch (_) {}
      OriginalXHR.prototype.send = function(...args) {
        this.addEventListener("load", function() {
          const requestUrl = getRequestUrl(this.responseURL || this[reqUrlKey]);
          if (requestUrl.includes(ANSWER_SHEET_URL)) {
            saveAnswerSheetPayload(parseResponseText(this.responseText));
          }
        });
        return originalSend.apply(this, args);
      };
      try {
        const sendToString = originalSend.toString.bind(originalSend);
        Object.defineProperty(OriginalXHR.prototype.send, "toString", {
          value: sendToString,
          writable: true, configurable: true
        });
      } catch (_) {}
    }
  };
  const fetchHook = (url2, callback) => {
    const questionStore = useQuestionStore();
    function addXMLRequestCallback(callback2) {
      var oldSend, i;
      if (XMLHttpRequest.callbacks) {
        XMLHttpRequest.callbacks.push(callback2);
      } else {
        XMLHttpRequest.callbacks = [callback2];
        oldSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function() {
          for (i = 0; i < XMLHttpRequest.callbacks.length; i++) {
            XMLHttpRequest.callbacks[i](this);
          }
          oldSend.apply(this, arguments);
        };
      }
    }
    addXMLRequestCallback(function(xhr) {
      xhr.addEventListener("load", function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
          if (xhr.responseURL.includes(url2)) {
            const keywords = ["doExam", "doHomework"];
            if (keywords.some((keyword) => xhr.responseURL.includes(keyword))) {
              let questions = [];
              const questionsParts = JSON.parse(xhr.response).rt.examBase.workExamParts;
              questionsParts.forEach((part) => {
                console.log("part", part.questionDtos);
                questions = questions.concat(part.questionDtos);
              });
              questionStore.questionList = questions;
            }
            callback();
          }
        }
      });
    });
  };
  const autoAnswerLogic = async () => {
    const log = useLogStore();
    const questionStore = useQuestionStore();
    log.insertLog("进入作业页面，脚本开始工作中..");
    questionStore.accuracy = -1;
    const handleFetchHook = async () => {
      const accuracy = await new QuestionHandler2("zy").init();
      questionStore.accuracy = accuracy;
      log.insertLog(`答题完毕,正确率为${accuracy}%,详情请前往<span class='module'>答题</span>模块查看..`);
    };
    ["doHomework", "doExam"].forEach((type) => {
      fetchHook(type, () => handleFetchHook());
    });
  };
  // 智慧树课中弹题：三种页面（旧版视频页、AI 智慧课、新共享课）共用同一套弹窗结构和 Vue 数据
  const zhsPageDocument = () => (_unsafeWindow && _unsafeWindow.document) || document;
  const zhsWaitForYidun = async (log) => {
    if (!document.querySelector(".yidun_popup")) return true;
    log.insertLog("检测到验证码，请完成验证后继续..", "warning");
    const startTime = Date.now();
    while (document.querySelector(".yidun_popup")) {
      if (Date.now() - startTime > 5 * 60 * 1e3) {
        log.insertLog("等待验证码完成超时，请手动刷新页面后继续..", "warning");
        return false;
      }
      await sleep(1);
    }
    log.insertLog("验证码已完成，继续学习..");
    return true;
  };
  const zhsGetTopicVm = () => {
    var _a, _b;
    const dialog = zhsPageDocument().querySelector("#playTopic-dialog");
    return ((_b = (_a = dialog == null ? void 0 : dialog.__vue__) == null ? void 0 : _a.$parent) == null ? void 0 : _b.$parent) || null;
  };
  const zhsHasTopicDialog = () => {
    const dialog = document.querySelector("#playTopic-dialog");
    if (!dialog) return false;
    const vm = zhsGetTopicVm();
    if (vm && vm.testDialog) return true;
    // 拿不到 Vue 实例时看弹窗是否真的显示着
    const rect = dialog.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  // 直接从页面 Vue 实例里读答案（答案本来就下发在前端数据里，不用猜）
  const zhsAnswerTopicByVm = async (log) => {
    var _a, _b, _c;
    const vm = zhsGetTopicVm();
    if (!(vm == null ? void 0 : vm.testDialog)) return false;
    const question = (_b = (_a = vm.topicInfo) == null ? void 0 : _a.lessonTestQuestionUseInterfaceDtos) == null ? void 0 : _b[0];
    const options = (_c = question == null ? void 0 : question.testQuestion) == null ? void 0 : _c.questionOptions;
    const answers = question == null ? void 0 : question.answerUs;
    log.insertLog("检测到弹题测验，尝试自动作答..");
    const captchaPassed = await zhsWaitForYidun(log);
    if (!captchaPassed) return false;
    let count = 0;
    if (options && answers && typeof vm.topicClickQot === "function") {
      for (const option of options) {
        if (answers.indexOf(option.sortUs) === -1) continue;
        await sleep(0.8);
        vm.topicClickQot(option);
        count++;
      }
    }
    await sleep(Math.max(2, 5 - count * 0.8));
    vm.testDialog = false;
    if (count) {
      log.insertLog(`弹题已自动作答完成（${count}题），继续播放视频`);
    } else {
      log.insertLog("未读取到弹题答案，已关闭弹窗", "warning");
    }
    return true;
  };
  // 读不到 Vue 数据时的兜底：逐页随机点一个选项再关窗，至少能把视频放下去
  const zhsHandleTopicDialogByDom = async (log) => {
    var _a, _b;
    const pages = Array.from(document.querySelectorAll("#playTopic-dialog .el-pager .number"));
    if (!pages.length) return false;
    log.insertLog("检测到弹题测验，正在处理..");
    try {
      for (const page of pages) {
        if (!page.isConnected) continue;
        if (!page.classList.contains("active")) {
          page.click();
          await sleep(0.5);
        }
        const options = Array.from(document.querySelectorAll("#playTopic-dialog ul .topic-item"));
        if (!options.length) continue;
        const captchaPassed = await zhsWaitForYidun(log);
        if (!captchaPassed) return false;
        const index = Math.floor(Math.random() * options.length);
        await sleep(1);
        const target = document.querySelector(
          `#playTopic-dialog .topic .radio ul > li:nth-child(${index + 1})`
        );
        (_a = target || options[index]) == null ? void 0 : _a.click();
        await sleep(1);
      }
      await sleep(1);
      (_b = document.querySelector("#playTopic-dialog .close-btn, #playTopic-dialog .btn")) == null ? void 0 : _b.click();
      log.insertLog("弹题测验已关闭");
      return true;
    } catch (error) {
      log.insertLog(`弹题测验处理失败: ${error.message || "未知错误"}`, "warning");
      return false;
    }
  };
  const videoStudyLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let pollIntervalId = null;
    let isAnsweringQuiz = false;
    const injectQuizHelper = () => {
      const script = document.createElement("script");
      script.textContent = `
      (function() {
        window.addEventListener("message", function(e) {
          if (!e.data || e.data.type !== "ABC_ZHS_QUIZ_ANSWER") return;
          try {
            var dialog = document.querySelector("#playTopic-dialog");
            if (!dialog || !dialog.__vue__) {
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false }, "*");
              return;
            }
            var vm = dialog.__vue__.$parent.$parent;
            if (!vm || !vm.topicInfo) {
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false }, "*");
              return;
            }
            var dto = vm.topicInfo.lessonTestQuestionUseInterfaceDtos;
            if (!dto || !dto[0]) {
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false }, "*");
              return;
            }
            var options = dto[0].testQuestion.questionOptions;
            var answers = dto[0].answerUs;
            if (!options || !answers) {
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false }, "*");
              return;
            }
            var count = 0;
            options.forEach(function(opt, i) {
              if (answers.indexOf(opt.sortUs) !== -1) {
                setTimeout(function() { vm.topicClickQot(options[i]); }, 800 * count);
                count++;
              }
            });
            var closeDelay = Math.max(count * 800 + 2000, 5000);
            setTimeout(function() {
              vm.testDialog = false;
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: true, count: count }, "*");
            }, closeDelay);
          } catch (err) {
            window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false, error: err.message }, "*");
          }
        });
      })();
    `;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    };
    const clearOverlays = () => {
      var _a, _b;
      (_a = document.querySelector(".v-modal")) == null ? void 0 : _a.remove();
      (_b = document.querySelector(".brush-warning")) == null ? void 0 : _b.remove();
    };
    const isChapterCompleted = (el) => !!(el == null ? void 0 : el.querySelector(".time_icofinish"));
    const waitForVideo = (timeout = 15e3) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const video = document.querySelector("video");
          if (video) {
            clearInterval(check);
            resolve(video);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("等待视频元素超时"));
          }
        }, 500);
      });
    };
    const clickEl = (el) => {
      if (el) {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    };
    const getCurrentChapterTitle = () => {
      var _a, _b;
      return ((_b = (_a = document.querySelector("li.video.current_play .catalogue_title")) == null ? void 0 : _a.innerText) == null ? void 0 : _b.trim()) || "未知小节";
    };
    const getChapterLabel = (chapterEl) => {
      var _a, _b, _c, _d;
      const title = ((_b = (_a = chapterEl.querySelector(".catalogue_title")) == null ? void 0 : _a.innerText) == null ? void 0 : _b.trim()) || "";
      const num = ((_d = (_c = chapterEl.querySelector(".hour")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "";
      return num ? `${num} ${title}` : title;
    };
    const playVideo = () => {
      clearOverlays();
      videoEl = document.querySelector("#vjs_container_html5_api");
      if (!videoEl) return;
      videoEl.muted = true;
      videoEl.play().catch(() => {
      });
    };
    const startVideo = () => {
      playVideo();
      if (!videoEl) return;
      videoEl.addEventListener("play", () => {
        const title = getCurrentChapterTitle();
        log.insertLog(`${title} - 视频开始播放`);
        hookVedio(videoEl, 1.5);
        log.insertLog(`已设置播放倍速: 1.5x`);
      }, { once: true });
      videoEl.addEventListener("playing", () => {
        clearOverlays();
      });
      videoEl.addEventListener("pause", () => {
        if (videoEl.ended || isAnsweringQuiz) return;
        const dialog = document.querySelector("#playTopic-dialog");
        if (!dialog) {
          log.insertLog("视频被暂停，将在下次轮询中恢复..");
        }
      });
      videoEl.addEventListener("ended", () => {
        log.insertLog("当前视频播放完毕");
        nextTask();
      });
    };
    const handlePopupQuiz = async () => {
      var _a;
      if (isAnsweringQuiz) return;
      isAnsweringQuiz = true;
      await sleep(1);
      const dialog = document.querySelector("#playTopic-dialog");
      if (!dialog) {
        isAnsweringQuiz = false;
        return;
      }
      const headerText = ((_a = dialog.querySelector(".el-dialog__header h4")) == null ? void 0 : _a.innerText) || "";
      if (!headerText.includes("给你出题啦") && !headerText.includes("弹题测验")) {
        isAnsweringQuiz = false;
        return;
      }
      const radioEl = dialog.querySelector(".radio");
      const topicTitle = radioEl == null ? void 0 : radioEl.querySelector(".topic-title");
      if (topicTitle && (topicTitle.querySelector(".right") || topicTitle.querySelector(".error"))) {
        log.insertLog("弹题已作答过，关闭弹窗..");
        await sleep(2);
        closeQuizDialog();
        isAnsweringQuiz = false;
        await sleep(1);
        playVideo();
        return;
      }
      log.insertLog("检测到弹题测验，尝试自动作答..");
      // 弹题前可能弹验证码，等用户过验证再继续，别硬点
      const captchaPassed = await zhsWaitForYidun(log);
      if (!captchaPassed) {
        isAnsweringQuiz = false;
        return;
      }
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          log.insertLog("弹题自动作答超时，关闭弹窗..", "warning");
          closeQuizDialog();
          isAnsweringQuiz = false;
          setTimeout(playVideo, 1e3);
          resolve();
        }, 2e4);
        const handler = async (e) => {
          var _a2;
          if (((_a2 = e.data) == null ? void 0 : _a2.type) !== "ABC_ZHS_QUIZ_RESULT") return;
          clearTimeout(timeout);
          window.removeEventListener("message", handler);
          if (e.data.success) {
            log.insertLog(`弹题已自动作答完成（${e.data.count}题），继续播放视频`);
          } else {
            log.insertLog(
              `弹题自动作答失败${e.data.error ? ": " + e.data.error : ""}，改用页面兜底作答..`,
              "warning"
            );
            // 读不到页面数据时逐页随机点一个，保证视频不被弹窗卡住
            const domHandled = await zhsHandleTopicDialogByDom(log);
            if (!domHandled) closeQuizDialog();
          }
          isAnsweringQuiz = false;
          setTimeout(playVideo, 1e3);
          resolve();
        };
        window.addEventListener("message", handler);
        window.postMessage({ type: "ABC_ZHS_QUIZ_ANSWER" }, "*");
      });
    };
    const closeQuizDialog = () => {
      const dialog = document.querySelector("#playTopic-dialog");
      const closeBtn = dialog == null ? void 0 : dialog.querySelector(".el-dialog__headerbtn");
      clickEl(closeBtn);
    };
    const handleMidwayDialogs = () => {
      const dialogs = document.querySelectorAll(".el-dialog");
      const visibleDialog = Array.from(dialogs).find(
        (d) => {
          var _a;
          return ((_a = d == null ? void 0 : d.parentElement) == null ? void 0 : _a.style.display) !== "none";
        }
      );
      if (!visibleDialog) {
        clearOverlays();
        return;
      }
      if (visibleDialog.ariaLabel === "温馨提示") {
        const btn = visibleDialog.querySelector(".el-button.btn");
        if ((btn == null ? void 0 : btn.textContent) === "我知道了") {
          clickEl(btn);
          log.insertLog("已关闭「温馨提示」弹窗");
          setTimeout(playVideo, 500);
          return;
        }
      }
      if (visibleDialog.ariaLabel === "弹题测验") {
        handlePopupQuiz();
      }
    };
    const findNextChapter = () => {
      const allChapters = Array.from(document.querySelectorAll("li.video"));
      const currentChapter = document.querySelector("li.video.current_play");
      if (!currentChapter || allChapters.length === 0) return null;
      const currentIndex = allChapters.indexOf(currentChapter);
      const ordered = [
        ...allChapters.slice(currentIndex + 1),
        ...allChapters.slice(0, currentIndex)
      ];
      return ordered.find((el) => !isChapterCompleted(el));
    };
    const nextTask = async () => {
      var _a;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      const currentTitle = ((_a = document.querySelector("li.video.current_play .catalogue_title")) == null ? void 0 : _a.innerText) || "当前章节";
      log.insertLog(`「${currentTitle}」已完成`);
      const next = findNextChapter();
      if (next) {
        const nextLabel = getChapterLabel(next);
        log.insertLog(`跳转到: ${nextLabel}`);
        clickEl(next);
        await sleep(5);
        initVideoTask();
      } else {
        reportCourseResult("done", "视频章节全部完成");
        log.insertLog("所有章节视频已完成！");
        clearPollInterval();
      }
    };
    const startPolling = () => {
      let lastHour = null;
      pollIntervalId = setInterval(() => {
        var _a;
        const currentEl = document.querySelector(".video.current_play");
        if (!currentEl) return;
        const hour = (_a = currentEl.querySelector(".hour")) == null ? void 0 : _a.textContent;
        if (hour && lastHour !== null && hour !== lastHour) {
          lastHour = hour;
          setTimeout(startVideo, 3e3);
        }
        if (hour) lastHour = hour;
        if (isChapterCompleted(currentEl)) {
          nextTask();
          return;
        }
        const video = document.querySelector("#vjs_container_html5_api");
        if (isAnsweringQuiz) return;
        // 弹题只要出现就处理，不再依赖「视频刚好停在暂停状态」这个条件
        if (zhsHasTopicDialog()) {
          handlePopupQuiz();
          return;
        }
        if ((video == null ? void 0 : video.paused) && !video.ended) {
          handleMidwayDialogs();
        }
      }, 2e3);
    };
    const clearPollInterval = () => {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
      }
    };
    const initVideoTask = async () => {
      try {
        await waitForVideo();
        startVideo();
      } catch (e) {
        log.insertLog(`${e.message}，尝试跳转下一节..`, "warning");
        nextTask();
      }
    };
    const start = async () => {
      var _a;
      log.insertLog("进入智慧树视频学习页面，脚本开始工作..");
      autoSetTab(setting, "1");
      injectQuizHelper();
      await sleep(5);
      const noteClose = document.querySelector(".dialog-read .iconguanbi");
      if (noteClose) {
        const parent = (_a = noteClose.closest) == null ? void 0 : _a.call(noteClose, ".dialog-read");
        if (parent && getComputedStyle(parent).display !== "none") {
          clickEl(noteClose);
          log.insertLog("已关闭阅读提示弹窗");
        }
      }
      handleMidwayDialogs();
      startPolling();
      initVideoTask();
    };
    start();
  };
  const learnPageLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let currentResourceIndex = 0;
    let resourceItems = [];
    const waitFor = (selector, timeout = 1e4) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const el = document.querySelector(selector);
          if (el) {
            clearInterval(check);
            resolve(el);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error(`等待元素 ${selector} 超时`));
          }
        }, 300);
      });
    };
    const clickEl = (el) => {
      if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };
    const RESOURCE_TYPES = { VIDEO: "video", BOOK: "book", PPT: "other" };
    const getResourceType = (resourceEl) => {
      const iconBox = resourceEl == null ? void 0 : resourceEl.querySelector(".icon-box");
      if (!iconBox) return "unknown";
      const classes = iconBox.className;
      if (classes.includes("video")) return RESOURCE_TYPES.VIDEO;
      if (classes.includes("book")) return RESOURCE_TYPES.BOOK;
      if (classes.includes("other") || classes.includes("ppt")) return RESOURCE_TYPES.PPT;
      return "unknown";
    };
    const getAllResourceEls = () => Array.from(document.querySelectorAll(".resources-list .resources-item"));
    const getCurrentResourceEl = () => {
      const items = getAllResourceEls();
      const idx = resourceItems[currentResourceIndex];
      return items[idx] ?? null;
    };
    const detectCurrentResourceType = () => {
      const el = getCurrentResourceEl();
      el ? getResourceType(el) : "unknown";
    };
    const onResourceComplete = async () => {
      currentResourceIndex++;
      detectCurrentResourceType();
      await processNextResource();
    };
    const processVideo = async () => {
      log.insertLog("发现视频资源，正在播放..");
      try {
        await sleep(5);
        videoEl = document.querySelector(".preview-section .video-player-wrapper video") || document.querySelector(".preview-section video");
        if (!videoEl) {
          log.insertLog("未找到视频元素，跳过..", "warning");
          onResourceComplete();
          return;
        }
        videoEl.muted = true;
        videoEl.play().catch(() => {
        });
        const userRate = Number(setting.config.basicConfig.videoPlayrate.value) || 1;
        const rates = [userRate, 2, 1.75, 1.5, 1.25];
        for (const rate of rates) {
          try {
            videoEl.playbackRate = rate;
            if (videoEl.playbackRate === rate) {
              log.insertLog(`已设置播放倍速: ${rate}x`);
              break;
            }
          } catch {
          }
        }
        videoEl.addEventListener("pause", () => {
          if (videoEl.ended) return;
          if (videoEl.duration > 0 && videoEl.duration - videoEl.currentTime <= 1) {
            log.insertLog("视频播放完毕");
            onResourceComplete();
            return;
          }
          setTimeout(() => {
            if (videoEl && !videoEl.ended && videoEl.paused) {
              videoEl.play().catch(() => {
              });
            }
          }, 2e3);
        });
        videoEl.addEventListener("ended", () => {
          log.insertLog("视频播放完毕");
          onResourceComplete();
        }, { once: true });
      } catch (e) {
        log.insertLog(`视频处理出错: ${e.message}`, "warning");
        onResourceComplete();
      }
    };
    const processPpt = async () => {
      var _a;
      log.insertLog("发现PPT资源，正在自动翻页..");
      try {
        await sleep(2);
        const totalText = (_a = document.querySelector(
          ".preview-section .ppt-preview-container .page-total"
        )) == null ? void 0 : _a.innerText;
        const totalPages = parseInt(totalText, 10) || 0;
        if (!totalPages) {
          log.insertLog("无法获取PPT页数，跳过..", "warning");
          onResourceComplete();
          return;
        }
        const containers = document.querySelectorAll(
          ".catalogue-container .div-img-container"
        );
        let currentPage = Array.from(containers).findIndex((c) => c.classList.contains("choose")) + 1 || 1;
        log.insertLog(`PPT共 ${totalPages} 页，从第 ${currentPage} 页开始`);
        const flipPage = async (page) => {
          if (page >= totalPages) {
            log.insertLog("PPT翻页完成");
            onResourceComplete();
            return;
          }
          const nextBtn = document.querySelector(
            ".preview-section .ppt-preview-container .next-page-btn"
          );
          clickEl(nextBtn);
          await sleep(5);
          flipPage(page + 1);
        };
        flipPage(currentPage);
      } catch (e) {
        log.insertLog(`PPT处理出错: ${e.message}`, "warning");
        onResourceComplete();
      }
    };
    const processBook = async () => {
      log.insertLog("发现电子书资源，正在自动阅读..");
      try {
        await waitFor(".preview-section .book-mark .book-content");
        await waitFor(".preview-section .book-mark .canvas-wrapper");
        const pages = document.querySelectorAll(
          ".preview-section .book-mark .canvas-wrapper"
        );
        if (!pages.length) {
          log.insertLog("未找到电子书页面，跳过..", "warning");
          onResourceComplete();
          return;
        }
        const firstRect = pages[0].getBoundingClientRect();
        const marginTop = parseInt(getComputedStyle(pages[0]).marginTop, 10) || 0;
        const pageHeight = Math.max(firstRect.height + marginTop, 100);
        const container = document.querySelector(
          ".preview-section .book-mark .book-container"
        );
        if (!container) {
          log.insertLog("未找到电子书滚动容器，跳过..", "warning");
          onResourceComplete();
          return;
        }
        const scrollStep = async () => {
          const target = Math.min(
            container.scrollTop + pageHeight,
            container.scrollHeight - container.clientHeight
          );
          container.scrollTo({ top: target, behavior: "smooth" });
          await sleep(1.5);
          if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
            log.insertLog("电子书阅读完成");
            onResourceComplete();
          } else {
            scrollStep();
          }
        };
        scrollStep();
      } catch (e) {
        log.insertLog(`电子书处理出错: ${e.message}`, "warning");
        onResourceComplete();
      }
    };
    const processNextResource = async () => {
      if (currentResourceIndex >= resourceItems.length) {
        log.insertLog("当前小节所有资源已完成");
        nextSection();
        return;
      }
      const el = getCurrentResourceEl();
      if (!el) {
        log.insertLog("未找到资源元素，跳过..", "warning");
        onResourceComplete();
        return;
      }
      if (currentResourceIndex > 0) {
        const clickTarget = el.querySelector(".basic-info-video-card-container");
        clickEl(clickTarget || el);
        await sleep(3);
      }
      const type = getResourceType(el);
      log.insertLog(
        `处理资源 [${currentResourceIndex + 1}/${resourceItems.length}] 类型: ${type}`
      );
      switch (type) {
        case RESOURCE_TYPES.VIDEO:
          processVideo();
          break;
        case RESOURCE_TYPES.BOOK:
          processBook();
          break;
        case RESOURCE_TYPES.PPT:
          processPpt();
          break;
        default:
          log.insertLog(`不支持的资源类型 (${type})，跳过`);
          onResourceComplete();
      }
    };
    const nextSection = async () => {
      var _a, _b, _c, _d;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      const sections = document.querySelectorAll(".section-item-collapse-info");
      const active = document.querySelector(".section-item-collapse-info.active");
      if (!active) {
        log.insertLog("未找到当前活跃章节");
        return;
      }
      const currentTitle = ((_b = (_a = active.querySelector(".section-item-collapse-title")) == null ? void 0 : _a.innerText) == null ? void 0 : _b.trim()) || "当前章节";
      log.insertLog(`「${currentTitle}」所有资源已完成`);
      const arr = Array.from(sections);
      const nextIdx = arr.indexOf(active) + 1;
      if (nextIdx < arr.length) {
        const next = arr[nextIdx];
        const nextTitle = ((_d = (_c = next.querySelector(".section-item-collapse-title")) == null ? void 0 : _c.innerText) == null ? void 0 : _d.trim()) || "下一节";
        log.insertLog(`跳转到: ${nextTitle}`);
        clickEl(next);
        await sleep(5);
        initResources();
      } else {
        reportCourseResult("done", "学习资源全部完成");
        log.insertLog("所有章节已完成！");
      }
    };
    const initResources = async () => {
      currentResourceIndex = 0;
      resourceItems = [];
      videoEl = null;
      try {
        await waitFor(".resources-detail-card .resources-list .resources-item", 15e3);
        const items = getAllResourceEls();
        if (!items.length) {
          log.insertLog("未找到学习资源，尝试跳转下一节..", "warning");
          nextSection();
          return;
        }
        resourceItems = items.map((_, i) => i);
        log.insertLog(`发现 ${resourceItems.length} 个学习资源`);
        detectCurrentResourceType();
        await processNextResource();
      } catch (e) {
        log.insertLog(`初始化资源列表失败: ${e.message}`, "warning");
        nextSection();
      }
    };
    const watchUrlChange = () => {
      let prevUrl = location.href;
      setInterval(() => {
        if (location.href === prevUrl) return;
        const wasLearnPage = prevUrl.includes("/learnPage");
        prevUrl = location.href;
        if (location.href.includes("/learnPage") && !wasLearnPage) {
          log.insertLog("检测到页面切换，重新初始化..");
          setTimeout(initResources, 3e3);
        }
      }, 1500);
    };
    const start = async () => {
      log.insertLog("进入智慧树新版学习页面，脚本开始工作..");
      autoSetTab(setting, "1");
      await sleep(6);
      const noteDialog = document.querySelector(".read-note-dialog");
      if (noteDialog && getComputedStyle(noteDialog).display !== "none") {
        const btn = noteDialog.querySelector("button");
        if (btn) {
          clickEl(btn);
          log.insertLog("已关闭阅读提示弹窗");
        }
      }
      try {
        await waitFor(".preview-content", 15e3);
      } catch {
        log.insertLog("等待页面内容加载超时..", "warning");
      }
      watchUrlChange();
      initResources();
    };
    start();
  };
  const aiSmartLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let currentResourceIndex = 0;
    let resourceItems = [];
    let currentResourceType = "";
    let isStopped = false;
    let quizTimer = null;
    let isAnsweringQuiz = false;
    let chapterObserver = null;
    let resourceObserver = null;
    const waitFor = (selector, timeout = 1e4) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const el = document.querySelector(selector);
          if (el) {
            clearInterval(check);
            resolve(el);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error(`等待元素 ${selector} 超时`));
          }
        }, 300);
      });
    };
    const waitForHeight = (selector, timeout = 15e3) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
          const el = document.querySelector(selector);
          if (el && el.offsetHeight > 0) {
            resolve(el);
            return;
          }
          if (Date.now() - startTime > timeout) {
            reject(new Error("等待元素高度超时"));
            return;
          }
          setTimeout(check, 100);
        };
        check();
      });
    };
    const clickEl = (el) => {
      if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };
    const RESOURCE_TYPES = { VIDEO: "video", PPT: "ppt" };
    const getResourceType = (resourceEl) => {
      var _a;
      const fileType = resourceEl == null ? void 0 : resourceEl.querySelector(".file-type");
      if (!fileType) return "unknown";
      const secondClass = fileType.classList[1];
      if (!secondClass) return "unknown";
      const type = (_a = secondClass.split("-")) == null ? void 0 : _a[1];
      if (type === "video") return RESOURCE_TYPES.VIDEO;
      if (type === "ppt" || type === "other") return RESOURCE_TYPES.PPT;
      return type || "unknown";
    };
    const getAllResourceEls = () => Array.from(document.querySelectorAll(".resources-list .resources-item"));
    const getCurrentResourceEl = () => {
      const items = getAllResourceEls();
      const idx = resourceItems[currentResourceIndex];
      return items[idx] ?? null;
    };
    const detectCurrentResourceType = () => {
      const el = getCurrentResourceEl();
      currentResourceType = el ? getResourceType(el) : "unknown";
    };
    const findVideoElement = async (retries = 3, interval = 500) => {
      for (let i = 0; i < retries; i++) {
        const video = document.querySelector("#container #vjs_container video");
        if (video) return video;
        await new Promise((r) => setTimeout(r, interval));
      }
      return null;
    };
    const cleanupVideo = () => {
      if (videoEl) {
        videoEl.removeEventListener("ended", onVideoEnded);
        videoEl.removeEventListener("playing", onVideoPlaying);
        videoEl.removeEventListener("pause", onVideoPause);
        videoEl = null;
      }
    };
    const onVideoPlaying = () => {
      log.insertLog("视频正在播放中..");
    };
    const onVideoEnded = () => {
      log.insertLog("视频播放完毕");
      currentResourceIndex++;
      detectCurrentResourceType();
      processNextResource();
    };
    const onVideoPause = () => {
      if (!videoEl || videoEl.ended) return;
      // 弹题弹窗开着时不要抢着播放，答完自然会继续
      if (isAnsweringQuiz || zhsHasTopicDialog()) return;
      log.insertLog("视频被暂停，尝试恢复..");
      setTimeout(() => {
        if (videoEl && !videoEl.ended && videoEl.paused) {
          videoEl.play().catch(() => {
          });
        }
      }, 2e3);
    };
    // AI 智慧课的弹题和旧版视频页是同一套弹窗，这里单独轮询，不依赖视频暂停事件
    const watchPopupQuiz = () => {
      if (quizTimer) return;
      quizTimer = setInterval(async () => {
        if (isAnsweringQuiz || !zhsHasTopicDialog()) return;
        isAnsweringQuiz = true;
        try {
          const answered = await zhsAnswerTopicByVm(log);
          if (!answered) await zhsHandleTopicDialogByDom(log);
        } catch (e) {
          log.insertLog(`弹题处理异常: ${e.message}`, "warning");
        } finally {
          isAnsweringQuiz = false;
          if (videoEl && videoEl.paused && !videoEl.ended) {
            videoEl.play().catch(() => {
            });
          }
        }
      }, 3e3);
    };
    const processVideo = async () => {
      var _a, _b;
      log.insertLog("发现视频资源，正在播放..");
      try {
        cleanupVideo();
        videoEl = await findVideoElement();
        if (!videoEl) {
          log.insertLog("未找到视频元素，跳过..", "warning");
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        videoEl.muted = true;
        const muteHandler = () => {
          if (videoEl) videoEl.muted = false;
        };
        (_a = document.body) == null ? void 0 : _a.addEventListener("click", muteHandler, { once: true });
        (_b = document.querySelector("#container")) == null ? void 0 : _b.addEventListener("click", muteHandler, { once: true });
        const userRate = Number(setting.config.basicConfig.videoPlayrate.value) || 1;
        const rates = [userRate, 2, 1.75, 1.5, 1.25];
        for (const rate of rates) {
          try {
            videoEl.playbackRate = rate;
            if (videoEl.playbackRate === rate) {
              log.insertLog(`已设置播放倍速: ${rate}x`);
              break;
            }
          } catch {
          }
        }
        videoEl.play().catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {
          });
        });
        videoEl.addEventListener("playing", onVideoPlaying, { once: true });
        videoEl.addEventListener("pause", onVideoPause);
        videoEl.addEventListener("ended", onVideoEnded, { once: true });
      } catch (e) {
        log.insertLog(`视频处理出错: ${e.message}`, "warning");
        currentResourceIndex++;
        detectCurrentResourceType();
        processNextResource();
      }
    };
    const getPptPageInfo = () => {
      var _a, _b;
      const container = document.querySelector(".ppt-btn-container");
      if (!container) return [];
      const current = parseInt(
        (_a = container.querySelector(".page-content .page-current")) == null ? void 0 : _a.innerText,
        10
      ) || 0;
      const total = parseInt(
        (_b = container.querySelector(".page-content .page-total")) == null ? void 0 : _b.innerText,
        10
      ) || 0;
      return current && total ? [current, total] : [];
    };
    const processPpt = async () => {
      log.insertLog("发现PPT资源，正在自动翻页..");
      try {
        const pptContainer = document.querySelector(
          ".ppt-box .ppt-preview-container"
        );
        if (!pptContainer) {
          log.insertLog("未找到PPT容器，跳过..", "warning");
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        let [currentPage, totalPages] = getPptPageInfo();
        if (!currentPage || !totalPages) {
          log.insertLog("无法获取PPT页数，跳过..", "warning");
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        if (currentPage >= totalPages) {
          log.insertLog("PPT已翻到最后一页");
          await sleep(2);
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        log.insertLog(`PPT共 ${totalPages} 页，从第 ${currentPage} 页开始`);
        while (currentPage < totalPages) {
          if (isStopped) break;
          const nextBtn = pptContainer.querySelector(".next-page-btn");
          clickEl(nextBtn);
          await sleep(4);
          const [newCurrent, newTotal] = getPptPageInfo();
          currentPage = newCurrent;
          totalPages = newTotal;
          if (currentPage >= totalPages) {
            log.insertLog("PPT翻页完成");
            await sleep(2);
            currentResourceIndex++;
            detectCurrentResourceType();
            processNextResource();
            return;
          }
        }
      } catch (e) {
        log.insertLog(`PPT处理出错: ${e.message}`, "warning");
        currentResourceIndex++;
        detectCurrentResourceType();
        processNextResource();
      }
    };
    const processNextResource = async () => {
      if (currentResourceIndex >= resourceItems.length) {
        log.insertLog("当前小节所有资源已完成");
        nextSection();
        return;
      }
      const el = getCurrentResourceEl();
      if (!el) {
        log.insertLog("未找到资源元素，跳过..", "warning");
        currentResourceIndex++;
        detectCurrentResourceType();
        processNextResource();
        return;
      }
      if (currentResourceIndex > 0) {
        const type = getResourceType(el);
        if (!["video", "ppt"].includes(type)) {
          log.insertLog(`不支持的资源类型 (${type})，跳过`);
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        const clickTarget = el.querySelector(".basic-info-video-card-container");
        clickEl(clickTarget || el);
        await sleep(3);
      }
      detectCurrentResourceType();
      log.insertLog(
        `处理资源 [${currentResourceIndex + 1}/${resourceItems.length}] 类型: ${currentResourceType}`
      );
      switch (currentResourceType) {
        case RESOURCE_TYPES.VIDEO:
          processVideo();
          break;
        case RESOURCE_TYPES.PPT:
          processPpt();
          break;
        default:
          log.insertLog(`不支持的资源类型 (${currentResourceType})，跳过`);
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
      }
    };
    const getAllChapters = () => Array.from(document.querySelectorAll(".inner-li li.clearfix")).filter(
      (el) => !el.classList.contains("child-chapter") && !el.classList.contains("forbidClick")
    );
    const nextSection = async () => {
      var _a, _b, _c, _d;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      const chapters = getAllChapters();
      const active = document.querySelector(".clearfix.video.activeNode");
      if (!active) {
        log.insertLog("未找到当前活跃章节");
        return;
      }
      const currentTitle = ((_b = (_a = active.querySelector(".title")) == null ? void 0 : _a.innerText) == null ? void 0 : _b.trim()) || "当前章节";
      log.insertLog(`「${currentTitle}」所有资源已完成`);
      const currentIdx = chapters.indexOf(active);
      const next = chapters[currentIdx + 1];
      if (next) {
        const nextTitle = ((_d = (_c = next.querySelector(".title")) == null ? void 0 : _c.innerText) == null ? void 0 : _d.trim()) || "下一节";
        log.insertLog(`跳转到: ${nextTitle}`);
        next.click();
        next.scrollIntoView({ behavior: "smooth" });
      } else {
        reportCourseResult("done", "章节全部完成");
        log.insertLog("所有章节已完成！");
      }
    };
    const observeChapterList = () => {
      const listEl = document.querySelector(".chapterList-box .list");
      if (!listEl) return;
      chapterObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type !== "attributes" || mutation.attributeName !== "class")
            continue;
          const target = mutation.target;
          const isActive = target.classList.contains("activeNode") || target.classList.contains("active");
          if (isActive) {
            onChapterChange();
          }
        }
      });
      chapterObserver.observe(listEl, {
        attributes: true,
        attributeFilter: ["class"],
        subtree: true,
        childList: false
      });
    };
    const observeResourceList = () => {
      const resourceListEl = document.querySelector(
        ".resource-warp .resources-list"
      );
      if (!resourceListEl) return;
      resourceObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type !== "attributes" || mutation.attributeName !== "class")
            continue;
          const target = mutation.target;
          const isActive = target.classList.contains("active");
          if (isActive) {
            onChapterChange();
          }
        }
      });
      resourceObserver.observe(resourceListEl, {
        attributes: true,
        attributeFilter: ["class"],
        subtree: true,
        childList: false
      });
    };
    const onChapterChange = async (isActive) => {
      {
        await sleep(5);
        isStopped = false;
        await initResourcesFromDom();
      }
    };
    const initResourcesFromDom = async () => {
      if (resourceObserver) resourceObserver.disconnect();
      try {
        await waitFor(".resource-warp .resources-list .resources-item", 15e3);
        const items = getAllResourceEls();
        if (!items.length) {
          log.insertLog("未找到学习资源，尝试跳转下一节..", "warning");
          nextSection();
          return;
        }
        const activeIdx = Array.from(items).findIndex(
          (el) => el.classList.contains("active")
        );
        currentResourceIndex = activeIdx >= 0 ? activeIdx : 0;
        resourceItems = items.map((_, i) => i);
        log.insertLog(`发现 ${resourceItems.length} 个学习资源`);
        observeResourceList();
        detectCurrentResourceType();
        await processNextResource();
      } catch (e) {
        log.insertLog(`初始化资源列表失败: ${e.message}`, "warning");
        nextSection();
      }
    };
    const dismissPopups = () => {
      const popup = document.querySelector(".courseRemind.khfaPop");
      const closeBtn = popup == null ? void 0 : popup.querySelector(
        ".header-slot-box .el-icon-error"
      );
      if (closeBtn) {
        closeBtn.click();
        log.insertLog("已关闭课程提醒弹窗");
      }
    };
    const watchUrlChange = () => {
      let prevUrl = location.href;
      setInterval(() => {
        if (location.href === prevUrl) return;
        prevUrl = location.href;
        if (location.href.includes("ai-smart-course-student-pro.zhihuishu.com") || location.href.includes("fusioncourseh5.zhihuishu.com") || location.href.includes("smartcoursestudent.zhihuishu.com")) {
          log.insertLog("检测到页面切换，重新初始化..");
          setTimeout(() => initAll(), 3e3);
        }
      }, 1500);
    };
    const initAll = async () => {
      try {
        await waitForHeight(".preview-warp");
      } catch {
        log.insertLog("等待页面内容加载超时..", "warning");
      }
      dismissPopups();
      observeChapterList();
      await sleep(5);
      await initResourcesFromDom();
    };
    const start = async () => {
      log.insertLog("进入智慧树AI智慧课学习页面，脚本开始工作..");
      autoSetTab(setting, "1");
      await sleep(6);
      watchUrlChange();
      watchPopupQuiz();
      await initAll();
    };
    start();
  };
  const smartStudyLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    const RESOURCE_TYPES = {
      VIDEO: "video",
      BOOK: "book",
      PPT: "ppt",
      TEXT: "text",
      LINK: "link",
      UNKNOWN: "unknown"
    };
    let currentRunId = 0;
    let videoEl = null;
    let urlWatcher = null;
    const waitFor = (selector, timeout = 1e4) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const el = document.querySelector(selector);
          if (el) {
            clearInterval(check);
            resolve(el);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error(`等待元素 ${selector} 超时`));
          }
        }, 300);
      });
    };
    const waitForMedia = (timeout = 5e3) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const media = document.querySelector("video,audio");
          if (media && media.src) {
            clearInterval(check);
            resolve(media);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("未找到音视频元素"));
          }
        }, 200);
      });
    };
    const clickEl = (el) => {
      if (!el) return;
      if (typeof el.click === "function") {
        el.click();
        return;
      }
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };
    const getVideoRate = () => {
      const rate = Number(setting.config.basicConfig.videoPlayrate.value);
      return Math.min(rate || 1, 16);
    };
    const getResourceCards = () => Array.from(document.querySelectorAll('[class*="card-container"]'));
    const getActiveCard = () => getResourceCards().find((card) => card.classList.contains("active")) || null;
    const getCardTitleEl = (card) => (card == null ? void 0 : card.querySelector(".common-text")) || (card == null ? void 0 : card.querySelector(".video-title")) || (card == null ? void 0 : card.querySelector(".basic-info-video-card-container")) || card;
    const getResourceType = (card) => {
      const iconBox = card == null ? void 0 : card.querySelector(".icon-box");
      const classes = (iconBox == null ? void 0 : iconBox.className) || "";
      if (classes.includes("video")) return RESOURCE_TYPES.VIDEO;
      if (classes.includes("book")) return RESOURCE_TYPES.BOOK;
      if (classes.includes("ppt") || classes.includes("other")) return RESOURCE_TYPES.PPT;
      if (classes.includes("text")) return RESOURCE_TYPES.TEXT;
      if (classes.includes("link")) return RESOURCE_TYPES.LINK;
      return RESOURCE_TYPES.UNKNOWN;
    };
    const isCardFinished = (card) => {
      var _a;
      const finishedIcon = card == null ? void 0 : card.querySelector(".finished-icon");
      if (!finishedIcon) return false;
      const text = ((_a = finishedIcon.textContent) == null ? void 0 : _a.trim()) || "";
      return !text || text.includes("已完成");
    };
    const getCurrentChapterName = () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const sectionTitle = ((_b = (_a = document.querySelector(".point-title-text")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_d = (_c = document.querySelector(".section-item-collapse-info.active .section-item-collapse-title")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "未知章节";
      const cardTitle = ((_g = (_f = (_e = getActiveCard()) == null ? void 0 : _e.querySelector(".video-title")) == null ? void 0 : _f.textContent) == null ? void 0 : _g.trim()) || ((_j = (_i = (_h = getActiveCard()) == null ? void 0 : _h.querySelector(".common-text")) == null ? void 0 : _i.textContent) == null ? void 0 : _j.trim()) || "未知小节";
      return `${sectionTitle}-${cardTitle}`;
    };
    const getNextCard = () => {
      const cards = getResourceCards();
      if (!cards.length) return null;
      const activeIndex = cards.findIndex((card) => card.classList.contains("active"));
      const startIndex = activeIndex >= 0 ? activeIndex + 1 : 0;
      for (let index = startIndex; index < cards.length; index++) {
        const card = cards[index];
        if (!isCardFinished(card)) return card;
      }
      return null;
    };
    const parseRequiredProgress = (section) => {
      var _a;
      const text = ((_a = section == null ? void 0 : section.querySelector(".collapse-info-progress .progress-text")) == null ? void 0 : _a.textContent) || "";
      const match = text.replace(/\s/g, "").match(/(\d+)\/(\d+)/);
      if (!match) return null;
      const progress = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (Number.isNaN(progress) || Number.isNaN(total)) return null;
      return { progress, total };
    };
    const getNextSection = () => {
      var _a;
      const sections = Array.from(
        document.querySelectorAll(".section-item-collapse-info")
      );
      const active = sections.find((section) => section.classList.contains("active"));
      const unfinishedSections = sections.map((section) => ({ section, progress: parseRequiredProgress(section) })).filter(({ progress }) => progress && progress.progress < progress.total);
      if (!unfinishedSections.length) return null;
      const activeIndex = unfinishedSections.findIndex(
        ({ section }) => section === active
      );
      if (activeIndex >= 0) {
        return ((_a = unfinishedSections[activeIndex + 1]) == null ? void 0 : _a.section) || null;
      }
      return unfinishedSections[0].section;
    };
    const setCardActive = (card) => {
      getResourceCards().forEach((item) => item.classList.remove("active"));
      card == null ? void 0 : card.classList.add("active");
    };
    const clickResourceCard = async (card) => {
      const type = getResourceType(card);
      const target = getCardTitleEl(card);
      if (type !== RESOURCE_TYPES.UNKNOWN) {
        clickEl(target);
        return;
      }
      setCardActive(card);
      const pageWindow = globalThis.unsafeWindow || window;
      const originalOpen = pageWindow.open;
      try {
        pageWindow.open = () => null;
        clickEl(target);
        await sleep(3);
      } finally {
        pageWindow.open = originalOpen;
      }
    };
    const cleanupVideo = () => {
      if (!videoEl) return;
      videoEl.onpause = null;
      videoEl.onended = null;
      videoEl = null;
    };
    const processNext = async (runId) => {
      var _a, _b, _c, _d;
      if (runId !== currentRunId) return;
      const nextCard = getNextCard();
      if (nextCard) {
        const title = ((_b = (_a = nextCard.querySelector(".common-text")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_d = (_c = nextCard.querySelector(".video-title")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "下一资源";
        log.insertLog(`跳转到资源: ${title}`);
        await clickResourceCard(nextCard);
        await sleep(3);
        await doWork();
        return;
      }
      await nextSection(runId);
    };
    const processVideo = async (runId) => {
      try {
        const wrapper = document.querySelector(".video-player-wrapper");
        if (!wrapper || wrapper.style.display === "none") {
          throw new Error("视频未加载");
        }
        videoEl = await waitForMedia();
        if (runId !== currentRunId) return;
        videoEl.currentTime = Math.max(videoEl.currentTime, 1);
        videoEl.volume = 0;
        videoEl.muted = true;
        videoEl.playbackRate = getVideoRate();
        log.insertLog(`已设置播放倍速: ${videoEl.playbackRate}x`);
        videoEl.play().catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {
          });
        });
        log.insertLog(`正在学习: ${getCurrentChapterName()}`);
        videoEl.onpause = async () => {
          if (runId !== currentRunId || !videoEl || videoEl.ended) return;
          await sleep(1);
          videoEl == null ? void 0 : videoEl.play().catch(() => {
          });
        };
        videoEl.onended = async () => {
          if (runId !== currentRunId) return;
          log.insertLog("视频播放完毕，即将跳转下一资源");
          await sleep(3);
          await processNext(runId);
        };
      } catch (e) {
        log.insertLog(`未找到学习视频，即将跳转下一资源: ${e.message}`, "warning");
        await sleep(3);
        await processNext(runId);
      }
    };
    const processPpt = async (runId) => {
      try {
        const container = document.querySelector(".preview-section .ppt-preview-container");
        if (!container) {
          await processPassiveResource(runId, "PPT资源");
          return;
        }
        const getPageInfo = () => {
          var _a, _b;
          const current2 = parseInt((_a = container.querySelector(".page-current")) == null ? void 0 : _a.textContent, 10) || 0;
          const total2 = parseInt((_b = container.querySelector(".page-total")) == null ? void 0 : _b.textContent, 10) || 0;
          return [current2, total2];
        };
        let [current, total] = getPageInfo();
        if (!current || !total) {
          await processPassiveResource(runId, "PPT资源");
          return;
        }
        log.insertLog(`PPT共 ${total} 页，从第 ${current} 页开始`);
        while (runId === currentRunId && current < total) {
          clickEl(container.querySelector(".next-page-btn"));
          await sleep(4);
          [current, total] = getPageInfo();
        }
        log.insertLog("PPT翻页完成");
        await processNext(runId);
      } catch (e) {
        log.insertLog(`PPT处理出错: ${e.message}`, "warning");
        await processNext(runId);
      }
    };
    const processBook = async (runId) => {
      try {
        await waitFor(".preview-section .book-mark .book-container", 5e3);
        const container = document.querySelector(
          ".preview-section .book-mark .book-container"
        );
        if (!container) {
          await processPassiveResource(runId, "电子书资源");
          return;
        }
        log.insertLog("发现电子书资源，正在阅读..");
        while (runId === currentRunId && container.scrollTop + container.clientHeight < container.scrollHeight - 2) {
          container.scrollTo({
            top: Math.min(
              container.scrollTop + Math.max(container.clientHeight * 0.8, 200),
              container.scrollHeight
            ),
            behavior: "smooth"
          });
          await sleep(1.5);
        }
        log.insertLog("电子书阅读完成");
        await processNext(runId);
      } catch {
        await processPassiveResource(runId, "电子书资源");
      }
    };
    const processPassiveResource = async (runId, label) => {
      if (runId !== currentRunId) return;
      log.insertLog(`${label}已处理，即将跳转下一资源`);
      await sleep(3);
      await processNext(runId);
    };
    async function doWork() {
      const runId = ++currentRunId;
      cleanupVideo();
      await sleep(5);
      if (runId !== currentRunId) return;
      let card = getActiveCard();
      if (card && isCardFinished(card)) {
        log.insertLog("当前资源已完成，跳过..");
        card = getNextCard();
        if (!card) {
          await nextSection(runId);
          return;
        }
        await clickResourceCard(card);
        await sleep(3);
        card = getActiveCard() || card;
      }
      if (!card) {
        card = getNextCard();
        if (!card && getResourceCards().length) {
          await nextSection(runId);
          return;
        }
        if (card) {
          await clickResourceCard(card);
          await sleep(3);
          card = getActiveCard() || card;
        }
      }
      if (!card) {
        log.insertLog("未找到学习资源，尝试跳转下一章节..", "warning");
        await nextSection(runId);
        return;
      }
      const type = getResourceType(card);
      log.insertLog(`处理资源类型: ${type}`);
      switch (type) {
        case RESOURCE_TYPES.VIDEO:
          await processVideo(runId);
          break;
        case RESOURCE_TYPES.BOOK:
          await processBook(runId);
          break;
        case RESOURCE_TYPES.PPT:
          await processPpt(runId);
          break;
        case RESOURCE_TYPES.TEXT:
          await processPassiveResource(runId, "文本资源");
          break;
        case RESOURCE_TYPES.LINK:
        case RESOURCE_TYPES.UNKNOWN:
        default:
          await processPassiveResource(runId, "当前资源");
      }
    }
    async function nextSection(runId) {
      var _a, _b;
      if (runId !== currentRunId) return;
      const next = getNextSection();
      if (!next) {
        reportCourseResult("done", "必学章节全部完成");
        log.insertLog("所有必学章节已完成！");
        return;
      }
      const title = ((_b = (_a = next.querySelector(".section-item-collapse-title")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || "下一章节";
      log.insertLog(`跳转到: ${title}`);
      clickEl(next);
      await sleep(5);
      await doWork();
    }
    const dismissPopups = () => {
      const noteDialog = document.querySelector(".read-note-dialog");
      if (noteDialog && getComputedStyle(noteDialog).display !== "none") {
        const btn = noteDialog.querySelector("button");
        if (btn) {
          clickEl(btn);
          log.insertLog("已关闭阅读提示弹窗");
        }
      }
    };
    const watchUrlChange = () => {
      if (urlWatcher) clearInterval(urlWatcher);
      let prevUrl = location.href;
      urlWatcher = setInterval(() => {
        if (location.href === prevUrl) return;
        prevUrl = location.href;
        if (location.href.includes("/learnPage")) {
          log.insertLog("检测到页面切换，重新初始化..");
          doWork();
        }
      }, 1500);
    };
    const start = async () => {
      log.insertLog("进入智慧树新形态课程学习页面，脚本开始工作..");
      autoSetTab(setting, "1");
      if (location.href.includes("/singleCourse")) {
        log.insertLog("请点击任意章节开始学习，进入学习页后将自动处理..", "warning");
        return;
      }
      await sleep(6);
      dismissPopups();
      try {
        await waitFor(".section-item-collapse-info", 15e3);
      } catch {
        log.insertLog("等待章节列表加载超时..", "warning");
      }
      watchUrlChange();
      await doWork();
    };
    start();
  };
  const studyPlusLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let quizTimer = null;
    let finishTimer = null;
    let visibilityTimer = null;
    let isSwitching = false;
    let isHandlingQuiz = false;
    let visibilityWarned = false;
    let isAllFinished = false;
    const waitFor = (target, timeout = 1e4, interval = 300) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const result = typeof target === "function" ? target() : document.querySelector(target);
          if (result) {
            clearInterval(check);
            resolve(result);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("等待页面内容加载超时"));
          }
        }, interval);
      });
    };
    const clickEl = async (el) => {
      var _a, _b, _c;
      if (!el) return false;
      (_a = el.scrollIntoView) == null ? void 0 : _a.call(el, { behavior: "smooth", block: "center" });
      await sleep(0.2);
      (_b = el.click) == null ? void 0 : _b.call(el);
      (_c = el.dispatchEvent) == null ? void 0 : _c.call(el, new MouseEvent("click", { bubbles: true }));
      return true;
    };
    const getRate = () => {
      const rate = Number(setting.config.basicConfig.videoPlayrate.value);
      return Math.min(rate || 1, 16);
    };
    const getCourseName = () => {
      var _a, _b;
      const text = (_b = (_a = document.querySelector(".top-back-box > span:nth-child(2), .course-name")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
      return (text == null ? void 0 : text.replace(/^课程名称[:：]\s*/, "")) || "未知课程";
    };
    const getChapterItems = () => Array.from(document.querySelectorAll(".child-main")).filter(
      (el) => {
        var _a;
        return (_a = el.parentElement) == null ? void 0 : _a.querySelector(".child-time");
      }
    );
    const getCurrentChapter = () => getChapterItems().find((el) => el.classList.contains("current"));
    const getChapterName = (item) => {
      var _a, _b;
      return ((_b = (_a = item == null ? void 0 : item.parentElement) == null ? void 0 : _a.textContent) == null ? void 0 : _b.replace(/\s+/g, " ").trim()) || "未知章节";
    };
    const isChapterFinished = (item) => {
      var _a;
      return !!((_a = item == null ? void 0 : item.parentElement) == null ? void 0 : _a.querySelector(".finish-icon"));
    };
    const getNextChapter = () => {
      const items = getChapterItems().filter((item) => !isChapterFinished(item));
      if (!items.length) return null;
      const current = getCurrentChapter();
      const currentIndex = items.indexOf(current);
      return currentIndex >= 0 ? items[currentIndex + 1] : items[0];
    };
    const cleanupVideo = () => {
      if (!videoEl) return;
      videoEl.onpause = null;
      videoEl.onended = null;
      videoEl = null;
    };
    const handleQuizDialog = async () => {
      if (isHandlingQuiz) return;
      const dialog = document.querySelector(".ai-test-question-wrapper");
      if (!dialog) return;
      isHandlingQuiz = true;
      try {
        const done = dialog.querySelector(".done");
        const closeBtn = dialog.querySelector(".close-box");
        if (done) {
          await clickEl(closeBtn);
          return;
        }
        const options = Array.from(dialog.querySelectorAll(".options .option"));
        if (options.length) {
          // 随堂练习也可能弹验证码，等用户过完再点
          const captchaPassed = await zhsWaitForYidun(log);
          if (!captchaPassed) return;
          const option = options[Math.floor(Math.random() * options.length)];
          await clickEl(option);
          await sleep(1);
        }
        await clickEl(document.querySelector(".submit-btn .submits"));
        await sleep(1);
        await clickEl(closeBtn);
        log.insertLog("随堂练习弹窗已处理");
      } finally {
        await sleep(1);
        isHandlingQuiz = false;
      }
    };
    const fixControls = () => {
      const bar = document.querySelector(".controlsBar");
      if (!bar) return;
      bar.style.display = "block";
      bar.style.zIndex = "2";
    };
    const playVideo = async () => {
      cleanupVideo();
      try {
        fixControls();
        videoEl = await waitFor(() => {
          const media = document.querySelector("video, audio");
          return (media == null ? void 0 : media.src) ? media : null;
        }, 15e3);
        videoEl.currentTime = Math.max(videoEl.currentTime, 1);
        videoEl.volume = 0;
        videoEl.muted = true;
        videoEl.playbackRate = getRate();
        log.insertLog(`正在学习：${getChapterName(getCurrentChapter())}`);
        log.insertLog(`已设置播放倍速: ${videoEl.playbackRate}x`);
        videoEl.play().catch(() => {
        });
        videoEl.onpause = () => {
          if (!videoEl || videoEl.ended || isSwitching || isHandlingQuiz) return;
          setTimeout(() => {
            var _a;
            return (_a = videoEl == null ? void 0 : videoEl.play) == null ? void 0 : _a.call(videoEl).catch(() => {
            });
          }, 1e3);
        };
        videoEl.onended = async () => {
          if (isSwitching) return;
          await sleep(2);
          await nextChapter();
        };
      } catch (error) {
        log.insertLog(`${error.message || "视频加载失败"}，尝试切换下一节..`, "warning");
        await sleep(2);
        await nextChapter();
      }
    };
    const nextChapter = async () => {
      if (isSwitching) return;
      if (isAllFinished) return;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      isSwitching = true;
      cleanupVideo();
      const next = getNextChapter();
      if (!next) {
        // 记住已经刷完，避免每 2 秒重复检查、重复打印同一句日志
        isAllFinished = true;
        reportCourseResult("done", "章节视频全部完成");
        log.insertLog("所有章节视频已完成！");
        if (finishTimer) clearInterval(finishTimer);
        finishTimer = null;
        isSwitching = false;
        return;
      }
      log.insertLog(`跳转到: ${getChapterName(next)}`);
      await clickEl(next);
      await sleep(5);
      isSwitching = false;
      playVideo();
    };
    const startPolling = () => {
      quizTimer = setInterval(handleQuizDialog, 3e3);
      finishTimer = setInterval(() => {
        if (isSwitching) return;
        const current = getCurrentChapter();
        if (current && isChapterFinished(current)) nextChapter();
      }, 2e3);
      visibilityTimer = setInterval(() => {
        if (document.visibilityState === "hidden" && !visibilityWarned) {
          visibilityWarned = true;
          log.insertLog("页面未保持前台，学习流程可能无法正常推进..", "warning");
        } else if (document.visibilityState === "visible") {
          visibilityWarned = false;
        }
      }, 1e3);
    };
    const start = async () => {
      log.insertLog(`进入智慧树新共享课学习页面（${getCourseName()}），脚本开始工作..`);
      autoSetTab(setting, "1");
      await sleep(5);
      try {
        await waitFor(".child-main", 2e4);
      } catch {
        log.insertLog("等待章节列表加载超时，尝试继续处理..", "warning");
      }
      document.querySelectorAll(".el-overlay,.el-dialog").forEach((dialog) => {
        dialog.style.display = "none";
      });
      startPolling();
      playVideo();
    };
    start();
    return () => {
      cleanupVideo();
      if (quizTimer) clearInterval(quizTimer);
      if (finishTimer) clearInterval(finishTimer);
      if (visibilityTimer) clearInterval(visibilityTimer);
    };
  };
  const TYPE_TEXT_MAP = [
    { keywords: ["多选", "多项", "X型", "不定项"], type: "多选题" },
    { keywords: ["判断", "是非"], type: "判断题" },
    { keywords: ["填空", "完形", "完型"], type: "填空题" },
    { keywords: ["简答"], type: "简答题" },
    { keywords: ["论述"], type: "论述题" },
    { keywords: ["计算"], type: "计算题" },
    { keywords: ["单选", "单项"], type: "单选题" }
  ];
  const QUESTION_TYPE_CODE_MAP = {
    单选题: "0",
    单项选择题: "0",
    单选: "0",
    多选题: "1",
    多项选择题: "1",
    多选: "1",
    填空题: "2",
    填空: "2",
    判断题: "3",
    判断: "3",
    是非题: "3",
    简答题: "4",
    简答: "4",
    名词解释: "5",
    论述题: "6",
    论述: "6",
    计算题: "7",
    计算: "7"
  };
  const PROFILES = [
    {
      name: "新形态正式考试",
      root: ".question-area-content",
      type: [
        "div.flex.items-center.mb-\\[16px\\]",
        "[class*='question-type']",
        "[class*='mb-[16px]']"
      ],
      title: [
        "div.flex-1 .mb-\\[32px\\] .text-mainText.font-medium",
        ".text-mainText.font-medium",
        "[class*='text-mainText'][class*='font-medium']",
        "[class*='question'][class*='title']"
      ],
      options: [
        "label.user-select.group",
        "label[class*='user-select']",
        "label.group",
        "[role='radio']",
        "[role='checkbox']"
      ],
      beforeParse: async () => {
        var _a;
        const firstButton = document.querySelector(".grid.grid-cols-7 > button") || Array.from(document.querySelectorAll("button")).find(
          (button) => {
            var _a2;
            return ((_a2 = button.textContent) == null ? void 0 : _a2.trim()) === "1";
          }
        );
        if (firstButton) {
          firstButton.click();
        }
        const startTime = Date.now();
        while (Date.now() - startTime < 1e4) {
          const root = document.querySelector(".question-area-content");
          if ((_a = root == null ? void 0 : root.textContent) == null ? void 0 : _a.trim()) return;
          await sleep(0.3);
        }
      },
      nextButton: () => Array.from(document.querySelectorAll("button")).find(
        (button) => {
          var _a;
          return (_a = button.textContent) == null ? void 0 : _a.includes("下一题");
        }
      ),
      useAnswerSheet: true
    },
    {
      name: "新形态作业考试",
      root: ".questionBox",
      type: ".questionTit",
      title: ".questionContent",
      options: ".optionUl label",
      nextButton: "span.Topicswitchingbtn:nth-child(2)"
    },
    {
      name: "新形态掌握度",
      root: ".questionContent",
      type: ".questionName",
      title: ".questionName .centent-pre",
      options: ".radio-view li.clearfix, .checkbox-views label.el-checkbox, .fillAnswer",
      // 最后一题时按钮仍在，只是多了 noNext 类；以前没写翻页按钮，这页只答第一题就收工
      nextButton: () => {
        const button = document.querySelector(".pre-next .next-topic");
        return button && !button.classList.contains("noNext") ? button : null;
      }
    },
    {
      name: "AI掌握度",
      root: ".exam-item",
      type: ".quest-type",
      title: ".quest-title .option-name",
      options: "label"
    }
  ];
  const smartAnswerLogic = async () => {
    var _a, _b;
    const log = useLogStore();
    const setting = useSettingStore();
    const questionStore = useQuestionStore();
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.insertLog(
        `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
      );
      return;
    }
    const cleanText = (text = "") => String(text ?? "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const normalize = (text = "") => cleanText(text).replace(/^[A-Z][.、．]\s*/i, "").replace(/[^\p{L}\p{N}√×]/gu, "").toLowerCase();
    const htmlOf = (el) => (el == null ? void 0 : el.innerHTML) || (el == null ? void 0 : el.textContent) || "";
    const getByKeys = (obj, keys) => {
      if (!obj || typeof obj !== "object") return "";
      const key = keys.find((item) => obj[item] != null && obj[item] !== "");
      return key ? obj[key] : "";
    };
    const parseJsonLike = (value) => {
      if (typeof value !== "string") return value;
      const text = value.trim();
      if (!/^[\[{]/.test(text)) return value;
      try {
        return JSON.parse(text);
      } catch {
        return value;
      }
    };
    const normalizePayload = (payload) => {
      const visited = /* @__PURE__ */ new WeakSet();
      const normalizeNode = (node) => {
        const parsed = parseJsonLike(node);
        if (!parsed || typeof parsed !== "object") return parsed;
        if (visited.has(parsed)) return parsed;
        visited.add(parsed);
        if (Array.isArray(parsed)) return parsed.map(normalizeNode);
        Object.keys(parsed).forEach((key) => {
          parsed[key] = normalizeNode(parsed[key]);
        });
        return parsed;
      };
      return normalizeNode(payload);
    };
    const normalizeOption = (option) => ({
      text: cleanText(
        getByKeys(option, [
          "option",
          "content",
          "optionContent",
          "optionText",
          "optionName",
          "optionTitle",
          "answer",
          "answerContent",
          "answerText",
          "name",
          "text",
          "title",
          "label",
          "value"
        ])
      ),
      html: String(
        getByKeys(option, ["content", "optionContent", "optionName", "name", "text"]) || ""
      )
    });
    const extractOptionList = (obj) => {
      const optionList = getByKeys(obj, [
        "questionOptions",
        "questionOption",
        "options",
        "optionList",
        "questionOptionList",
        "questionOptionDTOList",
        "questionOptionsList",
        "optionContentList",
        "answerOptions",
        "answerOptionList",
        "answerList",
        "answerDtos",
        "answerDTOList",
        "answers",
        "optionVos",
        "optionVOList",
        "items"
      ]);
      if (!Array.isArray(optionList)) return [];
      return optionList.map(normalizeOption).filter((option) => option.text);
    };
    const normalizeApiType = (typeText) => {
      const text = String(typeText || "");
      const matched = TYPE_TEXT_MAP.find(
        ({ keywords }) => keywords.some((keyword) => text.includes(keyword))
      );
      if (matched) return matched.type;
      if (QUESTION_TYPE_CODE_MAP[text]) return text;
      const codeMap = {
        1: "单选题",
        2: "多选题",
        3: "判断题",
        4: "填空题",
        5: "简答题",
        14: "填空题"
      };
      return codeMap[text] || "单选题";
    };
    const collectAnswerSheetMetaQuestions = (payload) => {
      var _a2;
      const normalizedPayload = normalizePayload(payload);
      const parts = (_a2 = normalizedPayload == null ? void 0 : normalizedPayload.data) == null ? void 0 : _a2.partSheetVos;
      if (!Array.isArray(parts)) return [];
      return parts.flatMap(
        (part) => (part.questionSheetVos || []).map((question) => ({
          type: normalizeApiType(question.questionType || part.name),
          sort: Number(question.sort) || 0,
          questionId: question.questionId,
          version: question.version,
          partName: part.name
        }))
      ).sort((a, b) => a.sort - b.sort);
    };
    const collectAnswerSheetQuestions = (payload) => {
      const metaQuestions = collectAnswerSheetMetaQuestions(payload);
      if (metaQuestions.length) return metaQuestions;
      const questions2 = [];
      const visited = /* @__PURE__ */ new WeakSet();
      const normalizedPayload = normalizePayload(payload);
      const titleKeys = [
        "questionName",
        "questionTitle",
        "questionContent",
        "questionContentText",
        "questionText",
        "questionStem",
        "questionStemContent",
        "questionStemRich",
        "questionStemRichText",
        "questionDescribe",
        "questionDesc",
        "questionBody",
        "stemContent",
        "stemText",
        "stem",
        "title",
        "name",
        "content",
        "contentText",
        "topicContent",
        "topicName"
      ];
      const typeKeys = [
        "questionTypeName",
        "questionType",
        "questionTypeStr",
        "questionTypeText",
        "questionTypeCode",
        "questionTypeId",
        "questionTypeDto",
        "questionTypeDTO",
        "typeName",
        "type"
      ];
      const walk = (node) => {
        if (!node || typeof node !== "object") return;
        if (visited.has(node)) return;
        visited.add(node);
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        const rawTitle = getByKeys(node, titleKeys);
        const title = cleanText(
          typeof rawTitle === "object" ? getByKeys(rawTitle, ["name", "title", "content", "text", "value"]) : rawTitle
        );
        const options = extractOptionList(node);
        if (title && (options.length || title.length > 6)) {
          const optionsObject = {};
          options.forEach((option) => {
            optionsObject[option.text] = option.html || option.text;
          });
          questions2.push({
            type: normalizeApiType(
              (() => {
                const typeValue = getByKeys(node, typeKeys);
                return typeof typeValue === "object" ? getByKeys(typeValue, ["name", "title", "text", "value", "code", "id"]) : typeValue;
              })()
            ),
            title,
            optionsText: options.map((option) => option.text),
            options: optionsObject
          });
        }
        Object.values(node).forEach(walk);
      };
      walk(normalizedPayload);
      const seen = /* @__PURE__ */ new Set();
      return questions2.filter((question) => {
        const key = `${question.title}|${question.optionsText.join("|")}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const waitForAnswerSheetQuestions = async () => {
      const pageWindow = _unsafeWindow || window;
      if (pageWindow[ANSWER_SHEET_KEY]) {
        return collectAnswerSheetQuestions(pageWindow[ANSWER_SHEET_KEY]);
      }
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve([]), 1e4);
        pageWindow.addEventListener(
          "ABC_ZHS_ANSWER_SHEET",
          (event) => {
            clearTimeout(timer);
            resolve(collectAnswerSheetQuestions(event.detail));
          },
          { once: true }
        );
      });
    };
    const describePayloadShape = (payload) => {
      const normalizedPayload = normalizePayload(payload);
      const topKeys = normalizedPayload && typeof normalizedPayload === "object" ? Object.keys(normalizedPayload).slice(0, 12) : [];
      const candidateKeys = [];
      const visited = /* @__PURE__ */ new WeakSet();
      const walk = (node) => {
        if (!node || typeof node !== "object" || candidateKeys.length >= 5) return;
        if (visited.has(node)) return;
        visited.add(node);
        if (Array.isArray(node)) {
          node.slice(0, 5).forEach(walk);
          return;
        }
        const keys = Object.keys(node);
        if (keys.some((key) => /question|option|answer|stem|title|content/i.test(key))) {
          candidateKeys.push(keys.slice(0, 16).join(","));
        }
        Object.values(node).forEach(walk);
      };
      walk(normalizedPayload);
      return {
        topKeys,
        candidateKeys
      };
    };
    const toSelectorList = (selectors) => Array.isArray(selectors) ? selectors : [selectors].filter(Boolean);
    const queryAllSafe = (root, selectors) => {
      const results = [];
      toSelectorList(selectors).forEach((selector) => {
        try {
          results.push(...root.querySelectorAll(selector));
        } catch {
        }
      });
      return Array.from(new Set(results));
    };
    const queryOneSafe = (root, selectors) => queryAllSafe(root, selectors)[0] || null;
    const resolveType = (root, profile2) => {
      var _a2;
      const rawText = ((_a2 = queryOneSafe(root, profile2.type)) == null ? void 0 : _a2.textContent) || root.textContent || "";
      const matched = TYPE_TEXT_MAP.find(
        ({ keywords }) => keywords.some((keyword) => rawText.includes(keyword))
      );
      const domMulti = detectMultiChoiceDom(root);
      if (matched == null ? void 0 : matched.type) {
        // 题型文字写的是单选、页面却是复选框：以页面控件为准，否则多选只答一项
        if (domMulti && matched.type === "单选题") return "多选题";
        return matched.type;
      }
      if (domMulti) return "多选题";
      return "单选题";
    };
    const toApiQuestion = (question) => ({
      ...question,
      type: QUESTION_TYPE_CODE_MAP[question.type] || question.type || "999"
    });
    const getActiveProfile = async () => {
      const startTime = Date.now();
      // 页面异步加载，题目区可能晚一些才出现，等 45 秒
      while (Date.now() - startTime < 4.5e4) {
        const profile2 = PROFILES.find((item) => document.querySelector(item.root));
        if (profile2) return profile2;
        await sleep(0.3);
      }
      return null;
    };
    // 翻页后题干是异步渲染的，等标题出现再解析，避免解析到空题面
    // 图片题没有文字标题，题目区里出现图片也算就绪
    const waitForQuestionTitle = async (profile2, timeout = 1e4) => {
      var _a2;
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const root = document.querySelector(profile2.root);
        if (root && cleanText((_a2 = queryOneSafe(root, profile2.title)) == null ? void 0 : _a2.textContent)) return;
        if (root && root.querySelector && root.querySelector("img")) return;
        await sleep(0.3);
      }
    };
    const parseQuestions = (profile2) => {
      const roots = Array.from(document.querySelectorAll(profile2.root));
      return roots.map((root) => {
        const optionEls = queryAllSafe(root, profile2.options).filter((option) => {
          if (cleanText(option.textContent)) return true;
          return !!(option.querySelector && option.querySelector("img"));
        });
        const optionsText = optionEls.map((option, index) => {
          const t = cleanText(option.textContent);
          if (t) return t;
          const img = option.querySelector && option.querySelector("img");
          const src = img ? (img.getAttribute("data-src") || img.currentSrc || img.src || "") : "";
          return src ? `<img src="${src}"/>` : `选项${String.fromCharCode(65 + index)}`;
        });
        const options = {};
        optionEls.forEach((option, index) => {
          options[optionsText[index]] = htmlOf(option);
        });
        const titleEl = queryOneSafe(root, profile2.title);
        let title = cleanText(htmlOf(titleEl));
        const titleHasImg = !!(titleEl && titleEl.querySelector && titleEl.querySelector("img"));
        if (!title && titleHasImg) title = "[图片题]";
        if (!title) {
          const optionTextSet = new Set(optionsText.map((option) => normalize(option)));
          title = queryAllSafe(root, "div, p, span").filter((el) => el.getClientRects().length > 0).map((el) => cleanText(el.textContent)).filter((text) => text.length > 4).filter((text) => !optionTextSet.has(normalize(text))).filter(
            (text) => !TYPE_TEXT_MAP.some(
              ({ keywords }) => keywords.some((keyword) => text === keyword || text === `${keyword}题`)
            )
          ).sort((a, b) => b.length - a.length)[0] || "";
        }
        return {
          element: root,
          type: resolveType(root, profile2),
          title,
          optionsText,
          options,
          optionEls,
          optionSelector: profile2.options,
          answer: { code: -1, answer: [] },
          workType: "zhs",
          refer: location.href,
          id: "zhs"
        };
      });
    };
    const isChoiceType = (type) => ["单选题", "多选题", "判断题"].includes(type);
    const fillBlank = (question, answers) => {
      const inputs = Array.from(
        question.element.querySelectorAll("input, textarea, .fillAnswer input, .fillAnswer textarea")
      );
      if (!inputs.length) return false;
      let values = (answers || []).map((a) => String(a == null ? "" : a).trim()).filter(Boolean);
      if (values.length < inputs.length) {
        const flat = [];
        values.forEach((v) => v.split(/[,，、;；|]+/).forEach((p) => {
          if (p.trim()) flat.push(p.trim());
        }));
        if (flat.length > values.length) values = flat;
      }
      let filledCount = 0;
      inputs.forEach((input, index) => {
        const value = values[index];
        if (!value) return;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        if (input.value === value) filledCount += 1;
      });
      return filledCount > 0 && filledCount === inputs.length;
    };
    const isInputChecked = (i) => i.checked === true || (i.getAttribute && i.getAttribute("checked")) != null;
    const choiceOptionSelected = (el) => {
      var _b;
      if (!el) return false;
      const inputs = el.querySelectorAll ? [...el.querySelectorAll('input[type="radio"], input[type="checkbox"]')] : [];
      if (inputs.some((i) => isInputChecked(i))) return true;
      if (((_b = el.getAttribute) == null ? void 0 : _b.call(el, "aria-checked")) === "true") return true;
      const tokens = String(el.className || "").toLowerCase().split(/\s+/);
      return tokens.some((t) => t === "is-checked" || t === "ischecked" || t === "checked");
    };
    const choiceOptionSig = (el) => {
      var _b;
      const inputs = el.querySelectorAll ? [...el.querySelectorAll('input[type="radio"], input[type="checkbox"]')] : [];
      return [
        String(el.className || ""),
        ((_b = el.getAttribute) == null ? void 0 : _b.call(el, "aria-checked")) || "",
        inputs.map((i) => isInputChecked(i) ? 1 : 0).join("")
      ].join("|");
    };
    // 答案可能是「A. 正文, B. 正文…」这样被拼成一条的：先按「字母+分隔符」拆成多项，
    // 否则多选题只会认到其中一项（其余选项匹配不上，表现就是只勾一个）
    const normalizeChoiceAnswerList = (answers) => {
      const list = (Array.isArray(answers) ? answers : [answers]).map((a) => String(a == null ? "" : a).trim()).filter(Boolean);
      // 每一项都试着拆：后端偶尔会把两三选项挤在同一条里（"D.甲 E.乙"），只拆整条拼串的那种会漏
      const splitItem = (text) => {
        const parts = text.split(/(?=[A-Za-z]\s*[.、．)）:：]\s*\S)/)
          .map((s) => s.replace(/^[,，、;；\s]+/, "").trim()).filter(Boolean);
        const allPrefixed = parts.length > 1 && parts.every((p) => /^[A-Za-z]\s*[.、．)）:：]/.test(p));
        return allPrefixed ? parts : [text];
      };
      const out = [];
      list.forEach((item) => {
        splitItem(item).forEach((part) => {
          if (!out.includes(part)) out.push(part);
        });
      });
      return out;
    };
    const fillChoice = async (question, answers) => {
      var _a2;
      answers = normalizeChoiceAnswerList(answers);
      const optionSelector = question.optionSelector || "";
      const pickOptions = (root) => queryAllSafe(root, optionSelector).filter((option) => {
        if (cleanText(option.textContent)) return true;
        return !!(option.querySelector && option.querySelector("img"));
      });
      const optionEls = ((_a2 = question.optionEls) == null ? void 0 : _a2.length) ? question.optionEls : Array.from(
        (question.element || document).querySelectorAll(
          ".optionUl label, label.user-select.group, .radio-view li.clearfix, .checkbox-views label.el-checkbox, label, [role='radio'], [role='checkbox']"
        )
      );
      const questionRoot = () => {
        const root = question.element;
        return root && root.isConnected !== false ? root : document;
      };
      // 页面每勾一项都可能重新渲染，点击前按索引重新取一次，避免点在被替换掉的旧节点上（旧节点点了没反应，就会漏选）
      const resolveOption = (idx) => {
        const root = questionRoot();
        if (optionSelector && root && root.querySelectorAll) {
          const live = pickOptions(root);
          if (live.length === optionEls.length && live[idx]) return live[idx];
        }
        const cached = optionEls[idx];
        if (cached && cached.isConnected !== false) return cached;
        const want = normalize((cached && cached.textContent) || "");
        if (optionSelector && want) {
          const hit = queryAllSafe(document, optionSelector).find((node) => normalize(node.textContent) === want);
          if (hit) return hit;
        }
        return null;
      };
      let selected = false;
      const normalizedAnswers = answers.map((answer) => normalize(answer));
      const judgementAnswer = normalizedAnswers[0];
      // 收集答案中的图片 URL：提取 <img src="...">（超星 CDN 部分图 URL 无扩展名）+ 带扩展名的裸 URL
      const answerImgs = [];
      answers.forEach(a => {
        const s = String(a || "");
        const imgSrcRe = /<img[^>]+src=["']([^"']+)["']/gi;
        let imgM;
        while ((imgM = imgSrcRe.exec(s))) { if (!answerImgs.includes(imgM[1])) answerImgs.push(imgM[1]); }
        const bareImg = s.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp)/i);
        if (bareImg && !answerImgs.includes(bareImg[0])) answerImgs.push(bareImg[0]);
      });
      // 保留原始答案文本用于子串匹配
      const rawAnswers = answers.map(a => String(a).trim()).filter(Boolean);
      // 纯字母答案收集：["A","B","D"] 或紧凑串 ["ABD"] → 按索引映射（A=第1个选项）
      // 紧凑串仅在不等于任何选项文本时才按字母拆，避免把单词选项误拆成字母
      const letterAnswers = [];
      let letterItemCount = 0;
      answers.forEach(a => {
        const t = String(a || "").trim();
        // "A. 以人民安全为宗旨" / "B、政治安全" 这类「字母 + 分隔符 + 选项正文」，
        // 直接按字母取；不这么处理就只能靠正文匹配，多选题经常只中最后一项
        const prefixed = t.match(/^([A-Za-z])\s*[.、．)）:：]\s*(\S[\s\S]*)$/);
        if (prefixed) {
          const idx = prefixed[1].toUpperCase().charCodeAt(0) - 65;
          const opt = optionEls[idx];
          const optText = opt ? normalize(opt.textContent) : "";
          const body = normalize(prefixed[2]);
          // 字母与选项正文对得上才按字母点，防止选项顺序被打乱时点错
          if (!optText || !body || optText.includes(body) || body.includes(optText)) {
            const letter = prefixed[1].toUpperCase();
            if (!letterAnswers.includes(letter)) letterAnswers.push(letter);
            letterItemCount += 1;
          }
        } else if (/^[A-Za-z]$/.test(t)) {
          if (!letterAnswers.includes(t.toUpperCase())) letterAnswers.push(t.toUpperCase());
          letterItemCount += 1;
        } else if (/^[A-Z]{2,10}$/.test(t) && [...t].every((c, i) => i === 0 || c > t[i - 1])) {
          const isOptionText = optionEls.some(op => normalize(op.textContent) === normalize(t));
          if (!isOptionText) {
            t.toUpperCase().split("").forEach(c => { if (!letterAnswers.includes(c)) letterAnswers.push(c); });
            letterItemCount += 1;
          }
        }
      });
      // 逐字母映射：越界的那个字母匹配不到选项自然跳过，不再一票否决整组字母答案
      const letterMappingOk = letterAnswers.length > 0;
      // 答案每一条都自带字母时就以字母为准。否则文字包含匹配会把「C.社会组织和公民个人」也算进来
      // （它的文字正好是 B 选项的一部分），单选题就会出现「答案是 B、脚本却勾了 C」
      const useLettersOnly = letterItemCount > 0 && letterItemCount >= answers.length;
      const isMultiChoice = question.type === "多选题" || /多选|X型|不定项/.test(question.type || "");
      // 最长公共片段占较短一方的比例：答案和选项文字只有标点、截断、全半角这类小差异时也能对上
      const lcsRatio = (a, b) => {
        if (!a || !b) return 0;
        const shortText = a.length <= b.length ? a : b;
        const longText = a.length <= b.length ? b : a;
        let best = 0;
        for (let i = 0; i < shortText.length; i += 1) {
          for (let j = i + best + 1; j <= shortText.length; j += 1) {
            const piece = shortText.slice(i, j);
            if (longText.includes(piece)) best = piece.length;
            else break;
          }
        }
        return best / shortText.length;
      };
      // 先算出「应该勾哪几项」，再统一去点：多选题点一下是勾、点两下是取消，
      // 边点边判很容易把已经勾上的又点掉，最后就缺项
      const targetIdx = new Set();
      optionEls.forEach((option, idx) => {
        const optionText = normalize(option.textContent);
        const isLetterMatched = letterMappingOk && letterAnswers.includes(String.fromCharCode(65 + idx));
        if (useLettersOnly) {
          if (isLetterMatched) targetIdx.add(idx);
          return;
        }
        const isJudgementMatched = question.type === "判断题" && (/^(正确|是|对|√|t|true|right)$/i.test(judgementAnswer) && /^(正确|是|对|√|t|true|right)$/i.test(optionText) || /^(错误|否|错|×|f|false|wrong)$/i.test(judgementAnswer) && /^(错误|否|错|×|f|false|wrong)$/i.test(optionText));
        if (isLetterMatched || normalizedAnswers.includes(optionText) || isJudgementMatched) {
          targetIdx.add(idx);
          return;
        }
        // 子串匹配兜底：答案可能含任何标点无法拆分，用选项文本在答案中查找包含关系
        if (optionText && optionText.length >= 2 && rawAnswers.some(raw => normalize(raw).includes(optionText))) {
          targetIdx.add(idx);
          return;
        }
        // 图片匹配：按 URL 最后一段（去查询串/扩展名）比对，兼容超星无扩展名 CDN 图
        if (answerImgs.length > 0) {
          const getImgKey = (url) => {
            const clean = String(url || "").split(/[?#]/)[0].replace(/\/+$/, "");
            const seg = (clean.split("/").pop() || clean).replace(/\.(jpg|jpeg|png|gif|webp)$/i, "");
            return seg.toLowerCase();
          };
          // 短 key（如 latex 公式图的数字段）只允许完全相等，防止 includes 误撞（912 vs 9120）
          const imgKeyMatch = (a, b) => a === b || (a.length >= 8 && b.length >= 8 && (a.includes(b) || b.includes(a)));
          const optionImgs = Array.from(option.querySelectorAll('img')).map(img => img.src || img.getAttribute('data-src') || '').filter(Boolean);
          let matched = false;
          for (const answerImg of answerImgs) {
            if (matched) break;
            const answerKey = getImgKey(answerImg);
            for (const optionImg of optionImgs) {
              const optionKey = getImgKey(optionImg);
              if (answerKey && optionKey && imgKeyMatch(answerKey, optionKey)) {
                matched = true;
                break;
              }
            }
          }
          if (matched) {
            targetIdx.add(idx);
            return;
          }
        }
        // 模糊兜底：答案文字和选项文字差一点点（截断、标点、全半角、多空格）就漏选，
        // 多选题最容易出现「答了 5 个只勾上 3 个」，这里按公共片段占比再认一次
        if (optionText.length >= 4 && normalizedAnswers.some((answer) => answer.length >= 4 && lcsRatio(optionText, answer) >= 0.85)) {
          targetIdx.add(idx);
        }
      });
      const letterOf = (idx) => String.fromCharCode(65 + idx);
      const lettersFrom = (set) => Array.from(set).map(letterOf).sort().join("");
      const indexes = optionEls.map((_, idx) => idx);
      // 页面到底能不能读出「已勾选」：只要能读到一个勾上的，就说明读得准，后面才敢补点
      let stateReadable = false;
      const readSelected = (idx) => {
        const el = resolveOption(idx);
        if (!el) return false;
        const selectedNow = choiceOptionSelected(el);
        if (selectedNow) stateReadable = true;
        return selectedNow;
      };
      const clickOnce = (idx) => {
        const el = resolveOption(idx);
        if (!el) return false;
        try {
          el.click();
          return true;
        } catch (_) {
          return false;
        }
      };
      // 第一遍：每个该勾的项只点一次，绝不补点，避免多选题被点成取消
      for (const idx of indexes) {
        if (!targetIdx.has(idx)) continue;
        if (readSelected(idx)) continue;
        clickOnce(idx);
        await sleep(0.15 + Math.random() * 0.1);
      }
      // 复核一遍：个别选项点了没反应（页面重绘把点击吃掉）时，只对「确实还是没勾上」的补点一次。
      // 页面读取不出勾选态时不做补点，否则会把已经勾上的又点掉。
      if (stateReadable) {
        const missing = Array.from(targetIdx).filter((idx) => !readSelected(idx));
        for (const idx of missing) {
          clickOnce(idx);
          await sleep(0.2);
        }
      }
      // 多选题：把不该勾的取消掉（同样只对确实勾着的动手）
      if (isMultiChoice) {
        for (const idx of indexes) {
          if (targetIdx.has(idx)) continue;
          if (!readSelected(idx)) continue;
          clickOnce(idx);
          await sleep(0.15);
        }
      }
      const targets = lettersFrom(targetIdx);
      const selectedNow = indexes.filter((idx) => readSelected(idx)).map(letterOf).join("");
      const actual = selectedNow;
      if (targets && actual && actual !== targets) {
        log.insertLog(`本题答案 ${targets}，实际只点上 ${actual}${targets.length > actual.length ? "（有选项没点上去）" : ""}`, "warning", 6);
      }
      return Array.from(targetIdx).some((idx) => actual.includes(letterOf(idx))) || (targets.length > 0 && actual.length === 0);
    };
    const fillQuestion = async (question) => {
      var _a2;
      const answers = ((_a2 = question.answer) == null ? void 0 : _a2.answer) || [];
      if (!answers.length) return false;
      if (isChoiceType(question.type)) return fillChoice(question, answers);
      return fillBlank(question, answers);
    };
    const searchAndFill = async (question) => {
      const { answerMode } = setting.config.basicConfig;
      const mode = answerMode.value;
      let handled = false;
      let bankFilled = false;
      const apiQuestion = toApiQuestion(question);
      if (mode !== "ai") {
        const answerData = await getAccurateAnswer(apiQuestion);
        if (answerData.code === 1 && answerData.data.multimatch) {
          // 手动选择模式：题库有多道相似题，交给用户挑，不自动填也不转 AI
          question.answer = { code: 0, answer: [], src: "pick", msg: "存在多道相似题，请先手动选择后再填写", candidates: answerData.data.candidates };
          const _idx = useQuestionStore().questionList.indexOf(question);
          if (getManualWaitMode() === "skip") {
            useLogStore().insertLog(`本题有${answerData.data.candidates.length}道相似题，已按设置跳过（本轮不自动提交）`, "warning", 6);
            return false;
          }
          useLogStore().insertLog(`本题有${answerData.data.candidates.length}道相似题，已暂停，等待你选择后继续…`, "warning", 8);
          const picked = _idx >= 0 ? await waitForManualPick(_idx) : null;
          if (!picked) {
            useLogStore().insertLog("本题等待选择超时，已跳过（本轮不自动提交）", "warning", 6);
            return false;
          }
          question.answer = Object.assign({}, question.answer, { code: 1, answer: picked });
          if (await fillQuestion(question)) {
            bankFilled = true;
            handled = true;
          }
          return true;
        }
        if (answerData.code === 1) {
          question.answer = { code: 1, answer: answerData.data.answer, src: answerData.data.src };
          setting.userInfo.remainCount = formatLocalRemainCount(answerData.data.remainCount);
          saveAnswerRecord({
            question: apiQuestion,
            answer: answerData.data.answer,
            source: "accurate"
          });
          if (await fillQuestion(question)) {
            bankFilled = true;
            handled = true;
          } else {
            question.answer.code = 0;
            question.answer.msg = "答案拿到了但没点上去";
          }
        } else if (mode === "questionBank" || answerData.code !== -1004) {
          // 错误情况：不将 msg 设为 answer，避免将"包月权益生效"等提示当作答案显示
          question.answer = { code: answerData.code, answer: [], msg: answerData.msg };
          handled = true;
        }
      }
      if (!handled) {
        if (isChoiceType(question.type)) {
          const aiAnswerData = await getAIAnswer(apiQuestion);
          if (aiAnswerData.code === 1) {
            question.answer = { code: 2, answer: aiAnswerData.data.answer, src: aiAnswerData.data.src || "ai" };
            setting.userInfo.remainCount = formatLocalRemainCount(aiAnswerData.data.remainCount);
            saveAnswerRecord({
              question: apiQuestion,
              answer: aiAnswerData.data.answer,
              source: "ai"
            });
          } else if (!(question.answer && question.answer.code === 0 && Array.isArray(question.answer.answer) && question.answer.answer.length)) {
            // 错误情况：不将 msg 设为 answer，避免将错误提示当作答案显示
            question.answer = { code: aiAnswerData.code, answer: [], msg: aiAnswerData.msg };
          } else if (!question.answer.msg) {
            question.answer.msg = "答案拿到了但没点上去";
          }
        } else {
          question.answer = { code: -1, answer: ["该题型不支持AI答题"] };
        }
      }
      if (bankFilled) return true;
      if ([1, 2].includes(question.answer.code)) {
        const filled = await fillQuestion(question);
        if (!filled) question.answer.code = 0;
        return filled;
      }
      return false;
    };
    const profile = await getActiveProfile();
    if (!profile) {
      log.insertLog("未识别到支持的题目区域，请确认页面已加载完成..", "warning");
      return;
    }
    log.insertLog(`进入${profile.name}页面，脚本开始工作..`);
    autoSetTab(setting, "1");
    questionStore.accuracy = -1;
    await ((_a = profile.beforeParse) == null ? void 0 : _a.call(profile));
    const answerSheetQuestions = profile.useAnswerSheet ? await waitForAnswerSheetQuestions() : [];
    if (answerSheetQuestions.length) {
      log.insertLog(`已从接口读取到${answerSheetQuestions.length}个题目元信息..`);
    } else if (profile.useAnswerSheet) {
      const answerSheetPayload = (_unsafeWindow || window)[ANSWER_SHEET_KEY];
      const { topKeys, candidateKeys } = answerSheetPayload ? describePayloadShape(answerSheetPayload) : { topKeys: [], candidateKeys: [] };
      log.insertLog(
        answerSheetPayload ? `已捕获考试接口但未提取到题目，顶层字段：${topKeys.join(",") || "无"}；候选字段：${candidateKeys.join(" | ") || "无"}` : "未捕获到考试题目信息接口，将回退到页面 DOM 解析..",
        "warning"
      );
    }
    const questions = [];
    let correctNum = 0;
    let emptyTries = 0;
    const handleCurrentPage = async () => {
      var _a2;
      await waitForQuestionTitle(profile);
      let rawQuestions = parseQuestions(profile);
      if (answerSheetQuestions.length) {
        const apiQuestion = answerSheetQuestions[questions.length];
        const domQuestion = rawQuestions[0] || {};
        rawQuestions = apiQuestion ? [
          {
            ...domQuestion,
            ...apiQuestion,
            type: detectMultiChoiceDom(domQuestion.element)
              ? "多选题"
              : (normalizeQuestionTypeName(apiQuestion.type || domQuestion.type) || "单选题"),
            title: apiQuestion.title || domQuestion.title,
            optionsText: ((_a2 = apiQuestion.optionsText) == null ? void 0 : _a2.length) ? apiQuestion.optionsText : domQuestion.optionsText || [],
            options: Object.keys(apiQuestion.options || {}).length ? apiQuestion.options : domQuestion.options || {},
            element: domQuestion.element || document,
            optionEls: domQuestion.optionEls || [],
            answer: { code: -1, answer: [] },
            workType: "zhs",
            refer: location.href,
            id: apiQuestion.questionId || "zhs"
          }
        ] : [];
      }
      const pageQuestions = rawQuestions.filter((question) => question.title || (question.element && question.element.querySelector && question.element.querySelector("img")));
      if (!pageQuestions.length) {
        // 题目是接口异步拉来的，前面几次解析不到很正常，只在第一次记详细情况，别刷屏
        if (emptyTries === 0) {
          const rootTexts = Array.from(document.querySelectorAll(profile.root)).map(
            (root) => {
              var _a3;
              return (_a3 = root.textContent) == null ? void 0 : _a3.replace(/\s+/g, " ").trim().slice(0, 80);
            }
          );
          const buttons = Array.from(document.querySelectorAll("button")).map((button) => {
            var _a3;
            return (_a3 = button.textContent) == null ? void 0 : _a3.replace(/\s+/g, " ").trim();
          }).filter(Boolean).slice(0, 20);
          log.insertLog(
            `题目区域数量：${rawQuestions.length}，选项数量：${rawQuestions.reduce(
            (sum, question) => sum + question.optionsText.length,
            0
          )}，题目区域文本：${rootTexts.join(" | ") || "空"}，按钮：${buttons.join(" / ") || "无"}`,
            "warning"
          );
        }
        emptyTries += 1;
      }
      if (!pageQuestions.length) return false;
      questions.push(...pageQuestions);
      questionStore.questionList = [...questions];
      log.insertLog(`当前页面解析到${pageQuestions.length}个题目..`);
      for (const question of pageQuestions) {
        const questionIndex = questions.indexOf(question);
        questionStore.currentQuestionIndex = questionIndex;
        questionStore.questionList = [...questions];
        const filled = await searchAndFill(question);
        if (filled) correctNum += 1;
        questionStore.currentQuestionIndex = questionIndex + 1;
        questionStore.questionList = [...questions];
        await sleep(1.5 + Math.random() * 2.5);
      }
      return true;
    };
    autoSetTab(setting, "2");
    await sleep(1 + Math.random() * 2);
    let previousTitle = "";
    let parsedOnce = false;
    // 这版考试页是进页面之后才用接口拉题的：题目区先出现、内容后到。
    // 以前解析一次为空就直接收工，表现就是「明明有题却提示未检测到试题」，必须手动刷新页面。
    // 现在首题没解析到就每秒重试，最多等 60 秒。
    const parseDeadline = Date.now() + 6e4;
    while (true) {
      const parsed = await handleCurrentPage();
      if (!parsed) {
        if (!parsedOnce && Date.now() < parseDeadline) {
          await sleep(1);
          continue;
        }
        break;
      }
      parsedOnce = true;
      if (!profile.nextButton) break;
      const nextButton = typeof profile.nextButton === "function" ? profile.nextButton() : document.querySelector(profile.nextButton);
      if (!nextButton || nextButton.classList.contains("disabled")) break;
      const currentTitle = ((_b = questions[questions.length - 1]) == null ? void 0 : _b.title) || "";
      if (currentTitle && currentTitle === previousTitle) break;
      previousTitle = currentTitle;
      nextButton.click();
      await sleep(1.5 + Math.random() * 2);
    }
    if (!questions.length) {
      log.insertLog("等了 60 秒仍未解析到题目，请确认页面已加载完成，或手动刷新一次..", "warning");
      return;
    }
    questionStore.currentQuestionIndex = questions.length;
    questionStore.accuracy = (correctNum / questions.length * 100).toFixed(1);
    reportAnswerSummary("zhs-h5", questions);
    log.insertLog(
      `答题完毕,正确率为${questionStore.accuracy}%,详情请前往<span class='module'>答题</span>模块查看..`
    );
    // 智慧树作业/考试脚本从不代替交卷，提醒一句，免得以为已经交掉了
    log.insertLog("已填完全部题目，请核对答案后手动提交", "warning");
    setTimeout(() => {
      autoSetTab(setting, "1");
    }, 2e3);
  };
  const specialStudyLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let finishTimer = null;
    let visibilityTimer = null;
    let isSwitching = false;
    let visibilityWarned = false;
    const pageProfiles = [
      {
        name: "校内课",
        list: ".file-item",
        current: ".file-item.active",
        title: "#sourceTit",
        done: ".icon-finish",
        media: "#mediaPlayer, video, audio",
        needsStudy: (item) => !item.querySelector(".icon-finish")
      },
      {
        name: "教学空间AI智慧课程",
        list: ".source-icon",
        current: ".active-file",
        title: ".active-file",
        done: "i.select",
        media: "video, audio",
        mapItem: (icon) => {
          var _a;
          return (_a = icon.parentElement) == null ? void 0 : _a.parentElement;
        },
        needsStudy: (item) => !item.querySelector("i.select")
      },
      {
        name: "教学空间AI智慧课程",
        list: ".el-tree-node",
        current: ".el-tree-node.is-current",
        title: ".file-name",
        done: "label.success",
        media: "video, audio",
        filter: (item) => {
          var _a;
          return !((_a = item.querySelector(".el-tree-node__children")) == null ? void 0 : _a.children.length);
        },
        needsStudy: (item) => !item.querySelector("label.success")
      }
    ];
    const waitFor = (target, timeout = 1e4, interval = 300) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const result = typeof target === "function" ? target() : document.querySelector(target);
          if (result) {
            clearInterval(check);
            resolve(result);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("等待页面内容加载超时"));
          }
        }, interval);
      });
    };
    const clickEl = async (el) => {
      var _a, _b, _c;
      if (!el) return false;
      (_a = el.scrollIntoView) == null ? void 0 : _a.call(el, { behavior: "smooth", block: "center" });
      await sleep(0.2);
      (_b = el.click) == null ? void 0 : _b.call(el);
      (_c = el.dispatchEvent) == null ? void 0 : _c.call(el, new MouseEvent("click", { bubbles: true }));
      return true;
    };
    const getProfile = () => pageProfiles.find((profile) => document.querySelector(profile.list));
    const getItems = (profile) => Array.from(document.querySelectorAll(profile.list)).map((item) => {
      var _a;
      return ((_a = profile.mapItem) == null ? void 0 : _a.call(profile, item)) || item;
    }).filter(Boolean).filter((item) => !profile.filter || profile.filter(item));
    const getCurrentItem = (profile) => {
      var _a;
      return ((_a = document.querySelector(profile.current)) == null ? void 0 : _a.closest(profile.list)) || getItems(profile).find((item) => {
        var _a2;
        return (_a2 = item.matches) == null ? void 0 : _a2.call(item, profile.current);
      }) || null;
    };
    const getTitle = (item, profile) => {
      var _a, _b, _c, _d, _e;
      return ((_b = (_a = item == null ? void 0 : item.querySelector(profile.title)) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_d = (_c = document.querySelector(profile.title)) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || ((_e = item == null ? void 0 : item.textContent) == null ? void 0 : _e.trim()) || "未知章节";
    };
    const getReadableDocuments = () => {
      const docs = [document];
      Array.from(document.querySelectorAll("iframe")).forEach((iframe) => {
        try {
          if (iframe.contentDocument) docs.push(iframe.contentDocument);
        } catch {
        }
      });
      return docs;
    };
    const isMediaElement = (el) => ["VIDEO", "AUDIO"].includes(el == null ? void 0 : el.tagName);
    const hasPlayableSource = (media) => {
      var _a;
      return Boolean(
        (media == null ? void 0 : media.currentSrc) || (media == null ? void 0 : media.src) || ((_a = media == null ? void 0 : media.querySelector) == null ? void 0 : _a.call(media, "source")) || (media == null ? void 0 : media.readyState) > 0
      );
    };
    const findMediaElement = (selector) => {
      var _a;
      for (const doc of getReadableDocuments()) {
        const candidates = Array.from(doc.querySelectorAll(selector));
        for (const candidate of candidates) {
          const media = isMediaElement(candidate) ? candidate : (_a = candidate.querySelector) == null ? void 0 : _a.call(candidate, "video, audio");
          if (media && (hasPlayableSource(media) || isMediaElement(media))) {
            return media;
          }
        }
        const fallback = doc.querySelector("video, audio");
        if (fallback && (hasPlayableSource(fallback) || isMediaElement(fallback))) {
          return fallback;
        }
      }
      return null;
    };
    const getNextItem = (profile) => {
      const items = getItems(profile).filter((item) => profile.needsStudy(item));
      if (!items.length) return null;
      const current = getCurrentItem(profile);
      const currentIndex = items.indexOf(current);
      return currentIndex >= 0 ? items[currentIndex + 1] : items[0];
    };
    const cleanupVideo = () => {
      if (!videoEl) return;
      videoEl.onpause = null;
      videoEl.onended = null;
      videoEl = null;
    };
    const playMedia = async (profile) => {
      var _a;
      cleanupVideo();
      try {
        videoEl = await waitFor(() => {
          return findMediaElement(profile.media);
        }, 15e3);
        videoEl.volume = 0;
        videoEl.muted = true;
        log.insertLog(`正在学习：${getTitle(getCurrentItem(profile), profile)}`);
        (_a = videoEl.play) == null ? void 0 : _a.call(videoEl).catch(() => {
        });
        videoEl.onpause = () => {
          if (!videoEl || videoEl.ended || isSwitching) return;
          setTimeout(() => {
            var _a2;
            return (_a2 = videoEl == null ? void 0 : videoEl.play) == null ? void 0 : _a2.call(videoEl).catch(() => {
            });
          }, 1e3);
        };
        videoEl.onended = async () => {
          await sleep(3);
          await nextItem(profile);
        };
      } catch (error) {
        log.insertLog(`${error.message || "未找到音视频"}，尝试切换下一节..`, "warning");
        await sleep(3);
        await nextItem(profile);
      }
    };
    const nextItem = async (profile) => {
      if (isSwitching) return;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      isSwitching = true;
      cleanupVideo();
      const next = getNextItem(profile);
      if (!next) {
        reportCourseResult("done", "章节视频全部完成");
        log.insertLog("所有章节视频已完成！");
        isSwitching = false;
        return;
      }
      log.insertLog(`跳转到: ${getTitle(next, profile)}`);
      await clickEl(next);
      await sleep(5);
      isSwitching = false;
      await playMedia(profile);
    };
    const startPolling = (profile) => {
      finishTimer = setInterval(() => {
        if (isSwitching) return;
        const current = getCurrentItem(profile);
        if (current && !profile.needsStudy(current)) nextItem(profile);
      }, 2e3);
      visibilityTimer = setInterval(() => {
        if (document.visibilityState === "hidden" && !visibilityWarned) {
          visibilityWarned = true;
          log.insertLog("页面未保持前台，学习流程可能无法正常推进..", "warning");
        } else if (document.visibilityState === "visible") {
          visibilityWarned = false;
        }
      }, 1e3);
    };
    const start = async () => {
      autoSetTab(setting, "1");
      if (location.href.includes("ai-course-center") || !location.href.includes("resource") && location.href.includes("tools-hike")) {
        log.insertLog("请手动进入具体学习资源页面，进入后将自动处理..", "warning");
        return;
      }
      await sleep(5);
      const profile = getProfile();
      if (!profile) {
        log.insertLog("未识别到支持的章节列表，请确认页面已加载完成..", "warning");
        return;
      }
      log.insertLog(`进入智慧树${profile.name}学习页面，脚本开始工作..`);
      startPolling(profile);
      await playMedia(profile);
    };
    start();
    return () => {
      cleanupVideo();
      if (finishTimer) clearInterval(finishTimer);
      if (visibilityTimer) clearInterval(visibilityTimer);
    };
  };
  const wisdomStudyLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let videoCheckTimer = null;
    let quizCheckTimer = null;
    let progressBarTimer = null;
    let visibilityTimer = null;
    let finishMonitorTimer = null;
    let lastReplayAt = 0;
    let visibilityWarned = false;
    let isSwitching = false;
    let isHandlingQuiz = false;
    let isStoppedByStudyTimeWarn = false;
    let hasLoggedPlaybackRate = false;
    const RELOAD_COUNT_KEY = "abc-zhs-wisdom-study-reload-count";
    const waitFor = (target, timeout = 1e4, interval = 300) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const result = typeof target === "function" ? target() : document.querySelector(target);
          if (result) {
            clearInterval(check);
            resolve(result);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("等待页面内容加载超时"));
          }
        }, interval);
      });
    };
    const clickEl = async (el) => {
      var _a;
      if (!el) return false;
      (_a = el.scrollIntoView) == null ? void 0 : _a.call(el, { behavior: "smooth", block: "center" });
      await sleep(0.2);
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const target = document.elementFromPoint(x, y) || el;
      const eventOptions = {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: 1
      };
      target.dispatchEvent(new MouseEvent("mousemove", eventOptions));
      target.dispatchEvent(new MouseEvent("mousedown", eventOptions));
      target.dispatchEvent(new MouseEvent("mouseup", { ...eventOptions, buttons: 0 }));
      target.dispatchEvent(new MouseEvent("click", { ...eventOptions, buttons: 0 }));
      return true;
    };
    const clickNativeFirst = async (el) => {
      var _a, _b, _c;
      if (!el) return false;
      (_a = el.scrollIntoView) == null ? void 0 : _a.call(el, { behavior: "smooth", block: "center" });
      await sleep(0.2);
      const beforeClass = el.className;
      const beforeChecked = (_b = el.querySelector("input")) == null ? void 0 : _b.checked;
      el.click();
      await sleep(0.2);
      const afterChecked = (_c = el.querySelector("input")) == null ? void 0 : _c.checked;
      if (el.className !== beforeClass || afterChecked !== beforeChecked) return true;
      return clickEl(el);
    };
    const getConfiguredRate = () => {
      const rate = Number(setting.config.basicConfig.videoPlayrate.value);
      return Math.min(rate || 1, 1.8);
    };
    const getReloadCount = () => Number(sessionStorage.getItem(RELOAD_COUNT_KEY) || 0);
    const setReloadCount = (count) => {
      sessionStorage.setItem(RELOAD_COUNT_KEY, String(count));
    };
    const fixProcessBar = () => {
      const bar = document.querySelector(".controlsBar");
      if (!bar) return;
      bar.style.display = "block";
      bar.style.zIndex = "2";
      bar.style.overflow = "";
    };
    const waitForCaptcha = async () => {
      if (!document.querySelector(".yidun_popup")) return true;
      log.insertLog("检测到验证码，请完成验证后继续..", "warning");
      try {
        await waitFor(() => !document.querySelector(".yidun_popup"), 5 * 60 * 1e3, 1e3);
        log.insertLog("验证码已完成，继续学习..");
        return true;
      } catch {
        log.insertLog("等待验证码完成超时，请手动刷新页面后继续..", "warning");
        return false;
      }
    };
    const getCourseName = () => {
      var _a, _b;
      const text = (_b = (_a = document.querySelector(".course-name")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
      return (text == null ? void 0 : text.replace(/^课程名称[:：]\s*/, "")) || "未知课程";
    };
    const getChapterName = (item) => {
      var _a;
      return ((_a = item == null ? void 0 : item.textContent) == null ? void 0 : _a.trim()) || "未知章节";
    };
    const getChapterItems = () => {
      let items = Array.from(document.querySelectorAll(".chapter-content .chapter-item"));
      items = items.map((el) => {
        const children = el.querySelectorAll(".chapter-content-second");
        return children.length ? Array.from(children) : [el];
      }).flat();
      return items.filter((el) => !el.querySelector(".finish-icon"));
    };
    const getCurrentChapter = () => document.querySelector(".chapter-content-second.current, .chapter-item.current");
    const getNextChapter = () => {
      const items = getChapterItems();
      if (!items.length) return null;
      const current = getCurrentChapter();
      const currentIndex = items.indexOf(current);
      return currentIndex >= 0 ? items[currentIndex + 1] : items[0];
    };
    const closeMasteryDialog = async () => {
      const dialog = document.querySelector(".masterylevel-body");
      if (!dialog) return false;
      await clickEl(document.querySelector(".header-box .close-box"));
      try {
        await waitFor(() => !document.querySelector(".masterylevel-body"), 1e4, 200);
      } catch {
        log.insertLog("等待掌握度弹窗关闭超时，尝试继续切换..", "warning");
      }
      return true;
    };
    const dismissBlockingDialogs = async (log2) => {
      const overlays = Array.from(document.querySelectorAll(".el-overlay,.el-dialog"));
      if (!overlays.length) return;
      const closeSelectors = [
        ".el-dialog__headerbtn",
        ".el-dialog__header .el-dialog__close",
        ".header-box .close-box",
        ".header-icon"
      ];
      for (const overlay of overlays) {
        let clicked = false;
        for (const sel of closeSelectors) {
          const btn = overlay.querySelector(sel) || overlay.closest(".el-overlay")?.querySelector(sel);
          if (btn && btn.isConnected) {
            btn.click();
            clicked = true;
            break;
          }
        }
        if (!clicked && overlay.style.display !== "none") {
          overlay.style.display = "none";
          log2?.insertLog("弹窗无关闭按钮，已隐藏以免遮挡..", "warning");
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    };
    const hasStudyTimeWarnDialog = () => Array.from(document.querySelectorAll(".el-overlay .content")).some(
      (el) => {
        var _a;
        return (_a = el.textContent) == null ? void 0 : _a.includes("保持良好的学习习惯");
      }
    );
    const handleStudyTimeWarnDialog = () => {
      if (!hasStudyTimeWarnDialog()) return false;
      isStoppedByStudyTimeWarn = true;
      log.insertLog(
        "检测到学习习惯提示弹窗，已暂停自动切换，请手动处理后刷新页面继续..",
        "warning"
      );
      return true;
    };
    // AI 随堂练习：选项是自绘组件，点击后选中态可能落在 class / input / aria 上，逐个位置都查一遍
    const isQuizOptionPicked = (el) => {
      if (!el) return false;
      const input = el.querySelector('input[type="radio"], input[type="checkbox"]');
      if (input && input.checked) return true;
      if (el.getAttribute("aria-checked") === "true") return true;
      return /(^|\s)(active|checked|selected|is-checked|is-active|el-radio__input--checked|el-checkbox__input--checked)(\s|$)/.test(el.className || "");
    };
    const normQuizAnswer = (s) => String(s || "").replace(/^[A-Za-z][.、．):：]\s*/, "").replace(/[（()）。，,、\s]/g, "").toLowerCase();
    const pickQuizOptionIndexes = (answers, optionTexts, type) => {
      const result = new Set();
      const texts = optionTexts.map(normQuizAnswer);
      const judgeIndex = (v) => {
        const s = String(v || "").trim();
        if (/^(对|正确|是|√|T|true|A)$/i.test(s)) return 0;
        if (/^(错|错误|否|×|F|false|B)$/i.test(s)) return 1;
        return -1;
      };
      if (type === "判断题") {
        const j = judgeIndex(answers[0]);
        if (j >= 0 && j < optionTexts.length) result.add(j);
        return Array.from(result);
      }
      for (const answer of answers) {
        const a = String(answer || "").trim();
        if (!a) continue;
        if (/^[A-Za-z]{1,8}$/.test(a)) {
          a.toUpperCase().split("").forEach((ch) => {
            const i = ch.charCodeAt(0) - 65;
            if (i >= 0 && i < optionTexts.length) result.add(i);
          });
          continue;
        }
        const prefixed = a.match(/^([A-Za-z])[.、．)）:：]\s*(.+)$/);
        if (prefixed) {
          const i = prefixed[1].toUpperCase().charCodeAt(0) - 65;
          if (i >= 0 && i < optionTexts.length) result.add(i);
          continue;
        }
        const n = normQuizAnswer(a);
        if (!n) continue;
        const hit = texts.findIndex((t) => t && (t === n || t.includes(n) || n.includes(t)));
        if (hit >= 0) result.add(hit);
      }
      return Array.from(result);
    };
    // 先点选项本身，没反应再点整行（自绘组件常把点击绑在外层 label 上）
    const clickQuizOption = async (el) => {
      if (!el) return;
      await clickNativeFirst(el);
      if (!isQuizOptionPicked(el)) {
        const row = el.closest("label, li, .item-row, .option-row") || el.parentElement;
        if (row && row !== el) await clickNativeFirst(row);
      }
    };
    const handleQuizDialog = async () => {
      if (isHandlingQuiz) return;
      const dialog = document.querySelector(".ai-class-exercise-dialog");
      if (!dialog) return;
      isHandlingQuiz = true;
      try {
        const items = Array.from(dialog.querySelectorAll(".ques-list .item"));
        const optionsAll = Array.from(dialog.querySelectorAll(".ques-list .item .option"));
        log.insertLog(`检测到随堂练习弹窗${items.length > 1 ? `（${items.length} 题）` : ""}`);
        if (optionsAll.length) {
          const captchaPassed = await waitForCaptcha();
          if (!captchaPassed) return;
          const targets = items.length ? items : [dialog];
          let answered = 0;
          for (const item of targets) {
            const options = Array.from(item.querySelectorAll(".option"));
            if (!options.length) continue;
            const optionTexts = options.map((el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim());
            const fullText = (item.innerText || item.textContent || "").replace(/\s+/g, " ").trim();
            // 题干 = 整题文字去掉选项文字，避免把选项混进题目去搜答案
            let title = fullText;
            optionTexts.forEach((t) => {
              if (t) title = title.replace(t, " ");
            });
            title = title.replace(/\s+/g, " ").trim();
            const isMulti = /多选|多项选择|不定项/.test(fullText);
            const type = isMulti ? "多选题" : /判断/.test(fullText) ? "判断题" : "单选题";
            let picked = [];
            try {
              const data = await getAccurateAnswer({ title, options: optionTexts, type, workType: "zhs" });
              if (data && data.code === 1 && Array.isArray(data.data.answer)) {
                picked = pickQuizOptionIndexes(data.data.answer, optionTexts, type);
              }
            } catch (_) {}
            if (!picked.length) {
              // 实在查不到才随机点一个，至少不卡住视频
              picked = [Math.floor(Math.random() * options.length)];
              log.insertLog("这道随堂练习没查到答案，先随机选一个占位", "warning", 4);
            } else {
              answered++;
            }
            const pickedSet = new Set(picked);
            const order = Array.from(pickedSet).sort((a, b) => a - b);
            const list = isMulti ? order : [order[0]];
            for (const idx of list) {
              const el = options[idx];
              if (!el) continue;
              await clickQuizOption(el);
              await sleep(0.25);
            }
            // 多选题补点：没点上的再点整行一次，避免只选上一个
            if (isMulti) {
              for (const idx of order) {
                const el = options[idx];
                if (el && !isQuizOptionPicked(el)) {
                  const row = el.closest("label, li, .item-row, .option-row") || el.parentElement;
                  if (row && row !== el) await clickNativeFirst(row);
                }
              }
            }
            await sleep(0.3);
          }
          if (answered) log.insertLog(`随堂练习已按题库答案作答（${answered} 题）`);
        }
        const submitBtn = dialog.querySelector(".el-dialog__footer .el-button.btn");
        if (submitBtn) {
          await clickNativeFirst(submitBtn);
          await sleep(1);
        }
        const closeBtn = dialog.querySelector(".header-icon");
        if (closeBtn) await clickNativeFirst(closeBtn);
        log.insertLog("随堂练习弹窗已完成");
      } finally {
        await sleep(1);
        isHandlingQuiz = false;
      }
    };
    const switchPlaybackRate = async (rate) => {
      if (!videoEl) return;
      videoEl.playbackRate = rate;
      if (!hasLoggedPlaybackRate) {
        hasLoggedPlaybackRate = true;
        log.insertLog(`已设置播放倍速: ${rate}x`);
      }
    };
    const switchDefinition = async () => {
      const controlsBar = document.querySelector(".controlsBar");
      if (controlsBar) controlsBar.style.display = "block";
    };
    const cleanupVideo = () => {
      if (videoCheckTimer) {
        clearInterval(videoCheckTimer);
        videoCheckTimer = null;
      }
      if (videoEl) {
        videoEl.onpause = null;
        videoEl.onended = null;
        videoEl = null;
      }
    };
    const replayCurrentVideo = async () => {
      if (!(videoEl == null ? void 0 : videoEl.isConnected) || !videoEl.ended) return;
      const now = Date.now();
      if (now - lastReplayAt < 8e3) return;
      lastReplayAt = now;
      try {
        videoEl.currentTime = 1;
        await switchPlaybackRate(getConfiguredRate());
        await videoEl.play();
        log.insertLog("当前节点尚未出现完成标记，已重新播放当前视频..", "warning");
      } catch {
        log.insertLog("重新播放当前视频失败，等待下次检查..", "warning");
      }
    };
    const handleLoadFailure = async (error) => {
      log.insertLog(`${error.message || "视频加载失败"}，即将刷新页面重试..`, "warning");
      const reloadCount = getReloadCount();
      if (reloadCount >= 3) {
        setReloadCount(0);
        log.insertLog("视频加载多次失败，请检查网络或手动刷新页面..", "warning");
        return;
      }
      setReloadCount(reloadCount + 1);
      setTimeout(() => {
        location.reload();
      }, 3e3);
    };
    const playVideo = async () => {
      if (isStoppedByStudyTimeWarn) return;
      const captchaPassed = await waitForCaptcha();
      if (!captchaPassed) return;
      cleanupVideo();
      try {
        fixProcessBar();
        await switchDefinition();
        await sleep(1);
        videoEl = await waitFor(() => {
          const media = document.querySelector("video, audio");
          return (media == null ? void 0 : media.src) ? media : null;
        }, 15e3, 300);
        setReloadCount(0);
        lastReplayAt = 0;
        videoEl.currentTime = Math.max(videoEl.currentTime, 1);
        videoEl.volume = 0;
        videoEl.muted = true;
        await switchPlaybackRate(getConfiguredRate());
        const current = getCurrentChapter();
        log.insertLog(`正在学习：${getChapterName(current)}`);
        videoEl.play().catch(() => {
        });
        videoCheckTimer = setInterval(() => {
          if (!(videoEl == null ? void 0 : videoEl.isConnected)) {
            cleanupVideo();
            setTimeout(playVideo, 1500);
          }
        }, 3e3);
        videoEl.onpause = () => {
          if (!videoEl || videoEl.ended || isSwitching) return;
          setTimeout(() => {
            var _a;
            return (_a = videoEl == null ? void 0 : videoEl.play) == null ? void 0 : _a.call(videoEl).catch(() => {
            });
          }, 1e3);
        };
        videoEl.onended = async () => {
          if (isSwitching) return;
          log.insertLog("当前视频播放完毕，等待平台标记完成..");
        };
      } catch (error) {
        await handleLoadFailure(error);
      }
    };
    const nextChapter = async () => {
      if (isSwitching || isStoppedByStudyTimeWarn) return;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      isSwitching = true;
      cleanupVideo();
      const hidden = document.querySelector(".chapter-wrapper.hidden");
      if (hidden) await clickEl(document.querySelector(".collapse-box") || hidden);
      document.querySelectorAll(".el-collapse-item__wrap").forEach((el) => {
        el.style.display = "";
      });
      await sleep(0.2);
      if (handleStudyTimeWarnDialog()) {
        isSwitching = false;
        return;
      }
      await closeMasteryDialog();
      const next = getNextChapter();
      if (!next) {
        reportCourseResult("done", "章节视频全部完成");
        log.insertLog("所有章节视频已完成！");
        isSwitching = false;
        return;
      }
      await clickEl(next);
      next.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(5);
      isSwitching = false;
      playVideo();
    };
    const startPolling = () => {
      quizCheckTimer = setInterval(async () => {
        await closeMasteryDialog();
        await handleQuizDialog();
      }, 3e3);
      progressBarTimer = setInterval(fixProcessBar, 1e3);
      finishMonitorTimer = setInterval(() => {
        if (isSwitching || isStoppedByStudyTimeWarn) return;
        const current = getCurrentChapter();
        if (!(current == null ? void 0 : current.querySelector(".finish-icon"))) {
          replayCurrentVideo();
          return;
        }
        nextChapter();
      }, 2e3);
      visibilityTimer = setInterval(() => {
        if (document.visibilityState === "hidden" && !visibilityWarned) {
          visibilityWarned = true;
          log.insertLog("页面未保持前台，学习流程可能无法正常推进..", "warning");
        } else if (document.visibilityState === "visible") {
          visibilityWarned = false;
        }
      }, 1e3);
    };
    const start = async () => {
      log.insertLog(`进入智慧树新智慧学习页面（${getCourseName()}），脚本开始工作..`);
      autoSetTab(setting, "1");
      await sleep(5);
      try {
        await waitFor(".video-play", 2e4);
      } catch {
        log.insertLog("等待视频区域加载超时，尝试继续处理..", "warning");
      }
      dismissBlockingDialogs(log);
      startPolling();
      playVideo();
    };
    start();
    return () => {
      cleanupVideo();
      if (quizCheckTimer) clearInterval(quizCheckTimer);
      if (progressBarTimer) clearInterval(progressBarTimer);
      if (finishMonitorTimer) clearInterval(finishMonitorTimer);
      if (visibilityTimer) clearInterval(visibilityTimer);
    };
  };
/* ==================== 青书学堂 / 出头科技（接口直通模块） ====================
 * 接入方式：全部走平台自己的 HTTP 接口 + 页面上下文请求（带 Cookie），
 * 不注入第三方依赖，不改动超星 / 智慧树 的任何逻辑。
 * 青书：学习时长上报、作业取题与保存；默认不自动交卷。
 * 出头：章节学习时长上报、考试取题与点选。
 */
const XS_EXT = (() => {
  'use strict';

  /* ------------------------------ 通用工具 ------------------------------ */
  const EXT_CONF = {
    minGapMs: 10000,        // 两次接口请求最小间隔
    requestTimeout: 30000,
    studyStepSec: 120,      // 青书每次上报的学习时长（秒）
    studyScorePoll: 5,      // 青书每上报 N 次读一次分数
    studyMaxMinutes: 180,   // 青书单次挂机上限
    ctStepSec: 60,          // 出头每个打包片段的学习时长（秒）
    ctMaxChapters: 30,      // 出头单次最多处理的章节数
    ctMinGapMs: 1500,       // 出头接口间隔（比青书宽松，平台限流不同）
    autoSubmit: false,      // 作业 / 考试是否自动交卷（默认关闭）
    autoFillExam: true      // 出头考试是否自动点选（点完逐题核对，点不中退回提示）
  };

  const extLog = (text, type) => {
    try { useLogStore().insertLog(text, type || null); } catch (e) { /* ignore */ }
  };
  const extSleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const extText = (value) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();

  /** 页面上下文 XHR：带 Cookie，避免 GM_xmlhttpRequest 丢登录态 */
  function extFetch(url, opts = {}) {
    return new Promise((resolve, reject) => {
      let Xhr;
      try { Xhr = (_unsafeWindow && _unsafeWindow.XMLHttpRequest) || XMLHttpRequest; }
      catch (e) { Xhr = XMLHttpRequest; }
      const xhr = new Xhr();
      xhr.open(opts.method || 'GET', url, true);
      try { xhr.withCredentials = true; } catch (e) { /* ignore */ }
      const headers = opts.headers || {};
      Object.keys(headers).forEach((key) => {
        try { if (headers[key] != null) xhr.setRequestHeader(key, headers[key]); } catch (e) { /* ignore */ }
      });
      xhr.timeout = opts.timeout || EXT_CONF.requestTimeout;
      xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText || '', raw: xhr });
      xhr.onerror = () => reject(new Error('网络连接失败'));
      xhr.ontimeout = () => reject(new Error('请求超时'));
      xhr.onabort = () => reject(new Error('请求已取消'));
      try { xhr.send(opts.body == null ? null : opts.body); }
      catch (e) { reject(e); }
    });
  }

  /** 全局串行 + 最小间隔，避免触发平台限流 */
  let extChain = Promise.resolve();
  let extNextAt = 0;
  function extPaced(run, gapMs) {
    const task = async () => {
      const wait = extNextAt - Date.now();
      if (wait > 0) await extSleep(wait);
      try { return await run(); }
      finally { extNextAt = Date.now() + (gapMs || EXT_CONF.minGapMs); }
    };
    const promise = extChain.then(task, task);
    extChain = promise.catch(() => {});
    return promise;
  }

  function extRandomId() {
    const rand = () => Math.random().toString(16).slice(2, 10);
    return `${rand()}-${rand()}-${rand()}`;
  }

  function extParseJson(text, label) {
    try { return JSON.parse(String(text || '')); }
    catch (e) { throw new Error(`${label || '接口'}返回内容不是 JSON`); }
  }

  function extIsHttpOk(status) {
    return status >= 200 && status < 400;
  }

  /* ============================== 青书学堂 ============================== */
  const QS = {
    key: 'qs',
    minGap: 10000
  };

  function qsOnSite() {
    return /(^|\.)qingshuxuetang\.com$/i.test(location.hostname || '');
  }

  function qsOrgCode(pathOrUrl) {
    let path = String(pathOrUrl || '');
    try { path = new URL(path, location.href).pathname; } catch (e) { /* ignore */ }
    const match = path.match(/^\/([^/?#]+)\/Student(?:\/|$)/i);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function qsQueryOf(url, names) {
    try {
      const u = new URL(url, location.href);
      for (const name of names) {
        const value = u.searchParams.get(name);
        if (value) return value;
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  function qsContext() {
    const ctx = {
      siteHost: location.origin,
      orgCode: qsOrgCode(location.pathname),
      courseId: qsQueryOf(location.href, ['courseId', 'courseid']),
      teachPlanId: qsQueryOf(location.href, ['teachPlanId', 'teachplanId']),
      teachPlanCourseId: qsQueryOf(location.href, ['teachPlanCourseId', 'teachplanCourseId', 'teachingPlanCourseId']),
      periodId: qsQueryOf(location.href, ['periodId']),
      nodeId: qsQueryOf(location.href, ['nodeId', 'contentId', 'cw_nodeId']),
      quizId: qsQueryOf(location.href, ['quizId'])
    };
    if (!ctx.orgCode) {
      const first = String(location.pathname || '').split('/').filter(Boolean)[0];
      ctx.orgCode = first && !/^Student$/i.test(first) ? first : '';
    }
    return ctx;
  }

  function qsApiBase(ctx) {
    const origin = String(ctx.siteHost || location.origin).replace(/\/$/, '');
    return `${origin}/${ctx.orgCode}`;
  }

  function qsMultipart(fields) {
    const boundary = `----XsHelper${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    let body = '';
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value == null ? '' : value}\r\n`;
    });
    body += `--${boundary}--\r\n`;
    return { body, contentType: `multipart/form-data; boundary=${boundary}` };
  }

  async function qsRequest(ctx, endpoint, opts = {}) {
    const target = new URL(String(endpoint || ''), qsApiBase(ctx) + '/');
    const params = opts.params || {};
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') target.searchParams.set(key, String(value));
    });
    if (!target.searchParams.has('_t')) target.searchParams.set('_t', String(Date.now()));

    const headers = {
      Accept: opts.accept || '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      'Device-Trace-Id-QS': qsDeviceId()
    };
    if (opts.referer) headers.Referer = opts.referer;

    let body = opts.body;
    if (opts.json !== undefined) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      body = JSON.stringify(opts.json);
    } else if (opts.multipart) {
      const packed = qsMultipart(opts.multipart);
      headers['Content-Type'] = packed.contentType;
      body = packed.body;
    } else if (opts.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
      body = new URLSearchParams(opts.form).toString();
    }

    const res = await extPaced(() => extFetch(target.href, {
      method: opts.method || 'GET',
      headers,
      body,
      timeout: opts.timeout || EXT_CONF.requestTimeout
    }));

    if (res.status === 401 || res.status === 403) throw new Error('青书登录已失效，请重新登录');
    if (res.status === 429) throw new Error('青书请求过于频繁（429），请稍后再试');
    if (!extIsHttpOk(res.status)) throw new Error(`青书接口返回 HTTP ${res.status}`);
    return res.text;
  }

  let qsDevice = '';
  function qsDeviceId() {
    if (!qsDevice) {
      try { qsDevice = GM_getValue('xs-qs-device-id', '') || ''; } catch (e) { qsDevice = ''; }
      if (!qsDevice) {
        qsDevice = extRandomId();
        try { GM_setValue('xs-qs-device-id', qsDevice); } catch (e) { /* ignore */ }
      }
    }
    return qsDevice;
  }

  function qsResponseOk(json) {
    if (!json || typeof json !== 'object') return false;
    if (Object.prototype.hasOwnProperty.call(json, 'hr')) return String(json.hr) === '0';
    if (Object.prototype.hasOwnProperty.call(json, 'code')) return String(json.code) === '0';
    if (Object.prototype.hasOwnProperty.call(json, 'success')) return json.success === true;
    return extText(json.message) === '成功';
  }

  function qsNum(value) {
    const match = String(value == null ? '' : value).match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  async function qsCourseList(ctx) {
    const text = await qsRequest(ctx, 'Student/Course/CourseData', { method: 'POST' });
    const json = extParseJson(text, '青书课程列表');
    if (!qsResponseOk(json)) throw new Error(json.message || '读取青书课程列表失败');
    const rows = Array.isArray(json.data) ? json.data : [];
    return rows.map((raw) => ({
      courseId: String(raw.courseId || raw.id || ''),
      courseName: String(raw.courseName || raw.name || '青书课程'),
      teachPlanCourseId: String(raw.teachingPlanCourseId || raw.teachPlanCourseId || raw.teachplanCourseId || ''),
      teachPlanId: String(raw.teachPlanId || raw.classId || ''),
      periodId: String(raw.periodId || ''),
      learnStatus: raw.learnStatus,
      learnStatusName: String(raw.learnStatusName || ''),
      score: raw.score,
      allowLearn: ![false, 0, '0', 'false'].includes(raw.allowLearn)
    })).filter((item) => item.courseId);
  }

  async function qsResolveContext(ctx) {
    if (ctx.courseId && ctx.teachPlanId && ctx.periodId) {
      if (ctx.teachPlanCourseId) return ctx;
    }
    const courses = await qsCourseList(ctx);
    const matched = courses.filter((item) =>
      (!ctx.courseId || item.courseId === String(ctx.courseId)) &&
      (!ctx.teachPlanId || item.teachPlanId === String(ctx.teachPlanId)) &&
      (!ctx.periodId || item.periodId === String(ctx.periodId)));
    if (matched.length !== 1) {
      throw new Error('无法确定当前青书课程，请先进入具体课程页面再运行');
    }
    const course = matched[0];
    return Object.assign({}, ctx, {
      courseId: course.courseId,
      courseName: course.courseName,
      teachPlanId: course.teachPlanId,
      teachPlanCourseId: course.teachPlanCourseId,
      periodId: course.periodId,
      course
    });
  }

  async function qsProgress(ctx) {
    const text = await qsRequest(ctx, 'Student/Course/GetStudyRecordAndScore', {
      params: { teachPlanCourseId: ctx.teachPlanCourseId, periodId: ctx.periodId, _: Date.now() - 100 }
    });
    const json = extParseJson(text, '青书学习进度');
    if (!qsResponseOk(json)) throw new Error(json.message || '读取青书学习进度失败');
    const data = json.data || {};
    return {
      score: qsNum(data.studyScoreStr || data.score),
      studyTime: String(data.studyTimeStr || data.studyTime || ''),
      learnStatus: String(data.learnStatusName || data.learnStatus || ''),
      passed: String(data.learnStatusName || '').trim() === '已通过',
      records: Array.isArray(data.studyRecordList) ? data.studyRecordList : []
    };
  }

  async function qsScoreDetail(ctx) {
    const text = await qsRequest(ctx, 'Student/Course/CourseScore', {
      params: { courseId: ctx.courseId, teachplanCourseId: ctx.teachPlanCourseId, _: Date.now() - 100 },
      accept: 'text/html,*/*'
    });
    const doc = new DOMParser().parseFromString(text || '', 'text/html');
    let current = null;
    let target = null;
    const rows = Array.from(doc.querySelectorAll('tr')).filter((row) =>
      Array.from(row.children).some((cell) => extText(cell.textContent) === '课件学习'));
    if (rows.length) {
      const match = extText(rows[0].lastElementChild && rows[0].lastElementChild.textContent)
        .match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
      if (match) {
        current = Number(match[1]);
        target = Number(match[2]);
      }
    }
    if (current === null) {
      const table = doc.querySelector('#studySummaryTbl');
      if (table) {
        current = qsNum((table.querySelector('.study-login') || {}).textContent || 0);
        target = qsNum((table.querySelector('.title-class-score') || {}).textContent || 0);
      }
    }
    if (current === null || !Number.isFinite(target) || target <= 0) {
      return { known: false, currentScore: 0, targetScore: 80 };
    }
    return { known: true, currentScore: current, targetScore: target };
  }

  async function qsBeginStudy(ctx, contentId) {
    const text = await qsRequest(ctx, 'Student/Course/UploadStudyRecordBegin', {
      method: 'POST',
      json: {
        classId: ctx.teachPlanId,
        courseId: ctx.courseId,
        contentId: contentId || ctx.nodeId || 'kcjs_1_1',
        contentType: 11,
        periodId: ctx.periodId,
        position: 0,
        detectId: null
      }
    });
    const json = extParseJson(text, '青书开始学习');
    if (!qsResponseOk(json)) throw new Error(json.message || '青书开始学习失败');
    const recordId = json.data && typeof json.data === 'object' ? (json.data.recordId || json.data.id) : json.data;
    if (!recordId) throw new Error('青书未返回学习记录号');
    return String(recordId);
  }

  async function qsContinueStudy(ctx, recordId, position, end) {
    const text = await qsRequest(ctx, 'Student/Course/UploadStudyRecordContinue', {
      method: 'POST',
      multipart: {
        recordId,
        end: end ? 'true' : 'false',
        position: Math.max(0, Math.round(position)),
        timeOutConfirm: 'true'
      }
    });
    const json = extParseJson(text, '青书学习进度上报');
    if (!qsResponseOk(json)) throw new Error(json.message || '青书学习进度上报失败');
    return json;
  }

  /** 青书：学习挂机 */
  async function qsStudyLogic() {
    if (!qsOnSite()) return;
    if (!/\/Student\/Course\/CourseStudy/i.test(location.pathname)) return;
    const startHref = location.href;
    const setting = useSettingStore();
    if (setting.config && setting.config.basicConfig && setting.config.basicConfig.token) {
      if (!setting.config.basicConfig.token.value) {
        extLog('青书：未配置密钥，学习挂机仍可运行，但作业答题需要密钥', 'warning');
      }
    }
    try {
      const ctx = await qsResolveContext(qsContext());
      const detail = await qsScoreDetail(ctx).catch(() => ({ known: false, currentScore: 0, targetScore: 80 }));
      const progress = await qsProgress(ctx).catch(() => ({ score: 0, passed: false, records: [] }));
      if (progress.passed || (detail.known && detail.currentScore >= detail.targetScore)) {
        extLog(`青书：课件学习已达标（${detail.currentScore}/${detail.targetScore} 分），无需挂机`, 'success');
        return;
      }
      const target = detail.known ? detail.targetScore : 80;
      extLog(`青书：开始挂课，当前 ${progress.score || detail.currentScore}/${target} 分；每 ${EXT_CONF.studyStepSec} 秒上报一次`, null);

      const recent = (progress.records && progress.records[0]) || {};
      const contentId = ctx.nodeId || recent.contentId || recent.nodeId || 'kcjs_1_1';
      const recordId = await qsBeginStudy(ctx, contentId);
      const deadline = Date.now() + EXT_CONF.studyMaxMinutes * 60 * 1000;
      let position = 0;
      let uploads = 0;
      let score = progress.score || detail.currentScore || 0;
      try {
        while (Date.now() < deadline) {
          await extSleep(EXT_CONF.studyStepSec * 1000);
          if (location.href !== startHref) {
            extLog('青书：页面已切换，挂机停止', 'warning');
            return;
          }
          position += EXT_CONF.studyStepSec;
          await qsContinueStudy(ctx, recordId, position, false);
          uploads += 1;
          extLog(`青书：已上报 ${uploads} 次，进度位置 ${Math.round(position / 60)} 分钟，分数 ${score}/${target}`, null);
          if (uploads % EXT_CONF.studyScorePoll === 0) {
            const fresh = await qsProgress(ctx).catch(() => null);
            if (fresh) {
              score = fresh.score;
              extLog(`青书：最新分数 ${score}/${target}${fresh.studyTime ? `，学习时长 ${fresh.studyTime}` : ''}`, score >= target ? 'success' : null);
              if (fresh.passed || score >= target) break;
            }
          }
        }
      } finally {
        try { await qsContinueStudy(ctx, recordId, position, true); }
        catch (e) { extLog('青书：学习记录关闭未确认，可能影响时长统计', 'warning'); }
      }
      extLog(`青书：挂机结束，共上报 ${uploads} 次，当前分数 ${score}/${target}`, 'success');
    } catch (error) {
      extLog(`青书挂课失败：${(error && error.message) || error}`, 'error');
    }
  }

  /* ---------------------------- 青书作业答题 ---------------------------- */

  const QS_TYPE_NAMES = {
    0: '单选题', 1: '多选题', 2: '填空题', 3: '判断题', 4: '简答题'
  };

  function qsTypeFromText(text) {
    const raw = String(text || '');
    if (/多选/.test(raw)) return '1';
    if (/填空/.test(raw)) return '2';
    if (/判断/.test(raw)) return '3';
    if (/单选/.test(raw)) return '0';
    if (/简答|问答|论述|名词解释|计算/.test(raw)) return '4';
    return 'unknown';
  }

  function qsCleanOption(text) {
    return extText(String(text || '').replace(/<[^>]+>/g, '')).replace(/^[A-Z][.、．)\s]+/i, '').trim();
  }

  function qsParsePageQuestions() {
    const containers = Array.from(document.querySelectorAll('.question-detail-container'));
    const questions = [];
    for (const container of containers) {
      const typeText = (container.querySelector('.question-detail-type-desc') || {}).textContent || '';
      const type = qsTypeFromText(typeText);
      const descEl = container.querySelector('.question-detail-description') ||
        container.querySelector('.detail-description-content');
      const stem = descEl ? extText(descEl.textContent) : '';
      const options = [];
      Array.from(container.querySelectorAll('.question-detail-option')).forEach((optEl, index) => {
        const input = optEl.querySelector('input.option-input, input[type="radio"], input[type="checkbox"]');
        const preview = optEl.querySelector('.option-input-preview');
        let label = (input && input.value) || (preview && preview.getAttribute('content')) || '';
        label = String(label || '').trim().toUpperCase();
        if (!label) label = String.fromCharCode(65 + index);
        const desc = optEl.querySelector('.option-description');
        options.push({
          label,
          content: desc ? extText(desc.textContent) : '',
          element: optEl,
          input
        });
      });
      questions.push({
        questionId: container.id || '',
        type,
        typeName: QS_TYPE_NAMES[type] || typeText.trim() || '未知题型',
        stem,
        stemHtml: descEl ? descEl.innerHTML : stem,
        options,
        element: container
      });
    }
    return questions;
  }

  /** 把后端返回的答案数组转成青书的选项字母 */
  function qsResolveLabels(question, answers) {
    const labels = question.options.map((item) => item.label);
    // 页面选项是复选框时按多选题处理，避免题型文字没识别出来把多选当成单选只填一个
    const multiDom = question.options.some((opt) => opt.input && String(opt.input.type || '').toLowerCase() === 'checkbox');
    const raw = (Array.isArray(answers) ? answers : [answers]).map((item) => extText(item)).filter(Boolean);
    if (!raw.length) return [];
    const joined = raw.join('');
    const letterOnly = joined.replace(/^(参考答案|正确答案|答案)\s*[:：]\s*/i, '').toUpperCase();
    if (/^[A-Z]+$/.test(letterOnly) && letterOnly.split('').every((ch) => labels.includes(ch))) {
      const unique = Array.from(new Set(letterOnly.split('')));
      if (question.type !== '1' && !multiDom && unique.length > 1) return [];
      return unique;
    }
    const hits = [];
    for (const item of raw) {
      const key = qsCleanOption(item);
      const matched = question.options.find((opt) => qsCleanOption(opt.content) === key);
      if (matched) hits.push(matched.label);
    }
    if (hits.length && (question.type === '1' || multiDom || hits.length === 1)) return Array.from(new Set(hits));
    if (question.type === '3') {
      const truth = /^(对|正确|是|√|✓|T|TRUE|Y|1)$/i.test(qsCleanOption(joined));
      const falsey = /^(错|错误|否|×|✗|F|FALSE|N|0)$/i.test(qsCleanOption(joined));
      if (truth || falsey) {
        const found = question.options.find((opt) => {
          const text = qsCleanOption(opt.content);
          return truth
            ? /^(对|正确|是|√|✓|T|TRUE|Y|1)$/i.test(text)
            : /^(错|错误|否|×|✗|F|FALSE|N|0)$/i.test(text);
        });
        if (found) return [found.label];
      }
    }
    return [];
  }

  /** 提交给青书接口的答案字符串 */
  function qsNativeAnswer(question, answers) {
    if (question.type === '2' || question.type === '4') {
      const list = (Array.isArray(answers) ? answers : [answers]).map((item) => String(item == null ? '' : item).trim()).filter(Boolean);
      return list.join('||');
    }
    if (!['0', '1', '3'].includes(question.type) || !question.options.length) return '';
    const labels = qsResolveLabels(question, answers);
    if (!labels.length) return '';
    return labels.join('');
  }

  function qsFillPage(question, labels) {
    let filled = 0;
    question.options.forEach((opt) => {
      if (!opt.input) return;
      const wanted = labels.includes(String(opt.input.value || '').trim().toUpperCase());
      if (opt.input.checked !== wanted) {
        try { (opt.element || opt.input).click(); } catch (e) { /* ignore */ }
      }
      if (opt.input.checked) filled += 1;
    });
    return filled;
  }

  function qsBuildQuestionPayload(question) {
    return {
      title: question.stemHtml || question.stem,
      optionsText: question.options.map((opt) => opt.content),
      type: question.type === 'unknown' ? '' : question.type,
      refer: location.href,
      element: question.element
    };
  }

  /** 青书：作业页自动作答（默认只保存，不交卷） */
  async function qsHomeworkLogic() {
    if (!qsOnSite()) return;
    const ctx = qsContext();
    if (!ctx.quizId) {
      extLog('青书：未识别到作业编号（quizId），请从作业列表进入具体作业', 'warning');
      return;
    }
    const log = useLogStore();
    const setting = useSettingStore();
    const token = setting.config && setting.config.basicConfig && setting.config.basicConfig.token
      ? setting.config.basicConfig.token.value : '';
    if (!token) {
      extLog('青书：未配置密钥，无法答题。请到「设置」配置后再试', 'warning');
      return;
    }
    const questions = qsParsePageQuestions();
    if (!questions.length) {
      extLog('青书：当前页面没有解析到题目，可能不是作业作答页', 'warning');
      return;
    }
    extLog(`青书：解析到 ${questions.length} 道题，开始作答（默认只保存，不自动交卷）`, null);
    let answered = 0;
    let skipped = 0;
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const rowText = `青书 第${index + 1}/${questions.length}题`;
      if (question.type === 'unknown') {
        extLog(`${rowText}：题型未识别，已跳过`, 'warning');
        skipped += 1;
        continue;
      }
      if (question.type !== '2' && question.type !== '4' && !question.options.length) {
        extLog(`${rowText}：没有选项，已跳过`, 'warning');
        skipped += 1;
        continue;
      }
      let result;
      try {
        result = await getAccurateAnswer(qsBuildQuestionPayload(question));
      } catch (error) {
        extLog(`${rowText}：查询答案失败（${(error && error.message) || error}）`, 'error');
        skipped += 1;
        continue;
      }
      if (!result || result.code !== 1 || !result.data || !result.data.answer) {
        extLog(`${rowText}：未查到答案（${(result && result.msg) || '题库与 AI 都没有结果'}）`, 'warning');
        skipped += 1;
        continue;
      }
      const answers = Array.isArray(result.data.answer) ? result.data.answer : [result.data.answer];
      const native = qsNativeAnswer(question, answers);
      if (!native) {
        extLog(`${rowText}：答案与选项对不上，已跳过（原始答案：${extText(answers.join('、')).slice(0, 40)}）`, 'warning');
        skipped += 1;
        continue;
      }
      if (question.type === '2' || question.type === '4') {
        extLog(`${rowText}：主观题，答案已取到但需你在页面填写：${native.slice(0, 60)}`, 'warning');
      } else {
        const labels = qsResolveLabels(question, answers);
        qsFillPage(question, labels);
        extLog(`${rowText}：已选择 ${labels.join('')}`, 'success');
      }
      try {
        await qsRequest(ctx, 'Svc/SaveQuestionAnswer', {
          method: 'POST',
          json: { quizId: ctx.quizId, questionAnswers: [{ questionId: question.questionId, answer: native }] }
        });
      } catch (error) {
        extLog(`${rowText}：保存失败（${(error && error.message) || error}）`, 'error');
        skipped += 1;
        continue;
      }
      answered += 1;
      log.insertLog(`${rowText}：已作答并保存`, 'success', 2);
    }
    extLog(`青书：作答结束，已保存 ${answered} 题，跳过 ${skipped} 题；请检查后手动交卷`, 'success');
    if (EXT_CONF.autoSubmit && skipped === 0) {
      extLog('青书：自动交卷已开启，请在面板确认', 'warning');
    }
  }

  /* ============================== 出头科技 ============================== */

  function ctOnSite() {
    return /(^|\.)web2\.superchutou\.com$/i.test(location.hostname || '');
  }

  function ctApiBase() {
    return `${location.origin}/service`;
  }

  function ctUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}') || {}; }
    catch (e) { return {}; }
  }

  async function ctApi(method, path, opts = {}) {
    const url = new URL(ctApiBase() + (String(path || '').startsWith('/') ? path : '/' + path));
    const params = opts.params || {};
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });
    const headers = { Accept: '*/*' };
    let body;
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      body = JSON.stringify(opts.body);
    }
    const res = await extPaced(() => extFetch(url.href, { method, headers, body }), EXT_CONF.ctMinGapMs);
    if (res.status === 401 || res.status === 403) throw new Error('出头登录已失效，请重新登录');
    if (!extIsHttpOk(res.status)) throw new Error(`出头接口返回 HTTP ${res.status}`);
    const json = extParseJson(res.text, '出头接口');
    if (!json || typeof json !== 'object') throw new Error('出头接口返回格式异常');
    return json;
  }

  async function ctCourseTree(user) {
    const res = await ctApi('GET', '/eduSuper/Specialty/GetStuSpecialtyCurriculumList', {
      params: { StuDetail_ID: user.StuDetail_ID, IsStudyYear: 1, StuID: user.StuID }
    });
    if (!res.SuccessResponse) throw new Error(res.Message || '读取出头课程失败');
    const data = res.Data || {};
    let list = data.list || data.rows || data;
    if (!Array.isArray(list)) list = [];
    return { all: list, meta: { curStudyYear: data.CurStudyYear } };
  }

  async function ctChapters(user, courseId, curriculumId) {
    const res = await ctApi('GET', '/eduSuper/Question/GetCourse_ChaptersNodeList', {
      params: {
        Valid: 1,
        Course_ID: courseId,
        StuID: user.StuID,
        Curriculum_ID: curriculumId,
        Examination_ID: 0,
        StuDetail_ID: user.StuDetail_ID
      }
    });
    if (!res.SuccessResponse) return [];
    return Array.isArray(res.Data) ? res.Data : [];
  }

  function ctToInt(value, fallback) {
    const num = parseInt(value, 10);
    return Number.isFinite(num) ? num : fallback;
  }

  function ctChapterDuration(chapter) {
    const direct = ctToInt(chapter.Duration, 0);
    if (direct > 0) return direct;
    return ctToInt(chapter.VideoDuration || chapter.WareDuration || chapter.TimeLength, 0);
  }

  function ctChapterLearned(chapter) {
    const total = Number(chapter.TotalSecond);
    if (Number.isFinite(total) && total > 0) return Math.floor(total);
    return ctToInt(chapter.PlayRecord || chapter.LookDuration || chapter.LastWatchPos || chapter.StudyDuration, 0);
  }

  function ctChapterDone(chapter) {
    const id = ctToInt(chapter.ID, 0);
    if (id > 0 && ctToInt(chapter.IsLook, 0) === id) return true;
    if (ctToInt(chapter.LookEndTime, 0) > 0) return true;
    const duration = ctChapterDuration(chapter);
    const learned = ctChapterLearned(chapter);
    if (duration > 0 && learned >= duration) return true;
    const progress = chapter.Progress != null ? chapter.Progress : chapter.StudyProgress;
    if (progress != null && ctToInt(progress, 0) >= 100) return true;
    return false;
  }

  function ctLeafChapters(nodes, out) {
    const result = out || [];
    for (const node of nodes || []) {
      const children = node.ChildNodeList;
      if (children && children.length) {
        ctLeafChapters(children, result);
        continue;
      }
      const wareType = node.CourseWareType_ID != null ? node.CourseWareType_ID : node.WareType;
      if (wareType != null && ![0, 1, 2].includes(ctToInt(wareType, -1))) continue;
      if (node.ID != null) result.push(node);
    }
    return result;
  }

  async function ctSaveLook(chapterId, lookTime, lastWatchPos, lookType) {
    return ctApi('POST', '/datastore/WebCourse/SaveCourse_Look', {
      body: {
        CourseChapters_ID: chapterId,
        LookType: lookType || 0,
        LookTime: Math.max(0, Math.round(lookTime)),
        LastWatchPos: Math.max(0, Math.round(lastWatchPos)),
        IP: (window.returnCitySN && window.returnCitySN.cip) || '127.0.0.1'
      }
    });
  }

  /** 出头：刷课（章节学习时长上报） */
  async function ctStudyLogic() {
    if (!ctOnSite()) return;
    const user = ctUser();
    if (!user.StuID || !user.StuDetail_ID) {
      extLog('出头：未读取到登录信息，请先登录后再打开课程页', 'warning');
      return;
    }
    const startHref = location.href;
    try {
      const tree = await ctCourseTree(user);
      const courses = tree.all.filter((course) => {
        const courseId = ctToInt(course.Course_ID || course.spcuCourseId, 0);
        const chapters = ctToInt(course.CourseChapters, 0);
        return courseId > 0 && chapters > 0;
      });
      if (!courses.length) {
        extLog('出头：当前账号没有可学习的网课', 'warning');
        return;
      }
      const route = ctRoute();
      const scoped = route.curriculumId
        ? courses.filter((course) => String(course.Curriculum_ID) === String(route.curriculumId))
        : courses;
      const targets = scoped.length ? scoped : courses;
      extLog(`出头：共 ${targets.length} 门网课待检查`, null);
      let handled = 0;
      let skippedCourse = 0;
      for (const course of targets) {
        if (handled >= EXT_CONF.ctMaxChapters) break;
        if (location.href !== startHref) {
          extLog('出头：页面已切换，刷课停止', 'warning');
          return;
        }
        const courseId = ctToInt(course.Course_ID || course.spcuCourseId, 0);
        const curriculumId = ctToInt(course.Curriculum_ID, 0);
        const courseName = course.CuName || course.Name || String(courseId);
        let chapters = [];
        try { chapters = ctLeafChapters(await ctChapters(user, courseId, curriculumId)); }
        catch (error) {
          extLog(`出头：${courseName} 章节读取失败（${(error && error.message) || error}）`, 'warning');
          skippedCourse += 1;
          continue;
        }
        const todo = chapters.filter((chapter) => !ctChapterDone(chapter));
        if (!todo.length) continue;
        extLog(`出头：${courseName} 有 ${todo.length} 个章节待学习`, null);
        for (const chapter of todo) {
          if (handled >= EXT_CONF.ctMaxChapters) break;
          if (location.href !== startHref) return;
          const chapterId = ctToInt(chapter.ID, 0);
          const duration = ctChapterDuration(chapter) || Math.max(ctChapterLearned(chapter), 300);
          const learned = Math.min(ctChapterLearned(chapter), duration);
          const title = chapter.Name || chapter.ChapterName || chapter.CourseWare_Name || `章节${chapterId}`;
          let position = learned;
          if (position >= duration) continue;
          while (position < duration) {
            const step = Math.min(EXT_CONF.ctStepSec, duration - position);
            position += step;
            await ctSaveLook(chapterId, position, position, ctToInt(chapter.LookType, 0));
          }
          handled += 1;
          extLog(`出头：${courseName} / ${title} 已上报至 ${Math.round(position / 60)} 分钟`, 'success');
          await extSleep(300);
        }
      }
      extLog(`出头：本轮刷课结束，处理 ${handled} 个章节${skippedCourse ? `，${skippedCourse} 门课程读取失败` : ''}`, 'success');
    } catch (error) {
      extLog(`出头刷课失败：${(error && error.message) || error}`, 'error');
    }
  }

  function ctRoute() {
    const path = (location.hash || '').replace(/^#/, '') || location.pathname;
    let match = path.match(/\/onlineclass\/paper\/(\d+)\/(\d+)\/(\d+)\/(\d+)/i);
    if (match) {
      return {
        kind: 'paper',
        examPaperId: ctToInt(match[1], 0),
        examinationId: ctToInt(match[2], 0),
        modeType: ctToInt(match[3], 0),
        curriculumId: ctToInt(match[4], 0)
      };
    }
    match = path.match(/\/onlineclass\/curriculum\/(\d+)\/(\d+)\/(\d+)\/(\d+)/i);
    if (match) {
      return {
        kind: 'curriculum',
        curriculumId: ctToInt(match[1], 0),
        courseId: ctToInt(match[2], 0),
        examinationId: ctToInt(match[3], 0),
        tabIndex: ctToInt(match[4], 0)
      };
    }
    return { kind: 'other' };
  }

  const CT_TYPES = {
    1: '0', 2: '1', 3: '2', 4: '3', 5: '4', 6: '7',
    9: '1', 10: '5', 11: '6'
  };

  function ctParseBody(bodyText) {
    if (!bodyText) return [];
    try {
      const obj = typeof bodyText === 'string' ? JSON.parse(bodyText) : bodyText;
      if (!obj || typeof obj !== 'object') return [];
      return Object.keys(obj).map((key) => ({
        label: String(key).toUpperCase(),
        content: extText(String(obj[key]).replace(/<[^>]+>/g, ''))
      }));
    } catch (e) { return []; }
  }

  function ctAnswerLetters(answer, options) {
    const labels = options.map((opt) => opt.label);
    const srcList = (Array.isArray(answer) ? answer : [answer]).map((x) => String(x == null ? '' : x).trim()).filter(Boolean);
    const raw = srcList.join(',').toUpperCase().replace(/^(参考答案|正确答案|答案)\s*[:：]\s*/i, '');
    if (/^[A-Z](?:\s*[,，、;；|]?\s*[A-Z])*$/.test(raw)) {
      const letters = Array.from(new Set(raw.match(/[A-Z]/g) || []));
      if (letters.every((letter) => labels.includes(letter))) return letters;
    }
    const hits = [];
    const addLabel = (label) => { if (label && !hits.includes(label)) hits.push(label); };
    const matchPart = (part) => {
      const key = qsCleanOption(part);
      if (!key) return false;
      const found = options.find((opt) => qsCleanOption(opt.content) === key);
      if (!found) return false;
      addLabel(found.label);
      return true;
    };
    srcList.forEach((item) => {
      if (matchPart(item)) return;
      // "A. 选项正文"：字母与选项正文都对得上就按字母点，避免多选题只认到一项
      const m = item.match(/^([A-Za-z])\s*[.、．)）:：]\s*(\S[\s\S]*)$/);
      if (m && labels.includes(m[1].toUpperCase())) {
        const letter = m[1].toUpperCase();
        const opt = options.find((o) => o.label === letter);
        const optClean = opt ? qsCleanOption(opt.content) : '';
        const bodyClean = qsCleanOption(m[2]);
        if (!optClean || !bodyClean || optClean.includes(bodyClean) || bodyClean.includes(optClean)) {
          addLabel(letter);
          return;
        }
      }
      // 同一条里塞了多个答案（"A、B"）：最后才按分隔符拆
      item.split(/[\s,，、;；|]+/).filter(Boolean).forEach((part) => { matchPart(part); });
    });
    return hits;
  }

  function ctVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (style && (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0)) return false;
    return true;
  }

  function ctClick(el) {
    if (!el) return false;
    try {
      ['mousedown', 'mouseup', 'click'].forEach((type) => {
        el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      });
      return true;
    } catch (e) {
      try { el.click(); return true; } catch (_) { return false; }
    }
  }

  function ctOptionChecked(node) {
    if (!node) return false;
    const input = node.matches && node.matches('input')
      ? node
      : (node.querySelector ? node.querySelector('input[type="radio"], input[type="checkbox"], input') : null);
    if (input && input.checked) return true;
    let host = node;
    try { host = (node.closest && node.closest('.ant-radio-wrapper, .ant-checkbox-wrapper, label, li')) || node; }
    catch (e) { host = node; }
    const cls = String((host && host.className) || '');
    return /checked|selected|active/i.test(cls);
  }

  /** 在当前题目范围内按选项字母点选，返回是否点中并确认 */
  function ctClickLetters(letters) {
    if (!letters || !letters.length) return false;
    const scopes = [
      document.querySelector('.question-content, .exam-question, [class*="questionContent"], [class*="QuestionContent"], .ant-card-body'),
      document.body
    ].filter(Boolean);
    let allOk = true;
    for (const letter of letters) {
      const lower = letter.toLowerCase();
      let input = null;
      for (const scope of scopes) {
        const list = Array.from(scope.querySelectorAll(
          `input[type="radio"][value="${letter}"], input[type="checkbox"][value="${letter}"], ` +
          `input[type="radio"][value="${lower}"], input[type="checkbox"][value="${lower}"]`
        )).filter(ctVisible);
        if (list.length) { input = list[list.length - 1]; break; }
      }
      if (input) {
        const host = input.closest('label') || input.parentElement || input;
        ctClick(host);
        if (!ctOptionChecked(input)) ctClick(input);
        if (!ctOptionChecked(input)) allOk = false;
        continue;
      }
      let hit = null;
      for (const scope of scopes) {
        const nodes = Array.from(scope.querySelectorAll('.ant-radio-wrapper, .ant-checkbox-wrapper, label, li, span'))
          .filter((el) => ctVisible(el) && el.children.length === 0);
        hit = nodes.find((el) => new RegExp(`^\\s*${letter}\\s*[.、．)）]`).test((el.textContent || '').trim()));
        if (hit) break;
      }
      if (hit) ctClick(hit);
      else allOk = false;
    }
    return allOk;
  }

  /** 点答题卡上的题号，切到指定题 */
  function ctClickAnswerCard(num) {
    const label = String(num);
    const roots = Array.from(document.querySelectorAll(
      '[class*="answer"], [class*="Answer"], [class*="sheet"], [class*="Sheet"], [class*="card"], [class*="Card"]'
    ));
    for (const root of roots) {
      const nodes = Array.from(root.querySelectorAll('div, span, li, a, button'))
        .filter((el) => ctVisible(el) && el.children.length === 0 && (el.textContent || '').trim() === label);
      const hit = nodes.find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width >= 12 && rect.width <= 90 && rect.height >= 12;
      });
      if (hit) { ctClick(hit); return true; }
    }
    return false;
  }

  async function ctExamLogic() {
    if (!ctOnSite()) return;
    const startHref = location.href;
    const route = ctRoute();
    if (route.kind !== 'paper' || !route.examPaperId || !route.examinationId) return;
    const user = ctUser();
    if (!user.StuID) {
      extLog('出头：未读取到登录信息，无法读取试卷', 'warning');
      return;
    }
    const setting = useSettingStore();
    const token = setting.config && setting.config.basicConfig && setting.config.basicConfig.token
      ? setting.config.basicConfig.token.value : '';
    if (!token) {
      extLog('出头：未配置密钥，无法答题', 'warning');
      return;
    }
    try {
      const res = await ctApi('GET', '/eduSuper/Question/GetExamPaperQuestions', {
        params: {
          examPaperId: route.examPaperId,
          StuID: user.StuID,
          StuDetail_ID: user.StuDetail_ID,
          Examination_ID: route.examinationId,
          Curriculum_ID: route.curriculumId,
          SignId: 0,
          type: 2
        }
      });
      if (!res.SuccessResponse || !res.Data) throw new Error(res.Message || '读取试卷失败');
      const blocks = res.Data.QuestionType || [];
      const questions = [];
      blocks.forEach((block) => {
        (block.Question || []).forEach((q) => questions.push(q));
      });
      if (!questions.length) {
        extLog('出头：试卷里没有题目', 'warning');
        return;
      }
      extLog(`出头：试卷共 ${questions.length} 道题，开始作答`, null);
      let done = 0;
      let skipped = 0;
      const pending = [];
      for (let index = 0; index < questions.length; index += 1) {
        const q = questions[index];
        const typeId = ctToInt(q.QuestionType_ID, 0);
        const type = CT_TYPES[typeId];
        const rowText = `出头 第${index + 1}/${questions.length}题`;
        if (!type) {
          extLog(`${rowText}：题型（${typeId}）暂不支持，已跳过`, 'warning');
          skipped += 1;
          continue;
        }
        const options = ctParseBody(q.Body);
        const title = extText(String(q.Title || '').replace(/<[^>]+>/g, ''));
        if (!title) {
          skipped += 1;
          continue;
        }
        let result;
        try {
          result = await getAccurateAnswer({
            title,
            optionsText: options.map((opt) => opt.content),
            type,
            refer: location.href
          });
        } catch (error) {
          extLog(`${rowText}：查询答案失败（${(error && error.message) || error}）`, 'error');
          skipped += 1;
          continue;
        }
        if (!result || result.code !== 1 || !result.data || !result.data.answer) {
          extLog(`${rowText}：未查到答案`, 'warning');
          skipped += 1;
          continue;
        }
        const answers = Array.isArray(result.data.answer) ? result.data.answer : [result.data.answer];
        const letters = ctAnswerLetters(answers, options);
        pending.push({ index, letters, textAnswer: extText(answers.join('、')).slice(0, 60) });
        done += 1;
      }
      if (!pending.length) {
        extLog(`出头：没有可作答的题目（跳过 ${skipped} 题）`, 'warning');
        return;
      }
      if (!EXT_CONF.autoFillExam) {
        pending.forEach((item) => {
          extLog(`出头 第${item.index + 1}题：答案 ${item.letters.length ? item.letters.join('') : item.textAnswer}`,
            item.letters.length ? 'success' : 'warning');
        });
        extLog('出头：自动点选已关闭，请按上面的答案手动选择', 'warning');
        return;
      }
      extLog(`出头：答案已就绪（${done} 题），开始自动点选；每题点完会核对，交卷仍需你手动确认`, null);
      let filled = 0;
      let manual = 0;
      for (const item of pending) {
        if (location.href !== startHref) {
          extLog('出头：页面已切换，自动点选停止', 'warning');
          break;
        }
        if (!item.letters.length) {
          manual += 1;
          extLog(`出头 第${item.index + 1}题：答案不是选项字母，请手动填 ${item.textAnswer}`, 'warning');
          continue;
        }
        if (pending.length > 1) {
          ctClickAnswerCard(item.index + 1);
          await extSleep(260);
        }
        const ok = ctClickLetters(item.letters);
        await extSleep(140);
        if (ok) {
          filled += 1;
          extLog(`出头 第${item.index + 1}题：已选 ${item.letters.join('')}`, 'success');
        } else {
          manual += 1;
          extLog(`出头 第${item.index + 1}题：自动点选未确认，请手动选 ${item.letters.join('')}`, 'warning');
        }
      }
      extLog(`出头：自动点选完成，已选 ${filled} 题，需手动 ${manual} 题；请核对后手动交卷`, 'success');
    } catch (error) {
      extLog(`出头考试处理失败：${(error && error.message) || error}`, 'error');
    }
  }

  /* ------------------------------ 路由表 ------------------------------ */
  const qsRoutes = {
    match: [
      { keyword: 'ExercisePaper', tab: '1', logic: qsHomeworkLogic },
      { keyword: '/Student/Course/CourseStudy', tab: '0', logic: qsStudyLogic },
      { keyword: '/Student/', tab: '0' }
    ],
    defaultRoute: { show: true, tab: '0' }
  };

  const ctRoutes = {
    match: [
      { keyword: '/onlineclass/paper/', tab: '1', logic: ctExamLogic },
      { keyword: '/onlineclass/curriculum/', tab: '0', logic: ctStudyLogic },
      { keyword: 'superchutou', tab: '0' }
    ],
    defaultRoute: { show: true, tab: '0' }
  };

  return { qsRoutes, ctRoutes, qsOnSite, ctOnSite };
})();

  // ===== 智慧树课程队列 =====
  // 目标：在「队列」里勾几门课，刷完一门自动进下一门。
  // 状态存 GM，多个标签页共用一份；同一时刻只有一个页面真正在推进队列。
  const QUEUE_STORAGE_PREFIX = "xsCourseQueue:";
  const QUEUE_HEARTBEAT_SECONDS = 5;
  const QUEUE_LOCK_STALE_MS = 30e3;
  const QUEUE_WATCHDOG_SECONDS = 30;
  const QUEUE_IDLE_TIMEOUT_MS = 30 * 60e3;
  const QUEUE_SWITCH_DELAY_SECONDS = 3;
  const QUEUE_ORPHAN_CHECK_SECONDS = 20;
  const QUEUE_STRUCTURE_FAILURE_LIMIT = 2;
  const QUEUE_PROGRESS_THROTTLE_MS = 10e3;
  const QUEUE_RESULT_STATUS = { done: "done", stuck: "skipped", locked: "skipped", error: "failed" };
  const QUEUE_PAGE_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const queueStorageKey = (platform) => `${QUEUE_STORAGE_PREFIX}${platform}`;
  const queueReadValue = (key, fallback) => {
    try {
      if (typeof _GM_getValue === "function") return _GM_getValue(key, fallback);
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : raw;
    } catch (e) {
      return fallback;
    }
  };
  const queueWriteValue = (key, value) => {
    try {
      if (typeof _GM_setValue === "function") {
        _GM_setValue(key, value);
        return;
      }
      window.localStorage.setItem(key, value);
    } catch (e) {
    }
  };
  const createEmptyQueueState = () => ({
    status: "idle",
    items: [],
    currentKey: null,
    ownerId: null,
    heartbeat: 0,
    structureFailures: 0,
    updatedAt: 0
  });
  const parseQueueState = (raw) => {
    const empty = createEmptyQueueState();
    if (!raw) return empty;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== "object") return empty;
      return {
        ...empty,
        ...parsed,
        items: Array.isArray(parsed.items) ? parsed.items : []
      };
    } catch (e) {
      return empty;
    }
  };
  const loadQueueState = (platform) => parseQueueState(queueReadValue(queueStorageKey(platform), ""));
  const saveQueueState = (platform, state) => {
    queueWriteValue(queueStorageKey(platform), JSON.stringify(state));
  };
  // 另一个页面改了队列（开始/暂停/换课）时同步过来
  const watchQueueState = (platform, callback) => {
    if (typeof GM_addValueChangeListener !== "function") return () => {
    };
    const listenerId = GM_addValueChangeListener(
      queueStorageKey(platform),
      (_name, _oldValue, newValue, remote) => {
        if (remote) callback(parseQueueState(newValue));
      }
    );
    return () => {
      if (typeof GM_removeValueChangeListener === "function") {
        GM_removeValueChangeListener(listenerId);
      }
    };
  };
  let activeQueueEngine = null;
  // 学习逻辑刷完一门课时调用，告诉队列这门课的结论
  const reportCourseResult = (result, reason = "") => {
    activeQueueEngine?.report(result, reason);
  };
  const reportCourseProgress = () => {
    activeQueueEngine?.reportProgress();
  };
  class CourseQueueEngine {
    constructor(adapter, options) {
      this.pageId = QUEUE_PAGE_ID;
      this.heartbeatTimer = null;
      this.watchdogTimer = null;
      this.lastProgressSavedAt = 0;
      this.navigating = false;
      this.spaWatching = false;
      this.adapter = adapter;
      this.logger = options.logger;
      this.onChange = options.onChange;
      this.state = loadQueueState(adapter.platform);
      watchQueueState(adapter.platform, (state) => {
        this.state = state;
        if (!this.isOwner()) this.stopTimers();
        this.onChange(this.snapshot());
      });
      window.addEventListener("beforeunload", () => this.releaseOwnership());
    }
    getState() {
      return this.snapshot();
    }
    isOwner() {
      return this.state.ownerId === this.pageId;
    }
    isOwnedByOtherPage() {
      const { ownerId, heartbeat } = this.state;
      return Boolean(ownerId) && ownerId !== this.pageId && !this.isLockStale(heartbeat);
    }
    getCurrentItem() {
      const { currentKey, items } = this.state;
      return items.find((item) => item.key === currentKey) || null;
    }
    // 每次页面加载调用一次，按当前页面角色决定队列下一步
    async onPageLoad() {
      this.state = loadQueueState(this.adapter.platform);
      this.onChange(this.snapshot());
      if (this.adapter.isSpa) this.watchSpaNavigation();
      if (this.state.status !== "running") return;
      const currentUrl = location.href;
      const role = this.adapter.resolvePageRole(currentUrl);
      const current = this.getCurrentItem();
      if (this.isOwnedByOtherPage()) {
        this.logger("课程队列正在其他页面运行中");
        return;
      }
      if (!current) {
        this.claimOwnership();
        await this.advance();
        return;
      }
      const isQueuePage = (role === "courseHome" || role === "study") && this.adapter.getCourseKeyFromUrl(currentUrl) === current.key;
      if (isQueuePage) {
        this.claimOwnership();
        await this.handleQueuePage(role, current);
        return;
      }
      this.scheduleOrphanCheck();
    }
    start(candidates) {
      if (!this.checkBlockers()) return false;
      if (!candidates.length) {
        this.logger("请先勾选要加入队列的课程", "warning");
        return false;
      }
      this.update((state) => {
        Object.assign(state, createEmptyQueueState(), {
          status: "running",
          items: candidates.map((candidate) => ({
            ...candidate,
            status: "pending",
            reason: "",
            startedAt: 0,
            lastProgressAt: 0
          }))
        });
      });
      this.claimOwnership();
      this.logger(`课程队列已开始，共 ${candidates.length} 门课程`);
      void this.advance();
      return true;
    }
    pause(reason = "课程队列已暂停", type = null) {
      this.stopTimers();
      this.update((state) => {
        state.status = "paused";
        state.ownerId = null;
      });
      this.logger(reason, type);
    }
    resume() {
      if (this.state.status !== "paused") return false;
      if (!this.checkBlockers()) return false;
      this.update((state) => {
        state.status = "running";
        state.structureFailures = 0;
      });
      this.claimOwnership();
      this.logger("课程队列已继续");
      const current = this.getCurrentItem();
      if (!current) {
        void this.advance();
        return true;
      }
      const currentUrl = location.href;
      const role = this.adapter.resolvePageRole(currentUrl);
      if (this.adapter.getCourseKeyFromUrl(currentUrl) === current.key && role !== "other") {
        void this.handleQueuePage(role, current);
      } else {
        void this.navigateTo(current.entryUrl);
      }
      return true;
    }
    // 只允许移出还没开始的课程，正在学的和已有结论的保留，免得打断流程
    removeItem(key) {
      const target = this.state.items.find((item) => item.key === key);
      if (!target || target.status !== "pending") return false;
      let removed = false;
      this.update((state) => {
        const index = state.items.findIndex((item) => item.key === key && item.status === "pending");
        if (index === -1) return;
        state.items.splice(index, 1);
        removed = true;
        if (!state.items.length) Object.assign(state, createEmptyQueueState());
      });
      if (removed) this.logger(`已将「${target.name}」移出课程队列`);
      return removed;
    }
    clear() {
      this.stopTimers();
      this.update((state) => {
        Object.assign(state, createEmptyQueueState());
      });
      this.logger("课程队列已清空");
    }
    // 只在当前页面就是队列课程时才认这个结论
    report(result, reason = "") {
      if (!this.isOwner() || this.state.status !== "running") return;
      const current = this.getCurrentItem();
      if (!current) return;
      if (this.adapter.getCourseKeyFromUrl(location.href) !== current.key) return;
      void this.finishCurrent(QUEUE_RESULT_STATUS[result], reason);
    }
    reportProgress() {
      if (!this.isOwner() || this.state.status !== "running") return;
      const now = Date.now();
      if (now - this.lastProgressSavedAt < QUEUE_PROGRESS_THROTTLE_MS) return;
      this.lastProgressSavedAt = now;
      this.update((state) => {
        const item = state.items.find((course) => course.key === state.currentKey);
        if (item) item.lastProgressAt = now;
      });
    }
    async handleQueuePage(role, current) {
      if (role === "study") {
        this.startWatchdog();
        return;
      }
      if (role !== "courseHome") return;
      let result;
      try {
        result = await this.adapter.enterStudy(current);
      } catch (error) {
        result = { type: "failed", reason: "进入学习页时出现异常" };
      }
      if (!this.isOwner() || this.state.status !== "running") return;
      if (result.type === "navigate") {
        this.logger(result.label ? `进入未完成章节：${result.label}` : "正在进入学习页面..");
        await this.navigateTo(result.url);
      } else if (result.type === "finished") {
        await this.finishCurrent("done", result.reason);
      } else {
        await this.finishCurrent("failed", result.reason, Boolean(result.structural));
      }
    }
    async finishCurrent(status, reason = "", structural = false) {
      const current = this.getCurrentItem();
      if (!current) return;
      let structureFailures = 0;
      this.update((state) => {
        const item = state.items.find((course) => course.key === current.key);
        if (item) {
          item.status = status;
          item.reason = reason;
        }
        state.structureFailures = structural ? state.structureFailures + 1 : 0;
        structureFailures = state.structureFailures;
      });
      const statusText = { done: "已完成", skipped: "已跳过", failed: "处理失败" }[status];
      this.logger(
        `队列课程「${current.name}」${statusText}${reason ? `：${reason}` : ""}`,
        status === "done" ? null : "warning"
      );
      if (structureFailures >= QUEUE_STRUCTURE_FAILURE_LIMIT) {
        this.pause("连续多门课程都读不到页面数据，平台页面可能已改版，队列已暂停", "warning");
        return;
      }
      await this.advance();
    }
    async advance() {
      if (!this.isOwner() || this.state.status !== "running") return;
      const next = this.state.items.find((item) => item.status === "pending");
      if (!next) {
        this.stopTimers();
        const summary = this.summarize();
        this.update((state) => {
          state.status = "finished";
          state.currentKey = null;
          state.ownerId = null;
        });
        this.logger(`课程队列已全部处理完毕。${summary}`);
        return;
      }
      const now = Date.now();
      this.update((state) => {
        const item = state.items.find((course) => course.key === next.key);
        if (!item) return;
        item.status = "running";
        item.startedAt = now;
        item.lastProgressAt = now;
        state.currentKey = item.key;
      });
      const index = this.state.items.findIndex((item) => item.key === next.key) + 1;
      this.logger(`即将开始队列课程（${index}/${this.state.items.length}）：${next.name}`);
      await this.navigateTo(next.entryUrl);
    }
    async navigateTo(targetUrl) {
      if (this.navigating) return;
      this.navigating = true;
      await sleep(QUEUE_SWITCH_DELAY_SECONDS);
      if (!this.isOwner() || this.state.status !== "running") {
        this.navigating = false;
        return;
      }
      this.stopTimers();
      this.releaseOwnership();
      this.adapter.navigate(targetUrl);
    }
    // 学习页一直在放视频就持续记进度；30 分钟没动静才算这门课卡住
    startWatchdog() {
      if (this.watchdogTimer) return;
      this.watchdogTimer = setInterval(() => {
        if (!this.isOwner() || this.state.status !== "running") {
          this.stopTimers();
          return;
        }
        if (this.adapter.isActivelyStudying()) {
          this.reportProgress();
          return;
        }
        const current = this.getCurrentItem();
        if (!current) return;
        if (Date.now() - current.lastProgressAt > QUEUE_IDLE_TIMEOUT_MS) {
          void this.finishCurrent("skipped", "超过 30 分钟没有学习进度");
        }
      }, QUEUE_WATCHDOG_SECONDS * 1e3);
    }
    claimOwnership() {
      this.update((state) => {
        state.ownerId = this.pageId;
        state.heartbeat = Date.now();
      });
      if (this.heartbeatTimer) return;
      this.heartbeatTimer = setInterval(() => {
        if (!this.isOwner()) {
          this.stopTimers();
          return;
        }
        this.update((state) => {
          state.heartbeat = Date.now();
        });
      }, QUEUE_HEARTBEAT_SECONDS * 1e3);
    }
    releaseOwnership() {
      if (!this.isOwner()) return;
      this.update((state) => {
        state.ownerId = null;
      });
    }
    scheduleOrphanCheck() {
      setTimeout(() => {
        this.state = loadQueueState(this.adapter.platform);
        if (this.state.status !== "running") return;
        if (this.state.ownerId && !this.isLockStale(this.state.heartbeat)) return;
        this.pause("检测到已离开队列中的课程页面，队列已暂停，可在「队列」里点继续", "warning");
      }, QUEUE_ORPHAN_CHECK_SECONDS * 1e3);
    }
    watchSpaNavigation() {
      if (this.spaWatching) return;
      this.spaWatching = true;
      let lastUrl = location.href;
      setInterval(() => {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        this.stopTimers();
        void this.onPageLoad();
      }, 1e3);
    }
    checkBlockers() {
      const blockers = this.adapter.getStartBlockers();
      blockers.forEach((text) => this.logger(text, "warning"));
      return blockers.length === 0;
    }
    summarize() {
      const count = (status) => this.state.items.filter((item) => item.status === status).length;
      const parts = [`完成 ${count("done")} 门`];
      if (count("skipped")) parts.push(`跳过 ${count("skipped")} 门`);
      if (count("failed")) parts.push(`失败 ${count("failed")} 门`);
      return parts.join("，");
    }
    isLockStale(heartbeat) {
      return Date.now() - heartbeat > QUEUE_LOCK_STALE_MS;
    }
    stopTimers() {
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      if (this.watchdogTimer) clearInterval(this.watchdogTimer);
      this.heartbeatTimer = null;
      this.watchdogTimer = null;
    }
    // 其他页面可能刚写过队列，改之前先读最新一份，避免覆盖
    update(mutator) {
      const latest = loadQueueState(this.adapter.platform);
      mutator(latest);
      latest.updatedAt = Date.now();
      this.state = latest;
      saveQueueState(this.adapter.platform, latest);
      this.onChange(this.snapshot());
    }
    snapshot() {
      return JSON.parse(JSON.stringify(this.state));
    }
  }
  class BasicCourseQueueAdapter {
    constructor() {
      this.isSpa = false;
    }
    getStartBlockers() {
      return [];
    }
    isActivelyStudying() {
      return false;
    }
    navigate(targetUrl) {
      const topWindow = (_unsafeWindow && _unsafeWindow.top) || window.top;
      topWindow.location.href = targetUrl;
    }
    readParam(targetUrl, ...names) {
      try {
        const params = new URL(targetUrl, location.href).searchParams;
        const lowerNames = names.map((name) => name.toLowerCase());
        for (const [key, value] of params) {
          if (lowerNames.includes(key.toLowerCase()) && value) return value;
        }
      } catch (e) {
      }
      return null;
    }
  }
  const ZHS_QUEUE_CONFIG = {
    courseList: {
      host: "onlineweb.zhihuishu.com",
      pagePath: "/onlinestuh5",
      pageUrl: "https://onlineweb.zhihuishu.com/onlinestuh5",
      componentName: "courseList",
      pageSize: 50,
      maxPages: 10,
      // 进行中的共享课
      shareStatus: 0,
      // 「智慧课程」板块的进行中标签
      smartStatus: 3
    },
    study: {
      courseParam: "recruitAndCourseId",
      fallbackUrl: "https://studyvideoh5.zhihuishu.com/stuStudy?recruitAndCourseId="
    },
    // 智慧课程：主页 /singleCourse/{模块}/{courseId}/{classId}，学习页 /learnPage/{courseId}/{nodeUid}/{classId}
    smart: {
      hosts: ["ai-smart-course-student-pro.zhihuishu.com", "smartcoursestudent.zhihuishu.com"],
      homePrefix: "/singleCourse/",
      studyPrefix: "/learnPage/",
      knowledgeItem: ".item-content",
      knowledgeProgress: ".progress-num"
    },
    resolveTimeout: 6,
    smartHomeTimeout: 20
  };
  const queueParseUrl = (targetUrl) => {
    try {
      return new URL(targetUrl, location.href);
    } catch (e) {
      return null;
    }
  };
  const queueIsSmartUrl = (parsed) => Boolean(parsed) && ZHS_QUEUE_CONFIG.smart.hosts.includes(parsed.hostname);
  const queueParsePercent = (text) => {
    const value = parseInt(String(text ?? "").replace(/[^\d]/g, ""), 10);
    return Number.isNaN(value) ? null : value;
  };
  // 课程列表接口的参数由平台加密，只能借页面里课程列表组件自己的请求方法
  const queueFindVueComponent = (name) => {
    const pageDocument = (_unsafeWindow && _unsafeWindow.document) || document;
    for (const el of pageDocument.querySelectorAll("*")) {
      const vm = el.__vue__;
      if (vm?.$options?.name === name) return vm;
    }
    return null;
  };
  class ZhsCourseQueueAdapter extends BasicCourseQueueAdapter {
    constructor() {
      super();
      this.platform = "zhs";
      this.platformName = "智慧树";
      this.isSpa = true;
    }
    // 共享课从课程列表直接进学习页；智慧课程要先进课程主页挑未完成的知识点
    resolvePageRole(targetUrl) {
      const parsed = queueParseUrl(targetUrl);
      if (!parsed) return "other";
      const list = ZHS_QUEUE_CONFIG.courseList;
      const smart = ZHS_QUEUE_CONFIG.smart;
      if (parsed.hostname === list.host && parsed.pathname.startsWith(list.pagePath)) return "courseList";
      if (queueIsSmartUrl(parsed)) {
        if (!this.getCourseKeyFromUrl(targetUrl)) return "other";
        if (parsed.pathname.startsWith(smart.studyPrefix)) return "study";
        if (parsed.pathname.startsWith(smart.homePrefix)) return "courseHome";
        return "other";
      }
      return this.getCourseKeyFromUrl(targetUrl) ? "study" : "other";
    }
    getCourseKeyFromUrl(targetUrl) {
      const parsed = queueParseUrl(targetUrl);
      if (queueIsSmartUrl(parsed)) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const prefix = `/${segments[0]}/`;
        if (prefix === ZHS_QUEUE_CONFIG.smart.studyPrefix) return segments[1] || null;
        if (prefix === ZHS_QUEUE_CONFIG.smart.homePrefix) return segments[2] || null;
        return null;
      }
      return this.readParam(targetUrl, ZHS_QUEUE_CONFIG.study.courseParam) || null;
    }
    getStartBlockers() {
      const setting = useSettingStore();
      const blockers = [];
      if (!setting.config.basicConfig.assistVideo.value) blockers.push("课程队列需要先打开「视频助手（智慧树）」");
      if (!setting.config.basicConfig.autoChangeChapter.value) blockers.push("课程队列需要开启「自动切换章节」");
      return blockers;
    }
    isActivelyStudying() {
      return Array.from(document.querySelectorAll("video, audio")).some((media) => !media.paused && !media.ended);
    }
    async fetchCourseList() {
      const list = ZHS_QUEUE_CONFIG.courseList;
      if (this.resolvePageRole(location.href) !== "courseList") {
        return { courses: [], error: `请先打开智慧树在线学堂学生首页（${list.pageUrl}）再读取课程列表` };
      }
      const vm = await this.waitForCourseListComponent();
      if (!vm?.$api) return { courses: [], error: "未找到课程列表组件，平台页面可能已更新" };
      const sources = [
        { name: "共享课", load: () => this.loadShareCourses(vm) },
        { name: "智慧课程", load: () => this.loadSmartCourses(vm) }
      ];
      const courses = [];
      const loadedSources = [];
      const errors = [];
      const seen = new Set();
      for (const source of sources) {
        let sourceCourses;
        try {
          sourceCourses = await source.load();
        } catch (error) {
          errors.push(`${source.name}读取失败：${error.message}`);
          continue;
        }
        if (sourceCourses.length) loadedSources.push(source.name);
        for (const course of sourceCourses) {
          if (seen.has(course.key)) continue;
          seen.add(course.key);
          courses.push(course);
        }
      }
      if (!courses.length) {
        return { courses: [], error: errors.join("；") || "没有进行中的共享课或智慧课程" };
      }
      return { courses, source: loadedSources.join("、") };
    }
    async enterStudy(item) {
      if (!queueIsSmartUrl(queueParseUrl(item.entryUrl))) return { type: "navigate", url: item.entryUrl };
      return this.enterSmartStudy();
    }
    // 知识点卡片没有跳转地址，只能点了让平台自己路由到学习页
    async enterSmartStudy() {
      const timeout = ZHS_QUEUE_CONFIG.smartHomeTimeout;
      const smart = ZHS_QUEUE_CONFIG.smart;
      let items = [];
      for (let i = 0; i < timeout * 2; i++) {
        items = Array.from(document.querySelectorAll(smart.knowledgeItem));
        if (items.length) break;
        await sleep(0.5);
      }
      if (!items.length) return { type: "failed", reason: "未读取到课程知识点列表", structural: true };
      const target = items.find((item) => {
        const percent = queueParsePercent(item.querySelector(smart.knowledgeProgress)?.textContent);
        return percent === null || percent < 100;
      });
      if (!target) return { type: "finished", reason: "全部知识点学习进度已达 100%" };
      const label = target.innerText.split("\n")[0].trim();
      target.click();
      for (let i = 0; i < timeout * 2; i++) {
        if (location.pathname.startsWith(smart.studyPrefix)) return { type: "navigate", url: location.href, label };
        await sleep(0.5);
      }
      return { type: "failed", reason: "点击知识点后未进入学习页" };
    }
    async waitForCourseListComponent() {
      for (let i = 0; i < 20; i++) {
        const vm = queueFindVueComponent(ZHS_QUEUE_CONFIG.courseList.componentName);
        if (vm) return vm;
        await sleep(0.5);
      }
      return null;
    }
    async loadShareCourses(vm) {
      if (typeof vm.$api.queryShareCourseInfo !== "function") throw new Error("平台接口已变更");
      const rawCourses = await this.fetchShareCourses(vm);
      const courses = [];
      for (const course of rawCourses) {
        if (!course.secret) continue;
        const resolvedUrl = await this.resolveEntryUrl(vm, course);
        const entryUrl = resolvedUrl || ZHS_QUEUE_CONFIG.study.fallbackUrl + course.secret;
        courses.push({
          key: this.getCourseKeyFromUrl(entryUrl) || course.secret,
          name: course.courseName || `课程 ${course.courseId}`,
          desc: [course.teacherName, course.schoolName, course.progress && `进度 ${course.progress}`].filter(Boolean).join(" · "),
          cover: course.courseImg || "",
          entryUrl,
          meta: {
            type: "share",
            courseId: String(course.courseId ?? ""),
            recruitId: String(course.recruitId ?? "")
          }
        });
      }
      return courses;
    }
    async fetchShareCourses(vm) {
      const list = ZHS_QUEUE_CONFIG.courseList;
      const courses = [];
      for (let pageNo = 1; pageNo <= list.maxPages; pageNo++) {
        const response = await vm.$api.queryShareCourseInfo({ status: list.shareStatus, pageNo, pageSize: list.pageSize });
        if (response?.code !== 200) throw new Error(response?.message || `接口返回异常（${response?.code ?? "无响应"}）`);
        const pageCourses = response.result?.courseOpenDtos || [];
        courses.push(...pageCourses);
        const total = Number(response.result?.totalCount) || 0;
        if (!pageCourses.length || courses.length >= total) break;
      }
      return courses;
    }
    async loadSmartCourses(vm) {
      if (typeof vm.$api.getAiCourseList !== "function") throw new Error("平台接口已变更");
      const response = await vm.$api.getAiCourseList({ status: ZHS_QUEUE_CONFIG.courseList.smartStatus });
      if (Number(response?.status) !== 200) throw new Error(response?.msg || `接口返回异常（${response?.status ?? "无响应"}）`);
      const courses = [];
      for (const course of response.rt || []) {
        const entryUrl = course.linkUrl;
        const key = entryUrl && this.getCourseKeyFromUrl(entryUrl);
        if (!key) continue;
        courses.push({
          key,
          name: course.courseName || `课程 ${course.courseId}`,
          desc: ["智慧课程", course.teacherUserName, course.schoolName, course.schedule != null && `进度 ${course.schedule}%`].filter(Boolean).join(" · "),
          cover: course.imgUrl || "",
          entryUrl,
          meta: {
            type: "smart",
            courseId: String(course.courseId ?? ""),
            classId: String(course.classId ?? "")
          }
        });
      }
      return courses;
    }
    // 学习页地址由平台按课程状态动态算，借平台自己的跳转方法，拦下这次跳转拿到地址
    resolveEntryUrl(vm, course) {
      const navigation = _unsafeWindow && _unsafeWindow.navigation;
      if (!navigation?.addEventListener || typeof vm.goCourse !== "function") return Promise.resolve("");
      return new Promise((resolve) => {
        let timer = null;
        const finish = (targetUrl) => {
          clearTimeout(timer);
          navigation.removeEventListener("navigate", onNavigate);
          resolve(targetUrl);
        };
        const onNavigate = (event) => {
          if (!event.cancelable) return;
          event.preventDefault();
          finish(event.destination?.url || "");
        };
        navigation.addEventListener("navigate", onNavigate);
        timer = setTimeout(() => finish(""), ZHS_QUEUE_CONFIG.resolveTimeout * 1e3);
        try {
          vm.goCourse(course, 1);
        } catch (error) {
          finish("");
        }
      });
    }
  }
  const zhsCourseQueueAdapter = new ZhsCourseQueueAdapter();
  const useCourseQueueStore = pinia.defineStore("courseQueue", {
    state: () => ({
      enabled: false,
      platformName: "",
      status: "idle",
      items: [],
      currentKey: null,
      runningElsewhere: false,
      candidates: [],
      selectedKeys: [],
      loadingCandidates: false,
      candidateError: "",
      candidateSource: ""
    }),
    getters: {
      currentItem: (state) => state.items.find((item) => item.key === state.currentKey) || null,
      finishedCount: (state) => state.items.filter((item) => item.status !== "pending" && item.status !== "running").length,
      hasQueue: (state) => state.items.length > 0
    },
    actions: {
      init(adapter) {
        if (this.enabled) return;
        const log = useLogStore();
        const engine = new CourseQueueEngine(adapter, {
          logger: (text, type = null) => log.insertLog(text, type),
          onChange: (queueState) => this.applyState(queueState)
        });
        activeQueueEngine = engine;
        this.enabled = true;
        this.platformName = adapter.platformName;
        this.applyState(engine.getState());
        engine.onPageLoad();
      },
      applyState(queueState) {
        this.status = queueState.status;
        this.items = queueState.items;
        this.currentKey = queueState.currentKey;
        this.runningElsewhere = Boolean(activeQueueEngine?.isOwnedByOtherPage());
      },
      async loadCandidates() {
        if (!activeQueueEngine || this.loadingCandidates) return;
        this.loadingCandidates = true;
        this.candidateError = "";
        try {
          const { courses, error, source } = await activeQueueEngine.adapter.fetchCourseList();
          this.candidates = courses;
          this.candidateSource = source || "";
          this.candidateError = error || "";
          this.selectedKeys = this.selectedKeys.filter((key) => courses.some((course) => course.key === key));
        } finally {
          this.loadingCandidates = false;
        }
      },
      // 勾选顺序就是队列里的先后顺序
      toggleCandidate(key) {
        this.selectedKeys = this.selectedKeys.includes(key) ? this.selectedKeys.filter((item) => item !== key) : [...this.selectedKeys, key];
      },
      clearSelection() {
        this.selectedKeys = [];
      },
      start() {
        const selected = this.selectedKeys.map((key) => this.candidates.find((course) => course.key === key)).filter(Boolean);
        return activeQueueEngine?.start(selected) ?? false;
      },
      pause() {
        activeQueueEngine?.pause();
      },
      resume() {
        activeQueueEngine?.resume();
      },
      removeItem(key) {
        return activeQueueEngine?.removeItem(key) ?? false;
      },
      clear() {
        activeQueueEngine?.clear();
      }
    }
  });
  // 队列界面：读取进行中的课程 → 勾选 → 开始，之后由脚本按顺序一门门刷
  const CourseQueuePanel = {
    name: "CourseQueuePanel",
    setup() {
      const store = useCourseQueueStore();
      const statusText = vue.computed(() => ({
        idle: "未开始",
        running: "运行中",
        paused: "已暂停",
        finished: "已结束"
      }[store.status] || "未开始"));
      const statusLabel = (item) => ({
        pending: "等待中",
        running: "学习中",
        done: "已完成",
        skipped: "已跳过",
        failed: "处理失败"
      }[item.status] || "等待中");
      const load = () => store.loadCandidates();
      const start = () => store.start();
      return { store, statusText, statusLabel, load, start };
    },
    // 用渲染函数而不是模板字符串：油猴沙箱里 new Function 编译出来的代码看不到 Vue 变量
    render() {
      const h = vue.h;
      const store = this.store;
      const statusText = this.statusText;
      const plain = { padding: "5px 12px", borderRadius: "6px", border: "1px solid var(--t-border2)", background: "var(--t-surface)", color: "var(--t-text)", cursor: "pointer" };
      const primary = Object.assign({}, plain, { border: "1px solid var(--t-primary)", background: "var(--t-primary)", color: "#fff" });
      const soft = { alignSelf: "flex-start", padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--t-primary-border)", background: "var(--t-primary-bg)", color: "var(--t-primary)", cursor: "pointer" };
      const row = (style, children) => h("div", { style }, children);
      const children = [
        row({ display: "flex", alignItems: "center", justifyContent: "space-between" }, [
          h("div", { style: { fontSize: "15px", fontWeight: 600 } }, "课程队列"),
          h("div", { style: { color: "var(--t-text3)" } }, statusText)
        ])
      ];
      if (!store.hasQueue) {
        const loadButton = h("button", { onClick: this.load, disabled: store.loadingCandidates, style: soft }, store.loadingCandidates ? "读取中.." : "读取进行中的课程");
        const list = store.candidates.map((course) => h("label", {
          key: course.key,
          style: { display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 10px", border: "1px solid var(--t-border)", borderRadius: "6px", background: "var(--t-surface2)", cursor: "pointer" }
        }, [
          h("input", { type: "checkbox", checked: store.selectedKeys.includes(course.key), onChange: () => store.toggleCandidate(course.key), style: { marginTop: "3px" } }),
          h("span", { style: { display: "flex", flexDirection: "column", gap: "2px" } }, [
            h("span", { style: { color: "var(--t-text)" } }, course.name),
            course.desc ? h("span", { style: { color: "var(--t-text3)", fontSize: "12px" } }, course.desc) : null
          ])
        ]));
        children.push(row({ display: "flex", flexDirection: "column", gap: "10px" }, [
          h("div", { style: { color: "var(--t-text3)", lineHeight: 1.7 } }, "先在浏览器打开智慧树「在线学堂」学生首页，再点下面的按钮读取进行中的课程；勾选的顺序就是自动学习的顺序。"),
          loadButton,
          store.candidateError ? h("div", { style: { color: "var(--t-warning)", lineHeight: 1.6 } }, store.candidateError) : null,
          list.length ? row({ display: "flex", flexDirection: "column", gap: "6px" }, list) : null,
          store.selectedKeys.length ? h("button", { onClick: this.start, style: Object.assign({}, soft, { border: "1px solid var(--t-primary)", background: "var(--t-primary)", color: "#fff" }) }, `开始学习（已选 ${store.selectedKeys.length} 门）`) : null
        ]));
      } else {
        const items = store.items.map((item, index) => h("div", {
          key: item.key,
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "8px 10px", border: "1px solid var(--t-border)", borderRadius: "6px", background: "var(--t-surface2)" }
        }, [
          h("span", { style: { color: "var(--t-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, `${index + 1}. ${item.name}`),
          h("span", { style: { color: "var(--t-text3)", flex: "none" } }, this.statusLabel(item))
        ]));
        children.push(row({ display: "flex", flexDirection: "column", gap: "10px" }, [
          h("div", { style: { color: "var(--t-text3)" } }, `已完成 ${store.finishedCount} / ${store.items.length} 门`),
          row({ display: "flex", flexDirection: "column", gap: "6px" }, items),
          row({ display: "flex", gap: "8px" }, [
            store.status === "running" ? h("button", { onClick: () => store.pause(), style: plain }, "暂停") : null,
            store.status === "paused" ? h("button", { onClick: () => store.resume(), style: primary }, "继续") : null,
            h("button", { onClick: () => store.clear(), style: plain }, "清空队列")
          ])
        ]));
      }
      return row({ padding: "14px", display: "flex", flexDirection: "column", gap: "12px", height: "100%", overflow: "auto", color: "var(--t-text)", fontSize: "13px" }, children);
    }
  };
  // ===== 智慧树掌握度满分 =====
  // 参照「知到智慧树掌握度满分助手」的作答思路移植：
  // 在掌握度热力图里逐个知识点进入练习，答对记住答案，答错换下一组选项重答，
  // 直到知识点达到 100%；答案按课程存在本地，可导出 / 导入题库。
  // 只接管智慧树掌握度页面，超星 / 青书 / 出头 不受影响。
  const zhsMastery = (() => {
    const STORAGE_PREFIX = "xsMastery:";
    const SETTINGS_KEY = STORAGE_PREFIX + "settings";
    const COURSES_KEY = STORAGE_PREFIX + "courses";
    const COURSE_KEY = (id) => STORAGE_PREFIX + "course:" + id;
    const SESSION_KEY = "xsMastery:run";
    const SESSION_TTL_MS = 10 * 60e3;
    const SELECTORS = {
      cards: ".mastery-content-right .chunk-list .item-box",
      cardName: ".item-box-name",
      popover: ".mastery-box-custom-popover",
      questions: ".exam .exam-item, .exam-preview .exam-item",
      title: ".quest-title .option-name",
      type: ".quest-type",
      options: "label.el-radio, label.el-checkbox",
      answerCards: ".exam .answer-card .list .item",
      submit: ".exam .header .submit",
      retry: ".exam-preview .header .submit",
      pointAnalysis: ".point .line1-count-link"
    };
    const DEFAULT_SETTINGS = {
      activity: "practice",
      mode: "all",
      ignoreAnswers: false,
      delay: 200,
      maxRounds: 4096,
      importMatch: "loose"
    };

    // ---------- 本地存储 ----------
    const readJson = (key, fallback) => {
      try {
        const raw = typeof _GM_getValue === "function" ? _GM_getValue(key, "") : window.localStorage.getItem(key);
        if (!raw) return fallback;
        return typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (error) {
        return fallback;
      }
    };
    const writeJson = (key, value) => {
      try {
        const text = JSON.stringify(value);
        if (typeof _GM_setValue === "function") {
          _GM_setValue(key, text);
          return true;
        }
        window.localStorage.setItem(key, text);
        return true;
      } catch (error) {
        return false;
      }
    };
    const settings = Object.assign({}, DEFAULT_SETTINGS, readJson(SETTINGS_KEY, {}) || {});
    if (!["practice", "bank"].includes(settings.activity)) settings.activity = "practice";
    if (!["all", "current"].includes(settings.mode)) settings.mode = "all";
    if (!["loose", "strict"].includes(settings.importMatch)) settings.importMatch = "loose";
    const saveSettings = () => writeJson(SETTINGS_KEY, settings);
    const improving = () => settings.activity === "bank";
    const coldReview = () => improving() && db && db.review && db.review.ignoreAnswers === true;

    // ---------- 纯算法 ----------
    const normalize = (value) => String(value == null ? "" : value).normalize("NFKC").replace(/\s+/g, " ").trim();
    const canonical = (values) => [...values].sort();
    const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
    function combinations(tokens, multiple) {
      if (!tokens.length || tokens.length > 12) throw new Error("选项数量不支持（范围 1～12）");
      const sorted = canonical(tokens);
      if (new Set(sorted).size !== sorted.length) throw new Error("选项无法唯一识别");
      if (!multiple) return sorted.map((token) => [token]);
      const result = [];
      function collect(start, size, chosen) {
        if (!size) {
          result.push(chosen);
          return;
        }
        for (let i = start; i <= sorted.length - size; i++) collect(i + 1, size - 1, [...chosen, sorted[i]]);
      }
      // 先枚举真正的多选组合，再把单项垫在最后，覆盖所有非空子集
      for (let size = 2; size <= sorted.length; size++) collect(0, size, []);
      collect(0, 1, []);
      return result;
    }
    function questionKey(scope, question) {
      return JSON.stringify([scope, question.type, question.title, canonical(question.options.map((option) => option.token))]);
    }
    function binomial(n, k) {
      let value = 1;
      for (let i = 1; i <= k; i++) value = value * (n - i + 1) / i;
      return value;
    }
    function answerModel(records) {
      const model = {};
      const seen = new Set();
      for (const [key, record] of Object.entries(records || {})) {
        if (record.type !== "多选题" || !record.correct || !record.correct.length) continue;
        let parts;
        try {
          parts = JSON.parse(key);
        } catch (error) {
          continue;
        }
        const options = parts && parts[3];
        if (!Array.isArray(options) || options.length < 1 || options.length > 12 || new Set(options).size !== options.length) continue;
        if (new Set(record.correct).size !== record.correct.length || !record.correct.every((token) => options.includes(token))) continue;
        const identity = JSON.stringify([parts[1], parts[2], canonical(options)]);
        if (seen.has(identity)) continue;
        seen.add(identity);
        const counts = model[options.length] || (model[options.length] = {});
        counts[record.correct.length] = (counts[record.correct.length] || 0) + 1;
      }
      return model;
    }
    function rankedCombinations(question, model = {}) {
      const candidates = combinations(question.options.map((option) => option.token), question.multiple);
      const n = question.options.length;
      if (!question.multiple) return candidates;
      // 冷启动按常见正确项数量排个先后，课程里确认过的题逐步覆盖这个先验
      const prior = n === 5 ? { 2: 1, 3: 28, 4: 16, 5: 1 } : {};
      const priorTotal = Object.values(prior).reduce((sum, count) => sum + count, 0);
      const counts = Object.assign({}, model[n] || {});
      for (const [size, count] of Object.entries(prior)) counts[size] = (counts[size] || 0) + 20 * count / priorTotal;
      if (Object.values(counts).reduce((sum, count) => sum + count, 0) < 12) return candidates;
      const score = (choice) => (counts[choice.length] || 0) / binomial(n, choice.length) + 1 / (2 ** n - 1);
      return candidates
        .map((choice, index) => ({ choice, index, score: score(choice) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((item) => item.choice);
    }
    function parseMasteryRate(value) {
      const text = normalize(value);
      if (!/^\d+(?:\.\d+)?\s*%?$/.test(text)) throw new Error("掌握度百分比无法识别，请检查知识点弹窗");
      const rate = Number(text.replace("%", "").trim());
      if (rate < 0 || rate > 100) throw new Error("掌握度百分比超出范围");
      return rate;
    }
    function masteryProgress(colors, rates = []) {
      const total = colors.length;
      const exempt = colors.filter((color) => color === "blue").length;
      const eligible = total - exempt;
      let perfect = 0;
      let verified = 0;
      colors.forEach((color, index) => {
        if (color === "blue") return;
        const rate = rates[index];
        if (typeof rate === "number" && Number.isFinite(rate) && rate >= 0 && rate <= 100) {
          verified++;
          if (rate === 100) perfect++;
        }
      });
      return {
        total,
        exempt,
        eligible,
        perfect,
        verified,
        unchecked: eligible - verified,
        remaining: eligible - perfect,
        percent: eligible ? Math.round(1000 * perfect / eligible) / 10 : total ? 100 : 0
      };
    }
    function nextAnswer(record, question, model, preferred = []) {
      const candidates = rankedCombinations(question, model);
      if (record.correct && record.correct.length) {
        if (!candidates.some((choice) => same(choice, record.correct))) throw new Error("已知答案与当前选项不一致");
        return record.correct;
      }
      const candidateKeys = new Set(candidates.map((choice) => JSON.stringify(canonical(choice))));
      const eligible = preferred.filter((choice) => Array.isArray(choice) && candidateKeys.has(JSON.stringify(canonical(choice))));
      const choice = [...eligible, ...candidates].find((candidate) => !(record.wrong || []).some((wrong) => same(wrong, candidate)));
      if (!choice) throw new Error("所有组合均被判错，已暂停；请检查题目、批改或其他脚本干扰");
      return choice;
    }
    function remember(record, choice, correct) {
      if (!choice.length) throw new Error("批改题目没有已选答案，不能记录");
      if (correct) {
        record.correct = canonical(choice);
        record.wrong = (record.wrong || []).filter((wrong) => !same(wrong, choice));
      } else {
        if (record.correct && same(record.correct, choice)) delete record.correct;
        record.wrong = record.wrong || [];
        if (!record.wrong.some((wrong) => same(wrong, choice))) record.wrong.push(canonical(choice));
      }
    }
    function newReview(ignoreAnswers = false, id = `${Date.now()}-${Math.random().toString(36).slice(2)}`) {
      return {
        id,
        startedAt: new Date().toISOString(),
        ignoreAnswers,
        completed: [],
        items: {},
        trials: {},
        rounds: {},
        activeCard: "",
        readyScope: "",
        finishedAt: null
      };
    }
    function questionIdentity(question) {
      return JSON.stringify([question.type, question.title, canonical(question.options.map((option) => option.token))]);
    }
    function reviewProgress(review, eligible) {
      const completed = new Set((review && review.completed) || []).size;
      const entries = Object.values((review && review.items) || {});
      return {
        completed,
        eligible,
        percent: eligible ? Math.round(1000 * Math.min(completed, eligible) / eligible) / 10 : 0,
        added: entries.filter((item) => item.correct && !item.hadAnswer).length,
        verified: entries.filter((item) => item.correct && item.hadAnswer && !item.changed).length,
        corrected: entries.filter((item) => item.correct && item.changed).length,
        unresolved: entries.filter((item) => !item.correct).length
      };
    }
    function trackReview(review, question, record, choice, correct, imported = false) {
      const identity = questionIdentity(question);
      const item = review.items[identity] || (review.items[identity] = { hadAnswer: Boolean(record.correct && record.correct.length), changed: false, correct: false });
      if (!correct && (imported || (record.correct && same(record.correct, choice)))) item.changed = true;
      item.correct = correct;
      if (review.ignoreAnswers) remember(review.trials[identity] || (review.trials[identity] = { wrong: [] }), choice, correct);
    }
    function reconcileFeedback(records, question, choice, correct) {
      // 同一道题在不同知识点出现时，用这次批改同步修正旧记录；不做模糊覆盖
      const identity = questionIdentity(question);
      for (const [key, record] of Object.entries(records)) {
        let parts;
        try {
          parts = JSON.parse(key);
        } catch (error) {
          continue;
        }
        if (!Array.isArray(parts) || !Array.isArray(parts[3])) continue;
        if (JSON.stringify(parts.slice(1)) !== identity) continue;
        remember(record, choice, correct);
      }
    }
    function masteryURL(currentURL) {
      const current = new URL(currentURL);
      const course = current.searchParams.get("recruitAndCourseId");
      if (!course || !/^https?:$/.test(current.protocol)) throw new Error("无法识别本课程热力图地址");
      const target = new URL("/study/mastery", current.origin);
      target.searchParams.set("recruitAndCourseId", course);
      return target.href;
    }
    function identifyPage(currentURL, markers) {
      if (markers.analysis) return "analysis";
      if (markers.exam) return "exam";
      if (markers.point) return "point";
      if (markers.mastery) return "mastery";
      const url = new URL(currentURL);
      const path = url.pathname.replace(/\/+$/, "");
      return ["/examAnalysis", "/exam", "/study/mastery"].includes(path) || path.startsWith("/pointOfMastery/") ? "loading" : "unknown";
    }
    function extractCourseName(label) {
      const match = normalize(label).match(/^课程名称\s*[:：]\s*(.+)$/);
      return match ? match[1].split(/[|｜]/)[0].trim() : "";
    }
    const matchText = (value) => normalize(value).toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, "");
    function truthToken(value) {
      const text = normalize(value).toLowerCase();
      if (/^(对|正确|是|真|true|t|√|✓|1)$/.test(text)) return "true";
      if (/^(错|错误|不正确|否|假|false|f|×|✗|0)$/.test(text)) return "false";
      return null;
    }
    function textSimilarity(a, b) {
      a = matchText(a);
      b = matchText(b);
      if (!a || !b) return 0;
      if (a === b) return 1;
      if (Math.min(a.length, b.length) < 4) return 0;
      const grams = (value) => {
        const counts = new Map();
        for (let i = 0; i < value.length - 1; i++) {
          const pair = value.slice(i, i + 2);
          counts.set(pair, (counts.get(pair) || 0) + 1);
        }
        return counts;
      };
      const left = grams(a);
      const right = grams(b);
      let overlap = 0;
      for (const [pair, count] of left) overlap += Math.min(count, right.get(pair) || 0);
      return 2 * overlap / (a.length + b.length - 2);
    }
    function importedItem(type, title, options, answers) {
      title = normalize(title);
      if (!["单选题", "多选题", "判断题"].includes(type) || !title) throw new Error("题型或题干缺失");
      options = options.map(normalize);
      if (type === "判断题") {
        options = options.length ? options.map((option) => truthToken(option) || option) : ["true", "false"];
        answers = answers.map((answer) => answer.map((option) => truthToken(option) || normalize(option)));
      } else {
        answers = answers.map((answer) => answer.map(normalize));
      }
      if (!options.length || options.length > 12 || options.some((option) => !option) || new Set(options).size !== options.length) throw new Error("选项缺失、重复或超过12项");
      if (!answers.length || answers.some((answer) => !answer.length || (type !== "多选题" && answer.length !== 1) || new Set(answer).size !== answer.length || !answer.every((value) => options.includes(value)))) throw new Error("答案缺失或不能唯一对应选项");
      const unique = [...new Map(answers.map((answer) => [JSON.stringify(canonical(answer)), canonical(answer)])).values()];
      return { type, title, options, answers: unique };
    }
    function parseTextBank(text) {
      const lines = String(text).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
      const blocks = [];
      let block;
      for (const raw of lines) {
        const line = raw.trim();
        const typed = line.match(/^(?:\d{1,6}\s*[.、．)）]\s*)?[【\[(（]\s*(单选题?|多选题?|判断题?)\s*[】\])）]\s*(.*)$/);
        const numbered = !typed && line.match(/^\d{1,6}\s*[.、．]\s*(?!\d)(.+)$/);
        if (typed || numbered) {
          if (blocks.length >= 20000) throw new Error("单次最多识别20000道题，请拆分题库");
          block = { type: typed ? typed[1].replace(/题?$/, "题") : "", lines: [typed ? typed[2] : numbered[1]], number: blocks.length + 1 };
          blocks.push(block);
        } else if (block && line) block.lines.push(line);
      }
      const items = [];
      const excluded = [];
      for (const entry of blocks) {
        try {
          let body = [...entry.lines];
          let answer = "";
          const explicit = body.findIndex((line) => /^(?:参考答案|正确答案|答案)\s*[:：]/.test(line));
          if (explicit >= 0) {
            answer = body[explicit].replace(/^(?:参考答案|正确答案|答案)\s*[:：]\s*/, "");
            body = body.slice(0, explicit);
          }
          const optionPattern = /^([A-La-l])\s*[.、．:：)）]\s*(.*)$/;
          const optionStart = body.findIndex((line) => optionPattern.test(line));
          let title;
          let options = [];
          const labels = [];
          if (optionStart >= 0) {
            title = body.slice(0, optionStart).join(" ");
            if (!answer) {
              if (optionPattern.test(body[body.length - 1])) throw new Error("没有答案行");
              answer = body.pop();
            }
            for (const line of body.slice(optionStart)) {
              const option = line.match(optionPattern);
              if (option) {
                labels.push(option[1].toUpperCase());
                options.push(option[2]);
              } else {
                options[options.length - 1] += " " + line;
              }
            }
            if (new Set(labels).size !== labels.length) throw new Error("选项字母重复");
          } else {
            if (!answer) answer = body.pop();
            title = body.join(" ");
          }
          answer = normalize(answer);
          let choice;
          const exact = options.filter((option) => normalize(option) === answer);
          if (exact.length === 1) choice = exact;
          else if (labels.length && /^[A-La-l\s,，;；、|]+$/.test(answer)) {
            const letters = answer.toUpperCase().replace(/[\s,，;；、|]/g, "").split("");
            if (!letters.every((letter) => labels.includes(letter))) throw new Error("答案字母不在选项中");
            choice = letters.map((letter) => options[labels.indexOf(letter)]);
          } else choice = answer.split(/[;；]/).map(normalize);
          if (choice.length === 1 && !exact.length && /[,，、|]/.test(answer)) {
            const parts = answer.split(/[,，、|]/).map(normalize);
            if (parts.every((part) => options.some((option) => normalize(option) === part))) choice = parts;
          }
          const type = entry.type || (!options.length && truthToken(answer) ? "判断题" : choice.length > 1 ? "多选题" : "单选题");
          items.push(importedItem(type, title, options, [choice]));
        } catch (error) {
          excluded.push({ number: entry.number, title: entry.lines[0] || "", reason: error.message });
        }
      }
      if (!blocks.length) throw new Error("未识别到题目。请使用“1.【单选题】题干”或“1.题干”开头，每个选项和答案各占一行");
      return { items, excluded, detected: blocks.length };
    }
    function parseJSONBank(text) {
      const data = JSON.parse(String(text).replace(/^\uFEFF/, ""));
      const records = (data && data.records && data.records.questions) || (data && data.questions);
      if (!records || typeof records !== "object" || Array.isArray(records)) throw new Error("JSON不是本脚本导出的记录或题库格式");
      const entries = Object.entries(records);
      if (entries.length > 20000) throw new Error("单次最多识别20000道题，请拆分题库");
      const items = [];
      const excluded = [];
      for (const [key, record] of entries) {
        try {
          if (!record || typeof record !== "object") throw new Error("题目记录无效");
          let parts;
          try {
            parts = JSON.parse(key);
          } catch (error) {
            parts = [];
          }
          const sourceOptions = record.latestOptions || record.options || (parts && parts[3]) || [];
          const options = sourceOptions.map((option) => typeof option === "string" ? { token: option, content: option } : option);
          const tokens = record.correctAnswerTokens || record.correct;
          if (!Array.isArray(tokens) || !tokens.length) throw new Error("没有已确认答案");
          const choice = tokens.map((token) => {
            const matches = options.filter((option) => option && option.token === token);
            if (matches.length !== 1) throw new Error("答案与选项不一致");
            return matches[0].content != null ? matches[0].content : matches[0].token;
          });
          items.push(importedItem(record.type || (parts && parts[1]), record.title || (parts && parts[2]), options.map((option) => (option ? option.content != null ? option.content : option.token : "")), [choice]));
        } catch (error) {
          excluded.push({ number: excluded.length + items.length + 1, title: (record && record.title) || "", reason: error.message });
        }
      }
      return { items, excluded, detected: entries.length };
    }
    function parseBankFile(text, filename = "") {
      return /\.json$/i.test(filename) || /^[\s\uFEFF]*\{/.test(text) ? parseJSONBank(text) : parseTextBank(text);
    }
    function mergeImported(existing, incoming) {
      const map = new Map();
      let added = 0;
      let duplicates = 0;
      let addedAnswers = 0;
      for (const [batch, items] of [existing || [], incoming].entries()) {
        for (const raw of items) {
          const item = importedItem(raw.type, raw.title, raw.options, raw.answers);
          const key = JSON.stringify([item.type, item.title, canonical(item.options)]);
          if (!map.has(key)) {
            map.set(key, Object.assign({}, item, { answers: [] }));
            if (batch === 1) added++;
          }
          const target = map.get(key);
          for (const answer of item.answers) {
            if (target.answers.some((previous) => same(previous, answer))) {
              if (batch === 1) duplicates++;
            } else {
              target.answers.push(answer);
              if (batch === 1) addedAnswers++;
            }
          }
        }
      }
      if (map.size > 20000) throw new Error("合并后超过20000道题，请分到不同课程或先清除导入题库");
      const items = [...map.values()];
      return { items, added, addedAnswers, duplicates, conflicts: items.filter((item) => item.answers.length > 1).length };
    }
    function importedCandidates(items, question, mode = "loose") {
      const live = question.options.map((option) => ({
        token: option.token,
        text: question.type === "判断题" ? truthToken(option.content != null ? option.content : option.token) || normalize(option.content != null ? option.content : option.token) : normalize(option.content != null ? option.content : option.token)
      }));
      const matches = [];
      for (const item of items || []) {
        if (item.type !== question.type) continue;
        let score;
        if (mode === "strict") {
          if (normalize(item.title) !== normalize(question.title) || !same(item.options.map(normalize), live.map((option) => option.text))) continue;
          score = 2;
        } else {
          if (/\[图片:/.test(item.title + question.title) && normalize(item.title) !== normalize(question.title)) continue;
          score = textSimilarity(item.title, question.title);
          if (score < 0.8) continue;
        }
        for (const answer of item.answers) {
          const mapped = [];
          let valid = true;
          for (const value of answer) {
            let options = live.filter((option) => mode === "strict" || /\[图片:/.test(value + option.text) ? option.text === normalize(value) : matchText(option.text) === matchText(value));
            if (!options.length && mode !== "strict" && !/\[图片:/.test(value)) {
              const ranked = live.filter((option) => !/\[图片:/.test(option.text)).map((option) => ({ option, similarity: textSimilarity(value, option.text) })).sort((a, b) => b.similarity - a.similarity);
              if (ranked[0] && ranked[0].similarity >= 0.85 && ranked[0].similarity - ((ranked[1] && ranked[1].similarity) || 0) >= 0.08) options = [ranked[0].option];
            }
            if (options.length !== 1) {
              valid = false;
              break;
            }
            mapped.push(options[0].token);
          }
          if (valid && new Set(mapped).size === mapped.length && (question.multiple || mapped.length === 1)) matches.push({ choice: canonical(mapped), score });
        }
      }
      return [...new Map(matches.sort((a, b) => b.score - a.score).map((item) => [JSON.stringify(item.choice), item.choice])).values()];
    }
    function questionBankFromRecords(records) {
      const bank = { questions: {} };
      for (const [key, record] of Object.entries(records || {})) {
        let parts;
        try {
          parts = JSON.parse(key);
        } catch (error) {
          continue;
        }
        if (!parts || !Array.isArray(parts[3])) continue;
        const [knowledgeScope, type, title, tokens] = parts;
        bank.questions[key] = {
          type: record.type || type,
          title: record.title || title,
          scope: knowledgeScope,
          knowledgeTitle: record.knowledgeTitle || "",
          multiple: type === "多选题",
          latestOptions: record.options || tokens.map((token) => ({ token, content: token, images: [] })),
          correctAnswerTokens: record.correct && record.correct.length ? canonical(record.correct) : null
        };
      }
      return bank;
    }
    function formatTextBank(bank) {
      const line = (value) => String(value == null ? "" : value).replace(/\s+/g, " ").trim();
      const contentOf = (option) => {
        let content = line(option.content != null ? option.content : option.token);
        if (content === option.token) content = content.replace(/\s+\[ID:[^\]]*\]$/, "");
        const images = (option.images || []).map((image) => image.src).filter(Boolean);
        if (images.length && !content.includes("[图片:")) content += ` [图片:${images.join("|")}]`;
        return content;
      };
      const groups = new Map();
      let skipped = 0;
      let duplicates = 0;
      let conflicts = 0;
      let unconfirmed = 0;
      let incomplete = 0;
      const excluded = [];
      const exclude = (key, question, reason) => {
        skipped++;
        if (reason === "unconfirmed") unconfirmed++;
        else incomplete++;
        excluded.push(Object.assign({ key }, question, { reason }));
      };
      for (const [key, question] of Object.entries(bank.questions || {})) {
        const options = question.latestOptions || [];
        const tokens = question.correctAnswerTokens;
        if (!question.title || !["单选题", "多选题", "判断题"].includes(question.type) || !Array.isArray(options) || !options.length || options.some((option) => !option || typeof option.token !== "string" || !option.token)) {
          exclude(key, question, "incomplete");
          continue;
        }
        if (tokens === null || tokens === void 0 || (Array.isArray(tokens) && !tokens.length)) {
          exclude(key, question, "unconfirmed");
          continue;
        }
        if (!Array.isArray(tokens) || (!question.multiple && tokens.length !== 1) || new Set(tokens).size !== tokens.length || new Set(options.map((option) => option.token)).size !== options.length || !tokens.every((token) => options.some((option) => option.token === token))) {
          exclude(key, question, "incomplete");
          continue;
        }
        const contents = options.map(contentOf);
        let answers = options.filter((option) => tokens.includes(option.token)).map(contentOf);
        if (contents.some((content) => !content)) {
          exclude(key, question, "incomplete");
          continue;
        }
        let answer = answers.join(";");
        if (question.type === "判断题") {
          if (/^(对|正确|是|真|true|t|√|✓|1)$/i.test(normalize(answer))) answer = "true";
          else if (/^(错|错误|不正确|否|假|false|f|×|✗|0)$/i.test(normalize(answer))) answer = "false";
        }
        const identity = JSON.stringify([question.type, normalize(question.title), canonical(contents)]);
        const signature = question.type === "判断题" ? answer : JSON.stringify(canonical(answers));
        if (groups.has(identity)) {
          const previous = groups.get(identity);
          if (previous.signature !== signature) previous.conflict = true;
          else duplicates++;
          continue;
        }
        groups.set(identity, { type: question.type, title: line(question.title), contents, answer, signature, key, question });
      }
      const blocks = [];
      for (const item of groups.values()) {
        if (item.conflict) {
          conflicts++;
          excluded.push(Object.assign({ key: item.key }, item.question, { reason: "conflict" }));
          continue;
        }
        const lines = [`${blocks.length + 1}.【${item.type}】${item.title}`];
        if (item.type !== "判断题") lines.push(...item.contents.map((content, index) => `${String.fromCharCode(65 + index)}.${content}`));
        lines.push(item.answer);
        blocks.push(lines.join("\r\n"));
      }
      return {
        text: blocks.length ? blocks.join("\r\n\r\n") + "\r\n" : "",
        exported: blocks.length,
        skipped,
        duplicates,
        conflicts,
        unconfirmed,
        incomplete,
        excluded
      };
    }
    function formatExcludedBankReport(bank) {
      const reasons = { unconfirmed: "尚未取得本题判对答案", incomplete: "题干、选项或答案匹配数据异常", conflict: "同题已确认答案互相冲突" };
      const blocks = bank.excluded.map((question, index) => {
        const lines = [
          `${index + 1}.【${question.type || "未知题型"}】${question.title || "题干缺失"}`,
          `未入库原因：${reasons[question.reason]}`,
          `知识点：${question.knowledgeTitle || question.scope || "未知"}`
        ];
        if (Array.isArray(question.latestOptions)) lines.push(...question.latestOptions.map((option, position) => `${String.fromCharCode(65 + position)}.${(option && option.content) || (option && option.token) || "选项内容缺失"}`));
        return lines.join("\r\n");
      });
      return `未入库题目清单\r\n已入库 ${bank.exported} 题；未确认答案 ${bank.unconfirmed} 题；数据异常 ${bank.incomplete} 题；答案冲突 ${bank.conflicts} 组。\r\n以下题目未写入正式题库；这份清单供排查，不要导入搜题软件作为答案。\r\n\r\n${blocks.join("\r\n\r\n")}\r\n`;
    }

    // ---------- UI 状态 ----------
    const useMasteryStore = pinia.defineStore("zhsMastery", {
      state: () => ({
        visible: false,
        status: "idle",
        message: "未开始",
        courseId: "",
        courseName: "",
        activeName: "",
        activity: settings.activity,
        mode: settings.mode,
        ignoreAnswers: settings.ignoreAnswers,
        importMatch: settings.importMatch,
        delay: settings.delay,
        logs: [],
        progress: null,
        reviewStats: null,
        bankCount: 0,
        wrongCount: 0,
        importedCount: 0,
        courses: [],
        exportCourse: "",
        importPreview: "",
        importReady: false,
        bankPending: 0,
        bankBroken: 0,
        bankConflicts: 0,
        canStart: false,
        pageKind: "unknown"
      }),
      getters: {
        statusText: (state) => ({
          idle: "未开始",
          starting: "启动中",
          running: "运行中",
          paused: "已暂停",
          finished: "已完成"
        }[state.status] || "未开始"),
        percentText: (state) => state.progress ? `${state.progress.percent}%` : "—",
        remainText: (state) => state.progress ? `已满分 ${state.progress.perfect} / 可练 ${state.progress.eligible}，免考 ${state.progress.exempt}，剩余 ${state.progress.remaining}` : "等待核实掌握度"
      },
      actions: {
        start() {
          moduleStart(false);
        },
        pause() {
          moduleStop("已手动暂停");
        },
        setActivity(value) {
          if (running || starting) return;
          settings.activity = value === "bank" ? "bank" : "practice";
          saveSettings();
          syncState();
          refreshProgress();
        },
        setMode(value) {
          if (running || starting) return;
          settings.mode = value === "current" ? "current" : "all";
          saveSettings();
          syncState();
        },
        setIgnoreAnswers(value) {
          if (running || starting) return;
          settings.ignoreAnswers = !!value;
          saveSettings();
          if (db && db.review) {
            db.review.ignoreAnswers = settings.ignoreAnswers;
            save();
          }
          syncState();
        },
        setDelay(value) {
          if (running || starting) return;
          const ms = Number(value);
          if (!Number.isFinite(ms) || ms < 0 || ms > 5000) return;
          settings.delay = Math.round(ms);
          saveSettings();
          syncState();
        },
        exportRecords() {
          exportRecordsFile();
        },
        setImportMatch(value) {
          if (running || starting) return;
          settings.importMatch = value === "strict" ? "strict" : "loose";
          saveSettings();
          syncState();
        },
        refresh() {
          refreshProgress();
        },
        setExportCourse(id) {
          if (this.exportCourse === id) return;
          this.exportCourse = id;
          // 换了目标课程，之前预览过的题库文件就不能再用来导入了
          stagedImport = null;
          this.importPreview = "";
          this.importReady = false;
          refreshImportSummary();
        },
        exportBank() {
          exportBankFile();
        },
        exportExcluded() {
          exportExcludedFile();
        },
        importFile(file) {
          previewBankFile(file);
        },
        confirmImport() {
          changeImportedBank(false);
        },
        cancelImport() {
          stagedImport = null;
          this.importPreview = "";
          this.importReady = false;
        },
        clearImportBank() {
          const id = this.exportCourse || courseId();
          if (!id) return;
          if (!window.confirm("确认清除该课程已导入的候选题库？已确认的答案不受影响。")) return;
          changeImportedBank(true);
        }
      }
    });
    const masteryStore = () => {
      try {
        return useMasteryStore();
      } catch (error) {
        return null;
      }
    };

    // ---------- 运行时状态 ----------
    let db = null;
    let dbCourse = "";
    let running = false;
    let starting = false;
    let busy = false;
    let navigating = false;
    let generation = 0;
    let releaseLock = null;
    let runCourse = "";
    let lastRoute = "";
    let routeSince = Date.now();
    let routeReady = false;
    let statusMessage = "待启动";
    let activeName = "";
    let selectedCard = "";
    let checks = null;
    let checksCourse = "";
    let metadataRoute = "";
    let metadataSince = Date.now();
    let nameScanned = false;
    let stagedImport = null;
    let importBusy = false;
    let bankQualitySignature = "";
    let stepTimer = null;
    let everStarted = false;
    let refreshTimer = null;
    let pagehideHooked = false;
    let candidateSignature = "";
    const candidateCache = new Map();
    const backendCache = new Map();

    const q = (selector, root = document) => root.querySelector(selector);
    const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
    const textOf = (el) => normalize(el && el.textContent);
    const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    function visible(el, viewport = false) {
      if (!el || !el.isConnected) return false;
      for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || node.getAttribute("aria-hidden") === "true") return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (!viewport || (rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth));
    }
    const shown = (selector) => qa(selector).find((el) => visible(el));
    const courseId = () => new URL(location.href).searchParams.get("recruitAndCourseId") || "";
    const DONE_KEY = (id) => STORAGE_PREFIX + "done:" + id;
    function readDoneName() {
      try {
        return window.sessionStorage.getItem(DONE_KEY(courseId()));
      } catch (error) {
        return null;
      }
    }
    function clearDoneName() {
      try {
        window.sessionStorage.removeItem(DONE_KEY(courseId()));
      } catch (error) {
      }
    }
    function scope() {
      const url = new URL(location.href);
      const knowledge = url.searchParams.get("knowledgeId") || (url.pathname.startsWith("/pointOfMastery/") ? url.pathname.split("/")[4] : "");
      if (!courseId() || !knowledge) throw new Error("无法识别课程或知识点，请从掌握度热力图进入");
      return `${courseId()}|${knowledge}`;
    }
    function pageKind() {
      return identifyPage(location.href, {
        analysis: Boolean(q(".exam-preview .exam-item .question-result")),
        exam: Boolean(q(".exam .exam-item .quest-title")),
        point: qa(".point .line1-count-total-num").length === 2,
        mastery: Boolean(q(SELECTORS.cards))
      });
    }

    // ---------- 日志 ----------
    function log(message, course) {
      statusMessage = message;
      const line = `${new Date().toLocaleTimeString("zh-CN", { hour12: false })} ${message}`;
      const store = masteryStore();
      if (store) {
        store.logs.push(line);
        if (store.logs.length > 60) store.logs.splice(0, store.logs.length - 60);
        store.message = message;
      }
      try {
        useLogStore().insertLog(message);
      } catch (error) {
      }
      console.info("[掌握度满分]", message);
    }

    // ---------- 记录存取 ----------
    function registerCourse(id, name = "") {
      const courses = readJson(COURSES_KEY, {}) || {};
      const previous = courses[id];
      const next = { id, name: name || (previous && previous.name) || "" };
      if (!previous || previous.id !== id || previous.name !== next.name) {
        courses[id] = next;
        writeJson(COURSES_KEY, courses);
      }
      return next;
    }
    function loadDB(course) {
      if (!course) throw new Error("请打开课程页面");
      if (dbCourse === course && db) return;
      db = readJson(COURSE_KEY(course), { version: 1, questions: {}, rounds: {}, pending: null });
      if (!db || db.version !== 1 || !db.questions || !db.rounds) throw new Error("本地记录格式异常，请导出后清除记录");
      dbCourse = course;
      const known = registerCourse(course, db.course && db.course.id === course ? db.course.name : "");
      if (!db.course || db.course.name !== known.name) db.course = known;
    }
    function save() {
      if (!db || !dbCourse) return;
      const latest = readJson(COURSE_KEY(dbCourse), null);
      if (latest && latest.imported) {
        db.imported = latest.imported;
        db.importRevision = latest.importRevision;
      }
      writeJson(COURSE_KEY(dbCourse), db);
    }
    function preferredFor(question) {
      if (coldReview()) return [];
      const signature = JSON.stringify([dbCourse, (db && db.importRevision) || 0, settings.importMatch]);
      if (candidateSignature !== signature) {
        candidateSignature = signature;
        candidateCache.clear();
      }
      const key = questionKey(scope(), question);
      if (!candidateCache.has(key)) candidateCache.set(key, importedCandidates(db.imported, question, settings.importMatch));
      return candidateCache.get(key);
    }
    function currentModel() {
      if (!coldReview()) return answerModel(db.questions);
      const trials = Object.fromEntries(Object.entries(db.review.trials).map(([identity, record]) => {
        const parts = JSON.parse(identity);
        return [JSON.stringify(["review", ...parts]), Object.assign({}, record, { type: parts[0] })];
      }));
      return answerModel(trials);
    }
    const answerRecord = (question, record) => coldReview() ? (db.review.trials[questionIdentity(question)] || (db.review.trials[questionIdentity(question)] = { wrong: [] })) : record;

    // ---------- 掌握度缓存（同一次运行内） ----------
    function loadMasteryChecks(course) {
      if (checksCourse === course && checks) return checks;
      checksCourse = course;
      try {
        checks = JSON.parse(window.sessionStorage.getItem(STORAGE_PREFIX + "checks:" + course) || "null");
      } catch (error) {
        checks = null;
      }
      if (!checks || checks.version !== 1 || !checks.entries || typeof checks.entries !== "object") checks = { version: 1, entries: {} };
      return checks;
    }
    function saveMasteryChecks() {
      try {
        window.sessionStorage.setItem(STORAGE_PREFIX + "checks:" + checksCourse, JSON.stringify(checks));
      } catch (error) {
      }
    }
    function cardColor(card) {
      return ["blue", "green", "gray", "origin", "pink"].find((color) => card.classList.contains(color)) || "unknown";
    }
    function cardIdentity(card, index = qa(SELECTORS.cards).indexOf(card)) {
      const section = textOf(q(".mastery-name", card.closest(".mastery-content")));
      return JSON.stringify([courseId(), section, textOf(q(SELECTORS.cardName, card)), index]);
    }
    function checkedRate(card, index) {
      const entry = loadMasteryChecks(courseId()).entries[cardIdentity(card, index)];
      return entry && entry.color === cardColor(card) && typeof entry.rate === "number" && entry.rate >= 0 && entry.rate <= 100 ? entry.rate : null;
    }
    function recordMasteryRate(key, rate, color) {
      loadMasteryChecks(courseId()).entries[key] = { rate, color };
      saveMasteryChecks();
    }

    // ---------- 面板数据 ----------
    const assignIfChanged = (store, key, value) => {
      if (JSON.stringify(store[key]) !== JSON.stringify(value)) store[key] = value;
    };
    function syncState() {
      const store = masteryStore();
      if (!store) return;
      store.activity = settings.activity;
      store.mode = settings.mode;
      store.ignoreAnswers = settings.ignoreAnswers;
      store.importMatch = settings.importMatch;
      if (store.delay !== settings.delay) store.delay = settings.delay;
      store.status = running ? "running" : starting ? "starting" : store.status === "finished" ? "finished" : everStarted ? "paused" : "idle";
      store.canStart = !running && !starting && Boolean(courseId());
    }
    function refreshCourses() {
      const store = masteryStore();
      if (!store) return;
      const id = courseId();
      if (location.href !== metadataRoute) {
        metadataRoute = location.href;
        metadataSince = Date.now();
        nameScanned = false;
      }
      // 扫全页找课程名很吃性能（每个元素都要算样式和位置），每页只做一次，且限制元素数量
      if (id && dbCourse === id && !nameScanned && Date.now() - metadataSince >= 1000 && pageKind() === "mastery") {
        nameScanned = true;
        const candidates = qa("body *")
          .slice(0, 1500)
          .filter((el) => el.children.length < 4 && el.textContent.length < 180 && visible(el))
          .map((el) => textOf(el))
          .filter((text) => extractCourseName(text))
          .sort((a, b) => a.length - b.length);
        const name = candidates.length ? extractCourseName(candidates[0]) : "";
        const course = registerCourse(id, name);
        if (JSON.stringify(db.course) !== JSON.stringify(course)) {
          db.course = course;
          if (running) save();
        }
      }
      const courses = readJson(COURSES_KEY, {}) || {};
      const current = courses[id] || { id, name: "" };
      store.courseId = id;
      store.courseName = id ? current.name || "课程名称待识别" : "当前未打开课程";
      assignIfChanged(store, "courses", Object.values(courses));
      if (!store.exportCourse) store.exportCourse = id;
      store.pageKind = pageKind();
      refreshImportSummary();
    }
    function refreshProgress() {
      const store = masteryStore();
      if (!store || !courseId()) return;
      try {
        loadDB(courseId());
        if (!running && !starting && !busy && !importBusy && dbCourse) {
          const latest = readJson(COURSE_KEY(dbCourse), null);
          if (latest && latest.version === 1 && latest.questions && latest.rounds) db = latest;
        }
        refreshCourses();
        const cards = qa(SELECTORS.cards);
        if (cards.length) {
          const colors = cards.map(cardColor);
          const snapshot = masteryProgress(colors, cards.map(checkedRate));
          if (JSON.stringify(db.progress) !== JSON.stringify(snapshot)) {
            db.progress = snapshot;
            if (running) save();
          }
        }
        let progress = db.progress && db.progress.perfect !== void 0 ? db.progress : null;
        let stats = null;
        if (improving() && progress) {
          stats = reviewProgress(db.review, progress.eligible);
          progress = Object.assign({}, progress, {
            perfect: stats.completed,
            percent: stats.percent,
            remaining: Math.max(0, stats.eligible - stats.completed),
            unchecked: 0
          });
        }
        assignIfChanged(store, "progress", progress);
        assignIfChanged(store, "reviewStats", stats);
        const records = Object.values(db.questions || {});
        store.bankCount = records.filter((record) => record.correct && record.correct.length).length;
        store.wrongCount = records.filter((record) => !record.correct || !record.correct.length).length;
        // 导入候选数和（换过课程时的）题数按「题库课程」下拉框选的那门算
        refreshImportSummary();
      } catch (error) {
        store.progress = null;
        store.message = `记录读取失败：${error.message}`;
      }
    }
    function refreshImportSummary() {
      const store = masteryStore();
      if (!store) return;
      const id = store.exportCourse || courseId();
      if (!id) {
        store.importedCount = 0;
        store.bankPending = 0;
        store.bankBroken = 0;
        store.bankConflicts = 0;
        return;
      }
      const records = readJson(COURSE_KEY(id), null);
      store.importedCount = (records && records.imported ? records.imported.length : 0);
      const questions = (records && records.questions) || null;
      if (questions && id !== dbCourse) {
        // 看的不是当前页面这门课时，题数按所选课程的记录算，别拿当前课程的顶替
        const list = Object.values(questions);
        store.bankCount = list.filter((record) => record.correct && record.correct.length).length;
      }
      // 题库质量（待确认 / 数据异常 / 答案冲突）：只在内容真的变了时重算，别每次刷新都跑一遍全量
      const sample = questions ? Object.keys(questions).length : 0;
      const weight = questions ? Object.values(questions).reduce((sum, record) => sum + ((record.correct || []).length + (record.wrong || []).length), 0) : 0;
      const signature = `${id}|${sample}|${weight}|${store.importedCount}|${(records && records.importRevision) || 0}`;
      if (signature !== bankQualitySignature) {
        bankQualitySignature = signature;
        const bank = formatTextBank(questionBankFromRecords(questions || {}));
        store.bankPending = bank.unconfirmed;
        store.bankBroken = bank.incomplete;
        store.bankConflicts = bank.conflicts;
      }
    }

    // ---------- 题库导入导出 ----------
    function exportSource() {
      const store = masteryStore();
      const id = (store && store.exportCourse) || courseId();
      if (!id) throw new Error("没有可导出的课程记录");
      const records = readJson(COURSE_KEY(id), null);
      if (!records || !records.questions || !records.rounds) throw new Error("所选课程没有有效记录");
      const course = (readJson(COURSES_KEY, {}) || {})[id] || { id, name: "" };
      return { course, records };
    }
    function download(filename, data, mime = "application/json;charset=utf-8") {
      const url = URL.createObjectURL(new Blob([data], { type: mime }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
    const safeName = (value) => String(value || "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/[.\s]+$/, "").slice(0, 80);
    function exportBankFile() {
      try {
        const { course, records } = exportSource();
        const bank = formatTextBank(questionBankFromRecords(records.questions));
        if (!bank.text) throw new Error("还没有确认过的题，暂时没有可导出的题库");
        const at = new Date().toISOString().slice(0, 10);
        download(`${safeName("智慧树纯文字题库")}-${safeName(course.name) || "未识别课程"}-${at}.txt`, "\uFEFF" + bank.text, "text/plain;charset=utf-8");
        log(`已导出题库 ${bank.exported} 题（未确认 ${bank.unconfirmed}、数据异常 ${bank.incomplete}、冲突 ${bank.conflicts}）`);
      } catch (error) {
        log(`导出失败：${error.message}`);
      }
    }
    function exportExcludedFile() {
      try {
        const { course, records } = exportSource();
        const bank = formatTextBank(questionBankFromRecords(records.questions));
        if (!bank.excluded.length) {
          log("没有未入库的题目");
          return;
        }
        const at = new Date().toISOString().slice(0, 10);
        download(`${safeName("智慧树未入库题目")}-${safeName(course.name) || "未识别课程"}-${at}.txt`, "\uFEFF" + formatExcludedBankReport(bank), "text/plain;charset=utf-8");
        log(`已导出未入库清单 ${bank.excluded.length} 条`);
      } catch (error) {
        log(`导出失败：${error.message}`);
      }
    }
    function exportRecordsFile() {
      try {
        const { course, records } = exportSource();
        const at = new Date().toISOString();
        download(`${safeName("智慧树练习记录")}-${safeName(course.name) || "未识别课程"}-${at.slice(0, 10)}.json`, JSON.stringify({ version: 1, course, exportedAt: at, records }, null, 2));
        log("已导出运行记录 JSON");
      } catch (error) {
        log(`导出失败：${error.message}`);
      }
    }
    async function previewBankFile(file) {
      const store = masteryStore();
      if (!file || !store) return;
      if (running || starting || busy || importBusy) {
        log("请先暂停，待当前操作结束后再导入题库");
        return;
      }
      const id = store.exportCourse || courseId();
      if (!id) {
        log("请先打开课程，再选择导入目标");
        return;
      }
      stagedImport = null;
      store.importPreview = "";
      store.importReady = false;
      importBusy = true;
      try {
        if (file.size > 20 * 1024 * 1024) throw new Error("题库文件超过20 MB，请拆分后导入");
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let text;
        if (bytes[0] === 0xff && bytes[1] === 0xfe) text = new TextDecoder("utf-16le", { fatal: true }).decode(buffer);
        else if (bytes[0] === 0xfe && bytes[1] === 0xff) text = new TextDecoder("utf-16be", { fatal: true }).decode(buffer);
        else {
          try {
            text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
          } catch (error) {
            text = new TextDecoder("gb18030", { fatal: true }).decode(buffer);
          }
        }
        const parsed = parseBankFile(text, file.name);
        const records = readJson(COURSE_KEY(id), { version: 1, questions: {}, rounds: {}, pending: null });
        const merged = mergeImported(records.imported, parsed.items);
        const course = (readJson(COURSES_KEY, {}) || {})[id] || { id, name: "" };
        stagedImport = { id, parsed, filename: file.name };
        const sample = parsed.items.slice(0, 3).map((item, index) => `${index + 1}.【${item.type}】${item.title}\n候选：${item.answers.map((answer) => answer.join(";")).join(" / ")}`).join("\n\n");
        store.importPreview = `目标课程：${course.name || id}\n文件：${file.name}\n识别 ${parsed.detected} 题，可用 ${parsed.items.length} 题，无法识别 ${parsed.excluded.length} 题\n新增 ${merged.added} 题 / ${merged.addedAnswers} 个候选答案，重复 ${merged.duplicates} 个，合并后冲突 ${merged.conflicts} 组` + (sample ? `\n\n${sample}` : "");
        store.importReady = parsed.items.length > 0;
        log(`题库预览已准备：可用 ${parsed.items.length} 题，核对后点「确认导入」`);
      } catch (error) {
        store.importPreview = `读取题库失败：${error.message}`;
        log(`读取题库失败：${error.message}`);
      } finally {
        importBusy = false;
      }
    }
    async function changeImportedBank(clear = false) {
      const store = masteryStore();
      if (!store) return;
      if (running || starting || busy || importBusy) {
        log("请先暂停，待当前操作结束后再修改导入题库");
        return;
      }
      const id = store.exportCourse || courseId();
      if (!id || (!clear && (!stagedImport || stagedImport.id !== id))) {
        log("目标课程已改变，请重新选择题库文件");
        return;
      }
      const course = (readJson(COURSES_KEY, {}) || {})[id] || { id, name: "" };
      const incoming = clear ? [] : stagedImport.parsed.items;
      importBusy = true;
      try {
        const applyImport = () => {
          const records = readJson(COURSE_KEY(id), { version: 1, questions: {}, rounds: {}, pending: null });
          const merged = mergeImported(clear ? [] : records.imported, incoming);
          records.imported = merged.items;
          records.importRevision = (Number(records.importRevision) || 0) + 1;
          writeJson(COURSE_KEY(id), records);
          if (dbCourse === id) db = records;
          registerCourse(id, course.name);
          candidateCache.clear();
          return merged;
        };
        const merged = navigator.locks
          ? await navigator.locks.request(STORAGE_PREFIX + "lock:" + id, { ifAvailable: true }, (lock) => {
            if (!lock) throw new Error("该课程正在其他标签页运行，请先暂停后再导入");
            return applyImport();
          })
          : applyImport();
        stagedImport = null;
        store.importPreview = "";
        store.importReady = false;
        log(clear ? `[${course.name || id}] 导入候选已清除，已确认答案保留` : `[${course.name || id}] 已合并导入：新增 ${merged.added} 题、${merged.addedAnswers} 个候选答案`);
      } catch (error) {
        log(`题库修改失败：${error.message}`);
      } finally {
        importBusy = false;
        refreshImportSummary();
      }
    }

    // ---------- 页面守卫 ----------
    function challenge() {
      return qa('iframe[src*="captcha"], iframe[src*="turing.captcha"], .yidun_popup, .geetest_panel, .tcaptcha-transform, [id*="captcha"][role="dialog"]').find((el) => visible(el, true));
    }
    function dialogs() {
      const matches = qa(".el-message-box, .el-dialog, [role=\"dialog\"]").filter((el) => visible(el));
      return matches.filter((el) => !matches.some((other) => other !== el && el.contains(other)));
    }
    function guard(ctx, navigation = false, allowDialog = false) {
      if (!running || ctx.generation !== generation) throw new Error("操作已取消");
      if (courseId() !== runCourse) throw new Error("课程已改变，请重新开始");
      if (!navigation && location.href !== ctx.url) throw new Error("页面已改变，已停止当前操作");
      if (challenge()) throw new Error("页面出现需要手动处理的提示，请检查后点击继续");
      if (!allowDialog && dialogs().length) throw new Error("出现弹窗，请手动处理后点击继续");
    }
    async function pauseMs(ms, ctx, navigation = false, allowDialog = false) {
      const end = Date.now() + ms;
      do {
        guard(ctx, navigation, allowDialog);
        await sleepMs(Math.min(100, Math.max(0, end - Date.now())));
      } while (Date.now() < end);
      guard(ctx, navigation, allowDialog);
    }
    async function waitFor(fn, ctx, timeout = 20000, navigation = false, allowDialog = false) {
      const end = Date.now() + timeout;
      do {
        guard(ctx, navigation, allowDialog);
        const result = fn();
        if (result) return result;
        await pauseMs(80, ctx, navigation, allowDialog);
      } while (Date.now() < end);
      throw new Error("等待页面响应超时，已暂停；请检查页面后继续");
    }
    async function click(el, ctx, allowDialog = false) {
      guard(ctx, false, allowDialog);
      if (!el || !visible(el) || el.disabled || el.classList.contains("disabled") || el.getAttribute("aria-disabled") === "true") throw new Error("按钮不存在、不可见或不可点击");
      el.scrollIntoView({ block: "center", inline: "nearest" });
      await pauseMs(settings.delay, ctx, false, allowDialog);
      guard(ctx, false, allowDialog);
      if (!el.isConnected) throw new Error("页面元素已刷新，请继续重试");
      el.click();
    }
    async function navigateClick(el, ctx, expectedPage) {
      await click(el, ctx);
      await waitFor(() => location.href !== ctx.url && expectedPage.includes(pageKind()), ctx, 25000, true);
      await pauseMs(settings.delay, ctx, true);
    }

    // ---------- 题目读取 ----------
    function mediaKey(el) {
      return qa("img", el).map((img) => img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("alt") || "").join("|");
    }
    function readQuestion(el, index) {
      const titleEl = q(SELECTORS.title, el);
      const title = textOf(titleEl) + (titleEl && mediaKey(titleEl) ? ` [图片:${mediaKey(titleEl)}]` : "");
      const type = textOf(q(SELECTORS.type, el));
      if (!title || !/^(单选题|多选题|判断题)$/.test(type)) throw new Error(`第 ${index + 1} 题题型或题干不支持：${type || "未知"}`);
      const labels = qa(SELECTORS.options, el);
      const base = labels.map((label) => textOf(q(".preStyle", label)) || textOf(label).replace(/^[A-Z][.、．]\s*/i, ""));
      const options = labels.map((label, i) => {
        const input = q("input", label);
        const content = `${base[i]}${mediaKey(label) ? " [图片:" + mediaKey(label) + "]" : ""}`;
        const duplicate = base.filter((value) => value === base[i]).length > 1;
        const token = content + (duplicate ? ` [ID:${(input && input.value) || ""}]` : "");
        if (!input || !content || (duplicate && !input.value)) throw new Error(`第 ${index + 1} 题选项无法识别`);
        return {
          label,
          input,
          token,
          letter: String.fromCharCode(65 + i),
          content: base[i],
          inputValue: input.value,
          images: qa("img", label).map((img) => ({ src: img.getAttribute("src") || img.getAttribute("data-src") || "", alt: img.getAttribute("alt") || "" }))
        };
      });
      const multiple = type === "多选题";
      if (options.some((option) => option.input.type !== (multiple ? "checkbox" : "radio"))) throw new Error("题型与选项控件不一致");
      combinations(options.map((option) => option.token), multiple);
      const number = Number((textOf(q(".option-index", el)).match(/\d+/) || [])[0]) || index + 1;
      return { el, title, type, multiple, options, number };
    }
    const selectedChoice = (question) => question.options.filter((option) => option.input.checked).map((option) => option.token);
    function questions() {
      const roots = qa(SELECTORS.questions);
      if (!roots.length) throw new Error("没有识别到题目，请等待加载后继续");
      return roots.map(readQuestion);
    }
    const answerLabel = (question, choice) => question.options.filter((option) => choice.includes(option.token)).map((option) => option.letter).join("");

    // ---------- 题库 / AI 先答 ----------
    function mapBackendAnswer(question, answers) {
      const picked = [];
      const list = typeof normalizeLocalBackendAnswers === "function" ? normalizeLocalBackendAnswers(answers) : [].concat(answers || []);
      for (const raw of list) {
        const text = String(raw == null ? "" : raw).trim();
        if (!text) continue;
        if (/^[A-Za-z]{1,8}$/.test(text)) {
          const letters = text.toUpperCase().split("");
          const mapped = letters.map((letter) => question.options[letter.charCodeAt(0) - 65]);
          if (mapped.every(Boolean)) {
            mapped.forEach((option) => picked.push(option.token));
            continue;
          }
        }
        let hit = question.options.find((option) => option.content === text);
        if (!hit) hit = question.options.find((option) => normalize(option.content) === normalize(text));
        if (!hit) hit = question.options.find((option) => option.content && (option.content.includes(text) || text.includes(option.content)));
        if (!hit) return null;
        picked.push(hit.token);
      }
      const unique = [...new Set(picked)];
      if (!unique.length) return null;
      if (!question.multiple && unique.length !== 1) return null;
      return canonical(unique);
    }
    async function backendChoice(question, trial, options = {}) {
      let token = "";
      try {
        token = useSettingStore().config.basicConfig.token.value || "";
      } catch (error) {
        token = "";
      }
      if (!token) return null;
      const identity = questionIdentity(question);
      let choice = backendCache.get(identity);
      if (choice === void 0) {
        let result = null;
        try {
          result = await callLocalBackendAnswer({
            title: question.title,
            optionsText: question.options.map((option) => option.content),
            type: QUESTION_TYPE_CODE_MAP[question.type] || question.type,
            element: question.el,
            refer: location.href
          }, options);
        } catch (error) {
          result = null;
        }
        if (result && result.code === 1 && result.data && Array.isArray(result.data.answer)) {
          choice = mapBackendAnswer(question, result.data.answer);
          backendCache.set(identity, choice);
        } else if (result && result.code === -1004) {
          // 服务器明确回复「没有答案」：本轮不再重复问
          choice = null;
          backendCache.set(identity, choice);
        } else {
          // 网络失败、限流、未登录等：不缓存，稍后可重试，避免一次抖动就被当成没有答案去猜
          choice = null;
        }
      }
      if (!choice) return null;
      if ((trial.wrong || []).some((wrong) => same(wrong, choice))) return null;
      return choice;
    }

    // 整页题库批量查询：一次请求把题库里已有的答案全部取回，没命中的题再逐题问 AI
    async function batchBankAnswers(list) {
      let token = "";
      try {
        token = useSettingStore().config.basicConfig.token.value || "";
      } catch (error) {
        token = "";
      }
      if (!token || !list.length) return [];
      const answers = new Array(list.length).fill(null);
      const CHUNK = 20;
      for (let start = 0; start < list.length; start += CHUNK) {
        const slice = list.slice(start, start + CHUNK);
        const payload = JSON.stringify(slice.map((question) => ({
          question: question.title || "",
          options: question.options.map((option) => option.content),
          type: QUESTION_TYPE_CODE_MAP[question.type] || question.type,
          refer: location.href
        })));
        const result = await new Promise((resolve) => {
          GM_xmlhttpRequest({
            url: LOCAL_BACKEND_ANSWER_URL + "/bank?v=xs-6",
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
              Authorization: "Bearer " + token
            },
            data: "questions=" + encodeURIComponent(payload) + "&match_mode=auto",
            timeout: 60000,
            onload: (response) => {
              try {
                resolve(JSON.parse(response.responseText || "{}"));
              } catch (error) {
                resolve(null);
              }
            },
            onerror: () => resolve(null),
            ontimeout: () => resolve(null)
          });
        });
        if (!result || result.code !== 200 || !result.data || !Array.isArray(result.data.items)) continue;
        if (result.data.profile) updateUserInfoFromProfile(result.data.profile);
        for (const entry of result.data.items) {
          const index = Number(entry && entry.index);
          if (!Number.isInteger(index) || index < 0 || index >= slice.length) continue;
          if (!entry.answer) continue;
          const mapped = mapBackendAnswer(slice[index], [entry.answer]);
          if (mapped && mapped.length) answers[start + index] = mapped;
        }
      }
      return answers;
    }

    // ---------- 各页面处理 ----------
    async function finishKnowledge(ctx) {
      guard(ctx);
      const target = masteryURL(ctx.url);
      if (selectedCard) recordMasteryRate(selectedCard, 100, "green");
      if (!selectedCard && activeName) {
        // 答题过程中换过页面，卡片身份丢了：先按知识点名字记下来，回到热力图再回填成 100%
        try {
          window.sessionStorage.setItem(DONE_KEY(runCourse || courseId()), activeName);
        } catch (error) {
        }
      }
      if (improving()) {
        const card = db.review.activeCard || selectedCard;
        if (!card) throw new Error("本轮知识点身份缺失，请回到热力图后继续");
        if (!db.review.completed.includes(card)) db.review.completed.push(card);
        db.review.activeCard = "";
        db.review.readyScope = "";
      }
      save();
      if (!improving() && settings.mode === "current") {
        stopMastery("当前知识点已全部答对，返回热力图并停止");
        location.assign(target);
        return;
      }
      saveRun();
      log(`${activeName} 本轮全部答对，跳转热力图继续下一项`);
      goHome(target);
    }
    function goHome(target) {
      navigating = true;
      const attempt = generation;
      location.assign(target);
      setTimeout(() => {
        if (navigating && running && generation === attempt) log("正在等待热力图载入；若页面仍未变化，请刷新，或暂停后重试");
      }, 25000);
    }
    async function handleExam(ctx) {
      const quiz = questions();
      const cards = qa(SELECTORS.answerCards);
      if (cards.length !== quiz.length) throw new Error("题目数量与答题卡不一致，暂停等待页面完整加载");
      activeName = textOf(q(".exam .nodename"));
      const knowledge = scope();
      const rounds = improving() ? db.review.rounds : db.rounds;
      if ((rounds[knowledge] || 0) >= settings.maxRounds) throw new Error(`此知识点已达到 ${settings.maxRounds} 轮，请检查记录后调整上限`);
      const model = currentModel();
      const plan = [];
      const entries = quiz.map((item) => {
        const { key, record } = recordFor(item);
        return { key, item, preferred: preferredFor(item), trial: answerRecord(item, record) };
      });
      // 先用一次批量请求取回题库里已有的答案，题库没命中的题再逐题问 AI（保持原来的准确率）
      const pending = entries.map((entry, index) => index).filter((index) => !(entries[index].trial.correct && entries[index].trial.correct.length));
      let batchAnswers = [];
      if (pending.length) {
        try {
          batchAnswers = await batchBankAnswers(pending.map((index) => entries[index].item));
        } catch (error) {
          batchAnswers = [];
        }
      }
      const bankPicked = new Map();
      pending.forEach((entryIndex, position) => {
        const mapped = batchAnswers[position];
        if (mapped && mapped.length) {
          bankPicked.set(entryIndex, mapped);
          backendCache.set(questionIdentity(entries[entryIndex].item), mapped);
        }
      });
      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index];
        const item = entry.item;
        const trial = entry.trial;
        let choice = null;
        let source = "尝试";
        if (trial.correct && trial.correct.length) {
          choice = nextAnswer(trial, item, model, entry.preferred);
          source = "沿用正确答案";
        } else if (bankPicked.has(index)) {
          choice = bankPicked.get(index);
          source = "题库/AI";
        } else {
          const backend = await backendChoice(item, trial);
          if (backend) {
            choice = backend;
            source = "题库/AI";
          } else {
            choice = nextAnswer(trial, item, model, entry.preferred);
            source = entry.preferred.some((candidate) => same(candidate, choice)) ? "题库候选" : "尝试";
          }
        }
        plan.push({ q: item, key: entry.key, choice, known: Boolean(trial.correct && trial.correct.length), imported: source === "题库候选", source });
      }
      // 填答可以中断；只有所有题目的实际勾选状态符合计划才会提交
      for (let index = 0; index < plan.length; index++) {
        const item = plan[index];
        if (!visible(item.q.el)) {
          const card = cards.find((node) => Number(textOf(node)) === item.q.number);
          await click(card, ctx);
          await waitFor(() => visible(item.q.el), ctx);
        }
        log(`第 ${index + 1}/${plan.length} 题：${item.source} ${answerLabel(item.q, item.choice)}`);
        for (const option of item.q.options) {
          const want = item.choice.includes(option.token);
          if ((item.q.multiple && option.input.checked !== want) || (!item.q.multiple && want && !option.input.checked)) {
            if (option.input.disabled) throw new Error("选项不可编辑，请确认当前是答题页");
            await click(option.label, ctx);
            await waitFor(() => option.input.checked === want, ctx, 3000);
          }
        }
        if (!same(selectedChoice(item.q), item.choice)) throw new Error(`第 ${index + 1} 题选择未生效，可能有其他脚本修改答案`);
      }
      await pauseMs(settings.delay, ctx);
      if (plan.some((item) => !same(selectedChoice(item.q), item.choice))) throw new Error("提交前答案被改变，请关闭其他自动答题脚本后继续");
      db.pending = {
        scope: knowledge,
        title: activeName,
        entries: plan.map(({ key, choice, imported }) => ({ key, choice, imported })),
        at: Date.now(),
        reviewId: improving() ? db.review.id : null
      };
      save();
      log(`本轮已作答 ${plan.length} 题，准备提交（第 ${(db.rounds[knowledge] || 0) + 1} 轮）`);
      await click(q(SELECTORS.submit), ctx);
      const end = Date.now() + 25000;
      const accepted = new WeakSet();
      while (Date.now() < end) {
        guard(ctx, true, true);
        if (location.href !== ctx.url && ["point", "analysis"].includes(pageKind())) {
          db.rounds[knowledge] = (db.rounds[knowledge] || 0) + 1;
          if (improving()) db.review.rounds[knowledge] = (db.review.rounds[knowledge] || 0) + 1;
          save();
          await pauseMs(settings.delay, ctx, true);
          return;
        }
        for (const dialog of dialogs()) {
          if (accepted.has(dialog)) continue;
          const message = textOf(dialog);
          if (/未[作答回答]|未完成|漏答|验证码/.test(message)) throw new Error("提交提示有未作答题目或验证，请手动检查");
          if (/次数|已用完|上限|无法继续|不足/.test(message)) throw new Error("平台提示答题次数受限，已暂停");
          if (!/(确认提交|确定.{0,6}提交|是否.{0,6}提交|提交后|交卷|提交.{0,6}[？?])/.test(message)) throw new Error("出现未识别的提交弹窗，请手动处理后继续");
          const confirm = qa("button", dialog).find((button) => /^(确定|确认|提交|确认提交|确定提交)$/.test(textOf(button)));
          if (!confirm) throw new Error("未识别提交确认按钮");
          accepted.add(dialog);
          await click(confirm, ctx, true);
        }
        await pauseMs(100, ctx, true, true);
      }
      throw new Error("提交没有返回批改结果；已暂停，避免重复提交");
    }
    function recordFor(question) {
      const key = questionKey(scope(), question);
      const record = db.questions[key] || (db.questions[key] = { title: question.title, type: question.type, wrong: [] });
      record.options = question.options.map((option, index) => ({
        token: option.token,
        content: option.content,
        letter: option.letter || String.fromCharCode(65 + index),
        index: index + 1,
        inputValue: option.inputValue,
        images: (option.images || []).map((image) => Object.assign({}, image))
      }));
      record.knowledgeTitle = activeName;
      return { key, record };
    }
    async function handleAnalysis(ctx) {
      if (improving() && !db.pending) {
        if (db.review.readyScope === scope()) await finishKnowledge(ctx);
        else await navigateClick(q(SELECTORS.retry), ctx, ["exam"]);
        return;
      }
      if (improving() && db.pending.reviewId !== db.review.id) throw new Error("存在上一轮未处理的答卷，请从热力图开始新一轮");
      const quiz = questions();
      activeName = textOf(q(".exam-preview .nodename"));
      const outcomes = quiz.map((item) => {
        const result = q(".question-result", item.el);
        const message = textOf(result);
        const correct = /回答正确/.test(message) ? true : /回答错误/.test(message) ? false : null;
        if (correct === null) throw new Error("批改尚未完成，或反馈格式改变，请等待后继续");
        const choice = selectedChoice(item);
        if (!choice.length || (!item.multiple && choice.length !== 1)) throw new Error("解析页没有有效的已选答案");
        const { key, record } = recordFor(item);
        return { q: item, key, record, choice, correct, message };
      });
      if (db.pending) {
        if (db.pending.scope !== scope()) throw new Error("批改知识点与待提交记录不同，请返回原知识点继续");
        if (db.pending.entries.length !== outcomes.length || outcomes.some((outcome) => {
          const entry = db.pending.entries.find((node) => node.key === outcome.key);
          return !entry || !same(entry.choice, outcome.choice);
        })) throw new Error("批改答案与本轮提交记录不一致，请检查其他脚本或是否查看了旧记录");
      }
      outcomes.forEach((outcome) => {
        if (improving()) trackReview(db.review, outcome.q, outcome.record, outcome.choice, outcome.correct, (db.pending && db.pending.entries.find((entry) => entry.key === outcome.key) || {}).imported);
        reconcileFeedback(db.questions, outcome.q, outcome.choice, outcome.correct);
      });
      const count = outcomes.filter((outcome) => outcome.correct).length;
      if (improving()) db.review.readyScope = count === outcomes.length ? scope() : "";
      db.pending = null;
      save();
      log(`已记住批改结果：${count}/${outcomes.length} 正确`);
      if (count === outcomes.length) {
        await finishKnowledge(ctx);
      } else {
        const model = currentModel();
        outcomes.forEach((outcome) => nextAnswer(answerRecord(outcome.q, outcome.record), outcome.q, model, preferredFor(outcome.q)));
        await navigateClick(q(SELECTORS.retry), ctx, ["exam"]);
      }
    }
    async function handlePoint(ctx) {
      activeName = textOf(q(".point .backup-title"));
      const counts = qa(".point .line1-count-total-num").map((el) => Number(textOf(el)));
      if (counts.length !== 2 || !Number.isInteger(counts[0]) || counts[0] <= 0 || !Number.isInteger(counts[1]) || counts[1] < 0 || counts[1] > counts[0]) throw new Error("结果页题数未加载或没有练习题");
      if (db.pending && db.pending.scope === scope()) {
        await navigateClick(q(SELECTORS.pointAnalysis), ctx, ["analysis"]);
        return;
      }
      if (counts[1] === counts[0] && (!improving() || db.review.readyScope === scope())) {
        await finishKnowledge(ctx);
      } else await navigateClick(q(SELECTORS.pointAnalysis), ctx, ["analysis"]);
    }
    function associatedPopover(card) {
      const name = q(SELECTORS.cardName, card);
      const ids = ((name && name.getAttribute("aria-describedby")) || "").split(/\s+/);
      const linked = ids.map((id) => document.getElementById(id)).find((el) => el && el.matches(SELECTORS.popover));
      if (linked) return linked;
      const matches = qa(SELECTORS.popover).filter((el) => textOf(q("strong.name", el)) === textOf(name));
      return matches.length === 1 ? matches[0] : null;
    }
    async function openPopover(card, ctx) {
      const name = q(SELECTORS.cardName, card);
      if (!name) throw new Error("知识点名称未识别");
      card.scrollIntoView({ block: "center" });
      await pauseMs(settings.delay, ctx);
      const rect = name.getBoundingClientRect();
      for (const type of ["pointerenter", "mouseenter", "mouseover", "mousemove"]) {
        guard(ctx);
        const EventClass = type.startsWith("pointer") ? PointerEvent : MouseEvent;
        name.dispatchEvent(new EventClass(type, { bubbles: type !== "mouseenter" && type !== "pointerenter", clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
      }
      return waitFor(() => {
        const popover = associatedPopover(card);
        return popover && visible(popover) && textOf(q("strong.name", popover)) === textOf(name) ? popover : null;
      }, ctx, 3500);
    }
    async function handleMastery(ctx) {
      if (!improving() && settings.mode === "current") {
        stopMastery("当前知识点模式：请手动进入一个知识点后继续");
        return;
      }
      const cards = qa(SELECTORS.cards);
      if (!cards.length) throw new Error("热力图知识点尚未加载，请等待后继续");
      const doneName = readDoneName();
      if (doneName) {
        const index = cards.findIndex((card) => textOf(q(SELECTORS.cardName, card)) === doneName);
        if (index >= 0) recordMasteryRate(cardIdentity(cards[index], index), 100, cardColor(cards[index]));
        clearDoneName();
      }
      let target;
      let targetIndex;
      for (const [index, card] of cards.entries()) {
        const color = cardColor(card);
        if (color === "blue") continue;
        if (color === "unknown") throw new Error("热力图出现未知颜色状态");
        let rate = checkedRate(card, index);
        if (rate === null) {
          log(`核实掌握度 ${index + 1}/${cards.length}：${textOf(q(SELECTORS.cardName, card))}`);
          const popover = await openPopover(card, ctx);
          rate = parseMasteryRate(textOf(q(".text > span", popover)));
          recordMasteryRate(cardIdentity(card, index), rate, color);
        }
        const needed = improving() ? !db.review.completed.includes(cardIdentity(card, index)) : rate !== 100;
        if (needed && !target) {
          target = card;
          targetIndex = index;
        }
      }
      if (!target) {
        if (improving()) {
          db.review.finishedAt = new Date().toISOString();
          save();
        }
        refreshProgress();
        stopMastery(improving() ? "本轮题库完善已完成，可导出题库；开始新一轮可继续收集新题" : "所有非免考知识点已确认100%掌握度，任务完成");
        return;
      }
      selectedCard = cardIdentity(target, targetIndex);
      activeName = textOf(q(SELECTORS.cardName, target));
      log(`进入知识点：${activeName}`);
      const popover = await openPopover(target, ctx);
      const rate = parseMasteryRate(textOf(q(".text > span", popover)));
      recordMasteryRate(selectedCard, rate, cardColor(target));
      if (!improving() && rate === 100) {
        log(`${activeName} 已100%，跳过`);
        return;
      }
      if (improving()) {
        db.review.activeCard = selectedCard;
        db.review.readyScope = "";
        save();
      }
      const button = qa("button", popover).find((el) => textOf(el) === "提升掌握度");
      await navigateClick(button, ctx, ["exam", "point", "analysis"]);
    }
    async function step() {
      if (!running || busy || navigating) return;
      if (location.href !== lastRoute) {
        lastRoute = location.href;
        routeSince = Date.now();
        routeReady = false;
      }
      if (Date.now() - routeSince < 1000) return;
      busy = true;
      const ctx = { generation, url: location.href };
      try {
        guard(ctx);
        const kind = pageKind();
        if (kind === "unknown" || kind === "loading") {
          if (Date.now() - routeSince < 25000) return;
          throw new Error("当前页面不是掌握度练习，或加载超时，请返回热力图");
        }
        if (!routeReady) {
          await pauseMs(600, ctx);
          routeReady = true;
        }
        loadDB(runCourse);
        if (kind === "exam") await handleExam(ctx);
        else if (kind === "analysis") await handleAnalysis(ctx);
        else if (kind === "point") await handlePoint(ctx);
        else await handleMastery(ctx);
      } catch (error) {
        if (ctx.generation === generation && running) stopMastery(error.message || String(error));
      } finally {
        busy = false;
        syncState();
      }
    }

    // ---------- 启动 / 暂停 ----------
    function saveRun() {
      try {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ course: runCourse, activity: settings.activity, mode: settings.mode, at: Date.now() }));
      } catch (error) {
      }
    }
    function clearRun() {
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
      } catch (error) {
      }
    }
    function resumeMarker() {
      try {
        const raw = window.sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || !data.course || Date.now() - data.at > SESSION_TTL_MS) return null;
        if (data.course !== courseId()) return null;
        return data;
      } catch (error) {
        return null;
      }
    }
    async function moduleStart(resume = false) {
      if (running || starting || busy || importBusy) return;
      const requestedCourse = courseId();
      if (!requestedCourse || pageKind() === "unknown") {
        log(`请打开掌握度热力图或知识点练习页面（当前路径：${location.pathname}）`);
        return;
      }
      starting = true;
      syncState();
      const attempt = ++generation;
      log("等待热力图知识点列表或练习题目加载…");
      try {
        const deadline = Date.now() + 30000;
        while (starting && attempt === generation) {
          if (courseId() !== requestedCourse) {
            stopMastery("课程已改变，请在当前课程重新开始");
            return;
          }
          const kind = pageKind();
          if (kind !== "loading" && kind !== "unknown") break;
          if (Date.now() >= deadline) {
            stopMastery("课程页面加载超时，请确认知识点列表或题目已显示后继续");
            return;
          }
          await sleepMs(200);
        }
        if (!starting || attempt !== generation) return;
        runCourse = requestedCourse;
        const lock = await acquireLock(requestedCourse, attempt);
        if (!lock) return;
        dbCourse = "";
        loadDB(runCourse);
        if (improving()) {
          db.review = db.review || newReview(settings.ignoreAnswers);
          if (db.review.finishedAt) {
            starting = false;
            releaseLock && releaseLock();
            releaseLock = null;
            log("本轮已完成，请点「开始新一轮」继续完善题库");
            return;
          }
          save();
        }
        loadMasteryChecks(runCourse);
        if (resume !== true) {
          checks = { version: 1, entries: {} };
          saveMasteryChecks();
        }
        selectedCard = improving() ? db.review.activeCard : "";
        running = true;
        starting = false;
        everStarted = true;
        generation++;
        lastRoute = location.href;
        routeSince = Date.now();
        routeReady = false;
        saveRun();
        if (stepTimer) clearInterval(stepTimer);
        stepTimer = setInterval(() => {
          step();
        }, 350);
        if (improving() && !selectedCard && pageKind() !== "mastery") {
          log("返回热力图，建立本轮知识点列表");
          goHome(masteryURL(location.href));
        } else {
          log(pageKind() === "mastery" ? "已识别热力图，开始处理下一知识点" : "已识别练习页面，逐题尝试并保存批改结果");
        }
        refreshProgress();
        syncState();
      } catch (error) {
        if (attempt === generation || running) stopMastery(`启动失败：${error.message}`);
      }
    }
    function acquireLock(course, attempt) {
      return new Promise((resolve) => {
        if (!navigator.locks) {
          resolve(true);
          return;
        }
        navigator.locks.request(STORAGE_PREFIX + "lock:" + course, { ifAvailable: true }, (lock) => {
          return new Promise((holdRelease) => {
            if (!starting || attempt !== generation) {
              resolve(false);
              holdRelease();
              return;
            }
            if (!lock) {
              starting = false;
              syncState();
              log("此课程已有另一个标签页在运行，请先暂停它");
              resolve(false);
              return;
            }
            releaseLock = holdRelease;
            resolve(true);
          });
        }).catch(() => resolve(attempt === generation));
      });
    }
    function stopMastery(reason = "已手动暂停") {
      navigating = false;
      running = false;
      starting = false;
      selectedCard = "";
      generation++;
      if (stepTimer) {
        clearInterval(stepTimer);
        stepTimer = null;
      }
      clearRun();
      if (releaseLock) {
        releaseLock();
        releaseLock = null;
      }
      const store = masteryStore();
      if (store) {
        store.status = reason.includes("完成") || reason.includes("任务完成") ? "finished" : "paused";
      }
      log(reason);
      syncState();
      refreshProgress();
    }
    function resetReview() {
      const id = courseId();
      if (!id || running || starting) return;
      dbCourse = "";
      loadDB(id);
      db.review = newReview(settings.ignoreAnswers);
      db.pending = null;
      save();
      log("已开始新一轮题库完善");
      moduleStart(false);
    }

    // ---------- 面板 ----------
    const MasteryPanel = {
      name: "MasteryPanel",
      setup() {
        const store = useMasteryStore();
        const onFile = (event) => {
          const file = event.target.files && event.target.files[0];
          if (file) store.importFile(file);
          event.target.value = "";
        };
        const start = () => store.start();
        const reset = () => resetReview();
        return { store, onFile, start, reset };
      },
      // 用渲染函数而不是模板字符串：油猴沙箱里 new Function 编译出来的代码看不到 Vue 变量
      render() {
        const h = vue.h;
        const store = this.store;
        const locked = store.status === "running" || store.status === "starting";
        const smallText = { color: "var(--t-text3)", fontSize: "12px", lineHeight: 1.6 };
        const selectStyle = { flex: 1, maxWidth: "200px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--t-border2)", background: "var(--t-surface2)", color: "var(--t-text)" };
        const buttonStyle = { padding: "5px 12px", borderRadius: "6px", border: "1px solid var(--t-border2)", background: "var(--t-surface)", color: "var(--t-text)", cursor: "pointer" };
        const primaryButton = Object.assign({}, buttonStyle, { border: "1px solid var(--t-primary)", background: "var(--t-primary)", color: "#fff" });
        const labeled = (label, control) => h("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" } }, [h("span", { style: { color: "var(--t-text3)" } }, label), control]);
        const parts = [
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, [
            h("div", { style: { fontSize: "15px", fontWeight: 600 } }, "掌握度满分"),
            h("div", { style: { color: "var(--t-text3)" } }, store.statusText)
          ])
        ];
        if (!store.courseId) {
          parts.push(h("div", { style: { color: "var(--t-text3)", lineHeight: 1.7 } }, "请先打开智慧树的课程掌握度页面（热力图），再回到这里开始。"));
        } else {
          const info = [
            h("div", { style: { color: "var(--t-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, store.courseName)
          ];
          if (store.activeName) info.push(h("div", { style: { color: "var(--t-text3)", fontSize: "12px" } }, `当前知识点：${store.activeName}`));
          const percent = store.progress ? store.progress.percent : 0;
          info.push(h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, [
            h("div", { style: { flex: 1, height: "6px", borderRadius: "3px", background: "var(--t-border)", overflow: "hidden" } }, [
              h("div", { style: { width: `${percent}%`, height: "100%", background: "var(--t-primary)", transition: "width .3s" } })
            ]),
            h("div", { style: { color: "var(--t-text)", fontVariantNumeric: "tabular-nums" } }, store.percentText)
          ]));
          info.push(h("div", { style: { color: "var(--t-text3)", fontSize: "12px" } }, store.remainText));
          if (store.reviewStats) {
            info.push(h("div", { style: { color: "var(--t-text3)", fontSize: "12px" } }, `本轮新增 ${store.reviewStats.added} · 复核 ${store.reviewStats.verified} · 纠正 ${store.reviewStats.corrected} · 未定 ${store.reviewStats.unresolved}`));
          }
          parts.push(h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } }, info));

          const actions = [
            locked
              ? h("button", { onClick: () => store.pause(), style: { padding: "5px 14px", borderRadius: "6px", border: "1px solid var(--t-border2)", background: "var(--t-surface)", color: "var(--t-text)", cursor: "pointer" } }, store.status === "starting" ? "取消启动" : "暂停")
              : h("button", { onClick: this.start, style: { padding: "5px 14px", borderRadius: "6px", border: "1px solid var(--t-primary)", background: "var(--t-primary)", color: "#fff", cursor: "pointer" } }, "开始 / 继续")
          ];
          if (store.activity === "bank") actions.push(h("button", { onClick: this.reset, style: buttonStyle }, "开始新一轮"));
          parts.push(h("div", { style: { display: "flex", gap: "8px" } }, actions));

          parts.push(h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } }, [
            labeled("模式", h("select", {
              value: store.activity,
              disabled: locked,
              onChange: (event) => store.setActivity(event.target.value),
              style: selectStyle
            }, [h("option", { value: "practice" }, "满分练习"), h("option", { value: "bank" }, "题库完善")])),
            h("div", { style: { color: "var(--t-text3)", fontSize: "12px", lineHeight: 1.6 } }, store.activity === "bank" ? "每个知识点都实际答一轮，不拿旧的满分顶替，用来补充题库。" : "跳过免考和已 100% 的知识点，其余答到全对为止。")
          ]));

          parts.push(h("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, [
            h("label", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" } }, [
              h("span", { style: { color: "var(--t-text3)" } }, "范围"),
              h("select", {
                value: store.mode,
                disabled: locked,
                onChange: (event) => store.setMode(event.target.value),
                style: Object.assign({}, selectStyle, { maxWidth: "140px" })
              }, [h("option", { value: "all" }, "全部知识点"), h("option", { value: "current" }, "仅当前知识点")])
            ]),
            h("label", { style: { display: "flex", alignItems: "center", gap: "6px", color: "var(--t-text3)" } }, [
              "间隔",
              h("input", {
                type: "number",
                min: 0,
                max: 5000,
                step: 50,
                value: store.delay,
                disabled: locked,
                onChange: (event) => store.setDelay(event.target.value),
                style: { width: "70px", padding: "3px 6px", borderRadius: "6px", border: "1px solid var(--t-border2)", background: "var(--t-surface2)", color: "var(--t-text)" }
              }),
              h("span", null, "毫秒")
            ])
          ]));
          if (store.mode === "current") {
            parts.push(h("div", { style: smallText }, "手动进入一个知识点后再点开始，这个知识点全对就停；不会自动往下一个走。"));
          }

          parts.push(h("label", { style: { display: "flex", alignItems: "center", gap: "8px", color: "var(--t-text3)" } }, [
            h("input", {
              type: "checkbox",
              checked: store.ignoreAnswers,
              disabled: locked,
              onChange: (event) => store.setIgnoreAnswers(event.target.checked)
            }),
            h("span", null, "忽略已确认答案（重新核实本题）"),
            h("span", { style: { color: "var(--t-text4, var(--t-text3))", fontSize: "12px" } }, "题库换过、答案可疑时勾上")
          ]));

          const bank = [
            labeled("题库课程", h("select", {
              value: store.exportCourse,
              onChange: (event) => store.setExportCourse(event.target.value),
              style: selectStyle
            }, store.courses.map((course) => h("option", { key: course.id, value: course.id }, course.name || course.id)))),
            labeled("导入匹配", h("select", {
              value: store.importMatch,
              disabled: locked,
              onChange: (event) => store.setImportMatch(event.target.value),
              style: Object.assign({}, selectStyle, { maxWidth: "140px" })
            }, [h("option", { value: "loose" }, "宽松（推荐）"), h("option", { value: "strict" }, "严格")])),
            h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, [
              h("span", null, `已确认答案 ${store.bankCount} 题`),
              h("span", { style: { color: "var(--t-text3)", fontSize: "12px" } }, `导入候选 ${store.importedCount} 题`)
            ]),
            h("div", { style: { color: "var(--t-text3)", fontSize: "12px" } }, `待确认 ${store.bankPending} · 数据异常 ${store.bankBroken} · 答案冲突 ${store.bankConflicts} 组`),
            h("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } }, [
              h("button", { onClick: () => store.exportBank(), style: buttonStyle }, "导出题库"),
              h("button", { onClick: () => store.exportExcluded(), style: buttonStyle }, "导出未入库清单"),
              h("button", { onClick: () => store.exportRecords(), style: buttonStyle }, "导出记录"),
              h("label", { style: Object.assign({}, buttonStyle, { display: "inline-block" }) }, [
                "导入题库",
                h("input", { type: "file", accept: ".txt,.json", style: { display: "none" }, onChange: this.onFile })
              ]),
              h("button", {
                onClick: () => store.clearImportBank(),
                style: { padding: "5px 12px", borderRadius: "6px", border: "1px solid var(--t-border)", background: "transparent", color: "var(--t-text3)", cursor: "pointer" }
              }, "清除导入库")
            ])
          ];
          if (store.importPreview) {
            bank.push(h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } }, [
              h("div", { style: { whiteSpace: "pre-wrap", color: "var(--t-text3)", fontSize: "12px", lineHeight: 1.6, maxHeight: "120px", overflow: "auto" } }, store.importPreview),
              h("div", { style: { display: "flex", gap: "8px" } }, [
                h("button", { disabled: !store.importReady, onClick: () => store.confirmImport(), style: primaryButton }, "确认导入"),
                h("button", { onClick: () => store.cancelImport(), style: buttonStyle }, "取消预览")
              ])
            ]));
          }
          parts.push(h("div", { style: { borderTop: "1px solid var(--t-border)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" } }, bank));

          parts.push(h("div", { style: { borderTop: "1px solid var(--t-border)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "4px" } }, [
            h("div", { style: { color: "var(--t-text3)", fontSize: "12px" } }, "运行记录"),
            h("div", {
              style: { whiteSpace: "pre-wrap", fontSize: "12px", lineHeight: 1.6, color: "var(--t-text3)", maxHeight: "180px", overflow: "auto", fontFamily: "var(--t-mono, monospace)" }
            }, store.logs.length ? store.logs.slice(-12).join("\n") : "暂无记录")
          ]));
        }
        return h("div", {
          style: { padding: "14px", display: "flex", flexDirection: "column", gap: "12px", height: "100%", overflow: "auto", color: "var(--t-text)", fontSize: "13px" }
        }, parts);
      }
    };

    // ---------- 对外入口 ----------
    async function logic() {
      let enabled = true;
      try {
        enabled = useSettingStore().config.basicConfig.masteryFull.value;
      } catch (error) {
        enabled = true;
      }
      if (!enabled) {
        await smartAnswerLogic();
        return;
      }
      // 给页面一点时间渲染，再判断是不是掌握度页面
      const pendingRun = resumeMarker();
      const deadline = Date.now() + (pendingRun ? 30000 : 6000);
      let kind = pageKind();
      while ((kind === "loading" || kind === "unknown") && Date.now() < deadline) {
        await sleepMs(300);
        kind = pageKind();
      }
      if (kind === "loading" || kind === "unknown") {
        await smartAnswerLogic();
        return;
      }
      const store = masteryStore();
      if (store) {
        store.visible = true;
        syncState();
      }
      refreshProgress();
      if (!pagehideHooked) {
        pagehideHooked = true;
        window.addEventListener("pagehide", () => {
          if (releaseLock) releaseLock();
        });
      }
      if (!refreshTimer) {
        refreshTimer = setInterval(() => {
          try {
            refreshProgress();
            syncState();
          } catch (error) {
          }
        }, 1500);
      }
      const marker = pendingRun;
      if (marker) {
        if (marker.activity) settings.activity = marker.activity;
        await moduleStart(true);
      } else if (store) {
        store.message = "点「开始 / 继续」按知识点刷满分";
        log("已识别到掌握度页面，切到「答题」页的「掌握度满分」点「开始」即可自动刷满分");
      }
    }

    return {
      logic,
      useStore: useMasteryStore,
      Panel: MasteryPanel,
      resetReview
    };
  })();

  const zhsRoutes = {
    match: [
      { keyword: "/studyvideoh5.zhihuishu.com", tab: "1", logic: videoStudyLogic, assist: "video" },
      { keyword: "ai-smart-course-student-pro.zhihuishu.com/learnPage", tab: "1", logic: smartStudyLogic, assist: "video" },
      { keyword: "ai-smart-course-student-pro.zhihuishu.com/singleCourse", tab: "1", logic: smartStudyLogic, assist: "video" },
      { keyword: "smartcoursestudent.zhihuishu.com/learnPage", tab: "1", logic: smartStudyLogic, assist: "video" },
      { keyword: "smartcoursestudent.zhihuishu.com/singleCourse", tab: "1", logic: smartStudyLogic, assist: "video" },
      { keyword: "studyplush5.zhihuishu.com", tab: "1", logic: studyPlusLogic, assist: "video" },
      { keyword: "studywisdomh5.zhihuishu.com/study/index", tab: "1", logic: studyPlusLogic, assist: "video" },
      { keyword: "smartcourseexam.zhihuishu.com/ReviewExam", tab: "1", logic: smartAnswerLogic, assist: "answer" },
      { keyword: "studentexamcomh5.zhihuishu.com/studentReviewTestOrExam", tab: "1", logic: smartAnswerLogic, assist: "answer" },
      { keyword: "fusioncourseh5.zhihuishu.com/exam", tab: "1", logic: smartAnswerLogic, assist: "answer" },
      // 掌握度练习：热力图 / 知识点 / 解析页都交给掌握度满分模块，页面上点「开始」才动手
      { keyword: "studywisdomh5.zhihuishu.com/study/mastery", tab: "2", logic: () => zhsMastery.logic() },
      { keyword: "studywisdomh5.zhihuishu.com/pointOfMastery", tab: "2", logic: () => zhsMastery.logic() },
      { keyword: "studywisdomh5.zhihuishu.com/examAnalysis", tab: "2", logic: () => zhsMastery.logic() },
      { keyword: "studywisdomh5.zhihuishu.com/exam", tab: "2", logic: () => zhsMastery.logic() },
      { keyword: "wisdom-mooc.zhihuishu.com/exam", tab: "1", logic: smartAnswerLogic, assist: "answer" },
      { keyword: "examloop.zhihuishu.com/exam", tab: "1", logic: smartAnswerLogic, assist: "answer" },
      { keyword: "zhihuishu.com/atHomeworkExam/stu/homeworkQ/exerciseList", tab: "1", logic: smartAnswerLogic, assist: "answer" },
      { keyword: "zhihuishu.com/atHomeworkExam/stu/examQ/examexercise", tab: "1", logic: smartAnswerLogic, assist: "answer" },
      { keyword: "zhihuishu.com/aidedteaching/sourceLearning", tab: "1", logic: specialStudyLogic, assist: "video" },
      { keyword: "hike-teaching-center.polymas.com/stu-hike/agent-course-hike/ai-course-center", tab: "1", logic: specialStudyLogic, assist: "video" },
      { keyword: "tools-hike/studentStudyResource", tab: "1", logic: specialStudyLogic, assist: "video" },
      { keyword: "fusioncourseh5.zhihuishu.com", tab: "1", logic: aiSmartLogic, assist: "video" },
      { keyword: "zhihuishu.com/learnPage", tab: "1", logic: learnPageLogic, assist: "video" },
      { keyword: "wisdom-mooc.zhihuishu.com/study/index", tab: "1", logic: wisdomStudyLogic, assist: "video" },
      { keyword: "/webExamList?", tab: "0" },
      { keyword: "/stuExamWeb.html", tab: "1", logic: autoAnswerLogic }
    ],
    defaultRoute: {
      show: true,
      tab: "0"
    }
  };
  // ===== 通用视频助手：新增平台共用的自动播放 / 自动翻页 =====
  // 只在雨课堂、云班课、智慧职教、国家开放大学、中国大学MOOC、U校园、学堂在线、
  // 绎通云、山东专技、西财在线 这些平台上生效；超星 / 智慧树 / 青书 / 出头 不经过这里
  const XS_WATCH_STORAGE_KEY = "xsWatch:prefs";
  const xsWatchDefaults = () => ({ speed: 1.5, autoNext: true, autoScroll: true, autoRun: false, segments: 0 });
  const xsWatchReadPrefs = () => {
    try {
      const raw = typeof _GM_getValue === "function" ? _GM_getValue(XS_WATCH_STORAGE_KEY, "") : window.localStorage.getItem(XS_WATCH_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Object.assign(xsWatchDefaults(), parsed && typeof parsed === "object" ? parsed : {});
    } catch (e) {
      return xsWatchDefaults();
    }
  };
  const xsWatchWritePrefs = (prefs) => {
    try {
      const text = JSON.stringify(prefs);
      if (typeof _GM_setValue === "function") _GM_setValue(XS_WATCH_STORAGE_KEY, text);
      else window.localStorage.setItem(XS_WATCH_STORAGE_KEY, text);
    } catch (e) {
    }
  };
  // 各平台的页面特征。verified 表示按钮选择器来自公开实现、有据可依；
  // 其余按页面常见结构写，第一次用如果点不动，把课程页地址发过来再调。
  const XS_WATCH_PROFILES = [
    {
      id: "ykt",
      name: "雨课堂",
      test: (host) => /(^|\.)yuketang\.cn$/.test(host),
      play: [".xt_video_bit_play_btn", ".xt_video_player_common_icon", ".xt_video_player_play_btn"],
      next: [".btn-next", ".next-btn"],
      verified: true
    },
    {
      id: "mskt",
      name: "云班课",
      test: (host) => /(^|\.)mosoteach\.cn$/.test(host),
      play: [".vjs-big-play-button", ".plyr__control--overlaid", "[class*=big-play]"],
      next: ["[class*=next]:not([disabled])", ".ant-pagination-next button"],
      verified: false
    },
    {
      id: "icve-ai",
      name: "智慧职教 AI",
      test: (host) => host === "ai.icve.com.cn",
      play: [".el-message-box .el-button--primary", "[class*=play-btn]", "[class*=video-play]"],
      next: [".next .el-link--inner", "[class*=next]:not([disabled])"],
      verified: true
    },
    {
      id: "icve2",
      name: "智慧职教",
      test: (host) => host === "zjy2.icve.com.cn" || host === "zyk.icve.com.cn",
      play: [".el-message-box .el-button--primary", "[class*=play-btn]"],
      next: [".next .el-link--inner", "[class*=next]:not([disabled])"],
      verified: true
    },
    {
      id: "icve",
      name: "智慧职教",
      test: (host) => /(^|\.)icve\.com\.cn$/.test(host),
      play: [".coursespace.screen-player-btn-icon.icon-play-sp-fill", ".screen-player-btn-icon.icon-play-sp-fill", "[class*=play]"],
      next: [".item_done_pos", ".btn-next"],
      verified: true
    },
    {
      id: "ouchn-syxy",
      name: "国家开放大学",
      test: (host) => /(^|\.)syxy\.ouchn\.cn$/.test(host),
      play: [".vjs-big-play-button", ".vjs-play-control.vjs-paused", ".vjs-poster"],
      next: ["[class*=newgk-next]", "a.newgk-prenext"],
      nextText: "下一页",
      doc: true,
      verified: true
    },
    {
      id: "ouchn",
      name: "国家开放大学",
      test: (host) => /(^|\.)ouchn\.(cn|edu\.cn)$/.test(host),
      play: [".mvp-fonts-play", "[class*=play]"],
      next: [".next-btn"],
      doc: true,
      verified: true
    },
    {
      id: "mooc",
      name: "中国大学MOOC",
      test: (host) => /(^|\.)icourse163\.org$/.test(host),
      play: [".vjs-big-play-button", ".prism-big-play-btn", "[class*=big-play]"],
      next: ["[class*=next]:not([disabled])"],
      verified: false
    },
    {
      id: "uschool",
      name: "U 校园",
      test: (host) => /(^|\.)unipus\.cn$/.test(host),
      play: ["[class*=play]", ".vjs-big-play-button"],
      next: ["[class*=next]:not([disabled])"],
      verified: false
    },
    {
      id: "xtzx",
      name: "学堂在线",
      test: (host) => /(^|\.)xuetangx\.com$/.test(host),
      play: ["[class*=play]"],
      next: [".next", "[class*=next]:not([disabled])"],
      verified: true
    },
    {
      id: "ytccr",
      name: "绎通云",
      test: (host) => /(^|\.)ytccr\.com$/.test(host),
      play: ["[class*=play]", ".vjs-big-play-button"],
      next: ["[class*=next]:not([disabled])"],
      verified: false
    },
    {
      id: "sdzj",
      name: "山东专技",
      test: (host) => /(^|\.)treewises\.com$/.test(host),
      play: ["#replaybtn", ".bplayer-play-btn"],
      next: [".btn-next"],
      quizPopup: true,
      verified: true
    },
    {
      id: "xczx",
      name: "西财在线",
      test: (host) => /(^|\.)swufe-online\.com$/.test(host),
      play: [".screen-player-btn-icon.icon-play-sp-fill", "[class*=play]"],
      next: [".btn-next"],
      verified: true
    }
  ];
  const xsWatchProfileFor = (hostname) => XS_WATCH_PROFILES.find((profile) => profile.test(hostname || location.hostname)) || null;
  const xsWatchSupported = () => Boolean(xsWatchProfileFor(location.hostname));
  // 倍速、自动翻页、开关都直接用「设置」里的现成项，视频页不再单独放一份
  const readWatchSettings = () => {
    const fallback = { speed: 1.5, autoNext: true, autoScroll: true, enabled: true };
    try {
      const basic = useSettingStore().config.basicConfig;
      const speed = Number(basic.videoPlayrate && basic.videoPlayrate.value) || 1.5;
      const autoNext = basic.autoChangeChapter ? !!basic.autoChangeChapter.value : true;
      return {
        speed: Math.min(4, Math.max(0.5, speed)),
        autoNext,
        autoScroll: autoNext,
        enabled: basic.watchAssist ? !!basic.watchAssist.value : true
      };
    } catch (e) {
      return fallback;
    }
  };
  const xsWatch = (() => {
    const prefs = vue.reactive(xsWatchReadPrefs());
    const state = vue.reactive({
      running: false,
      status: "空闲",
      page: "",
      media: "",
      progress: "",
      segments: Number(prefs.segments) || 0,
      logs: []
    });
    let timer = null;
    let tickBusy = false;
    let originalHasFocus = null;
    // 点过「下一节」后先等页面换掉视频，避免同一节被反复点
    const advanceGuard = { at: 0, href: "", src: "" };
    const log = (text) => {
      const line = `${(/* @__PURE__ */ new Date()).toLocaleTimeString()}  ${text}`;
      state.logs.unshift(line);
      if (state.logs.length > 20) state.logs.length = 20;
      try {
        useLogStore().insertLog(text);
      } catch (e) {
      }
    };
    // 同一套逻辑要能穿透同源 iframe（智慧职教、西财在线把播放器放在 iframe 里）
    const collectDocuments = () => {
      const list = [document];
      const seen = /* @__PURE__ */ new Set([document]);
      for (let i = 0; i < list.length && list.length < 8; i++) {
        let frames = [];
        try {
          frames = Array.from(list[i].querySelectorAll("iframe"));
        } catch (e) {
          frames = [];
        }
        for (const frame of frames) {
          let inner = null;
          try {
            inner = frame.contentDocument;
          } catch (e) {
            inner = null;
          }
          if (inner && !seen.has(inner)) {
            seen.add(inner);
            list.push(inner);
          }
        }
      }
      return list;
    };
    const queryAll = (selector) => {
      const found = [];
      for (const doc of collectDocuments()) {
        try {
          found.push(...doc.querySelectorAll(selector));
        } catch (e) {
        }
      }
      return found;
    };
    const isVisible = (el) => {
      if (!el || !el.isConnected) return false;
      const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (rect && (rect.width < 2 || rect.height < 2)) return false;
      const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      return !style || (style.display !== "none" && style.visibility !== "hidden");
    };
    const clickFirst = (selectors) => {
      for (const selector of selectors || []) {
        for (const el of queryAll(selector)) {
          if (!isVisible(el)) continue;
          try {
            el.click();
            return el;
          } catch (e) {
          }
        }
      }
      return null;
    };
    const textOf = (el) => String((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, "").trim();
    const findVideo = () => {
      // 有些播放器刚插入时尺寸还是 0，只要拿到了时长就当作有效视频
      const videos = queryAll("video").filter((video) => isVisible(video) || Number(video.duration) > 0);
      if (!videos.length) return null;
      return videos.find((video) => !video.paused) || videos[0];
    };
    const setSpeed = (video, speed) => {
      if (!video || !speed) return;
      try {
        if (Math.abs(video.playbackRate - speed) > 0.01) video.playbackRate = speed;
      } catch (e) {
      }
    };
    const safePlay = (video) => {
      try {
        const result = video.play();
        if (result && result.catch) result.catch(() => {
        });
      } catch (e) {
      }
    };
    const formatTime = (seconds) => {
      const value = Math.max(0, Math.floor(Number(seconds) || 0));
      const min = String(Math.floor(value / 60)).padStart(2, "0");
      const sec = String(value % 60).padStart(2, "0");
      return `${min}:${sec}`;
    };
    // 山东专技这类平台会在播放中弹一道验证题，随便选一个提交才能继续播
    let lastQuizAt = 0;
    const handleQuizPopup = (profile) => {
      if (!profile || !profile.quizPopup) return false;
      // 提交后弹窗要过一会儿才消失，这段时间别再重复点
      if (Date.now() - lastQuizAt < 6e3) return false;
      const options = queryAll(".ccQuestion li");
      if (options.length) {
        try {
          options[Math.floor(Math.random() * options.length)].click();
          clickFirst(["#ccQuestionSubmit"]);
          lastQuizAt = Date.now();
          log("弹窗验证题已作答");
        } catch (e) {
        }
        return true;
      }
      const playerOptions = queryAll(".bplayer-question-content .option-item");
      if (playerOptions.length && playerOptions[0].style && playerOptions[0].style.display !== "none") {
        try {
          playerOptions[Math.floor(Math.random() * playerOptions.length)].click();
          clickFirst([".commit.bplayer-btn"]);
          lastQuizAt = Date.now();
          log("播放器弹窗题已作答");
        } catch (e) {
        }
        return true;
      }
      return false;
    };
    const scrollDocument = async () => {
      const el = document.scrollingElement || document.documentElement;
      if (!el) return;
      const step = Math.max(120, Math.floor(window.innerHeight * 0.5));
      window.scrollBy(0, step);
      await sleep(600);
      if (el.scrollTop + window.innerHeight >= el.scrollHeight - 4) {
        await sleep(2500);
      }
    };
    const start = (profile) => {
      const active = profile || xsWatchProfileFor(location.hostname);
      if (!active) {
        log("当前网站不在通用视频助手的支持范围内");
        return false;
      }
      const settings = readWatchSettings();
      if (!settings.enabled) {
        log("设置里的「视频助手（新增平台）」是关闭状态，先到设置中打开");
        return false;
      }
      if (timer) clearInterval(timer);
      timer = null;
      state.running = true;
      state.status = "运行中";
      prefs.autoRun = true;
      xsWatchWritePrefs(prefs);
      if (originalHasFocus === null) {
        originalHasFocus = document.hasFocus;
        try {
          document.hasFocus = () => true;
        } catch (e) {
        }
      }
      log(`${active.name}：视频助手已启动，倍速 ${settings.speed}x`);
      timer = setInterval(() => {
        void tick(active);
      }, 1e3);
      void tick(active);
      return true;
    };
    const stop = (reason) => {
      if (timer) clearInterval(timer);
      timer = null;
      state.running = false;
      state.status = reason || "已暂停";
      prefs.autoRun = false;
      xsWatchWritePrefs(prefs);
      if (originalHasFocus !== null) {
        try {
          document.hasFocus = originalHasFocus;
        } catch (e) {
        }
        originalHasFocus = null;
      }
      log(reason || "视频助手已暂停");
    };
    const clickNext = (profile) => {
      for (const selector of profile.next || []) {
        for (const el of queryAll(selector)) {
          if (!isVisible(el)) continue;
          if (profile.nextText && textOf(el) !== profile.nextText) continue;
          try {
            el.click();
            return el;
          } catch (e) {
          }
        }
      }
      return null;
    };
    const tick = async (profile) => {
      if (!state.running || tickBusy) return;
      tickBusy = true;
      try {
        if (!document.body) return;
        const settings = readWatchSettings();
        if (!settings.enabled) {
          stop("设置里的「视频助手（新增平台）」已关闭");
          return;
        }
        state.page = location.pathname || "/";
        if (handleQuizPopup(profile)) return;
        const video = findVideo();
        if (!video) {
          state.progress = "";
          if (settings.autoScroll && profile.doc) {
            state.media = "文档页：正在向下滚动";
            await scrollDocument();
          } else {
            state.media = "当前页面没有视频";
          }
          return;
        }
        state.media = "视频";
        const duration = Number(video.duration) || 0;
        const current = Number(video.currentTime) || 0;
        state.progress = duration > 0 ? `${formatTime(current)} / ${formatTime(duration)}（${Math.floor(current / duration * 100)}%）` : "";
        if (!video.muted) {
          try {
            video.muted = true;
          } catch (e) {
          }
        }
        setSpeed(video, settings.speed);
        const finished = video.ended || (duration > 0 && current >= duration - 0.8);
        if (finished) {
          if (!settings.autoNext) {
            state.status = "本节已播完（自动翻页已关闭）";
            return;
          }
          state.progress = "本节已播完，正在切换";
          const videoSrc = String(video.currentSrc || video.src || "");
          const pageChanged = location.href !== advanceGuard.href || videoSrc !== advanceGuard.src;
          if (!pageChanged && Date.now() - advanceGuard.at < 1e4) {
            state.status = "等待下一页加载";
            return;
          }
          const clicked = clickNext(profile);
          if (!clicked) {
            stop("没有找到下一节按钮，已停止");
            return;
          }
          advanceGuard.at = Date.now();
          advanceGuard.href = location.href;
          advanceGuard.src = videoSrc;
          state.segments += 1;
          prefs.segments = state.segments;
          xsWatchWritePrefs(prefs);
          log(`第 ${state.segments} 节播完，已点下一节`);
          return;
        }
        if (video.paused) {
          clickFirst(profile.play || []);
          safePlay(video);
        }
        state.status = "运行中";
      } catch (error) {
        log(`运行出错：${error && error.message ? error.message : error}`);
      } finally {
        tickBusy = false;
      }
    };
    return { prefs, state, start, stop, tick, profileFor: xsWatchProfileFor, supported: xsWatchSupported, autoStart: () => {
      const profile = xsWatchProfileFor(location.hostname);
      if (!profile) return;
      // 设置里的「视频助手」开着才自动开始，关掉后连进入页面都不动
      if (!readWatchSettings().enabled) return;
      start(profile);
    } };
  })();

  // 新增平台共用同一套路由：在这些站点的任何页面都显示面板，
  // 进页面后由设置里的「视频助手」开关决定是否自动开始
  // ===== 新平台通用答题：脚本负责抓题和填答案，答案由后端接口给 =====
  // 不写死各平台的 class：靠页面结构特征找题目，平台改版后一般还能用；
  // 找不到题目时把页面结构记进日志，方便按真实页面补选择器
  const xsQuiz = (() => {
    const TEXT = (el) => String((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, " ").trim();
    const LETTER_RE = /^\s*([A-H])\s*[.、,，:：)）]\s*/;
    const letterOf = (text) => {
      const m = String(text || "").match(LETTER_RE);
      return m ? m[1] : "";
    };
    const stripLetter = (text) => String(text || "").replace(LETTER_RE, "").trim();
    const norm = (s) => String(s || "").replace(/[\s　"“”'‘’]/g, "").toLowerCase();
    const judgeNorm = (s) => {
      const t = String(s || "").trim();
      if (/^(对|正确|是|√|t|true)$/i.test(t)) return "对";
      if (/^(错|错误|否|×|f|false)$/i.test(t)) return "错";
      return "";
    };

    // 同源 iframe 也要扫：不少平台的答题区在 iframe 里
    const collectDocuments = (root, depth) => {
      root = root || document;
      depth = depth || 0;
      const docs = [root];
      if (depth >= 6) return docs;
      let frames = [];
      try { frames = Array.from(root.querySelectorAll("iframe")); } catch (_) {}
      for (const frame of frames) {
        let inner = null;
        try { inner = frame.contentDocument; } catch (_) { inner = null; }
        if (inner && inner.body) docs.push(...collectDocuments(inner, depth + 1));
      }
      return docs;
    };

    // 同一题的控件归成一组：radio 按 name，checkbox 按共同父级
    const groupControls = (controls) => {
      const groups = [];
      const byName = new Map();
      const rest = [];
      for (const input of controls) {
        if (input.type === "radio" && input.name) {
          if (!byName.has(input.name)) {
            const group = { controls: [], type: "radio", name: input.name };
            byName.set(input.name, group);
            groups.push(group);
          }
          byName.get(input.name).controls.push(input);
        } else {
          rest.push(input);
        }
      }
      for (const input of rest) {
        let host = input.parentElement;
        let target = null;
        for (let i = 0; i < 6 && host; i++, host = host.parentElement) {
          if (host.querySelectorAll('input[type="checkbox"]').length > 1) { target = host; break; }
        }
        if (!target) target = input.parentElement;
        let group = groups.find((x) => x.host === target);
        if (!group) { group = { controls: [], type: "checkbox", host: target }; groups.push(group); }
        group.controls.push(input);
      }
      return groups;
    };

    // 题目块 = 包含全部选项控件的最近祖先，再往上找带题干的那层
    const resolveBlock = (group) => {
      const first = group.controls[0];
      let container = first.parentElement;
      for (let i = 0; i < 10 && container; i++, container = container.parentElement) {
        if (group.controls.every((c) => container.contains(c))) break;
      }
      if (!container) container = first.parentElement;
      const baseText = TEXT(container);
      let best = container;
      let up = container.parentElement;
      for (let i = 0; i < 4 && up; i++, up = up.parentElement) {
        if (up === document.body || up === document.documentElement) break;
        const extra = TEXT(up).length - baseText.length;
        if (extra >= 6) { best = up; break; }
        if (extra > 0) best = up;
      }
      return best;
    };

    const collectOptions = (controls) => controls.map((input) => {
      const label = input.closest("label") || input.parentElement;
      let text = "";
      if (label) {
        const clone = label.cloneNode(true);
        clone.querySelectorAll("input, textarea, select").forEach((node) => node.remove());
        text = TEXT(clone);
      }
      if (!text) text = TEXT(input.nextElementSibling);
      return { el: label || input, input, text, letter: letterOf(text) };
    });

    // 没有 input 的选项块（前端框架常直接渲染 div 当选项）
    const findClickOptions = (scope) => {
      const SELECTORS = [
        '[class*="option"]', '[class*="Option"]', '[class*="opt"]', '[class*="Opt"]',
        '[class*="choice"]', '[class*="Choice"]', '[class*="answer-item"]'
      ];
      for (const sel of SELECTORS) {
        const nodes = Array.from(scope.querySelectorAll(sel)).filter((el) => {
          if (el.querySelector(sel)) return false;
          const text = TEXT(el);
          return text.length >= 2 && text.length <= 300 && /^\s*[A-H]\s*[.、,，:：)）]/.test(text);
        });
        const byParent = new Map();
        for (const node of nodes) {
          const parent = node.parentElement;
          if (!byParent.has(parent)) byParent.set(parent, []);
          byParent.get(parent).push(node);
        }
        for (const list of byParent.values()) if (list.length >= 2) return list;
      }
      return [];
    };

    const clickBlockOf = (list) => {
      const baseText = TEXT(list[0].parentElement);
      let up = list[0].parentElement;
      let best = up;
      for (let i = 0; i < 4 && up; i++, up = up.parentElement) {
        if (up === document.body || up === document.documentElement) break;
        const extra = TEXT(up).length - baseText.length;
        if (extra >= 6) { best = up; break; }
        if (extra > 0) best = up;
      }
      return best;
    };

    const blockOrder = (a, b) => {
      const pos = a.el.compareDocumentPosition(b.el);
      if (pos & 4) return -1;
      if (pos & 2) return 1;
      return 0;
    };

    // 各平台精确选择器：参考 OCS 网课助手公开的结构整理，能对上就用它，对不上再退回通用识别
    const PROFILES = [
      {
        id: "ykt",
        domains: ["yuketang.cn"],
        roots: [".container-problem .subject-item"],
        title: [".problem-body"],
        type: [".item-type"],
        options: ['ul[class*="list-unstyled"] li label'],
        optionText: [".radioText", ".checkboxText"],
        blanks: ['input.blank-item-dynamic', 'input[placeholder="输入答案"]', "textarea"],
        captcha: "#homework-automation-risk-challenge"
      },
      {
        id: "mooc",
        domains: ["icourse163.org"],
        roots: [".u-questionItem", "[class*=questionBody]"],
        title: [".j-title .j-richTxt", "[class*=questionInfo]"],
        type: [],
        options: [".choices li", "[class*=index-module__optionBody]"],
        optionText: [".f-richEditorText"],
        blanks: ["textarea"],
        captcha: ""
      },
      // 职教云（zjy2.icve.com.cn 等）
      {
        id: "zjy",
        domains: ["icve.com.cn"],
        roots: [".subjectDet"],
        title: ["h2, h3, h4, h5, h6", ".titleTest span"],
        type: [],
        options: [".optionList div", ".tkInput .el-input", ".tkInput .el-textarea"],
        optionText: [],
        blanks: ['.tkInput input[type="text"]', ".tkInput textarea"],
        captcha: ""
      },
      // 智慧职教（老版）
      {
        id: "icve-a",
        domains: ["icve.com.cn"],
        roots: [".q_content"],
        title: [".divQuestionTitle", '[name="fillblankTitle"]'],
        type: [],
        options: [".questionOptions .q_option", ".questionOptions .answerOption", ".answerOption"],
        optionText: [],
        blanks: [".fillblank_input input"],
        captcha: ""
      },
      // 智慧职教（新版，Element 风格）
      {
        id: "icve-b",
        domains: ["icve.com.cn"],
        roots: [".content-item"],
        title: [".questions-content [class*=title-content]"],
        type: [],
        options: ["label[class*='group-item']"],
        optionText: [],
        blanks: [".ivu-input-wrapper input"],
        captcha: ""
      },
      // 云班课（新版 topic-subject，旧版 t-subject）
      {
        id: "mosoteach",
        domains: ["mosoteach.cn"],
        roots: [".pt-10.d-flex.list-item", ".topic-item"],
        title: [".topic-subject", ".t-subject"],
        type: [".v-chip__content", ".t-type"],
        options: [".topic-answer-align", "label.d-flex.align-center", ".t-option.t-item label", ".t-judge.t-item label"],
        optionText: ["[class*='opt-content']", ".topic-answer-align"],
        blanks: ["textarea", 'input[type="text"]'],
        captcha: ""
      },
      // 绎通云
      {
        id: "ytccr",
        domains: ["ytccr.com"],
        roots: [".border-item"],
        title: [".title.qa-title", ".qa-title"],
        type: [".qtype", ".question-box .tag"],
        options: [".opts-list .opt-title-cnt", ".opts-list li"],
        optionText: [],
        blanks: ["textarea", 'input[type="text"]'],
        captcha: ""
      },
      // 国家开放大学（学习网老版 + 电大考试站）
      {
        id: "ouchn-lms",
        domains: ["ouchn.cn", "ouchn.edu.cn"],
        roots: ["li.subject", ".everyQuest"],
        title: [".summary-title .subject-description", ".topicTitle"],
        type: [".subject-point > span", ".question-box .tag"],
        options: [".subject-options li .option-content", ".optionList .topicTitle", ".optionList li"],
        optionText: [],
        blanks: ["textarea", 'input[type="text"]'],
        captcha: ""
      },
      // 西财在线
      {
        id: "xczx",
        domains: ["swufe-online.com"],
        roots: [".test_item_theme", ".timu_title"],
        title: [".timu_title"],
        type: [],
        options: ["ul > li", ".question-item-opt"],
        optionText: [],
        blanks: ["textarea", 'input[type="text"]'],
        captcha: ""
      }
    ];
    // 同一个域名下可能有几套页面结构，依次尝试
    const profilesForHost = (host) => PROFILES.filter((p) => p.domains.some((d) => host === d || host.endsWith("." + d)));

    const pickText = (el, selectors) => {
      for (const sel of selectors || []) {
        const node = el.querySelector(sel);
        if (node && TEXT(node)) return TEXT(node);
      }
      return "";
    };

    // 按平台选择器抓题；抓不到返回空数组，交给通用识别
    const findBlocksByProfile = (scope, profile) => {
      const roots = Array.from(scope.querySelectorAll(profile.roots.join(",")));
      if (!roots.length) return [];
      const blocks = [];
      for (const root of roots) {
        const options = [];
        Array.from(root.querySelectorAll(profile.options.join(","))).forEach((el, index) => {
          const input = el.querySelector('input[type="radio"], input[type="checkbox"]');
          let text = pickText(el, profile.optionText);
          // 判断题接口常把选项值设成 true / false，没有文字时用对错兜底
          if (!text && input && (input.value === "true" || input.value === "false")) {
            text = input.value === "true" ? "对" : "错";
          }
          if (!text) {
            const clone = el.cloneNode(true);
            clone.querySelectorAll("input, textarea, select, img").forEach((node) => node.remove());
            text = TEXT(clone);
          }
          if (!text) return;
          // 选项没有 A/B/C 前缀时按顺序补，题库给字母答案也能对上
          options.push({ el, input, text, letter: letterOf(text) || String.fromCharCode(65 + index) });
        });
        const blanks = [];
        for (const sel of profile.blanks || []) {
          for (const el of Array.from(root.querySelectorAll(sel))) {
            if (!el.disabled && !el.readOnly && !blanks.includes(el)) blanks.push(el);
          }
        }
        if (!options.length && !blanks.length) continue;
        options.sort((a, b) => {
          const pos = a.el.compareDocumentPosition(b.el);
          return pos & 4 ? -1 : pos & 2 ? 1 : 0;
        });
        const typeText = pickText(root, profile.type);
        let type = options.length ? "单选" : "填空";
        if (/多选|多项选择|不定项/.test(typeText)) type = "多选";
        else if (/判断/.test(typeText)) type = "判断";
        else if (/填空|简答|问答|论述/.test(typeText)) type = "填空";
        if (options.some((o) => o.input && o.input.type === "checkbox")) type = "多选";
        blocks.push({
          el: root,
          kind: options.length ? "choice" : "input",
          type,
          options,
          controls: options.map((o) => o.input).filter(Boolean),
          inputs: blanks,
          title: (pickText(root, profile.title) || TEXT(root)).replace(/\s+/g, " ").slice(0, 300)
        });
      }
      return blocks;
    };

    // 扫描当前页面（含 iframe），返回题目块
    const findBlocks = (scope) => {
      scope = scope || document;
      // 先按平台精确选择器找，找不到再走通用结构识别
      const host = (scope.location && scope.location.hostname) || location.hostname;
      for (const profile of profilesForHost(host)) {
        try {
          const exact = findBlocksByProfile(scope, profile);
          if (exact.length) return exact;
        } catch (_) {}
      }
      const blocks = [];
      const controls = Array.from(scope.querySelectorAll('input[type="radio"], input[type="checkbox"]'))
        .filter((el) => !el.disabled);
      for (const group of groupControls(controls)) {
        blocks.push({
          el: resolveBlock(group),
          kind: "choice",
          type: group.type === "radio" ? "单选" : "多选",
          options: collectOptions(group.controls),
          controls: group.controls,
          inputs: [],
          title: ""
        });
      }
      const clickOpts = findClickOptions(scope);
      if (clickOpts.length) {
        const blockEl = clickBlockOf(clickOpts);
        const overlapped = blocks.some((b) => b.el === blockEl || b.el.contains(blockEl) || blockEl.contains(b.el));
        if (!overlapped) {
          blocks.push({
            el: blockEl,
            kind: "click",
            type: "单选",
            options: clickOpts.map((el) => ({ el, input: null, text: TEXT(el), letter: letterOf(TEXT(el)) })),
            controls: [],
            inputs: [],
            title: ""
          });
        }
      }
      // 填空、简答：不属于任何选择题块的输入框
      const textInputs = Array.from(scope.querySelectorAll('input[type="text"], input:not([type]), textarea'))
        .filter((el) => !el.disabled && !el.readOnly)
        .filter((el) => !blocks.some((b) => b.el.contains(el)));
      const seen = new Set();
      for (const input of textInputs) {
        let host = input.parentElement;
        for (let i = 0; i < 5 && host; i++, host = host.parentElement) {
          if (TEXT(host).length >= 8) break;
        }
        const blockEl = host || input.parentElement;
        if (seen.has(blockEl)) continue;
        seen.add(blockEl);
        const group = textInputs.filter((item) => blockEl.contains(item));
        blocks.push({
          el: blockEl,
          kind: "input",
          type: group.some((item) => item.tagName === "TEXTAREA") ? "简答" : "填空",
          options: [],
          controls: [],
          inputs: group,
          title: ""
        });
      }
      // 题干：去掉选项和控件后的文字
      for (const block of blocks) {
        if (block.title) continue;
        const clone = block.el.cloneNode(true);
        clone.querySelectorAll("input, textarea, select, button").forEach((node) => node.remove());
        let raw = TEXT(clone);
        if (block.options.length) {
          const firstText = stripLetter(block.options[0].text);
          const at = firstText ? raw.indexOf(firstText) : -1;
          if (at > 0) raw = raw.slice(0, at);
        }
        raw = raw.replace(/\s*[A-H]\s*[.、,，:：)）]\s*$/, "");
        block.title = raw.replace(/\s+/g, " ").trim().slice(0, 300);
        if (block.kind === "click") block.type = /多选|多项选择|不定项/.test(block.title) ? "多选" : "单选";
        else if (block.type === "单选" && /多选|多项选择|不定项/.test(block.title)) block.type = "多选";
      }
      return blocks.sort(blockOrder);
    };

    // 答案匹配选项：先按字母，再按文字包含，避免选项文字有前后缀时匹配不上
    const isLetterAnswer = (a) => /^[A-H]$/i.test(String(a).trim());
    // 匹配不上的答案单独返回，由调用方标出来，绝不硬凑一个选项
    const pickOptions = (block, answer) => {
      const answers = Array.isArray(answer) ? answer : [answer];
      const picked = [];
      const unmatched = [];
      for (const item of answers) {
        const raw = String(item == null ? "" : item).trim();
        if (!raw) continue;
        if (isLetterAnswer(raw)) {
          const hit = block.options.find((o) => String(o.letter).toUpperCase() === raw.toUpperCase());
          if (hit) { picked.push(hit); continue; }
          unmatched.push(raw);
          continue;
        }
        const target = norm(raw);
        if (!target) continue;
        const hits = block.options.filter((o) => {
          const text = norm(o.text);
          const body = norm(stripLetter(o.text));
          // 判断题的同义写法：对/正确/√/T 与 错/错误/×/F 互相认
          if (judgeNorm(raw) && judgeNorm(raw) === judgeNorm(body)) return true;
          return text.includes(target) || target.includes(body) || (body.length >= 4 && target.includes(body));
        });
        if (hits.length) {
          // 多个选项都包含答案文字时优先取完全相同的，其次取最短的，避免把长选项当答案
          const exact = hits.find((o) => norm(stripLetter(o.text)) === target);
          if (exact) { picked.push(exact); continue; }
          hits.sort((x, y) => stripLetter(x.text).length - stripLetter(y.text).length);
          picked.push(hits[0]);
        } else {
          unmatched.push(raw);
        }
      }
      return { picked: picked.filter((value, index, arr) => arr.indexOf(value) === index), unmatched };
    };

    const fill = (block, answer) => {
      if (!block) return { ok: false, reason: "没有题目块" };
      if (block.kind === "input") {
        const list = Array.isArray(answer) ? answer : [answer];
        let count = 0;
        block.inputs.forEach((input, index) => {
          const value = String(list[index] == null ? "" : list[index]).trim();
          if (!value) return;
          input.focus();
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          count++;
        });
        const missing = Math.max(0, block.inputs.length - list.filter((x) => String(x == null ? "" : x).trim()).length);
        return { ok: count > 0, filled: count, missing };
      }
      const matched = pickOptions(block, answer);
      const picked = matched.picked.slice();
      if (!picked.length) return { ok: false, reason: "答案没匹配到任何选项", unmatched: matched.unmatched };
      if (block.type === "单选" || block.type === "判断") picked.splice(1);
      picked.forEach((opt) => {
        try { (opt.input || opt.el).click(); } catch (_) {}
      });
      // 回读：点完真的选中了才算填上；有些平台要整行点，点不动就再点一次整行
      let checkedCount = 0;
      if (block.controls.length) checkedCount = block.controls.filter((input) => input.checked).length;
      if (block.controls.length && checkedCount === 0) {
        picked.forEach((opt) => {
          try { opt.el.click(); } catch (_) {}
        });
        checkedCount = block.controls.filter((input) => input.checked).length;
      }
      if (block.controls.length && checkedCount === 0) {
        return { ok: false, reason: "点了选项但页面没反应，可能要点整行选项", unmatched: matched.unmatched };
      }
      return {
        ok: true,
        filled: picked.length,
        letters: picked.map((o) => o.letter),
        unmatched: matched.unmatched,
        extraDropped: matched.picked.length > picked.length ? matched.picked.length - picked.length : 0
      };
    };

    const isAnswered = (block) => {
      if (!block) return false;
      if (block.kind === "input") return block.inputs.some((input) => String(input.value || "").trim());
      if (block.controls.length) return block.controls.some((input) => input.checked);
      return block.options.some((opt) => /(^|[\s-])(active|selected|checked|is-checked|choose|chosen)([\s-]|$)/i.test(String(opt.el.className || "")));
    };

    const registry = [];
    const state = vue.reactive({
      scanning: false,
      running: false,
      total: 0,
      done: 0,
      items: [],
      logs: []
    });

    const log = (text) => {
      state.logs.unshift({ at: Date.now(), text: String(text) });
      if (state.logs.length > 30) state.logs.length = 30;
    };

    // 扫一遍页面，题目有变化才更新列表
    const scan = (silent) => {
      // 答题过程中不要重建列表，否则会把手里的进度和已答结果冲掉
      if (state.running) return [];
      state.scanning = true;
      try {
        const blocks = [];
        for (const doc of collectDocuments()) {
          try { blocks.push(...findBlocks(doc)); } catch (_) {}
        }
        const usable = blocks.filter((block) => (block.options && block.options.length >= 2) || (block.inputs && block.inputs.length));
        state.total = usable.length;
        if (!silent) {
          if (usable.length) log(`当前页面识别到 ${usable.length} 道题`);
          else log("没有识别到题目：请确认已经进入作业或考试页面");
        }
        // 题目节点单独放，不塞进响应式数据里，避免 Vue 去代理整棵 DOM
        registry.length = 0;
        registry.push(...usable);
        state.items = usable.map((block, index) => ({
          index,
          title: block.title || `第 ${index + 1} 题`,
          type: block.type,
          answer: "",
          status: isAnswered(block) ? "done" : "pending",
          msg: ""
        }));
        return usable;
      } finally {
        state.scanning = false;
      }
    };

    // 整条替换，确保列表一定重渲染
    const setItem = (index, patch) => {
      const next = state.items.slice();
      if (!next[index]) return;
      next[index] = Object.assign({}, next[index], patch);
      state.items = next;
    };

    const toQuestion = (block) => ({
      title: block.title || "",
      optionsText: (block.options || []).map((opt) => stripLetter(opt.text)),
      type: block.kind === "input"
        ? (block.type === "简答" ? "简答题" : "填空题")
        : (block.type === "多选" ? "多选题" : "单选题"),
      refer: location.href
    });

    // 逐题取答案并填上；默认不点提交
    const start = async () => {
      if (state.running) return;
      const usable = scan(true);
      if (!usable.length) {
        log("没有识别到题目，先打开作业或考试页面再试");
        return;
      }
      state.running = true;
      state.done = 0;
      log(`开始作答，共 ${usable.length} 道题`);
      for (const item of state.items.slice()) {
        if (!state.running) break;
        if (item.status === "done") { state.done++; continue; }
        const block = registry[item.index];
        if (!block) continue;
        setItem(item.index, { status: "running" });
        try {
          const question = toQuestion(block);
          let res = await getAccurateAnswer(question);
          let answer = res && res.data && res.data.answer;
          if (!Array.isArray(answer) || !answer.length) {
            res = await getAIAnswer(question);
            answer = res && res.data && res.data.answer;
          }
          if (!Array.isArray(answer) || !answer.length) {
            setItem(item.index, { status: "fail", msg: (res && res.msg) || "未搜到答案" });
            log(`第 ${item.index + 1} 题未搜到答案`);
            continue;
          }
          const filled = fill(block, answer);
          const fromAI = !!(res && res.data && res.data.src === "ai");
          if (filled.ok) {
            const notes = [];
            if (filled.unmatched && filled.unmatched.length) notes.push(`有 ${filled.unmatched.length} 个答案没对上选项`);
            if (filled.missing) notes.push(`还有 ${filled.missing} 个空没有答案`);
            if (filled.extraDropped) notes.push("题目是单选，多余的答案没填");
            if (fromAI) notes.push("这条是 AI 作答，建议核对");
            const needCheck = notes.length > 0;
            setItem(item.index, {
              status: needCheck ? "warn" : "done",
              answer: answer.join(" "),
              msg: needCheck ? notes.join("；") : `已填 ${filled.filled} 项`
            });
            log(`第 ${item.index + 1} 题${needCheck ? "已填，需核对" : "已作答"}：${answer.join(" ")}`);
          } else {
            setItem(item.index, { status: "fail", answer: answer.join(" "), msg: filled.reason || "填写失败" });
            log(`第 ${item.index + 1} 题 ${filled.reason || "填写失败"}`);
          }
          state.done++;
        } catch (e) {
          setItem(item.index, { status: "fail", msg: String((e && e.message) || e).slice(0, 80) });
          log(`第 ${item.index + 1} 题出错`);
        }
        // sleep 的单位是秒，这里每题之间停 1 秒，给页面留出更新时间
        await sleep(1);
      }
      state.running = false;
      log("本轮作答结束，请检查后手动提交");
    };

    const stop = () => {
      state.running = false;
      log("已停止");
    };

    // 页面结构变了、识别不到题时，把关键结构打进日志
    const inspect = () => {
      try {
        const docs = collectDocuments();
        const radios = docs.reduce((n, doc) => n + doc.querySelectorAll('input[type="radio"], input[type="checkbox"]').length, 0);
        const inputs = docs.reduce((n, doc) => n + doc.querySelectorAll("input, textarea").length, 0);
        const buttons = docs.reduce((n, doc) => n + doc.querySelectorAll("button, [role='button']").length, 0);
        log(`页面结构：选项控件 ${radios} 个，输入框 ${inputs} 个，按钮 ${buttons} 个，共 ${docs.length} 个文档`);
      } catch (e) {
        log("读取页面结构失败");
      }
    };

    const Panel = {
      name: "XsQuizPanel",
      setup() {
        return { state, start, stop, scan: () => scan(false), inspect };
      },
      render() {
        const h = vue.h;
        const state = this.state;
        const plain = { padding: "5px 12px", borderRadius: "6px", border: "1px solid var(--t-border2)", background: "var(--t-surface)", color: "var(--t-text)", cursor: "pointer" };
        const primary = Object.assign({}, plain, { border: "1px solid var(--t-primary)", background: "var(--t-primary)", color: "#fff" });
        const statusColor = {
          pending: "var(--t-text3)", running: "var(--t-primary)",
          done: "var(--t-success, #12b76a)", warn: "var(--t-warning, #dc6803)", fail: "var(--t-danger, #d92d20)"
        };
        const statusText = { pending: "待答", running: "作答中", done: "已答", warn: "核对", fail: "失败" };
        const rows = state.items.map((item) => h("div", {
          key: item.index,
          style: { display: "flex", gap: "8px", padding: "6px 0", borderBottom: "1px dashed var(--t-border)" }
        }, [
          h("span", { style: { flex: "0 0 34px", color: statusColor[item.status] || "var(--t-text3)", fontSize: "12px" } }, statusText[item.status] || ""),
          h("div", { style: { flex: "1", minWidth: 0 } }, [
            h("div", { style: { color: "var(--t-text)", fontSize: "12.5px", lineHeight: 1.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, item.title),
            item.answer ? h("div", { style: { color: "var(--t-primary)", fontSize: "12px" } }, item.answer) : null,
            item.msg ? h("div", { style: { color: "var(--t-text3)", fontSize: "11.5px" } }, item.msg) : null
          ])
        ]));
        const logs = state.logs.slice(0, 8).map((item, index) => h("div", { key: index, style: { color: "var(--t-text3)", fontSize: "11.5px", lineHeight: 1.7 } }, item.text));
        return h("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } }, [
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, [
            h("div", { style: { fontSize: "15px", fontWeight: 600 } }, "自动答题"),
            h("div", { style: { color: "var(--t-text3)", fontSize: "12px" } },
              state.total ? `识别到 ${state.total} 题，已完成 ${state.done}` : "未识别到题目")
          ]),
          h("div", { style: { color: "var(--t-text3)", fontSize: "12px", lineHeight: 1.7 } },
            "进入作业或考试页面后点「扫描题目」。答案由你的题库和 AI 提供，只自动填答案，不会替你点提交，检查完自己提交。"),
          h("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } }, [
            h("button", { onClick: this.scan, disabled: state.scanning, style: plain }, state.scanning ? "扫描中" : "扫描题目"),
            h("button", { onClick: this.start, disabled: state.running || !state.total, style: primary }, state.running ? "正在作答" : "开始答题"),
            state.running ? h("button", { onClick: this.stop, style: plain }, "停止") : null,
            h("button", { onClick: this.inspect, style: plain }, "诊断")
          ]),
          rows.length ? h("div", { style: { display: "flex", flexDirection: "column" } }, rows) : null,
          logs.length ? h("div", { style: { display: "flex", flexDirection: "column", gap: "2px", paddingTop: "4px" } }, logs) : null
        ]);
      }
    };

    // 进入页面后自动扫一次，隔几秒再扫，页面异步渲染也能跟上
    let booted = false;
    const boot = () => {
      if (booted) return;
      booted = true;
      setTimeout(() => { try { scan(true); } catch (_) {} }, 2500);
      setTimeout(() => { try { scan(true); } catch (_) {} }, 6000);
    };

    return { state, scan, start, stop, inspect, Panel, boot, findBlocks, fill };
  })();

  const xsWatchRoutes = {
    match: [{
      keyword: "",
      tab: "0",
      logic: () => {
        xsWatch.autoStart();
        // 作业、考试页先扫一遍有没有题目，有就显示在「答题」页
        xsQuiz.boot();
      }
    }],
    defaultRoute: { show: true, tab: "0" }
  };
  const platformConfigs = [
    {
      key: "cx",
      name: "超星学习通",
      domains: [
        "chaoxing.com",
        "edu.cn",
        "org.cn",
        "xueyinonline.com",
        "hnsyu.net",
        "qutjxjy.cn",
        "ynny.cn",
        "hnvist.cn",
        "fjlecb.cn",
        "gdhkmooc.com",
        "cugbonline.cn",
        "zjelib.cn",
        "cqrspx.cn",
        "neauce.com",
        "zhihui-yun.com",
        "cqie.cn",
        "ccqmxx.com",
        "jxgmxy.com",
        "sslibrary.com"
      ],
      routes: cxRoutes,
      showAi: true
    },
    {
      key: "zhs",
      name: "智慧树",
      domains: ["zhihuishu.com", "polymas.com"],
      routes: zhsRoutes,
      showAi: false,
      queueAdapter: zhsCourseQueueAdapter
    },
    {
      key: "qs",
      name: "青书学堂",
      domains: ["qingshuxuetang.com"],
      routes: XS_EXT.qsRoutes,
      showAi: true
    },
    {
      key: "ct",
      name: "出头科技",
      domains: ["web2.superchutou.com"],
      routes: XS_EXT.ctRoutes,
      showAi: true
    },
    // ===== 以下平台走通用视频助手：只做视频/文档进度，不抓题作答 =====
    {
      key: "ykt",
      name: "雨课堂",
      domains: ["yuketang.cn"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "mskt",
      name: "云班课",
      domains: ["mosoteach.cn"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "icve",
      name: "智慧职教",
      domains: ["icve.com.cn"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "ouchn",
      name: "国家开放大学",
      domains: ["ouchn.cn", "ouchn.edu.cn"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "mooc",
      name: "中国大学MOOC",
      domains: ["icourse163.org"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "uschool",
      name: "U 校园",
      domains: ["unipus.cn"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "xtzx",
      name: "学堂在线",
      domains: ["xuetangx.com"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "ytccr",
      name: "绎通云",
      domains: ["ytccr.com"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "sdzj",
      name: "山东专技",
      domains: ["treewises.com"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    },
    {
      key: "xczx",
      name: "西财在线",
      domains: ["swufe-online.com"],
      routes: xsWatchRoutes,
      showAi: false,
      watchSite: true
    }
  ];

  // 设置页要按当前平台决定显示哪些项
  function resolvePlatformKey(hostname) {
    const host = hostname || (typeof location !== "undefined" ? location.hostname : "");
    const found = platformConfigs.find((item) => item.domains.some((domain) => host === domain || host.endsWith("." + domain)));
    return found ? found.key : null;
  }

  // 面板内容兜底：某个页签渲染出错时显示原因，不再整块空白
  const PanelBoundary = {
    name: "PanelBoundary",
    data: () => ({ error: "" }),
    errorCaptured(error) {
      this.error = String((error && error.message) || error || "未知错误");
      try {
        console.error("[学神助手] 面板渲染出错", error);
      } catch (ignore) {
      }
      return false;
    },
    render() {
      if (this.error) {
        return vue.h("div", { class: "tab-content", style: "padding:14px;font-size:12px;line-height:1.7;color:var(--t-text);white-space:pre-wrap;word-break:break-all" }, ["面板渲染出错：" + this.error]);
      }
      return vue.h("div", { style: "display:contents" }, this.$slots.default ? this.$slots.default() : []);
    }
  };
  const _hoisted_1$1 = { class: "box-content" };
  const _sfc_main$2 = {
    __name: "index",
    emits: ["customEvent"],
    setup(__props, { emit: __emit }) {
      const isShow = vue.ref(false);
      const log = useLogStore();
      const setting = useSettingStore();
      const emit = __emit;
      const url2 = window.location.href;
      const hostname = window.location.hostname;
      const messageStore = useMessageStore();
      const currentPlatform = platformConfigs.find(
        (item) => item.domains.some((domain) => hostname === domain || hostname.endsWith("." + domain))
      ) ?? null;
      const settingTabKey = "4";
      // 智慧树的「答题」和「掌握度满分」本质是同一件事，合并成一个页签：
      // 页面在答题 / 考试 / 测验就显示答题，停在掌握度相关页面才显示掌握度，不额外放切换按钮
      const isZhsMasteryPage = () => {
        try {
          return /studywisdomh5\.zhihuishu\.com\/(study\/mastery|pointOfMastery|examAnalysis|exam)/i.test(window.location.href);
        } catch (_) {
          return false;
        }
      };
      const ZhiHuiShuAnswerPanel = {
        setup() {
          const masteryMode = vue.ref(isZhsMasteryPage());
          let timer = null;
          vue.onMounted(() => {
            timer = setInterval(() => {
              masteryMode.value = isZhsMasteryPage();
            }, 1200);
          });
          vue.onUnmounted(() => {
            if (timer) clearInterval(timer);
          });
          return { masteryMode };
        },
        render() {
          const h = vue.h;
          return h(this.masteryMode ? zhsMastery.Panel : _sfc_main$7);
        }
      };
      const contentMap = [
        {
          key: "0",
          tab: "◉ 首页",
          component: ScriptHome
        },
        {
          key: "1",
          tab: "▤ 日志",
          component: _sfc_main$9
        },
        {
          key: "record",
          tab: "▣ 记录",
          component: _sfc_main$3
        },
        ...(currentPlatform?.queueAdapter ? [{
          key: "queue",
          tab: "◫ 队列",
          component: CourseQueuePanel
        }] : []),

        {
          key: "2",
          tab: "◈ 答题",
          // 新平台用通用答题面板（抓题 + 填答案），旧平台仍用原来的题目列表；
          // 智慧树在原来答题页里加一个「掌握度满分」切换，不再单独占页签
          component: currentPlatform?.watchSite
            ? xsQuiz.Panel
            : currentPlatform?.key === "zhs"
              ? ZhiHuiShuAnswerPanel
              : _sfc_main$7
        },
        {
          key: "3",
          tab: "◎ 搜题",
          component: _sfc_main$5
        },
        {
          key: settingTabKey,
          tab: "◆ 设置",
          component: _sfc_main$6
        }
      ];
      const availableKeys = contentMap.map((item) => item.key);
      const normalizeTabKey = (tabKey) => availableKeys.includes(tabKey) ? tabKey : "0";
      const activeKey = vue.ref(normalizeTabKey(setting.tabIndex));
      const visibleContentMap = vue.computed(() => contentMap.filter((item) => !item.hidden));
      const currentContent = vue.computed(() => contentMap.find((item) => item.key === activeKey.value));
      const refreshTimer = vue.ref(null);
      const examIframeTimer = vue.ref(null);
      const examIframeKeywords = [
        "/examcode/examnotes",
        "/exam/test/examcode",
        "/exam/test/reVersionTestStartNew",
        "exam-ans/exam/test/reVersionTestStartNew",
        "mooc-ans/exam/test/reVersionTestStartNew",
        "/mooc2/exam/preview",
        "exam/preview"
      ];
      const normalizeIframeUrl = (iframeSrc) => {
        if (!iframeSrc) return "";
        try {
          return new URL(iframeSrc, window.location.href).href;
        } catch (error) {
          return iframeSrc;
        }
      };
      const tryOpenExamIframe = () => {
        if (!url2.includes("/base")) return false;
        const examIframeUrl = Array.from(document.querySelectorAll("iframe")).map((iframe) => normalizeIframeUrl(iframe.getAttribute("src") || iframe.src)).find(
          (iframeUrl) => examIframeKeywords.some((keyword) => iframeUrl.includes(keyword))
        );
        if (!examIframeUrl) return false;
        const storageKey = `abc-opened-exam-iframe:${examIframeUrl}`;
        if (sessionStorage.getItem(storageKey)) return true;
        sessionStorage.setItem(storageKey, "1");
        window.open(examIframeUrl, "_blank");
        log.insertLog("检测到考试页面已嵌入 iframe，已尝试在新窗口打开..");
        return true;
      };
      const startExamIframeWatcher = () => {
        if (!url2.includes("/base") || examIframeTimer.value) return;
        tryOpenExamIframe();
        examIframeTimer.value = setInterval(() => {
          tryOpenExamIframe();
        }, 1e3);
      };
      const chooseLogicByUrl = () => {
        var _a;
        const platformRoutes = currentPlatform == null ? void 0 : currentPlatform.routes;
        if (!platformRoutes) {
          isShow.value = false;
          return;
        }
        const route = platformRoutes.match.find((item) => url2.includes(item.keyword));
        const shouldShow = route || ((_a = platformRoutes.defaultRoute) == null ? void 0 : _a.show);
        if (!shouldShow) {
          isShow.value = false;
          return;
        }
        if (currentPlatform?.queueAdapter) {
          useCourseQueueStore().init(currentPlatform.queueAdapter);
        }
        fetchBasicInfo().then((res) => {
          console.log("fetchBasicInfo", res);
          if (res.code) {
            const { shopLink, version } = res.data;
            setting.shopLink = shopLink;
            setting.latestVersion = version;
          }
        });
        updateTokenInfo();
        startExamIframeWatcher();
        if (route) {
          if (!setting.config.basicConfig.token.value) {
            messageStore.insertMessage(
              "检测到未配置密钥，无法使用自动答题功能，请前往 “设置” 模块配置",
              "warning"
            );
          }
          setting.tabIndex = route.tab;
          if (route.log) log.insertLog(route.log);
          let routeRunning = false;
          const runRouteLogic = async () => {
            if (!route.logic || routeRunning) return;
            routeRunning = true;
            try { await route.logic(); }
            catch (error) { log.insertLog("当前操作失败：" + (error.message || error), "warning"); }
            finally { routeRunning = false; }
          };
          // 助手开关只管智慧树：路由上带 assist 的页面，开关关着就先挂起，等用户打开再开始
          const assistKind = route.assist || "";
          const assistLabel = assistKind === "video" ? "视频助手" : "答题助手";
          const assistValue = () => assistKind === "video"
            ? setting.config.basicConfig.assistVideo.value
            : setting.config.basicConfig.assistAnswer.value;
          if (assistKind) {
            vue.watch(assistValue, (enabled) => {
              if (enabled) return;
              log.insertLog(`${assistLabel}已关闭，当前页面不再开始新任务`, "warning");
              if (assistKind === "video") {
                document.querySelectorAll("video, audio").forEach((media) => media.pause());
              }
            });
          }
          const startRoute = async () => {
            if (assistKind && !assistValue()) {
              log.insertLog(`${assistLabel}未开启，开启后将自动开始当前页面的任务`, "warning");
              await new Promise((resolve) => {
                const stop = vue.watch(assistValue, (enabled) => {
                  if (!enabled) return;
                  stop();
                  resolve();
                });
              });
              log.insertLog(`${assistLabel}已开启，开始执行当前页面的任务`);
            }
            runRouteLogic();
          };
          startRoute();
          if ([cxHomeworkLogic, cxExamLogic, enterCxExamPreviewLogic].includes(route.logic)) {
            vue.watch(() => setting.config.basicConfig.autoAnswer.value, enabled => { if (enabled) runRouteLogic(); });
          }
          if (setting.config.searchConfig.searchBySelectedText.value) {
            log.insertLog("划词搜题已开启..");
          }
          autoRefreshPage();
          selectTextSearchLogic(document, window);
        } else {
          setting.tabIndex = platformRoutes.defaultRoute.tab;
        }
        isShow.value = true;
      };
      const updateTokenInfo = () => {
        if (setting.config.basicConfig.token.value) {
          getTokenInfo().then((res) => {
            if (res.code && res.code === 1) {
              const { count, usedCount, remainCount } = res.data;
              console.log("getTokenInfo", res.data);
              setting.userInfo.remainCount = remainCount !== void 0 ? formatLocalRemainCount(remainCount) : formatLocalRemainCount(count - usedCount);
            } else {
              setting.userInfo.remainCount = "密钥无效";
              messageStore.insertMessage(
                (res && res.msg) || "密钥无效或已过期，请到用户中心重新生成脚本密钥",
                "warning"
              );
            }
          });
        } else {
          setting.userInfo.remainCount = "密钥未配置";
        }
      };
      const changeTabIndex = (newActiveKey) => {
        const nextTabKey = normalizeTabKey(newActiveKey);
        activeKey.value = nextTabKey;
        setting.tabIndex = nextTabKey;
      };
      vue.watch(
        () => setting.tabIndex,
        (newVal) => {
          const nextTabKey = normalizeTabKey(newVal);
          activeKey.value = nextTabKey;
          if (nextTabKey === settingTabKey) {
            updateTokenInfo();
          }
        }
      );
      const getPageContexts = () => {
        const contexts = [{ document, window }];
        const collectIframeContexts = (rootDocument) => {
          const iframes = Array.from(rootDocument.querySelectorAll("iframe"));
          for (const iframe of iframes) {
            try {
              if (iframe.contentDocument && iframe.contentWindow) {
                contexts.push({
                  document: iframe.contentDocument,
                  window: iframe.contentWindow
                });
                collectIframeContexts(iframe.contentDocument);
              }
            } catch (error) {
              console.warn("读取页面框架失败", error);
            }
          }
        };
        collectIframeContexts(document);
        return contexts;
      };
      const tryChangeNewVersion = () => {
        var _a;
        for (const pageContext of getPageContexts()) {
          const changeBtn = pageContext.document.querySelector("a.experience");
          if (!changeBtn) continue;
          const onclickText = changeBtn.getAttribute("onclick") || "";
          const isNewVersionBtn = ((_a = changeBtn.textContent) == null ? void 0 : _a.trim().includes("体验新版")) || onclickText.includes("toNewFyCourseList");
          if (!isNewVersionBtn) continue;
          const pageWindow = pageContext.window;
          if (typeof pageWindow.toNewFyCourseList === "function") {
            pageWindow.toNewFyCourseList();
          } else if (typeof changeBtn.onclick === "function") {
            changeBtn.onclick.call(changeBtn);
          } else {
            changeBtn.click();
          }
          return true;
        }
        return false;
      };
      const changeNewVersion = async () => {
        for (let i = 0; i < 10; i++) {
          if (tryChangeNewVersion()) return;
          await sleep(0.5);
        }
      };
      const autoRefreshPage = () => {
        clearInterval(refreshTimer.value);
        refreshTimer.value = null;
        const timerStatus = setting.config.basicConfig.autoRefresh.value;
        if (timerStatus) {
          canRefreshStudyPage(document);
          refreshTimer.value = setInterval(() => {
            if (!setting.config.basicConfig.autoRefresh.value || !canRefreshStudyPage(document)) return;
            log.insertLog("定时刷新已开启：页面空闲或视频长期无进展，执行恢复刷新");
            window.location.reload();
          }, 18e5);
        }
      };
      vue.watch(() => setting.config.basicConfig.autoRefresh.value, autoRefreshPage);
      vue.onUnmounted(() => clearInterval(refreshTimer.value));
      changeNewVersion();
      chooseLogicByUrl();
      emit("customEvent", isShow.value);
      return (_ctx, _cache) => {
        const _component_a_tab_pane = vue.resolveComponent("a-tab-pane");
        const _component_a_tabs = vue.resolveComponent("a-tabs");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$1, [
          vue.createVNode(_component_a_tabs, {
            activeKey: activeKey.value,
            "onUpdate:activeKey": _cache[0] || (_cache[0] = ($event) => activeKey.value = $event),
            onChange: changeTabIndex
          }, {
            default: vue.withCtx(() => [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(visibleContentMap.value, (item) => {
                return vue.openBlock(), vue.createBlock(_component_a_tab_pane, {
                  tab: item.tab,
                  key: item.key
                }, null, 8, ["tab"]);
              }), 128))
            ]),
            _: 1
          }, 8, ["activeKey"]),
          currentContent.value ? (vue.openBlock(), vue.createBlock(PanelBoundary, { key: 0 }, {
            default: vue.withCtx(() => [
              (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(currentContent.value.component), {
                class: "tab-content",
                onAutoRefreshPage: autoRefreshPage,
                onChangeTab: changeTabIndex
              }, null, 32))
            ]),
            _: 1
          })) : vue.createCommentVNode("", true)
        ]);
      };
    }
  };
  const _hoisted_1 = {
    key: 0,
    class: "message-container"
  };
  const _hoisted_2 = { class: "script-info" };
  const _sfc_main$1 = {
    __name: "index",
    setup(__props) {
      const scriptInfo = getScriptInfo();
      const isMini = vue.ref(false);
      const mainWrapRef = vue.ref(null);
      const headerLeftRef = vue.ref(null);
      const boxSize = vue.ref({ width: 400, height: 700 });
      const setting = useSettingStore();
      const remembered = getRememberedLogin();
      const loginUser = vue.ref(remembered.username || "");
      const loginPwd = vue.ref("");
      const loginMsg = vue.ref("");
      const loginBusy = vue.ref(false);
      const rememberLogin = vue.ref(remembered.remember !== false);
      const isAutoLoggedIn = vue.ref(!!remembered.token);
      const openUserCenter = () => {
        const token = (remembered && remembered.token) || "";
        const user = (remembered && remembered.user) || "";
        const userStr = typeof user === "string" ? user : JSON.stringify(user);
        const url = token
          ? `${LOCAL_USER_CENTER_URL}&token=${encodeURIComponent(token)}&user=${encodeURIComponent(userStr)}`
          : setting.shopLink || LOCAL_USER_CENTER_URL;
        window.open(url, "_blank");
      };
      const openPricing = () => {
        const token = (remembered && remembered.token) || "";
        const user = (remembered && remembered.user) || "";
        const userStr = typeof user === "string" ? user : JSON.stringify(user);
        const baseUrl = __billHref;  // FX-CH:pricing-base-url
        if (!baseUrl) {
          cardMsg.value = "提示：" + __noShopTip;
          return;
        }
        const url = token && !__DIST.shop  // FX-CH:pricing-login-param
          ? `${baseUrl}&token=${encodeURIComponent(token)}&user=${encodeURIComponent(userStr)}`
          : baseUrl;
        window.open(url, "_blank");
      };
      const openRegister = () => {
        window.open("https://xs.openget.cn/register", "_blank");
      };
      const openForgot = () => {
        window.open("https://xs.openget.cn/forgot", "_blank");
      };
      const loginLocalBackend = async () => {
        if (!loginUser.value.trim() || !loginPwd.value.trim()) {
          loginMsg.value = "请填写用户名/邮箱和密码";
          return;
        }
        loginBusy.value = true;
        loginMsg.value = "正在登录用户中心...";
        try {
          const password_hash = await sha256Text(loginPwd.value.trim());
          const loginRes = await localBackendJson("https://xs.openget.cn/api/auth/login", {
            username: loginUser.value.trim(),
            password_hash
          });
          if (loginRes.code !== 200 || !loginRes.token) {
            loginMsg.value = loginRes.msg || "登录失败";
            return;
          }
          const syncRes = await syncLoginTokenToScriptKey(setting, loginRes.token);
          if (syncRes.ok) {
            if (rememberLogin.value) {
              setRememberedLogin({
                remember: true,
                username: loginUser.value.trim(),
                token: loginRes.token,
                savedAt: Date.now()
              });
            } else {
              setRememberedLogin({ remember: false, username: loginUser.value.trim() });
            }
            isAutoLoggedIn.value = true;
            loginMsg.value = "登录成功，已记住登录状态并同步密钥";
          } else {
            loginMsg.value = syncRes.msg || "登录成功，但脚本密钥获取失败，请点用户中心手动复制";
          }
        } catch (e) {
          loginMsg.value = "登录失败，请检查本地后端是否运行";
        } finally {
          loginBusy.value = false;
        }
      };
      const autoLoginByRememberedToken = async () => {
        if (!remembered.token) return;
        loginBusy.value = true;
        loginMsg.value = "正在恢复上次登录状态...";
        const profile = await localBackendJson("https://xs.openget.cn/api/user/profile", null, remembered.token);
        if (profile.code === 401 || profile.code === 403) {
          loginMsg.value = "登录状态已过期，请重新登录";
          setRememberedLogin({ remember: rememberLogin.value, username: remembered.username || "" });
          isAutoLoggedIn.value = false;
          loginBusy.value = false;
          return;
        }
        if (profile.code !== 200) {
          loginMsg.value = "网络异常，暂未恢复登录状态（已保留登录记忆）";
          isAutoLoggedIn.value = false;
          loginBusy.value = false;
          return;
        }
        const syncRes = await syncLoginTokenToScriptKey(setting, remembered.token);
        loginMsg.value = syncRes.ok ? "已恢复登录状态并同步密钥" : syncRes.msg || "自动登录失败";
        loginBusy.value = false;
      };
      const clearRememberedLogin = () => {
        setRememberedLogin({ remember: rememberLogin.value, username: loginUser.value.trim() });
        isAutoLoggedIn.value = false;
        loginMsg.value = "已清除脚本页登录记忆";
      };
      const cardCode = vue.ref("");
      const cardBusy = vue.ref(false);
      const cardMsg = vue.ref("");
      const activateCardKey = async () => {
        const code = cardCode.value.trim().toUpperCase();
        if (code.length !== 16) {
          cardMsg.value = "请输入 16 位卡密";
          return;
        }
        const token = getLocalBackendToken() || getRememberedLogin().token || "";
        if (!token) {
          cardMsg.value = "请先登录";
          return;
        }
        cardBusy.value = true;
        cardMsg.value = "正在激活...";
        try {
          const res = await localBackendJson("https://xs.openget.cn/api/user/card-key/activate", { code }, token);
          if (res.code === 200) {
            cardCode.value = "";
            cardMsg.value = res.msg || "卡密激活成功，权益已到账";
            if (res.profile) {
              setting.userInfo.remainCount = getProfileRemainingCount(res.profile);
              setting.userInfo.activeMember = !!res.profile.active_member;
              setting.userInfo.memberUntil = res.profile.member_until || "";
              setting.userInfo.pointsBalance = Number(res.profile.points_balance || 0);
              persistSettingState(setting);
            }
          } else if (res.code === 401) {
            cardMsg.value = "登录状态已失效，请重新登录";
          } else {
            cardMsg.value = res.msg || "激活失败，请稍后再试";
          }
        } catch (_) {
          cardMsg.value = "激活失败，请检查网络";
        } finally {
          cardBusy.value = false;
        }
      };
      vue.onMounted(autoLoginByRememberedToken);
      const isShow = vue.ref(true);
      const messageStore = useMessageStore();
      const messageList = vue.ref(messageStore.messageList);
      const backendTabKeys = ["1", "record"];
      const isBackendActive = vue.computed(() => backendTabKeys.includes(setting.tabIndex));
      const THEME_OPTIONS = [
        { value: "dark", label: "暗色", dot: "dot-dark", icon: "☾" },
        { value: "light", label: "亮色", dot: "dot-light", icon: "☀" },
        { value: "glass", label: "毛玻璃", dot: "dot-glass", icon: "◐" },
        { value: "graphite", label: "深空灰", dot: "dot-graphite", icon: "◑" },
        { value: "mist", label: "雾蓝", dot: "dot-mist", icon: "◔" },
        { value: "sand", label: "暖砂", dot: "dot-sand", icon: "◕" }
      ];
      const THEME_CLASS = {
        dark: "theme-dark",
        light: "theme-light",
        graphite: "theme-graphite",
        mist: "theme-mist",
        sand: "theme-sand"
      };
      const savedTheme = (() => {
        try { return GM_getValue("themeMode") || "dark"; } catch (_) { return "dark"; }
      })();
      const themeMode = vue.ref(THEME_OPTIONS.some((t) => t.value === savedTheme) ? savedTheme : "dark");
      const themeMenuOpen = vue.ref(false);
      const toggleThemeMenu = () => {
        themeMenuOpen.value = !themeMenuOpen.value;
      };
      const chooseTheme = (mode) => {
        themeMode.value = mode;
        themeMenuOpen.value = false;
        try { GM_setValue("themeMode", mode); } catch (_) {}
      };
      const onThemePointerDown = (event) => {
        if (!themeMenuOpen.value) return;
        const path = typeof event.composedPath === "function" ? event.composedPath() : [];
        const inside = path.some((el) => el && el.classList && (el.classList.contains("theme-menu") || el.classList.contains("theme-toggle")));
        if (!inside) themeMenuOpen.value = false;
      };
      const onThemeKeydown = (event) => {
        if (event.key === "Escape" && themeMenuOpen.value) themeMenuOpen.value = false;
      };
      vue.onMounted(() => {
        window.addEventListener("pointerdown", onThemePointerDown, true);
        window.addEventListener("keydown", onThemeKeydown, true);
      });
      vue.onUnmounted(() => {
        window.removeEventListener("pointerdown", onThemePointerDown, true);
        window.removeEventListener("keydown", onThemeKeydown, true);
      });
      const supportsGlassBlur = (() => {
        try {
          const css = window.CSS;
          return !!(css && css.supports && (css.supports("backdrop-filter", "blur(2px)") || css.supports("-webkit-backdrop-filter", "blur(2px)")));
        } catch (_) {
          return false;
        }
      })();
      const themeClass = vue.computed(() => {
        if (themeMode.value === "glass") return supportsGlassBlur ? "theme-glass" : "theme-glass theme-glass-flat";
        return THEME_CLASS[themeMode.value] || "theme-dark";
      });
      const themeIcon = vue.computed(() => {
        const hit = THEME_OPTIONS.find((t) => t.value === themeMode.value);
        return hit ? hit.icon : "☾";
      });
      const isPinned = vue.ref(GM_getValue("isPinned") || false);
      const togglePin = () => {
        isPinned.value = !isPinned.value;
        GM_setValue("isPinned", isPinned.value);
      };
      const getPopupContainer = () => {
        return headerLeftRef.value || mainWrapRef.value || document.body;
      };
      const handleBackendMenuClick = ({ key }) => {
        if (key === "log") {
          autoSetTab(setting, "1");
          return;
        }
        if (key === "record") {
          setting.tabIndex = "record";
        }
      };
      vue.watch(
        setting,
        (newVal) => {
          GM_setValue("setting", JSON.stringify(newVal));
          const token = setting.config && setting.config.basicConfig && setting.config.basicConfig.token && setting.config.basicConfig.token.value;
          scheduleSaveAbcCloudConfig(setting, token);
        },
        { deep: true }
      );
      const position = vue.ref({
        right: setting.position.right || "0px",
        top: setting.position.top || "0px"
      });
      const isDragging = vue.ref(false);
      const dragOffset = vue.ref({ x: 0, y: 0 });
      const persistPosition = () => {
        setting.position.right = position.value.right;
        setting.position.top = position.value.top;
      };
      const syncPositionWithRect = () => {
        if (!mainWrapRef.value) return;
        const rect = mainWrapRef.value.getBoundingClientRect();
        position.value = {
          right: Math.max(0, window.innerWidth - rect.right) + "px",
          top: Math.max(0, rect.top) + "px"
        };
      };
      const changeBoxSize = () => {
        isMini.value = !isMini.value;
      };
      const miniBallStatus = vue.ref({ text: "待命中", icon: "" });
      const miniBallLogSummary = vue.ref("暂无日志");
      const updateMiniBallInfo = () => {
        let lastLogText = "";
        try {
          const logStore2 = useLogStore();
          const logs = logStore2.logList;
          if (logs.length > 0) {
            const last = logs[logs.length - 1];
            lastLogText = String(last.text || "");
            miniBallLogSummary.value = lastLogText.length > 18 ? lastLogText.slice(0, 18) + "..." : lastLogText;
          } else {
            miniBallLogSummary.value = "暂无日志";
          }
        } catch (e) {
          miniBallLogSummary.value = "暂无日志";
        }
        try {
          if (/视频|播放|倍速|video/.test(lastLogText)) {
            miniBallStatus.value = { text: "视频播放中", icon: "" };
          } else if (/答题|测验|作业|考试|交卷|提交答案|quiz|homework|exam/.test(lastLogText)) {
            miniBallStatus.value = { text: "答题中", icon: "" };
          } else if (/直播|live|zhibo/.test(lastLogText)) {
            miniBallStatus.value = { text: "直播中", icon: "" };
          } else if (/阅读|PPT|电子书|document|ebook/.test(lastLogText)) {
            miniBallStatus.value = { text: "阅读中", icon: "" };
          } else {
            const url = location.href;
            if (/zhibo\.chaoxing\.com/.test(url)) {
              miniBallStatus.value = { text: "直播中", icon: "" };
            } else if (/chaoxing\.com/.test(url)) {
              miniBallStatus.value = { text: "学习中", icon: "" };
            } else {
              miniBallStatus.value = { text: "待命中", icon: "" };
            }
          }
        } catch (e) {
          miniBallStatus.value = { text: "待命中", icon: "" };
        }
      };
      let miniBallTimer = null;
      vue.onMounted(() => {
        updateMiniBallInfo();
        miniBallTimer = setInterval(updateMiniBallInfo, 1500);
      });
      vue.onUnmounted(() => {
        if (miniBallTimer) clearInterval(miniBallTimer);
      });
      const miniBallRemainCount = vue.computed(() => {
        try {
          const rc = setting.userInfo.remainCount;
          if (rc === "无限" || rc === Infinity) return "∞";
          const n = Number(rc);
          if (isNaN(n) || n <= 0) return String(rc || "");
          return n > 9999 ? "∞" : String(n);
        } catch (e) {
          return "";
        }
      });
      const startDrag = (event) => {
        if (isPinned.value) return;
        event.preventDefault();
        if (!mainWrapRef.value) return;
        const rect = mainWrapRef.value.getBoundingClientRect();
        boxSize.value = { width: rect.width, height: rect.height };
        isDragging.value = true;
        dragOffset.value = {
          x: rect.right - event.clientX,
          y: event.clientY - rect.top
        };
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", endDrag);
      };
      const drag = (e) => {
        if (!isDragging.value) return;
        let newRight = window.innerWidth - e.clientX - dragOffset.value.x;
        let newY = e.clientY - dragOffset.value.y;
        if (newRight < 0) {
          newRight = 0;
        }
        if (newRight + boxSize.value.width > window.innerWidth) {
          newRight = window.innerWidth - boxSize.value.width;
        }
        if (newY < 0) {
          newY = 0;
        }
        if (newY + boxSize.value.height > window.innerHeight) {
          newY = window.innerHeight - boxSize.value.height;
        }
        position.value = {
          right: newRight + "px",
          top: newY + "px"
        };
      };
      const endDrag = () => {
        isDragging.value = false;
        persistPosition();
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", endDrag);
      };
      const updateBoxSize = () => {
        if (mainWrapRef.value) {
          const rect = mainWrapRef.value.getBoundingClientRect();
          boxSize.value = {
            width: rect.width,
            height: rect.height
          };
        }
      };
      const checkAndFixPosition = () => {
        if (!mainWrapRef.value) return;
        const rect = mainWrapRef.value.getBoundingClientRect();
        const currentRight = parseInt(position.value.right) || 0;
        const currentTop = parseInt(position.value.top) || 0;
        let needFix = false;
        let newRight = currentRight;
        let newTop = currentTop;
        if (currentRight + rect.width > window.innerWidth) {
          newRight = Math.max(0, window.innerWidth - rect.width);
          needFix = true;
        }
        if (currentRight < 0) {
          newRight = 0;
          needFix = true;
        }
        if (currentTop < 0) {
          newTop = 0;
          needFix = true;
        }
        if (currentTop + rect.height > window.innerHeight) {
          newTop = Math.max(0, window.innerHeight - rect.height);
          needFix = true;
        }
        if (needFix) {
          position.value = {
            right: newRight + "px",
            top: newTop + "px"
          };
          persistPosition();
          console.log("位置已修正，防止超出屏幕边界");
        }
      };
      vue.onMounted(async () => {
        await vue.nextTick();
        const token = setting.config && setting.config.basicConfig && setting.config.basicConfig.token && setting.config.basicConfig.token.value;
        if (token) {
          abcCloudApplying = true;
          await fetchAndApplyAbcCloudConfig(setting, token);
          abcCloudApplying = false;
        }
        updateBoxSize();
        syncPositionWithRect();
        persistPosition();
        checkAndFixPosition();
        if (window.ResizeObserver) {
          const resizeObserver = new ResizeObserver(() => {
            updateBoxSize();
            checkAndFixPosition();
          });
          if (mainWrapRef.value) {
            resizeObserver.observe(mainWrapRef.value);
          }
        }
      });
      return (_ctx, _cache) => {
        const _component_a_alert = vue.resolveComponent("a-alert");
        const _component_a_menu_item = vue.resolveComponent("a-menu-item");
        const _component_a_menu = vue.resolveComponent("a-menu");
        const _component_a_dropdown = vue.resolveComponent("a-dropdown");
        return isShow.value ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: vue.normalizeClass(["main-wrap", themeClass.value]),
          style: vue.normalizeStyle(position.value),
          ref_key: "mainWrapRef",
          ref: mainWrapRef
        }, [
          !isMini.value && themeMode.value === "glass" ? (vue.openBlock(), vue.createElementBlock("div", {
            key: 3,
            class: "glass-aura"
          })) : vue.createCommentVNode("", true),
          isMini.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: 0,
            class: "mini-ball",
            onClick: vue.withModifiers(changeBoxSize, ["stop"]),
            onMousedown: _cache[2] || (_cache[2] = vue.withModifiers(startDrag, ["stop"]))
          }, [
            vue.createElementVNode("div", { class: "mini-ball-icon" }, [
              miniBallRemainCount.value ? (vue.openBlock(), vue.createElementBlock("span", {
                key: 0,
                class: "mini-ball-count"
              }, vue.toDisplayString(miniBallRemainCount.value), 1)) : vue.createCommentVNode("", true),
              vue.createTextVNode(" 学神")
            ]),
            vue.createElementVNode("div", { class: "mini-ball-body" }, [
              vue.createElementVNode("span", { class: "mini-ball-text" }, vue.toDisplayString(miniBallStatus.value.icon ? miniBallStatus.value.icon + " " + miniBallStatus.value.text : miniBallStatus.value.text), 1),
              vue.createElementVNode("span", { class: "mini-ball-sub" }, vue.toDisplayString(miniBallLogSummary.value), 1)
            ]),
            vue.createElementVNode("div", { class: "mini-ball-shine" }),
            vue.createElementVNode("div", { class: "mini-ball-glow" }),
            vue.createElementVNode("div", { class: "mini-ball-orbits" }, [
              vue.createElementVNode("i", null, " "),
              vue.createElementVNode("i", null, " ")
            ])
          ], 32)) : (vue.openBlock(), vue.createElementBlock("div", {
            key: 1,
            class: vue.normalizeClass(["main-box", themeClass.value])
          }, [
            vue.createElementVNode("div", {
              class: "box-header",
              onMousedown: startDrag
            }, [
              vue.createElementVNode("div", {
                class: "header-left",
                ref_key: "headerLeftRef",
                ref: headerLeftRef
              }, [
                vue.createElementVNode("span", _hoisted_2, "学神助手 " + vue.toDisplayString(vue.unref(scriptInfo).version), 1),
                !isMini.value ? (vue.openBlock(), vue.createBlock(_component_a_dropdown, {
                  key: 0,
                  placement: "bottomLeft",
                  trigger: ["hover"],
                  overlayClassName: "backend-dropdown-overlay",
                  getPopupContainer
                }, {
                  overlay: vue.withCtx(() => [
                    vue.createVNode(_component_a_menu, { onClick: handleBackendMenuClick }, {
                      default: vue.withCtx(() => [
                        vue.createVNode(_component_a_menu_item, { key: "log" }, {
                          default: vue.withCtx(() => _cache[4] || (_cache[4] = [
                            vue.createTextVNode("≡ 日志")
                          ])),
                          _: 1
                        }),
                        vue.createVNode(_component_a_menu_item, { key: "record" }, {
                          default: vue.withCtx(() => _cache[5] || (_cache[5] = [
                            vue.createTextVNode("▤ 记录")
                          ])),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  default: vue.withCtx(() => [
                    vue.createElementVNode("span", {
                      class: vue.normalizeClass(["backend-entry", { active: isBackendActive.value }]),
                      onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
                      }, ["stop"])),
                      onMousedown: _cache[1] || (_cache[1] = vue.withModifiers(() => {
                      }, ["stop"]))
                    }, " ▤ ", 34)
                  ]),
                  _: 1
                })) : vue.createCommentVNode("", true)
              ], 512),
              vue.createElementVNode("div", { style: { "display": "flex", "gap": "6px", "align-items": "center" } }, [
                vue.createElementVNode("div", {
                  class: vue.normalizeClass(["pin-btn", { pinned: isPinned.value }]),
                  tabindex: "0",
                  role: "button",
                  onClick: vue.withModifiers(togglePin, ["stop"]),
                  onKeydown: ($event) => {
                    if ($event.key === "Enter" || $event.key === " ") {
                      $event.preventDefault();
                      togglePin();
                    }
                  },
                  onMousedown: _cache[6] || (_cache[6] = vue.withModifiers(() => {
                  }, ["stop"])),
                  title: isPinned.value ? "解除固定" : "固定位置"
                }, "⌖", 10, ["title"]),
                vue.createElementVNode("div", {
                  class: vue.normalizeClass(["theme-toggle", { active: themeMenuOpen.value }]),
                  tabindex: "0",
                  role: "button",
                  onClick: vue.withModifiers(toggleThemeMenu, ["stop"]),
                  onKeydown: ($event) => {
                    if ($event.key === "Enter" || $event.key === " ") {
                      $event.preventDefault();
                      toggleThemeMenu();
                    }
                  },
                  onMousedown: _cache[6] || (_cache[6] = vue.withModifiers(() => {
                  }, ["stop"])),
                  title: "切换界面主题"
                }, vue.toDisplayString(themeIcon.value), 3),
                vue.createElementVNode("div", {
                  class: "shrink-btn",
                  tabindex: "0",
                  role: "button",
                  onClick: vue.withModifiers(changeBoxSize, ["stop"]),
                  onKeydown: ($event) => {
                    if ($event.key === "Enter" || $event.key === " ") {
                      $event.preventDefault();
                      changeBoxSize();
                    }
                  },
                  onMousedown: _cache[7] || (_cache[7] = vue.withModifiers(() => {
                  }, ["stop"])),
                  title: "收起"
                }, "—")
              ]),
            ], 32),
            !isMini.value ? (vue.openBlock(), vue.createElementBlock("div", {
              key: 1,
              class: "login-bar",
              style: { "padding": "8px 10px", "background": "var(--t-surface2)", "border-bottom": "1px solid var(--t-border)", "display": "flex", "flex-direction": "column", "gap": "6px" }
            }, [
              vue.createElementVNode("div", { style: { "display": "flex", "gap": "6px", "align-items": "center" } }, [
                vue.createElementVNode("input", {
                  value: loginUser.value,
                  onInput: ($event) => loginUser.value = $event.target.value,
                  placeholder: "用户名/邮箱",
                  style: { "flex": "1", "min-width": "0", "height": "28px", "padding": "0 8px", "border": "1px solid var(--t-border2)", "border-radius": "4px", "background": "var(--t-surface)", "color": "var(--t-text)", "font-size": "12px" }
                }, null, 40, ["value"]),
                vue.createElementVNode("input", {
                  value: loginPwd.value,
                  onInput: ($event) => loginPwd.value = $event.target.value,
                  onKeydown: vue.withKeys(loginLocalBackend, ["enter"]),
                  type: "password",
                  placeholder: "密码",
                  style: { "flex": "1", "min-width": "0", "height": "28px", "padding": "0 8px", "border": "1px solid var(--t-border2)", "border-radius": "4px", "background": "var(--t-surface)", "color": "var(--t-text)", "font-size": "12px" }
                }, null, 40, ["value"]),
                vue.createElementVNode("button", {
                  onClick: loginLocalBackend,
                  disabled: loginBusy.value,
                  style: { "height": "28px", "padding": "0 12px", "border": "none", "border-radius": "4px", "background": "var(--t-primary)", "color": "#fff", "cursor": "pointer", "font-size": "12px", "font-weight": "500", "flex": "none" }
                }, vue.toDisplayString(loginBusy.value ? "登录中..." : "登录"), 9, ["disabled"])
              ]),
              vue.createElementVNode("div", { style: { "display": "flex", "gap": "10px", "align-items": "center", "color": "var(--t-text3)", "font-size": "11px", "flex-wrap": "wrap" } }, [
                vue.createElementVNode("label", { style: { "display": "inline-flex", "align-items": "center", "gap": "4px", "cursor": "pointer" } }, [
                  vue.createElementVNode("input", {
                    type: "checkbox",
                    checked: rememberLogin.value,
                    onChange: ($event) => {
                      rememberLogin.value = $event.target.checked;
                      if (!rememberLogin.value) clearRememberedLogin();
                    }
                  }, null, 40, ["checked"]),
                  vue.createTextVNode("记住登录")
                ]),
                vue.createElementVNode("a", {
                  href: "javascript:void(0)",
                  onClick: vue.withModifiers(openForgot, ["stop", "prevent"]),
                  style: { "color": "var(--t-primary)", "cursor": "pointer", "text-decoration": "none" }
                }, "找回密码"),
                vue.createElementVNode("a", {
                  href: "javascript:void(0)",
                  onClick: vue.withModifiers(openRegister, ["stop", "prevent"]),
                  style: { "color": "var(--t-primary)", "cursor": "pointer", "text-decoration": "none" }
                }, "注册"),
                vue.createElementVNode("a", {
                  href: "javascript:void(0)",
                  onClick: vue.withModifiers(openPricing, ["stop", "prevent"]),
                  style: { "color": "var(--t-primary)", "cursor": "pointer", "text-decoration": "none" }
                }, "套餐"),
                isAutoLoggedIn.value ? (vue.openBlock(), vue.createElementBlock("button", {
                  key: 0,
                  onClick: clearRememberedLogin,
                  style: { "height": "20px", "padding": "0 6px", "border": "1px solid var(--t-danger)", "border-radius": "4px", "background": "var(--t-surface2)", "color": "var(--t-danger)", "cursor": "pointer", "font-size": "11px" }
                }, "清除记忆")) : vue.createCommentVNode("", true),
                loginMsg.value ? (vue.openBlock(), vue.createElementBlock("span", {
                  key: 2,
                  style: { "color": loginMsg.value.includes("成功") ? "var(--t-success)" : "var(--t-danger)" }
                }, vue.toDisplayString(loginMsg.value), 1)) : vue.createCommentVNode("", true)
              ]),
              __DIST.code ? (vue.openBlock(), vue.createElementBlock("div", {  // FX-CH:card-key-activate
                key: 3,
                style: { "display": "flex", "gap": "6px", "align-items": "center", "flex-wrap": "wrap" }
              }, [
                vue.createElementVNode("span", { style: { "font-size": "12px", "color": "var(--t-text3)", "font-weight": "600", "flex": "none" } }, "🎫"),
                vue.createElementVNode("input", {
                  value: cardCode.value,
                  onInput: ($event) => cardCode.value = $event.target.value,
                  onKeydown: vue.withKeys(activateCardKey, ["enter"]),
                  maxlength: "16",
                  placeholder: "卡密（16 位）",
                  style: { "flex": "1", "min-width": "0", "height": "28px", "padding": "0 8px", "border": "1px solid var(--t-border2)", "border-radius": "4px", "background": "var(--t-surface)", "color": "var(--t-text)", "font-size": "12px", "letter-spacing": "1px", "text-transform": "uppercase" }
                }, null, 40, ["value"]),
                vue.createElementVNode("button", {
                  onClick: activateCardKey,
                  disabled: cardBusy.value,
                  style: { "height": "28px", "padding": "0 12px", "border": "none", "border-radius": "4px", "background": "var(--t-primary)", "color": "#fff", "cursor": "pointer", "font-size": "12px", "font-weight": "500", "flex": "none" }
                }, vue.toDisplayString(cardBusy.value ? "激活中..." : "激活卡密"), 9, ["disabled"]),
                cardMsg.value ? (vue.openBlock(), vue.createElementBlock("span", {
                  key: 0,
                  style: { "color": cardBusy.value || cardMsg.value.indexOf("提示：") === 0 ? "var(--t-text3)" : (cardMsg.value.includes("成功") || cardMsg.value.includes("已到账") ? "var(--t-success)" : "var(--t-danger)"), "flex": "1 1 100%", "font-size": "11px" }
                }, vue.toDisplayString(cardMsg.value), 5)) : vue.createCommentVNode("", true)
              ])) : vue.createCommentVNode("", true)
            ])) : vue.createCommentVNode("", true),
            vue.createVNode(_sfc_main$2, {
              class: vue.normalizeClass(`box-content ${isMini.value ? "mini" : ""}`),
              onCustomEvent: _cache[8] || (_cache[8] = (newValue) => isShow.value = newValue)
            }, null, 8, ["class"])
          ], 2)),
          themeMenuOpen.value && !isMini.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: 2,
            class: "theme-menu",
            onMousedown: _cache[9] || (_cache[9] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.createElementVNode("div", { class: "theme-menu-title" }, "界面主题"),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(THEME_OPTIONS, (opt) => {
              return vue.openBlock(), vue.createElementBlock("div", {
                key: opt.value,
                class: vue.normalizeClass(["theme-menu-item", { active: themeMode.value === opt.value }]),
                tabindex: "0",
                role: "button",
                onClick: vue.withModifiers(($event) => chooseTheme(opt.value), ["stop"]),
                onKeydown: ($event) => {
                  if ($event.key === "Enter" || $event.key === " ") {
                    $event.preventDefault();
                    chooseTheme(opt.value);
                  }
                }
              }, [
                vue.createElementVNode("i", { class: vue.normalizeClass(["dot", opt.dot]) }, null, 2),
                vue.createTextVNode(" " + vue.toDisplayString(opt.label), 1)
              ], 10, ["onClick"]);
            }), 128))
          ])) : vue.createCommentVNode("", true)
        ], 6)) : vue.createCommentVNode("", true);
      };
    }
  };
  const _sfc_main = /* @__PURE__ */ vue.defineComponent({
    __name: "App",
    setup(__props) {
      const shadowRoot = vue.inject("shadowRoot");
      const getPopupContainer = () => {
        var _a;
        return ((_a = shadowRoot == null ? void 0 : shadowRoot.querySelector) == null ? void 0 : _a.call(shadowRoot, "[data-xs-abc-app]")) ?? document.body;
      };
      return (_ctx, _cache) => {
        const _component_a_style_provider = vue.resolveComponent("a-style-provider");
        const _component_a_config_provider = vue.resolveComponent("a-config-provider");
        return vue.openBlock(), vue.createBlock(_component_a_config_provider, { getPopupContainer }, {
          default: vue.withCtx(() => [
            vue.createVNode(_component_a_style_provider, { container: vue.unref(shadowRoot) }, {
              default: vue.withCtx(() => [
                vue.createVNode(_sfc_main$1)
              ]),
              _: 1
            }, 8, ["container"])
          ]),
          _: 1
        });
      };
    }
  });
  const hookError = () => {
    const oldset = _unsafeWindow.setInterval;
    const oldout = _unsafeWindow.setTimeout;
    _unsafeWindow.setInterval = function(...args) {
      const err = new Error("");
      if (err.stack && err.stack.indexOf("checkoutNotTrustScript") !== -1) {
        return -1;
      }
      return oldset.call(this, ...args);
    };
    _unsafeWindow.setTimeout = function(...args) {
      const err = new Error("");
      if (err.stack && err.stack.indexOf("checkoutNotTrustScript") !== -1) {
        return -1;
      }
      return oldout.call(this, ...args);
    };
  };
  const url = _unsafeWindow.location.href;
  const isTopWindow = _unsafeWindow.self === _unsafeWindow.top;
  const ABC_LOADED_FLAG = Symbol.for("__xsLoaded");
  if (Object.prototype.hasOwnProperty.call(_unsafeWindow, ABC_LOADED_FLAG)) ;
  else {
    let injectCSSIntoShadow = function(shadow) {
      const pendingCSS = globalThis.__abcCSS;
      if (pendingCSS) {
        const style = document.createElement("style");
        style.textContent = pendingCSS;
        shadow.appendChild(style);
        // 记住这块样式，后面页面新注入的样式都会追加到它后面，需要把它挪回最后，否则同权重会被页面样式盖掉
        shadow.__xsPanelCss = style;
        delete globalThis.__abcCSS;
      }
    }, observeHeadStyles = function(shadow) {
      const clonedMap = /* @__PURE__ */ new WeakMap();
      const cloneStyle = (node) => {
        if (!(node instanceof HTMLStyleElement)) return;
        if (node.dataset.abcIgnore) return;
        if (clonedMap.has(node)) return;
        const clone = node.cloneNode(true);
        clone.dataset.abcIgnore = "true";
        shadow.appendChild(clone);
        if (shadow.__xsPanelCss) shadow.appendChild(shadow.__xsPanelCss);
        clonedMap.set(node, clone);
        new MutationObserver(() => {
          clone.textContent = node.textContent;
        }).observe(node, { childList: true, characterData: true, subtree: true });
      };
      new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) cloneStyle(node);
        }
      }).observe(document.head, { childList: true });
    };
    Object.defineProperty(_unsafeWindow, ABC_LOADED_FLAG, { value: true, configurable: true, enumerable: false, writable: true });
    if (url.includes("zhihuishu.com") && isTopWindow) {
      if (url.includes("studyvideoh5.zhihuishu.com")) {
        hookError();
      }
      // 作业页（atHomeworkExam）也会拉同一份试卷接口，只在几个考试域名上装钩子会漏抓，
      // 全站装一次，没命中接口就什么都不做，代价可以忽略
      installAnswerSheetHook();
    }
    const timer = setInterval(() => {
      if (document.readyState === "complete") {
        clearInterval(timer);
        if (!isTopWindow) return;
        if (document.querySelector("[data-xs-abc-root]")) return;
        const container = document.createElement("div");
        container.setAttribute("data-xs-abc-root", "");
        container.style.cssText = "all:initial!important;position:static!important;display:block!important;width:0!important;height:0!important;overflow:visible!important;opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important;pointer-events:none!important";
        document.body.appendChild(container);
        const shadow = container.attachShadow({ mode: "open" });
        const resetStyle = document.createElement("style");
        resetStyle.textContent = [
          ":host{all:initial!important;display:block!important}",
          ".no-select{-webkit-user-select:none!important;-moz-user-select:none!important;user-select:none!important}",
          "input{outline:none;border:none}",
          "div{box-sizing:border-box}",
          "ul,ol{padding-inline-start:20px}",
          ".pin-btn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;cursor:pointer;font-size:14px;opacity:0.5;transition:all 0.2s;user-select:none}",
          ".pin-btn:hover{opacity:0.8}",
          ".pin-btn.pinned{opacity:1;color:var(--t-primary,#1677ff)}",
          ".update-notify-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:linear-gradient(135deg,var(--t-primary,#2563eb),var(--t-primary-2,#1d4ed8));color:#fff;font-size:13px;border-radius:8px 8px 0 0;pointer-events:auto}",
          ".update-notify-btn{padding:3px 12px;background:rgba(255,255,255,.25);border-radius:4px;cursor:pointer;white-space:nowrap;font-weight:600;transition:background .2s}",
          ".update-notify-btn:hover{background:rgba(255,255,255,.4)}",
          ".update-dismiss-btn{cursor:pointer;opacity:.6;font-size:16px;padding:0 4px;transition:opacity .2s}",
          ".update-dismiss-btn:hover{opacity:1}"
        ].join("\n");
        shadow.appendChild(resetStyle);
        injectCSSIntoShadow(shadow);
        observeHeadStyles(shadow);
        const appDiv = document.createElement("div");
        appDiv.setAttribute("data-xs-abc-app", "");
        shadow.appendChild(appDiv);
        const app = vue.createApp(_sfc_main);
        const pinia$1 = pinia.createPinia();
        app.provide("shadowRoot", shadow);
        app.use(pinia$1);
        app.use(Antd);
        app.mount(appDiv);
        // >>> FX-STRIP:auto-update
        // === 自动检测更新 + 顶部提示条 ===
        (function() {
          var _showUpdateBar = function(remote) {
            var _insertBar = function() {
              if (shadow.querySelector('.update-notify-bar')) return;
              var mainBox = shadow.querySelector('.main-box');
              if (!mainBox) return false;
              var bar = document.createElement('div');
              bar.className = 'update-notify-bar';
              bar.innerHTML = '<span style="flex:1">🎉 发现新版本 v' + remote.version + '，点击右侧按钮更新</span>' +
                '<span class="update-notify-btn">立即更新</span>' +
                '<span class="update-dismiss-btn">✕</span>';
              mainBox.insertBefore(bar, mainBox.firstChild);
              bar.querySelector('.update-notify-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof GM_openInTab === 'function') {
                  GM_openInTab(remote.download_url, { active: true, insert: true });
                } else if (typeof GM !== 'undefined' && typeof GM.openInTab === 'function') {
                  GM.openInTab(remote.download_url, { active: true });
                } else {
                  window.open(remote.download_url, '_blank');
                }
              });
              bar.querySelector('.update-dismiss-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                bar.remove();
              });
              return true;
            };
            if (_insertBar()) return;
            var _obs = new MutationObserver(function(mutations, obs) {
              if (_insertBar()) obs.disconnect();
            });
            _obs.observe(shadow, { childList: true, subtree: true });
          };
          var currentVersion = (_GM_info && _GM_info.script && _GM_info.script.version) || "0.0.0";
          GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://xs.openget.cn/scripts/version.json?t=' + Date.now(),
            onload: function(res) {
              try {
                var data = JSON.parse(res.responseText);
                var remote = data['xueshen-sc'];
                if (!remote) return;
                var rv = remote.version.split('.').map(Number);
                var lv = currentVersion.split('.').map(Number);
                var newer = false;
                for (var i = 0; i < Math.max(rv.length, lv.length); i++) {
                  var r = rv[i] || 0, l = lv[i] || 0;
                  if (r > l) { newer = true; break; }
                  if (r < l) break;
                }
                if (newer) _showUpdateBar(remote);
              } catch(e) {}
            },
            onerror: function() {}
          });
        })();
        // <<< FX-STRIP:auto-update
      }
    }, 100);
  }

})(Vue, antd, Pinia, marked, rxjs, md5, DOMPurify);
/* ==================== 景德镇艺术职业学院（o-learn.cn）课程助手 ==================== */
(function () {
  'use strict';
  if (!/o-learn\.cn$/i.test(location.hostname)) return;


    /* ======================== 配置 ======================== */
    const CONFIG = {
        defaultSpeed: 2,          // 默认倍速
        autoPlay: true,           // 默认开启自动播放
        autoMute: true,           // 默认静音播放（浏览器策略要求，播放后自动取消）
        autoNext: true,           // 视频结束自动进入下一节
        retryInterval: 3000,      // 定期扫描兜底间隔(ms)
        speedLockInterval: 1000,  // 倍速锁定间隔(ms)
        playRetryMax: 10,         // 自动播放最大重试次数
        playRetryDelay: 1000,     // 自动播放重试间隔(ms)
        quizInterval: 2000,       // 答题轮询间隔(ms)
        logMax: 200,              // 日志面板最大条数
        backendBase: 'https://xs.openget.cn',
    };

    /* ======================== 持久化存储 ======================== */
    const STORE_KEY = 'jdz-art-settings-v4';
    let store = {
        account: { username: '', token: '', scriptKey: '' },
        tasks: { exam: true, quiz: true, video: true },   // 任务开关：考试 / 答题 / 视频
        speed: CONFIG.defaultSpeed,
        autoPlay: CONFIG.autoPlay,
        autoMute: CONFIG.autoMute,
        autoNext: CONFIG.autoNext,
    };
    function loadStore() {
        try {
            const raw = GM_getValue(STORE_KEY, '');
            if (raw) store = Object.assign(store, JSON.parse(raw));
        } catch (e) { /* ignore */ }
    }
    function saveStore() {
        try { GM_setValue(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
    }

    /* ======================== 状态 ======================== */
    let state = {
        currentVideo: null,
        examStarted: false,
        examAnswered: false,
    };

    const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 8, 16];

    /* ======================== 日志 ======================== */
    const logStore = { list: [] };
    function log(...args) {
        const msg = args.map(a => {
            if (typeof a === 'string') return a;
            if (a instanceof Element) {
                const id = a.id ? `#${a.id}` : '';
                const cls = typeof a.className === 'string' && a.className.trim() ? `.${a.className.trim().split(/\s+/).join('.')}` : '';
                return `<${a.tagName.toLowerCase()}${id}${cls}>`;
            }
            if (a instanceof Error) return `${a.name}: ${a.message}`;
            if (a && typeof a === 'object') {
                const s = JSON.stringify(a);
                return s && s.length > 120 ? s.slice(0, 120) + '…' : s;
            }
            return String(a);
        }).join(' ');
        logStore.list.push({ time: new Date(), msg });
        if (logStore.list.length > CONFIG.logMax) logStore.list.shift();
        console.log('%c[景德镇艺术助手]', 'color:#4CAF50;font-weight:bold', msg);
        renderLogPanel();
    }

    /* ======================== 学习记录 ======================== */
    const RECORD_KEY = 'jdz-art-records';
    let records = [];
    function loadRecords() {
        try { records = JSON.parse(localStorage.getItem(RECORD_KEY)) || []; }
        catch (e) { records = []; }
    }
    function saveRecords() {
        try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); }
        catch (e) { /* ignore */ }
    }
    function getRecordKey(video) {
        return video.currentSrc || video.src || location.href;
    }
    function ensureRecord(video) {
        const key = getRecordKey(video);
        let rec = records.find(r => r.key === key);
        if (!rec) {
            rec = {
                key,
                title: document.title || key,
                firstTime: Date.now(),
                watched: 0,
                done: false,
                lastSeen: Date.now(),
            };
            records.unshift(rec);
            saveRecords();
        } else {
            rec.lastSeen = Date.now();
        }
        return rec;
    }
    function formatDuration(sec) {
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return h ? `${h}时${m}分` : m ? `${m}分${s}秒` : `${s}秒`;
    }
    function formatTime(ts) {
        const d = new Date(ts);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    function safeText(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ======================== 后端 API ======================== */
    function backendRequest(path, { method = 'GET', data = null, token = '' } = {}) {
        return new Promise((resolve) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            GM_xmlhttpRequest({
                url: CONFIG.backendBase + path,
                method,
                headers,
                data: data ? JSON.stringify(data) : undefined,
                timeout: 20000,
                onload: (res) => {
                    try { resolve(JSON.parse(res.responseText || '{}')); }
                    catch (e) { resolve({ code: 500, msg: '响应解析失败' }); }
                },
                onerror: () => resolve({ code: 500, msg: '无法连接本地后端' }),
                ontimeout: () => resolve({ code: 500, msg: '后端请求超时' }),
            });
        });
    }
    async function sha256Text(text) {
        const enc = new TextEncoder();
        const buf = await crypto.subtle.digest('SHA-256', enc.encode(text || ''));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    async function backendLogin(username, password) {
        const hash = await sha256Text(password);
        const res = await backendRequest('/api/auth/login', { method: 'POST', data: { username, password_hash: hash } });
        if (res.code !== 200 || !res.token) return { ok: false, msg: res.msg || '登录失败' };
        // 同步脚本密钥
        const keyRes = await backendRequest('/api/user/script-key', { token: res.token });
        if (keyRes.code === 200 && keyRes.script_key) {
            store.account = { username, token: res.token, scriptKey: keyRes.script_key };
            saveStore();
            return { ok: true, msg: '登录成功并已同步密钥', scriptKey: keyRes.script_key };
        }
        return { ok: false, msg: '登录成功但密钥获取失败，请到用户中心手动复制' };
    }
    async function backendProfile() {
        const token = store.account.scriptKey || store.account.token;
        if (!token) return null;
        const res = await backendRequest('/api/user/profile', { token });
        if (res.code === 200 && res.profile) return res.profile;
        return null;
    }
    async function refreshAccountBadge() {
        try {
            const prof = await backendProfile();
            if (prof) {
                store.account.profile = {
                    points_balance: prof.active_member ? null : Number(prof.points_balance || 0),
                    active_member: !!prof.active_member,
                    member_until: prof.member_until || '',
                };
                saveStore();
            }
        } catch (e) { /* ignore */ }
        if (loginStatusEl) updateLoginStatus();
    }
    function formatQuotaText() {
        const p = store.account.profile;
        if (!p) return '';
        if (p.active_member) return ` · 🎉包月不限题数`;
        if (p.points_balance === null || p.points_balance === undefined) return '';
        return ` · 剩余 ${p.points_balance} 题`;
    }
    function callAnswer(questionPayload, { u = '', skipBank = false } = {}) {
        return new Promise((resolve) => {
            const token = store.account.scriptKey || store.account.token || '';
            const data = 'question=' + encodeURIComponent(JSON.stringify(questionPayload))
                + '&u=' + encodeURIComponent(u)
                + '&model_mode=auto'
                + (skipBank ? '&skip_bank=1' : '');
            GM_xmlhttpRequest({
                url: CONFIG.backendBase + '/api/v1/cx?v=xs-5.0',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'Authorization': token ? 'Bearer ' + token : '',
                },
                data,
                timeout: 300000,
                onload: (res) => {
                    try {
                        const obj = JSON.parse(res.responseText || '{}');
                        if (obj.code === 200 && obj.data) {
                            // 同步权益信息（剩余题数 / 包月状态），无需额外请求
                            if (obj.data.remainCount !== undefined || obj.data.profile) {
                                const prof = obj.data.profile || {};
                                const isActive = !!(prof.active_member !== undefined ? prof.active_member : store.account.profile && store.account.profile.active_member);
                                store.account.profile = {
                                    points_balance: isActive ? null : Number(prof.points_balance !== undefined ? prof.points_balance : obj.data.remainCount),
                                    active_member: isActive,
                                    member_until: prof.member_until || (store.account.profile && store.account.profile.member_until) || '',
                                };
                                saveStore();
                                if (loginStatusEl) updateLoginStatus();
                            }
                            resolve({ ok: true, data: obj.data, msg: obj.msg || (obj.data.bank ? '题库命中' : obj.data.cache ? '缓存命中' : 'AI回答') });
                        } else if (res.status === 401 || obj.code === 401) {
                            resolve({ ok: false, msg: '登录态失效，请重新登录用户中心' });
                        } else {
                            resolve({ ok: false, msg: obj.msg || '未命中' });
                        }
                    } catch (e) {
                        resolve({ ok: false, msg: '响应解析失败' });
                    }
                },
                onerror: () => resolve({ ok: false, msg: '无法连接后端' }),
                ontimeout: () => resolve({ ok: false, msg: '后端请求超时' }),
            });
        });
    }

    /* ======================== 图片转 base64 ======================== */
    function downloadImageAsDataURL(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                url,
                method: 'GET',
                responseType: 'arraybuffer',
                timeout: 30000,
                onload: (res) => {
                    try {
                        const bytes = new Uint8Array(res.response);
                        let binary = '';
                        const chunk = 0x8000;
                        for (let i = 0; i < bytes.length; i += chunk) {
                            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
                        }
                        const type = (res.responseHeaders.match(/content-type:\s*([^\s;\r\n]+)/i) || [])[1] || 'image/jpeg';
                        resolve('data:' + type + ';base64,' + btoa(binary));
                    } catch (e) {
                        resolve(null);
                    }
                },
                onerror: () => resolve(null),
                ontimeout: () => resolve(null),
            });
        });
    }

    /* ======================== 倍速控制 ======================== */
    function applySpeed(video, rate) {
        if (!video) return;
        try {
            if (video.__rateHijacked) restorePlaybackRate(video);
            video.playbackRate = rate;
            video.defaultPlaybackRate = rate;
        } catch (e) { /* ignore */ }
        hijackPlaybackRate(video);
        if (video.__vjsPlayer) {
            try { video.__vjsPlayer.playbackRate(rate); } catch (e) { /* ignore */ }
        }
    }

    let speedLockTimer = null;
    function startSpeedLock(video) {
        stopSpeedLock();
        speedLockTimer = setInterval(() => {
            if (!video || !state.currentVideo) return;
            try {
                if (video.playbackRate !== Number(store.speed)) {
                    video.__realRate = store.speed;
                    video.defaultPlaybackRate = store.speed;
                    try { video.playbackRate = store.speed; } catch (e) {}
                }
            } catch (e) { /* ignore */ }
        }, CONFIG.speedLockInterval);
    }
    function stopSpeedLock() {
        if (speedLockTimer) { clearInterval(speedLockTimer); speedLockTimer = null; }
    }

    function hijackPlaybackRate(video) {
        if (video.__rateHijacked) return;
        video.__realRate = Number(store.speed);
        try {
            let proto = Object.getPrototypeOf(video), desc;
            while (proto && !desc) {
                desc = Object.getOwnPropertyDescriptor(proto, 'playbackRate');
                proto = Object.getPrototypeOf(proto);
            }
            if (!desc || !desc.get || !desc.set) return;
            Object.defineProperty(video, 'playbackRate', {
                configurable: true,
                get: function () { return desc.get.call(video); },
                set: function (v) {
                    const numV = Number(v);
                    if (isNaN(numV)) return;
                    if (numV !== store.speed) {
                        log('🛡️ 网页想修改倍速，已保持为', store.speed + 'x');
                        if (desc && desc.set) desc.set.call(video, store.speed);
                        video.__realRate = store.speed;
                        return;
                    }
                    if (desc && desc.set) desc.set.call(video, numV);
                    video.__realRate = numV;
                }
            });
            video.__rateHijacked = true;
        } catch (e) {
            video.__rateHijacked = false;
            log('⚠️ 倍速锁定遇到小问题，已自动改用备用方式', e);
        }
    }

    function restorePlaybackRate(video) {
        if (!video.__rateHijacked) return;
        try { delete video.playbackRate; } catch (e) { /* ignore */ }
        video.__rateHijacked = false;
    }

    /* ======================== 拦截 pause ======================== */
    function hijackPause(video) {
        if (video.__pauseHijacked) return;
        video.__pauseHijacked = true;
        const originalPause = video.pause.bind(video);
        video.__originalPause = originalPause;
        video.pause = function () {
            if (store.autoPlay && !video.ended && !video.__userPaused) {
                log('🛡️ 网页想暂停视频，已拦截，继续播放');
                return;
            }
            return originalPause();
        };
        video.addEventListener('click', () => {
            video.__userPaused = video.paused;
        });
    }

    /* ======================== 自动播放 ======================== */
    function autoPlayVideo(video, fromUserGesture) {
        if (!video || !store.autoPlay) return;
        let retryCount = 0;
        const allowSound = fromUserGesture || store.autoMute === false;
        function attemptPlay() {
            if (!store.autoPlay || !video || video.ended) return;
            if (retryCount >= CONFIG.playRetryMax) {
                log('⚠️ 自动播放多次失败，请在页面上手动点击一次播放按钮');
                statusEl && (statusEl.textContent = '请手动点击播放一次');
                return;
            }
            retryCount++;
            log(`▶️ 自动播放尝试 #${retryCount}（共 ${CONFIG.playRetryMax} 次）`);
            if (!video.src && !video.currentSrc) {
                log('⏳ 视频还在加载中，稍等一下...');
                return;
            }
            video.muted = !allowSound;
            video.volume = allowSound ? 1 : 0;
            const doPlay = (target) => {
                const p = target.play();
                return p || Promise.reject(new Error('no promise'));
            };
            doPlay(video)
                .then(() => {
                    log('✅ 自动播放成功' + (allowSound ? '(带声)' : '(静音)'));
                    setTimeout(() => {
                        if (allowSound) { video.muted = false; video.volume = 1; }
                    }, 500);
                    applySpeed(video, store.speed);
                    updateUI();
                })
                .catch((e) => {
                    log(`❌ 浏览器阻止了自动播放，正在尝试其他方式...`);
                    if (video.__vjsPlayer) {
                        try {
                            video.__vjsPlayer.play().then(() => {
                                log('✅ 自动播放成功' + (allowSound ? '(带声)' : '(静音)'));
                                applySpeed(video, store.speed);
                                updateUI();
                            }).catch(() => { fallbackMuted(); });
                            return;
                        } catch (err) { /* ignore */ }
                    }
                    fallbackMuted();
                });
            function fallbackMuted() {
                if (!allowSound) { setTimeout(attemptPlay, CONFIG.playRetryDelay); return; }
                video.muted = true;
                video.volume = 0;
                const p = (video.__vjsPlayer ? video.__vjsPlayer.play() : video.play());
                if (p && p.then) {
                    p.then(() => log('✅ 静音播放成功'))
                     .catch(() => { log('静音播放也失败，等待用户交互后重试'); setTimeout(attemptPlay, CONFIG.playRetryDelay); });
                } else {
                    setTimeout(attemptPlay, CONFIG.playRetryDelay);
                }
            }
        }
        const events = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'durationchange'];
        const handler = (e) => {
            if (store.autoPlay && video.paused) { log('▶️ 视频已就绪，自动开始播放'); attemptPlay(); }
        };
        events.forEach(evt => video.addEventListener(evt, handler));
        attemptPlay();
        const retryTimer = setInterval(() => {
            if (video.ended || !store.autoPlay) { clearInterval(retryTimer); return; }
            if (video.paused && video.readyState >= 2) { attemptPlay(); }
            else if (!video.paused) { clearInterval(retryTimer); }
        }, CONFIG.playRetryDelay);
    }

    /* ======================== 绑定视频 ======================== */
    function getVjsPlayer(video) {
        try {
            if (window.videojs) {
                const id = (video.id || '').replace(/_html5_api$/, '');
                if (window.videojs.getPlayer) {
                    const p = window.videojs.getPlayer(id);
                    if (p) return p;
                }
                const players = window.videojs.getAllPlayers ? window.videojs.getAllPlayers() : [];
                for (const p of players) {
                    try {
                        if (p.tech_ && p.tech_.el && p.tech_.el() === video) return p;
                        if (p.el && p.el() && p.el().contains(video)) return p;
                    } catch (e) { /* ignore */ }
                }
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function bindVideo(video) {
        if (video.__bound) return;
        video.__bound = true;
        state.currentVideo = video;
        video.__vjsPlayer = getVjsPlayer(video);
        video.__record = ensureRecord(video);
        log('🎬 发现视频，开始接管', video.__vjsPlayer ? '' : '', `时长=${video.duration ? formatDuration(video.duration) : '未知'}`);
        video.autoplay = true;
        video.preload = 'auto';
        hijackPause(video);
        hijackPlaybackRate(video);
        applySpeed(video, store.speed);
        startSpeedLock(video);
        if (store.autoPlay) autoPlayVideo(video);
        video.addEventListener('pause', () => {
            if (store.autoPlay && !video.ended && !video.__userPaused) {
                log('🔄 视频被暂停了，马上自动恢复播放');
                setTimeout(() => {
                    if (store.autoPlay && !video.ended) {
                        video.muted = true;
                        video.play().catch(() => {});
                    }
                }, 800);
            }
        });
        video.addEventListener('ended', () => {
            log('🏁 视频播放结束');
            if (video.__record) {
                video.__record.done = true;
                saveRecords();
                renderRecordPanel();
            }
            if (store.autoNext) gotoNextCourseware();
        });
        video.addEventListener('ratechange', () => {
            if (video.__realRate !== store.speed) {
                log('🔁 网页改了播放速度，已自动改回', store.speed + 'x');
                applySpeed(video, store.speed);
            }
        });
        updateUI();
    }

    /* ======================== 自动下一节 ======================== */
    function gotoNextCourseware() {
        log('🔜 视频播完了，正在自动进入下一节...');
        const nextTexts = ['下一节', '下一个', '下一页', '下一章', 'next', 'Next', '继续学习'];
        const allClickable = document.querySelectorAll('button, a, [role="button"], [class*="next"], [class*="Next"]');
        for (const btn of allClickable) {
            const text = (btn.textContent || '').trim();
            if (text && nextTexts.some(t => text.includes(t))) {
                log('📍 找到"下一节"按钮，自动点击:', text);
                btn.click();
                return;
            }
        }
        const outlineItems = document.querySelectorAll(
            '[class*="courseware"] li, [class*="chapter"] li, [class*="lesson"] li, [class*="catalog"] li, [class*="tree"] li, [class*="outline"] li, [class*="menu-item"], [class*="node"]'
        );
        let foundCurrent = false;
        for (const item of outlineItems) {
            if (foundCurrent) {
                log('📍 从课程目录中点击下一项:', item.textContent?.trim()?.substring(0, 20));
                item.click();
                return;
            }
            if (item.classList.contains('active') || item.classList.contains('current') ||
                item.getAttribute('aria-current') === 'page' ||
                item.querySelector('.active, .current, [class*="active"], [class*="current"]')) {
                foundCurrent = true;
            }
        }
        log('⌨️ 没找到"下一节"按钮，尝试用键盘切换');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }));
    }

    /* ======================== 考试自动答题 ======================== */
    const JUDGE_OPTIONS = { 0: '正确', 1: '错误' };

    function isExamPage() {
        return /examflow_index|examflow|examPaper|examQuestion/i.test(location.href)
            || !!document.getElementById('paperSheet')
            || !!document.querySelector('.exam_page, #examPage');
    }

    /* ---- 答案解析：把后端返回文本解析为 字母列表 或 判断题 目标值 ---- */
    function parseAnswerText(text, type) {
        text = String(text || '').trim();
        if (!text) return null;
        const isJudge = type === '判断题' || type === 'judge';
        if (isJudge) {
            const correct = /正确|true|对|yes|right|^1\b|^1$/.test(text);
            const wrong = /错误|false|错|no|^0\b|^0$/.test(text);
            const target = correct && !wrong ? '0' : wrong ? '1' : null;
            return target === null ? null : { judge: target };
        }
        if (text.startsWith('[')) {
            try {
                const arr = JSON.parse(text);
                if (Array.isArray(arr) && arr.length) {
                    const items = arr.map((x) => String(x).trim()).filter(Boolean);
                    const asLetters = items.filter((x) => /^[A-Z]$/i.test(x)).map((x) => x.toUpperCase());
                    if (asLetters.length === items.length) return { letters: asLetters };
                    return { texts: items };
                }
            } catch (_) {}
        }
        // 多选题/单选题：仅在整段是字母答案时提取，避免把 "DNA"/"Option A is correct" 误拆成字母
        const letterOnly = text.replace(/^(答案|正确答案|选择?)[是：:.\s]*/i, "").trim();
        const compact = letterOnly.replace(/[\s,，、;；|+/&和]+/g, "").toUpperCase();
        if (/^[A-H]{1,8}$/.test(compact)) {
            const unique = [];
            for (const l of compact) {
                if (!unique.includes(l)) unique.push(l);
            }
            return { letters: unique };
        }
        // 数字索引 1,2,3
        const nums = text.match(/\d+/g) || [];
        if (nums.length) return { letters: nums.map(n => String.fromCharCode(64 + parseInt(n, 10))) };
        return null;
    }

    /* ---- 双结构题目解析 ----
       结构A(纯文本): #qContent{N} > .divQuestionTitle .q-title-text + .questionOptions .q_option(input + .a11y-option)
       结构B(图片/旧): #paperSheet > .set-group > .set-item (.score + a.option / label.exam_radio + 题干图片)
    */
    function getExamQuestions() {
        const result = [];
        // 结构A：qContent{N}
        const qContents = document.querySelectorAll('.exam_page .q_content, #examPage .q_content, div.q_content[id^="qContent"]');
        if (qContents.length) {
            qContents.forEach(qc => {
                const idMatch = (qc.id || '').match(/qContent(\d+)/);
                const titleEl = qc.querySelector('.q-title-text');
                const title = titleEl ? (titleEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
                const qidInput = qc.querySelector('input[name="quesId"]');
                const qid = qidInput ? qidInput.value : '';
                const typeEl = qc.querySelector('.divQuestionTitle');
                const typeName = typeEl ? (typeEl.getAttribute('data-q-type-name') || '') : '';
                const hasCheckbox = !!qc.querySelector('input[type=checkbox]');
                const resolvedType = hasCheckbox || /多选|不定项|X型/.test(typeName) ? '多选题' : typeName;
                const opts = [];
                qc.querySelectorAll('.q_option').forEach(op => {
                    const input = op.querySelector('input[type=radio], input[type=checkbox]');
                    const clickable = op.querySelector('.a11y-option') || op.querySelector('.radio_off') || op.querySelector('.checkbox_off') || op;
                    const labelEl = clickable;
                    const labelText = (labelEl.textContent || '').replace(/\s+/g, ' ').trim();
                    const optLetter = clickable.getAttribute && (clickable.getAttribute('data-option-label') || '');
                    const inputVal = input ? input.value : '';
                    const checked = input ? !!input.checked : false;
                    const img = op.querySelector && op.querySelector("img");
                    const imgSrc = img ? (img.getAttribute("data-src") || img.currentSrc || img.src || "") : "";
                    const finalText = labelText || (imgSrc ? `<img src="${imgSrc}"/>` : "");
                    opts.push({ text: finalText, el: clickable, input, value: inputVal, letter: optLetter, checked });
                });
                const imgs = Array.from(qc.querySelectorAll('img'));
                const imgSrcs = imgs.map(img => img.src || img.getAttribute('data-src') || '').filter(Boolean);
                if (idMatch) {
                    result.push({
                        num: parseInt(idMatch[1], 10),
                        type: resolvedType,
                        title,
                        qid,
                        opts,
                        judges: typeName === '判断题' ? opts.map((o, i) => ({ value: o.value, text: o.text, el: o.el })) : [],
                        stemText: title,
                        imgSrcs,
                        el: qc,
                        mode: 'A',
                        isJudge: typeName === '判断题',
                    });
                }
            });
            if (result.length) return result;
        }
        // 结构B：paperSheet set-item
        const sheet = document.getElementById('paperSheet');
        if (!sheet) return [];
        const items = sheet.querySelectorAll('.set-item');
        items.forEach((item, i) => {
            const scoreEl = item.querySelector('.score');
            const numMatch = scoreEl ? (scoreEl.textContent || '').match(/(\d+)/) : null;
            if (!numMatch) return;
            const num = parseInt(numMatch[1], 10);
            const opts = [];
            item.querySelectorAll('a.option').forEach(o => {
                opts.push({
                    text: (o.textContent || '').trim(),
                    el: o,
                    letter: (o.getAttribute('data-option-label') || (o.textContent || '').trim()).toUpperCase(),
                    checked: /r_on|selected|checked/.test(o.className || '')
                });
            });
            const checkboxEls = item.querySelectorAll('input[type=checkbox], label.exam_checkbox');
            checkboxEls.forEach(el => {
                const input = el.tagName === 'INPUT' ? el : el.querySelector('input[type=checkbox]');
                const label = el.tagName === 'LABEL' ? el : (el.closest('label') || el);
                const text = (label.textContent || '').replace(/\s+/g, ' ').trim();
                if (!text || opts.some(o => o.text === text)) return;
                opts.push({
                    text,
                    el: label,
                    input,
                    letter: ((label.getAttribute && label.getAttribute('data-option-label')) || (text.match(/^[A-Z]/i) || [''])[0]).toUpperCase(),
                    checked: !!(input && input.checked)
                });
            });
            const radioEls = item.querySelectorAll('label.exam_radio');
            const judges = [];
            radioEls.forEach(label => {
                const input = label.querySelector('input[type=radio]');
                judges.push({ value: input ? input.value : '', text: (label.textContent || '').trim(), el: label });
            });
            const stemEl = item.querySelector('.stem, [class*="stem"], .fl, .question-content, [class*="question"]');
            const stemText = stemEl ? (stemEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
            const imgs = item.querySelectorAll('img');
            const imgSrcs = Array.from(imgs).map(img => img.src || img.getAttribute('data-src') || '').filter(Boolean);
            const headText = ((scoreEl && scoreEl.textContent) || '') + (item.getAttribute('data-q-type-name') || '');
            const isMulti = checkboxEls.length > 0 || /多选题|多项选择|不定项|X型/.test(headText) || /多选题|多项选择/.test((item.textContent || '').slice(0, 120));
            result.push({ num, opts, judges, stemText, imgSrcs, el: item, mode: 'B', isJudge: judges.length > 0 && !opts.length, type: judges.length && !opts.length ? '判断题' : (isMulti ? '多选题' : (opts.length ? '单选题' : '')) });
        });
        return result;
    }

    /* ---- 选项文本匹配：模型可能直接返回选项内容（如"发展"）而非字母 ---- */
    function matchOptionTextToLetters(q, answer) {
        const clean = (s) => String(s || '')
            .replace(/^[A-F][、.．)）:：]\s*/i, '')
            .replace(/^答案[:：]\s*/i, '')
            .replace(/^选项[:：]\s*/i, '')
            .replace(/\s+/g, '').trim();
        const ans = clean(answer).toLowerCase();
        const answerImgs = collectImgSrcs(answer);
        if (!ans && !answerImgs.length) return [];
        const hasCheckbox = (q.opts || []).some(o => o.input && o.input.type === 'checkbox');
        const isSingle = !hasCheckbox && !/多选/.test(q.type || '');
        const found = [];
        q.opts.forEach((o, idx) => {
            const optText = clean(o.text || o.textContent || '').toLowerCase();
            const letter = o.letter ? o.letter.toUpperCase() : String.fromCharCode(65 + idx);
            let hit = false;
            if (ans && optText) {
              hit = optText === ans || optText.includes(ans) || (ans.length >= 2 && ans.includes(optText));
            }
            if (!hit && answerImgs.length) {
              hit = imgSrcsMatch(answerImgs, collectImgSrcs(o.el).concat(collectImgSrcs(o.text)));
            }
            if (hit && !found.includes(letter)) found.push(letter);
        });
        return isSingle ? found.slice(0, 1) : found;
    }

    /* ---- 单题填答：兼容两套结构 ---- */
    function fillExamAnswer(q, answer) {
        const parsed = parseAnswerText(answer, q.type);
        // 判断题
        if (q.isJudge) {
            let targetValue = parsed ? parsed.judge : null;
            // 模型可能返回字母（A=正确/第一个选项，B=错误/第二个选项），按选项顺序映射
            if (targetValue === null) {
                const letterMatch = String(answer || '').match(/\b([A-F])\b/i);
                if (letterMatch) {
                    const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
                    const list = q.mode === 'A' ? q.opts : q.judges;
                    if (list && list[idx] !== undefined) targetValue = String(list[idx].value);
                }
            }
            if (targetValue === null) return false;
            if (q.mode === 'A') {
                // 结构A: 通过全局 renderCheckboxOrRadioByLabel(num, qid, idx) 或点击
                let clicked = false;
                q.opts.forEach((o, idx) => {
                    if (String(o.value) === targetValue && !o.input.checked) {
                        const fn = window.renderCheckboxOrRadioByLabel;
                        if (typeof fn === 'function') {
                            try { fn(String(q.num), q.qid, String(idx)); clicked = true; } catch (e) {}
                        } else {
                            o.el.click();
                            clicked = true;
                        }
                    }
                });
                return clicked;
            }
            // 结构B
            for (const j of q.judges) {
                if (String(j.value) === targetValue) {
                    j.el.classList.add('r_on');
                    if (typeof renderCheckboxOrRadio === 'function') {
                        try { renderCheckboxOrRadio(q.num, q.el.querySelector('.wrap') ? q.el.querySelector('.wrap').id : '', JSON.stringify(targetValue)); } catch (e) {}
                    }
                    const input = j.el.querySelector('input[type=radio]');
                    if (input) input.checked = true;
                    return true;
                }
            }
            return false;
        }
        // 选择题（单选/多选）
        let letters = parsed ? (parsed.letters || []) : [];
        if (!letters.length && parsed && parsed.texts && parsed.texts.length) {
            parsed.texts.forEach((t) => {
                matchOptionTextToLetters(q, t).forEach((l) => {
                    if (!letters.includes(l)) letters.push(l);
                });
            });
        }
        // 答案没含字母时，尝试按选项文本匹配（模型可能直接返回选项内容）
        if (!letters.length) {
            letters = matchOptionTextToLetters(q, answer);
        }
        if (!letters.length) return false;
        let clicked = 0;
        q.opts.forEach((o, idx) => {
            // 计算该选项对应的字母（数据里可能已有 letter，否则用索引）
            const letter = o.letter ? o.letter.toUpperCase() : String.fromCharCode(65 + idx);
            const want = letters.includes(letter);
            if (want && !o.checked) {
                if (q.mode === 'A' && typeof window.renderCheckboxOrRadioByLabel === 'function') {
                    try { window.renderCheckboxOrRadioByLabel(String(q.num), q.qid, String(idx)); clicked++; } catch (e) {}
                } else {
                    o.el.click();
                    clicked++;
                }
            }
        });
        return clicked > 0;
    }

    function formatAnswerForLog(raw) {
        // 清理答案文本：只保留有效字母（或 正确/错误），去掉 "答案：" 等前缀
        const s = String(raw || '').trim();
        if (!s) return '';
        const judge = s.match(/正确|错误|对|错/);
        if (judge) return judge[0];
        const letters = s.match(/[A-F]/gi);
        if (letters && letters.length) return letters.map(l => l.toUpperCase()).join('');
        return s.slice(0, 20);
    }

    function formatModelForLog(model) {
        const m = String(model || '');
        if (!m) return '';
        // 去掉厂商前缀 tencent/ qwen/ deepseek/ 等，只留模型名
        const seg = m.split('/').pop();
        return seg.slice(0, 24);
    }

    async function answerExamQuestion(q, index, extra = {}) {
        const hasCheckbox = (q.opts || []).some(o => o.input && o.input.type === 'checkbox');
        let payload = { question: q.stemText || q.title, type: q.type || (q.isJudge ? 'judge' : (hasCheckbox ? 'multiple' : 'single')) };
        if (/多选|不定项|X型/.test(payload.type) || hasCheckbox) payload.type = 'multiple';
        else if (/单选/.test(payload.type)) payload.type = 'single';
        else if (/判断/.test(payload.type)) payload.type = 'judge';
        if (q.opts.length) payload.options = q.opts.map(o => o.text);
        // 图片题：下载图片
        const dataURLs = [];
        for (const src of q.imgSrcs) {
            const dataUrl = await downloadImageAsDataURL(src);
            if (dataUrl) dataURLs.push(dataUrl);
        }
        if (dataURLs.length) payload.images = dataURLs;
        if (!q.stemText && !dataURLs.length) return { ok: false, msg: '题目为空' };
        log(`📝 [${q.num}题] 调后端获取答案...`);
        let res = await callAnswer(payload, { u: store.account.username || '', skipBank: !!extra.skipBank });
        // 超时/网络失败时自动重试一次（后端冷却机制会让下一次换模型）
        if (!res.ok && /超时|无法连接|未命中|响应解析/.test(res.msg || '')) {
            log(`⚠️ [${q.num}题] ${res.msg}，3秒后自动重试...`);
            await new Promise(r => setTimeout(r, 3000));
            res = await callAnswer(payload, { u: store.account.username || '', skipBank: !!extra.skipBank });
            if (res.ok) log(`✅ [${q.num}题] 重试成功`);
        }
        if (!res.ok) return res;
        return {
            ok: true,
            answer: res.data.answer,
            model: res.data.model,
            msg: res.msg || '',
            src: res.data.bank ? 'bank' : res.data.cache ? 'cache' : 'ai'
        };
    }

    /* ---- 一卷一报：本场答题小结 ----
       这里读不到主脚本的 pinia / 日志队列，所以自带一份，走同一个 /api/script-logs。
       字段口径与主脚本的 buildAnswerSummary 保持一致，后台按这两个拼一起统计。 */
    async function reportAnswerSummary(rows) {
        try {
            const list = rows || [];
            if (!list.length) return false;
            const token = store.account.scriptKey || store.account.token;
            if (!token) return false;
            let filled = 0;
            let skippedQuota = 0;
            const src = { bank: 0, cache: 0, ai: 0, unknown: 0 };
            const unanswered = [];
            const isQuota = (msg) => /余额不足|题数不足|点数不足|insufficient.?quota|请到用户中心购买|请联系您的服务方/i.test(String(msg || ''));
            for (const row of list) {
                if (row.ok) {
                    filled += 1;
                    if (row.src === 'bank' || row.src === 'cache' || row.src === 'ai') src[row.src] += 1;
                    else src.unknown += 1;
                    continue;
                }
                if (isQuota(row.reason) || Number(row.code) === 402) {
                    skippedQuota += 1;
                    continue;
                }
                // 指纹逐题 await 一次 sha256，而后台只吃前 40 条：到量就停，
                // 别让一场全卡住的整卷在答完之后再排几百次哈希。total/filled 另算，不受影响。
                if (unanswered.length >= 40) continue;
                unanswered.push({
                    type: String(row.type || '').slice(0, 20),
                    hash: await sha256Text(JSON.stringify({ title: row.title || '', type: row.type || '' })).catch(() => ''),
                    code: Number(row.code) || 0,
                    reason: String(row.reason || (Number(row.code) === 0 ? '答案拿到了但没点上去' : '')).slice(0, 80),
                    title: String(row.title || '').replace(/\s+/g, ' ').trim().slice(0, 60)
                });
            }
            const total = list.length - skippedQuota;
            if (!total) return false;
            const version = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '';
            const res = await backendRequest('/api/script-logs', {
                method: 'POST',
                token,
                data: {
                    logs: [{
                        event_type: 'answer_summary',
                        level: 'info',
                        message: `[答题小结] olearn 共${total}题 填上${filled}题`.slice(0, 4000),
                        page_url: location.href,
                        extra: {
                            platform: 'olearn',
                            time: new Date().toTimeString().slice(0, 8),
                            script_version: version,
                            total,
                            filled,
                            unfilled: Math.max(0, total - filled),
                            src,
                            unanswered: unanswered.slice(0, 40),
                            accuracy: Math.round(filled / Math.max(total, 1) * 1000) / 10,
                            threshold: 0,
                            // 平台交卷后不回吐分数，判对率采不到；留 null，后台也不显示分数
                            score: null
                        },
                        timestamp: Date.now()
                    }]
                }
            });
            return !!(res && res.code === 200);
        } catch (e) {
            return false;
        }
    }

    /* ---- 整页图片试卷模式 ----
       试卷题干是整页大图（#docImagesViewArea 下 .cont > img），一张图含多道题。
       逐张图调用后端视觉模型，返回 JSON: [{"num":1,"answer":"A"}, ...]，再逐题填答。
       扣点按实际 API 调用次数（每张图一次调用扣1点，包月不扣）。
    */
    function extractImagePages() {
        const area = document.getElementById('docImagesViewArea');
        if (!area) return [];
        const srcs = [];
        area.querySelectorAll('img').forEach(img => {
            const s = img.src || img.getAttribute('data-src') || '';
            if (s && /(\.jpe?g|\.png|\.gif|\.webp)(\?|$)/i.test(s)) srcs.push(s);
        });
        // 若 docImagesViewArea 为空，退回找页面里非主题的整页大图
        if (!srcs.length) {
            document.querySelectorAll('img').forEach(img => {
                const s = img.src || '';
                if (s && /preview-office-convert|resourcePath|upload/.test(s) && img.naturalWidth > 300) srcs.push(s);
            });
        }
        return srcs;
    }

    function parseImagePageAnswers(text) {
        // 兼容: [{"num":1,"answer":"A"},...] / {1:"A",...} / 逐行 "1.A"
        const raw = String(text || '').trim();
        if (!raw) return null;
        try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                const map = {};
                arr.forEach(item => {
                    const num = parseInt(item.num !== undefined ? item.num : item.index, 10);
                    if (num && item.answer !== undefined) map[num] = String(item.answer).trim();
                });
                return map;
            }
            if (typeof arr === 'object') {
                const map = {};
                Object.keys(arr).forEach(k => {
                    const num = parseInt(k, 10);
                    if (num) map[num] = String(arr[k]).trim();
                });
                return map;
            }
        } catch (e) { /* not pure json */ }
        const map = {};
        // 兼容 "1.A 2.B 3.C" 或 "1、A" 等
        const re = /(\d{1,3})\s*[.、:：)）]\s*([A-F]+|正确|错误)/gi;
        let m;
        while ((m = re.exec(raw))) map[parseInt(m[1], 10)] = m[2].toUpperCase();
        return Object.keys(map).length ? map : null;
    }

    async function answerImagePages() {
        const pages = extractImagePages();
        if (!pages.length) return false;
        log(`🖼️ 检测到整页图片型试卷，共 ${pages.length} 张整页图，开始识别...`);
        // 等待 set-item 渲染（填答需要）
        let items = [];
        for (let i = 0; i < 10; i++) {
            items = getExamQuestions();
            if (items.length) break;
            await new Promise(r => setTimeout(r, 1000));
        }
        if (!items.length) {
            log('⚠️ 图片已找到但题目选项未渲染');
            reportAnswerSummary(pages.map((s, i) => ({ ok: false, type: '整页图片', title: '第' + (i + 1) + '张', reason: '选项未渲染' })));
            return false;
        }
        const byNum = {};
        items.forEach(q => { byNum[q.num] = q; });
        let filledCount = 0;
        const summaryRows = [];
        for (let p = 0; p < pages.length; p++) {
            log(`🖼️ [第${p + 1}/${pages.length}张图] 下载并识别...`);
            const dataUrl = await downloadImageAsDataURL(pages[p]);
            if (!dataUrl) { log(`❌ 第${p + 1}张图下载失败`); summaryRows.push({ ok: false, type: '整页图片', title: '第' + (p + 1) + '张', reason: '图片下载失败' }); continue; }
            const payload = {
                question: '请识别这张试卷图片中的全部题目（题干、选项），并按题号逐题给出答案。只输出 JSON 数组，格式：[{"num":1,"answer":"A"},{"num":2,"answer":"B,C"},...]。判断题用"正确"或"错误"。不要输出其他任何内容。',
                images: [dataUrl],
                type: 'image',
                platform: 'jdz-exam-image',
                refer: location.href,
            };
            const res = await callAnswer(payload, { u: store.account.username || '' });
            if (!res.ok) { log(`❌ 第${p + 1}张图识别失败: ${res.msg}`); summaryRows.push({ ok: false, type: '整页图片', title: '第' + (p + 1) + '张', reason: res.msg }); continue; }
            const answers = parseImagePageAnswers(res.data.answer);
            if (!answers) { log(`⚠️ 第${p + 1}张图返回无法解析: ${String(res.data.answer).slice(0, 120)}`); summaryRows.push({ ok: false, type: '整页图片', title: '第' + (p + 1) + '张', reason: '模型返回无法解析' }); continue; }
            const nums = Object.keys(answers).map(Number);
            log(`✅ 第${p + 1}张图识别出 ${nums.length} 题答案 (${res.msg})`);
            for (const num of nums) {
                const q = byNum[num];
                if (!q) { log(`⚠️ 题${num}未在页面中找到选项，跳过`); continue; }
                const ok = fillExamAnswer(q, answers[num]);
                if (ok) filledCount++;
                summaryRows.push({ ok, src: 'ai', type: q.type, title: q.stemText || q.title });
                log(`${ok ? '✅' : '⚠️'} [${num}题] ${ok ? '已填写' : '未能填写'} 答案=${formatAnswerForLog(answers[num]) || answers[num]}`);
                await new Promise(r => setTimeout(r, 800));
            }
            await new Promise(r => setTimeout(r, 1500));
        }
        reportAnswerSummary(summaryRows);
        log(`🏁 整页图片答题完成，共填写 ${filledCount} 题`);
        return filledCount > 0;
    }

    async function runExamAutoAnswer() {
        if (state.examStarted) return;
        state.examStarted = true;
        log('📖 检测到考试页面，开始自动答题');
        // 整页图片型试卷优先处理
        if (extractImagePages().length) {
            const ok = await answerImagePages();
            state.examStarted = false;
            if (ok && store.tasks.examAutoSubmit) {
                setTimeout(() => { trySubmitExam(); }, 2000);
            }
            return;
        }
        // 等待题目渲染
        for (let i = 0; i < 10; i++) {
            const qs = getExamQuestions();
            if (qs.length >= 1) break;
            await new Promise(r => setTimeout(r, 1000));
        }
        const questions = getExamQuestions();
        if (!questions.length) {
            log('⚠️ 未解析到题目，可能是整页图片型试卷，跳过');
            state.examStarted = false;
            return;
        }
        log(`🔍 解析到 ${questions.length} 道题 (${questions[0].mode === 'A' ? '文本结构' : '图片结构'})`);
        const summaryRows = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const answered = q.mode === 'B'
                ? (q.isJudge ? q.judges.some(j => j.el && /r_on|selected|checked/.test(j.el.className || '')) : q.opts.some(o => o.checked || (o.el && /r_on|selected|checked/.test(o.el.className || ''))))
                : q.opts.some(o => o.checked);
            if (answered) continue;
            let res = await answerExamQuestion(q, i);
            if (!res.ok) {
                log(`❌ [${q.num}题] 获取失败: ${res.msg}`);
                summaryRows.push({ ok: false, type: q.type, title: q.stemText || q.title, reason: res.msg });
                continue;
            }
            let ok = fillExamAnswer(q, res.answer);
            if (!ok) {
                log(`⚠️ [${q.num}题] 题库答案未能填写，改走模型`);
                const res2 = await answerExamQuestion(q, i, { skipBank: true });
                if (res2.ok) {
                    res = res2;
                    ok = fillExamAnswer(q, res.answer);
                }
            }
            summaryRows.push({ ok, src: res.src, type: q.type, title: q.stemText || q.title });
            const ansShow = formatAnswerForLog(res.answer);
            const hit = res.msg && /命中/.test(res.msg) ? ` ${res.msg}` : '';
            log(`${ok ? '✅' : '⚠️'} [${q.num}题] ${ok ? '已填写' : '未能填写'} 答案=${ansShow || '?'}${hit}`);
            await new Promise(r => setTimeout(r, 1500));
        }
        reportAnswerSummary(summaryRows);
        state.examStarted = false;
        log('🏁 考试自动答题完成');
        if (store.tasks.examAutoSubmit) {
            setTimeout(() => { trySubmitExam(); }, 2000);
        }
    }

    function trySubmitExam() {
        const links = document.querySelectorAll('a, button');
        for (const el of links) {
            const t = (el.textContent || '').trim();
            if (t === '交卷') {
                log('📤 自动点击交卷');
                el.click();
                setTimeout(() => {
                    document.querySelectorAll('button').forEach(b => {
                        const bt = (b.textContent || '').trim();
                        if (bt === '交卷') b.click();
                    });
                }, 1000);
                return;
            }
        }
    }

    function setupExamWatcher() {
        setInterval(() => {
            if (!store.tasks.exam) return;
            if (isExamPage() && !state.examStarted) {
                runExamAutoAnswer();
            }
        }, 3000);
    }

    /* ======================== 作业/测验自动答题 ======================== */
    function extractWorkQuestions() {
        // 通用提取：页面上可见的题目容器
        const selectors = [
            '[class*="question"]', '[class*="exam"]', '[class*="work"]', '[class*="quiz"]',
            '.set-item', '[class*="stem"]'
        ];
        const seen = new Set();
        const questions = [];
        document.querySelectorAll(selectors.join(',')).forEach(el => {
            if (seen.has(el)) return;
            seen.add(el);
            const text = (el.textContent || '').trim();
            if (text.length < 4) return;
            // 选项
            const opts = [];
            el.querySelectorAll('input[type=radio], input[type=checkbox]').forEach(inp => {
                const label = inp.closest('label');
                const optText = label ? (label.textContent || '').replace(/\s+/g, ' ').trim() : '';
                if (optText) opts.push({ text: optText, el: label || inp, input: inp });
            });
            questions.push({ el, text, opts });
        });
        return questions;
    }

    async function runWorkAutoAnswer() {
        const questions = extractWorkQuestions();
        if (!questions.length) return;
        log(`📝 检测到作业/测验 ${questions.length} 个题目容器`);
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const opts = q.opts;
            if (!opts.length) continue;
            const already = opts.some(o => o.input && o.input.checked);
            if (already) continue;
            const hasCheckbox = opts.some(o => o.input && o.input.type === 'checkbox');
            log(`📝 作业第${i + 1}题 调后端...`);
            const payload = { question: q.text.slice(0, 300), options: opts.map(o => o.text), type: hasCheckbox ? 'multiple' : 'single' };
            const res = await callAnswer(payload, { u: store.account.username || '' });
            if (!res.ok) { log(`❌ 作业第${i + 1}题失败: ${res.msg}`); continue; }
            const raw = String(res.data.answer || '').trim();
            let targets = [];
            if (raw.startsWith('[')) {
                try {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) targets = arr.map((x) => String(x).trim()).filter(Boolean);
                } catch (_) {}
            }
            if (!targets.length) {
                const letters = raw.match(/[A-Z]/gi) || [];
                letters.forEach((l) => {
                    const u = l.toUpperCase();
                    if (!targets.includes(u)) targets.push(u);
                });
            }
            let clicked = 0;
            opts.forEach((o, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const optText = (o.text || '').replace(/\s+/g, '');
                const hit = targets.some((t) => {
                    const tt = String(t).replace(/\s+/g, '');
                    return t.toUpperCase() === letter || optText === tt || (tt.length >= 2 && (optText.includes(tt) || tt.includes(optText)));
                });
                if (hit && o.input && !o.input.checked) {
                    o.el.click();
                    clicked++;
                }
            });
            log(`${clicked ? '✅' : '⚠️'} 作业第${i + 1}题 已处理 (${res.msg})`);
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    function setupWorkWatcher() {
        setInterval(() => {
            if (!store.tasks.quiz) return;
            if (/work|homework|quiz|test|作业|测验/.test(location.href)) {
                runWorkAutoAnswer();
            }
        }, 5000);
    }

    /* ======================== 视频检测（含 Shadow DOM） ======================== */
    function findVideosInShadow(root) {
        const results = [];
        try {
            root.querySelectorAll('video').forEach(v => results.push(v));
            root.querySelectorAll('*').forEach(el => {
                if (el.shadowRoot) {
                    el.shadowRoot.querySelectorAll('video').forEach(v => results.push(v));
                    findVideosInShadow(el.shadowRoot).forEach(v => results.push(v));
                }
            });
        } catch (e) { /* ignore */ }
        return results;
    }

    function scanForVideos() {
        if (!store.tasks.video) return;
        let videos = findVideosInShadow(document);
        document.querySelectorAll('iframe').forEach((iframe) => {
            try {
                const iframeVideos = findVideosInShadow(iframe.contentDocument);
                iframeVideos.forEach(v => { if (!videos.includes(v)) videos.push(v); });
            } catch (e) { /* 跨域 */ }
        });
        if (videos.length > 0) {
            videos.forEach(bindVideo);
            if (!state.currentVideo || !document.contains(state.currentVideo)) {
                state.currentVideo = videos[videos.length - 1];
            }
            updateUI();
        }
    }

    /* ======================== SPA 路由监听 ======================== */
    let lastUrl = location.href;
    function watchRouteChange() {
        const check = () => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                log('🔀 页面已切换，正在重新检测视频...');
                state.currentVideo = null;
                stopSpeedLock();
                setTimeout(scanForVideos, 1500);
                setTimeout(scanForVideos, 3000);
                setTimeout(scanForVideos, 5000);
            }
        };
        window.addEventListener('hashchange', check);
        window.addEventListener('popstate', check);
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = function (...args) {
            originalPushState.apply(this, args);
            setTimeout(check, 200);
        };
        history.replaceState = function (...args) {
            originalReplaceState.apply(this, args);
            setTimeout(check, 200);
        };
    }

    /* ======================== MutationObserver ======================== */
    function setupGlobalObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'VIDEO') {
                        bindVideo(node);
                    } else if (node.querySelector) {
                        try {
                            const vids = node.querySelectorAll('video');
                            vids.forEach(v => { if (!v.__bound) bindVideo(v); });
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        });
        const start = () => {
            observer.observe(document.documentElement, { childList: true, subtree: true });
            log('✅ 视频自动检测已开启，持续监测页面变化');
        };
        if (document.documentElement) start();
        else document.addEventListener('DOMContentLoaded', start);
    }

    /* ======================== Page Visibility ======================== */
    function setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && store.autoPlay && state.currentVideo) {
                if (state.currentVideo.paused && !state.currentVideo.ended) {
                    log('🔄 回到页面了，恢复播放');
                    state.currentVideo.__userPaused = false;
                    state.currentVideo.muted = true;
                    state.currentVideo.play().catch(() => {});
                }
            }
        });
    }

    /* ======================== 用户交互解锁 ======================== */
    function setupUserInteractionUnlock() {
        const unlock = () => {
            if (store.autoPlay && state.currentVideo && state.currentVideo.paused) {
                log('✅ 检测到你的操作，开始播放');
                state.currentVideo.play().catch(() => {});
            }
        };
        document.addEventListener('click', unlock, { once: false });
        document.addEventListener('keydown', unlock, { once: false });
    }

    /* ======================== UI ======================== */
    let panelEl = null;
    let speedDisplayEl = null;
    let statusEl = null;
    let homeTitleEl = null;
    let logListEl = null;
    let recordListEl = null;
    let activePage = 'home';
    let loginStatusEl = null;

    function switchPage(name) {
        activePage = name;
        document.querySelectorAll('.olvh-tab').forEach(t => t.classList.toggle('active', t.dataset.page === name));
        document.querySelectorAll('.olvh-page').forEach(p => p.classList.toggle('active', p.id === 'olvh-page-' + name));
    }

    function renderLogPanel() {
        if (!logListEl) return;
        if (!logStore.list.length) {
            logListEl.innerHTML = '<div class="olvh-empty">暂无日志</div>';
            return;
        }
        const html = logStore.list.slice().reverse().map(item => {
            const t = item.time;
            const ts = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
            return `<div class="olvh-log-item"><span class="t">${ts}</span>${safeText(item.msg)}</div>`;
        }).join('');
        logListEl.innerHTML = html;
        logListEl.scrollTop = 0;
    }

    function renderRecordPanel() {
        if (!recordListEl) return;
        if (!records.length) {
            recordListEl.innerHTML = '<div class="olvh-empty">暂无学习记录</div>';
            return;
        }
        const html = records.map(r => {
            const badge = r.done
                ? '<span class="rd done">已完成</span>'
                : '<span class="rd ing">学习中</span>';
            return `<div class="olvh-record-item">
                <div class="rt">${safeText(r.title)}</div>
                <div class="rs">${badge} · 已学 ${formatDuration(r.watched)} · ${formatTime(r.lastSeen)}</div>
            </div>`;
        }).join('');
        recordListEl.innerHTML = html;
    }

    function updateLoginStatus() {
        if (!loginStatusEl) return;
        if (store.account.scriptKey) {
            loginStatusEl.innerHTML = `✅ 已登录：<b>${safeText(store.account.username || '')}</b>${formatQuotaText()}`;
        } else if (store.account.token) {
            loginStatusEl.innerHTML = `✅ 已登录（未同步密钥）：<b>${safeText(store.account.username || '')}</b>`;
        } else {
            loginStatusEl.innerHTML = '❌ 未登录，请填写账号密码';
        }
    }

    function createPanel() {
        if (window.top !== window.self) return;
        if (document.getElementById('olvh-panel')) return;
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', createPanel);
            return;
        }

        panelEl = document.createElement('div');
        panelEl.id = 'olvh-panel';
        panelEl.innerHTML = `
            <style>
                #olvh-panel {
                    position: fixed; top: 80px; right: 20px; z-index: 999999;
                    font-family: -apple-system, "Microsoft YaHei", sans-serif; font-size: 13px;
                    width: 280px;
                }
                #olvh-header {
                    background: linear-gradient(135deg, #4CAF50, #2E7D32); color: #fff;
                    padding: 8px 12px; border-radius: 8px 8px 0 0; cursor: move;
                    display: flex; align-items: center; justify-content: space-between;
                    font-weight: 600; user-select: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                #olvh-header .title { font-size: 13px; }
                #olvh-toggle {
                    background: rgba(255,255,255,0.2); border: none; color: #fff;
                    width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
                    font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center;
                }
                #olvh-toggle:hover { background: rgba(255,255,255,0.35); }
                #olvh-body {
                    background: #fff; border: 1px solid #e0e0e0; border-top: none;
                    border-radius: 0 0 8px 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }
                #olvh-body.collapsed { display: none; }
                .olvh-tabs { display: flex; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
                .olvh-tab {
                    flex: 1; text-align: center; padding: 8px 0; cursor: pointer;
                    color: #666; font-size: 12px; border-bottom: 2px solid transparent; transition: all 0.15s;
                }
                .olvh-tab:hover { background: #e8f5e9; color: #2E7D32; }
                .olvh-tab.active { color: #4CAF50; font-weight: 700; border-bottom-color: #4CAF50; background: #fff; }
                .olvh-page { display: none; padding: 10px; max-height: 380px; overflow-y: auto; }
                .olvh-page.active { display: block; }
                .olvh-section { margin-bottom: 10px; }
                .olvh-section:last-child { margin-bottom: 0; }
                .olvh-label { color: #666; font-size: 11px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; }
                .olvh-speed-value { font-weight: 700; color: #4CAF50; font-size: 14px; }
                .olvh-speed-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
                .olvh-speed-btn {
                    padding: 5px 0; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;
                    cursor: pointer; text-align: center; font-size: 12px; color: #333; transition: all 0.15s;
                }
                .olvh-speed-btn:hover { background: #e8f5e9; border-color: #4CAF50; }
                .olvh-speed-btn.active { background: #4CAF50; color: #fff; border-color: #4CAF50; font-weight: 600; }
                .olvh-custom-speed { display: flex; gap: 4px; margin-top: 4px; }
                .olvh-custom-speed input { flex: 1; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; outline: none; width: 0; }
                .olvh-custom-speed input:focus { border-color: #4CAF50; }
                .olvh-custom-speed button { padding: 4px 10px; background: #4CAF50; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
                .olvh-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
                .olvh-toggle-row span { color: #555; }
                .olvh-switch { position: relative; width: 36px; height: 20px; background: #ccc; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
                .olvh-switch.on { background: #4CAF50; }
                .olvh-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: left 0.2s; }
                .olvh-switch.on::after { left: 18px; }
                .olvh-status { font-size: 11px; color: #999; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
                .olvh-status .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
                .olvh-status .dot.green { background: #4CAF50; }
                .olvh-status .dot.gray { background: #ccc; }
                .olvh-status .dot.red { background: #f44336; }
                .olvh-force-btn {
                    width: 100%; padding: 6px; margin-top: 6px; background: #ff9800; color: #fff;
                    border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;
                }
                .olvh-force-btn:hover { background: #f57c00; }
                .olvh-log-list { font-family: Consolas, Monaco, monospace; font-size: 11px; line-height: 1.6; color: #444; }
                .olvh-log-item { padding: 2px 0; border-bottom: 1px dashed #f0f0f0; word-break: break-all; }
                .olvh-log-item .t { color: #aaa; margin-right: 4px; }
                .olvh-record-item { padding: 6px 0; border-bottom: 1px dashed #f0f0f0; }
                .olvh-record-item .rt { font-size: 11px; color: #333; word-break: break-all; margin-bottom: 2px; }
                .olvh-record-item .rs { font-size: 11px; color: #999; }
                .olvh-record-item .rd { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 8px; color: #fff; }
                .olvh-record-item .rd.done { background: #4CAF50; }
                .olvh-record-item .rd.ing { background: #ff9800; }
                .olvh-hint { font-size: 11px; color: #999; margin-top: 6px; line-height: 1.5; }
                .olvh-empty { color: #bbb; font-size: 11px; text-align: center; padding: 12px 0; }
                .olvh-title-row { font-size: 11px; color: #333; word-break: break-all; margin-bottom: 6px; }
                .olvh-clear-btn { width: 100%; padding: 4px; margin-top: 6px; background: #eee; color: #666; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 11px; }
                .olvh-clear-btn:hover { background: #e0e0e0; }
                .olvh-login-box { border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; background: #fafafa; }
                .olvh-login-row { display: flex; gap: 4px; margin-bottom: 6px; }
                .olvh-login-row input { flex: 1; padding: 5px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; outline: none; min-width: 0; }
                .olvh-login-row input:focus { border-color: #4CAF50; }
                .olvh-login-btn { width: 100%; padding: 6px; background: #4CAF50; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
                .olvh-login-btn:hover { background: #388E3C; }
                .olvh-login-btn:disabled { background: #a5d6a7; cursor: not-allowed; }
                .olvh-login-status { font-size: 11px; margin-top: 6px; color: #999; word-break: break-all; }
                .olvh-logout-btn { width: 100%; padding: 4px; margin-top: 6px; background: #eee; color: #d32f2f; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 11px; }
                .olvh-logout-btn:hover { background: #f5e3e3; }
                .olvh-login-actions { display: flex; gap: 4px; margin-top: 6px; }
                .olvh-login-actions button { flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 11px; }
                .olvh-usercenter-btn { background: #e3f2fd; color: #1565c0; }
                .olvh-usercenter-btn:hover { background: #bbdefb; }
                .olvh-task-switch { border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; background: #fafafa; }
                .olvh-task-desc { font-size: 10px; color: #999; margin-top: 4px; }
            </style>
            <div id="olvh-header">
                <span class="title">🎨 景德镇艺术-学习助手</span>
                <button id="olvh-toggle">−</button>
            </div>
            <div id="olvh-body">
                <div class="olvh-tabs">
                    <div class="olvh-tab active" data-page="home">首页</div>
                    <div class="olvh-tab" data-page="quiz">答题</div>
                    <div class="olvh-tab" data-page="log">日志</div>
                    <div class="olvh-tab" data-page="record">记录</div>
                    <div class="olvh-tab" data-page="settings">设置</div>
                </div>
                <div class="olvh-page active" id="olvh-page-home">
                    <div class="olvh-section">
                        <div class="olvh-title-row">🔑 账号登录</div>
                        <div class="olvh-login-box">
                            <div class="olvh-login-row">
                                <input type="text" id="olvh-login-user" placeholder="用户名/邮箱">
                                <input type="password" id="olvh-login-pwd" placeholder="密码">
                            </div>
                            <button class="olvh-login-btn" id="olvh-login-btn">登录并同步密钥</button>
                            <div class="olvh-login-actions">
                                <button class="olvh-usercenter-btn" id="olvh-usercenter-btn">👤 用户中心</button>
                                <button class="olvh-logout-btn" id="olvh-logout-btn" style="${store.account.scriptKey ? '' : 'display:none'}">退出登录</button>
                            </div>
                            <div class="olvh-login-status" id="olvh-login-status">${store.account.scriptKey ? '已登录' : '未登录'}</div>
                        </div>
                        <div class="olvh-hint">登录后自动获取脚本密钥，用于云端AI答题。也支持用户名或邮箱登录。</div>
                    </div>
                    <div class="olvh-section">
                        <div class="olvh-title-row" id="olvh-home-title">尚未检测到视频</div>
                        <div class="olvh-status" id="olvh-status">
                            <span class="dot gray" id="olvh-status-dot"></span>
                            <span id="olvh-status-text">等待检测视频...</span>
                        </div>
                        <button class="olvh-force-btn" id="olvh-force-play">▶ 强制播放</button>
                    </div>
                </div>
                <div class="olvh-page" id="olvh-page-quiz">
                    <div class="olvh-section">
                        <div class="olvh-title-row">📋 自动任务</div>
                        <div class="olvh-task-switch">
                            <div class="olvh-toggle-row">
                                <span>📖 考试自动答题</span>
                                <div class="olvh-switch ${store.tasks.exam ? 'on' : ''}" id="olvh-task-exam"></div>
                            </div>
                            <div class="olvh-task-desc">进入考试页自动识别题目并填写答案</div>
                            <div class="olvh-toggle-row">
                                <span>📝 作业/测验自动答题</span>
                                <div class="olvh-switch ${store.tasks.quiz ? 'on' : ''}" id="olvh-task-quiz"></div>
                            </div>
                            <div class="olvh-task-desc">进入作业/测验页自动填写答案</div>
                            <div class="olvh-toggle-row">
                                <span>🎬 视频自动处理</span>
                                <div class="olvh-switch ${store.tasks.video ? 'on' : ''}" id="olvh-task-video"></div>
                            </div>
                            <div class="olvh-task-desc">自动播放、倍速、自动下一节</div>
                        </div>
                        <div class="olvh-hint">勾选的任务才会执行，未勾选则跳过。</div>
                    </div>
                </div>
                <div class="olvh-page" id="olvh-page-log">
                    <div class="olvh-section">
                        <div class="olvh-log-list" id="olvh-log-list"><div class="olvh-empty">暂无日志</div></div>
                        <button class="olvh-clear-btn" id="olvh-log-clear">清空日志</button>
                    </div>
                </div>
                <div class="olvh-page" id="olvh-page-record">
                    <div class="olvh-section">
                        <div id="olvh-record-list"><div class="olvh-empty">暂无学习记录</div></div>
                        <button class="olvh-clear-btn" id="olvh-record-clear">清空记录</button>
                    </div>
                </div>
                <div class="olvh-page" id="olvh-page-settings">
                    <div class="olvh-section">
                        <div class="olvh-label">
                            <span>视频倍数</span>
                            <span class="olvh-speed-value" id="olvh-speed-display">${store.speed}x</span>
                        </div>
                        <div class="olvh-speed-grid" id="olvh-speed-grid">
                            ${SPEED_PRESETS.map(s => `<div class="olvh-speed-btn ${s === store.speed ? 'active' : ''}" data-speed="${s}">${s}x</div>`).join('')}
                        </div>
                        <div class="olvh-custom-speed">
                            <input type="number" id="olvh-custom-input" placeholder="自定义" min="0.1" max="16" step="0.1">
                            <button id="olvh-custom-btn">设置</button>
                        </div>
                    </div>
                    <div class="olvh-section">
                        <div class="olvh-toggle-row">
                            <span>自动播放</span>
                            <div class="olvh-switch ${store.autoPlay ? 'on' : ''}" id="olvh-autoplay-switch"></div>
                        </div>
                        <div class="olvh-toggle-row">
                            <span>静音播放</span>
                            <div class="olvh-switch ${store.autoMute ? 'on' : ''}" id="olvh-mute-switch"></div>
                        </div>
                        <div class="olvh-toggle-row">
                            <span>自动下一节</span>
                            <div class="olvh-switch ${store.autoNext ? 'on' : ''}" id="olvh-autonext-switch"></div>
                        </div>
                        <div class="olvh-toggle-row">
                            <span>考试自动交卷</span>
                            <div class="olvh-switch ${store.tasks.examAutoSubmit ? 'on' : ''}" id="olvh-autosubmit-switch"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panelEl);

        speedDisplayEl = document.getElementById('olvh-speed-display');
        statusEl = document.getElementById('olvh-status-text');
        homeTitleEl = document.getElementById('olvh-home-title');
        logListEl = document.getElementById('olvh-log-list');
        recordListEl = document.getElementById('olvh-record-list');
        loginStatusEl = document.getElementById('olvh-login-status');

        bindUIEvents();
        makeDraggable();
        renderLogPanel();
        renderRecordPanel();
        updateLoginStatus();
    }

    function bindUIEvents() {
        const toggleBtn = document.getElementById('olvh-toggle');
        const body = document.getElementById('olvh-body');
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('collapsed');
            toggleBtn.textContent = body.classList.contains('collapsed') ? '+' : '−';
        });

        document.querySelectorAll('.olvh-tab').forEach(tab => {
            tab.addEventListener('click', () => switchPage(tab.dataset.page));
        });

        document.getElementById('olvh-speed-grid').addEventListener('click', (e) => {
            const btn = e.target.closest('.olvh-speed-btn');
            if (!btn) return;
            setSpeed(parseFloat(btn.dataset.speed));
        });

        const customInput = document.getElementById('olvh-custom-input');
        const customBtn = document.getElementById('olvh-custom-btn');
        const applyCustom = () => {
            const val = parseFloat(customInput.value);
            if (val > 0 && val <= 16) setSpeed(val);
            else { customInput.value = ''; customInput.placeholder = '0.1~16'; }
        };
        customBtn.addEventListener('click', applyCustom);
        customInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyCustom(); });

        // 登录
        const loginBtn = document.getElementById('olvh-login-btn');
        const userInput = document.getElementById('olvh-login-user');
        const pwdInput = document.getElementById('olvh-login-pwd');
        const doLogin = async () => {
            const u = userInput.value.trim();
            const p = pwdInput.value;
            if (!u || !p) { loginStatusEl.textContent = '请填写用户名和密码'; return; }
            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';
            const res = await backendLogin(u, p);
            loginStatusEl.textContent = res.msg;
            if (res.ok) {
                userInput.value = '';
                pwdInput.value = '';
                document.getElementById('olvh-logout-btn').style.display = '';
                updateLoginStatus();
                log('🔑', res.msg);
                refreshAccountBadge();
            }
            loginBtn.disabled = false;
            loginBtn.textContent = '登录并同步密钥';
        };
        loginBtn.addEventListener('click', doLogin);
        pwdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
        document.getElementById('olvh-usercenter-btn').addEventListener('click', () => {
            window.open(CONFIG.backendBase + '/user', '_blank');
        });
        document.getElementById('olvh-logout-btn').addEventListener('click', () => {
            store.account = { username: '', token: '', scriptKey: '' };
            saveStore();
            document.getElementById('olvh-logout-btn').style.display = 'none';
            updateLoginStatus();
            log('👋 已退出登录');
        });

        // 任务开关
        const bindSwitch = (id, key, logText) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', () => {
                store.tasks[key] = !store.tasks[key];
                el.classList.toggle('on', store.tasks[key]);
                saveStore();
                log(logText, store.tasks[key] ? '开启' : '关闭');
            });
        };
        bindSwitch('olvh-task-exam', 'exam', '考试自动答题');
        bindSwitch('olvh-task-quiz', 'quiz', '作业/测验自动答题');
        bindSwitch('olvh-task-video', 'video', '视频自动处理');

        document.getElementById('olvh-autoplay-switch').addEventListener('click', function () {
            store.autoPlay = !store.autoPlay;
            saveStore();
            this.classList.toggle('on', store.autoPlay);
            if (store.autoPlay && state.currentVideo) {
                state.currentVideo.__userPaused = false;
                autoPlayVideo(state.currentVideo);
            }
            log('自动播放:', store.autoPlay);
        });
        document.getElementById('olvh-mute-switch').addEventListener('click', function () {
            store.autoMute = !store.autoMute;
            saveStore();
            this.classList.toggle('on', store.autoMute);
            if (state.currentVideo) {
                state.currentVideo.muted = store.autoMute;
                state.currentVideo.volume = store.autoMute ? 0 : 1;
            }
            log('静音播放:', store.autoMute);
        });
        document.getElementById('olvh-autonext-switch').addEventListener('click', function () {
            store.autoNext = !store.autoNext;
            saveStore();
            this.classList.toggle('on', store.autoNext);
            log('自动下一节:', store.autoNext);
        });
        document.getElementById('olvh-autosubmit-switch').addEventListener('click', function () {
            store.tasks.examAutoSubmit = !store.tasks.examAutoSubmit;
            saveStore();
            this.classList.toggle('on', store.tasks.examAutoSubmit);
            log('考试自动交卷:', store.tasks.examAutoSubmit);
        });

        document.getElementById('olvh-log-clear').addEventListener('click', () => {
            logStore.list = [];
            renderLogPanel();
            log('日志已清空');
        });

        document.getElementById('olvh-record-clear').addEventListener('click', () => {
            records = [];
            saveRecords();
            renderRecordPanel();
            log('学习记录已清空');
        });

        document.getElementById('olvh-force-play').addEventListener('click', () => {
            log('手动触发强制播放');
            if (state.currentVideo) {
                const v = state.currentVideo;
                v.__userPaused = false;
                const wantSound = store.autoMute === false;
                v.muted = !wantSound;
                v.volume = wantSound ? 1 : 0;
                const target = v.__vjsPlayer || v;
                target.play().then(() => {
                    log('✅ 强制播放成功' + (wantSound ? '(带声)' : '(静音)'));
                    if (wantSound) setTimeout(() => { v.muted = false; v.volume = 1; }, 400);
                }).catch(e => {
                    v.muted = true; v.volume = 0;
                    v.play().then(() => log('✅ 备用静音播放成功')).catch(err => log('强制播放失败:', err));
                });
                applySpeed(v, store.speed);
            } else {
                log('未检测到视频，重新扫描...');
                scanForVideos();
            }
        });
    }

    function setSpeed(rate) {
        store.speed = rate;
        saveStore();
        log('设置倍速:', rate);
        if (state.currentVideo) {
            applySpeed(state.currentVideo, rate);
        }
        updateUI();
    }

    function updateUI() {
        if (!panelEl) return;
        if (speedDisplayEl) speedDisplayEl.textContent = store.speed + 'x';
        document.querySelectorAll('.olvh-speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === store.speed);
        });
        if (statusEl) {
            const dot = document.getElementById('olvh-status-dot');
            if (state.currentVideo) {
                const playing = !state.currentVideo.paused;
                const rate = state.currentVideo.__realRate || store.speed;
                statusEl.textContent = playing
                    ? `播放中 · ${rate}x · ${Math.round(state.currentVideo.currentTime)}s`
                    : `已检测 · 暂停中 · ${rate}x`;
                if (dot) dot.className = 'dot ' + (playing ? 'green' : 'red');
            } else {
                statusEl.textContent = '等待检测视频...';
                if (dot) dot.className = 'dot gray';
            }
        }
        if (homeTitleEl) {
            if (state.currentVideo) {
                homeTitleEl.textContent = `📺 ${document.title || '当前视频'}`;
            } else {
                homeTitleEl.textContent = '尚未检测到视频';
            }
        }
    }

    function startUIRefresh() {
        setInterval(() => {
            if (state.currentVideo) {
                if (!state.currentVideo.paused && !state.currentVideo.ended && state.currentVideo.__record) {
                    state.currentVideo.__record.watched += 1;
                    state.currentVideo.__record.lastSeen = Date.now();
                    saveRecords();
                }
                updateUI();
            }
        }, 1000);
    }

    function makeDraggable() {
        const header = document.getElementById('olvh-header');
        const panel = document.getElementById('olvh-panel');
        let isDragging = false, startX, startY, startLeft, startTop;
        header.addEventListener('mousedown', (e) => {
            if (e.target.id === 'olvh-toggle') return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            startLeft = rect.left; startTop = rect.top;
            panel.style.right = 'auto';
            panel.style.left = startLeft + 'px';
            panel.style.top = startTop + 'px';
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.left = (startLeft + e.clientX - startX) + 'px';
            panel.style.top = (startTop + e.clientY - startY) + 'px';
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    /* ======================== 启动 ======================== */
    function init() {
        loadStore();
        loadRecords();
        log('景德镇艺术-学习助手 v4.1.0 启动');

        setupExamWatcher();
        setupWorkWatcher();
        setupGlobalObserver();

        const start = () => {
            createPanel();
            watchRouteChange();
            setupVisibilityHandler();
            setupUserInteractionUnlock();
            startUIRefresh();

            if (isExamPage()) {
                log('📖 检测到考试页面');
                if (store.tasks.exam) runExamAutoAnswer();
            }

            scanForVideos();
            setTimeout(scanForVideos, 1500);
            setTimeout(scanForVideos, 3000);
            setTimeout(scanForVideos, 5000);
            setTimeout(scanForVideos, 8000);

            setInterval(scanForVideos, CONFIG.retryInterval);
        };

        if (document.body) start();
        else document.addEventListener('DOMContentLoaded', start);
    }

  const __jdzInit = init;
  init = function () {
    try {
      if (!store.account.token && !store.account.scriptKey) {
        const raw = GM_getValue('localBackendLogin', '');
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && saved.token) {
            store.account.username = saved.username || '';
            store.account.token = saved.token;
            saveStore();
            log('🔑 已同步学神助手登录态，可直接答题');
          }
        }
      }
    } catch (e) {}
    __jdzInit();
  };
  init();
})();

