import * as fs from 'fs';
import * as path from 'path';
import { OperationConfig, TestResult } from './types';
import { predefinedCallbacks } from './predefinedCallbacks';
import { predefinedInstances } from './predefinedInstances';

export class TestExecutor {
    private rootObjects: { [key: string]: any };
    private dynamicObjects: { [key: string]: any }; // 存储动态创建的对象

    constructor(vscode: any) {
        this.rootObjects = {
            vscode
        };
        this.dynamicObjects = {}; // 初始化动态对象存储
    }

    // 清空动态对象存储（每次运行新测试会话时调用）
    clearDynamicObjects(): void {
        this.dynamicObjects = {};
        console.log('🗑️ Dynamic objects cleared for new test session');
    }

    async runAllTestsInDirectory(
        testConfigsDir: string, 
        onSingleTestComplete?: (result: TestResult) => void,
        onTestStart?: (testName: string) => void
    ): Promise<TestResult[]> {
        // 清空动态对象存储，确保每个测试会话有干净的状态
        this.clearDynamicObjects();
        
        const results: TestResult[] = [];
        
        if (!fs.existsSync(testConfigsDir)) {
            throw new Error(`Test configs directory does not exist: ${testConfigsDir}`);
        }

        const files = fs.readdirSync(testConfigsDir).filter(file => file.endsWith('.json'));
        
        for (const file of files) {
            const filePath = path.join(testConfigsDir, file);
            try {
                const fileResults = await this.runTestsFromFile(filePath, onSingleTestComplete, onTestStart);
                results.push(...fileResults);
            } catch (error: any) {
                console.error(`Error processing test file ${file}:`, error);
                // Continue with other files even if one fails
            }
        }

        return results;
    }

    private async runTestsFromFile(
        filePath: string,
        onSingleTestComplete?: (result: TestResult) => void,
        onTestStart?: (testName: string) => void
    ): Promise<TestResult[]> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const testConfigs: OperationConfig[] = JSON.parse(fileContent);
        const results: TestResult[] = [];

        for (const config of testConfigs) {
            try {
                if (onTestStart) {
                    onTestStart(config.name);
                }

                const timeoutMs = config.timeout_ms || 10000; // 使用配置的超时时间，默认10秒
                const result = await this.executeTestWithTimeout(config, timeoutMs);
                results.push(result);

                if (onSingleTestComplete) {
                    onSingleTestComplete(result);
                }
            } catch (error: any) {
                // 即使单个测试失败，也要记录结果并继续执行其他测试
                const failedResult: TestResult = {
                    name: config.name,
                    description: config.description,
                    method_chain: config.method.join('.'),
                    timestamp: new Date().toISOString(),
                    status: 'FAILURE',
                    message: `Test execution failed: ${error.message}`,
                    duration_ms: 0
                };
                
                results.push(failedResult);
                
                if (onSingleTestComplete) {
                    onSingleTestComplete(failedResult);
                }
                
                console.error(`Test failed: ${config.name}`, error);
                // 继续执行下一个测试
            }
        }

