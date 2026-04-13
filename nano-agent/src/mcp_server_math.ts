import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({ name: "math-server", version: "0.1.0" }, {
    capabilities: { tools: {} },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "add",
                description: "Add two numbers",
                inputSchema: {
                    type: "object",
                    properties: {
                        a: { type: "number" },
                        b: { type: "number" },
                    },
                    required: ["a", "b"],
                },
            },
            {
                name: "multiply",
                description: "Multiply two numbers",
                inputSchema: {
                    type: "object",
                    properties: {
                        a: { type: "number" },
                        b: { type: "number" },
                    },
                    required: ["a", "b"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { a, b } = request.params.arguments as { a: number; b: number };
    let result: number;
    if (request.params.name === "add") {
        result = a + b;
    } else if (request.params.name === "multiply") {
        result = a * b;
    } else {
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
    return { content: [{ type: "text", text: String(result) }] };
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main();
