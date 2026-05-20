import type { CollisionResult, DimensionResult, RoleDirection, RelationshipContext } from './supabase'

function parseIfString<T>(v: unknown): T | undefined {
  if (v == null) return undefined
  if (typeof v !== 'string') return v as T
  try {
    return JSON.parse(v) as T
  } catch {
    return undefined
  }
}

function capDirection(d: RoleDirection | undefined): RoleDirection | undefined {
  if (!d) return undefined
  return {
    primary: Array.isArray(d.primary) ? d.primary.slice(0, 3) : [],
    supplementary: Array.isArray(d.supplementary) ? d.supplementary.slice(0, 2) : [],
  }
}

function normalizeCollision(raw: CollisionResult): CollisionResult {
  const r = raw as unknown as Record<string, unknown>
  return {
    roles_for_a: capDirection(parseIfString<RoleDirection>(r.roles_for_a)),
    roles_for_b: capDirection(parseIfString<RoleDirection>(r.roles_for_b)),
    collision_points: (parseIfString<CollisionResult['collision_points']>(r.collision_points) ?? []).slice(0, 3),
    resonance_zones: (parseIfString<CollisionResult['resonance_zones']>(r.resonance_zones) ?? []).slice(0, 2),
    friction_warning: parseIfString<CollisionResult['friction_warning']>(r.friction_warning) ?? {
      title: '', risk: '', suggestion: '',
    },
    relationship_potential: typeof r.relationship_potential === 'string' ? r.relationship_potential : '',
    relationship_type: typeof r.relationship_type === 'string' ? r.relationship_type : undefined,
    relationship_context: typeof r.relationship_context === 'string' ? r.relationship_context as RelationshipContext : undefined,
    action_hints: Array.isArray(r.action_hints) ? r.action_hints.slice(0, 4) : undefined,
  }
}

const USE_LOCAL_DEMO = import.meta.env.VITE_FORCE_MOCK === '1'

const RELATIONSHIP_FRAMEWORKS: Record<string, string> = {
  romantic: `
## 关系类型：恋人/伴侣
分析侧重：依恋风格兼容性、冲突修复模式匹配、亲密语言是否对齐、边界风格的相互适应。
输出语气：更温柔，更多"你们"的共同体语言。角色命名可以更有亲密感。
`,

  close_friend: `
## 关系类型：密友
分析侧重：共鸣区、价值观光谱重合度、思维层面角色互补、为什么你们合得来。
输出语气：更轻松，可以有幽默感。角色命名可以更偏日常和默契。
`,

  family: `
## 关系类型：家人
分析侧重：未完成的自我（尤其是逃离的方向）、边界风格冲突、代际模式重复、成长中的角色演变。
输出语气：更克制、更多"理解但不一定认同"的框架。角色命名注意温暖但不介入。
`,

  colleague: `
## 关系类型：同事/合作伙伴
分析侧重：工作方式配合、决策互补、沟通效率、不确定性应对的协作模式。
输出语气：更专业、更多"配合"和"效率"语言。角色命名偏行动和思维层。
`,

  new_acquaintance: `
## 关系类型：刚认识/想了解
分析侧重：关系潜力评估、需要注意的差异点、发展建议。
输出语气：更多"如果你们继续深入..."的推测性语言。角色命名偏温和探索。
`,

  archetype: `
## 关系类型：与原型角色碰撞
分析侧重：假设性的关系潜力、典型冲突模式、可能的互补点。
输出语气：有趣、探索性的。可以问"如果你们真的认识，会是什么样的关系"。
`,
}

