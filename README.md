# 🐾 YourPetInsight

반려동물을 위한 인사이트 플랫폼

## 프로젝트 구조

```
yourpetinsight/
├── client/          # React.js 프론트엔드 (Vite)
└── server/          # Python FastAPI 백엔드
```

## 시작하기

### 서버 (FastAPI)

```bash
cd server

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn main:app --reload --port 8000
```

서버가 실행되면 다음 주소에서 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 클라이언트 (React)

```bash
cd client

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

클라이언트는 http://localhost:3000 에서 실행됩니다.

## 개발 환경

- **Frontend**: React 18 + Vite
- **Backend**: Python 3.11+ / FastAPI
- **API 프록시**: Vite 개발 서버에서 `/api` 요청을 FastAPI로 프록시

