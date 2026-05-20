export type DimensionKey =
  | 'info_processing' | 'uncertainty_response' | 'conflict_handling' | 'expression_thinking' | 'abstraction_level'
  | 'truth_vs_kindness' | 'freedom_vs_belonging' | 'fairness_vs_care' | 'present_vs_future' | 'depth_vs_breadth'
  | 'attachment_style' | 'intimacy_language' | 'boundary_style' | 'social_energy' | 'conflict_repair'
  | 'suppressed_expression' | 'aspired_identity' | 'escape_direction' | 'desired_role'

export type QuestionCategory = 'core' | 'extended'

export interface FollowUpDirection {
  trigger: string
  questions: string[]
}

export interface Question {
  id: string
  category: QuestionCategory
  text: string
  dimensions: DimensionKey[]
  followUps: FollowUpDirection[]
}

export const QUESTION_BANK: Question[] = [
  // ═══ CORE (8 道, 覆盖全部 19 维, 7-8 轮收束) ═══

  {
    id: 'Q04',
    category: 'core',
    text: '假设这个周末你完全没有任何安排，也没有任何人联系你，整整两天完全属于你。不用说"应该"怎么过——你真的最想怎么过这两天？',
    dimensions: ['social_energy', 'suppressed_expression', 'depth_vs_breadth', 'aspired_identity'],
    followUps: [
      { trigger: 'described_weekend', questions: ['你描述的这个周末跟你实际的周末差别大吗？是什么阻碍了你？'] },
      { trigger: 'gap_mentioned', questions: ['有没有什么是你一直想做但从来没开始的事？'] },
      { trigger: 'general', questions: ['你一个人待着更有能量，还是跟人在一起更有能量？有没有某些人在一起比独处更放松？', '你会选择深入做一件事，还是随意尝试很多不同的东西？'] },
    ],
  },
  {
    id: 'Q01',
    category: 'core',
    text: '一个还不错的朋友深夜给你发了一大段消息，说他跟交往三年的对象大吵了一架，想跟你聊聊。但你明天有很重要的事，很需要睡眠。你会怎么做？',
    dimensions: ['uncertainty_response', 'truth_vs_kindness', 'attachment_style', 'boundary_style', 'intimacy_language'],
    followUps: [
      { trigger: 'chose_reply', questions: ['你会先问发生了什么，还是先表达关心？如果聊着聊着发现其实是他做了很过分的事呢？'] },
      { trigger: 'chose_sleep', questions: ['发"明天再聊"的时候你会有点愧疚吗？如果他没回你，第二天会主动找他吗？'] },
      { trigger: 'general', questions: ['反过来，你深夜很难过会找谁？你期待对方怎么回应？'] },
    ],
  },
  {
    id: 'Q02',
    category: 'core',
    text: '一个好朋友打算放弃稳定工作去做你觉得大概率失败的项目。他很兴奋地问你怎么看。你会怎么说？',
    dimensions: ['info_processing', 'uncertainty_response', 'truth_vs_kindness', 'fairness_vs_care'],
    followUps: [
      { trigger: 'general', questions: ['回应之前你脑子里先想到的是什么——风险、他的兴奋、还是类似的案例？'] },
      { trigger: 'gave_opinion', questions: ['如果他听了你的意见还是决定去做，你之后会怎样？'] },
      { trigger: 'warned_him', questions: ['半年后他果然失败了来找你，你会怎么跟他说？'] },
    ],
  },
  {
    id: 'Q03',
    category: 'core',
    text: '你在一个很重视的朋友群里，发现自己的看法跟大多数人完全不同。你会怎么做？',
    dimensions: ['conflict_handling', 'freedom_vs_belonging', 'expression_thinking'],
    followUps: [
      { trigger: 'chose_speak', questions: ['你会先铺垫还是直接说？是想好了完整逻辑再发言，还是边说边理清楚？'] },
      { trigger: 'chose_silence', questions: ['不说的原因是觉得没必要、怕影响关系、还是觉得说了也没用？'] },
      { trigger: 'general', questions: ['过去有没有一次你在群体中说了不同意见，结果出乎你意料？'] },
    ],
  },
  {
    id: 'Q05',
    category: 'core',
    text: '有没有一次你被一个很重要的人误解了？当时你是怎么处理的？',
    dimensions: ['conflict_repair', 'attachment_style', 'intimacy_language', 'expression_thinking'],
    followUps: [
      { trigger: 'general', questions: ['你是当场纠正了，还是过了一段时间才说？还是没说？', '被误解的那段时间里你最强烈的感受是什么？'] },
      { trigger: 'mentioned_feelings', questions: ['你最希望对方用什么方式来修复？'] },
      { trigger: 'unresolved', questions: ['如果这个误解一直没被澄清，你会让它过去吗？'] },
    ],
  },
  {
    id: 'Q06',
    category: 'core',
    text: '你身边有没有一个人——你觉得他身上有某种东西是你特别想拥有的？',
    dimensions: ['aspired_identity', 'escape_direction', 'abstraction_level', 'present_vs_future'],
    followUps: [
      { trigger: 'general', questions: ['你觉得你没有这个特质是因为天生不具备，还是你有但一直没敢发挥？'] },
      { trigger: 'described_trait', questions: ['如果你明天就拥有了这个特质，生活具体会怎么变？', '你现在的生活中有没有什么时候其实已经展现了这个特质？'] },
      { trigger: 'self_reflection', questions: ['五年后你会更接近这个人还是离他更远？'] },
    ],
  },
  {
    id: 'Q07',
    category: 'core',
    text: '不限恋爱，哪种关系都行。你最理想的一段关系是什么样的？如果描述不出"理想的"，你也可以说——你最不想要的关系是什么样的。',
    dimensions: ['desired_role', 'boundary_style', 'intimacy_language', 'escape_direction'],
    followUps: [
      { trigger: 'described_ideal', questions: ['在这段关系中你是什么角色？', '你描述的这种关系你现在有吗，哪怕接近的？'] },
      { trigger: 'described_unwanted', questions: ['你经历过吗？是怎么离开的？'] },
      { trigger: 'general', questions: ['什么样的时刻让你觉得"对，这就是我想要的关系"？'] },
    ],
  },
  {
    id: 'Q14',
    category: 'core',
    text: '如果让你各说一件——这辈子最骄傲的事，和最遗憾的事。',
    dimensions: ['aspired_identity', 'escape_direction', 'present_vs_future', 'fairness_vs_care'],
    followUps: [
      { trigger: 'mentioned_pride', questions: ['骄傲的那件事当时有人看到和认可吗？那个认可对你重要吗？'] },
      { trigger: 'mentioned_regret', questions: ['遗憾的那件事如果时间倒流你会做不同选择吗？'] },
      { trigger: 'general', questions: ['给 18 岁的自己说一句话——你会说什么？'] },
    ],
  },

  // ═══ EXTENDED (7 道, 详细版继续探索用) ═══

  {
    id: 'Q08',
    category: 'extended',
    text: '假设你发现一个关系还不错的同事在做不太对的事——不是违法，但违反职业道德，比如虚报业绩。他这么做可能是因为家里经济压力很大。你会怎么做？',
    dimensions: ['fairness_vs_care', 'truth_vs_kindness', 'conflict_handling', 'info_processing'],
    followUps: [
      { trigger: 'general', questions: ['你做决定时先想到的是什么——规则被违反了、这个人的处境、还是对其他同事的影响？'] },
      { trigger: 'chose_silence', questions: ['如果你选择不揭发，之后其他同事因此受损了怎么办？'] },
      { trigger: 'chose_confront', questions: ['如果找他谈，他求你别说出去，你会怎么办？'] },
      { trigger: 'follow_up', questions: ['"对的事"和"善良的事"经常冲突吗？你一般倾向哪边？'] },
    ],
  },
  {
    id: 'Q09',
    category: 'extended',
    text: '突然有一个机会：一个你一直感兴趣但完全没经验的领域，有人邀请你去尝试。但要放下手头很多事情，而且你完全不确定能不能做好。你会怎么考虑？',
    dimensions: ['uncertainty_response', 'present_vs_future', 'suppressed_expression', 'freedom_vs_belonging'],
    followUps: [
      { trigger: 'general', questions: ['你考虑这件事的第一步是什么——评估风险、想想自己想不想、问别人意见、还是凭直觉？'] },
      { trigger: 'mentioned_commitments', questions: ['最让你放不下的是什么——任务本身还是对别人的责任？'] },
      { trigger: 'hesitating', questions: ['如果你决定不去，五年后会后悔吗？', '有没有过去的某次机会你现在回想起来后悔没抓住？'] },
    ],
  },
  {
    id: 'Q10',
    category: 'extended',
    text: '一个很久没联系的老朋友突然约你见面。见面后发现他变化很大——观念、生活方式、价值观跟以前都不太一样了。你会怎么应对？',
    dimensions: ['freedom_vs_belonging', 'boundary_style', 'conflict_repair', 'social_energy'],
    followUps: [
      { trigger: 'general', questions: ['你是觉得有趣想了解，还是觉得不适应甚至失落？'] },
      { trigger: 'conflict_values', questions: ['如果他的新观念跟你的价值观冲突很大，你们还能维持友谊吗？'] },
      { trigger: 'self_reflection', questions: ['你自己变化大吗？最近几年变化最大的是什么？'] },
      { trigger: 'follow_up', questions: ['有没有一段关系是因为一个人变了而结束的？'] },
    ],
  },
  {
    id: 'Q11',
    category: 'extended',
    text: '日常生活中你做选择快吗？比如点菜、买东西、决定周末去哪。描述一下你做日常选择的过程。',
    dimensions: ['uncertainty_response', 'depth_vs_breadth', 'info_processing'],
    followUps: [
      { trigger: 'general', questions: ['你会在脑子里列出选项比较，还是凭直觉快速锁定？'] },
      { trigger: 'mentioned_regret', questions: ['有没有做了选择后一直后悔的经历？怎么处理那种后悔感？'] },
      { trigger: 'follow_up', questions: ['做大决定和做小决定的时候风格一样吗？'] },
    ],
  },
  {
    id: 'Q12',
    category: 'extended',
    text: '最近有没有学过什么新东西？技能也好知识也好。你是怎么学的？',
    dimensions: ['info_processing', 'abstraction_level', 'depth_vs_breadth'],
    followUps: [
      { trigger: 'general', questions: ['你学到什么程度觉得"够了"——能用就行还是彻底搞懂原理？'] },
      { trigger: 'mentioned_method', questions: ['你喜欢一个人摸索还是跟别人一起学？'] },
      { trigger: 'follow_up', questions: ['最近对什么领域特别好奇？是长期兴趣还是突然冒出来的？'] },
    ],
  },
  {
    id: 'Q13',
    category: 'extended',
    text: '最近一次情绪特别强烈是什么时候？不一定是哭——特别愤怒、特别感动、特别焦虑都算。是什么触发的？你怎么处理的？',
    dimensions: ['attachment_style', 'conflict_repair', 'suppressed_expression', 'boundary_style'],
    followUps: [
      { trigger: 'general', questions: ['那个时刻你身边有人吗？你跟谁聊过吗？'] },
      { trigger: 'mentioned_coping', questions: ['你一般怎么消化强烈情绪——说出来、写下来、还是自己待着？'] },
      { trigger: 'follow_up', questions: ['你觉得自己情绪波动大吗？你的朋友会这么形容你吗？'] },
    ],
  },
  {
    id: 'Q15',
    category: 'extended',
    text: '哪些类型的社交场合给你"充电"，哪些是"耗电"的？有没有某些人跟他们在一起完全不消耗能量？',
    dimensions: ['social_energy', 'intimacy_language', 'desired_role'],
    followUps: [
      { trigger: 'general', questions: ['让你充电的人有什么共同点？'] },
      { trigger: 'mentioned_preference', questions: ['你更喜欢一对一的深度聊天还是一群人的热闹？'] },
      { trigger: 'mentioned_relationships', questions: ['有没有关系你其实不想维持但又不好意思断掉？'] },
      { trigger: 'follow_up', questions: ['你最亲近的关系里通常是主动联系的人还是等别人来找你？'] },
    ],
  },
]