function buildCollisionPrompt(
  relationshipContext: RelationshipContext,
  _userA?: DimensionResult,
  _userB?: DimensionResult
): string {
  const frameworkBlock = RELATIONSHIP_FRAMEWORKS[relationshipContext] || ''

  return `你是一个关系洞察专家。以下是两个人的维度分析数据："你"（发起碰撞的人）和"对方"（碰撞对象）。请分析他们之间**非对称**的角色关系。${frameworkBlock}

## 核心语言规则（严格遵守）

- 第一个人始终称呼"你"，第二个人始终称呼"对方"。
- **绝对不要**使用"TA"、"他"、"她"、"他/她"、"A"、"B"、"用户A"、"甲"、"乙"等任何其他代词或符号。
- roles_for_a 描述"对方之于你"；roles_for_b 描述"你之于对方"。
- 在字段值里需要引用文字时用中文引号「」，不要用 ASCII 双引号 "，以避免嵌套转义问题。

## 分析原则

1. 关系是非对称的——对方对你的意义不同于你对对方的意义。
2. 差异不等于冲突——很多差异是互补的、有建设性的。
3. 相似不等于好——有些相似会导致竞争或共同盲区。
4. 所有描述都用正面或成长框架，绝不让任何一方显得"不如"。
5. 语气像一个有洞察力的共同朋友在分享观察——温暖、有趣、具体。
6. 避免空洞的形容词，多用具体场景描述。

## 关系类型命名规则

输出一个 relationship_type，是一种简短的、可用于社交传播的关系命名。从以下候选库中选择，如不合适可以创造新的但不超过 15 字：

候选库：
- 镜像成长型：相似度高 + 共鸣区多 → "你们太像了，互相映照"
- 互补搭档型：碰撞点多 + 角色互补 → "你缺的正好是ta有的"
- 温和磨合型：摩擦中等 + 共鸣区存在 → "有差异但互相愿意理解"
- 单向支撑型：两个方向角色强度差大 → "一方给的多，一方接收的多"
- 启发者型：思维层角色强 + 成长层角色强 → "你们在互相推动对方变好"
- 安全基地型：情感层角色强 + 依恋兼容 → "在一起就是充电"
- 挑战者型：碰撞点多 + 摩擦高 → "会争执但也会成长"
- 镜像观察型：相似但保持距离 → "你们在远处互相观察"
- 异步节奏型：节奏不匹配但理解 → "速度不同但方向一致"
- 火花碰撞型：差异大但吸引 → "差异本身就是吸引"

## 行动建议生成规则

输出 2-4 个 action_hints，是基于两人具体维度差异的可执行行动。每个包含：
- scenario：什么情境下
- action：具体做什么（微小、可执行的动作，不是抽象建议）
- based_on：基于什么维度差异
- expected_effect：预期会带来什么效果

要求：不说"多沟通"、"多理解"这类空洞建议。要具体到场景和动作。
例如："下次对方说'我觉得不太好'时，问ta'具体是哪里不好'——这是ta需要的打磨"。

## 角色分析逻辑：5 个层面独立碰撞

角色分布在 5 个层面上。对每个方向（A→B 和 B→A）分别做：

**5 个层面：**
- 思维层面：基于 thinking_styles 全部维度 + depth_vs_breadth
- 行动层面：基于 uncertainty_response、conflict_handling、present_vs_future
- 情感层面：基于 attachment_style、intimacy_language、social_energy、conflict_repair
- 成长层面：基于 unfinished_self 全部 4 个维度 + abstraction_level
- 关系动力学层面：基于 boundary_style、conflict_handling、social_energy、intimacy_language 的组合

每个层面选 1 个最契合的候选角色。按强度排序：top 3 = primary，剩余 2 个 = supplementary。
每个方向的 5 个角色必须分别来自 5 个不同层面。

为每个选中的角色写个性化描述（1-2 句话，不超过 150 字），基于两人**具体的维度数据**。

## 角色库（28 个，必须从中选择）

### 思维层面（7 个）
- 磨刀石：对方的思考方式逼你把想法磨得更清晰
- 开窗人：对方帮你看到原本视角盲的东西
- 翻译器：对方能把你说不清的直觉翻译成语言
- 解毒剂：对方的思维方式正好稀释你容易走极端的那个方向
- 放大镜：对方擅长把抽象的东西具体化
- 望远镜：对方擅长把眼前的事情拉远看
- 提问者：对方问的问题本身在推动你

### 行动层面（5 个）
- 启动键：对方推你跨出想了很久都不动的那一步
- 发动机：对方给你的行动力加燃料
- 刹车片：对方帮你冲动时慢下来
- 副驾驶：对方在你开车时是最靠谱的同行者
- 降落伞：对方在你失败时兜底

### 情感层面（6 个）
- 安全着陆点：对方让你可以彻底放下来
- 情绪翻译官：对方读懂你没说出口的情绪
- 真话港湾：对方是你愿意说真话的那个人
- 沉默同盟：对方是可以和你一起安静待着也不尴尬的人
- 充电宝：对方让你离开后感觉有电了
- 情绪急救包：对方擅长在你情绪崩塌时稳住你

### 成长层面（6 个）
- 镜子：对方映照你自己看不到的部分
- 教材：对方活出了你想学会的某种能力
- 练习场：对方是你可以安全练习新自己的人
- 标尺：对方活成了你内心某种标准的参照
- 考古学家：对方擅长帮你挖出你遗忘或压抑的部分
- 解锁者：对方的存在解锁了你原本以为自己做不到的一面

### 关系动力学层面（4 个）
- 节奏调节器：对方主动调整互动节奏保持舒服的温度
- 边界温度计：对方的边界敏感度能帮你校准
- 翻山搭档：对方在重大节点是愿意跟你一起扛的那种关系
- 对手型盟友：对方既是盟友也是对手让你更好

## 长度控制

- collision_points：2-3 个
- resonance_zones：1-2 个
- 每个 difference/daily_manifestation/growth_opportunity/similarity/effect/risk/suggestion：不超过 100 字
- relationship_potential：1 句话，不超过 60 字
- relationship_type：不超过 15 字
- 每个 action_hint 的每个字段：不超过 100 字

## 输出技术约束

你必须以调用 submit_collision 工具的形式返回结果。所有字段必须传入原生 JSON 对象/数组（不是 JSON 字符串）。`
}

