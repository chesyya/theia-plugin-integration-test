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
exports.TestViewProvider = void 0;
const vscode = __importStar(require("vscode"));
class TestViewProvider {
    constructor(testReporter) {
        this.testReporter = testReporter;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root items
            const summary = this.testReporter.getReportSummary();
            const items = [
                new TestItem('Run All Tests', 'Run all integration tests', vscode.TreeItemCollapsibleState.None, 'integrationTestPlugin.runAllTests'),
                new TestItem('Show Summary', summary ? `Sessions: ${summary.sessions || 0}, Tests: ${summary.total}, Success: ${summary.success}, Failed: ${summary.failed}` : 'No tests run yet', vscode.TreeItemCollapsibleState.None, 'integrationTestPlugin.showSummary'),
                new TestItem('Clear Report', 'Clear test report', vscode.TreeItemCollapsibleState.None, 'integrationTestPlugin.clearReport'),
                new TestItem('Trigger First Command', 'Trigger first registered test command', vscode.TreeItemCollapsibleState.None, 'integrationTestPlugin.triggerRegisteredCommand'),
                new TestItem('Trigger Second Command', 'Trigger second registered test command', vscode.TreeItemCollapsibleState.None, 'integrationTestPlugin.triggerSecondRegisteredCommand'),
                new TestItem('Verify Webview Panel', 'Verify WebviewPanel creation via createWebviewPanel', vscode.TreeItemCollapsibleState.None, 'integrationTestPlugin.verifyWebviewProvider'),
                new TestItem('Open Webview Panel', 'Open integration test webview panel', vscode.TreeItemCollapsibleState.None, 'integrationTestPlugin.openWebviewPanel')
            ];
            return items;
        }
        else {
            return [];
        }
    }
}
exports.TestViewProvider = TestViewProvider;
class TestItem extends vscode.TreeItem {
    constructor(label, tooltip, collapsibleState, commandId) {
        super(label, collapsibleState);
        this.label = label;
        this.tooltip = tooltip;
        this.collapsibleState = collapsibleState;
        this.commandId = commandId;
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
    setIconBasedOnCommand(commandId) {
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
//# sourceMappingURL=testViewProvider.js.map