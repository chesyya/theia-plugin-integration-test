# Theia 集成测试插件实施计划

本文档概述了 Theia 集成测试插件的实施计划。该插件将允许用户通过 JSON 配置文件配置 API 调用，执行这些调用，并生成详细的测试报告。

## 1. 项目结构

该插件将位于 `theia/plugins` 目录下的一个新目录中：

```
/root/theia/plugins/
└── integration-test-plugin/
    ├── src/                  # 插件源代码
    │   ├── extension.ts      # 主激活文件，注册命令
    │   ├── testExecutor.ts   # 执行测试的核心逻辑，解析调用链和参数
    │   ├── testReporter.ts   # 生成和管理测试报告的逻辑
    │   ├── types.ts          # 配置和结果的 TypeScript 类型定义
    │   ├── predefinedCallbacks.ts # 定义和导出预定义的回调函数
    │   └── predefinedInstances.ts # 定义和导出预定义的类实例
    ├── test-configs/         # JSON 测试配置文件目录
    │   ├── example-plc-tests.json
    │   ├── example-baosky-tests.json
    │   └── example-vscode-tests.json
    ├── package.json          # 插件元数据和依赖项
    ├── tsconfig.json         # TypeScript 配置
    └── README.md             # 本文档
```

## 2. 配置文件格式

测试配置将定义在 `test-configs/` 目录下的 JSON 文件中。每个文件可以包含一个测试用例数组。每个测试用例的格式如下：

```json
{
  "id": "测试用例的唯一序号",
  "name": "测试用例的描述性名称",
  "description": "对该测试作用的更详细解释。",
  "method": ["rootObject", "level1", "level2", "functionName"],
  "input": { /* 表示函数输入参数的 JSON 对象或数组 */ }
}
```

-   `id`: **新增字段。** 测试用例的唯一标识符，通常建议使用 `文件名前缀-序号` 的格式（例如 `plc-001`），以便于追溯和报告对应。此 ID 将在测试报告中体现。
-   `name`: 测试用例的简洁名称。
-   `description`: 测试目的的详细描述。
-   `method`: 表示调用链的字符串数组。第一个元素将是根对象（例如，“plc”、“baosky”、“vscode”），后跟嵌套属性，最后是要调用的函数名称。例如，`["plc", "a", "b", "func"]` 将转换为 `plc.a.b.func()`。
-   `input`: 包含要传递给 `method` 链中最终函数的参数的 JSON 对象或数组。此字段设计为灵活的：
    *   如果目标函数期望单个参数（例如，一个选项对象），`input` 应该就是该对象。
    *   如果目标函数期望多个参数，`input` 应该是一个 JSON 数组，其中每个元素对应一个参数。

### 处理特殊参数类型（类和函数）

由于 JSON 无法直接表示类实例或函数，我们引入了 `input` 对象（或 `input` 数组的元素）中的特殊字段来引用预定义的实例和回调。这些预定义实体将为了更好的组织而单独管理在专用文件中。

#### 引用预定义的类实例

如果函数参数需要特定的类实例（例如，`WebviewViewProvider`），您可以在 `input` 中定义一个带有 `_instanceRef` 字段的占位符对象，该字段指向 `TestExecutor` 的 `predefinedInstances` 映射中的一个键。

**类实例的 `input` 片段示例：**

```json
{ "_instanceRef": "mockWebviewViewProvider" }
```

#### 引用预定义的回调函数

如果函数参数需要回调函数，您可以在 `input` 中定义一个带有 `_callbackRef` 字段的占位符对象，该字段指向 `TestExecutor` 的 `predefinedCallbacks` 映射中的一个键。

**回调函数的 `input` 片段示例：**

```json
{ "_callbackRef": "vscodeCommandCallback" }
```

## 3. 动态调用链构建

`testExecutor.ts` 将负责根据 `method` 数组动态构建和调用 API。它将在激活期间接收根对象（`plc`、`baosky`、`vscode`）。该过程将涉及：

1.  **根对象解析：** 从 `method` 数组的第一个元素中识别初始对象（例如，`plc`、`baosky` 或 `vscode`）。
2.  **链式属性访问：** 遍历 `method` 数组的其余部分，动态访问属性。例如，如果 `method` 是 `["plc", "a", "b", "func"]`：
    -   从 `currentObject = plc` 开始。
    -   `currentObject = currentObject["a"]`。
    -   `currentObject = currentObject["b"]`。
    -   最终函数将是 `currentObject["func"]`。
3.  **参数解析：** 在调用函数之前，`TestExecutor` 将遍历 `input` 参数。如果对象包含 `_instanceRef` 或 `_callbackRef`，它将被替换为分别从 `predefinedInstances.ts` 和 `predefinedCallbacks.ts` 加载的实际预定义实例或函数。
4.  **函数调用：** 使用处理后的 `input` 参数调用解析后的函数。如果 `input` 是一个数组，它将被展开 (`...`) 为单独的参数；否则，它将作为单个参数传递。

## 4. 测试执行流程

