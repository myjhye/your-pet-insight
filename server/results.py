"""
결과 저장 및 조회 관련 API 라우터
"""
from fastapi import APIRouter, HTTPException
from models import TestResult
from config import db

router = APIRouter(prefix="/api", tags=["results"])


@router.post("/save-result")
async def save_result(result: TestResult):
    """테스트 결과 저장 API (레거시)"""
    try:
        db.collection("test_results").document(result.result_id).set(result.dict())
        return {"status": "success", "message": "결과가 성공적으로 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{result_id}")
async def get_result(result_id: str):
    """특정 결과 조회 API"""
    try:
        # test_results 컬렉션에서 해당 UUID 문서 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

        # 결과 데이터 반환 (이미 계산된 stats와 archetype 서술 포함)
        return doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

