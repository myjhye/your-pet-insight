"""
Pydantic 모델 정의
"""
from pydantic import BaseModel
from typing import List, Dict


class TestResult(BaseModel):
    """테스트 결과 저장 모델 (레거시)"""
    result_id: str
    pet_name: str
    locale: str
    answers: List[Dict]
    archetype_id: str


class CalculateRequest(BaseModel):
    """MBTI 계산 요청 모델"""
    petName: str
    mainAnswers: Dict[str, int]   # {"0": 3, "1": -2, ...} 인덱스: 점수(-3~3)
    bonusAnswers: Dict[str, int]  # {"0": 1, "1": -1, ...}
    locale: str = "en"

