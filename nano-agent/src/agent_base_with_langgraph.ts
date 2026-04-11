import { ChatOllama } from "@langchain/ollama";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

// 从 langgraph 导入构建图所需的组件
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {BaseMessage} from "@langchain/core/dist/messages/base";

// ==========================================
// 1. 开启调试模式
// ==========================================
process.env.LANGCHAIN_VERBOSE = "true";
process.env.NO_PROXY = "localhost,127.0.0.1,::1";

const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const OLLAMA_MODEL = 'qwen3.5:2b';

// ==========================================
// 2. 定义工具
// ==========================================
const addTool = tool(
    async ({ a, b }) => {
        console.log(`   >> [执行] 计算 ${a} + ${b}`);
        return (a + b).toString();
    },
    {
        name: "add",
        description: "计算两个数字的和。",
        schema: z.object({
            a: z.number().describe("第一个加数"),
            b: z.number().describe("第二个加数"),
        }),
    }
);

const multiplyTool = tool(
    async ({ a, b }) => {
        console.log(`   >> [执行] 计算 ${a} * ${b}`);
        return (a * b).toString();
    },
    {
        name: "multiply",
        description: "计算两个数字的乘积。",
        schema: z.object({
            a: z.number().describe("第一个乘数"),
            b: z.number().describe("第二个乘数"),
        }),
    }
);

const tools = [addTool, multiplyTool];
const toolMap = Object.fromEntries(tools.map(t => [t.name, t]));

// ==========================================
// 3. 定义图状态 (State)
// ==========================================
// 状态是贯穿整个图流程的数据，这里我们主要关心消息列表
const AgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y), // 定义如何更新消息列表（追加）
        default: () => [],
    }),
});

// ==========================================
// 4. 初始化模型
// ==========================================
// @ts-ignore
const model = new ChatOllama({
    model: OLLAMA_MODEL,
    base_url: OLLAMA_BASE_URL,
    temperature: 0,
    structuredOutputs: true,
    streaming: false
}).bindTools(tools); // 将工具绑定到模型

// ==========================================
// 5. 定义图的节点 (Nodes)
// ==========================================

// Agent 节点：调用模型
async function callModel(state: typeof AgentState.State) {
    const messages = state.messages;
    const response = await model.invoke(messages);
    // 返回一个更新，将模型的响应添加到状态中
    return { messages: [response] };
}

// 工具节点：执行工具
async function callTools(state: typeof AgentState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    const toolCalls = lastMessage.tool_calls || [];

    const toolMessages = [];
    for (const toolCall of toolCalls) {
        const selectedTool = toolMap[toolCall.name];
        if (selectedTool) {
            const observation = await selectedTool.invoke(toolCall.args);
            toolMessages.push(
                new ToolMessage({
                    content: observation,
                    tool_call_id: toolCall.id!,
                    name: selectedTool.name,
                })
            );
        }
    }
    // 返回一个更新，将工具的执行结果添加到状态中
    return { messages: toolMessages };
}

// ==========================================
// 6. 定义图的边 (Edges) - 路由逻辑
// ==========================================
function shouldContinue(state: typeof AgentState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;

    // 如果最后一条消息包含工具调用，则继续执行工具节点
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "tools";
    }
    // 否则，结束流程
    return END;
}

// ==========================================
// 7. 构建图
// ==========================================
const workflow = new StateGraph(AgentState)
    // 添加节点
    .addNode("agent", callModel)
    .addNode("tools", callTools)
    // 定义入口
    .addEdge(START, "agent")
    // 定义从 agent 节点出来的路由
    .addConditionalEdges("agent", shouldContinue, {
        "tools": "tools",
        [END]: END,
    })
    // 定义从工具节点出来后，总是回到 agent 节点继续思考
    .addEdge("tools", "agent");

// 编译图，生成可执行的 Agent
const agent = workflow.compile();

// ==========================================
// 8. 执行调用
// ==========================================
async function main() {
    const input = "3加上4，然后值乘于7等于多少？";
    console.log(`\n👤 用户: ${input}`);

    try {
        // 调用 agent，传入初始状态
        const result = await agent.invoke({ messages: [new HumanMessage(input)] });

        // 结果中包含了完整的消息历史，最后一条是最终答案
        const finalMessage = result.messages[result.messages.length - 1];
        console.log(`\n✅ 最终结果: ${finalMessage.content}`);
    } catch (error) {
        console.error("执行出错:", error);
    }
}

main().then(r => {});
