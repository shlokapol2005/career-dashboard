import os
import faiss
import numpy as np
import PyPDF2
from pptx import Presentation
from io import BytesIO
from google import genai
from google.genai import types

# AQ.* API keys require v1beta endpoint for gemini-2.5-flash
GENAI_HTTP_OPTIONS = {"api_version": "v1beta"}


# ──────────────────────────────────────────────
# Text chunker with overlap (used for chatbot RAG)
# ──────────────────────────────────────────────
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return [c.strip() for c in chunks if c.strip()]


# ──────────────────────────────────────────────
# RAG Engine
# ──────────────────────────────────────────────
class RAGEngine:
    EMBEDDING_MODEL = "gemini-embedding-001"
    GENERATION_MODEL = "gemini-2.5-flash"

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key, http_options=GENAI_HTTP_OPTIONS)
        self.index = None
        self.chunks: list[str] = []
        self.raw_text = ""

    # ── Step 1: Extract raw text ──────────────
    def extract_text(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        text = ""
        filename_lower = filename.lower()
        try:
            if "pdf" in content_type or filename_lower.endswith(".pdf"):
                reader = PyPDF2.PdfReader(BytesIO(file_bytes))
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

            elif "presentation" in content_type or filename_lower.endswith(".pptx"):
                prs = Presentation(BytesIO(file_bytes))
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text") and shape.text.strip():
                            text += shape.text.strip() + "\n"
            else:
                text = file_bytes.decode("utf-8", errors="ignore")

        except Exception as e:
            print(f"[RAG] Text extraction error for '{filename}': {e}")
            raise ValueError(f"Could not parse '{filename}'. File may be corrupted or unsupported.")

        return text.strip()

    # ── Step 2: Direct Summarization (NO RAG) ─
    def generate_summary(self, text: str) -> str:
        """Summarize the entire extracted text directly using Gemini."""
        self.raw_text = text
        
        # Trim if it exceeds Gemini's context window (highly unlikely for student notes)
        context = text[:600000]

        print(f"[RAG] Generating summary directly from entire text ({len(context)} chars). No RAG used.")

        prompt = f"""
You are an expert AI learning assistant. A student has uploaded their study notes.
Carefully read the entire text below and produce a structured study guide.

Notes:
---
{context}
---

Respond ONLY with a valid JSON object in exactly this format (no markdown, no extra text):
{{
  "summary": "A cohesive executive summary combining all the key ideas from the notes (150-250 words).",
  "concepts": [
    {{
      "title": "Concept name",
      "description": "Clear, concise explanation of the concept."
    }}
  ],
  "revisionNotes": [
    "Short, actionable bullet point for rapid revision.",
    "Another bullet point."
  ]
}}
"""
        try:
            result = self.client.models.generate_content(
                model=self.GENERATION_MODEL,
                contents=prompt,
            )
            text_out = result.text.strip()
        except Exception as e:
            raise ValueError(f"Gemini generation failed: {e}")

        # Strip markdown fences if present
        if text_out.startswith("```json"):
            text_out = text_out[7:]
        elif text_out.startswith("```"):
            text_out = text_out[3:]
        if text_out.endswith("```"):
            text_out = text_out[:-3]

        return text_out.strip()

    # ── Step 3: Setup Vector Index for Chatbot ──
    def setup_chat_index(self, text: str):
        """Chunk and embed the full text to prepare the FAISS index for chatbot Q&A."""
        self.chunks = chunk_text(text)
        if not self.chunks:
            print("[Chat RAG] No text chunks produced. Chatbot index setup skipped.")
            return

        print(f"[Chat RAG] Preparing vector index: embedding {len(self.chunks)} chunks...")
        embeddings = []

        for i, chunk in enumerate(self.chunks):
            try:
                response = self.client.models.embed_content(
                    model=self.EMBEDDING_MODEL,
                    contents=chunk,
                    config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
                )
                embeddings.append(response.embeddings[0].values)
            except Exception as e:
                print(f"[Chat RAG] Failed to embed chunk {i}: {e}")

        if not embeddings:
            print("[Chat RAG] Warning: Chatbot embedding failed for all chunks.")
            return

        embeddings_np = np.array(embeddings, dtype="float32")
        dimension = embeddings_np.shape[1]

        # Build FAISS flat L2 index
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings_np)
        print(f"[Chat RAG] FAISS index built with {self.index.ntotal} vectors (dim={dimension})")

    # ── Step 4: Chatbot Q&A (RAG-based) ────────
    def answer_chat_question(self, query: str, history: list = None) -> str:
        """Answer user questions about their notes by retrieving relevant chunks first, keeping track of history."""
        if not self.chunks:
            return "No document has been uploaded yet. Please upload a document first."

        # If we have a vector index, retrieve relevant chunks
        if self.index is not None:
            try:
                q_response = self.client.models.embed_content(
                    model=self.EMBEDDING_MODEL,
                    contents=query,
                    config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
                )
                query_embedding = np.array([q_response.embeddings[0].values], dtype="float32")
                
                # Retrieve top 5 most relevant chunks
                k = min(5, len(self.chunks))
                distances, indices = self.index.search(query_embedding, k)
                
                retrieved_chunks = [self.chunks[int(idx)] for idx in indices[0] if int(idx) < len(self.chunks)]
                context = "\n\n---\n\n".join(retrieved_chunks)
                print(f"[Chat RAG] Retrieved {len(retrieved_chunks)} relevant chunks for query: '{query}'")
            except Exception as e:
                print(f"[Chat RAG] Retrieval failed: {e}. Falling back to full text context.")
                context = self.raw_text[:100000]
        else:
            context = self.raw_text[:100000]

        # Format conversation history
        history_str = ""
        if history:
            for msg in history:
                role = "Student" if msg.get("role") == "user" else "Tutor"
                history_str += f"{role}: {msg.get('text')}\n"

        # Build the chat prompt
        prompt = f"""
You are an expert AI tutor. A student is asking questions about their uploaded study notes.
Answer their question accurately, clearly, and concisely, using ONLY the context provided below.
Maintain a helpful and educational tone.

If the answer cannot be found in the context, politely let the student know you don't have that information.

Context from student's notes:
---
{context}
---

Conversation History:
{history_str}
Student: {query}
Tutor:
"""
        try:
            result = self.client.models.generate_content(
                model=self.GENERATION_MODEL,
                contents=prompt,
            )
            return result.text.strip()
        except Exception as e:
            return f"Error generating answer: {str(e)}"
