"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.predefinedCallbacks = void 0;
/**
 * Predefined callback functions for integration tests
 */
const vscode = __importStar(require("vscode"));
exports.predefinedCallbacks = {
    vscodeCommandCallback: () => {
        vscode.window.showInformationMessage('第一个注册的命令被触发了！');
        console.log('VSCode command callback executed from integration test plugin');
    },
    secondVscodeCommandCallback: () => {
        vscode.window.showInformationMessage('第二个注册的命令被成功触发了！这证明命令注册成功！');
        console.log('Second VSCode command callback executed from integration test plugin');
    },
    genericTestCallback: (...args) => {
        console.log('Generic test callback executed with args:', args);
    },
    webviewMessageHandler: (message) => {
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
//# sourceMappingURL=predefinedCallbacks.js.map