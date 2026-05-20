// Anthropic tool_use JSON schemas for structured output.
// Forces the model to emit guaranteed-valid JSON matching these shapes.

const evidenceStructuredSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string', maxLength: 120 },
    quotes: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          turnIndex: { type: 'integer', minimum: 0 },
          userSaid: { type: 'string', maxLength: 100 },
          situation: { type: 'string', maxLength: 50 },
          signal: { type: 'string', maxLength: 80 },
        },
        required: ['turnIndex', 'userSaid', 'situation', 'signal'],
        additionalProperties: false,
      },
    },
    consistency: { type: 'string', enum: ['cross_situational', 'single_situation', 'inferred'] },
  },
  required: ['summary', 'quotes', 'consistency'],
  additionalProperties: false,
} as const

const identityLabelSchema = {
  type: 'object',
  properties: {
    primary: { type: 'string', maxLength: 20 },
    modifiers: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string', maxLength: 20 } },
    one_liner: { type: 'string', maxLength: 120 },
  },
  required: ['primary', 'modifiers', 'one_liner'],
  additionalProperties: false,
} as const

const pct = { type: 'integer', minimum: 0, maximum: 100 } as const

const categoricalItem = (enumValues: readonly string[]) => ({
  type: 'object',
  properties: {
    result: { type: 'string', enum: enumValues },
    confidence: pct,
    evidence: { type: 'string', maxLength: 80 },
    evidence_structured: evidenceStructuredSchema,
    insight: { type: 'string', maxLength: 120 },
  },
  required: ['result', 'confidence', 'evidence', 'insight'],
  additionalProperties: false,
})

const valueItem = {
  type: 'object',
  properties: {
    result: { type: 'integer', minimum: -100, maximum: 100 },
    confidence: pct,
    evidence: { type: 'string', maxLength: 80 },
    evidence_structured: evidenceStructuredSchema,
    insight: { type: 'string', maxLength: 120 },
  },
  required: ['result', 'confidence', 'evidence', 'insight'],
  additionalProperties: false,
} as const

const unfinishedItem = {
  type: 'object',
  properties: {
    description: { type: 'string', maxLength: 120 },
    confidence: pct,
    evidence: { type: 'string', maxLength: 80 },
    evidence_structured: evidenceStructuredSchema,
    insight: { type: 'string', maxLength: 120 },
  },
  required: ['description', 'confidence', 'evidence', 'insight'],
  additionalProperties: false,
} as const

const intimacyLanguages = ['语言确认', '质量时间', '行动服务', '知识分享', '共同体验'] as const

export const analysisToolSchema = {
  name: 'submit_analysis',
  description: '提交对用户在 19 个维度上的完整人格分析结果。所有字段必填。',
  input_schema: {
    type: 'object',
    properties: {
      thinking_styles: {
        type: 'object',
        properties: {
          info_processing: categoricalItem(['演绎型', '归纳型', '类比型', '直觉型']),
          uncertainty_response: categoricalItem(['分析优先', '行动优先', '框架构建', '直觉跳跃']),
          conflict_handling: categoricalItem(['回避', '对抗', '调和', '整合']),
          expression_thinking: categoricalItem(['想清楚再说', '边说边想', '写作思考', '对话思考']),
          abstraction_level: categoricalItem(['具象型', '抽象型', '层级跳跃型']),
        },
        required: ['info_processing', 'uncertainty_response', 'conflict_handling', 'expression_thinking', 'abstraction_level'],
        additionalProperties: false,
      },
      values: {
        type: 'object',
        properties: {
          truth_vs_kindness: valueItem,
          freedom_vs_belonging: valueItem,
          fairness_vs_care: valueItem,
          present_vs_future: valueItem,
          depth_vs_breadth: valueItem,
        },
        required: ['truth_vs_kindness', 'freedom_vs_belonging', 'fairness_vs_care', 'present_vs_future', 'depth_vs_breadth'],
        additionalProperties: false,
      },
      relationship_patterns: {
        type: 'object',
        properties: {
          attachment_style: {
            type: 'object',
            properties: {
              result: { type: 'string', enum: ['安全型', '焦虑型', '回避型', '混乱型'] },
              anxiety_score: pct,
              avoidance_score: pct,
              confidence: pct,
              evidence: { type: 'string', maxLength: 80 },
              insight: { type: 'string', maxLength: 120 },
            },
            required: ['result', 'anxiety_score', 'avoidance_score', 'confidence', 'evidence', 'insight'],
            additionalProperties: false,
          },
          intimacy_language: {
            type: 'object',
            properties: {
              primary: { type: 'string', enum: intimacyLanguages },
              secondary: { type: 'string', enum: intimacyLanguages },
              confidence: pct,
              evidence: { type: 'string', maxLength: 80 },
              insight: { type: 'string', maxLength: 120 },
            },
            required: ['primary', 'secondary', 'confidence', 'evidence', 'insight'],
            additionalProperties: false,
          },
          boundary_style: categoricalItem(['高渗透型', '渐进开放型', '选择性开放型', '高壁垒型']),
          social_energy: categoricalItem(['充电型', '消耗型', '选择性', '情境型']),
          conflict_repair: categoricalItem(['即时修复', '冷处理', '遗忘', '关系重评']),
        },
        required: ['attachment_style', 'intimacy_language', 'boundary_style', 'social_energy', 'conflict_repair'],
        additionalProperties: false,
      },
      unfinished_self: {
        type: 'object',
        properties: {
          suppressed_expression: unfinishedItem,
          aspired_identity: unfinishedItem,
          escape_direction: unfinishedItem,
          desired_role: unfinishedItem,
        },
        required: ['suppressed_expression', 'aspired_identity', 'escape_direction', 'desired_role'],
        additionalProperties: false,
      },
      overall_portrait: {
        type: 'string',
        maxLength: 300,
        description: '200字以内的整体画像，像一个真正了解这个人的朋友在描述他',
      },
      evolution_direction: {
        type: 'string',
        maxLength: 80,
        description: '一句话，格式：你正在从「___」试图变成「___」',
      },
      identity_label: identityLabelSchema,
    },
    required: ['thinking_styles', 'values', 'relationship_patterns', 'unfinished_self', 'overall_portrait', 'evolution_direction', 'identity_label'],
    additionalProperties: false,
  },
} as const

