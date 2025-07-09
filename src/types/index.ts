// 基础数据结构定义

export interface Person {
  id: string;
  name: string;
  color?: string; // 用于UI区分
}

export interface MenuItem {
  id: string;
  name: string;
  originalPrice: number; // 原价
  finalPrice: number; // 含税含小费的最终价格
  assignedTo: string[]; // 分配给谁的ID列表
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  name: string;
  items: MenuItem[];
  subtotal: number; // 小计
  tax: number; // 税额
  tip: number; // 小费
  total: number; // 总计
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalBill {
  personId: string;
  personName: string;
  items: {
    itemId: string;
    itemName: string;
    share: number; // 这个人应该支付的份额
    originalShare: number; // 原价份额
    finalShare: number; // 含税含小费份额
  }[];
  totalOriginal: number; // 原价总计
  totalFinal: number; // 最终总计
}

export interface BillSummary {
  receipts: Receipt[];
  people: Person[];
  personalBills: PersonalBill[];
  totalSubtotal: number;
  totalTax: number;
  totalTip: number;
  grandTotal: number;
  createdAt: Date;
}

// 统一的数据处理接口
export interface DataProcessor {
  // 处理原始输入数据（可能来自OCR或手动输入）
  processRawData(rawData: any): Receipt;
  
  // 验证数据完整性
  validateData(receipt: Receipt): boolean;
  
  // 计算税费和小费分摊
  calculateTaxAndTip(receipt: Receipt): Receipt;
  
  // 生成个人账单
  generatePersonalBills(receipt: Receipt, people: Person[]): PersonalBill[];
  
  // 生成最终汇总
  generateBillSummary(receipts: Receipt[], people: Person[]): BillSummary;
}

// 原始输入数据格式（支持多种输入方式）
export interface RawItemData {
  name: string;
  price: number;
  quantity?: number;
}

export interface RawReceiptData {
  items: RawItemData[];
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
}

// 用于前端状态管理
export interface AppState {
  people: Person[];
  receipts: Receipt[];
  currentStep: 'setup' | 'input' | 'assign' | 'summary';
  isLoading: boolean;
  error: string | null;
} 