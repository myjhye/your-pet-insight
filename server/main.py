"""
메인 FastAPI 애플리케이션
컨트롤러 역할: 모든 라우터를 등록하고 애플리케이션을 구성합니다.
"""
import sys
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

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
from routers.verify import router as verify_router
from routers.refund import router as refund_router

# FastAPI 앱 생성
# redirect_slashes=False: 슬래시 리다이렉트 비활성화 (엄격한 매칭)
app = FastAPI(redirect_slashes=False)

# CORS 설정 (리액트 및 외부 크로스 오리진 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
app.include_router(verify_router)
app.include_router(refund_router)


@app.get("/")
def read_root():
    """루트 엔드포인트"""
    return {"status": "🔥 Firebase 연결 성공! Your Pet Insight API is running."}


# uvicorn.run은 항상 파일의 맨 마지막에 위치해야 합니다!
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
