from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Firebase 초기화
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# Firestore 클라이언트 초기화
db = firestore.client()

print("🔥 Firebase 연결 성공! Firestore 준비 완료.")

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
