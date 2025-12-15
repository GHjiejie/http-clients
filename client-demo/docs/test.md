## 背景
- 新增模型、编辑模型、更新模型三个弹窗复用了类似的表单字段，但目前缺少统一的校验和禁用控制，易出现“保存/启动无校验直接请求”的问题。
- 现有 `useModelFormValidation` 已提供基础/服务配置校验规则，但各弹窗未接入；通过继承抽象公用逻辑，可以在不重复编写校验逻辑的前提下，为三个弹窗提供一致的校验与交互体验。

## 目标
- 在不改动校验规则的前提下，复用 `useModelFormValidation`，为新增/编辑/更新弹窗接入校验。
- 通过继承（抽象类）约束三类表单的校验流程和交互（含 loading、防重复提交）。
- 保持扩展性：新表单只需继承基础类并实现少量接口。

## 方案总览
1. **抽象基类**：封装表单数据/额外数据引用、校验 hook、通用的 `validateAndToast`、`withLoading`、`reset` 等能力。
2. **派生类**：新增模型需要基础字段校验（模型名/路径/类型等），编辑/更新只需要服务配置校验；用不同的 `includeBasicValidation` 传参体现差异。
3. **组件侧接入**：在提交前调用 `validator.validateAndToast()`，失败直接返回；成功后通过 `withLoading` 包裹异步请求，确保按钮 loading 状态与请求生命周期一致。

## 目录与类设计
- `src/pages/ModelManage/validators/BaseModelFormValidator.ts`
  - 依赖：`useModelFormValidation`、`ElMessage`。
  - 负责：持有 `formDataRef`、`extraDataRef`、`validator`（由 `useModelFormValidation` 创建）、`isSubmitting` 状态。
  - 提供：
    - `validateAndToast(): boolean`：校验失败弹出首条错误并返回 false。
    - `async withLoading(task: () => Promise<void>): Promise<void>`：统一 loading 生命周期、防重复提交。
    - `reset()`：重置 `isSubmitting`。
    - `protected createValidator(includeBasicValidation: boolean)`：子类可覆盖参数。
- `AddModelFormValidator extends BaseModelFormValidator`
  - `includeBasicValidation = true`，用于新增场景。
  - 可挂载到 “保存配置” / “立即启动” 按钮，分别复用同一校验。
- `EditModelFormValidator`、`UpdateModelFormValidator` 继承基类
  - `includeBasicValidation = false`（仅部署配置相关校验）。
  - 若有特定字段差异，可在子类中覆写 `validateAndToast` 或追加规则。

## 关键代码示例
> 仅示例核心片段，实际可按需拆分文件名。

```ts
// src/pages/ModelManage/validators/BaseModelFormValidator.ts
import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useModelFormValidation, type ExtraValidationData, type ModelFormData } from '../useModelFormValidation'

export abstract class BaseModelFormValidator {
  protected formDataRef: Ref<ModelFormData | undefined>
  protected extraDataRef: Ref<ExtraValidationData | undefined>
  protected isSubmitting = ref(false)
  private validator: ReturnType<typeof useModelFormValidation>

  constructor(opts: {
    formDataRef: Ref<ModelFormData | undefined>
    extraDataRef: Ref<ExtraValidationData | undefined>
    includeBasicValidation?: boolean
  }) {
    this.formDataRef = opts.formDataRef
    this.extraDataRef = opts.extraDataRef
    this.validator = useModelFormValidation(this.formDataRef, this.extraDataRef, !!opts.includeBasicValidation)
  }

  validateAndToast(): boolean {
    const errors = this.validator.validateForm()
    if (errors.length) {
      ElMessage.warning(errors[0])
      return false
    }
    return true
  }

  async withLoading(task: () => Promise<void>) {
    if (this.isSubmitting.value) return
    this.isSubmitting.value = true
    try {
      await task()
    } finally {
      this.isSubmitting.value = false
    }
  }

  reset() {
    this.isSubmitting.value = false
  }
}

// Add/Edit/Update 可按需扩展
export class AddModelFormValidator extends BaseModelFormValidator {
  constructor(formDataRef: Ref<ModelFormData | undefined>, extraDataRef: Ref<ExtraValidationData | undefined>) {
    super({ formDataRef, extraDataRef, includeBasicValidation: true })
  }
}
export class EditModelFormValidator extends BaseModelFormValidator {
  constructor(formDataRef: Ref<ModelFormData | undefined>, extraDataRef: Ref<ExtraValidationData | undefined>) {
    super({ formDataRef, extraDataRef, includeBasicValidation: false })
  }
}
```

## 组件接入示例（以新增弹窗为例）
```ts
// AddModel.vue (片段)
import { AddModelFormValidator } from './validators/BaseModelFormValidator'

const formValidator = new AddModelFormValidator(modelFormData, extraValidationData)

const handleSaveConfig = async () => {
  if (!formValidator.validateAndToast()) return
  await formValidator.withLoading(async () => {
    // 原 saveModel 逻辑
    await emitSaveModel()
  })
}

const handleQuickStart = async () => {
  if (!formValidator.validateAndToast()) return
  await formValidator.withLoading(async () => {
    await emitQuickStart()
  })
}

onBeforeUnmount(() => formValidator.reset())
```
- 编辑/更新弹窗只需将 `AddModelFormValidator` 替换为对应子类即可，复用同样的调用方式。
- 如果按钮已有外部 loading 状态（如 `isSaving` / `isQuickStarting`），可使用 `formValidator.isSubmitting` 替代或二者同步，避免多重状态源。

## 兼容与扩展
- **规则来源**：仍然复用 `useModelFormValidation` 内的规则；后续如果新增字段，只需在原 hook 中补充规则，继承链自动生效。
- **差异化校验**：子类可覆写 `validateAndToast` 追加私有规则或调用父类后再补充自定义校验。
- **外部提示方式**：默认 `ElMessage`，如需表单内联提示，可在基类中注入回调替换。
- **并发保护**：`withLoading` 已统一防重复提交；若需要按钮级 loading，直接绑定 `formValidator.isSubmitting` 即可。

## 落地步骤（建议）
1. 在 `src/pages/ModelManage/validators/` 下新增基类与子类文件。
2. 新增/编辑/更新三个组件中：
   - 创建对应 Validator 实例，传入当前表单/额外数据的 ref。
   - 提交入口统一调用 `validateAndToast` + `withLoading`。
   - 将按钮 `loading` 绑定到 `validator.isSubmitting` 或保留现有状态与之同步。
3. 回归测试：
   - 覆盖新增、编辑、更新三弹窗的保存/启动操作。
   - 针对不同计算资源模式（算力池/协加速卡/CPU）校验缺失字段时应阻止请求并提示。
   - 网络慢场景下确认按钮 loading 与请求生命周期匹配。

## 风险与规避
- **双重状态源**：若组件已有 `isSaving`/`isQuickStarting`，需决定是否用 `isSubmitting` 统一，以免状态不同步。
- **规则缺口**：现有 hook 不含字段级 UI 高亮，如需逐字段提示，需要在组件内补充 `getFieldError` 绑定。
- **兼容旧逻辑**：初次接入时建议逐个弹窗灰度，确保 API 调用顺序与原来一致。
