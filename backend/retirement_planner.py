import uuid
from datetime import datetime
import os
import json
import hashlib
import faiss
import numpy as np
import ollama
import time
from sentence_transformers import SentenceTransformer, CrossEncoder
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from jinja2 import Template
from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from modules.utils import clean_rag_facts
import random
import logging
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/retirement")

# ────────────────────────────────────────────────────────────────────────────────
# Enhanced Pydantic Models
# ────────────────────────────────────────────────────────────────────────────────

class RetirementInput(BaseModel):
    age: int = Field(..., ge=18, le=100, description="User's current age")
    currentSavings: float = Field(..., ge=0, description="Current retirement savings")
    income: float = Field(..., ge=0, description="Annual income")
    retirementAge: int = Field(..., ge=40, le=100, description="Target retirement age")
    retirementSavingsGoal: float = Field(..., ge=0, description="Retirement savings goal")
    gender: str = Field(None, description="User's gender")
    currentJob: str = Field(None, description="User's current job")
    spending: float = Field(None, ge=0, description="Annual spending")
    hasMortgage: str = Field("no", description="Has mortgage (yes/no)")
    mortgageAmount: float = Field(None, ge=0, description="Mortgage amount")
    mortgageTerm: int = Field(None, ge=0, le=50, description="Mortgage term in years")
    downPayment: float = Field(None, ge=0, description="Down payment amount")
    downPaymentPercent: Optional[float] = Field(None, ge=0, le=100, description="Down payment percentage")
    assets: float = Field(None, ge=0, description="Value of other assets")
    hasInsurance: str = Field("no", description="Has insurance (yes/no)")
    insurancePayment: float = Field(None, ge=0, description="Insurance payment")
    hasInvestment: str = Field("no", description="Has investments (yes/no)")
    investmentAmount: float = Field(None, ge=0, description="Investment amount")

class FeedbackInput(BaseModel):
    plan_id: str = Field(..., description="ID of the retirement plan")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    comments: Optional[str] = Field(None, description="Feedback comments")

class QueryInput(BaseModel):
    query: str = Field(..., min_length=5, description="Retirement related query")
    user_data: Optional[Dict[str, Any]] = Field(None, description="User data for context")

# ────────────────────────────────────────────────────────────────────────────────
# Models and Index Setup (Lazy Loading)
# ────────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_embedding_model():
    logger.info("Initializing embedding model")
    return SentenceTransformer("all-MiniLM-L6-v2")

@lru_cache(maxsize=1)
def get_cross_encoder():
    logger.info("Initializing cross encoder model")
    return CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

class IndexManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            logger.info("Creating new IndexManager instance")
            cls._instance = super(IndexManager, cls).__new__(cls)
            cls._instance.index = faiss.IndexFlatL2(384)
            cls._instance.document_store = []
            cls._instance.initialized = False
        return cls._instance

    def initialize(self, force=False):
        if self.initialized and not force:
            return
        logger.info("Initializing index")
        self.index = faiss.IndexFlatL2(384)
        self.document_store = []
        self.process_retirement_text()
        self.initialized = True
    
    def process_retirement_text(self, file_path="data/retirement_facts.txt"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,
                chunk_overlap=200,
                separators=["\n\n", "\n", ".", "!", "?"],
                length_function=len
            )
            doc = Document(page_content=text)
            splits = text_splitter.split_documents([doc])

            # Add metadata to chunks
            for i, split in enumerate(splits):
                split.metadata = {
                    "source": "retirement_facts.txt",
                    "chunk_id": i,
                    "char_count": len(split.page_content),
                    "chunk_type": "contextual"
                }

            embeddings = [get_embedding_model().encode(split.page_content) for split in splits]
            self.index.add(np.array(embeddings, dtype=np.float32))
            self.document_store = splits
            logger.info(f"Indexed {len(splits)} chunks from retirement_fact.txt")
            return True
        except Exception as e:
            logger.error(f"Error processing retirement text: {e}")
            return False

