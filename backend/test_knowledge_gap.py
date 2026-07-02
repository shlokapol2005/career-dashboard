import sys
import os
sys.path.append(os.path.dirname(__file__))

from knowledge_gap_service import KnowledgeGapService, KnowledgeGapRequest

def run_tests():
    print("=== Testing Knowledge Gap Engine (Offline / Static Fallbacks) ===")
    
    # 1. Initialize service without Gemini client (will trigger static fallbacks)
    service = KnowledgeGapService(gemini_client=None)
    
    # Test cases
    test_cases = [
        {
            "username": "test_user",
            "current_skills": ["python", "numpy", "pandas", "sql", "git"],
            "career_goal": "ML Engineer",
            "target_company": "Google"
        },
        {
            "username": "test_user",
            "current_skills": ["javascript", "react", "node.js", "databases", "git"],
            "career_goal": "SDE",
            "target_company": "Microsoft"
        },
        {
            "username": "test_user",
            "current_skills": ["linux", "docker", "aws"],
            "career_goal": "DevOps Engineer",
            "target_company": "Amazon"
        }
    ]
    
    for idx, tc in enumerate(test_cases):
        req = KnowledgeGapRequest(**tc)
        res = service.analyze(req)
        
        print(f"\nTest Case {idx + 1}: {req.career_goal} at {req.target_company or 'Any'}")
        print(f"Current Skills: {req.current_skills}")
        print(f"Readiness Score: {res.readiness_score}/100")
        print(f"Explanation: {res.score_explanation}")
        print(f"Matched/Strong Skills: {res.strong_skills}")
        print(f"Missing Skills: {res.missing_skills}")
        print(f"Recommended Courses (First 2): {res.recommended_courses[:2]}")
        print(f"Recommended Certifications: {res.recommended_certifications}")
        print(f"Roadmap Steps (First 2): {res.learning_roadmap[:2]}")
        
        # Simple assertions
        assert res.readiness_score >= 0 and res.readiness_score <= 100
        assert len(res.strong_skills) + len(res.missing_skills) >= len(res.strong_skills)
        assert len(res.recommended_courses) > 0
        assert len(res.recommended_certifications) > 0
        assert len(res.learning_roadmap) > 0
        
    print("\nAll unit tests passed successfully!")

if __name__ == "__main__":
    run_tests()