export async function generateCollision(
  userA: DimensionResult,
  userB: DimensionResult,
  relationshipContext: RelationshipContext = 'unknown'
): Promise<CollisionResult> {
  if (USE_LOCAL_DEMO) {
    return mockCollision(relationshipContext)
  }

  const prompt = `${buildCollisionPrompt(relationshipContext, userA, userB)}

## 人称使用

- "你" = 发起碰撞的人
- "对方" = 碰撞对象

## "你"的维度数据
${JSON.stringify(userA)}

## "对方"的维度数据
${JSON.stringify(userB)}`

  const callOnce = async (): Promise<CollisionResult> => {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'json',
        prompt,
        maxTokens: 12000,
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(`碰撞分析 API 错误: ${response.status} - ${data?.error || 'unknown error'}`)
    }
    if (!data.result) throw new Error('碰撞分析格式异常')
    const result = normalizeCollision(data.result as CollisionResult)
    result.relationship_context = relationshipContext
    return result
  }

  try {
    return await callOnce()
  } catch (e) {
    console.warn('[Oprah] collision attempt 1 failed, auto-retrying once:', e)
    return await callOnce()
  }
}

/** Generate collision when the other person hasn't done their own analysis.
 *  Uses the user's description of the friend to infer dimension data. */
export async function generateSpeculativeCollision(
  userA: DimensionResult,
  friendDescription: string,
  relationshipContext: RelationshipContext = 'unknown'
): Promise<CollisionResult> {
  if (USE_LOCAL_DEMO) {
    return mockCollision(relationshipContext)
  }

  const prompt = `你是一个关系洞察专家。以下是"你"的完整维度分析数据，以及"你"对"对方"的文字描述。对方还没有完成自己的分析，只能通过你的描述来推测。

## 任务
1. 基于你对对方的描述，先推测对方的 19 个维度数据（不需要完整输出所有维度，你的重点是生成碰撞结果）
2. 基于你的维度数据和推测的对方维度数据，生成关系碰撞分析

${buildCollisionPrompt(relationshipContext, userA, {} as DimensionResult)}

## 重要提示
- 所有的分析都基于"你对ta的描述"，所以在结果中要标注这是推测性的
- 在 relationship_potential 中体现"这基于你对ta的观察，真实的碰撞可能不同"

## "你"的维度数据
${JSON.stringify(userA)}

## 你对"对方"的描述
${friendDescription}

## 人称使用
- "你" = 发起碰撞的人
- "对方" = 你描述的那个人`

  const callOnce = async (): Promise<CollisionResult> => {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'json',
        prompt,
        maxTokens: 12000,
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(`推测碰撞 API 错误: ${response.status} - ${data?.error || 'unknown error'}`)
    }
    if (!data.result) throw new Error('推测碰撞结果格式异常')
    const result = normalizeCollision(data.result as CollisionResult)
    result.relationship_context = relationshipContext
    return result
  }

  try {
    return await callOnce()
  } catch (e) {
    console.warn('[Oprah] speculative collision attempt 1 failed, auto-retrying once:', e)
    return await callOnce()
  }
}