# Initialize index manager as a dependency
def get_index_manager():
    manager = IndexManager()
    if not manager.initialized:
        manager.initialize()
    return manager

# ────────────────────────────────────────────────────────────────────────────────
# Enhanced Query Refinement and Hybrid Retrieval
# ────────────────────────────────────────────────────────────────────────────────

def refine_query(query: str, user_data: Optional[Dict[str, Any]] = None) -> str:
    """Refine user query to improve retrieval results"""
    
    # Add age context if available
    if user_data and "age" in user_data:
        age = user_data["age"]
        if "age" not in query.lower():
            query = f"for a {age} year old: {query}"
    
    # Add income context if available
    if user_data and "income" in user_data:
        income = user_data["income"]
        if "income" not in query.lower() and "salary" not in query.lower():
            query = f"{query} with ${income:,.0f} income"
    
    # Expand common abbreviations
    query = query.replace("401k", "401(k) retirement account")
    query = query.replace("ira", "individual retirement account")
    
    logger.info(f"Refined query: {query}")
    return query

def is_rule_based_query(query: str) -> bool:
    """Determine if query is about hard rules or factual information"""
    rule_keywords = [
        "limit", "maximum", "minimum", "tax", "rule", "requirement", 
        "penalty", "withdrawal", "contribution", "rmd", "required minimum", 
        "social security", "medicare", "regulation", "legal"
    ]
    return any(keyword in query.lower() for keyword in rule_keywords)

def retrieve_from_json(query: str, json_facts: dict) -> str:
    """Query structured JSON facts for rule-based information"""
    
    # Simple keyword matching for now, but could be enhanced with more
    # sophisticated techniques like a small LLM for structured data extraction
    query_terms = query.lower().split()
    matching_facts = []
    
    def search_dict(d, path=""):
        results = []
        for k, v in d.items():
            key = k.replace("_", " ").lower()
            current_path = f"{path}.{key}" if path else key
            
            # Check if any query term is in the key
            if any(term in key for term in query_terms):
                if isinstance(v, dict):
                    results.append((current_path, flatten_dict(v)))
                else:
                    results.append((current_path, str(v)))
            
            # Recursively search nested dictionaries
            if isinstance(v, dict):
                results.extend(search_dict(v, current_path))
        
        return results
    
    # Flatten nested dict for display
    def flatten_dict(d, prefix=''):
        result = []
        for k, v in d.items():
            key = k.replace("_", " ")
            if isinstance(v, dict):
                result.append(f"{key}:")
                result.extend([f"  {x}" for x in flatten_dict(v)])
            else:
                result.append(f"{key}: {v}")
        return result
    
    matching_facts = search_dict(json_facts)
    
    # Format the results
    if matching_facts:
        result = "Relevant retirement rules and facts:\n\n"
        for path, value in matching_facts:
            if isinstance(value, list):
                result += f"• {path}:\n"
                for item in value:
                    result += f"  - {item}\n"
            else:
                result += f"• {path}: {value}\n"
        return result
    else:
        return "No specific rules found in structured data. Please check the contextual information."

def hybrid_retrieve(query: str, user_data: Optional[Dict[str, Any]] = None, index_manager=None, k=8, top_n=3) -> str:
    """Use both structured and unstructured data sources based on query type"""
    
    # Refine the query first
    refined_query = refine_query(query, user_data)
    
    # Load retirement facts
    json_facts = load_retirement_facts()
    
    # Route to appropriate retrieval method
    if is_rule_based_query(refined_query):
        logger.info("Using structured retrieval for rule-based query")
        structured_results = retrieve_from_json(refined_query, json_facts)
        
        # If structured retrieval found little, supplement with semantic search
        if len(structured_results.split('\n')) < 5:
            logger.info("Supplementing with semantic search")
            semantic_results = retrieve_with_rerank(refined_query, index_manager, k, top_n)
            return f"{structured_results}\n\nAdditional context:\n\n{semantic_results}"
        return structured_results
    else:
        logger.info("Using semantic search for contextual query")
        return retrieve_with_rerank(refined_query, index_manager, k, top_n)