        return results;
    }

    private async executeTestWithTimeout(config: OperationConfig, timeoutMs: number): Promise<TestResult> {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Test timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            try {
                const result = await this.executeTest(config);
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    private async executeTest(config: OperationConfig): Promise<TestResult> {
        const startTime = Date.now();
        const methodChain = config.method.join('.');

        try {
            // Resolve the target function
            const targetFunction = this.resolveMethodChain(config.method);
            
            // Process input parameters
            const processedInput = this.processInput(config.input);
            
            // Execute the function call
            let result: any;
            if (Array.isArray(processedInput)) {
                result = await targetFunction(...processedInput);
            } else {
                result = await targetFunction(processedInput);
            }

            const duration = Date.now() - startTime;


            // 检查是否需要保存返回的对象为动态引用
            if (config._saveAsRef && result !== undefined && result !== null) {
                this.dynamicObjects[config._saveAsRef] = result;
                console.log(`💾 Saved API result as dynamic reference: '${config._saveAsRef}'`);
                console.log(`   Available dynamic objects: [${Object.keys(this.dynamicObjects).join(', ')}]`);
            }

            return {
                name: config.name,
                description: config.description,
                method_chain: methodChain,
                timestamp: new Date().toISOString(),
                status: 'SUCCESS',
                message: 'Test executed successfully',
                duration_ms: duration,
                raw_result: result
            };

        } catch (error: any) {
            const duration = Date.now() - startTime;

            return {
                name: config.name,
                description: config.description,
                method_chain: methodChain,
                timestamp: new Date().toISOString(),
                status: 'FAILURE',
                message: error.message || 'Unknown error occurred',
                duration_ms: duration
            };
        }
    }

    private resolveMethodChain(method: string[]): Function {
        if (method.length === 0) {
            throw new Error('Method chain cannot be empty');
        }

        let currentObject: any;
        let startIndex = 1;
        
        // 检查是否是动态对象引用
        if (method[0] === '_dynamicRef') {
            if (method.length < 2) {
                throw new Error('Dynamic reference requires at least object name: ["_dynamicRef", "objectName", ...]');
            }
            
            const dynamicObjectName = method[1];
            if (!this.dynamicObjects[dynamicObjectName]) {
                throw new Error(`Dynamic object '${dynamicObjectName}' not found. Available: ${Object.keys(this.dynamicObjects).join(', ')}`);
            }
            
            currentObject = this.dynamicObjects[dynamicObjectName];
            startIndex = 2; // 从第三个元素开始导航
            console.log(`🔗 Using dynamic object reference: ${dynamicObjectName}`);
        } else {
            // 常规的根对象引用
            const rootObjectName = method[0];
            if (!this.rootObjects[rootObjectName]) {
                throw new Error(`Root object '${rootObjectName}' not found`);
            }
            currentObject = this.rootObjects[rootObjectName];
        }
        
        // 检查最后一个元素是否是特殊操作
        const lastElement = method[method.length - 1];
        
        if (lastElement === '_set') {
            // 属性设置操作：["_dynamicRef", "panel", "title", "_set"]
            const propertyPath = method.slice(startIndex, -1);
            return this.createPropertySetter(currentObject, propertyPath);
        } else if (lastElement === '_get') {
            // 属性获取操作：["_dynamicRef", "panel", "viewType", "_get"]
            const propertyPath = method.slice(startIndex, -1);
            return this.createPropertyGetter(currentObject, propertyPath);
        } else {
            // 常规方法调用
            // Navigate through the method chain
            for (let i = startIndex; i < method.length - 1; i++) {
                const propertyName = method[i];
                if (currentObject[propertyName] === undefined) {
                    throw new Error(`Property '${propertyName}' not found in '${method.slice(0, i + 1).join('.')}'`);
                }
                currentObject = currentObject[propertyName];
            }

            // Get the final function
            const functionName = method[method.length - 1];
            const targetFunction = currentObject[functionName];
            
            if (typeof targetFunction !== 'function') {
                throw new Error(`'${functionName}' is not a function in '${method.slice(0, -1).join('.')}'`);
            }

            // Bind the function to maintain correct 'this' context
            return targetFunction.bind(currentObject);
        }
    }

    // 创建属性设置函数
    private createPropertySetter(rootObject: any, propertyPath: string[]): Function {
        return (value: any) => {
            let currentObject = rootObject;
            
            // Navigate to the parent object
            for (let i = 0; i < propertyPath.length - 1; i++) {
                const propertyName = propertyPath[i];
                if (currentObject[propertyName] === undefined) {
                    throw new Error(`Property '${propertyName}' not found in property path`);
                }
                currentObject = currentObject[propertyName];
            }
            
            // Set the final property
            const finalProperty = propertyPath[propertyPath.length - 1];
            currentObject[finalProperty] = value;
            console.log(`✏️  Set property '${propertyPath.join('.')}' = ${typeof value === 'string' ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"` : value}`);
            
            return value; // Return the set value
        };
    }

    // 创建属性获取函数
    private createPropertyGetter(rootObject: any, propertyPath: string[]): Function {
        return () => {
            let currentObject = rootObject;
            
            // Navigate through the property path
            for (const propertyName of propertyPath) {
                if (currentObject[propertyName] === undefined) {
                    throw new Error(`Property '${propertyName}' not found in property path`);
                }
                currentObject = currentObject[propertyName];
            }
            
            console.log(`👁️  Got property '${propertyPath.join('.')}' = ${currentObject}`);
            return currentObject;
        };
    }

    private processInput(input: any): any {
        if (Array.isArray(input)) {
            return input.map(item => this.processInputItem(item));
        } else {
            return this.processInputItem(input);
        }
    }

    private processInputItem(item: any): any {
        if (typeof item === 'object' && item !== null) {
            // Handle callback references
            if (item._callbackRef && predefinedCallbacks[item._callbackRef as keyof typeof predefinedCallbacks]) {
                return predefinedCallbacks[item._callbackRef as keyof typeof predefinedCallbacks];
            }
            
            // Handle instance references
            if (item._instanceRef && predefinedInstances[item._instanceRef as keyof typeof predefinedInstances]) {
                return predefinedInstances[item._instanceRef as keyof typeof predefinedInstances];
            }
            
            // Recursively process object properties
            const processed: any = {};
            for (const [key, value] of Object.entries(item)) {
                processed[key] = this.processInputItem(value);
            }
            return processed;
        }
        
        return item;
    }
}