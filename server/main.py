from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="YourPetInsight API",
    description="반려동물을 위한 인사이트 API",
    version="0.1.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """서버 상태 확인 엔드포인트"""
    return {"status": "ok", "message": "서버가 정상적으로 실행 중입니다 🐾"}


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {"message": "YourPetInsight API에 오신 것을 환영합니다!"}