def retrieve_with_rerank(prompt: str, index_manager=None, k=8, top_n=3) -> str:
    """Retrieve context using semantic search with reranking"""
    if index_manager is None:
        index_manager = get_index_manager()
    
    if not index_manager.document_store:
        logger.warning("No documents indexed")
        return "No documents indexed."

    try:
        query_embedding = get_embedding_model().encode([prompt])[0]
        D, I = index_manager.index.search(np.array([query_embedding], dtype=np.float32), k)
        candidates = [index_manager.document_store[i] for i in I[0] if i < len(index_manager.document_store)]

        pairs = [(prompt, doc.page_content) for doc in candidates]
        scores = get_cross_encoder().predict(pairs)

        # Include metadata in results
        results = []
        for doc, score in zip(candidates, scores):
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            })
        
        sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)[:top_n]
        
        # Format results with metadata for debugging/transparency
        return "\n\n".join([
            f"{r['content']}" 
            for r in sorted_results
        ])
    except Exception as e:
        logger.error(f"Error in retrieve_with_rerank: {e}")
        return "Error retrieving relevant information."

# ────────────────────────────────────────────────────────────────────────────────
# Load and Flatten Structured JSON Facts with Caching
# ────────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def load_retirement_facts():
    """Load retirement facts from JSON with caching"""
    try:
        with open("data/retirement_data.json") as f:
            data = json.load(f)
        return data.get("retirement_facts", {})
    except Exception as e:
        logger.error(f"Error loading retirement facts: {e}")
        return {}

def flatten_facts(facts: dict) -> str:
    """Flatten nested dictionary of facts into string format"""
    def flatten(d, prefix=''):
        lines = []
        for k, v in d.items():
            if isinstance(v, dict):
                lines.extend(flatten(v, prefix + k.replace("_", " ") + ": "))
            else:
                lines.append(f"{prefix}{k.replace('_', ' ')}: {v}")
        return lines
    return "\n".join(flatten(facts))

# ─────────────────────────────────────────────────────────────────────────────
# Caching Helpers
# ─────────────────────────────────────────────────────────────────────────────