1.  **命令注册：** 一个 Theia 命令（例如，`integrationTestPlugin.runAllTests`）将在 `extension.ts` 中注册。
2.  **目录扫描：** 执行命令时，插件将扫描 `test-configs/` 目录以查找所有 JSON 配置文件。
3.  **逐文件处理：** 每个 JSON 文件将被读取和解析。错误处理将确保格式错误的 文件不会中断整个测试运行。
4.  **测试用例迭代：** 对于 JSON 文件中的每个测试用例：
    -   `method` 数组将用于动态解析和调用目标 API 函数。
    -   `input` 对象/数组将被处理以解析任何 `_instanceRef` 或 `_callbackRef`。
    -   API 调用的结果将被捕获。
5.  **错误隔离：** 每个测试用例执行都将包装在 `try-catch` 块中，以确保一个测试中的失败不会阻止其他测试的运行。

## 5. 测试报告

一个中央 JSON 报告文件（例如，`test-report.json`）将维护在插件目录的根目录中。此文件将存储每次测试运行的结果。

-   **文件创建/追加：** 如果 `test-report.json` 不存在，它将被创建。如果它存在，新的测试结果将追加到其 `testResults` 数组中。
-   **报告结构：** `testResults` 数组中的每个条目将包括：
    -   `id`: **新增字段。** 测试用例的唯一标识符，与配置文件中的 `id` 对应。
    -   `name`: 来自测试配置。
    -   `description`: 来自测试配置。
    -   `method_chain`: 被调用的完整方法链（例如，`plc.a.b.func`）。
    -   `timestamp`: 测试执行时间。
    -   `status`: “SUCCESS”或“FAILURE”。
    -   `message`: 如果失败，则为错误消息；否则为成功消息。
    -   `duration_ms`: 测试执行所需时间（毫秒）。
    -   `raw_result`: API 调用的原始返回值（用于调试）。
-   **摘要：** 报告还将维护一个摘要部分，包含 `total`、`success`、`failed` 计数和 `lastUpdated` 时间戳。

## 6. 示例测试配置

以下是三个示例 JSON 测试配置，演示了不同的 API 调用，包括那些需要类实例和回调函数的调用。

### 示例 1: `vscode.window.showInformationMessage`

此示例演示了一个简单的 API 调用，输入为字符串。

`test-configs/vscode-api-tests.json` (摘录)

```json
  {
    "id": "vscode-001",
    "name": "VSCode: 显示信息消息",
    "description": "使用 vscode.window.showInformationMessage 显示一个简单的信息消息。",
    "method": ["vscode", "window", "showInformationMessage"],
    "input": "来自集成测试插件的问候！"
  }
```

### 示例 2: `vscode.commands.registerCommand`

此示例演示了使用 `_callbackRef` 传递回调函数作为参数。

`test-configs/vscode-api-tests.json` (摘录)

```json
  {
    "id": "vscode-002",
    "name": "VSCode: 注册命令",
    "description": "注册一个触发预定义回调的新 VS Code 命令。",
    "method": ["vscode", "commands", "registerCommand"],
    "input": [
      "integrationTestPlugin.testCommand",
      { "_callbackRef": "vscodeCommandCallback" }
    ]
  }
```

*   `vscodeCommandCallback` 是在 `src/predefinedCallbacks.ts` 中预定义的一个函数。
*   `input` 是一个数组，因为 `registerCommand` 接受多个参数（`commandId`，`callback`）。

### 示例 3: `vscode.window.registerWebviewViewProvider`

此示例演示了使用 `_instanceRef` 传递类实例作为参数，以及一个选项对象。

`test-configs/vscode-api-tests.json` (摘录)

```json
  {
    "id": "vscode-003",
    "name": "VSCode: 注册 Webview 视图提供者",
    "description": "使用预定义的模拟实例注册一个 webview 视图提供者。",
    "method": ["vscode", "window", "registerWebviewViewProvider"],
    "input": [
      "integrationTestPlugin.testWebviewView",
      { "_instanceRef": "mockWebviewViewProvider" },
      {
        "webviewOptions": {
          "retainContextWhenHidden": true
        }
      }
    ]
  }
```

*   `mockWebviewViewProvider` 是在 `src/predefinedInstances.ts` 中预定义的一个 `MockWebviewViewProvider` 实例。
*   `input` 是一个数组，因为 `registerWebviewViewProvider` 接受多个参数（`viewId`，`provider`，`options`）。

## 后续步骤

1.  实现 `src/predefinedCallbacks.ts` 以定义常用的回调函数。
2.  实现 `src/predefinedInstances.ts` 以定义常用的类实例（例如，模拟提供者）。
3.  更新 `src/testExecutor.ts` 以导入并利用这些新文件进行参数解析。
4.  构建插件并将其集成到您的 Theia 应用程序中。
5.  运行测试并验证 `test-report.json` 输出。
6.  根据需要扩展 `predefinedCallbacks.ts` 和 `predefinedInstances.ts` 以应对更复杂的测试场景。
