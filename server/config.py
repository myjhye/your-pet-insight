"""
서버 설정 및 초기화 모듈
Firebase, OpenAI 클라이언트 초기화 및 전역 변수 관리
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from openai import AsyncOpenAI

# .env 파일 로드
load_dotenv()

# Firebase 초기화
if not firebase_admin._apps:
    cred_json = os.getenv("FIREBASE_CREDENTIALS")
    
    if cred_json:
        # 서버 환경: 환경 변수 문자열을 JSON으로 파싱해서 사용
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # 로컬 환경: 파일이 있으면 사용 (없으면 에러)
        if os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
        else:
            raise FileNotFoundError("Firebase 인증 정보(파일 또는 환경 변수)가 없습니다.")
            
    firebase_admin.initialize_app(cred)

# Firestore 클라이언트
db = firestore.client()

# 인메모리 캐시 (서버 실행 중 유지)
cached_questions = {}

# OpenAI 클라이언트 초기화
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