def compute_user_key(user_input: dict) -> str:
    """Compute a consistent hash key from user input."""
    serialized = json.dumps(user_input, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def load_plan_cache(path="data/retirement_plan_cache.json") -> dict:
    """Load cached plans keyed by user input hash."""
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading plan cache: {e}")
        return {}

def save_plan_cache(key: str, plan_data: dict, path="data/retirement_plan_cache.json"):
    """Save plan data in cache by key."""
    cache = load_plan_cache(path)
    cache[key] = plan_data
    try:
        with open(path, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving plan cache: {e}")

# ────────────────────────────────────────────────────────────────────────────────
# Format User Input with Enhanced Validation
# ────────────────────────────────────────────────────────────────────────────────

def format_user_data(user_input):
    """Format user data with validation"""
    # Basic validation
    age = user_input.get('age', 0)
    if not (18 <= age <= 100):
        logger.warning(f"Invalid age: {age}")
        age = max(18, min(age, 100))
    
    retirement_age = user_input.get('retirementAge', 0)
    if retirement_age <= age:
        logger.warning(f"Retirement age ({retirement_age}) not greater than current age ({age})")
        retirement_age = age + 5
    
    return {
        'age': age,
        'savings': user_input.get('currentSavings', 0),
        'gender': user_input.get('gender', ''),
        'job': user_input.get('currentJob', ''),
        'income': user_input.get('income', 0),
        'spending': user_input.get('spending', 0),
        'has_mortgage': user_input.get('hasMortgage', '') == 'yes',
        'mortgage_balance': user_input.get('mortgageAmount', 0),
        'mortgage_term': user_input.get('mortgageTerm', 0),
        'down_payment': user_input.get('downPayment', 0),
        'down_payment_percent': user_input.get('downPaymentPercent', 0),
        'assets': user_input.get('assets', 0),
        'has_insurance': user_input.get('hasInsurance', '') == 'yes',
        'insurance_payment': user_input.get('insurancePayment', 0),
        'has_investment': user_input.get('hasInvestment', '') == 'yes',
        'investment_value': user_input.get('investmentAmount', 0),
        'retirement_age': retirement_age,
        'retirement_goal': user_input.get('retirementSavingsGoal', 0)
    }

# ────────────────────────────────────────────────────────────────────────────────
# Prompt Generator with Personalization
# ────────────────────────────────────────────────────────────────────────────────

def create_prompt(user_data: dict, json_facts: str, rag_context: str, 
                  similar_profiles: Optional[List[Dict]] = None) -> tuple[str, str]:
    """Enhanced prompt generator with personalization based on similar profiles"""
    
    system_prompt = """You are a retirement planning assistant. Use structured facts, 
    retrieved context, user input, and similar user insights to create a personalized plan.
    The plan should be detailed, actionable, and tailored to the user's specific situation.
    Also, it should be detailed and personalized to the user."""

    personalization_template = ""
    if similar_profiles and len(similar_profiles) > 0:
        personalization_template = """
        [Similar Profile Insights]
        {% for profile in similar_profiles %}
        Similar profile ({{ profile.similarity }}% match):
        - Age: {{ profile.age }}, Income: ${{ profile.income }}, Savings: ${{ profile.savings }}
        - Recommended strategy: {{ profile.strategy }}
        {% endfor %}
        """

    user_template = """
    [User Info]
    Age: {{ age }}
    Income: ${{ income }}
    Savings: ${{ savings }}
    Retirement Goal: ${{ retirement_goal }}
    Retirement Age: {{ retirement_age }}
    {% if has_mortgage %}
    Mortgage: ${{ mortgage_balance }} over {{ mortgage_term }} years
    {% endif %}
    {% if has_investment %}
    Investments: ${{ investment_value }}
    {% endif %}

    [Structured Facts]
    {{ json_facts }}

    [Retrieved Context]
    {{ rag_context }}
    
    {{ personalization }}

    [Request]
    Please generate a detailed and personalized retirement strategy using all the information above.
    """

    full_prompt = Template(user_template + personalization_template).render(
        **user_data, 
        json_facts=json_facts, 
        rag_context=clean_rag_facts(rag_context),
        similar_profiles=similar_profiles or [],
        personalization=personalization_template if similar_profiles else ""
    )
    
    return system_prompt, full_prompt

# ────────────────────────────────────────────────────────────────────────────────
# Call Ollama with Better Error Handling
# ────────────────────────────────────────────────────────────────────────────────

def call_ollama(system_prompt, user_prompt, max_retries=2):
    """Call Ollama with retry logic and better error handling"""
    for attempt in range(max_retries + 1):
        try:
            response = ollama.chat(
                model="llama3:8b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return response["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama call failed (attempt {attempt+1}/{max_retries+1}): {e}")
            if attempt == max_retries:
                raise Exception(f"Failed to generate response after {max_retries+1} attempts: {e}")
            # Wait before retrying (exponential backoff)
            time.sleep(2 ** attempt)

# ────────────────────────────────────────────────────────────────────────────────
# Find Similar User Profiles for Personalization
# ────────────────────────────────────────────────────────────────────────────────

def find_similar_profiles(user_data, max_profiles=3):
    """Find similar user profiles for personalized recommendations"""
    all_profiles = load_all_user_profiles()
    if not all_profiles:
        return []
    
    # Extract features for comparison
    user_features = {
        "age": user_data.get("age", 0),
        "income": user_data.get("income", 0),
        "savings": user_data.get("savings", 0),
        "retirement_age": user_data.get("retirement_age", 0)
    }
    
    similarities = []
    for profile in all_profiles:
        profile_data = profile.get("data", {})
        
        # Skip if this is the same profile
        if all(profile_data.get(k, 0) == v for k, v in user_features.items()):
            continue
            
        # Calculate similarity score (simple weighted Euclidean distance)
        try:
            age_diff = abs(profile_data.get("age", 0) - user_features["age"]) / 50  # Normalize by max expected difference
            income_diff = abs(profile_data.get("income", 0) - user_features["income"]) / max(user_features["income"], 1)
            savings_diff = abs(profile_data.get("currentSavings", 0) - user_features["savings"]) / max(user_features["savings"], 1)
            ret_age_diff = abs(profile_data.get("retirementAge", 0) - user_features["retirement_age"]) / 20
            
            # Weighted distance (lower is better)
            distance = 0.4 * age_diff + 0.3 * income_diff + 0.2 * savings_diff + 0.1 * ret_age_diff
            similarity = max(0, min(100, int(100 * (1 - distance))))
            
            similarities.append({
                "profile_id": profile.get("id", ""),
                "similarity": similarity,
                "age": profile_data.get("age", 0),
                "income": profile_data.get("income", 0),
                "savings": profile_data.get("currentSavings", 0),
                "strategy": "Balanced investment with focus on tax-advantaged accounts" # This would come from plan analysis in a full implementation
            })
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
    
    # Sort by similarity (highest first) and return top matches
    return sorted(similarities, key=lambda x: x["similarity"], reverse=True)[:max_profiles]

# ────────────────────────────────────────────────────────────────────────────────
# Create Retirement Plan with Intermediate Calculations
# ────────────────────────────────────────────────────────────────────────────────

def create_retirement_plan(user_input: dict):
    """Generate retirement plan with intermediate calculations"""
    # Generate a unique ID for this plan
    plan_id = str(uuid.uuid4())
    
    # Extract and calculate all metrics using Python
    current_age = int(user_input.get('age') or 0)
    retirement_age = int(user_input.get('retirementAge') or 0)
    current_savings = float(user_input.get('currentSavings') or 0)
    income = float(user_input.get('income') or 0)
    goal = float(user_input.get('retirementSavingsGoal') or 0)
    gender = user_input.get('gender', '')
    current_job = user_input.get('currentJob', '')
    has_mortgage = user_input.get('hasMortgage', 'no') == 'yes'
    mortgage_amount = float(user_input.get('mortgageAmount') or 0)
    has_investment = user_input.get('hasInvestment', 'no') == 'yes'
    investment_amount = float(user_input.get('investmentAmount') or 0)
    spending = float(user_input.get('spending') or 0)
    assets = float(user_input.get('assets') or 0)
    has_insurance = user_input.get('hasInsurance', 'no') == 'yes'
    insurance_payment = float(user_input.get('insurancePayment') or 0)
    
    # Calculate all metrics
    years_left = retirement_age - current_age
    annual_contribution = income * 0.15
    annual_return = 0.065
    
    # Track intermediate calculations for transparency
    intermediate_calculations = {
        "contributions": [],
        "growth": [],
        "cumulative": []
    }
    
    # Projected savings calculation with intermediate steps
    projected_savings = current_savings
    cumulative = current_savings
    
    for year in range(1, years_left + 1):
        # Growth on existing savings
        year_growth = projected_savings * annual_return
        
        # Add this year's contribution
        contribution = annual_contribution
        
        # Update projected savings
        projected_savings = projected_savings + year_growth + contribution
        
        # Store intermediate calculations
        intermediate_calculations["contributions"].append({
            "year": current_age + year,
            "amount": contribution
        })
        
        intermediate_calculations["growth"].append({
            "year": current_age + year,
            "amount": year_growth
        })
        
        intermediate_calculations["cumulative"].append({
            "year": current_age + year,
            "amount": projected_savings
        })
    
    # Calculate gap and required savings rate
    gap = goal - projected_savings
    required_savings_rate = (goal - current_savings) / (income * years_left) if years_left > 0 else 0
    required_savings_rate = min(max(required_savings_rate, 0.15), 0.50)
    
    # Calculate benchmarks
    age_benchmarks = {
        30: 1.0,
        35: 2.0,
        40: 3.0,
        45: 4.0,
        50: 6.0,
        55: 7.0,
        60: 8.0,
        65: 10.0
    }
    
    benchmark_age = min(age_benchmarks.keys(), key=lambda x: abs(x - current_age))
    benchmark_multiplier = age_benchmarks[benchmark_age]
    benchmark_savings = income * benchmark_multiplier
    
    # Calculate percentages for context
    mortgage_percentage = mortgage_amount/income*100 if has_mortgage and income > 0 else 0
    investment_percentage = investment_amount/current_savings*100 if current_savings > 0 and has_investment else 0
    
    # Find similar profiles for personalization
    similar_profiles = find_similar_profiles(user_input)
    
    # Prepare RAG + JSON facts using hybrid retrieval
    json_facts = flatten_facts(load_retirement_facts())
    retirement_query = f"retirement strategy for a {current_age}-year-old {gender} {current_job} earning ${income}"
    
    # Use hybrid retrieval
    index_manager = get_index_manager()
    rag_context = hybrid_retrieve(retirement_query, user_input, index_manager)
    
    # Format user data for prompt
    formatted_user_data = format_user_data(user_input)
    
    # Create the prompt
    system_prompt, user_prompt = create_prompt(
        formatted_user_data, 
        json_facts, 
        rag_context,
        similar_profiles
    )
    
    # Call the LLM
    try:
        llm_response = call_ollama(system_prompt, user_prompt)
        plan = llm_response
    except Exception as e:
        logger.error(f"Error generating plan with LLM: {str(e)}")
        plan = generate_fallback_plan({
            "user_profile": {
                "age": current_age,
                "gender": gender,
                "job": current_job,
                "income": income,
                "current_savings": current_savings,
                "retirement_age": retirement_age,
                "retirement_goal": goal,
                "years_until_retirement": years_left
            },
            "financial_metrics": {
                "projected_savings": projected_savings,
                "gap_to_goal": gap,
                "required_savings_rate": required_savings_rate,
                "benchmark_savings": benchmark_savings,
                "annual_contribution": annual_contribution,
                "annual_return": annual_return
            },
            "assets": {
                "has_mortgage": has_mortgage,
                "mortgage_amount": mortgage_amount,
                "mortgage_percentage": mortgage_percentage,
                "has_investments": has_investment,
                "investment_amount": investment_amount,
                "investment_percentage": investment_percentage
            },
            "assumptions": {
                "savings_rate": 0.15,
                "return_rate": 0.065,
                "inflation_rate": 0.03
            }
        })

    return {
        "plan_id": plan_id,
        "plan": plan,
        "projected_savings": projected_savings,
        "years_left": years_left,
        "gap": gap,
        "required_savings_rate": required_savings_rate,
        "intermediate_calculations": intermediate_calculations,
        "similar_profiles": similar_profiles,
        "status": "success"
    }

# ────────────────────────────────────────────────────────────────────────────────
# Feedback Mechanism
# ────────────────────────────────────────────────────────────────────────────────

def save_feedback(feedback_data: dict, path="data/retirement_feedback.json"):
    """Save user feedback on retirement plans"""
    entry = {
        "feedback_id": str(uuid.uuid4()),
        "plan_id": feedback_data.get("plan_id"),
        "timestamp": datetime.now().isoformat(),
        "rating": feedback_data.get("rating"),
        "comments": feedback_data.get("comments", "")
    }

    try:
        if os.path.exists(path):
            with open(path, "r") as f:
                all_feedback = json.load(f)
        else:
            all_feedback = []

        all_feedback.append(entry)

        with open(path, "w") as f:
            json.dump(all_feedback, f, indent=2)
        
        return {"status": "success", "feedback_id": entry["feedback_id"]}
    except Exception as e:
        logger.error(f"Error saving feedback: {e}")
        return {"status": "error", "message": str(e)}

# ────────────────────────────────────────────────────────────────────────────────
# Save User Profile
# ────────────────────────────────────────────────────────────────────────────────

def save_user_profile(user_input: dict, path="data/retirement_user_data.json"):
    """Save user profile data"""
    entry = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "data": user_input
    }

    try:
        if os.path.exists(path):
            with open(path, "r") as f:
                all_data = json.load(f)
        else:
            all_data = []

        all_data.append(entry)

        with open(path, "w") as f:
            json.dump(all_data, f, indent=2)
        
        return entry["id"]
    except Exception as e:
        logger.error(f"Error saving user input: {e}")
        return None

# ────────────────────────────────────────────────────────────────────────────────
# Load All User Profiles
# ────────────────────────────────────────────────────────────────────────────────

def load_all_user_profiles(path="data/retirement_user_data.json"):
    """Load all saved user profiles"""
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading user profiles: {e}")
        return []

# ────────────────────────────────────────────────────────────────────────────────
# Calculate Retirement Plan with API Endpoints
# ────────────────────────────────────────────────────────────────────────────────

def calculate_retirement(user_input):
    """Main function to calculate retirement plan"""
    key = compute_user_key(user_input)
    cache = load_plan_cache()

    if key in cache:
        plan_data = cache[key]
    else:
        plan_data = create_retirement_plan(user_input)
        save_plan_cache(key, plan_data)

    # Save user profile and get ID
    profile_id = save_user_profile(user_input)
    
    # Add profile ID to result
    if profile_id:
        plan_data["profile_id"] = profile_id
        # Ensure we have all required fields
    if not plan_data or 'plan' not in plan_data:
        raise ValueError("Failed to generate retirement plan")
    
    # Structure the response
    result = {
        "retirement_plan": {
            "plan_id": plan_data["plan_id"],
            "plan": plan_data["plan"],
            "projected_savings": plan_data["projected_savings"],
            "years_left": plan_data["years_left"],
            "gap": plan_data["gap"],
            "required_savings_rate": plan_data["required_savings_rate"],
            "intermediate_calculations": plan_data["intermediate_calculations"],
            "similar_profiles": plan_data["similar_profiles"]
        },
        "profile_id": plan_data.get("profile_id", ""),
        "status": "success"
    }
    
    return result

# ────────────────────────────────────────────────────────────────────────────────
# API Endpoints
# ────────────────────────────────────────────────────────────────────────────────

@router.post("/plan")
async def generate_retirement_plan(user_input: RetirementInput):
    """Generate a retirement plan based on user input"""
    try:
        result = calculate_retirement(user_input.model_dump())
        return result
    except Exception as e:
        logger.error(f"Error generating retirement plan: {str(e)}")
        return {
            "error": str(e),
            "status": "error"
        }

@router.post("/feedback")
async def submit_feedback(feedback: FeedbackInput):
    """Submit feedback for a retirement plan"""
    try:
        result = save_feedback(feedback.model_dump())
        return result
    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}")
        return {
            "error": str(e),
            "status": "error"
        }

@router.get("/user_profiles")
def get_user_profiles():
    """Get all saved user profiles"""
    try:
        profiles = load_all_user_profiles()
        return {"profiles": profiles, "count": len(profiles)}
    except Exception as e:
        logger.error(f"Error retrieving user profiles: {str(e)}")
        return {"error": str(e), "status": "error"}

@router.post("/query")
async def retirement_query(query_input: QueryInput, index_manager: IndexManager = Depends(get_index_manager)):
    """Query the retirement knowledge base with hybrid retrieval"""
    try:
        result = hybrid_retrieve(
            query_input.query, 
            query_input.user_data, 
            index_manager
        )
        return {
            "query": query_input.query,
            "result": result,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return {
            "error": str(e),
            "status": "error"
        }

@router.get("/intermediate_calculations/{plan_id}")
async def get_intermediate_calculations(plan_id: str):
    """Get intermediate calculations for a specific retirement plan"""
    # In a production system, this would retrieve from a database
    # For demo, we'll return sample data
    try:
        # TODO: Implement actual retrieval from database
        # For now, return sample data
        sample_calculations = {
            "contributions": [
                {"year": 30, "amount": 15000},
                {"year": 31, "amount": 15450},
                {"year": 32, "amount": 15913.5}
            ],
            "growth": [
                {"year": 30, "amount": 3250},
                {"year": 31, "amount": 4368.75},
                {"year": 32, "amount": 5598.59}
            ],
            "cumulative": [
                {"year": 30, "amount": 68250},
                {"year": 31, "amount": 88068.75},
                {"year": 32, "amount": 109580.84}
            ]
        }
        
        return {
            "plan_id": plan_id,
            "calculations": sample_calculations,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error retrieving calculations: {str(e)}")
        return {
            "error": str(e),
            "status": "error"
        }

# ────────────────────────────────────────────────────────────────────────────────
# Fallback Plan Generator
# ────────────────────────────────────────────────────────────────────────────────

def generate_fallback_plan(plan_data):
    """Generate a basic plan using Python if LLM fails"""
    user = plan_data["user_profile"]
    metrics = plan_data["financial_metrics"]
    assets = plan_data["assets"]
    
    return f"""## 🎯 Your Personalized Retirement Plan

Based on your profile as a {user['age']}-year-old {user['gender']} working as a {user['job']}, 
with ${user['current_savings']:,.0f} saved, you're {'ahead of' if user['current_savings'] >= metrics['benchmark_savings'] else 'behind'} 
the benchmark of ${metrics['benchmark_savings']:,.0f} for your age and income.

### 📊 Current Status
- Age: {user['age']}
- Current Savings: ${user['current_savings']:,.0f}
- Annual Income: ${user['income']:,.0f}
- Target Retirement Age: {user['retirement_age']}
- Retirement Goal: ${user['retirement_goal']:,.0f}
- Years Until Retirement: {user['years_until_retirement']}

### 📈 Projections
At your current savings rate of 15%, you're projected to have ${metrics['projected_savings']:,.0f} by retirement age {user['retirement_age']}.
This projection assumes:
- Annual savings rate of 15% (${metrics['annual_contribution']:,.0f})
- Average annual return of 6.5%
- No major withdrawals before retirement
- Consistent income growth with inflation

### 🎯 Action Plan
- Increase savings rate to {metrics['required_savings_rate']:.1%} of income
- Automate contributions to retirement accounts
- Review and rebalance portfolio annually
- Consider working with a financial advisor
- Build an emergency fund (3-6 months of expenses)

### 💡 Key Recommendations
- {'Consider paying off your mortgage before retirement to reduce fixed expenses' if assets['has_mortgage'] else 'Consider buying a home if appropriate for your situation'}
- {'Continue your investment strategy, which represents a healthy ' + f"{assets['investment_percentage']:.1f}% of your savings" if assets['has_investments'] else 'Start investing in a diversified portfolio of low-cost index funds'}
- Maximize tax-advantaged accounts (401(k), IRA) before taxable investments
- {'Increase your savings rate to close the gap to your retirement goal' if metrics['gap_to_goal'] > 0 else 'Maintain your excellent savings habits'}

### ⚠️ Watch-outs
- Market volatility may impact short-term returns
- Healthcare costs in retirement
- Potential changes to Social Security
- Inflation impact on purchasing power

### 🌟 Final Thoughts
{"You're in a great position — with consistency and smart investing, you're on track to retire comfortably. Keep the momentum going!" if metrics['gap_to_goal'] <= 0 else "While there's work to be done, remember that every step forward counts. Stay committed to your plan, and you'll build the retirement you deserve."}"""

# ────────────────────────────────────────────────────────────────────────────────
# Application Startup
# ────────────────────────────────────────────────────────────────────────────────

# Initialize on application startup
def initialize_app():
    """Initialize resources when the application starts"""
    try:
        # Initialize the index manager
        index_manager = get_index_manager()
        index_manager.initialize()
        
        # Warn if data files don't exist
        if not os.path.exists("data/retirement_facts.txt"):
            logger.warning("retirement_facts.txt not found. Semantic search will not work properly.")
        
        if not os.path.exists("data/retirement_data.json"):
            logger.warning("retirement_data.json not found. Structured facts will not be available.")
            
        logger.info("Retirement planner initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing retirement planner: {e}")
        return False

# Initialize the application when this module is imported
initialize_app()