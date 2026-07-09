"""
Knowledge Gap & Career Readiness Engine
========================================
Standalone service — no dependency on rag.py.
Imported by main.py for API exposure.

Pipeline:
  1. Match student skills against required skills for the target role.
  2. Compute weighted readiness score (0-100): core=70%, elective=30%.
  3. Identify strong skills and missing skills.
  4. Call Gemini for personalised course/cert/roadmap recommendations.
     Falls back to curated static lists if no API key.
"""

import json
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models  (API contract)
# ──────────────────────────────────────────────────────────────────────────────

class KnowledgeGapRequest(BaseModel):
    username: str = Field(..., description="Authenticated username")
    current_skills: List[str] = Field(..., description="Skills extracted from resume")
    career_goal: str = Field(..., description="e.g. ML Engineer, SDE, Data Scientist")
    target_company: Optional[str] = Field(None, description="e.g. Google, Microsoft")


class ResourceLink(BaseModel):
    name: str
    url: str


class KnowledgeGapResponse(BaseModel):
    career_goal: str
    target_company: Optional[str]
    readiness_score: int = Field(..., ge=0, le=100)
    score_explanation: str
    strong_skills: List[str]
    missing_skills: List[str]
    recommended_courses: List[ResourceLink]
    recommended_certifications: List[ResourceLink]
    learning_roadmap: List[str]


# ──────────────────────────────────────────────────────────────────────────────
# Readiness Score Engine
# ──────────────────────────────────────────────────────────────────────────────

class ReadinessScoreEngine:
    """
    Weighted readiness score:
      core_ratio     = matched_core / total_core
      elective_ratio = matched_elective / total_elective
      score          = (core_ratio × 0.70 + elective_ratio × 0.30) × 100
    """

    DOMAIN_SKILL_MAP: Dict[str, Dict[str, List[str]]] = {
        "ml engineer": {
            "core": [
                "python", "machine learning", "statistics",
                "linear algebra", "probability", "algorithms",
                "data structures", "mathematics", "calculus"
            ],
            "elective": [
                "tensorflow", "pytorch", "scikit-learn", "numpy",
                "pandas", "mlops", "docker", "kubernetes", "sql", "git"
            ]
        },
        "data engineer": {
            "core": [
                "sql", "python", "data modeling", "etl",
                "data warehousing", "distributed systems"
            ],
            "elective": [
                "spark", "hadoop", "airflow", "kafka", "aws",
                "gcp", "dbt", "docker", "scala", "kubernetes"
            ]
        },
        "ai engineer": {
            "core": [
                "python", "deep learning", "nlp", "neural networks",
                "large language models", "transformers", "computer vision"
            ],
            "elective": [
                "pytorch", "huggingface", "langchain", "vector databases",
                "openai api", "cloud computing", "git"
            ]
        },
        "sde": {
            "core": [
                "data structures", "algorithms",
                "object oriented programming",
                "system design", "software architecture"
            ],
            "elective": [
                "java", "c++", "javascript", "react", "node.js",
                "databases", "git", "docker", "ci/cd", "unit testing"
            ]
        },
        "software engineer": {
            "core": [
                "data structures", "algorithms",
                "object oriented programming",
                "system design", "software architecture"
            ],
            "elective": [
                "java", "c++", "javascript", "react", "node.js",
                "databases", "git", "docker", "ci/cd", "unit testing"
            ]
        },
        "devops engineer": {
            "core": [
                "linux", "shell scripting", "networking",
                "ci/cd", "infrastructure as code", "containerization"
            ],
            "elective": [
                "docker", "kubernetes", "terraform", "ansible",
                "aws", "gcp", "jenkins", "git", "prometheus", "grafana"
            ]
        },
        "data scientist": {
            "core": [
                "python", "statistics", "mathematics",
                "machine learning", "data analysis", "probability"
            ],
            "elective": [
                "pandas", "numpy", "matplotlib", "scikit-learn",
                "sql", "tableau", "spark", "r", "deep learning"
            ]
        }
    }

    SYNONYMS: Dict[str, str] = {
        "js": "javascript", "ts": "typescript",
        "ml": "machine learning", "dl": "deep learning",
        "ai": "artificial intelligence",
        "llms": "large language models", "llm": "large language models",
        "nn": "neural networks",
        "oop": "object oriented programming",
        "stats": "statistics", "tf": "tensorflow",
        "hf": "huggingface", "k8s": "kubernetes",
        "cv": "computer vision", "nlp": "natural language processing",
    }

    @classmethod
    def normalize(cls, skill: str) -> str:
        s = skill.strip().lower()
        return cls.SYNONYMS.get(s, s)

    def get_required_skills(self, career_goal: str) -> Tuple[List[str], List[str]]:
        goal_key = career_goal.strip().lower()
        for key in self.DOMAIN_SKILL_MAP:
            if key in goal_key or goal_key in key:
                cfg = self.DOMAIN_SKILL_MAP[key]
                return cfg["core"], cfg["elective"]
        # Generic fallback
        return (
            ["programming fundamentals", "data structures", "algorithms", "problem solving"],
            ["git", "sql", "cloud basics", "testing", "documentation"]
        )

    def calculate(
        self,
        current_skills: List[str],
        required_core: List[str],
        required_elective: List[str]
    ) -> Tuple[int, str]:
        norm_current   = {self.normalize(s) for s in current_skills}
        norm_core      = [self.normalize(s) for s in required_core]
        norm_elective  = [self.normalize(s) for s in required_elective]

        matched_core     = [s for s in norm_core if s in norm_current]
        matched_elective = [s for s in norm_elective if s in norm_current]

        core_ratio     = len(matched_core) / len(norm_core) if norm_core else 1.0
        elective_ratio = len(matched_elective) / len(norm_elective) if norm_elective else 1.0

        raw   = (core_ratio * 0.70) + (elective_ratio * 0.30)
        score = int(round(raw * 100))

        explanation = (
            f"Score: {score}/100. "
            f"Core Skills Matched: {len(matched_core)}/{len(norm_core)} (weight: 70%). "
            f"Elective/Tooling Matched: {len(matched_elective)}/{len(norm_elective)} (weight: 30%). "
            f"Core skills are foundational requirements; elective skills cover tools and ecosystem."
        )
        return score, explanation


