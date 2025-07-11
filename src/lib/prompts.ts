// 优化后的 Claude 3.5 Haiku 账单识别 Prompt

export const RECEIPT_ANALYSIS_PROMPT = `
你是一个专业的账单识别专家。请仔细分析这张账单图片，使用以下结构化方法：

## 第一步：图片内容确认
首先确认这是一张有效的账单/收据图片。

## 第二步：信息提取
请逐一提取以下信息：

### 商家信息
- 商家名称（店铺名称）
- 地址（如果可见）
- 日期和时间

### 商品明细分析
**重要提示：请特别关注价格数字的识别**
- 仔细查看每个商品行，确保价格数字准确
- 注意区分商品名称和价格列
- 如果价格模糊，请在 description 中说明"价格不清晰"

### 费用计算
- 小计（所有商品价格总和）
- 税费（Tax/GST/VAT）
- 小费（Tip/Service Charge）
- 总计（最终支付金额）

## 第三步：数据验证
- 检查商品价格总和是否与小计一致
- 验证总计 = 小计 + 税费 + 小费
- 如果数字不匹配，请在 confidence 中降低分数

## 响应格式
请严格按照以下 JSON 格式返回：

\`\`\`json
{
  "businessName": "具体商家名称",
  "items": [
    {
      "name": "商品名称（保持原文）",
      "price": 准确的数字价格,
      "description": "额外信息或价格识别说明"
    }
  ],
  "subtotal": 小计数字,
  "tax": 税费数字,
  "tip": 小费数字,
  "total": 总计数字,
  "date": "YYYY-MM-DD",
  "confidence": 0.0到1.0的置信度分数
}
\`\`\`

## 特别要求：
1. **价格识别**：如果单个商品价格无法清晰识别，请设置为 null，并在 description 中说明
2. **数字格式**：所有价格必须是纯数字，不包含货币符号
3. **置信度评估**：
   - 0.9+：所有信息都很清晰
   - 0.7-0.9：大部分信息清晰，少量模糊
   - 0.5-0.7：关键信息识别困难
   - 0.5以下：图片质量差或不是有效账单

## 错误处理
如果图片不是账单或无法识别，返回：
\`\`\`json
{
  "businessName": null,
  "items": [],
  "subtotal": null,
  "tax": null,
  "tip": null,
  "total": null,
  "date": null,
  "confidence": 0.0,
  "error": "具体错误原因"
}
\`\`\`

现在请分析这张账单图片：
`;

// 英文版本的提示词
export const RECEIPT_ANALYSIS_PROMPT_EN = `
You are a professional receipt recognition expert. Please carefully analyze this receipt image using the following structured approach:

## Step 1: Image Content Confirmation
First confirm this is a valid receipt/bill image.

## Step 2: Information Extraction
Please extract the following information item by item:

### Business Information
- Business name (store name)
- Address (if visible)
- Date and time

### Item Details Analysis
**Important Note: Pay special attention to price number recognition**
- Carefully examine each item line, ensure price numbers are accurate
- Note the distinction between item names and price columns
- If prices are unclear, indicate "price unclear" in description

### Cost Calculation
- Subtotal (sum of all item prices)
- Tax (Tax/GST/VAT)
- Tip (Tip/Service Charge)
- Total (final payment amount)

## Step 3: Data Validation
- Check if item price sum matches subtotal
- Verify total = subtotal + tax + tip
- If numbers don't match, lower confidence score

## Response Format
Please return strictly in the following JSON format:

\`\`\`json
{
  "businessName": "specific business name",
  "items": [
    {
      "name": "item name (keep original text)",
      "price": accurate_numeric_price,
      "description": "additional info or price recognition notes"
    }
  ],
  "subtotal": subtotal_number,
  "tax": tax_number,
  "tip": tip_number,
  "total": total_number,
  "date": "YYYY-MM-DD",
  "confidence": 0.0_to_1.0_confidence_score
}
\`\`\`

## Special Requirements:
1. **Price Recognition**: If individual item prices cannot be clearly identified, set to null and explain in description
2. **Number Format**: All prices must be pure numbers, no currency symbols
3. **Confidence Assessment**:
   - 0.9+: All information very clear
   - 0.7-0.9: Most information clear, some unclear
   - 0.5-0.7: Key information difficult to identify
   - Below 0.5: Poor image quality or not a valid receipt

## Error Handling
If image is not a receipt or cannot be recognized, return:
\`\`\`json
{
  "businessName": null,
  "items": [],
  "subtotal": null,
  "tax": null,
  "tip": null,
  "total": null,
  "date": null,
  "confidence": 0.0,
  "error": "specific error reason"
}
\`\`\`

Now please analyze this receipt image:
`;

// 根据语言获取对应的提示词
export const getReceiptAnalysisPrompt = (locale: string = 'zh') => {
  return locale === 'en' ? RECEIPT_ANALYSIS_PROMPT_EN : RECEIPT_ANALYSIS_PROMPT;
};

// 简化的提示词（用于快速识别）
export const SIMPLE_RECEIPT_PROMPT = `
请识别这张账单图片中的关键信息：

1. 商家名称
2. 商品列表和价格
3. 总金额
4. 日期

请以 JSON 格式返回结果，重点关注价格数字的准确性。
`;

export const SIMPLE_RECEIPT_PROMPT_EN = `
Please identify key information from this receipt image:

1. Business name
2. Item list and prices
3. Total amount
4. Date

Please return results in JSON format, focusing on price number accuracy.
`;

export const getSimpleReceiptPrompt = (locale: string = 'zh') => {
  return locale === 'en' ? SIMPLE_RECEIPT_PROMPT_EN : SIMPLE_RECEIPT_PROMPT;
};

// 错误情况的 Prompt
export const ERROR_RESPONSE_PROMPT = `
如果无法识别，请返回：
{
  "businessName": null,
  "items": [],
  "subtotal": null,
  "tax": null,
  "tip": null,
  "total": null,
  "date": null,
  "confidence": 0.0,
  "error": "识别失败的具体原因"
}
`;

export const ERROR_RESPONSE_PROMPT_EN = `
If unable to recognize, return:
{
  "businessName": null,
  "items": [],
  "subtotal": null,
  "tax": null,
  "tip": null,
  "total": null,
  "date": null,
  "confidence": 0.0,
  "error": "specific failure reason"
}
`;

export const getErrorResponsePrompt = (locale: string = 'zh') => {
  return locale === 'en' ? ERROR_RESPONSE_PROMPT_EN : ERROR_RESPONSE_PROMPT;
};

// 完整的 Prompt（保持向后兼容）
export const COMPLETE_RECEIPT_PROMPT = RECEIPT_ANALYSIS_PROMPT;

// 示例响应格式
export const EXAMPLE_RESPONSE = {
  businessName: "The Poke Co",
  items: [
    {
      name: "Poke Bowl",
      price: 16.99,
      description: null
    },
    {
      name: "Extra Sauce",
      price: null, // 价格不清晰时可以为 null
      description: "价格不清晰"
    }
  ],
  subtotal: 16.99,
  tax: 1.36,
  tip: 3.00,
  total: 21.35,
  date: "2024-01-15",
  confidence: 0.95
} as const; 