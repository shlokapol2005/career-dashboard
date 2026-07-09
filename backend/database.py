import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "database_v2.db")
LEGACY_USERS_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "users.json")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            career_goal TEXT,
            skills TEXT, -- Stored as JSON string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create Notifications table (UPDATED WITH type and status)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sender_username TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'match_request', -- 'match_request' or 'match_accept'
            status TEXT DEFAULT 'pending',     -- 'pending', 'accepted', 'rejected'
            is_read BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    
    # Auto-seed if database is completely empty
    cursor.execute('SELECT COUNT(*) FROM users')
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("[DB] Database is empty. Seeding dummy users...")
        dummy_users = [
            {"username": "alice_frontend", "password": "password", "career_goal": "Frontend Developer", "skills": ["react", "javascript", "css", "html", "ui/ux design", "tailwind"]},
            {"username": "bob_backend", "password": "password", "career_goal": "Backend Developer", "skills": ["python", "node.js", "sql", "mongodb", "docker", "express", "fastapi"]},
            {"username": "charlie_data", "password": "password", "career_goal": "Data Scientist", "skills": ["python", "machine learning", "pandas", "numpy", "statistics", "sql"]},
            {"username": "diana_cyber", "password": "password", "career_goal": "Cybersecurity Specialist", "skills": ["network security", "penetration testing", "linux", "cryptography", "wireshark", "ethical hacking"]},
            {"username": "eve_mobile", "password": "password", "career_goal": "Mobile Developer", "skills": ["swift", "kotlin", "react native", "flutter", "ios", "android"]},
            {"username": "frank_devops", "password": "password", "career_goal": "DevOps Engineer", "skills": ["kubernetes", "docker", "aws", "terraform", "ci/cd", "linux"]},
            {"username": "grace_ai", "password": "password", "career_goal": "AI Engineer", "skills": ["python", "deep learning", "pytorch", "transformers", "nlp", "large language models"]},
            {"username": "harry_fullstack", "password": "password", "career_goal": "Full Stack Engineer", "skills": ["javascript", "react", "node.js", "postgresql", "aws", "typescript"]},
            {"username": "isabella_cloud", "password": "password", "career_goal": "Cloud Architect", "skills": ["aws", "azure", "gcp", "system design", "networking", "serverless"]},
            {"username": "jack_blockchain", "password": "password", "career_goal": "Blockchain Developer", "skills": ["solidity", "smart contracts", "ethereum", "web3.js", "cryptography"]}
        ]
        
        for u in dummy_users:
            cursor.execute(
                'INSERT INTO users (username, password, career_goal, skills) VALUES (?, ?, ?, ?)',
                (u['username'], u['password'], u['career_goal'], json.dumps(u['skills']))
            )
        conn.commit()
        print("[DB] 10 dummy users seeded successfully.")
            
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized.")
