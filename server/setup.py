"""
데이터 셋업 관련 API 라우터
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["setup"])


@router.get("/setup")
async def setup_data():
    """데이터 셋업 API - 질문 업로드"""
    try:
        from upload_questions import upload_questions
        upload_questions()
        return {"status": "success", "message": "질문 데이터 업로드 완료!"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "message": str(e)}


@router.get("/setup-archetypes")
async def setup_archetypes():
    """Archetype 셋업 API - 16개 유형 업로드"""
    try:
        from upload_archetypes import upload_archetypes
        upload_archetypes()
        return {"status": "success", "message": "16개 유형 데이터 업로드 완료!"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "message": str(e)}

