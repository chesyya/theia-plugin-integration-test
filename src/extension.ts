import * as vscode from 'vscode';
import { TestExecutor } from './testExecutor';
import { TestReporter } from './testReporter';
import { TestViewProvider } from './testViewProvider';
import { TestResult } from './types';
import { predefinedInstances } from './predefinedInstances';
import * as path from 'path';
import * as fs from 'fs';

export async function activate(context: vscode.ExtensionContext) {
    const testConfigsDir = path.join(context.extensionPath, 'test-configs');
    const testReportPath = path.join(context.extensionPath, 'test-report.json');

    // Initialize TestExecutor with only vscode API
    const testExecutor = new TestExecutor(vscode);
    const testReporter = new TestReporter(testReportPath);

    // Create and register tree view provider
    const testViewProvider = new TestViewProvider(testReporter);
    const treeView = vscode.window.createTreeView('integrationTestView', {
        treeDataProvider: testViewProvider,
        showCollapseAll: false
    });
    context.subscriptions.push(treeView);

    // Register command to open Webview Panel
    const openWebviewPanelCommand = vscode.commands.registerCommand('integrationTestPlugin.openWebviewPanel', () => {
        // Create or show webview panel and set HTML content via panel.webview.html
        const panel = predefinedInstances.realWebviewPanelManager.createOrShowPanel();
        return panel;
    });
    context.subscriptions.push(openWebviewPanelCommand);

    // Register command to run all tests
    const runAllTestsCommand = vscode.commands.registerCommand('integrationTestPlugin.runAllTests', async () => {
        try {
            const sessionId = `session_${Date.now()}`;
            vscode.window.showInformationMessage('🚀 开始执行集成测试...');

            let completedCount = 0;
            let totalTests = 0;

            // 先计算总测试数
            const files = fs.readdirSync(testConfigsDir).filter((file: string) => file.endsWith('.json'));
            for (const file of files) {
                const filePath = path.join(testConfigsDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const testConfigs = JSON.parse(fileContent);
                totalTests += testConfigs.length;
            }

            const results = await testExecutor.runAllTestsInDirectory(
                testConfigsDir,
                // 单个测试完成的回调
                async (result: TestResult) => {
                    completedCount++;

                    // 立即写入报告
                    await testReporter.addSingleTestResult(result, sessionId);

                    // 刷新视图
                    testViewProvider.refresh();

                    // 显示单个测试结果，带更丰富的图标和格式
                    const statusIcon = result.status === '✅ SUCCESS' ? '✅' : '❌';
                    const durationText = result.duration_ms > 0 ? ` (${result.duration_ms}ms)` : '';
                    const progressText = `[${completedCount}/${totalTests}]`;

                    let message: string;
                    if (result.status === '✅ SUCCESS') {
                        message = `${statusIcon} ${progressText} ${result.name}${durationText}`;
                        vscode.window.showInformationMessage(message);
                    } else {
                        const errorIcon = result.message?.includes('timed out') ? '⏰' : '💥';
                        const errorMessage = result.message?.includes('timed out') ? '执行超时' : result.message;
                        message = `${statusIcon}${errorIcon} ${progressText} ${result.name}${durationText}`;
                        vscode.window.showErrorMessage(`${message} - ${errorMessage}`);
                    }
                },
                // 测试开始的回调
                (testName: string) => {
                    const progressIcon = '⚡';
                    vscode.window.showInformationMessage(`${progressIcon} 正在执行: ${testName}...`);
                }
            );

            // 显示最终结果，更丰富的图标和格式
            const summary = testReporter.getReportSummary();
            if (summary) {
                const successRate = Math.round((summary.success / summary.total) * 100);
                const finalIcon = summary.failed === 0 ? '🎉' : (summary.success > summary.failed ? '⚠️' : '💔');
                const statsIcon = '📊';

                const message = `${finalIcon} 测试完成！${statsIcon} Sessions: ${summary.sessions || 0}, 总计: ${summary.total}, 成功: ${summary.success}✅, 失败: ${summary.failed}❌ (成功率: ${successRate}%)`;

                if (summary.failed === 0) {
                    vscode.window.showInformationMessage(message);
                } else {
                    vscode.window.showWarningMessage(message);
                }
            } else {
                vscode.window.showInformationMessage('🎉 集成测试执行完毕，报告已生成。');
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`❌ 集成测试执行出错: ${error.message}`);
            console.error('Integration test error:', error);
        }
    });

    // Register command to clear test report
    const clearReportCommand = vscode.commands.registerCommand('integrationTestPlugin.clearReport', async () => {
        try {
            await testReporter.clearReport();
            testViewProvider.refresh(); // Refresh tree view
            vscode.window.showInformationMessage('Test report cleared successfully.');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to clear report: ${error.message}`);
        }
    });

    // Register command to show report summary
    const showSummaryCommand = vscode.commands.registerCommand('integrationTestPlugin.showSummary', () => {
        const summary = testReporter.getReportSummary();
        if (summary) {
            const message = `📊 最新测试会话 - Sessions: ${summary.sessions || 0}, Total: ${summary.total}, Success: ${summary.success}✅, Failed: ${summary.failed}❌`;
            vscode.window.showInformationMessage(message);
        } else {
            vscode.window.showInformationMessage('📄 No test report found. Run tests first.');
        }
    });


    // Register command to trigger the registered test command
    const triggerTestCommand = vscode.commands.registerCommand('integrationTestPlugin.triggerRegisteredCommand', async () => {
        try {
            // Execute the command that was registered during testing
            await vscode.commands.executeCommand('integrationTestPlugin.testCommand');
            vscode.window.showInformationMessage('✅ 注册的命令执行成功！');
        } catch (error: any) {
            vscode.window.showErrorMessage(`❌ 注册的命令执行失败: ${error.message}`);
        }
    });

    // Register command to trigger the second registered test command
    const triggerSecondTestCommand = vscode.commands.registerCommand('integrationTestPlugin.triggerSecondRegisteredCommand', async () => {
        try {
            // Execute the second command that was registered during testing
            await vscode.commands.executeCommand('integrationTestPlugin.secondTestCommand');
            vscode.window.showInformationMessage('✅ 第二个注册的命令执行成功！');
        } catch (error: any) {
            vscode.window.showErrorMessage(`❌ 第二个注册的命令执行失败: ${error.message}`);
        }
    });

    // Register command to verify WebviewPanel creation
    const verifyWebviewProviderCommand = vscode.commands.registerCommand('integrationTestPlugin.verifyWebviewProvider', async () => {
        try {
            // Open the webview panel
            const panel = predefinedInstances.realWebviewPanelManager.createOrShowPanel();
            vscode.window.showInformationMessage('✅ WebviewPanel 创建成功！内容通过 panel.webview.html 设置。');
            return panel;
        } catch (error: any) {
            vscode.window.showErrorMessage(`❌ WebviewPanel 创建失败: ${error.message}`);
        }
    });

    // Add commands to subscriptions for proper disposal
    context.subscriptions.push(runAllTestsCommand);
    context.subscriptions.push(clearReportCommand);
    context.subscriptions.push(showSummaryCommand);
    context.subscriptions.push(triggerTestCommand);
    context.subscriptions.push(triggerSecondTestCommand);
    context.subscriptions.push(verifyWebviewProviderCommand);

    console.log('Integration Test Plugin activated successfully.');
}

export async function deactivate() {
    console.log('Integration Test Plugin deactivated.');
}
