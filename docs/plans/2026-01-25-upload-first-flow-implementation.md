# Upload-First Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure BillShare from "people-first" to "upload-first" flow, supporting 0-1 person bill viewing mode.

**Architecture:** Remove SetupStep and StepIndicator components. Merge people management into InputStep as a collapsible section. Add conditional logic for 0-1 person mode that skips Assign and shows simplified Summary.

**Tech Stack:** Next.js 14, React, Zustand, next-intl, Tailwind CSS

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `src/types/index.ts:64`

**Step 1: Update currentStep type**

Change line 64 from:
```typescript
currentStep: 'setup' | 'input' | 'assign' | 'summary';
```

To:
```typescript
currentStep: 'input' | 'assign' | 'summary';
```

**Step 2: Verify no TypeScript errors**

Run: `npm run build 2>&1 | head -50`

Expected: Build errors related to 'setup' references (we'll fix these in subsequent tasks)

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor: remove 'setup' from currentStep type"
```

---

## Task 2: Update Store Initial State and Reset

**Files:**
- Modify: `src/store/index.ts:92,119,182,538`

**Step 1: Change initial currentStep**

At line 92, change:
```typescript
currentStep: 'setup',
```

To:
```typescript
currentStep: 'input',
```

**Step 2: Update saveSession persistData default**

At line 119, change:
```typescript
currentStep: state.currentStep || 'setup'
```

To:
```typescript
currentStep: state.currentStep || 'input'
```

**Step 3: Update loadSessionData default**

At line 182, change:
```typescript
currentStep: data.currentStep || 'setup',
```

To:
```typescript
currentStep: data.currentStep || 'input',
```

**Step 4: Update reset function**

At line 538, change:
```typescript
currentStep: 'setup',
```

To:
```typescript
currentStep: 'input',
```

**Step 5: Commit**

```bash
git add src/store/index.ts
git commit -m "refactor: change initial currentStep from 'setup' to 'input'"
```

---

## Task 3: Update i18n Messages (Chinese)

**Files:**
- Modify: `src/messages/zh.json`

**Step 1: Add new inputStep messages**

Find the `"inputStep"` section and replace it with:
```json
"inputStep": {
  "title": "输入账单条目",
  "description": "添加一张或多张收据，并输入每个条目的名称和价格。",
  "aiRecognition": "AI识别",
  "aiRecognizing": "识别中...",
  "manualAdd": "手动添加",
  "orManualInput": "或 手动输入",
  "emptyStateTitle": "上传账单开始",
  "emptyStateDescription": "拍照或上传收据图片，AI 将自动识别账单内容",
  "nextButton": "下一步：分配条目",
  "assignItems": "分配账单",
  "viewSummary": "查看汇总",
  "uploadReceipt": "上传收据图片",
  "splitSection": "需要分账？点击添加人员",
  "splitSectionExpanded": "分账人员",
  "addPersonPlaceholder": "输入人员姓名",
  "backToHome": "返回首页"
},
```

**Step 2: Add new summaryStep messages for bill-only mode**

Find the `"summaryStep"` section and add these new keys:
```json
"summaryStep": {
  "title": "费用汇总",
  "titleBillOnly": "账单明细",
  "description": "以下是每个人需要支付的最终金额",
  "descriptionBillOnly": "以下是您的账单明细",
  "billOverview": "账单总览",
  ...existing keys...
},
```

**Step 3: Commit**

```bash
git add src/messages/zh.json
git commit -m "i18n: add Chinese messages for upload-first flow"
```

---

## Task 4: Update i18n Messages (English)

**Files:**
- Modify: `src/messages/en.json`

**Step 1: Add new inputStep messages**

Find the `"inputStep"` section and replace it with:
```json
"inputStep": {
  "title": "Input Bill Items",
  "description": "Add one or more receipts and input the name and price for each item.",
  "aiRecognition": "AI Recognition",
  "aiRecognizing": "Recognizing...",
  "manualAdd": "Manual Add",
  "orManualInput": "or enter manually",
  "emptyStateTitle": "Upload a receipt to start",
  "emptyStateDescription": "Take a photo or upload a receipt image, AI will automatically recognize the bill",
  "nextButton": "Next: Assign Items",
  "assignItems": "Assign Items",
  "viewSummary": "View Summary",
  "uploadReceipt": "Upload receipt image",
  "splitSection": "Need to split? Add people",
  "splitSectionExpanded": "Split with",
  "addPersonPlaceholder": "Enter person's name",
  "backToHome": "Back to Home"
},
```

**Step 2: Add new summaryStep messages for bill-only mode**

Find the `"summaryStep"` section and add these new keys:
```json
"summaryStep": {
  "title": "Cost Summary",
  "titleBillOnly": "Bill Details",
  "description": "Here's the final amount each person needs to pay",
  "descriptionBillOnly": "Here are your bill details",
  "billOverview": "Bill Overview",
  ...existing keys...
},
```

**Step 3: Commit**

```bash
git add src/messages/en.json
git commit -m "i18n: add English messages for upload-first flow"
```

---

## Task 5: Rewrite InputStep Component

**Files:**
- Modify: `src/components/InputStep.tsx`

**Step 1: Replace entire InputStep component**

Replace the entire file content with:

```tsx
import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Plus, Receipt, ArrowRight, Sparkles, AlertCircle, RotateCcw, ChevronDown, Trash2, User } from 'lucide-react';
import { useAppStore } from '../store';
import { ReceiptCard } from './ReceiptCard';

