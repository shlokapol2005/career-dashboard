from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
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

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

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
            return json.loads(json_string)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
