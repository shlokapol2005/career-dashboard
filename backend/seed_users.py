import sqlite3
import json
import os
from database import get_db_connection, init_db

def seed_users():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    dummy_users = [
        {
            "username": "alice_frontend",
            "password": "password",
            "career_goal": "Frontend Developer",
            "skills": ["react", "javascript", "css", "html", "ui/ux design", "tailwind"]
        },
        {
            "username": "bob_backend",
            "password": "password",
            "career_goal": "Backend Developer",
            "skills": ["python", "node.js", "sql", "mongodb", "docker", "express", "fastapi"]
        },
        {
            "username": "charlie_data",
            "password": "password",
            "career_goal": "Data Scientist",
            "skills": ["python", "machine learning", "pandas", "numpy", "statistics", "sql"]
        },
        {
            "username": "diana_cyber",
            "password": "password",
            "career_goal": "Cybersecurity Specialist",
            "skills": ["network security", "penetration testing", "linux", "cryptography", "wireshark", "ethical hacking"]
        },
        {
            "username": "eve_mobile",
            "password": "password",
            "career_goal": "Mobile Developer",
            "skills": ["swift", "kotlin", "react native", "flutter", "ios", "android"]
        },
        {
            "username": "frank_devops",
            "password": "password",
            "career_goal": "DevOps Engineer",
            "skills": ["kubernetes", "docker", "aws", "terraform", "ci/cd", "linux"]
        },
        {
            "username": "grace_ai",
            "password": "password",
            "career_goal": "AI Engineer",
            "skills": ["python", "deep learning", "pytorch", "transformers", "nlp", "large language models"]
        },
        {
            "username": "harry_fullstack",
            "password": "password",
            "career_goal": "Full Stack Engineer",
            "skills": ["javascript", "react", "node.js", "postgresql", "aws", "typescript"]
        },
        {
            "username": "isabella_cloud",
            "password": "password",
            "career_goal": "Cloud Architect",
            "skills": ["aws", "azure", "gcp", "system design", "networking", "serverless"]
        },
        {
            "username": "jack_blockchain",
            "password": "password",
            "career_goal": "Blockchain Developer",
            "skills": ["solidity", "smart contracts", "ethereum", "web3.js", "cryptography"]
        }
    ]

    count_added = 0
    for u in dummy_users:
        try:
            cursor.execute(
                'INSERT INTO users (username, password, career_goal, skills) VALUES (?, ?, ?, ?)',
                (u['username'], u['password'], u['career_goal'], json.dumps(u['skills']))
            )
            count_added += 1
        except sqlite3.IntegrityError:
            # User already exists
            pass
            
    conn.commit()
    conn.close()
    
    print(f"Seeded {count_added} dummy users to the database.")

if __name__ == "__main__":
    seed_users()
