// 基础数据结构定义

export interface Person {
  id: string;
  name: string;
  color?: string; // 用于UI区分
}

export interface MenuItem {
  id: string;
  name: string;
  originalPrice: number | null; // 原价，允许为 null 以支持 AI 识别后的待填写状态
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
    receiptId: string; // 新增：所属收据ID
    receiptName: string; // 新增：所属收据名称
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



// 用于前端状态管理
export interface AppState {
  people: Person[];
  receipts: Receipt[];
  currentStep: 'setup' | 'input' | 'assign' | 'summary';
  isLoading: boolean;
  error: string | null;
  isAiProcessing: boolean; // 新增：AI处理状态
}

// 新增：AI识别相关的类型定义
export interface AIRecognizedItem {
  name: string;
  price: number | null; // 允许价格为 null，用户可以后续填写
  description?: string;
}

export interface AIRecognizedReceipt {
  businessName?: string;
  items: AIRecognizedItem[];
  subtotal?: number | null;
  tax?: number | null;
  tip?: number | null;
  total?: number | null;
  date?: string;
  confidence?: number; // 识别置信度
}

export interface AIProcessingResult {
  success: boolean;
  data?: AIRecognizedReceipt;
  error?: string;
} 