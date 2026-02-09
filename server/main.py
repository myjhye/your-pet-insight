"""
메인 FastAPI 애플리케이션
컨트롤러 역할: 모든 라우터를 등록하고 애플리케이션을 구성합니다.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 설정 모듈 import (Firebase 초기화를 위해)
import config

# 라우터 import (routers 폴더에서)
from routers.questions import router as questions_router
from routers.results import router as results_router
from routers.calculate import router as calculate_router
from routers.report_generation import router as report_router
from routers.setup import router as setup_router
from routers.checkout import router as checkout_router
from routers.refund import router as refund_router

# FastAPI 앱 생성
app = FastAPI()

# CORS 설정 (리액트에서 접속 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 리액트 주소만 허용하도록 수정
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(questions_router)
app.include_router(results_router)
app.include_router(calculate_router)
app.include_router(report_router)
app.include_router(setup_router)
app.include_router(checkout_router)
app.include_router(refund_router)


@app.get("/")
def read_root():
    """루트 엔드포인트"""
    return {"status": "🔥 Firebase 연결 성공! Your Pet Insight API is running."}


# uvicorn.run은 항상 파일의 맨 마지막에 위치해야 합니다!
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
