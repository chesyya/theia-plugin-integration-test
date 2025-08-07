/**
 * Predefined class instances for integration tests
 */
import * as vscode from 'vscode';

// Real WebviewPanel implementation
class RealWebviewPanelManager {
    private static panel: vscode.WebviewPanel | undefined;
    
    static createOrShowPanel(): vscode.WebviewPanel {
        if (RealWebviewPanelManager.panel) {
            RealWebviewPanelManager.panel.reveal(vscode.ViewColumn.One);
            return RealWebviewPanelManager.panel;
        }
        
        // Create webview panel
        const panel = vscode.window.createWebviewPanel(
            'integrationTestPanel',
            '🧪 Integration Test Panel',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        // Set icon for the panel
        panel.iconPath = vscode.Uri.file('/path/to/icon.svg'); // You can set a custom icon here
        
        // Set HTML content through panel.webview.html
        panel.webview.html = this.getWebviewContent();
        
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showInformationMessage(`📱 来自Test Webview Panel的消息: ${message.text}`);
                    return;
                case 'showSuccess':
                    vscode.window.showInformationMessage(`✅ ${message.text}`);
                    return;
                case 'showWarning':
                    vscode.window.showWarningMessage(`⚠️ ${message.text}`);
                    return;
                case 'showError':
                    vscode.window.showErrorMessage(`❌ ${message.text}`);
                    return;
                case 'runTests':
                    vscode.commands.executeCommand('integrationTestPlugin.runAllTests');
                    return;
            }
        });
        
        // Handle panel disposal
        panel.onDidDispose(() => {
            RealWebviewPanelManager.panel = undefined;
        });
        
        RealWebviewPanelManager.panel = panel;
        console.log('Real WebviewPanel created and HTML content set via panel.webview.html');
        return panel;
    }
    
    private static getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Webview</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 15px; 
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 15px;
        }
        .status-card { 
            margin: 10px 0; 
            padding: 12px; 
            background: var(--vscode-textBlockQuote-background); 
            border-left: 4px solid var(--vscode-textLink-foreground);
            border-radius: 4px;
        }
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 15px 0;
        }
        button { 
            padding: 10px 15px; 
            background: var(--vscode-button-background); 
            color: var(--vscode-button-foreground); 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
            font-size: 13px;
            transition: background-color 0.2s;
        }
        button:hover { 
            background: var(--vscode-button-hoverBackground); 
        }
        .success-btn {
            background: #1e7e34;
        }
        .warning-btn {
            background: #e0a800;
        }
        .error-btn {
            background: #dc3545;
        }
        .run-btn {
            background: #007acc;
            font-weight: bold;
        }
        .info-section {
            margin-top: 20px;
            padding: 10px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🧪 Integration Test Panel</h2>
    </div>
    
    <div class="status-card">
        ✅ WebviewViewProvider 注册成功！这是一个真实的 WebviewViewProvider 实现。
    </div>
    
    <div class="button-group">
        <button class="run-btn" onclick="runTests()">🚀 运行集成测试</button>
        <button onclick="sendMessage()">📱 发送普通消息</button>
        <button class="success-btn" onclick="showSuccess()">✅ 显示成功消息</button>
        <button class="warning-btn" onclick="showWarning()">⚠️ 显示警告消息</button>
        <button class="error-btn" onclick="showError()">❌ 显示错误消息</button>
    </div>
    
    <div class="info-section">
        <strong>📋 面板功能说明：</strong><br>
        • 🚀 运行测试：触发完整的集成测试流程<br>
        • 📱 消息测试：测试 Webview 与 VSCode 的通信<br>
        • ✅⚠️❌ 消息类型：测试不同类型的消息显示<br>
        • 此面板证明 WebviewViewProvider 正确注册并工作
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage() {
            vscode.postMessage({
                command: 'alert',
                text: 'Hello from Integration Test Webview! 通信测试成功！'
            });
        }
        
        function showSuccess() {
            vscode.postMessage({
                command: 'showSuccess',
                text: 'Webview 成功消息测试 - 这是一个成功类型的消息！'
            });
        }
        
        function showWarning() {
            vscode.postMessage({
                command: 'showWarning',
                text: 'Webview 警告消息测试 - 这是一个警告类型的消息！'
            });
        }
        
        function showError() {
            vscode.postMessage({
                command: 'showError',
                text: 'Webview 错误消息测试 - 这是一个错误类型的消息！'
            });
        }
        
        function runTests() {
            vscode.postMessage({
                command: 'runTests'
            });
        }
    </script>
</body>
</html>`;
    }
}

// Mock TreeDataProvider implementation
class MockTreeDataProvider {
    getTreeItem(element: any): any {
        return {
            label: `Test Item: ${element}`,
            collapsibleState: 0
        };
    }

    getChildren(element?: any): any[] {
        return element ? [] : ['item1', 'item2', 'item3'];
    }
}

// Mock EventEmitter implementation
class MockEventEmitter {
    private listeners: Map<string, Function[]> = new Map();

    on(event: string, listener: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
    }

    emit(event: string, ...args: any[]): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(listener => listener(...args));
        }
    }
}

export const predefinedInstances = {
    realWebviewPanelManager: RealWebviewPanelManager,
    mockTreeDataProvider: new MockTreeDataProvider(),
    mockEventEmitter: new MockEventEmitter()
};