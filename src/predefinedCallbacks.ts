/**
 * Predefined callback functions for integration tests
 */
import * as vscode from 'vscode';

export const predefinedCallbacks = {
    vscodeCommandCallback: () => {
        vscode.window.showInformationMessage('第一个注册的命令被触发了！');
        console.log('VSCode command callback executed from integration test plugin');
    },
    
    secondVscodeCommandCallback: () => {
        vscode.window.showInformationMessage('第二个注册的命令被成功触发了！这证明命令注册成功！');
        console.log('Second VSCode command callback executed from integration test plugin');
    },
    
    genericTestCallback: (...args: any[]) => {
        console.log('Generic test callback executed with args:', args);
    },

    webviewMessageHandler: (message: any) => {
        console.log('📨 Webview message received via test chain:', message);
        switch (message.command) {
            case 'alert':
                vscode.window.showInformationMessage(`📱 来自测试链Webview的消息: ${message.text}`);
                break;
            case 'showSuccess':
                vscode.window.showInformationMessage(`✅ ${message.text}`);
                break;
            case 'showWarning':
                vscode.window.showWarningMessage(`⚠️ ${message.text}`);
                break;
            case 'showError':
                vscode.window.showErrorMessage(`❌ ${message.text}`);
                break;
            case 'runTests':
                vscode.commands.executeCommand('integrationTestPlugin.runAllTests');
                break;
            default:
                vscode.window.showInformationMessage(`🔄 未知消息类型: ${message.command}`);
        }
    }
};