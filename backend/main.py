from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json

env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

from rag import RAGEngine
from knowledge_gap_service import KnowledgeGapService, KnowledgeGapRequest

app = FastAPI(title="AI Learning Engine API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG engine instance to persist the active document's vector index
active_engine = None

# Knowledge Gap Service — lazy singleton
_kg_service: Optional[KnowledgeGapService] = None

def get_kg_service() -> KnowledgeGapService:
    global _kg_service
    if _kg_service is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and api_key != "your_api_key_here":
            from google import genai
            client = genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})
            _kg_service = KnowledgeGapService(gemini_client=client)
        else:
            _kg_service = KnowledgeGapService(gemini_client=None)
    return _kg_service

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class QuizRequest(BaseModel):
    difficulty: str

class AuthRequest(BaseModel):
    username: str
    password: str

class SkillUpdateRequest(BaseModel):
    username: str
    topic: str
    skills: List[str]

USERS_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "users.json")
os.makedirs(os.path.dirname(USERS_DB_PATH), exist_ok=True)
if not os.path.exists(USERS_DB_PATH):
    with open(USERS_DB_PATH, "w") as f:
        json.dump({}, f)

@app.post("/api/summarize")
async def summarize_document(files: List[UploadFile] = File(...)):
    global active_engine
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded")
        
    if len(files) > 2:
        raise HTTPException(status_code=400, detail="Maximum 2 files allowed")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured in environment.")

    try:
        engine = RAGEngine(api_key=api_key)
        
        combined_text = ""
        filenames = []
        
        for file in files:
            content = await file.read()
            text = engine.extract_text(content, file.filename, file.content_type)
            if text:
                combined_text += f"\n\n--- Start of {file.filename} ---\n\n"
                combined_text += text
                filenames.append(file.filename)
                
        if not combined_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the provided documents. Please ensure they contain readable text, not just scanned images.")

        # Save extracted text to disk for verification
        from datetime import datetime
        import re
        save_dir = os.path.join(os.path.dirname(__file__), "extracted_texts")
        os.makedirs(save_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_names = "_".join(re.sub(r"[^\w\-.]", "_", fn) for fn in filenames)
        save_path = os.path.join(save_dir, f"{timestamp}_{safe_names}.txt")

        with open(save_path, "w", encoding="utf-8") as f:
            f.write(combined_text)

        print(f"[EXTRACT] Saved extracted text → {save_path}")
        print(f"[EXTRACT] Total characters extracted: {len(combined_text)}")
            
        # 1. Direct Summarization (NO RAG)
        json_string = engine.generate_summary(combined_text)
        
        # 2. Build FAISS Vector Index in the background/synchronously for the Chatbot
        engine.setup_chat_index(combined_text)
        
        # Save engine instance globally for chatbot queries
        active_engine = engine
        
        try:
            return json.loads(json_string, strict=False)
        except json.JSONDecodeError:
            print("Failed to parse JSON:", json_string)
            raise HTTPException(status_code=500, detail="AI response was not valid JSON.")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/api/chat")
async def chat_with_notes(request: ChatRequest):
    global active_engine
    if not active_engine:
        raise HTTPException(status_code=400, detail="No active document found. Please upload a document first.")
    
    try:
        # Convert Pydantic models to dictionaries
        history_list = [{"role": msg.role, "text": msg.text} for msg in request.history]
        response_text = active_engine.answer_chat_question(request.message, history=history_list)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/api/quiz/generate")
async def generate_quiz(request: QuizRequest):
    global active_engine
    if not active_engine:
        raise HTTPException(status_code=400, detail="No active document found. Please upload a document first.")
    
    try:
        quiz_json = active_engine.generate_quiz(request.difficulty)
        return json.loads(quiz_json, strict=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")

@app.post("/api/auth/signup")
async def signup(request: AuthRequest):
    try:
        with open(USERS_DB_PATH, "r") as f:
            users = json.load(f)
        
        if request.username in users:
            raise HTTPException(status_code=400, detail="Username already exists")
            
        users[request.username] = {
            "password": request.password,
            "skills": {}
        }
        
        with open(USERS_DB_PATH, "w") as f:
            json.dump(users, f)
            
        return {"status": "success", "username": request.username}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup error: {str(e)}")

@app.post("/api/auth/login")
async def login(request: AuthRequest):
    try:
        with open(USERS_DB_PATH, "r") as f:
            users = json.load(f)
            
        if request.username not in users or users[request.username]["password"] != request.password:
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        return {"status": "success", "username": request.username}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@app.get("/api/skills")
async def get_skills(username: str):
    try:
        with open(USERS_DB_PATH, "r") as f:
            users = json.load(f)
            
        if username not in users:
            return {"skills": {}}
            
        current_skills = users[username].get("skills", {})
        if isinstance(current_skills, list):
            current_skills = {"General": current_skills}
            
        return {"skills": current_skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading skills: {str(e)}")

@app.post("/api/career/analyze")
async def career_analyze(
    resume: UploadFile = File(...),
    desired_role: str = Form(...),
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    try:
        engine = RAGEngine(api_key=api_key)
        content = await resume.read()
        text = engine.extract_text(content, resume.filename, resume.content_type)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the resume. Please ensure it is not a scanned image."
            )

        json_string = engine.analyze_career(text, desired_role)

        try:
            return json.loads(json_string, strict=False)
        except json.JSONDecodeError:
            print("Failed to parse career JSON:", json_string)
            raise HTTPException(status_code=500, detail="AI response was not valid JSON.")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Career analysis error: {str(e)}")


@app.post("/api/skills/update")
async def update_skills(request: SkillUpdateRequest):
    try:
        with open(USERS_DB_PATH, "r") as f:
            users = json.load(f)
            
        if request.username not in users:
            raise HTTPException(status_code=404, detail="User not found")
        user_data = users[request.username]
        current_skills = user_data.get("skills", {})
        if isinstance(current_skills, list):
            current_skills = {"General": current_skills}
            
        topic_skills = set(current_skills.get(request.topic, []))
        
        for skill in request.skills:
            topic_skills.add(skill)
            
        current_skills[request.topic] = list(topic_skills)
        user_data["skills"] = current_skills
        users[request.username] = user_data
        
        with open(USERS_DB_PATH, "w") as f:
            json.dump(users, f)
            
        return {"status": "success", "skills": current_skills}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating skills: {str(e)}")

# ──────────────────────────────────────────────────────────────────────────────
# Knowledge Gap & Career Readiness Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/api/career/readiness")
async def analyze_knowledge_gap(request: KnowledgeGapRequest):
    """
    POST /api/career/readiness
    Accepts skills extracted from resume + career goal.
    Returns readiness score, strong/missing skills, courses, certs, roadmap.
    Persists result to users.json under career_readiness key.
    """
    try:
        service = get_kg_service()
        response = service.analyze(request)
        result = response.model_dump()

        # Persist to users.json
        with open(USERS_DB_PATH, "r") as f:
            users = json.load(f)

        if request.username not in users:
            raise HTTPException(status_code=404, detail="User not found. Please log in first.")

        users[request.username]["career_readiness"] = {
            "career_goal": request.career_goal,
            "target_company": request.target_company,
            "current_skills": request.current_skills,
            "analysis": result
        }

        with open(USERS_DB_PATH, "w") as f:
            json.dump(users, f, indent=2)

        return {"status": "success", **result}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Knowledge gap analysis error: {str(e)}")


@app.get("/api/career/readiness")
async def get_knowledge_gap(username: str):
    """
    GET /api/career/readiness?username=<username>
    Returns the user's last saved career readiness analysis.
    """
    try:
        with open(USERS_DB_PATH, "r") as f:
            users = json.load(f)

        if username not in users:
            raise HTTPException(status_code=404, detail="User not found.")

        saved = users[username].get("career_readiness")
        if not saved:
            raise HTTPException(
                status_code=404,
                detail="No career readiness analysis found. Run an analysis first."
            )

        return {"status": "success", "data": saved}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching readiness data: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
