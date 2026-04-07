import asyncio
import json
import os
from typing import List, Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

# --- 配置 ---
# 请确保设置了环境变量 OPENAI_API_KEY
# llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)

# 定义决策的提示词模板
DECISION_PROMPT_TEMPLATE = """
你是一个圆桌会议的智能主持人。
当前话题：{topic}

【当前发言组名单及人设】：
{speakers}

【最近几轮对话历史】：
{history}

请分析对话走向和参与者的人设，决定下一步该怎么做。
决策逻辑：
1. 如果某人的观点被质疑，或者需要某个人设（如专家、反对者）来补充观点，请指定某人回答。
2. 如果当前话题已经讨论充分，或者需要轮流发表看法，请建议顺时针进行。

请仅返回一个 JSON 格式的结果，不要包含其他废话：
{{
    "decision": "next" 或 "target", 
    "target_id": "如果是target，这里填Agent的ID；如果是next，这里填null",
    "reason": "简短的理由，说明参考了哪个人设或观点"
}}
"""

os.environ["NO_PROXY"] = "localhost,127.0.0.1,::1"

llm = init_chat_model(
    model='ollama.rnd.huawei.com/library/qwen3:1.7b',
    model_provider='ollama',
    base_url='http://127.0.0.1:11434'
)

app = FastAPI()

# --- 数据模型 ---
class AgentConfig(BaseModel):
    id: str
    name: str
    persona: str  # 人设描述

class TopicInput(BaseModel):
    topic: str

# --- 核心状态管理 ---
class RoomState:
    def __init__(self, max_speakers: int = 3):
        self.max_speakers = max_speakers
        self.topic: str = ""
        self.speakers: List[AgentConfig] = []  # 发言组
        self.observers: List[AgentConfig] = [] # 观察组
        self.history: List[Dict] = []          # 对话历史
        self.current_speaker_index: int = 0    # 当前发言索引

    def add_agent(self, agent: AgentConfig):
        # 规则3: 判断人数，满了进观察组
        if len(self.speakers) < self.max_speakers:
            self.speakers.append(agent)
            return "speaker"
        else:
            self.observers.append(agent)
            return "observer"

    def remove_agent(self, agent_id: str):
        # 规则4: 退出机制
        for group in [self.speakers, self.observers]:
            for agent in group:
                if agent.id == agent_id:
                    group.remove(agent)
                    # 如果发言组少人了，尝试从观察组补人
                    if group == self.speakers and len(self.speakers) < self.max_speakers and self.observers:
                        promoted = self.observers.pop(0)
                        self.speakers.append(promoted)
                        return promoted, "promoted"
                    return agent, "removed"
        return None, "not_found"

    def get_next_speaker(self):
        if not self.speakers: return None
        speaker = self.speakers[self.current_speaker_index]
        self.current_speaker_index = (self.current_speaker_index + 1) % len(self.speakers)
        return speaker

room = RoomState()

# --- 广播管理器 ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # 发送当前状态
        await self.update_state(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)
    
    async def update_state(self, websocket: Optional[WebSocket] = None):
        # 广播当前房间状态（谁在说话，谁在观察，历史记录）
        state_data = {
            "type": "state_update",
            "topic": room.topic,
            "speakers": [s.dict() for s in room.speakers],
            "observers": [o.dict() for o in room.observers],
            "history": room.history
        }
        if websocket:
            await websocket.send_json(state_data)
        else:
            await self.broadcast(state_data)

manager = ConnectionManager()

