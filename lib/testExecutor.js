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
exports.TestExecutor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const predefinedCallbacks_1 = require("./predefinedCallbacks");
const predefinedInstances_1 = require("./predefinedInstances");
class TestExecutor {
    constructor(vscode) {
        this.rootObjects = {
            vscode
        };
        this.dynamicObjects = {}; // 初始化动态对象存储
    }
    // 清空动态对象存储（每次运行新测试会话时调用）
    clearDynamicObjects() {
        this.dynamicObjects = {};
        console.log('🗑️ Dynamic objects cleared for new test session');
    }
    runAllTestsInDirectory(testConfigsDir, onSingleTestComplete, onTestStart) {
        return __awaiter(this, void 0, void 0, function* () {
            // 清空动态对象存储，确保每个测试会话有干净的状态
            this.clearDynamicObjects();
            const results = [];
            if (!fs.existsSync(testConfigsDir)) {
                throw new Error(`Test configs directory does not exist: ${testConfigsDir}`);
            }
            const files = fs.readdirSync(testConfigsDir).filter(file => file.endsWith('.json'));
            for (const file of files) {
                const filePath = path.join(testConfigsDir, file);
                try {
                    const fileResults = yield this.runTestsFromFile(filePath, onSingleTestComplete, onTestStart);
                    results.push(...fileResults);
                }
                catch (error) {
                    console.error(`Error processing test file ${file}:`, error);
                    // Continue with other files even if one fails
                }
            }
            return results;
        });
    }
    runTestsFromFile(filePath, onSingleTestComplete, onTestStart) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const testConfigs = JSON.parse(fileContent);
            const results = [];
            for (const config of testConfigs) {
                try {
                    if (onTestStart) {
                        onTestStart(config.name);
                    }
                    const timeoutMs = config.timeout_ms || 10000; // 使用配置的超时时间，默认10秒
                    const result = yield this.executeTestWithTimeout(config, timeoutMs);
                    results.push(result);
                    if (onSingleTestComplete) {
                        onSingleTestComplete(result);
                    }
                }
                catch (error) {
                    // 即使单个测试失败，也要记录结果并继续执行其他测试
                    const failedResult = {
                        name: config.name,
                        description: config.description,
                        method_chain: config.method.join('.'),
                        timestamp: new Date().toISOString(),
                        status: '❌ FAILURE',
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
        });
    }
    executeTestWithTimeout(config, timeoutMs) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const timeoutId = setTimeout(() => {
                    reject(new Error(`Test timed out after ${timeoutMs}ms`));
                }, timeoutMs);
                try {
                    const result = yield this.executeTest(config);
                    clearTimeout(timeoutId);
                    resolve(result);
                }
                catch (error) {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            }));
        });
    }
    executeTest(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const methodChain = config.method.join('.');
            try {
                // Resolve the target function
                const targetFunction = this.resolveMethodChain(config.method);
                // Process input parameters
                const processedInput = this.processInput(config.input);
                // Execute the function call
                let result;
                if (Array.isArray(processedInput)) {
                    result = yield targetFunction(...processedInput);
                }
                else {
                    result = yield targetFunction(processedInput);
                }
                const duration = Date.now() - startTime;
                // 检查是否需要保存返回的对象为动态引用
                if (config._saveAsRef && result !== undefined && result !== null) {
                    this.dynamicObjects[config._saveAsRef] = result;
                    console.log(`💾 Saved API result as dynamic reference: '${config._saveAsRef}'`);
                    console.log(`   Available dynamic objects: [${Object.keys(this.dynamicObjects).join(', ')}]`);
                }
                // 验证期望结果
                const validationResult = this.validateResult(result, config.expectedResult);
                return {
                    name: config.name,
                    description: config.description,
                    method_chain: methodChain,
                    timestamp: new Date().toISOString(),
                    status: validationResult.success ? '✅ SUCCESS' : '❌ FAILURE',
                    message: validationResult.message,
                    duration_ms: duration,
                    raw_result: result
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    name: config.name,
                    description: config.description,
                    method_chain: methodChain,
                    timestamp: new Date().toISOString(),
                    status: '❌ FAILURE',
                    message: error.message || 'Unknown error occurred',
                    duration_ms: duration
                };
            }
        });
    }
    resolveMethodChain(method) {
        if (method.length === 0) {
            throw new Error('Method chain cannot be empty');
        }
        let currentObject;
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
        }
        else {
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
        }
        else if (lastElement === '_get') {
            // 属性获取操作：["_dynamicRef", "panel", "viewType", "_get"]
            const propertyPath = method.slice(startIndex, -1);
            return this.createPropertyGetter(currentObject, propertyPath);
        }
        else {
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
    createPropertySetter(rootObject, propertyPath) {
        return (value) => {
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
    createPropertyGetter(rootObject, propertyPath) {
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
    processInput(input) {
        if (Array.isArray(input)) {
            return input.map(item => this.processInputItem(item));
        }
        else {
            return this.processInputItem(input);
        }
    }
    processInputItem(item) {
        if (typeof item === 'object' && item !== null) {
            // Handle callback references
            if (item._callbackRef && predefinedCallbacks_1.predefinedCallbacks[item._callbackRef]) {
                return predefinedCallbacks_1.predefinedCallbacks[item._callbackRef];
            }
            // Handle instance references
            if (item._instanceRef && predefinedInstances_1.predefinedInstances[item._instanceRef]) {
                return predefinedInstances_1.predefinedInstances[item._instanceRef];
            }
            // Recursively process object properties
            const processed = {};
            for (const [key, value] of Object.entries(item)) {
                processed[key] = this.processInputItem(value);
            }
            return processed;
        }
        return item;
    }
    // 验证结果方法
    validateResult(actualResult, expectedResult) {
        var _a;
        // 如果没有期望结果配置，默认为成功（只要执行没有错误就是成功）
        if (!expectedResult) {
            return { success: true, message: 'Test executed successfully' };
        }
        const testId = expectedResult.customValidator ? `[${expectedResult.customValidator}]` : '';
        try {
            switch (expectedResult.type) {
                case 'value':
                    // 精确值比较（支持对象属性）
                    if (typeof expectedResult.value === 'object' && expectedResult.value !== null &&
                        typeof actualResult === 'object' && actualResult !== null) {
                        // 对象属性逐一比较
                        for (const [key, expectedVal] of Object.entries(expectedResult.value)) {
                            if (actualResult[key] !== expectedVal) {
                                return {
                                    success: false,
                                    message: `❌ Object property '${key}' expected: ${expectedVal}, got: ${actualResult[key]} ${testId}`
                                };
                            }
                        }
                        return { success: true, message: `✅ Object value validation passed ${testId}` };
                    }
                    else {
                        // 基本类型直接比较
                        if (actualResult === expectedResult.value) {
                            return { success: true, message: `✅ Value validation passed ${testId}` };
                        }
                        else {
                            return {
                                success: false,
                                message: `❌ Expected value: ${expectedResult.value}, got: ${actualResult} ${testId}`
                            };
                        }
                    }
                case 'null':
                    if (actualResult === null) {
                        return { success: true, message: `✅ Null validation passed ${testId}` };
                    }
                    else {
                        return { success: false, message: `❌ Expected null, got: ${actualResult} ${testId}` };
                    }
                case 'undefined':
                    if (actualResult === undefined) {
                        return { success: true, message: `✅ Undefined validation passed ${testId}` };
                    }
                    else {
                        return { success: false, message: `❌ Expected undefined, got: ${actualResult} ${testId}` };
                    }
                case 'function':
                    // 函数类型验证
                    if (typeof actualResult !== 'function') {
                        return { success: false, message: `❌ Expected function, got: ${typeof actualResult} ${testId}` };
                    }
                    // 如果有函数调用验证
                    if (expectedResult.functionCall) {
                        try {
                            const args = expectedResult.functionCall.args || [];
                            const callResult = actualResult(...args);
                            if (expectedResult.functionCall.expectedReturn !== undefined) {
                                if (callResult === expectedResult.functionCall.expectedReturn) {
                                    return { success: true, message: `✅ Function call validation passed ${testId}` };
                                }
                                else {
                                    return {
                                        success: false,
                                        message: `❌ Function call expected: ${expectedResult.functionCall.expectedReturn}, got: ${callResult} ${testId}`
                                    };
                                }
                            }
                            else {
                                return { success: true, message: `✅ Function call executed successfully ${testId}` };
                            }
                        }
                        catch (error) {
                            return {
                                success: false,
                                message: `❌ Function call failed: ${error.message} ${testId}`
                            };
                        }
                    }
                    else {
                        return { success: true, message: `✅ Function validation passed ${testId}` };
                    }
                case 'instance':
                    // 类实例验证
                    if (!expectedResult.instanceOf) {
                        return { success: false, message: `❌ instanceOf not specified for instance validation ${testId}` };
                    }
                    // 检查是否是指定类的实例
                    let isInstance = false;
                    const className = expectedResult.instanceOf;
                    // 检查构造函数名称
                    if (actualResult && actualResult.constructor && actualResult.constructor.name === className) {
                        isInstance = true;
                    }
                    // 检查原型链中的类型
                    if (!isInstance && actualResult && typeof actualResult === 'object') {
                        const proto = Object.getPrototypeOf(actualResult);
                        if (proto && proto.constructor && proto.constructor.name === className) {
                            isInstance = true;
                        }
                    }
                    if (!isInstance) {
                        const actualType = ((_a = actualResult === null || actualResult === void 0 ? void 0 : actualResult.constructor) === null || _a === void 0 ? void 0 : _a.name) || typeof actualResult;
                        return {
                            success: false,
                            message: `❌ Expected instance of ${className}, got: ${actualType} ${testId}`
                        };
                    }
                    // 进一步验证：实例方法调用
                    if (expectedResult.instanceMethod) {
                        try {
                            const methodName = expectedResult.instanceMethod.methodName;
                            const args = expectedResult.instanceMethod.args || [];
                            if (typeof actualResult[methodName] !== 'function') {
                                return {
                                    success: false,
                                    message: `❌ Method '${methodName}' not found in instance ${testId}`
                                };
                            }
                            const methodResult = actualResult[methodName](...args);
                            if (expectedResult.instanceMethod.expectedReturn !== undefined) {
                                if (methodResult === expectedResult.instanceMethod.expectedReturn) {
                                    return { success: true, message: `✅ Instance method validation passed (${className}.${methodName}) ${testId}` };
                                }
                                else {
                                    return {
                                        success: false,
                                        message: `❌ Method '${methodName}' expected: ${expectedResult.instanceMethod.expectedReturn}, got: ${methodResult} ${testId}`
                                    };
                                }
                            }
                            else {
                                return { success: true, message: `✅ Instance method called successfully (${className}.${methodName}) ${testId}` };
                            }
                        }
                        catch (error) {
                            return {
                                success: false,
                                message: `❌ Instance method call failed: ${error.message} ${testId}`
                            };
                        }
                    }
                    // 进一步验证：实例属性
                    if (expectedResult.instanceProperty) {
                        try {
                            let currentObj = actualResult;
                            const propertyPath = expectedResult.instanceProperty.propertyPath;
                            // 导航到属性路径
                            for (const prop of propertyPath) {
                                if (currentObj[prop] === undefined) {
                                    return {
                                        success: false,
                                        message: `❌ Property path '${propertyPath.join('.')}' not found in instance ${testId}`
                                    };
                                }
                                currentObj = currentObj[prop];
                            }
                            if (expectedResult.instanceProperty.expectedValue !== undefined) {
                                if (currentObj === expectedResult.instanceProperty.expectedValue) {
                                    return { success: true, message: `✅ Instance property validation passed (${className}.${propertyPath.join('.')}) ${testId}` };
                                }
                                else {
                                    return {
                                        success: false,
                                        message: `❌ Property '${propertyPath.join('.')}' expected: ${expectedResult.instanceProperty.expectedValue}, got: ${currentObj} ${testId}`
                                    };
                                }
                            }
                            else {
                                return { success: true, message: `✅ Instance property accessed successfully (${className}.${propertyPath.join('.')}) ${testId}` };
                            }
                        }
                        catch (error) {
                            return {
                                success: false,
                                message: `❌ Instance property access failed: ${error.message} ${testId}`
                            };
                        }
                    }
                    return { success: true, message: `✅ Instance validation passed (${className}) ${testId}` };
                case 'custom':
                    // 自定义验证器（待实现）
                    return {
                        success: true,
                        message: `⚠️ Custom validation not implemented yet: ${expectedResult.customValidator} ${testId}`
                    };
                default:
                    return { success: false, message: `❌ Unknown validation type: ${expectedResult.type} ${testId}` };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `❌ Validation error: ${error.message} ${testId}`
            };
        }
    }
}
exports.TestExecutor = TestExecutor;
//# sourceMappingURL=testExecutor.js.map