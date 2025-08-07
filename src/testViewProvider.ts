import * as vscode from 'vscode';
import { TestReporter } from './testReporter';

export class TestViewProvider implements vscode.TreeDataProvider<TestItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TestItem | undefined> = new vscode.EventEmitter<TestItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TestItem | undefined> = this._onDidChangeTreeData.event;

    constructor(private testReporter: TestReporter) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: TestItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TestItem): TestItem[] {
        if (!element) {
            // Root items
            const summary = this.testReporter.getReportSummary();
            const items: TestItem[] = [
                new TestItem(
                    'Run All Tests',
                    'Run all integration tests',
                    vscode.TreeItemCollapsibleState.None,
                    'integrationTestPlugin.runAllTests'
                ),
                new TestItem(
                    'Show Summary',
                    summary ? `Sessions: ${summary.sessions || 0}, Tests: ${summary.total}, Success: ${summary.success}, Failed: ${summary.failed}` : 'No tests run yet',
                    vscode.TreeItemCollapsibleState.None,
                    'integrationTestPlugin.showSummary'
                ),
                new TestItem(
                    'Clear Report',
                    'Clear test report',
                    vscode.TreeItemCollapsibleState.None,
                    'integrationTestPlugin.clearReport'
                ),
                new TestItem(
                    'Trigger First Command',
                    'Trigger first registered test command',
                    vscode.TreeItemCollapsibleState.None,
                    'integrationTestPlugin.triggerRegisteredCommand'
                ),
                new TestItem(
                    'Trigger Second Command',
                    'Trigger second registered test command',
                    vscode.TreeItemCollapsibleState.None,
                    'integrationTestPlugin.triggerSecondRegisteredCommand'
                ),
                new TestItem(
                    'Verify Webview Panel',
                    'Verify WebviewPanel creation via createWebviewPanel',
                    vscode.TreeItemCollapsibleState.None,
                    'integrationTestPlugin.verifyWebviewProvider'
                ),
                new TestItem(
                    'Open Webview Panel',
                    'Open integration test webview panel',
                    vscode.TreeItemCollapsibleState.None,
                    'integrationTestPlugin.openWebviewPanel'
                )
            ];
            return items;
        } else {
            return [];
        }
    }
}

class TestItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly commandId?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        
        if (commandId) {
            this.command = {
                command: commandId,
                title: label,
                arguments: []
            };
            
            // 设置图标
            this.setIconBasedOnCommand(commandId);
        }
    }
    
    private setIconBasedOnCommand(commandId: string) {
        switch (commandId) {
            case 'integrationTestPlugin.runAllTests':
                this.iconPath = '$(play)';
                break;
            case 'integrationTestPlugin.showSummary':
                this.iconPath = '$(graph)';
                break;
            case 'integrationTestPlugin.clearReport':
                this.iconPath = '$(clear-all)';
                break;
            case 'integrationTestPlugin.triggerRegisteredCommand':
                this.iconPath = '$(zap)';
                break;
            case 'integrationTestPlugin.triggerSecondRegisteredCommand':
                this.iconPath = '$(zap)';
                break;
            case 'integrationTestPlugin.verifyWebviewProvider':
                this.iconPath = '$(eye)';
                break;
            case 'integrationTestPlugin.openWebviewPanel':
                this.iconPath = '$(preview)';
                break;
            default:
                this.iconPath = '$(circle-outline)';
        }
    }
}