<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>多Agent圆桌会议</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
        .fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
        .fade-enter, .fade-leave-to { opacity: 0; }
    </style>
</head>
<body class="bg-gray-100 h-screen flex flex-col">
    <div id="app" class="flex-1 flex overflow-hidden">
        
        <!-- 左侧：控制面板 -->
        <div class="w-1/3 bg-white p-4 border-r shadow-lg flex flex-col gap-4 overflow-y-auto z-10">
            <h2 class="text-xl font-bold text-gray-800 border-b pb-2">控制台</h2>
            
            <!-- 1. 全局控制：开始本轮对话 -->
            <div class="p-4 bg-indigo-50 rounded border border-indigo-100">
                <label class="block text-sm font-bold mb-2 text-indigo-800">🔥 流程控制</label>
                <button @click="triggerRound(null, 'System')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-200 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    开始/继续 本轮对话
                </button>
                <p class="text-xs text-indigo-500 mt-2">点击后，当前轮值的 Agent 将按顺时针顺序发言。</p>
            </div>

            <!-- 设定话题 -->
            <div class="p-3 bg-blue-50 rounded border border-blue-100">
                <label class="block text-sm font-bold mb-1 text-blue-800">📢 设定话题</label>
                <div class="flex gap-2">
                    <input v-model="topicInput" type="text" class="border p-2 rounded flex-1 text-sm" placeholder="例如：AI是否会取代人类？">
                    <button @click="setTopic" class="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded text-sm transition">发布</button>
                </div>
            </div>

            <!-- 添加Agent -->
            <div class="p-3 bg-green-50 rounded border border-green-100">
                <label class="block text-sm font-bold mb-1 text-green-800">➕ 加入Agent</label>
                <input v-model="newAgent.name" type="text" placeholder="名字" class="border p-1 w-full mb-1 text-sm">
                <textarea v-model="newAgent.persona" placeholder="人设 (例如：悲观的哲学家)" class="border p-1 w-full mb-2 text-sm"></textarea>
                <button @click="addAgent" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded w-full text-sm transition">加入圆桌</button>
            </div>

            <!-- 2. 移除Agent功能 -->
            <div class="p-3 bg-red-50 rounded border border-red-100">
                <label class="block text-sm font-bold mb-1 text-red-800">➖ 移除Agent</label>
                <div class="flex gap-2">
                    <input v-model="removeAgentId" type="text" class="border p-2 rounded flex-1 text-sm" placeholder="输入 Agent ID">
                    <button @click="removeAgent(removeAgentId)" class="bg-red-600 hover:bg-red-700 text-white px-3 rounded text-sm transition">移除</button>
                </div>
                <p class="text-xs text-red-400 mt-1">输入ID可移除发言组或观察组成员。</p>
            </div>

            <!-- 列表展示：发言组 -->
            <div>
                <h3 class="font-bold text-gray-600 mb-2 flex justify-between">
                    <span>🎙️ 发言组 ({{ speakers.length }}/{{ maxSpeakers }})</span>
                </h3>
                <ul class="space-y-2">
                    <li v-for="s in speakers" :key="s.id" class="flex justify-between items-center bg-gray-50 p-2 rounded border hover:shadow-sm transition">
                        <div class="overflow-hidden">
                            <span class="font-bold block text-gray-800">{{ s.name }}</span>
                            <span class="text-xs text-gray-500 block truncate">{{ s.persona }}</span>
                            <span class="text-[10px] text-gray-300 font-mono mt-1 block">ID: {{ s.id }}</span>
                        </div>
                    </li>
                    <li v-if="speakers.length === 0" class="text-gray-400 text-sm italic text-center py-2">暂无发言人</li>
                </ul>
            </div>

            <!-- 列表展示：观察组 -->
            <div>
                <h3 class="font-bold text-gray-600 mb-2">👀 观察组 ({{ observers.length }})</h3>
                <ul class="space-y-2">
                    <li v-for="o in observers" :key="o.id" class="flex justify-between items-center bg-gray-50 p-2 rounded border opacity-75 hover:opacity-100 transition">
                        <div class="overflow-hidden">
                            <span class="font-bold block text-gray-800">{{ o.name }}</span>
                            <span class="text-[10px] text-gray-300 font-mono mt-1 block">ID: {{ o.id }}</span>
                        </div>
                    </li>
                    <li v-if="observers.length === 0" class="text-gray-400 text-sm italic text-center py-2">暂无观察者</li>
                </ul>
            </div>
        </div>

        <!-- 右侧：对话展示 -->
        <div class="flex-1 flex flex-col bg-gray-50">
            <div class="p-4 bg-white border-b shadow flex justify-between items-center">
                <div>
                    <h2 class="text-lg font-bold text-gray-700">当前话题</h2>
                    <p class="text-blue-600 font-medium">{{ topic }}</p>
                </div>

                <!-- 新增：倒计时显示 -->
                <div class="flex items-center gap-3">
                    <div v-if="countdown < 10" class="text-right">
                        <span class="block text-xs text-orange-500 animate-pulse">AI 接管倒计时</span>
                        <span class="text-2xl font-mono font-bold text-orange-600">{{ countdown }}s</span>
                    </div>
                    <div class="text-right">
                        <span class="block text-xs text-gray-400">上一位发言者</span>
                        <span class="font-bold text-gray-600">{{ lastSpeaker || '-' }}</span>
                    </div>
                </div>

                <div class="text-right">
                    <span class="block text-xs text-gray-400">上一位发言者</span>
                    <span class="font-bold text-gray-600">{{ lastSpeaker || '-' }}</span>
                </div>
            </div>

            <!-- 消息流 -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="chatContainer">
                <div v-for="(msg, index) in history" :key="index" 
                     class="flex flex-col animate-fade-in-up"
                     :class="msg.role === 'system' ? 'items-center' : (msg.name === lastSpeaker ? 'items-end' : 'items-start')">
                    
                    <!-- 系统消息 -->
                    <div v-if="msg.role === 'system'" class="text-gray-400 text-sm italic my-2 bg-gray-100 px-3 py-1 rounded-full">
                        {{ msg.content }}
                    </div>

                    <!-- 用户消息气泡 -->
                    <div v-else class="max-w-2xl p-4 rounded-lg shadow-sm border border-gray-100 relative group"
                         :class="msg.name === lastSpeaker ? 'bg-indigo-50 border-indigo-100' : 'bg-white'">
                        
                        <div class="flex justify-between items-baseline mb-1">
                            <span class="font-bold text-sm" :class="msg.name === lastSpeaker ? 'text-indigo-800' : 'text-blue-800'">{{ msg.name }}</span>
                            <span class="text-xs text-gray-400 font-mono">{{ msg.role }}</span>
                        </div>
                        
                        <p class="text-gray-700 leading-relaxed">{{ msg.content }}</p>
                        
                        <!-- 交互按钮：仅在非系统消息且非观察模式下显示 -->
                        <div v-if="msg.role === 'speaker'" class="mt-3 pt-2 border-t border-gray-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button @click="triggerRound(null, msg.name)" class="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-2 py-1 rounded shadow-sm">
                                ➡️ 下一位 (顺时针)
                            </button>
                            
                            <div class="relative group/sub">
                                <button class="text-xs bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded shadow-sm">
                                    🎯 指定回答...
                                </button>
                                <!-- 下拉菜单 -->
                                <div class="absolute hidden group-hover/sub:block bg-white border shadow-xl rounded mt-1 z-20 min-w-[150px]">
                                    <div v-for="s in speakers" :key="s.id" 
                                         @click="triggerRound(s.id, msg.name)"
                                         class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b last:border-0">
                                        请 <span class="font-bold">{{ s.name }}</span> 回答
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const { createApp, ref, nextTick, onMounted, onUnmounted } = Vue;

        createApp({
            setup() {
                // 自动检测 WebSocket 地址
                const getWsUrl = () => {
                    const host = window.location.host;
                    if (!host) return "ws://127.0.0.1:8000/ws"; // 兼容 file:// 协议
                    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    return `${protocol}//${host}/ws`;
                };

                let ws = null;
                const wsUrl = getWsUrl();
                console.log(`正在连接 WebSocket: ${wsUrl}`);

                const topic = ref("未设定话题");
                const topicInput = ref("");
                const speakers = ref([]);
                const observers = ref([]);
                const history = ref([]);
                const lastSpeaker = ref("");
                const maxSpeakers = ref(3);

                // 表单数据
                const newAgent = ref({ name: "", persona: "" });
                const removeAgentId = ref(""); // 新增：移除用的ID输入框
                const countdown = ref(10); // 倒计时秒数
                let timer = null;          // 定时器句柄
                const isAutoThinking = ref(false); // 是否正在自动决策中

                const initWebSocket = () => {
                    ws = new WebSocket(wsUrl);

                    ws.onopen = () => console.log("WebSocket 连接成功");
                    
                    ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        if (data.type === 'state_update') {
                            topic.value = data.topic;
                            speakers.value = data.speakers;
                            observers.value = data.observers;
                            history.value = data.history;
                        } else if (data.type === 'new_message') {
                            history.value.push(data.data);
                            lastSpeaker.value = data.data.name;
                            scrollToBottom();
                            // 收到新消息后，重置倒计时 ---
                            resetCountdown();
                        }
                    };

                    ws.onclose = () => setTimeout(initWebSocket, 5000);
                };

                const scrollToBottom = () => {
                    nextTick(() => {
                        const container = document.querySelector('.overflow-y-auto');
                        if(container) container.scrollTop = container.scrollHeight;
                    });
                };

                // API 调用函数
                const setTopic = async () => {
                    await fetch('/api/topic', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ topic: topicInput.value })
                    });
                    topicInput.value = "";
                };

                const addAgent = async () => {
                    const id = Math.random().toString(36).substr(2, 9);
                    await fetch('/api/agent/add', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ ...newAgent.value, id })
                    });
                    newAgent.value = { name: "", persona: "" };
                };

                const removeAgent = async (id) => {
                    if(!id) return alert("请输入 Agent ID");
                    if(!confirm(`确定要移除 ID 为 ${id} 的 Agent 吗？`)) return;
                    
                    await fetch(`/api/agent/remove/${id}`, { method: 'POST' });
                    removeAgentId.value = ""; // 清空输入框
                };

                const triggerRound = async (targetId, callerName) => {
                    const url = `/api/round?caller_id=${callerName || ''}&target_id=${targetId || ''}`;
                    await fetch(url, { method: 'POST' });
                };

                const resetCountdown = () => {
                    if (timer) clearInterval(timer);
                    countdown.value = 10; // 重置为 10 秒
                    isAutoThinking.value = false;
                    
                    // 开始倒计时
                    timer = setInterval(() => {
                        if (countdown.value > 0) {
                            countdown.value--;
                        } else {
                            // 时间到，触发 AI 决策
                            clearInterval(timer);
                            triggerAutoDecision();
                        }
                    }, 1000);
                };

                const triggerAutoDecision = async () => {
                    if (isAutoThinking.value) return; // 防止重复触发
                isAutoThinking.value = true;
                
                // 1. 在界面上显示一个系统提示
                history.value.push({
                    "name": "AI 导演", 
                    "role": "system", 
                    "content": "⏱️ 倒计时结束，AI 正在分析局势并决定下一位发言人..."
                });
                scrollToBottom();

                try {
                    // 2. 调用后端决策接口
                    const response = await fetch('/api/director/decide', { method: 'POST' });
                    const data = await response.json();
                    
                    if (data.status === 'success') {
                        const decision = data.decision;
                        
                        // 3. 记录决策理由（可选，用于调试和展示）
                        history.value.push({
                            "name": "AI 导演", 
                            "role": "system", 
                            "content": `🤖 决策结果：${decision.reason}`
                        });

                        // --- 核心修复部分 ---
                        if (decision.decision === 'target' && decision.target_id) {
                            // 情况 A: AI 决定指定某人
                            console.log("AI 指定发言者:", decision.target_id);
                            // 调用 /api/round 并传递 target_id
                            await triggerRound(decision.target_id, 'AI 导演');
                        } else {
                            // 情况 B: AI 决定顺时针 (decision == 'next') 或者 决策出错
                            console.log("AI 决定顺时针发言");
                            // 调用 /api/round 不传递 target_id (即为空字符串)
                            await triggerRound(null, 'AI 导演');
                        }
                        // --- 修复结束 ---

                    } else {
                        // 接口调用失败，默认顺时针
                        await triggerRound(null, 'AI 导演');
                    }
                } catch (e) {
                    console.error("自动决策失败", e);
                    // 发生错误默认顺时针
                    await triggerRound(null, 'AI 导演');
                } finally {
                    isAutoThinking.value = false;
                }
            };

                // 用户手动操作时停止倒计时
                // 我们修改 triggerRound 函数，当用户点击时，清除定时器
                const originalTriggerRound = async (targetId, callerName) => {
                    if (timer) clearInterval(timer); // 用户操作，停止倒计时
                    countdown.value = 10; // 重置显示
                    const url = `/api/round?caller_id=${callerName || ''}&target_id=${targetId || ''}`;
                    await fetch(url, { method: 'POST' });
                };

                onMounted(() => {
                    initWebSocket();
                });

                onUnmounted(() => {
                    if (timer) clearInterval(timer);
                });

                return {
                    topic, topicInput, speakers, observers, history, newAgent, maxSpeakers, removeAgentId, countdown,
                    setTopic, addAgent, removeAgent, triggerRound: originalTriggerRound, lastSpeaker
                };
            }
        }).mount('#app');
    </script>
</body>
</html>
