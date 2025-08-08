import * as fs from 'fs';
import { TestResult, TestReport, TestSession } from './types';

export class TestReporter {
    private reportFilePath: string;

    constructor(reportFilePath: string) {
        this.reportFilePath = reportFilePath;
    }

    async generateReport(testResults: TestResult[]): Promise<void> {
        return this.generateSessionReport(testResults);
    }

    // 添加单个测试结果的写入方法
    async addSingleTestResult(testResult: TestResult, sessionId: string): Promise<void> {
        try {
            let existingReport: TestReport | null = null;

            // Try to read existing report
            if (fs.existsSync(this.reportFilePath)) {
                try {
                    const existingContent = fs.readFileSync(this.reportFilePath, 'utf8');
                    existingReport = JSON.parse(existingContent);
                } catch (error) {
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
            } else {
                // 创建新报告
                const newSession: TestSession = {
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

                const report: TestReport = {
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

        } catch (error: any) {
            throw new Error(`Failed to add single test result: ${error.message}`);
        }
    }

    private async generateSessionReport(testResults: TestResult[]): Promise<void> {
        try {
            let existingReport: TestReport | null = null;

            // Try to read existing report
            if (fs.existsSync(this.reportFilePath)) {
                try {
                    const existingContent = fs.readFileSync(this.reportFilePath, 'utf8');
                    existingReport = JSON.parse(existingContent);
                } catch (error) {
                    console.warn('Could not parse existing report file, creating new one');
                }
            }

            // 创建新的测试会话
            const now = new Date().toISOString();
            const sessionId = `session_${Date.now()}`;
            const sessionName = `集成测试会话 - ${new Date().toLocaleString('zh-CN')}`;

            // 为所有测试结果添加会话ID
            const resultsWithSession = testResults.map(result => ({
                ...result,
                session_id: sessionId
            }));

            const newSession: TestSession = {
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
            const report: TestReport = {
                title: '🧪 Theia Integration Test Report',
                created: existingReport?.created || now,
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

        } catch (error: any) {
            throw new Error(`Failed to generate test report: ${error.message}`);
        }
    }

    async clearReport(): Promise<void> {
        if (fs.existsSync(this.reportFilePath)) {
            fs.unlinkSync(this.reportFilePath);
            console.log('Test report cleared');
        }
    }

    getReportSummary(): { total: number; success: number; failed: number; sessions?: number } | null {
        if (!fs.existsSync(this.reportFilePath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(this.reportFilePath, 'utf8');
            const report: TestReport = JSON.parse(content);

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
        } catch (error) {
            console.error('Could not read report summary:', error);
            return null;
        }
    }

}
