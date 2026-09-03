"""
서버 설정 및 초기화 모듈
Firebase, OpenAI 클라이언트 초기화 및 전역 변수 관리
"""
import sys
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from openai import AsyncOpenAI

# .env 파일 로드
load_dotenv()

# Firebase 초기화 (인메모리 모드 호환)
db = None
try:
    if not firebase_admin._apps:
        cred_json = os.getenv("FIREBASE_CREDENTIALS")
        
        if cred_json:
            # 서버 환경: 환경 변수 문자열을 JSON으로 파싱해서 사용
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
        elif os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            db = firestore.client()
        else:
            print("⚠️ Firebase 인증 정보 없음 - DB 저장 없이 즉석 모드로 실행됩니다.")
    else:
        db = firestore.client()
except Exception as e:
    print(f"⚠️ Firebase 초기화 실패 - DB 저장 없이 즉석 모드로 실행됩니다: {e}")

# 인메모리 캐시 (서버 실행 중 유지)
cached_questions = {}

# OpenAI 클라이언트 초기화
api_key = os.getenv("OPENAI_API_KEY") or "dummy-key"
openai_client = AsyncOpenAI(api_key=api_key)

