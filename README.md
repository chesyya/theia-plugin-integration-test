# Theia 集成测试插件

一个功能强大的 Theia 插件，用于 VSCode API 的集成测试。通过简单的 JSON 配置文件即可测试各种 API 调用。

## 🚀 快速开始

### 1. 启动插件
```bash
cd /root/theia/examples/browser
npm start
```
访问 http://localhost:3000

### 2. 运行测试
- **快捷键**: `Ctrl+Shift+T` 
- **命令面板**: `Ctrl+Shift+P` → 输入 "Run Integration Tests"
- **侧边栏**: 点击烧杯图标 → 点击运行按钮

### 3. 查看结果
测试结果会实时显示在：
- VSCode 消息通知中
- 侧边栏 Integration Tests 视图中
- 生成的 `test-report.json` 文件中

## 📝 编写测试案例

### 测试配置文件位置
将测试配置文件放在 `test-configs/` 目录下，文件名必须以 `.json` 结尾：

```
test-configs/
├── my-api-tests.json        ← 你的测试文件
├── user-interface-tests.json
└── integration-tests.json
```

### 基本测试案例格式

每个 JSON 文件包含一个测试案例数组：

```json
[
  {
    "id": "T001",
    "name": "显示消息测试",
    "description": "测试 VSCode 信息消息显示",
    "method": ["vscode", "window", "showInformationMessage"],
    "input": "Hello World!"
  },
  {
    "id": "T002", 
    "name": "注册命令测试",
    "method": ["vscode", "commands", "registerCommand"],
    "input": [
      "my.command",
      {"_callbackRef": "vscodeCommandCallback"}
    ]
  }
]
```

### 字段说明

| 字段 | 必需 | 说明 | 示例 |
|------|------|------|------|
| `id` | 是 | 测试唯一标识 | `"T001"`, `"API-001"` |
| `name` | 是 | 测试名称 | `"显示消息测试"` |
| `description` | 否 | 详细描述 | `"测试VSCode信息消息显示"` |
| `method` | 是 | API调用链 | `["vscode", "window", "showInformationMessage"]` |
| `input` | 是 | 函数参数 | `"参数"` 或 `["参数1", "参数2"]` |
| `timeout_ms` | 否 | 超时时间(毫秒) | `5000` (默认10000) |
| `_saveAsRef` | 否 | 保存返回值为引用 | `"myPanel"` |
| `expectedResult` | 否 | 期望结果验证 | 见验证部分 |

## 🔗 高级功能：动态对象引用

### 1. 保存对象引用
创建对象并保存供后续使用：

```json
{
  "id": "T001",
  "name": "创建面板",
  "method": ["vscode", "window", "createWebviewPanel"],
  "input": ["myPanel", "My Panel", 1, {"enableScripts": true}],
  "_saveAsRef": "panel"
}
```

### 2. 使用保存的引用
操作之前保存的对象：

```json
{
  "id": "T002",
  "name": "设置面板标题",
  "method": ["_dynamicRef", "panel", "title", "_set"],
  "input": "New Title"
}
```

### 3. 特殊操作
- **设置属性**: `["_dynamicRef", "对象名", "属性", "_set"]`
- **获取属性**: `["_dynamicRef", "对象名", "属性", "_get"]`
- **调用方法**: `["_dynamicRef", "对象名", "方法名"]`

### 完整链式操作示例

```json
[
  {
    "id": "CHAIN-001",
    "name": "步骤1：创建WebviewPanel",
    "method": ["vscode", "window", "createWebviewPanel"],
    "input": ["testPanel", "Test Panel", 1, {"enableScripts": true}],
    "_saveAsRef": "testPanel"
  },
  {
    "id": "CHAIN-002", 
    "name": "步骤2：设置HTML内容",
    "method": ["_dynamicRef", "testPanel", "webview", "html", "_set"],
    "input": "<!DOCTYPE html><html><body><h1>Hello!</h1></body></html>"
  },
  {
    "id": "CHAIN-003",
    "name": "步骤3：显示面板",
    "method": ["_dynamicRef", "testPanel", "reveal"],
    "input": [1]
  },
  {
    "id": "CHAIN-004",
    "name": "步骤4：获取面板类型",
    "method": ["_dynamicRef", "testPanel", "viewType", "_get"],
    "input": []
  }
]
```

## ✅ 结果验证

### 1. 无验证（默认）
不设置 `expectedResult`，执行成功即通过：

```json
{
  "id": "T001",
  "method": ["vscode", "window", "showInformationMessage"],
  "input": "测试消息"
}
```

### 2. 值验证
验证返回值是否等于期望值：

```json
{
  "id": "T002",
  "method": ["_dynamicRef", "panel", "viewType", "_get"],
  "input": [],
  "expectedResult": {
    "type": "value",
    "value": "myPanelType"
  }
}
```

### 3. 类型验证
验证返回值类型：

```json
{
  "expectedResult": {
    "type": "null"        // null | undefined | function
  }
}
```

### 4. 实例验证
验证返回的对象是否为指定类的实例：

```json
{
  "expectedResult": {
    "type": "instance", 
    "instanceOf": "WebviewPanel"
  }
}
```

### 5. 实例属性验证
验证实例的属性值：

```json
{
  "expectedResult": {
    "type": "instance",
    "instanceOf": "StatusBarItem",
    "instanceProperty": {
      "propertyPath": ["alignment"],
      "expectedValue": 1
    }
  }
}
```

### 6. 实例方法调用验证
调用实例方法并验证结果：