# ──────────────────────────────────────────────────────────────────────────────
# Skill Matcher
# ──────────────────────────────────────────────────────────────────────────────

class SkillMatcher:
    def __init__(self, score_engine: ReadinessScoreEngine):
        self.score_engine = score_engine

    def match(
        self,
        current_skills: List[str],
        required_core: List[str],
        required_elective: List[str]
    ) -> Tuple[List[str], List[str]]:
        norm_current = {self.score_engine.normalize(s) for s in current_skills}
        all_required = required_core + required_elective

        strong, missing = [], []
        for skill in all_required:
            norm_req = self.score_engine.normalize(skill)
            if norm_req in norm_current:
                user_version = next(
                    (s for s in current_skills if self.score_engine.normalize(s) == norm_req),
                    skill
                )
                strong.append(user_version)
            else:
                missing.append(skill)
        return strong, missing


# ──────────────────────────────────────────────────────────────────────────────
# Recommendation Engine
# ──────────────────────────────────────────────────────────────────────────────

class RecommendationEngine:
    STATIC_FALLBACKS: Dict[str, Dict] = {
        "ml": {
            "courses": [
                {"name": "Machine Learning Specialization — Coursera (Stanford/DeepLearning.AI)", "url": "https://www.coursera.org/specializations/machine-learning-introduction"},
                {"name": "Deep Learning Specialization — Coursera (DeepLearning.AI)", "url": "https://www.coursera.org/specializations/deep-learning"},
                {"name": "Practical Deep Learning for Coders — fast.ai (Free)", "url": "https://course.fast.ai"},
            ],
            "certifications": [
                {"name": "Google Professional Machine Learning Engineer", "url": "https://cloud.google.com/certification/machine-learning-engineer"},
                {"name": "AWS Certified Machine Learning – Specialty", "url": "https://aws.amazon.com/certification/certified-machine-learning-specialty/"},
                {"name": "TensorFlow Developer Certificate", "url": "https://www.tensorflow.org/certificate"},
            ],
            "roadmap": [
                "1. Linear Algebra, Calculus & Probability fundamentals",
                "2. Supervised & Unsupervised Learning (Regression, Classification, Clustering)",
                "3. Neural Networks & Deep Learning (CNNs, RNNs, Transformers)",
                "4. ML Frameworks: TensorFlow / PyTorch in production",
                "5. MLOps: Model versioning, deployment pipelines, monitoring"
            ]
        },
        "data engineer": {
            "courses": [
                {"name": "Data Engineering Zoomcamp — DataTalks.Club (Free)", "url": "https://github.com/DataTalksClub/data-engineering-zoomcamp"},
                {"name": "The Complete Hands-on Introduction to Apache Airflow — Udemy", "url": "https://www.udemy.com/course/the-complete-hands-on-course-to-master-apache-airflow/"},
                {"name": "Fundamentals of Data Engineering — O'Reilly", "url": "https://www.oreilly.com/library/view/fundamentals-of-data/9781098108298/"},
            ],
            "certifications": [
                {"name": "Google Professional Data Engineer", "url": "https://cloud.google.com/certification/data-engineer"},
                {"name": "AWS Certified Data Engineer – Associate", "url": "https://aws.amazon.com/certification/certified-data-engineer-associate/"},
                {"name": "Databricks Certified Associate Developer for Apache Spark", "url": "https://www.databricks.com/learn/certification/apache-spark-developer-associate"},
            ],
            "roadmap": [
                "1. SQL mastery and relational database design",
                "2. Python for data pipelines (pandas, SQLAlchemy)",
                "3. ETL & orchestration tools: Apache Airflow / Prefect",
                "4. Big Data: Spark, Kafka, distributed processing",
                "5. Cloud Data Warehouses: BigQuery / Redshift / Snowflake"
            ]
        },
        "ai engineer": {
            "courses": [
                {"name": "LangChain for LLM Application Development — DeepLearning.AI (Free)", "url": "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/"},
                {"name": "Building Systems with the ChatGPT API — DeepLearning.AI (Free)", "url": "https://www.deeplearning.ai/short-courses/building-systems-with-chatgpt/"},
                {"name": "Hugging Face NLP Course — Hugging Face (Free)", "url": "https://huggingface.co/learn/nlp-course/chapter1/1"},
            ],
            "certifications": [
                {"name": "Google Professional Machine Learning Engineer", "url": "https://cloud.google.com/certification/machine-learning-engineer"},
                {"name": "AWS Certified Machine Learning – Specialty", "url": "https://aws.amazon.com/certification/certified-machine-learning-specialty/"},
            ],
            "roadmap": [
                "1. Deep Learning & Transformer architecture fundamentals",
                "2. NLP: Text embeddings, tokenization, attention mechanisms",
                "3. LLM APIs: OpenAI, Gemini, Claude integration",
                "4. RAG systems: Vector DBs (Pinecone, ChromaDB, FAISS)",
                "5. LLM app frameworks: LangChain / LlamaIndex production deployment"
            ]
        },
        "sde": {
            "courses": [
                {"name": "Algorithms Specialization — Coursera (Stanford)", "url": "https://www.coursera.org/specializations/algorithms"},
                {"name": "System Design Interview Course — Educative.io", "url": "https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers"},
                {"name": "The Last Algorithms Course You'll Need — Frontend Masters", "url": "https://frontendmasters.com/courses/algorithms/"},
            ],
            "certifications": [
                {"name": "Oracle Certified Professional: Java SE Developer", "url": "https://education.oracle.com/oracle-certified-professional-java-se-17-developer/trackp_OCPJSE17"},
                {"name": "AWS Certified Developer – Associate", "url": "https://aws.amazon.com/certification/certified-developer-associate/"},
                {"name": "Google Associate Cloud Engineer", "url": "https://cloud.google.com/certification/cloud-engineer"},
            ],
            "roadmap": [
                "1. Core DSA: Arrays, Trees, Graphs, DP — LeetCode 150",
                "2. OOP principles & SOLID design patterns",
                "3. System Design: scalability, load balancing, caching",
                "4. Databases: SQL normalization + NoSQL use cases",
                "5. CI/CD pipelines, containerization (Docker), cloud deployment"
            ]
        },
        "devops": {
            "courses": [
                {"name": "DevOps Bootcamp — Udemy (TechWorld with Nana)", "url": "https://www.udemy.com/course/techworld-with-nana-devops-bootcamp/"},
                {"name": "Kubernetes for the Absolute Beginner — KodeKloud", "url": "https://kodekloud.com/courses/kubernetes-for-the-absolute-beginners-hands-on/"},
                {"name": "HashiCorp Terraform Associate Prep — Udemy", "url": "https://www.udemy.com/course/terraform-beginner-to-advanced/"},
            ],
            "certifications": [
                {"name": "Certified Kubernetes Administrator (CKA)", "url": "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/"},
                {"name": "AWS Certified DevOps Engineer – Professional", "url": "https://aws.amazon.com/certification/certified-devops-engineer-professional/"},
                {"name": "HashiCorp Certified: Terraform Associate", "url": "https://www.hashicorp.com/certification/terraform-associate"},
            ],
            "roadmap": [
                "1. Linux fundamentals & shell scripting",
                "2. Docker: containers, images, Docker Compose",
                "3. Kubernetes: pods, deployments, services, Helm",
                "4. CI/CD: GitHub Actions / Jenkins pipelines",
                "5. Infrastructure as Code: Terraform + cloud provider (AWS/GCP)"
            ]
        },
        "data scientist": {
            "courses": [
                {"name": "IBM Data Science Professional Certificate — Coursera", "url": "https://www.coursera.org/professional-certificates/ibm-data-science"},
                {"name": "Applied Data Science with Python — Coursera (University of Michigan)", "url": "https://www.coursera.org/specializations/data-science-python"},
                {"name": "Kaggle Learn — Free Python, ML, and SQL courses", "url": "https://www.kaggle.com/learn"},
            ],
            "certifications": [
                {"name": "IBM Data Science Professional Certificate", "url": "https://www.coursera.org/professional-certificates/ibm-data-science"},
                {"name": "Google Professional Data Engineer", "url": "https://cloud.google.com/certification/data-engineer"},
                {"name": "Databricks Certified Associate Developer", "url": "https://www.databricks.com/learn/certification/apache-spark-developer-associate"},
            ],
            "roadmap": [
                "1. Python for data analysis: NumPy, Pandas, Matplotlib",
                "2. Statistics & Probability for data science",
                "3. Machine Learning: Scikit-learn, feature engineering, model evaluation",
                "4. Data visualisation: Seaborn, Plotly, Tableau",
                "5. Advanced ML: Ensemble methods, XGBoost, Neural Networks"
            ]
        }
    }

    def __init__(self, gemini_client=None):
        self.client = gemini_client

    def get_recommendations(
        self,
        career_goal: str,
        target_company: Optional[str],
        missing_skills: List[str]
    ) -> Dict:
        if self.client and missing_skills:
            try:
                return self._query_gemini(career_goal, target_company, missing_skills)
            except Exception as e:
                print(f"[RecommendationEngine] Gemini call failed: {e}. Using static fallback.")
        return self._get_static(career_goal)

    def _query_gemini(
        self,
        career_goal: str,
        target_company: Optional[str],
        missing_skills: List[str]
    ) -> Dict:
        company_ctx = f" targeting {target_company}" if target_company else ""
        skills_ctx  = ", ".join(missing_skills[:10])

        prompt = f"""You are an expert technical career coach.
A student wants to become a "{career_goal}"{company_ctx}.
They are currently missing these skills: {skills_ctx}.

Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{{
  "courses": [
    {{"name": "Course Name — Platform (Provider)", "url": "https://real-course-url.com"}}
  ],
  "certifications": [
    {{"name": "Certification Name", "url": "https://real-certification-url.com"}}
  ],
  "roadmap": ["1. Step description", "2. Step description"]
}}

Rules:
- courses: exactly 3, real and widely recognised. Include platform name in the name. URL must be the real, direct course page URL.
- certifications: exactly 2-3, industry-recognised for this specific role. URL must be the real official certification page.
- roadmap: exactly 5 steps in logical learning sequence
- All URLs must be real, publicly accessible, and directly relevant — no placeholder URLs.
"""
        response = self.client.models.generate_content(
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
        return json.loads(text.strip())

    def _get_static(self, career_goal: str) -> Dict:
        goal_lower = career_goal.strip().lower()
        for key, recs in self.STATIC_FALLBACKS.items():
            if key in goal_lower:
                return recs
        return {
            "courses": [
                {"name": "CS50: Introduction to Computer Science — edX (Harvard, Free)", "url": "https://cs50.harvard.edu/x/"},
                {"name": "The Missing Semester of Your CS Education — MIT (Free)", "url": "https://missing.csail.mit.edu/"},
                {"name": "System Design Primer — GitHub (Free)", "url": "https://github.com/donnemartin/system-design-primer"},
            ],
            "certifications": [
                {"name": "AWS Certified Cloud Practitioner", "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/"},
                {"name": "Google Associate Cloud Engineer", "url": "https://cloud.google.com/certification/cloud-engineer"},
            ],
            "roadmap": [
                "1. Strengthen programming fundamentals in Python or Java",
                "2. Master data structures and algorithm problem-solving",
                "3. Learn database design: SQL + NoSQL",
                "4. Study system design and cloud architecture patterns",
                "5. Build 2-3 end-to-end portfolio projects and contribute to open source"
            ]
        }


# ──────────────────────────────────────────────────────────────────────────────
# Main Orchestrator
# ──────────────────────────────────────────────────────────────────────────────

class KnowledgeGapService:
    def __init__(self, gemini_client=None):
        self.score_engine          = ReadinessScoreEngine()
        self.skill_matcher         = SkillMatcher(self.score_engine)
        self.recommendation_engine = RecommendationEngine(gemini_client)

    def analyze(self, request: KnowledgeGapRequest) -> KnowledgeGapResponse:
        # 1. Required skills for this career goal
        required_core, required_elective = self.score_engine.get_required_skills(request.career_goal)

        # 2. Separate into strong vs missing
        strong_skills, missing_skills = self.skill_matcher.match(
            request.current_skills, required_core, required_elective
        )

        # 3. Readiness score
        readiness_score, score_explanation = self.score_engine.calculate(
            request.current_skills, required_core, required_elective
        )

        # 4. Personalised recommendations
        recommendations = self.recommendation_engine.get_recommendations(
            career_goal=request.career_goal,
            target_company=request.target_company,
            missing_skills=missing_skills
        )

        # 5. Normalise courses/certs — accept both {name,url} dicts and plain strings
        def to_resource_link(item) -> ResourceLink:
            if isinstance(item, dict):
                return ResourceLink(name=item.get("name", ""), url=item.get("url", "#"))
            return ResourceLink(name=str(item), url="#")

        courses = [to_resource_link(c) for c in recommendations.get("courses", [])]
        certs   = [to_resource_link(c) for c in recommendations.get("certifications", [])]

        return KnowledgeGapResponse(
            career_goal=request.career_goal,
            target_company=request.target_company,
            readiness_score=readiness_score,
            score_explanation=score_explanation,
            strong_skills=strong_skills,
            missing_skills=missing_skills,
            recommended_courses=courses,
            recommended_certifications=certs,
            learning_roadmap=recommendations.get("roadmap", []),
        )
