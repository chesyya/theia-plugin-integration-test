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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const testExecutor_1 = require("./testExecutor");
const testReporter_1 = require("./testReporter");
const testViewProvider_1 = require("./testViewProvider");
const predefinedInstances_1 = require("./predefinedInstances");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const testConfigsDir = path.join(context.extensionPath, 'test-configs');
        const testReportPath = path.join(context.extensionPath, 'test-report.json');
        // Initialize TestExecutor with only vscode API
        const testExecutor = new testExecutor_1.TestExecutor(vscode);
        const testReporter = new testReporter_1.TestReporter(testReportPath);
        // Create and register tree view provider
        const testViewProvider = new testViewProvider_1.TestViewProvider(testReporter);
        const treeView = vscode.window.createTreeView('integrationTestView', {
            treeDataProvider: testViewProvider,
            showCollapseAll: false
        });
        context.subscriptions.push(treeView);
        // Register command to open Webview Panel
        const openWebviewPanelCommand = vscode.commands.registerCommand('integrationTestPlugin.openWebviewPanel', () => {
            // Create or show webview panel and set HTML content via panel.webview.html
            const panel = predefinedInstances_1.predefinedInstances.realWebviewPanelManager.createOrShowPanel();
            return panel;
        });
        context.subscriptions.push(openWebviewPanelCommand);
        // Register command to run all tests
        const runAllTestsCommand = vscode.commands.registerCommand('integrationTestPlugin.runAllTests', () => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = `session_${Date.now()}`;
                vscode.window.showInformationMessage('🚀 开始执行集成测试...');
                let completedCount = 0;
                let totalTests = 0;
                // 先计算总测试数
                const files = fs.readdirSync(testConfigsDir).filter((file) => file.endsWith('.json'));
                for (const file of files) {
                    const filePath = path.join(testConfigsDir, file);
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const testConfigs = JSON.parse(fileContent);
                    totalTests += testConfigs.length;
                }
                const results = yield testExecutor.runAllTestsInDirectory(testConfigsDir, 
                // 单个测试完成的回调
                (result) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    completedCount++;
                    // 立即写入报告
                    yield testReporter.addSingleTestResult(result, sessionId);
                    // 刷新视图
                    testViewProvider.refresh();
                    // 显示单个测试结果，带更丰富的图标和格式
                    const statusIcon = result.status === 'SUCCESS' ? '✅' : '❌';
                    const durationText = result.duration_ms > 0 ? ` (${result.duration_ms}ms)` : '';
                    const progressText = `[${completedCount}/${totalTests}]`;
                    let message;
                    if (result.status === 'SUCCESS') {
                        message = `${statusIcon} ${progressText} ${result.name}${durationText}`;
                        vscode.window.showInformationMessage(message);
                    }
                    else {
                        const errorIcon = ((_a = result.message) === null || _a === void 0 ? void 0 : _a.includes('timed out')) ? '⏰' : '💥';
                        const errorMessage = ((_b = result.message) === null || _b === void 0 ? void 0 : _b.includes('timed out')) ? '执行超时' : result.message;
                        message = `${statusIcon}${errorIcon} ${progressText} ${result.name}${durationText}`;
                        vscode.window.showErrorMessage(`${message} - ${errorMessage}`);
                    }
                }), 
                // 测试开始的回调
                (testName) => {
                    const progressIcon = '⚡';
                    vscode.window.showInformationMessage(`${progressIcon} 正在执行: ${testName}...`);
                });
                // 显示最终结果，更丰富的图标和格式
                const summary = testReporter.getReportSummary();
                if (summary) {
                    const successRate = Math.round((summary.success / summary.total) * 100);
                    const finalIcon = summary.failed === 0 ? '🎉' : (summary.success > summary.failed ? '⚠️' : '💔');
                    const statsIcon = '📊';
                    const message = `${finalIcon} 测试完成！${statsIcon} Sessions: ${summary.sessions || 0}, 总计: ${summary.total}, 成功: ${summary.success}✅, 失败: ${summary.failed}❌ (成功率: ${successRate}%)`;
                    if (summary.failed === 0) {
                        vscode.window.showInformationMessage(message);
                    }
                    else {
                        vscode.window.showWarningMessage(message);
                    }
                }
                else {
                    vscode.window.showInformationMessage('🎉 集成测试执行完毕，报告已生成。');
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(`❌ 集成测试执行出错: ${error.message}`);
                console.error('Integration test error:', error);
            }
        }));
        // Register command to clear test report
        const clearReportCommand = vscode.commands.registerCommand('integrationTestPlugin.clearReport', () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield testReporter.clearReport();
                testViewProvider.refresh(); // Refresh tree view
                vscode.window.showInformationMessage('Test report cleared successfully.');
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to clear report: ${error.message}`);
            }
        }));
        // Register command to show report summary
        const showSummaryCommand = vscode.commands.registerCommand('integrationTestPlugin.showSummary', () => {
            const summary = testReporter.getReportSummary();
            if (summary) {
                const message = `📊 最新测试会话 - Sessions: ${summary.sessions || 0}, Total: ${summary.total}, Success: ${summary.success}✅, Failed: ${summary.failed}❌`;
                vscode.window.showInformationMessage(message);
            }
            else {
                vscode.window.showInformationMessage('📄 No test report found. Run tests first.');
            }
        });
        // Register command to trigger the registered test command
        const triggerTestCommand = vscode.commands.registerCommand('integrationTestPlugin.triggerRegisteredCommand', () => __awaiter(this, void 0, void 0, function* () {
            try {
                // Execute the command that was registered during testing
                yield vscode.commands.executeCommand('integrationTestPlugin.testCommand');
                vscode.window.showInformationMessage('✅ 注册的命令执行成功！');
            }
            catch (error) {
                vscode.window.showErrorMessage(`❌ 注册的命令执行失败: ${error.message}`);
            }
        }));
        // Register command to trigger the second registered test command
        const triggerSecondTestCommand = vscode.commands.registerCommand('integrationTestPlugin.triggerSecondRegisteredCommand', () => __awaiter(this, void 0, void 0, function* () {
            try {
                // Execute the second command that was registered during testing
                yield vscode.commands.executeCommand('integrationTestPlugin.secondTestCommand');
                vscode.window.showInformationMessage('✅ 第二个注册的命令执行成功！');
            }
            catch (error) {
                vscode.window.showErrorMessage(`❌ 第二个注册的命令执行失败: ${error.message}`);
            }
        }));
        // Register command to verify WebviewPanel creation
        const verifyWebviewProviderCommand = vscode.commands.registerCommand('integrationTestPlugin.verifyWebviewProvider', () => __awaiter(this, void 0, void 0, function* () {
            try {
                // Open the webview panel
                const panel = predefinedInstances_1.predefinedInstances.realWebviewPanelManager.createOrShowPanel();
                vscode.window.showInformationMessage('✅ WebviewPanel 创建成功！内容通过 panel.webview.html 设置。');
                return panel;
            }
            catch (error) {
                vscode.window.showErrorMessage(`❌ WebviewPanel 创建失败: ${error.message}`);
            }
        }));
        // Add commands to subscriptions for proper disposal
        context.subscriptions.push(runAllTestsCommand);
        context.subscriptions.push(clearReportCommand);
        context.subscriptions.push(showSummaryCommand);
        context.subscriptions.push(triggerTestCommand);
        context.subscriptions.push(triggerSecondTestCommand);
        context.subscriptions.push(verifyWebviewProviderCommand);
        console.log('Integration Test Plugin activated successfully.');
    });
}
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Integration Test Plugin deactivated.');
    });
}
//# sourceMappingURL=extension.js.map