const ROLE_NAMES = [
  // 思维 7
  '磨刀石', '开窗人', '翻译器', '解毒剂', '放大镜', '望远镜', '提问者',
  // 行动 5
  '启动键', '发动机', '刹车片', '副驾驶', '降落伞',
  // 情感 6
  '安全着陆点', '情绪翻译官', '真话港湾', '沉默同盟', '充电宝', '情绪急救包',
  // 成长 6
  '镜子', '教材', '练习场', '标尺', '考古学家', '解锁者',
  // 关系动力学 4
  '节奏调节器', '边界温度计', '翻山搭档', '对手型盟友',
] as const

const LAYER_NAMES = ['思维', '行动', '情感', '成长', '关系动力学'] as const

const roleCardSchema = {
  type: 'object',
  properties: {
    role_name: { type: 'string', enum: ROLE_NAMES },
    layer: { type: 'string', enum: LAYER_NAMES },
    description: { type: 'string', maxLength: 200 },
  },
  required: ['role_name', 'layer', 'description'],
  additionalProperties: false,
} as const

const roleDirectionSchema = {
  type: 'object',
  properties: {
    primary: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: roleCardSchema,
    },
    supplementary: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: roleCardSchema,
    },
  },
  required: ['primary', 'supplementary'],
  additionalProperties: false,
} as const

export const collisionToolSchema = {
  name: 'submit_collision',
  description: '提交两人关系的非对称角色分析结果。所有字段必填。',
  input_schema: {
    type: 'object',
    properties: {
      roles_for_a: roleDirectionSchema,
      roles_for_b: roleDirectionSchema,
      collision_points: {
        type: 'array',
        minItems: 2,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 30 },
            difference: { type: 'string', maxLength: 100 },
            daily_manifestation: { type: 'string', maxLength: 100 },
            growth_opportunity: { type: 'string', maxLength: 100 },
          },
          required: ['title', 'difference', 'daily_manifestation', 'growth_opportunity'],
          additionalProperties: false,
        },
      },
      resonance_zones: {
        type: 'array',
        minItems: 1,
        maxItems: 2,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 30 },
            similarity: { type: 'string', maxLength: 100 },
            effect: { type: 'string', maxLength: 100 },
          },
          required: ['title', 'similarity', 'effect'],
          additionalProperties: false,
        },
      },
      friction_warning: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 30 },
          risk: { type: 'string', maxLength: 100 },
          suggestion: { type: 'string', maxLength: 100 },
        },
        required: ['title', 'risk', 'suggestion'],
        additionalProperties: false,
      },
      relationship_potential: { type: 'string', maxLength: 60 },
      relationship_type: { type: 'string', maxLength: 20 },
      relationship_context: { type: 'string', enum: ['romantic', 'close_friend', 'family', 'colleague', 'new_acquaintance', 'archetype', 'unknown'] },
      action_hints: {
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: {
          type: 'object',
          properties: {
            scenario: { type: 'string', maxLength: 80 },
            action: { type: 'string', maxLength: 120 },
            based_on: { type: 'string', maxLength: 80 },
            expected_effect: { type: 'string', maxLength: 80 },
          },
          required: ['scenario', 'action', 'based_on', 'expected_effect'],
          additionalProperties: false,
        },
      },
    },
    required: ['roles_for_a', 'roles_for_b', 'collision_points', 'resonance_zones', 'friction_warning', 'relationship_potential', 'relationship_type'],
    additionalProperties: false,
  },
} as const
