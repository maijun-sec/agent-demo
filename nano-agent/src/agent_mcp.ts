import { ChatOllama } from "@langchain/ollama";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import {BaseMessage} from "@langchain/core/dist/messages/base";
import {HumanMessage, ToolMessage} from "@langchain/core/messages";

const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const OLLAMA_MODEL = 'qwen3.5:2b';


const MCP_SERVER_MATH = 'D:\\workspace\\webstorm\\aagent-demo\\src\\mcp_server_math.ts';  // 需要根据项目路径修改


async function main() {
    // 1. 定义工具
    const mcpClient = new MultiServerMCPClient({
        // 配置本地数学计算服务器，通过 stdio 通信
        math: {
            transport: "stdio",
            command: "node",
            args: [ MCP_SERVER_MATH ], // 替换为你的服务器文件绝对路径
        }
    });

    let tools = await mcpClient.getTools();

    // 2. 初始化 Ollama 模型并绑定工具
    // 注意：这里我们将工具直接传递给模型，而不是写在 Prompt 里
    // @ts-ignore
    let model = new ChatOllama({
        model: OLLAMA_MODEL,
        base_url: OLLAMA_BASE_URL,
        temperature: 0,
        structuredOutputs: true,
        streaming: false
    }).bindTools(tools);

    // 3. 实现 Agent 核心循环
    async function runAgent(userQuestion: string) {
        const messages: Array<BaseMessage> = [new HumanMessage(userQuestion)];

        const MAX_ITERATIONS = 5;
        let iterations = 0;

        console.log(`\n👤 用户提问: ${userQuestion}`);

        while (iterations < MAX_ITERATIONS) {
            iterations++;
            console.log(`\n--- 第 ${iterations} 轮思考 ---`);

            // A. 请求大模型
            const response = await model.invoke(messages);

            console.log(`本轮大模型的回答：${JSON.stringify(response)}`);

            // B. 判断结果类型
            // 检查 AIMessage 中的 tool_calls 字段。
            // 如果有值，说明模型想调用工具；如果是空数组或 undefined，说明模型直接回答了。
            const toolCalls = response.tool_calls || [];

            if (toolCalls.length > 0) {
                // --- 情况 1: 模型请求调用工具 ---

                // 将模型的回复（包含 tool_calls）加入历史
                messages.push(response);

                // 遍历所有请求调用的工具（模型可能一次性请求多个，虽然这里是一个）
                for (const toolCall of toolCalls) {
                    const selectedTool = tools.find((t) => t.name === toolCall.name);

                    if (selectedTool) {
                        // 执行工具
                        const observation = await selectedTool.invoke(toolCall.args);

                        // 将工具执行结果封装为 ToolMessage 并加入历史
                        // 注意：必须使用 tool_call_id 来关联请求和响应
                        messages.push(
                            new ToolMessage({
                                content: observation,
                                tool_call_id: toolCall.id!,
                                name: selectedTool.name,
                            })
                        );
                    } else {
                        console.warn(`⚠️ 模型请求了未知的工具: ${toolCall.name}`);
                    }
                }
            } else {
                // --- 情况 2: 模型给出最终答案 ---
                console.log(`\n✅ 最终回答: ${response.content}`);
                return response.content;
            }
        }

        console.log(`\n⚠️ 达到最大循环次数 (${MAX_ITERATIONS})，停止。`);
        return "达到最大尝试次数，未能得出结论。";
    }

    // 4. 执行
    await (async () => {
        try {
            process.env.NO_PROXY = "localhost,127.0.0.1,::1";
            await runAgent("3加上4，然后值乘于7等于多少？");
        } catch (error) {
            console.error("发生错误:", error);
        }
    })();
}

main().catch(error => {});
