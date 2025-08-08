export interface OperationConfig {
    id?: string; // 测试案例编号
    name: string;
    description: string;
    method: string[];
    input: any | any[];
    timeout_ms?: number; // 可选的超时时间（毫秒），不设置则使用默认值
    _saveAsRef?: string; // 保存API返回的对象引用，供后续测试使用
    expectedResult?: {
        type: 'value' | 'instance' | 'null' | 'undefined' | 'function' | 'custom';
        value?: any; // 期望的具体值或对象属性（type为value时使用）
        instanceOf?: string; // 期望的类名（type为instance时使用）
        instanceMethod?: {
            methodName: string;
            args?: any[];
            expectedReturn?: any;
        }; // 实例方法调用验证（type为instance时使用）
        instanceProperty?: {
            propertyPath: string[];
            expectedValue?: any;
        }; // 实例属性验证（type为instance时使用）
        functionCall?: {
            args?: any[];
            expectedReturn?: any;
        }; // 函数调用验证（type为function时使用）
        customValidator?: string; // 自定义验证器名称（type为custom时使用）
    };
}

export interface TestResult {
    name: string;
    description: string;
    method_chain: string;
    timestamp: string;
    status: '✅ SUCCESS' | '❌ FAILURE';
    message?: string;
    duration_ms: number;
    raw_result?: any;
    session_id?: string; // 添加会话ID
}

export interface TestSession {
    session_id: string;
    session_name: string;
    start_time: string;
    end_time: string;
    results: TestResult[];
    summary: {
        total: number;
        success: number;
        failed: number;
    };
}

export interface TestReport {
    title: string;
    created: string;
    sessions: TestSession[]; // 改为会话数组
    overall_summary: {
        total_sessions: number;
        total_tests: number;
        total_success: number;
        total_failed: number;
        lastUpdated: string;
    };
}
