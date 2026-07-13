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
    question_count: int = 10

class HintRequest(BaseModel):
    question: str
    options: list
    skill: str
    difficulty: str

class AuthRequest(BaseModel):
    username: str
    password: str
    discord_user_id: Optional[str] = None  # Provided only during signup

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
        quiz_json = active_engine.generate_quiz(request.difficulty, request.question_count)
        return json.loads(quiz_json, strict=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")

@app.post("/api/quiz/hint")
async def get_quiz_hint(request: HintRequest):
    global active_engine
    if not active_engine:
        raise HTTPException(status_code=400, detail="No active document found. Please upload a document first.")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    options_text = "\n".join([f"  - {opt}" for opt in request.options])
    prompt = f"""
You are a helpful tutor for a student doing a {request.difficulty} level quiz about "{request.skill}".

The student is stuck on this question:
Question: {request.question}

Options:
{options_text}

Give a SHORT, helpful HINT (2-3 sentences max) that guides the student toward the correct answer WITHOUT directly revealing it.
Do NOT say which option is correct. Instead, point them to the underlying concept or give a memory tip.
Be encouraging and educational."""

    try:
        from google import genai as genai_lib
        client = genai_lib.Client(api_key=api_key, http_options={"api_version": "v1beta"})
        result = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt]
        )
        hint_text = result.text.strip()
        return {"hint": hint_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hint generation error: {str(e)}")

import sqlite3
from database import get_db_connection, init_db
from discord_service import create_team_channel

# Initialize database on startup
init_db()

@app.post("/api/auth/signup")
async def signup(request: AuthRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                'INSERT INTO users (username, password, skills, discord_user_id) VALUES (?, ?, ?, ?)',
                (request.username, request.password, "[]", request.discord_user_id or None)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Username already exists")
        finally:
            conn.close()

        return {"status": "success", "username": request.username}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup error: {str(e)}")

@app.post("/api/auth/login")
async def login(request: AuthRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            (request.username, request.password)
        )
        user = cursor.fetchone()
        conn.close()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        return {
            "status": "success",
            "username": request.username,
            "discord_user_id": user['discord_user_id'],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")


class UpdateDiscordRequest(BaseModel):
    username: str
    discord_user_id: str

@app.get("/api/user/dashboard")
async def get_user_dashboard(username: str):
    """Return a user's profile, Discord ID, and teams they are part of."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Profile
        cursor.execute(
            'SELECT username, career_goal, skills, discord_user_id, created_at FROM users WHERE username = ?',
            (username,)
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
            
        try:
            skills = json.loads(row['skills'] or "[]")
        except Exception:
            skills = []
            
        profile = {
            "username": row['username'],
            "career_goal": row['career_goal'],
            "skills": skills,
            "discord_user_id": row['discord_user_id'],
            "created_at": row['created_at'],
        }
        
        # Teams
        cursor.execute('''
            SELECT t.id, t.hackathon_name, t.discord_channel_url
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            JOIN users u ON tm.user_id = u.id
            WHERE u.username = ?
        ''', (username,))
        teams_rows = cursor.fetchall()
        
        teams = []
        for t_row in teams_rows:
            team_id = t_row['id']
            # Get members for this team
            cursor.execute('''
                SELECT u.username, u.discord_user_id
                FROM team_members tm
                JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = ?
            ''', (team_id,))
            members = [dict(m) for m in cursor.fetchall()]
            
            teams.append({
                "id": team_id,
                "hackathon_name": t_row['hackathon_name'],
                "discord_channel_url": t_row['discord_channel_url'],
                "members": members
            })
            
        conn.close()
        
        return {
            "profile": profile,
            "teams": teams
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard fetch error: {str(e)}")

class CreateTeamChannelRequest(BaseModel):
    team_id: int

@app.post("/api/discord/create-team-channel")
async def create_team_channel_endpoint(request: CreateTeamChannelRequest):
    """Creates a Discord channel for all members of a given team."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify team exists
        cursor.execute('SELECT hackathon_name, discord_channel_url FROM teams WHERE id = ?', (request.team_id,))
        team_row = cursor.fetchone()
        
        if not team_row:
            conn.close()
            raise HTTPException(status_code=404, detail="Team not found")
            
        if team_row['discord_channel_url']:
            conn.close()
            raise HTTPException(status_code=400, detail="Channel already created for this team")
            
        # Get team members and their discord IDs
        cursor.execute('''
            SELECT u.username, u.discord_user_id
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = ?
        ''', (request.team_id,))
        members = [dict(m) for m in cursor.fetchall()]
        
        # Check if anyone has a discord ID
        has_discord = any(m.get('discord_user_id') for m in members)
        if not has_discord:
            conn.close()
            raise HTTPException(status_code=400, detail="No team members have a Discord User ID set")
            
        # Call discord service
        discord_result = await create_team_channel(
            hackathon_name=team_row['hackathon_name'],
            team_members=members
        )
        
        if not discord_result['success']:
            conn.close()
            raise HTTPException(status_code=500, detail=f"Discord API Error: {discord_result['error']}")
            
        channel_url = discord_result['channel_url']
        
        # Save channel URL
        cursor.execute('UPDATE teams SET discord_channel_url = ? WHERE id = ?', (channel_url, request.team_id))
        conn.commit()
        conn.close()
        
        return {"status": "success", "discord_channel_url": channel_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Create team channel error: {str(e)}")

@app.get("/api/user/profile")
async def get_user_profile(username: str):
    """Return a user's profile including their Discord User ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT username, career_goal, skills, discord_user_id, created_at FROM users WHERE username = ?',
            (username,)
        )
        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        try:
            skills = json.loads(row['skills'] or "[]")
        except Exception:
            skills = []

        return {
            "username": row['username'],
            "career_goal": row['career_goal'],
            "skills": skills,
            "discord_user_id": row['discord_user_id'],
            "created_at": row['created_at'],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile fetch error: {str(e)}")


@app.patch("/api/user/discord")
async def update_discord_id(request: UpdateDiscordRequest):
    """Allow a user to set or update their Discord User ID at any time."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE users SET discord_user_id = ? WHERE username = ?',
            (request.discord_user_id.strip() or None, request.username)
        )
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
        conn.commit()
        conn.close()
        return {"status": "success", "discord_user_id": request.discord_user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discord update error: {str(e)}")

@app.get("/api/skills")
async def get_skills(username: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT skills FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        conn.close()
            
        if not row or not row['skills']:
            return {"skills": []}
            
        try:
            current_skills = json.loads(row['skills'])
        except json.JSONDecodeError:
            current_skills = []
            
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


# ──────────────────────────────────────────────────────────────────────────────
# Combined Full Career Analysis Endpoint
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/api/career/full-analysis")
async def career_full_analysis(
    resume: UploadFile = File(...),
    desired_role: str = Form(...),
    target_company: str = Form(""),
    username: str = Form(""),
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    try:
        # ── Step 1: Extract resume text
        engine = RAGEngine(api_key=api_key)
        content = await resume.read()
        text = engine.extract_text(content, resume.filename, resume.content_type)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the resume. Please ensure it is not a scanned image."
            )

        # ── Step 2: Career analysis (skills + projects)
        career_json_string = engine.analyze_career(text, desired_role)
        try:
            career_data = json.loads(career_json_string, strict=False)
        except json.JSONDecodeError:
            print("Failed to parse career JSON:", career_json_string)
            raise HTTPException(status_code=500, detail="AI career response was not valid JSON.")

        current_skills = career_data.get("currentSkills", [])
        skills_to_learn = career_data.get("skillsToLearn", [])
        projects = career_data.get("projects", [])

        # ── Step 3: Knowledge gap analysis (score + courses + roadmap)
        from knowledge_gap_service import KnowledgeGapRequest
        service = get_kg_service()
        kg_request = KnowledgeGapRequest(
            username=username or "anonymous",
            current_skills=current_skills,
            career_goal=desired_role,
            target_company=target_company.strip() or None,
        )
        kg_response = service.analyze(kg_request)
        kg_data = kg_response.model_dump()

        # ── Step 4: Persist to SQLite if user is logged in
        if username:
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    'UPDATE users SET career_goal = ?, skills = ? WHERE username = ?',
                    (desired_role, json.dumps(current_skills), username)
                )
                conn.commit()
                conn.close()
            except Exception as persist_err:
                print(f"[WARN] Could not persist career readiness to DB: {persist_err}")

        # ── Step 5: Merge and return
        return {
            "status": "success",
            "desiredRole": desired_role,
            "targetCompany": target_company.strip() or None,
            # From career analysis
            "currentSkills": current_skills,
            "skillsToLearn": skills_to_learn,
            "projects": projects,
            # From knowledge gap analysis
            "readiness_score": kg_data["readiness_score"],
            "score_explanation": kg_data["score_explanation"],
            "strong_skills": kg_data["strong_skills"],
            "missing_skills": kg_data["missing_skills"],
            "recommended_courses": kg_data["recommended_courses"],
            "recommended_certifications": kg_data["recommended_certifications"],
            "learning_roadmap": kg_data["learning_roadmap"],
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Full career analysis error: {str(e)}")


@app.post("/api/skills/update")
async def update_skills(request: SkillUpdateRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT skills FROM users WHERE username = ?', (request.username,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
            
        current_skills = []
        if row['skills']:
            try:
                current_skills = json.loads(row['skills'])
            except:
                pass
                
        # Simply append new skills (ensuring uniqueness)
        skills_set = set(current_skills)
        for s in request.skills:
            skills_set.add(s)
            
        new_skills = list(skills_set)
        
        cursor.execute(
            'UPDATE users SET skills = ? WHERE username = ?',
            (json.dumps(new_skills), request.username)
        )
        conn.commit()
        conn.close()
            
        return {"status": "success", "skills": new_skills}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating skills: {str(e)}")


# ──────────────────────────────────────────────────────────────────────────────
# Notifications Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/notifications")
async def get_notifications(username: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
            
        # Get incoming notifications
        cursor.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', 
            (user['id'],)
        )
        incoming_rows = cursor.fetchall()
        
        # Get outgoing requests (where I am the sender, type=match_request)
        cursor.execute(
            'SELECT notifications.*, users.username as target_username FROM notifications JOIN users ON notifications.user_id = users.id WHERE sender_username = ? AND type = "match_request" ORDER BY created_at DESC', 
            (username,)
        )
        outgoing_rows = cursor.fetchall()
        
        conn.close()
        
        incoming = [dict(r) for r in incoming_rows]
        outgoing = [dict(r) for r in outgoing_rows]
        
        return {"status": "success", "incoming": incoming, "outgoing": outgoing}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class MarkReadRequest(BaseModel):
    notification_id: int

@app.post("/api/notifications/read")
async def mark_notification_read(request: MarkReadRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            (request.notification_id,)
        )
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# Matchmaking Endpoints placeholder
# ──────────────────────────────────────────────────────────────────────────────
from matchmaker import router as matchmaker_router
app.include_router(matchmaker_router, prefix="/api/matchmaking")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