/** All core question IDs in recommended order */
export const CORE_ORDER = ['Q04', 'Q01', 'Q02', 'Q03', 'Q05', 'Q06', 'Q07', 'Q14']

/** All extended question IDs */
export const EXTENDED_ORDER = ['Q08', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13', 'Q15']

/** Get coverage: which dimensions each question covers */
export function getQuestionCoverage(): Map<string, DimensionKey[]> {
  const map = new Map<string, DimensionKey[]>()
  for (const q of QUESTION_BANK) {
    map.set(q.id, q.dimensions)
  }
  return map
}

/** Select the best next question based on uncovered dimensions */
export function selectNextQuestion(
  usedIds: string[],
  coveredDims: Set<DimensionKey>,
  category: 'core' | 'extended' = 'core'
): Question | null {
  const pool = category === 'core'
    ? QUESTION_BANK.filter(q => q.category === 'core' && !usedIds.includes(q.id))
    : QUESTION_BANK.filter(q => q.category === 'extended' && !usedIds.includes(q.id))

  if (pool.length === 0) return null

  // Score each question by how many uncovered dimensions it covers
  let best = pool[0]
  let bestScore = 0
  for (const q of pool) {
    const newDims = q.dimensions.filter(d => !coveredDims.has(d))
    const score = newDims.length
    if (score > bestScore) {
      bestScore = score
      best = q
    }
  }
  return best
}
