import { 
  Receipt, 
  MenuItem, 
  Person, 
  PersonalBill, 
  BillSummary 
} from '../types';
import { dataLogger } from './logger';

export class BillDataProcessor {
  /**
   * 验证数据完整性
   */
  validateData(receipt: Receipt): boolean {
    dataLogger.debug('开始验证数据完整性', { receiptId: receipt.id });
    
    // 检查基本字段
    if (!receipt.id || !receipt.items) {
      dataLogger.error('数据验证失败：缺少基本字段', { id: receipt.id, hasItems: !!receipt.items });
      return false;
    }

    // 检查每个条目
    for (const item of receipt.items) {
      if (!item.id || !item.name || (item.originalPrice !== null && item.originalPrice < 0)) {
        dataLogger.error('数据验证失败：条目数据无效', { 
          itemId: item.id, 
          itemName: item.name, 
          price: item.originalPrice 
        });
        return false;
      }
    }

    // 检查金额逻辑
    if (receipt.subtotal < 0 || receipt.tax < 0 || receipt.tip < 0 || receipt.total < 0) {
      dataLogger.error('数据验证失败：金额数据无效', { 
        subtotal: receipt.subtotal,
        tax: receipt.tax,
        tip: receipt.tip,
        total: receipt.total
      });
      return false;
    }

    dataLogger.debug('数据验证通过', { receiptId: receipt.id });
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
      // 如果原价为 null，则最终价格也为 0，不参与税费和小费分摊
      if (item.originalPrice === null) {
        return {
          ...item,
          finalPrice: 0,
          updatedAt: new Date()
        };
      }
      
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
    dataLogger.info('开始生成个人账单', { 
      receiptId: receipt.id, 
      peopleCount: people.length 
    });
    
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
          // 如果原价为 null，则不计算分摊费用
          const originalPrice = item.originalPrice || 0;
          const originalShare = originalPrice / shareCount;
          const finalShare = item.finalPrice / shareCount;

          personalBill.items.push({
            itemId: item.id,
            itemName: item.name,
            receiptId: receipt.id,
            receiptName: receipt.name,
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

    dataLogger.info('个人账单生成完成', { 
      receiptId: receipt.id, 
      billsCount: personalBills.length,
      totalAmount: personalBills.reduce((sum, bill) => sum + bill.totalFinal, 0)
    });

    return personalBills;
  }

  /**
   * 生成最终账单汇总
   */
  generateBillSummary(receipts: Receipt[], people: Person[]): BillSummary {
    const personalBillsMap = new Map<string, PersonalBill>();

    people.forEach(person => {
      personalBillsMap.set(person.id, {
        personId: person.id,
        personName: person.name,
        items: [],
        totalOriginal: 0,
        totalFinal: 0
      });
    });

    receipts.forEach(receipt => {
      const billsForReceipt = this.generatePersonalBills(receipt, people);
      billsForReceipt.forEach(bill => {
        const existingBill = personalBillsMap.get(bill.personId);
        if (existingBill) {
          existingBill.items.push(...bill.items);
          existingBill.totalOriginal += bill.totalOriginal;
          existingBill.totalFinal += bill.totalFinal;
        }
      });
    });

    const personalBills = Array.from(personalBillsMap.values());
    
    const totalSubtotal = receipts.reduce((sum, r) => sum + r.subtotal, 0);
    const totalTax = receipts.reduce((sum, r) => sum + r.tax, 0);
    const totalTip = receipts.reduce((sum, r) => sum + r.tip, 0);
    const grandTotal = receipts.reduce((sum, r) => sum + r.total, 0);

    return {
      receipts,
      people,
      personalBills,
      totalSubtotal,
      totalTax,
      totalTip,
      grandTotal,
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
  addItem(receipt: Receipt, itemName: string, price: number | null): Receipt {
    const newItem: MenuItem = {
      id: `item_${receipt.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: itemName,
      originalPrice: price,
      finalPrice: 0,
      assignedTo: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 只有当价格不为 null 时才计算到小计中
    const priceToAdd = price || 0;
    const updatedReceipt = {
      ...receipt,
      items: [...receipt.items, newItem],
      subtotal: receipt.subtotal + priceToAdd,
      total: receipt.subtotal + priceToAdd + receipt.tax + receipt.tip,
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
    // 只有当价格不为 null 时才从小计中减去
    const priceToRemove = itemToRemove.originalPrice || 0;
    const updatedReceipt = {
      ...receipt,
      items: updatedItems,
      subtotal: receipt.subtotal - priceToRemove,
      total: receipt.subtotal - priceToRemove + receipt.tax + receipt.tip,
      updatedAt: new Date()
    };

    return this.calculateTaxAndTip(updatedReceipt);
  }
}

// 导出单例实例
export const dataProcessor = new BillDataProcessor(); 