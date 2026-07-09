import os
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from database import get_db_connection

router = APIRouter()

class FindTeamRequest(BaseModel):
    username: str
    hackathon_name: str
    domain: str
    team_size: int

class ConnectRequest(BaseModel):
    sender_username: str
    target_username: str
    message: str

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")
    from google import genai
    return genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})

@router.post("/find-team")
async def find_team(request: FindTeamRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Get current user's skills
    cursor.execute('SELECT * FROM users WHERE username = ?', (request.username,))
    current_user = cursor.fetchone()
    
    if not current_user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        current_skills = json.loads(current_user['skills'] or "[]")
    except:
        current_skills = []
        
    if not current_skills:
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail="You must complete a Career Intelligence analysis first to extract your skills before matchmaking."
        )

    # 2. Get all OTHER users who have skills
    cursor.execute('SELECT username, career_goal, skills FROM users WHERE username != ?', (request.username,))
    all_other_users = cursor.fetchall()
    conn.close()
    
    available_users = []
    for u in all_other_users:
        try:
            skills = json.loads(u['skills'] or "[]")
            if skills:
                available_users.append({
                    "username": u['username'],
                    "career_goal": u['career_goal'],
                    "skills": skills
                })
        except:
            pass

    if not available_users:
        raise HTTPException(status_code=404, detail="No other users found with extracted skills in the database.")

    # 3. Ask Gemini to matchmake
    num_to_find = request.team_size - 1
    if num_to_find < 1:
        raise HTTPException(status_code=400, detail="Team size must be at least 2.")
        
    if num_to_find > len(available_users):
        num_to_find = len(available_users) # Pick as many as possible

    client = get_gemini_client()
    
    prompt = f"""You are an expert technical recruiter and hackathon matchmaker.
A student wants to build a team for a hackathon called "{request.hackathon_name}" in the domain: "{request.domain}".
The student's current skills are: {', '.join(current_skills)}.

Here is a list of available candidates and their skills (formatted as JSON):
{json.dumps(available_users, indent=2)}

Your task: Select exactly {num_to_find} teammates from the available candidates to form the ultimate complementary stack for this hackathon domain. You want a well-rounded team (e.g., if the user is frontend, pick backend/data people).

Return ONLY a valid JSON array of objects with this exact structure (no markdown, no code fences):
[
  {{
    "username": "chosen_username",
    "role": "Suggested role for them on this team (e.g., Backend Lead, ML Specialist)",
    "reason": "1-2 short sentences explaining why they complement the current user's skills for this specific hackathon domain."
  }}
]
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        team = json.loads(text.strip())
        
        # Enrich the response with the full skill list of chosen users so frontend can display tags
        team_enriched = []
        for member in team:
            full_user = next((u for u in available_users if u['username'] == member['username']), None)
            if full_user:
                member['skills'] = full_user['skills']
                member['career_goal'] = full_user['career_goal']
                team_enriched.append(member)
                
        return {"status": "success", "team": team_enriched}
    except Exception as e:
        import traceback
        error_msg = f"Matchmaking AI Error: {e}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=f"Failed to generate AI matches. {str(e)}")


@router.post("/connect")
async def connect_peer(request: ConnectRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify target user exists
    cursor.execute('SELECT id FROM users WHERE username = ?', (request.target_username,))
    target = cursor.fetchone()
    
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="Target user not found.")
        
    try:
        cursor.execute(
            'INSERT INTO notifications (user_id, sender_username, message, type, status) VALUES (?, ?, ?, ?, ?)',
            (target['id'], request.sender_username, request.message, 'match_request', 'pending')
        )
        conn.commit()
        conn.close()
        return {"status": "success", "detail": "Connection request sent successfully."}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

class RespondRequest(BaseModel):
    notification_id: int
    responder_username: str

@router.post("/accept")
async def accept_peer(request: RespondRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get original notification
        cursor.execute('SELECT * FROM notifications WHERE id = ?', (request.notification_id,))
        notif = cursor.fetchone()
        
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found.")
            
        # Update original notification to accepted
        cursor.execute('UPDATE notifications SET status = ? WHERE id = ?', ('accepted', request.notification_id))
        
        # Get sender's user_id so we can notify them back
        cursor.execute('SELECT id FROM users WHERE username = ?', (notif['sender_username'],))
        original_sender = cursor.fetchone()
        
        if original_sender:
            msg = f"{request.responder_username} has accepted your hackathon team request! You are now connected."
            cursor.execute(
                'INSERT INTO notifications (user_id, sender_username, message, type, status) VALUES (?, ?, ?, ?, ?)',
                (original_sender['id'], request.responder_username, msg, 'match_accept', 'accepted')
            )
            
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/decline")
async def decline_peer(request: RespondRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Update original notification to rejected
        cursor.execute('UPDATE notifications SET status = ? WHERE id = ?', ('rejected', request.notification_id))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