function mockCollision(relationshipContext: RelationshipContext = 'unknown'): CollisionResult {
  return {
    roles_for_a: {
      primary: [
        { role_name: '开窗人', layer: '思维', description: '对方会把你的熟悉问题打开一扇新窗，让你看到另一种解释。' },
        { role_name: '充电宝', layer: '情感', description: '对方带来的轻松感，会让你更愿意把真实想法说出来。' },
        { role_name: '练习场', layer: '成长', description: '你可以在对方面前练习更直接、更清楚的表达。' },
      ],
      supplementary: [
        { role_name: '副驾驶', layer: '行动', description: '你做决定时，对方像一个一起看路的人。' },
        { role_name: '节奏调节器', layer: '关系动力学', description: '这段关系舒服的地方在于节奏可以被一起调整。' },
      ],
    },
    roles_for_b: {
      primary: [
        { role_name: '磨刀石', layer: '思维', description: '你会逼对方把模糊的感受说得更清楚。' },
        { role_name: '安全着陆点', layer: '情感', description: '你给对方一种可以慢下来、不必马上表演的空间。' },
        { role_name: '镜子', layer: '成长', description: '对方会通过你看见自己一些平时忽略的关系模式。' },
      ],
      supplementary: [
        { role_name: '刹车片', layer: '行动', description: '你能帮对方在兴奋时多看一眼风险。' },
        { role_name: '边界温度计', layer: '关系动力学', description: '你会让对方更敏感地意识到舒服与越界的分界。' },
      ],
    },
    collision_points: [
      { title: '速度差', difference: '一个更想快点进入体验，一个更想先想清楚。', daily_manifestation: '聊天时会出现一个往前冲、一个补充条件的节奏。', growth_opportunity: '把速度差变成配合，而不是互相嫌弃。' },
      { title: '表达浓度', difference: '你们对直接表达的舒适度不同。', daily_manifestation: '重要问题上，一个会先铺垫，一个想直接切核心。', growth_opportunity: '提前约定哪些话可以直接说。' },
    ],
    resonance_zones: [
      { title: '都在找真东西', similarity: '你们都不太满足于表面社交。', effect: '一旦聊深，会很快进入有内容的对话。' },
    ],
    friction_warning: { title: '别把谨慎当否定', risk: '一个人的提醒可能被另一个人听成泼冷水。', suggestion: '先说支持，再说风险，会顺很多。' },
    relationship_potential: '这是一段适合一起把想法打磨成行动的关系。',
    relationship_type: '温和磨合型',
    relationship_context: relationshipContext,
    action_hints: [
      { scenario: '当你们在讨论一个决定而节奏不同时', action: '快的那一方先说"我先说说我的感觉"，慢的那一方说"我需要一点时间想想"——把速度差说出来就不会互相猜。', based_on: '你们的 uncertainty_response 维度有差异', expected_effect: '减少因节奏不同而产生的误解' },
    ],
  }
}
