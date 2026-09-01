import { Receipt, MenuItem, Person, PersonalBill, BillSummary } from '../types';
import { dataLogger } from './logger';

export class BillDataProcessor {
  validateData(receipt: Receipt): boolean {
    dataLogger.debug('开始验证数据完整性', { receiptId: receipt.id });

    if (!receipt.id || !receipt.items) {
      dataLogger.error('数据验证失败：缺少基本字段', {
        id: receipt.id,
        hasItems: !!receipt.items,
      });
      return false;
    }

    for (const item of receipt.items) {
      if (!item.id || !item.name || (item.originalPrice !== null && item.originalPrice < 0)) {
        dataLogger.error('数据验证失败：条目数据无效', {
          itemId: item.id,
          itemName: item.name,
          price: item.originalPrice,
        });
        return false;
      }
    }

    if (receipt.subtotal < 0 || receipt.tax < 0 || receipt.tip < 0 || receipt.total < 0) {
      dataLogger.error('数据验证失败：金额数据无效', {
        subtotal: receipt.subtotal,
        tax: receipt.tax,
        tip: receipt.tip,
        total: receipt.total,
      });
      return false;
    }

    dataLogger.debug('数据验证通过', { receiptId: receipt.id });
    return true;
  }

  calculateTaxAndTip(receipt: Receipt): Receipt {
    const { items, subtotal, tax, tip } = receipt;

    if (subtotal === 0) return receipt;

    const updatedItems = items.map((item) => {
      if (item.originalPrice === null) {
        return {
          ...item,
          finalPrice: 0,
          updatedAt: new Date(),
        };
      }

      const ratio = item.originalPrice / subtotal;
      const taxShare = tax * ratio;
      const tipShare = tip * ratio;
      const finalPrice = item.originalPrice + taxShare + tipShare;

      return {
        ...item,
        finalPrice: Math.round(finalPrice * 100) / 100,
        updatedAt: new Date(),
      };
    });

    return {
      ...receipt,
      items: updatedItems,
      updatedAt: new Date(),
    };
  }

  generatePersonalBills(receipt: Receipt, people: Person[]): PersonalBill[] {
    dataLogger.info('开始生成个人账单', {
      receiptId: receipt.id,
      peopleCount: people.length,
    });

    const personalBills: PersonalBill[] = [];

    people.forEach((person) => {
      const personalBill: PersonalBill = {
        personId: person.id,
        personName: person.name,
        items: [],
        totalOriginal: 0,
        totalFinal: 0,
      };

      receipt.items.forEach((item) => {
        if (item.assignedTo.includes(person.id)) {
          const shareCount = item.assignedTo.length;
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
            finalShare: Math.round(finalShare * 100) / 100,
          });

          personalBill.totalOriginal += originalShare;
          personalBill.totalFinal += finalShare;
        }
      });

      personalBill.totalOriginal = Math.round(personalBill.totalOriginal * 100) / 100;
      personalBill.totalFinal = Math.round(personalBill.totalFinal * 100) / 100;

      personalBills.push(personalBill);
    });

    dataLogger.info('个人账单生成完成', {
      receiptId: receipt.id,
      billsCount: personalBills.length,
      totalAmount: personalBills.reduce((sum, bill) => sum + bill.totalFinal, 0),
    });

    return personalBills;
  }

  generateBillSummary(receipts: Receipt[], people: Person[]): BillSummary {
    const personalBillsMap = new Map<string, PersonalBill>();

    people.forEach((person) => {
      personalBillsMap.set(person.id, {
        personId: person.id,
        personName: person.name,
        items: [],
        totalOriginal: 0,
        totalFinal: 0,
      });
    });

    receipts.forEach((receipt) => {
      const billsForReceipt = this.generatePersonalBills(receipt, people);
      billsForReceipt.forEach((bill) => {
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
      createdAt: new Date(),
    };
  }

  updateItemAssignment(receipt: Receipt, itemId: string, assignedTo: string[]): Receipt {
    const updatedItems = receipt.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          assignedTo: [...assignedTo],
          updatedAt: new Date(),
        };
      }
      return item;
    });

    return {
      ...receipt,
      items: updatedItems,
      updatedAt: new Date(),
    };
  }

  updateTaxAndTip(receipt: Receipt, tax: number, tip: number): Receipt {
    const updatedReceipt = {
      ...receipt,
      tax,
      tip,
      total: receipt.subtotal + tax + tip,
      updatedAt: new Date(),
    };

    return this.calculateTaxAndTip(updatedReceipt);
  }

  addItem(receipt: Receipt, itemName: string, price: number | null): Receipt {
    const newItem: MenuItem = {
      id: `item_${receipt.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: itemName,
      originalPrice: price,
      finalPrice: 0,
      assignedTo: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const priceToAdd = price || 0;
    const updatedReceipt = {
      ...receipt,
      items: [...receipt.items, newItem],
      subtotal: receipt.subtotal + priceToAdd,
      total: receipt.subtotal + priceToAdd + receipt.tax + receipt.tip,
      updatedAt: new Date(),
    };

    return this.calculateTaxAndTip(updatedReceipt);
  }

  removeItem(receipt: Receipt, itemId: string): Receipt {
    const itemToRemove = receipt.items.find((item) => item.id === itemId);
    if (!itemToRemove) return receipt;

    const updatedItems = receipt.items.filter((item) => item.id !== itemId);
    const priceToRemove = itemToRemove.originalPrice || 0;
    const updatedReceipt = {
      ...receipt,
      items: updatedItems,
      subtotal: receipt.subtotal - priceToRemove,
      total: receipt.subtotal - priceToRemove + receipt.tax + receipt.tip,
      updatedAt: new Date(),
    };

    return this.calculateTaxAndTip(updatedReceipt);
  }
}

export const dataProcessor = new BillDataProcessor();