```json
{
  "expectedResult": {
    "type": "instance",
    "instanceOf": "Disposable", 
    "instanceMethod": {
      "methodName": "dispose",
      "args": [],
      "expectedReturn": undefined
    }
  }
}
```

### 7. 函数调用验证
验证函数能正常调用：

```json
{
  "expectedResult": {
    "type": "function",
    "functionCall": {
      "args": ["参数1", "参数2"],
      "expectedReturn": "期望返回值"
    }
  }
}
```

## 📋 实用测试案例模板

### API 消息显示测试
```json
[
  {
    "id": "MSG-001",
    "name": "信息消息",
    "method": ["vscode", "window", "showInformationMessage"],
    "input": "这是一条信息消息"
  },
  {
    "id": "MSG-002", 
    "name": "警告消息",
    "method": ["vscode", "window", "showWarningMessage"],
    "input": "这是一条警告消息"
  },
  {
    "id": "MSG-003",
    "name": "错误消息", 
    "method": ["vscode", "window", "showErrorMessage"],
    "input": "这是一条错误消息"
  }
]
```

### 命令注册和调用测试
```json
[
  {
    "id": "CMD-001",
    "name": "注册命令",
    "method": ["vscode", "commands", "registerCommand"],
    "input": [
      "my.testCommand",
      {"_callbackRef": "vscodeCommandCallback"}
    ],
    "expectedResult": {
      "type": "instance",
      "instanceOf": "Disposable"
    }
  }
]
```

### UI组件创建测试
```json
[
  {
    "id": "UI-001",
    "name": "创建状态栏",
    "method": ["vscode", "window", "createStatusBarItem"],
    "input": [1, 100],
    "_saveAsRef": "statusBar",
    "expectedResult": {
      "type": "instance",
      "instanceOf": "StatusBarItem"
    }
  },
  {
    "id": "UI-002",
    "name": "设置状态栏文本",
    "method": ["_dynamicRef", "statusBar", "text", "_set"],
    "input": "状态：就绪",
    "expectedResult": {
      "type": "value", 
      "value": "状态：就绪"
    }
  },
  {
    "id": "UI-003",
    "name": "显示状态栏",
    "method": ["_dynamicRef", "statusBar", "show"],
    "input": []
  }
]
```

### WebviewPanel 完整测试
```json
[
  {
    "id": "WEB-001",
    "name": "创建Webview面板",
    "method": ["vscode", "window", "createWebviewPanel"],
    "input": [
      "testWebview",
      "测试面板",
      1,
      {
        "enableScripts": true,
        "retainContextWhenHidden": true
      }
    ],
    "_saveAsRef": "webPanel",
    "expectedResult": {
      "type": "instance",
      "instanceOf": "WebviewPanel"
    }
  },
  {
    "id": "WEB-002",
    "name": "设置HTML内容",
    "method": ["_dynamicRef", "webPanel", "webview", "html", "_set"],
    "input": "<!DOCTYPE html><html><head><title>测试</title></head><body><h1>Hello Webview!</h1><button onclick=\"vscode.postMessage('Hello')\">点击我</button><script>const vscode = acquireVsCodeApi();</script></body></html>"
  },
  {
    "id": "WEB-003",
    "name": "设置消息处理",
    "method": ["_dynamicRef", "webPanel", "webview", "onDidReceiveMessage"],
    "input": [{"_callbackRef": "webviewMessageHandler"}]
  },
  {
    "id": "WEB-004",
    "name": "显示面板",
    "method": ["_dynamicRef", "webPanel", "reveal"],
    "input": [1]
  }
]
```

## 🎯 最佳实践

### 1. 测试文件组织
- **按功能分组**: `ui-tests.json`, `command-tests.json`, `webview-tests.json`
- **使用有意义的ID**: `UI-001`, `CMD-001`, `WEB-001`
- **清晰的命名**: 测试名称要能说明测试目的

### 2. 测试顺序
- 独立性测试：每个测试应该能独立运行
- 链式测试：使用动态引用进行复杂场景测试
- 清理测试：必要时在测试后进行清理

### 3. 错误处理
- 设置合理的超时时间
- 使用验证确保API按预期工作
- 在description中说明测试的预期行为

### 4. 调试技巧
- 使用`raw_result`查看API实际返回值
- 检查浏览器控制台的详细日志
- 利用`_saveAsRef`保存中间结果供调试

## 📊 当前可用的测试文件

系统预置了3个示例测试文件：

- **`example-vscode-tests.json`**: 8个基础VSCode API测试 (ID: T001-T008)
- **`webview-panel-chain-tests.json`**: 5个WebviewPanel链式操作测试 (ID: WP001-WP005)  
- **`advanced-validation-tests.json`**: 7个高级验证功能测试 (ID: AV001-AV007)

总计：**20个测试用例**

## 🔍 故障排除

### 常见错误及解决方法

1. **"Dynamic object not found"**
   - 确保`_saveAsRef`在`_dynamicRef`之前执行
   - 检查引用名称是否拼写正确

2. **"Method chain cannot be empty"**
   - 检查`method`数组是否为空
   - 确保API路径正确

3. **"Validation failed"**
   - 检查`expectedResult`配置
   - 使用`raw_result`查看实际返回值

4. **"Test timed out"**
   - 增加`timeout_ms`值
   - 检查API是否真的很慢或卡住

### 调试方法
1. 先运行简单的测试案例
2. 逐步添加复杂功能
3. 查看控制台日志了解执行过程
4. 使用侧边栏查看历史测试结果

---

**开发状态**: ✅ 完全实现并可用于生产环境  
**文档版本**: 2025年8月8日