const InputStep: React.FC = () => {
  const t = useTranslations('inputStep');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;
  const {
    receipts,
    people,
    addReceipt,
    addPerson,
    removePerson,
    setCurrentStep,
    processReceiptImage,
    isAiProcessing,
    error,
    setError
  } = useAppStore();
  const tAI = useTranslations('aiRecognition');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [isSplitSectionExpanded, setIsSplitSectionExpanded] = useState(false);

  const handleNext = () => {
    if (people.length >= 2) {
      setCurrentStep('assign');
    } else {
      setCurrentStep('summary');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processReceiptImage('', file, locale);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRetry = () => {
    setError(null);
    handleUploadClick();
  };

  const handleDismissError = () => {
    setError(null);
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewPersonName('');
    }
  };

  const getErrorMessage = (errorType: string) => {
    const errorKey = `errors.${errorType}`;
    try {
      return tAI(errorKey);
    } catch (e) {
      return errorType;
    }
  };

  const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);
  const hasReceipts = receipts.length > 0;

  // Determine button text based on people count
  const nextButtonText = people.length >= 2 ? t('assignItems') : t('viewSummary');

  return (
    <div className="max-w-4xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="sr-only"
        aria-label={t('uploadReceipt')}
      />

      {/* Error alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-red-800 mb-1">{tAI('errorTitle')}</h4>
              <p className="text-sm text-red-700 mb-3">{getErrorMessage(error)}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  disabled={isAiProcessing}
                  className="inline-flex items-center px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  {tAI('retry')}
                </button>
                <button
                  onClick={handleDismissError}
                  className="inline-flex items-center px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                >
                  {tAI('dismiss')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasReceipts ? (
        /* Empty state - minimal upload UI */
        <div className="text-center py-16 sm:py-24">
          <Receipt className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-6 sm:mb-8 text-gray-300" aria-hidden="true" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">{t('emptyStateTitle')}</h3>
          <p className="text-gray-500 text-sm sm:text-base mb-8 sm:mb-10 px-4 max-w-md mx-auto">{t('emptyStateDescription')}</p>

          <button
            onClick={handleUploadClick}
            disabled={isAiProcessing}
            className="inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg sm:text-xl border border-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 mr-3" aria-hidden="true" />
            {isAiProcessing ? t('aiRecognizing') : t('aiRecognition')}
          </button>

          <button
            onClick={() => addReceipt(tCommon('receipt'))}
            className="block mx-auto mt-4 text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
          >
            {t('orManualInput')}
          </button>
        </div>
      ) : (
        /* Has receipts - show list */
        <div className="space-y-6">
          {/* Receipt cards */}
          {[...receipts].reverse().map((receipt, index) => (
            <div key={receipt.id} className="animation-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <ReceiptCard receipt={receipt} />
            </div>
          ))}

          {/* Add more receipts buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isAiProcessing}
              className="inline-flex items-center justify-center px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm border border-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>{isAiProcessing ? t('aiRecognizing') : t('aiRecognition')}</span>
            </button>
            <button
              onClick={() => addReceipt(tCommon('receipt'))}
              className="inline-flex items-center justify-center px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm border border-blue-600 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>{t('manualAdd')}</span>
            </button>
          </div>

          {/* Collapsible split section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsSplitSectionExpanded(!isSplitSectionExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-500 mr-2" aria-hidden="true" />
                <span className="font-medium text-gray-700">
                  {isSplitSectionExpanded ? t('splitSectionExpanded') : t('splitSection')}
                </span>
                {people.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {people.length}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isSplitSectionExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isSplitSectionExpanded && (
              <div className="p-4 border-t border-gray-200">
                {/* Add person form */}
                <form onSubmit={handleAddPerson} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="personName"
                      autoComplete="name"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder={t('addPersonPlaceholder')}
                      className="input flex-1 text-base"
                      maxLength={20}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-md"
                      disabled={!newPersonName.trim()}
                      aria-label={tCommon('add')}
                    >
                      <Plus className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </form>

                {/* People list */}
                {people.length > 0 ? (
                  <div className="space-y-2">
                    {people.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <div
                            className="person-color"
                            style={{ backgroundColor: person.color }}
                          />
                          <span className="font-medium text-sm truncate">{person.name}</span>
                        </div>
                        <button
                          onClick={() => removePerson(person.id)}
                          className="btn btn-ghost btn-sm ml-3 flex-shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`${tCommon('delete')} ${person.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    {t('splitSection')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              className="btn btn-primary btn-lg"
              disabled={totalItems === 0}
              aria-label={nextButtonText}
            >
              <span className="mr-2">{nextButtonText}</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputStep;
```

**Step 2: Run build to check for errors**

Run: `npm run build 2>&1 | head -50`

Expected: May have errors related to other files still referencing 'setup', but InputStep should compile

**Step 3: Commit**

```bash
git add src/components/InputStep.tsx
git commit -m "feat: rewrite InputStep as upload-first landing page with collapsible people section"
```

---

## Task 6: Update SummaryStep for Bill-Only Mode

**Files:**
- Modify: `src/components/SummaryStep.tsx`

**Step 1: Add bill-only mode detection and rendering**

After line 23 (`const billSummary = getBillSummary();`), add:
```typescript
const people = useAppStore(state => state.people);
const isBillOnlyMode = people.length < 2;
```

**Step 2: Update the null billSummary handling for bill-only mode**

Replace the existing null check block (lines 192-211) with:
```tsx
// For bill-only mode, we don't need getBillSummary
const receipts = useAppStore(state => state.receipts);

if (!isBillOnlyMode && !billSummary) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <p className="text-gray-500">{t('cannotGenerate')}</p>
            <button
              onClick={() => setCurrentStep('input')}
              className="btn btn-primary btn-md mt-4"
              aria-label={t('restartButton')}
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add bill-only mode rendering**

Before the main return statement, add a conditional return for bill-only mode:
```tsx
if (isBillOnlyMode) {
  const grandTotal = receipts.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Bill cards */}
      <div className="space-y-6 mb-6">
        {receipts.map(receipt => (
          <div key={receipt.id} className="card">
            <div className="card-header">
              <h3 className="card-title">{receipt.name}</h3>
            </div>
            <div className="card-content">
              <div className="space-y-2">
                {receipt.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-600">{item.name}</span>
                    <CurrencyDisplay usdAmount={item.originalPrice || 0} />
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{tCommon('subtotal')}</span>
                  <span>${receipt.subtotal.toFixed(2)}</span>
                </div>
                {receipt.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{tCommon('tax')}</span>
                    <span>${receipt.tax.toFixed(2)}</span>
                  </div>
                )}
                {receipt.tip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{tCommon('tip')}</span>
                    <span>${receipt.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>{tCommon('total')}</span>
                  <CurrencyDisplay usdAmount={receipt.total} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grand total */}
      {receipts.length > 1 && (
        <div className="card mb-6">
          <div className="card-content">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>{t('grandTotal')}</span>
              <CurrencyDisplay usdAmount={grandTotal} />
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-start">
        <button
          onClick={() => setCurrentStep('input')}
          className="btn btn-secondary btn-md"
          aria-label={tCommon('back')}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Update back button in split mode to go to 'input'**

Find `handleEditAssignments` function and update it:
```typescript
const handleEditAssignments = () => {
  setCurrentStep('assign');
};

const handleBackToInput = () => {
  setCurrentStep('input');
};
```

**Step 5: Commit**

```bash
git add src/components/SummaryStep.tsx
git commit -m "feat: add bill-only mode to SummaryStep for 0-1 person"
```

---

## Task 7: Update Main Page Component

**Files:**
- Modify: `src/app/[locale]/[uuid]/page.tsx`

**Step 1: Remove SetupStep and StepIndicator imports**

Remove these lines (8-9):
```typescript
import StepIndicator from '../../../components/StepIndicator'
import SetupStep from '../../../components/SetupStep'
```

**Step 2: Remove StepIndicator state and JSX**

Remove line 26:
```typescript
const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true)
```

And the `handleHeaderToggle` callback.

**Step 3: Update step logic in useEffect**

Replace the step logic useEffect (lines 146-175) with:
```typescript
useEffect(() => {
  if (isLoading || sessionError) return;

  const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);

  // If on assign step but no items, go back to input
  if (currentStep === 'assign' && totalItems === 0) {
    setCurrentStep('input');
    return;
  }

  // If on assign step but less than 2 people, go to summary (bill-only mode)
  if (currentStep === 'assign' && people.length < 2) {
    setCurrentStep('summary');
    return;
  }

  // If on summary with 2+ people, check all items are assigned
  if (currentStep === 'summary' && people.length >= 2) {
    const isAllAssigned = receipts.flatMap(r => r.items).every(item => item.assignedTo.length > 0);
    if (totalItems > 0 && !isAllAssigned) {
      setCurrentStep('assign');
      return;
    }
  }
}, [currentStep, people.length, receipts, setCurrentStep, isLoading, sessionError]);
```

**Step 4: Update renderStep function**

Replace the renderStep function with:
```typescript
const renderStep = () => {
  switch (currentStep) {
    case 'input':
      return <InputStep />;
    case 'assign':
      return <AssignStep />;
    case 'summary':
      return <SummaryStep />;
    default:
      return <InputStep />;
  }
};
```

**Step 5: Remove StepIndicator from JSX**

Remove the entire sticky StepIndicator section (lines 247-261):
```tsx
{/* Sticky 步骤指示器 - 内容区域顶部固定 */}
<div className={`sticky z-30 ...`}>
  ...
</div>
```

**Step 6: Simplify header toggle (remove dependency on step indicator)**

Update the CollapsibleHeader section if needed.

**Step 7: Commit**

```bash
git add src/app/[locale]/[uuid]/page.tsx
git commit -m "refactor: remove StepIndicator and SetupStep from main page"
```

---

## Task 8: Delete Unused Components

**Files:**
- Delete: `src/components/SetupStep.tsx`
- Delete: `src/components/StepIndicator.tsx`

**Step 1: Delete SetupStep.tsx**

Run: `rm src/components/SetupStep.tsx`

**Step 2: Delete StepIndicator.tsx**

Run: `rm src/components/StepIndicator.tsx`

**Step 3: Search for any remaining references**

Run: `rg -l "SetupStep|StepIndicator" src/`

Expected: No matches (or only this implementation plan if stored in src)

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete unused SetupStep and StepIndicator components"
```

---

## Task 9: Update AssignStep Back Button

**Files:**
- Modify: `src/components/AssignStep.tsx`

**Step 1: Verify handleBack already goes to 'input'**

Check line 35-37:
```typescript
const handleBack = () => {
  setCurrentStep('input');
};
```

This should already be correct. If not, update it.

**Step 2: Commit (if changes needed)**

```bash
git add src/components/AssignStep.tsx
git commit -m "fix: ensure AssignStep back button goes to input"
```

---

## Task 10: Run Full Build and Test

**Step 1: Run build**

Run: `npm run build`

Expected: Build succeeds with no errors

**Step 2: Run dev server and manual test**

Run: `npm run dev`

Test the following flows:
1. Fresh visit → see upload UI → upload receipt → see receipt card → click "View Summary" → see bill details
2. Fresh visit → upload receipt → expand people section → add 2 people → click "Assign Items" → assign → see split summary
3. From summary (bill-only) → click back → return to input page
4. From summary (split mode) → click back → return to assign page

**Step 3: Final commit**

```bash
git add -A
git commit -m "test: verify upload-first flow works correctly"
```

---

## Task 11: Update Root Page Redirect (if needed)

**Files:**
- Check: `src/app/[locale]/page.tsx`

**Step 1: Verify redirect behavior**

The root page should redirect to a new session. Verify it doesn't reference 'setup' step.

**Step 2: Commit if changes needed**

---

## Summary Checklist

- [ ] Task 1: Update type definitions
- [ ] Task 2: Update store initial state
- [ ] Task 3: Update Chinese i18n messages
- [ ] Task 4: Update English i18n messages
- [ ] Task 5: Rewrite InputStep component
- [ ] Task 6: Update SummaryStep for bill-only mode
- [ ] Task 7: Update main page component
- [ ] Task 8: Delete unused components
- [ ] Task 9: Verify AssignStep back button
- [ ] Task 10: Full build and test
- [ ] Task 11: Check root page redirect
