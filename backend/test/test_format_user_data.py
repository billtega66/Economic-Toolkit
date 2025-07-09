"""Tests for the ``format_user_data`` helper.

The original tests dynamically executed a slice of ``retirement_planner.py`` to
avoid importing heavy optional dependencies.  The real module is now imported
directly, but we stub the optional packages so the import succeeds even when the
dependencies are not installed in the test environment.
"""

import types
import sys
import importlib
from pathlib import Path

# Stub heavy optional dependencies so the module can be imported
sys.modules.setdefault("faiss", types.ModuleType("faiss"))
sys.modules.setdefault("ollama", types.ModuleType("ollama"))
sys.modules.setdefault("numpy", types.ModuleType("numpy"))
jinja2_mod = types.ModuleType("jinja2")
setattr(jinja2_mod, "Template", object)
sys.modules.setdefault("jinja2", jinja2_mod)

st = sys.modules.setdefault("sentence_transformers", types.ModuleType("sentence_transformers"))
setattr(st, "SentenceTransformer", object)
setattr(st, "CrossEncoder", object)

lc_docs = types.ModuleType("langchain_core.documents")
setattr(lc_docs, "Document", object)
sys.modules.setdefault("langchain_core", types.ModuleType("langchain_core"))
sys.modules.setdefault("langchain_core.documents", lc_docs)

lts = types.ModuleType("langchain_text_splitters")
setattr(lts, "RecursiveCharacterTextSplitter", object)
sys.modules.setdefault("langchain_text_splitters", lts)

# Add backend directory to sys.path so relative imports work
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Import module now that dependencies are stubbed
spec = importlib.util.spec_from_file_location(
    "retirement_planner",
    (Path(__file__).resolve().parents[1] / "retirement_planner.py")
)
retirement_planner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retirement_planner)
format_user_data = retirement_planner.format_user_data


def test_age_clamped_low_high():
    assert format_user_data({"age": 10, "retirementAge": 20})["age"] == 18
    assert format_user_data({"age": 150, "retirementAge": 160})["age"] == 100

def test_retirement_age_adjusted():
    res = format_user_data({"age": 40, "retirementAge": 40})
    assert res["retirement_age"] == 45

def test_other_fields_unchanged():
    data = {
        "age": 30,
        "retirementAge": 60,
        "currentSavings": 5000,
        "gender": "female",
        "currentJob": "engineer",
        "income": 100000,
        "spending": 40000,
        "hasMortgage": "yes",
        "mortgageAmount": 200000,
        "mortgageTerm": 30,
        "downPayment": 10000,
        "downPaymentPercent": 5,
        "assets": 25000,
        "hasInsurance": "no",
        "insurancePayment": 0,
        "hasInvestment": "yes",
        "investmentAmount": 15000,
        "retirementSavingsGoal": 1000000,
    }
    result = format_user_data(data)
    assert result["age"] == 30
    assert result["retirement_age"] == 60
    assert result["savings"] == 5000
    assert result["gender"] == "female"
    assert result["job"] == "engineer"
    assert result["income"] == 100000
    assert result["spending"] == 40000
    assert result["has_mortgage"] is True
    assert result["mortgage_balance"] == 200000
    assert result["mortgage_term"] == 30
    assert result["down_payment"] == 10000
    assert result["down_payment_percent"] == 5
    assert result["assets"] == 25000
    assert result["has_insurance"] is False
    assert result["insurance_payment"] == 0
    assert result["has_investment"] is True
    assert result["investment_value"] == 15000
    assert result["retirement_goal"] == 1000000