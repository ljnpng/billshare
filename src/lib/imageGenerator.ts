import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { BillSummary } from '../types';

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  quality?: number;
  shareUrl?: string;
}

export async function generateBillImageFromDOM(
  options: ImageGenerationOptions = {}
): Promise<Blob> {
  const {
    scale = 2,
    backgroundColor = '#f9fafb',
    quality = 0.9,
    shareUrl
  } = options;

  // Find the main content container (skip the header)
  const mainContainer = document.querySelector('.max-w-4xl');
  if (!mainContainer) {
    throw new Error('Could not find main content container');
  }

  // Close any open modals first
  const shareModal = document.querySelector('[data-share-modal]');
  const modalCloseButton = shareModal?.querySelector('[data-close-modal]');
  if (modalCloseButton) {
    (modalCloseButton as HTMLElement).click();
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Expand all receipt sections before capturing
  const expandButtons = document.querySelectorAll('[data-receipt-toggle]');
  const originalExpandedState: boolean[] = [];
  
  expandButtons.forEach((button, index) => {
    const chevron = button.querySelector('.lucide-chevron-down');
    const isExpanded = chevron?.classList.contains('rotate-180');
    originalExpandedState[index] = isExpanded || false;
    
    // If not expanded, click to expand
    if (!isExpanded) {
      (button as HTMLElement).click();
    }
  });

  // Wait for DOM updates
  await new Promise(resolve => setTimeout(resolve, 200));

  // Fix person color dots by ensuring they have proper background colors
  const personColorDots = document.querySelectorAll('.person-color');
  const originalDotsStyles: { [key: string]: string }[] = [];
  
  personColorDots.forEach((dot, index) => {
    const htmlElement = dot as HTMLElement;
    
    // Save original styles
    originalDotsStyles[index] = {
      backgroundColor: htmlElement.style.backgroundColor,
      border: htmlElement.style.border,
      boxShadow: htmlElement.style.boxShadow,
      outline: htmlElement.style.outline,
      position: htmlElement.style.position,
      zIndex: htmlElement.style.zIndex
    };
    
    // Get the computed background color
    const computedStyle = window.getComputedStyle(htmlElement);
    const bgColor = computedStyle.backgroundColor;
    
    // Apply fixed styles directly to the element
    htmlElement.style.backgroundColor = bgColor;
    htmlElement.style.border = 'none';
    htmlElement.style.boxShadow = 'none';
    htmlElement.style.outline = 'none';
    htmlElement.style.position = 'relative';
    htmlElement.style.zIndex = '1';
  });

  // Force a complete reflow and repaint after style changes
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Force layout calculation
        (mainContainer as HTMLElement).offsetHeight;
        // Force all flex containers to recalculate
        const flexContainers = mainContainer.querySelectorAll('.flex');
        flexContainers.forEach(container => {
          (container as HTMLElement).offsetHeight;
        });
        resolve(void 0);
      });
    });
  });

  // Fix card titles by removing text-transparent and bg-clip-text
  const cardTitles = document.querySelectorAll('.card-title');
  const originalTitlesHtml: string[] = [];
  
  cardTitles.forEach((title, index) => {
    const htmlElement = title as HTMLElement;
    originalTitlesHtml[index] = htmlElement.outerHTML;
    
    // Create a new element with proper text color
    const newTitle = document.createElement(htmlElement.tagName);
    newTitle.className = 'card-title';
    newTitle.innerHTML = htmlElement.innerHTML;
    newTitle.style.cssText = `
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.025em;
      color: #1f2937 !important;
      background: none !important;
      -webkit-background-clip: initial !important;
      background-clip: initial !important;
      -webkit-text-fill-color: initial !important;
    `;
    
    // Replace the original element
    htmlElement.parentNode?.replaceChild(newTitle, htmlElement);
  });

  // Fix any other elements that might have text-transparent or bg-clip-text
  const problematicElements = document.querySelectorAll('[class*="text-transparent"], [class*="bg-clip-text"]');
  const originalProblematicHtml: string[] = [];
  
  problematicElements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    originalProblematicHtml[index] = htmlElement.outerHTML;
    
    // Fix the element by removing problematic classes and adding proper color
    const computedStyle = window.getComputedStyle(htmlElement);
    htmlElement.style.color = '#1f2937';
    htmlElement.style.background = 'none';
    htmlElement.style.webkitBackgroundClip = 'initial';
    htmlElement.style.backgroundClip = 'initial';
    htmlElement.style.webkitTextFillColor = 'initial';
  });

  // Create QR code if shareUrl is provided
  let qrCodeDataURL = '';
  if (shareUrl) {
    try {
      qrCodeDataURL = await QRCode.toDataURL(shareUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (error) {
      console.warn('Failed to generate QR code:', error);
    }
  }

  // Create a temporary QR code element if we have one
  let qrCodeElement: HTMLElement | null = null;
  if (qrCodeDataURL) {
    qrCodeElement = document.createElement('div');
    qrCodeElement.style.marginTop = '32px';
    qrCodeElement.style.paddingTop = '24px';
    qrCodeElement.style.borderTop = '1px solid #e5e7eb';
    qrCodeElement.style.textAlign = 'center';
    qrCodeElement.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 14px; color: #666; font-weight: 500;">
        扫码查看完整账单
      </div>
      <img src="${qrCodeDataURL}" style="display: block; width: 100px; height: 100px; margin: 0 auto;" alt="QR Code" />
    `;
    mainContainer.appendChild(qrCodeElement);
  }

  try {
    // Force a complete layout recalculation before screenshot
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Force layout calculation on main container
          (mainContainer as HTMLElement).offsetHeight;
          
          // Force layout calculation on all elements with person-color
          const colorDots = mainContainer.querySelectorAll('.person-color');
          colorDots.forEach(dot => {
            (dot as HTMLElement).offsetHeight;
          });
          
          // Force layout calculation on all flex containers
          const flexContainers = mainContainer.querySelectorAll('.flex');
          flexContainers.forEach(container => {
            (container as HTMLElement).offsetHeight;
          });
          
          resolve(void 0);
        });
      });
    });
    
    const canvas = await html2canvas(mainContainer as HTMLElement, {
      scale,
      backgroundColor,
      allowTaint: true,
      useCORS: true,
      logging: false,
      imageTimeout: 0,
      removeContainer: false,
      width: (mainContainer as HTMLElement).scrollWidth,
      height: (mainContainer as HTMLElement).scrollHeight,
      onclone: (clonedDoc) => {
        // Force layout recalculation in the cloned document
        const clonedContainer = clonedDoc.querySelector('.max-w-4xl') as HTMLElement;
        if (clonedContainer) {
          clonedContainer.offsetHeight;
          
          // Force layout on all flex containers in the clone
          const flexContainers = clonedContainer.querySelectorAll('.flex');
          flexContainers.forEach(container => {
            (container as HTMLElement).offsetHeight;
          });
          
          // Force layout on all person-color elements in the clone
          const colorDots = clonedContainer.querySelectorAll('.person-color');
          colorDots.forEach(dot => {
            (dot as HTMLElement).offsetHeight;
          });
        }
      },
      ignoreElements: (element) => {
        // Skip buttons, interactive elements, and modal overlays
        return element.tagName === 'BUTTON' || 
               element.classList.contains('btn') ||
               element.classList.contains('sticky') ||
               element.closest('.sticky') !== null ||
               element.classList.contains('fixed') ||
               element.classList.contains('z-50') ||
               element.getAttribute('aria-hidden') === 'true' ||
               element.closest('[role="dialog"]') !== null ||
               element.closest('.modal') !== null ||
               element.getAttribute('data-share-modal') !== null ||
               element.closest('[data-share-modal]') !== null ||
               ((element as HTMLElement).style?.position === 'fixed' && (element as HTMLElement).style?.zIndex === '50');
      }
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image'));
        }
      }, 'image/png', quality);
    });
  } finally {
    // Remove QR code element
    if (qrCodeElement) {
      qrCodeElement.remove();
    }
    
    // Restore original person color dots
    const currentPersonColorDots = document.querySelectorAll('.person-color');
    currentPersonColorDots.forEach((dot, index) => {
      const htmlElement = dot as HTMLElement;
      if (originalDotsStyles[index]) {
        const originalStyles = originalDotsStyles[index];
        htmlElement.style.backgroundColor = originalStyles.backgroundColor;
        htmlElement.style.border = originalStyles.border;
        htmlElement.style.boxShadow = originalStyles.boxShadow;
        htmlElement.style.outline = originalStyles.outline;
        htmlElement.style.position = originalStyles.position;
        htmlElement.style.zIndex = originalStyles.zIndex;
      }
    });

    // Restore original card titles
    const currentCardTitles = document.querySelectorAll('.card-title');
    currentCardTitles.forEach((title, index) => {
      if (originalTitlesHtml[index]) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalTitlesHtml[index];
        const originalElement = tempDiv.firstElementChild as HTMLElement;
        if (originalElement && title.parentNode) {
          title.parentNode.replaceChild(originalElement, title);
        }
      }
    });

    // Restore original problematic elements
    const currentProblematicElements = document.querySelectorAll('[class*="text-transparent"], [class*="bg-clip-text"]');
    currentProblematicElements.forEach((element, index) => {
      if (originalProblematicHtml[index]) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalProblematicHtml[index];
        const originalElement = tempDiv.firstElementChild as HTMLElement;
        if (originalElement && element.parentNode) {
          element.parentNode.replaceChild(originalElement, element);
        }
      }
    });
    
    // Restore original expanded state
    expandButtons.forEach((button, index) => {
      const chevron = button.querySelector('.lucide-chevron-down');
      const isCurrentlyExpanded = chevron?.classList.contains('rotate-180');
      const shouldBeExpanded = originalExpandedState[index];
      
      if (isCurrentlyExpanded !== shouldBeExpanded) {
        (button as HTMLElement).click();
      }
    });
  }
}

export async function generateBillImage(
  billSummary: BillSummary,
  locale: string = 'zh',
  options: ImageGenerationOptions = {}
): Promise<Blob> {
  // Try to use DOM-based generation first
  try {
    return await generateBillImageFromDOM(options);
  } catch (error) {
    console.warn('DOM-based generation failed, falling back to manual generation:', error);
    // Fallback to manual generation if DOM method fails
    return await generateBillImageManual(billSummary, locale, options);
  }
}

async function generateBillImageManual(
  billSummary: BillSummary,
  locale: string = 'zh',
  options: ImageGenerationOptions = {}
): Promise<Blob> {
  const {
    width = 800,
    height = 1200,
    scale = 2,
    backgroundColor = '#ffffff',
    quality = 0.9
  } = options;

  // Create a temporary container for the bill summary
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = `${width}px`;
  container.style.minHeight = `${height}px`;
  container.style.backgroundColor = backgroundColor;
  container.style.padding = '24px';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.5';
  container.style.color = '#1f2937';

  // Generate the HTML content
  const isZh = locale === 'zh';
  const translations = {
    title: isZh ? '费用分摊汇总' : 'Bill Split Summary',
    billOverview: isZh ? '账单总览' : 'Bill Overview',
    personalSplit: isZh ? '人员分摊' : 'Personal Split',
    subtotal: isZh ? '小计' : 'Subtotal',
    tax: isZh ? '税费' : 'Tax',
    tip: isZh ? '小费' : 'Tip',
    total: isZh ? '总计' : 'Total',
    generatedBy: isZh ? '由 AAPay 生成' : 'Generated by AAPay',
    timestamp: isZh ? '生成时间' : 'Generated at'
  };

  const currentTime = new Date().toLocaleString(locale);

  container.innerHTML = `
    <div style="max-width: 100%; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">
          ${translations.title}
        </h1>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          ${translations.generatedBy} • ${translations.timestamp}: ${currentTime}
        </p>
      </div>

      <!-- Bill Overview -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            ${translations.billOverview}
          </h3>
          <div style="space-y: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">${translations.subtotal}:</span>
              <span style="font-weight: 600;">$${billSummary.totalSubtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">${translations.tax}:</span>
              <span style="font-weight: 600;">$${billSummary.totalTax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">${translations.tip}:</span>
              <span style="font-weight: 600;">$${billSummary.totalTip.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #d1d5db; font-size: 16px; font-weight: 700;">
              <span>${translations.total}:</span>
              <span>$${billSummary.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="background: #dbeafe; padding: 20px; border-radius: 12px; border: 1px solid #93c5fd;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            ${translations.personalSplit}
          </h3>
          <div style="space-y: 12px;">
            ${billSummary.personalBills.map(bill => {
              const person = billSummary.people.find(p => p.id === bill.personId);
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${person?.color || '#6b7280'};"></div>
                    <span style="font-weight: 500;">${bill.personName}</span>
                  </div>
                  <span style="font-weight: 600;">$${bill.totalFinal.toFixed(2)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Personal Bills Details -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
        ${billSummary.personalBills.map(bill => {
          const person = billSummary.people.find(p => p.id === bill.personId);
          return `
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${person?.color || '#6b7280'};"></div>
                <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${bill.personName}</h4>
              </div>
              <div style="space-y: 8px;">
                ${bill.items.map(item => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                    <div style="flex: 1;">
                      <div style="font-weight: 500; font-size: 14px; margin-bottom: 2px;">${item.itemName}</div>
                      <div style="font-size: 12px; color: #6b7280;">${item.receiptName}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: 600; font-size: 14px;">$${item.finalShare.toFixed(2)}</div>
                      ${item.share > 1 ? `<div style="font-size: 11px; color: #6b7280;">共${item.share}人</div>` : ''}
                    </div>
                  </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; padding-top: 8px; margin-top: 8px; border-top: 2px solid #e5e7eb; font-size: 16px; font-weight: 700;">
                  <span>${translations.total}:</span>
                  <span>$${bill.totalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale,
      backgroundColor,
      allowTaint: true,
      useCORS: true,
      width: width,
      height: Math.max(height, container.scrollHeight + 48),
      logging: false
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image'));
        }
      }, 'image/png', quality);
    });
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadBillImage(
  billSummary: BillSummary,
  locale: string = 'zh',
  filename?: string,
  shareUrl?: string
): Promise<void> {
  const blob = await generateBillImage(billSummary, locale, { shareUrl });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `bill-summary-${new Date().toISOString().split('T')[0]}.png`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export async function copyBillImageToClipboard(
  billSummary: BillSummary,
  locale: string = 'zh',
  shareUrl?: string
): Promise<boolean> {
  try {
    const blob = await generateBillImage(billSummary, locale, { shareUrl });
    
    if (navigator.clipboard && navigator.clipboard.write) {
      const clipboardItem = new ClipboardItem({
        'image/png': blob
      });
      await navigator.clipboard.write([clipboardItem]);
      return true;
    } else {
      // Fallback: download the image
      await downloadBillImage(billSummary, locale, undefined, shareUrl);
      return false;
    }
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}