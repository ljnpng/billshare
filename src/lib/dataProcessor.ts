import { 
  DataProcessor, 
  RawReceiptData, 
  Receipt, 
  MenuItem, 
  Person, 
  PersonalBill, 
  BillSummary 
} from '../types';

export class BillDataProcessor implements DataProcessor {
  /**
   * 处理原始输入数据，转换为标准的Receipt格式
   */
  processRawData(rawData: RawReceiptData): Receipt {
    const now = new Date();
    const receiptId = `receipt_${Date.now()}`;
    
    // 处理条目数据
    const items: MenuItem[] = rawData.items.map((item, index) => ({
      id: `item_${receiptId}_${index}`,
      name: item.name,
      originalPrice: item.price * (item.quantity || 1),
      finalPrice: 0, // 将在calculateTaxAndTip中计算
      assignedTo: [],
      createdAt: now,
      updatedAt: now
    }));

    // 计算小计
    const subtotal = rawData.subtotal || items.reduce((sum, item) => sum + item.originalPrice, 0);
    
    // 处理税费和小费
    const tax = rawData.tax || 0;
    const tip = rawData.tip || 0;
    const total = rawData.total || subtotal + tax + tip;

    const receipt: Receipt = {
      id: receiptId,
      items,
      subtotal,
      tax,
      tip,
      total,
      createdAt: now,
      updatedAt: now
    };

    return this.calculateTaxAndTip(receipt);
  }

  /**
   * 验证数据完整性
   */
  validateData(receipt: Receipt): boolean {
    // 检查基本字段
    if (!receipt.id || !receipt.items || receipt.items.length === 0) {
      return false;
    }

    // 检查每个条目
    for (const item of receipt.items) {
      if (!item.id || !item.name || item.originalPrice < 0) {
        return false;
      }
    }

    // 检查金额逻辑
    if (receipt.subtotal < 0 || receipt.tax < 0 || receipt.tip < 0 || receipt.total < 0) {
      return false;
    }

    return true;
  }

  /**
   * 计算税费和小费分摊
   */
  calculateTaxAndTip(receipt: Receipt): Receipt {
    const { items, subtotal, tax, tip } = receipt;
    
    if (subtotal === 0) return receipt;

    // 计算每个条目的最终价格（按比例分摊税费和小费）
    const updatedItems = items.map(item => {
      const ratio = item.originalPrice / subtotal;
      const taxShare = tax * ratio;
      const tipShare = tip * ratio;
      const finalPrice = item.originalPrice + taxShare + tipShare;
      
      return {
        ...item,
        finalPrice: Math.round(finalPrice * 100) / 100, // 保留两位小数
        updatedAt: new Date()
      };
    });

    return {
      ...receipt,
      items: updatedItems,
      updatedAt: new Date()
    };
  }

  /**
   * 生成个人账单
   */
  generatePersonalBills(receipt: Receipt, people: Person[]): PersonalBill[] {
    const personalBills: PersonalBill[] = [];

    people.forEach(person => {
      const personalBill: PersonalBill = {
        personId: person.id,
        personName: person.name,
        items: [],
        totalOriginal: 0,
        totalFinal: 0
      };

      receipt.items.forEach(item => {
        if (item.assignedTo.includes(person.id)) {
          // 计算该人应该支付的份额
          const shareCount = item.assignedTo.length;
          const originalShare = item.originalPrice / shareCount;
          const finalShare = item.finalPrice / shareCount;

          personalBill.items.push({
            itemId: item.id,
            itemName: item.name,
            share: shareCount,
            originalShare: Math.round(originalShare * 100) / 100,
            finalShare: Math.round(finalShare * 100) / 100
          });

          personalBill.totalOriginal += originalShare;
          personalBill.totalFinal += finalShare;
        }
      });

      // 保留两位小数
      personalBill.totalOriginal = Math.round(personalBill.totalOriginal * 100) / 100;
      personalBill.totalFinal = Math.round(personalBill.totalFinal * 100) / 100;

      personalBills.push(personalBill);
    });

    return personalBills;
  }

  /**
   * 生成最终账单汇总
   */
  generateBillSummary(receipt: Receipt, people: Person[]): BillSummary {
    const personalBills = this.generatePersonalBills(receipt, people);
    
    return {
      receipt,
      people,
      personalBills,
      createdAt: new Date()
    };
  }

  /**
   * 更新条目分配
   */
  updateItemAssignment(receipt: Receipt, itemId: string, assignedTo: string[]): Receipt {
    const updatedItems = receipt.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          assignedTo: [...assignedTo],
          updatedAt: new Date()
        };
      }
      return item;
    });

    return {
      ...receipt,
      items: updatedItems,
      updatedAt: new Date()
    };
  }

  /**
   * 更新税费和小费
   */
  updateTaxAndTip(receipt: Receipt, tax: number, tip: number): Receipt {
    const updatedReceipt = {
      ...receipt,
      tax,
      tip,
      total: receipt.subtotal + tax + tip,
      updatedAt: new Date()
    };

    return this.calculateTaxAndTip(updatedReceipt);
  }

  /**
   * 添加新条目
   */
  addItem(receipt: Receipt, itemName: string, price: number): Receipt {
    const newItem: MenuItem = {
      id: `item_${receipt.id}_${Date.now()}`,
      name: itemName,
      originalPrice: price,
      finalPrice: 0,
      assignedTo: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedReceipt = {
      ...receipt,
      items: [...receipt.items, newItem],
      subtotal: receipt.subtotal + price,
      total: receipt.subtotal + price + receipt.tax + receipt.tip,
      updatedAt: new Date()
    };

    return this.calculateTaxAndTip(updatedReceipt);
  }

  /**
   * 删除条目
   */
  removeItem(receipt: Receipt, itemId: string): Receipt {
    const itemToRemove = receipt.items.find(item => item.id === itemId);
    if (!itemToRemove) return receipt;

    const updatedItems = receipt.items.filter(item => item.id !== itemId);
    const updatedReceipt = {
      ...receipt,
      items: updatedItems,
      subtotal: receipt.subtotal - itemToRemove.originalPrice,
      total: receipt.subtotal - itemToRemove.originalPrice + receipt.tax + receipt.tip,
      updatedAt: new Date()
    };

    return this.calculateTaxAndTip(updatedReceipt);
  }
}

// 导出单例实例
export const dataProcessor = new BillDataProcessor(); 