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
exports.TestReporter = void 0;
const fs = __importStar(require("fs"));
class TestReporter {
    constructor(reportFilePath) {
        this.reportFilePath = reportFilePath;
    }
    generateReport(testResults) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.generateSessionReport(testResults);
        });
    }
    // 添加单个测试结果的写入方法
    addSingleTestResult(testResult, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let existingReport = null;
                // Try to read existing report
                if (fs.existsSync(this.reportFilePath)) {
                    try {
                        const existingContent = fs.readFileSync(this.reportFilePath, 'utf8');
                        existingReport = JSON.parse(existingContent);
                    }
                    catch (error) {
                        console.warn('Could not parse existing report file, creating new one');
                    }
                }
                const now = new Date().toISOString();
                testResult.session_id = sessionId;
                if (existingReport) {
                    // 查找现有会话或创建新会话
                    let currentSession = existingReport.sessions.find(s => s.session_id === sessionId);
                    if (!currentSession) {
                        // 创建新会话
                        currentSession = {
                            session_id: sessionId,
                            session_name: `📅 集成测试会话 - ${new Date().toLocaleString('zh-CN')}`,
                            start_time: now,
                            end_time: now,
                            results: [],
                            summary: { total: 0, success: 0, failed: 0 }
                        };
                        existingReport.sessions.push(currentSession);
                    }
                    // 添加测试结果到会话
                    currentSession.results.push(testResult);
                    currentSession.end_time = now;
                    // 更新会话摘要
                    currentSession.summary.total = currentSession.results.length;
                    currentSession.summary.success = currentSession.results.filter(r => r.status === '✅ SUCCESS').length;
                    currentSession.summary.failed = currentSession.results.filter(r => r.status === '❌ FAILURE').length;
                    // 更新总体摘要
                    existingReport.overall_summary.total_tests = existingReport.sessions.reduce((acc, s) => acc + s.summary.total, 0);
                    existingReport.overall_summary.total_success = existingReport.sessions.reduce((acc, s) => acc + s.summary.success, 0);
                    existingReport.overall_summary.total_failed = existingReport.sessions.reduce((acc, s) => acc + s.summary.failed, 0);
                    existingReport.overall_summary.lastUpdated = now;
                    // 写入文件
                    fs.writeFileSync(this.reportFilePath, JSON.stringify(existingReport, null, 2));
                }
                else {
                    // 创建新报告
                    const newSession = {
                        session_id: sessionId,
                        session_name: `📅 集成测试会话 - ${new Date().toLocaleString('zh-CN')}`,
                        start_time: now,
                        end_time: now,
                        results: [testResult],
                        summary: {
                            total: 1,
                            success: testResult.status === '✅ SUCCESS' ? 1 : 0,
                            failed: testResult.status === '❌ FAILURE' ? 1 : 0
                        }
                    };
                    const report = {
                        title: '🧪 Theia Integration Test Report',
                        created: now,
                        sessions: [newSession],
                        overall_summary: {
                            total_sessions: 1,
                            total_tests: 1,
                            total_success: testResult.status === '✅ SUCCESS' ? 1 : 0,
                            total_failed: testResult.status === '❌ FAILURE' ? 1 : 0,
                            lastUpdated: now
                        }
                    };
                    fs.writeFileSync(this.reportFilePath, JSON.stringify(report, null, 2));
                }
                console.log(`Single test result added to report: ${testResult.name} - ${testResult.status}`);
            }
            catch (error) {
                throw new Error(`Failed to add single test result: ${error.message}`);
            }
        });
    }
    generateSessionReport(testResults) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let existingReport = null;
                // Try to read existing report
                if (fs.existsSync(this.reportFilePath)) {
                    try {
                        const existingContent = fs.readFileSync(this.reportFilePath, 'utf8');
                        existingReport = JSON.parse(existingContent);
                    }
                    catch (error) {
                        console.warn('Could not parse existing report file, creating new one');
                    }
                }
                // 创建新的测试会话
                const now = new Date().toISOString();
                const sessionId = `session_${Date.now()}`;
                const sessionName = `集成测试会话 - ${new Date().toLocaleString('zh-CN')}`;
                // 为所有测试结果添加会话ID
                const resultsWithSession = testResults.map(result => (Object.assign(Object.assign({}, result), { session_id: sessionId })));
                const newSession = {
                    session_id: sessionId,
                    session_name: `📅 ${sessionName}`,
                    start_time: now,
                    end_time: now,
                    results: resultsWithSession,
                    summary: {
                        total: testResults.length,
                        success: testResults.filter(r => r.status === '✅ SUCCESS').length,
                        failed: testResults.filter(r => r.status === '❌ FAILURE').length
                    }
                };
                // Create or update report
                const report = {
                    title: '🧪 Theia Integration Test Report',
                    created: (existingReport === null || existingReport === void 0 ? void 0 : existingReport.created) || now,
                    sessions: existingReport ? [...existingReport.sessions, newSession] : [newSession],
                    overall_summary: {
                        total_sessions: 0,
                        total_tests: 0,
                        total_success: 0,
                        total_failed: 0,
                        lastUpdated: now
                    }
                };
                // Calculate overall summary
                report.overall_summary.total_sessions = report.sessions.length;
                report.overall_summary.total_tests = report.sessions.reduce((acc, session) => acc + session.summary.total, 0);
                report.overall_summary.total_success = report.sessions.reduce((acc, session) => acc + session.summary.success, 0);
                report.overall_summary.total_failed = report.sessions.reduce((acc, session) => acc + session.summary.failed, 0);
                // Write report to file
                fs.writeFileSync(this.reportFilePath, JSON.stringify(report, null, 2));
                console.log(`Test report generated at: ${this.reportFilePath}`);
                console.log(`Session: ${sessionName}`);
                console.log(`This session - Total: ${newSession.summary.total}, Success: ${newSession.summary.success}, Failed: ${newSession.summary.failed}`);
                console.log(`Overall - Sessions: ${report.overall_summary.total_sessions}, Total tests: ${report.overall_summary.total_tests}`);
            }
            catch (error) {
                throw new Error(`Failed to generate test report: ${error.message}`);
            }
        });
    }
    clearReport() {
        return __awaiter(this, void 0, void 0, function* () {
            if (fs.existsSync(this.reportFilePath)) {
                fs.unlinkSync(this.reportFilePath);
                console.log('Test report cleared');
            }
        });
    }
    getReportSummary() {
        if (!fs.existsSync(this.reportFilePath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(this.reportFilePath, 'utf8');
            const report = JSON.parse(content);
            // 只显示最新会话的统计，而不是所有会话的累计
            if (report.sessions && report.sessions.length > 0) {
                const latestSession = report.sessions[report.sessions.length - 1];
                return {
                    total: latestSession.summary.total,
                    success: latestSession.summary.success,
                    failed: latestSession.summary.failed,
                    sessions: report.overall_summary.total_sessions
                };
            }
            return {
                total: 0,
                success: 0,
                failed: 0,
                sessions: 0
            };
        }
        catch (error) {
            console.error('Could not read report summary:', error);
            return null;
        }
    }
}
exports.TestReporter = TestReporter;
//# sourceMappingURL=testReporter.js.map