# --- 核心逻辑：Agent 思考与发言 ---
async def agent_speak(agent: AgentConfig, target: Optional[str] = None):
    # 规则5: 构建提示词
    # 获取最近的上下文
    context = room.history[-5:] if room.history else []
    
    system_prompt = f"""
    你是一个圆桌会议的参与者。
    你的名字是 {agent.name}。
    你的人设是：{agent.persona}。
    你必须严格保持这个人设进行发言。
    当前讨论的话题是：{room.topic}。
    """
    
    user_prompt = ""
    if target:
        # 规则5: 被点名 -> 直接作答
        user_prompt = f"{target} 专门请你回答，请针对他的发言进行回应。"
    else:
        # 规则5: 顺时针回答 -> 发表建议
        user_prompt = "轮到你发言了，请发表你的观点或建议。"
    
    # 调用 LLM
    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt + f"\n上下文: {context}")
        ])
        content = response.content
    except Exception as e:
        content = f"[系统错误: {str(e)}]"

    # 记录历史
    message_record = {"name": agent.name, "role": "speaker", "content": content, "target": target}
    room.history.append(message_record)
    
    # 广播消息
    await manager.broadcast({"type": "new_message", "data": message_record})
    await manager.update_state()

# --- API 路由 ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # 保持连接
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def serve_frontend():
    # 确保 index.html 和 main.py 在同一个文件夹内
    return FileResponse("index.html")

@app.post("/api/topic")
async def set_topic(input: TopicInput):
    room.topic = input.topic
    room.history.append({"name": "System", "role": "system", "content": f"话题已设定为: {input.topic}"})
    await manager.update_state()
    return {"status": "success"}

@app.post("/api/agent/add")
async def add_agent(agent: AgentConfig):
    status = room.add_agent(agent)
    await manager.update_state()
    return {"status": "success", "role": status}

@app.post("/api/agent/remove/{agent_id}")
async def remove_agent(agent_id: str):
    agent, status = room.remove_agent(agent_id)
    if status == "not_found":
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # 如果有代理人被移除，通知前端
    await manager.update_state()
    return {"status": "success", "removed": agent.dict() if agent else None, "action": status}

@app.post("/api/round")
async def trigger_round(target_id: Optional[str] = None, caller_id: Optional[str] = None):
    """
    触发一轮发言。
    如果 target_id 存在，则指定某人回答。
    否则，按顺时针逻辑获取下一位发言人。
    """
    next_speaker = None
    
    if target_id:
        # 规则5: 指定回答
        target_agent = next((a for a in room.speakers if a.id == target_id), None)
        if target_agent:
            next_speaker = target_agent
            # 异步执行，不阻塞API返回
            asyncio.create_task(agent_speak(next_speaker, target=caller_id))
    else:
        # 规则5: 顺时针
        next_speaker = room.get_next_speaker()
        if next_speaker:
            asyncio.create_task(agent_speak(next_speaker))

    if not next_speaker:
        return {"status": "error", "message": "No speakers available"}
    
    return {"status": "success", "speaking": next_speaker.name}

@app.post("/api/director/decide")
async def director_decide():
    try:
        # 1. 准备上下文数据
        recent_history = room.history[-5:] if room.history else []
        history_str = "\n".join([f"{h['name']}: {h['content']}" for h in recent_history])
        
        # --- 修改点：传递包含人设的详细信息 ---
        # 将 Agent 对象转换为字符串描述，包含名字和人设
        speakers_details = []
        for s in room.speakers:
            speakers_details.append(f"- {s.name} (人设: {s.persona})")
        
        speakers_str = "\n".join(speakers_details)

        # 2. 构建 Prompt (优化版)
        # 提示词中明确要求模型参考人设
        prompt = PromptTemplate(
            input_variables=["topic", "history", "speakers"],
            template=DECISION_PROMPT_TEMPLATE
        )
        
        final_prompt = prompt.format(
            topic=room.topic, 
            history=history_str, 
            speakers=speakers_str # 这里现在包含了人设信息
        )

        # 3. 调用 LLM
        response = await llm.ainvoke([HumanMessage(content=final_prompt)])
        content = response.content
        
        # 清洗 JSON
        content = content.replace("```json", "").replace("```", "").strip()
        decision_data = json.loads(content)

        return {"status": "success", "decision": decision_data}

    except Exception as e:
        print(f"Director decision error: {e}")
        return {"status": "error", "decision": {"decision": "next", "reason": "系统决策错误，默认顺时针"}}
