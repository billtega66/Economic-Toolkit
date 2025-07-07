from pathlib import Path

class DummyLogger:
    def warning(self, *args, **kwargs):
        pass

def load_format_user_data():
    path = Path(__file__).resolve().parents[1] / "retirement_planner.py"
    lines = path.read_text().splitlines()
    code = "\n".join(lines[314:347])
    namespace = {"logger": DummyLogger()}
    exec(code, namespace)
    return namespace["format_user_data"]

format_user_data = load_format_user_data()


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
