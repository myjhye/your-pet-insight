from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import uuid
import asyncio
import os
from openai import AsyncOpenAI

# 1. Firebase 인증 및 초기화 (안전한 초기화 - 중복 방지)
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
else:
    firebase_admin.get_app()

db = firestore.client()

# 인메모리 캐시 (서버 실행 중 유지)
cached_questions = {}

app = FastAPI()

# 2. CORS 설정 (리액트에서 접속 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 리액트 주소만 허용하도록 수정
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 모델 정의
class TestResult(BaseModel):
    result_id: str
    pet_name: str
    locale: str
    answers: List[Dict]
    archetype_id: str


# MBTI 계산 요청 모델
class CalculateRequest(BaseModel):
    petName: str
    mainAnswers: Dict[str, int]   # {"0": 3, "1": -2, ...} 인덱스: 점수(-3~3)
    bonusAnswers: Dict[str, int]  # {"0": 1, "1": -1, ...}
    locale: str = "en"


@app.get("/")
def read_root():
    return {"status": "🔥 Firebase 연결 성공! Your Pet Insight API is running."}


# 언어별 텍스트 필터링 함수
def filter_by_lang(questions_list: list, lang: str) -> list:
    """질문 목록에서 특정 언어의 텍스트만 추출"""
    filtered = []
    for q in questions_list:
        # 해당 언어가 없으면 영어(en)를 기본값으로 사용
        text = q.get("text", {}).get(lang, q.get("text", {}).get("en", ""))
        filtered.append({
            "id": q["id"],
            "axis": q["axis"],
            "is_reverse": q.get("is_reverse", False),
            "text": text  # 이제 text는 객체가 아닌 '문자열'
        })
    return filtered


# [GET] 질문지 불러오기 API - 언어별 필터링 (권장)
@app.get("/api/questions/{version}/{lang}")
async def get_localized_questions(version: str, lang: str):
    # 1. 캐시 확인 (버전_언어 조합으로 키 생성)
    cache_key = f"{version}_{lang}"
    if cache_key in cached_questions:
        return cached_questions[cache_key]
    
    # 2. Firestore에서 원본 데이터 가져오기
    doc_ref = db.collection("assessment_configs").document(version)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="질문지를 찾을 수 없습니다.")
    
    data = doc.to_dict()
    
    # 3. 특정 언어 데이터만 필터링
    result = {
        "stage1": filter_by_lang(data.get("questions", []), lang),
        "stage2": filter_by_lang(data.get("owner_questions", []), lang)
    }
    
    # 4. 결과 캐싱
    cached_questions[cache_key] = result
    return result


# [GET] 질문지 불러오기 API - 전체 언어 (레거시 호환용)
@app.get("/api/questions/{version}")
async def get_questions(version: str):
    # 1. 이미 캐시된 데이터가 있다면 즉시 반환 (DB 호출 없이 ~0.001초)
    if version in cached_questions:
        return cached_questions[version]
    
    # 2. 캐시가 없으면 Firestore에서 가져옴
    doc_ref = db.collection("assessment_configs").document(version)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="질문지를 찾을 수 없습니다.")
    
    data = doc.to_dict()
    
    # 프론트엔드 편의를 위해 데이터를 스테이지별로 정리
    formatted_data = {
        "stage1": data.get("questions", []),       # 1-20번 문항
        "stage2": data.get("owner_questions", [])  # 21-25번 문항 (보호자 성향)
    }
    
    # 3. 가져온 데이터를 캐시에 저장
    cached_questions[version] = formatted_data
    return formatted_data


# [POST] 테스트 결과 저장 API (레거시)
@app.post("/api/save-result")
async def save_result(result: TestResult):
    try:
        db.collection("test_results").document(result.result_id).set(result.dict())
        return {"status": "success", "message": "결과가 성공적으로 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# [POST] MBTI 계산 및 결과 저장 API
# ============================================================
@app.post("/api/calculate")
async def calculate_mbti(request: CalculateRequest):
    try:
        # ---------------------------------------------------------
        # 1. 질문 메타데이터 조회 (axis, is_reverse 정보)
        # ---------------------------------------------------------
        doc_ref = db.collection("assessment_configs").document("dog_v1")
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="질문 설정을 찾을 수 없습니다.")
        
        config_data = doc.to_dict()
        all_questions = config_data.get("questions", []) + config_data.get("owner_questions", [])
        
        # 질문 ID → 메타데이터 매핑 (ID를 문자열로 통일하여 안전하게 처리)
        question_meta = {str(q["id"]): q for q in all_questions}
        
        # ---------------------------------------------------------
        # 2. 점수 변환 (Likert -3~3 → 1~5 척도로 선형 매핑)
        # ---------------------------------------------------------
        def convert_score(likert_score: int) -> float:
            """Likert (-3 ~ 3) → 5점 척도 (1 ~ 5) 선형 매핑"""
            # 선형 변환: ((score + 3) / 6 * 4) + 1
            # -3 → 1, -2 → 1.67, -1 → 2.33, 0 → 3, 1 → 3.67, 2 → 4.33, 3 → 5
            return ((likert_score + 3) / 6 * 4) + 1
        
        # ---------------------------------------------------------
        # 3. 역채점 처리 및 MBTI 축별 점수 합산
        # ---------------------------------------------------------
        axis_scores = {"E": 0, "S": 0, "F": 0, "J": 0}
        axis_question_counts = {"E": 0, "S": 0, "F": 0, "J": 0}  # 각 축별 질문 개수 추적
        all_answers = []
        
        print(f"\n{'='*60}")
        print(f"📋 질문별 점수 계산 시작 (총 {len(request.mainAnswers)}개 질문)")
        print(f"{'='*60}")
        
        # mainAnswers (1~20번 질문)
        for idx_str, likert_value in request.mainAnswers.items():
            # 인덱스 기반 ID 매핑 (인덱스 0 → 질문 ID 1)
            actual_id = str(int(idx_str) + 1)
            meta = question_meta.get(actual_id)
            
            if not meta:
                print(f"⚠️ 질문 ID {actual_id}를 찾을 수 없습니다.")
                continue
            
            # Likert → 5점 척도 선형 변환
            raw_score = convert_score(likert_value)
            
            # 역채점 처리 (5점 척도 기준: 6 - 점수)
            is_reverse = meta.get("is_reverse", False)
            final_score = (6 - raw_score) if is_reverse else raw_score
            
            # 축별 점수 합산
            axis = meta.get("axis")
            if axis in axis_scores:
                axis_scores[axis] += final_score
                axis_question_counts[axis] += 1
                
                # 상세 디버깅 로그
                print(f"Q{actual_id:2s} | Likert: {likert_value:2d} | Raw: {raw_score:5.2f} | "
                      f"Reverse: {is_reverse} | Final: {final_score:5.2f} | "
                      f"Axis: {axis} | 누적: {axis_scores[axis]:6.2f}")
            
            all_answers.append({
                "question_id": int(actual_id),
                "likert_value": likert_value,
                "raw_score": round(raw_score, 2),
                "final_score": round(final_score, 2),
                "axis": axis,
                "is_reverse": is_reverse
            })
        
        print(f"{'='*60}")
        print(f"📊 축별 점수 합계 (질문 개수)")
        print(f"{'='*60}")
        for axis, score in axis_scores.items():
            count = axis_question_counts[axis]
            avg = score / count if count > 0 else 0
            print(f"{axis}축: 총점 {score:6.2f}점 (질문 {count}개, 평균 {avg:.2f}점)")
        print(f"{'='*60}\n")
        
        # bonusAnswers (21~25번 질문) - 보호자 성향, MBTI 계산에는 미포함
        for idx_str, likert_value in request.bonusAnswers.items():
            actual_id = str(20 + int(idx_str) + 1)  # 인덱스 0 → 질문 ID 21
            meta = question_meta.get(actual_id)
            
            raw_score = convert_score(likert_value)
            
            all_answers.append({
                "question_id": int(actual_id),
                "likert_value": likert_value,
                "raw_score": round(raw_score, 2),
                "final_score": round(raw_score, 2),  # 보너스는 역채점 없음
                "axis": meta.get("axis") if meta else "bonus",
                "is_reverse": False
            })
        
        # ---------------------------------------------------------
        # 4. 백분율 Stats 계산 (먼저 계산하여 MBTI 판정에 사용)
        # ---------------------------------------------------------
        def get_stat(score: float) -> int:
            """5~25점 범위를 0~100%로 변환"""
            # (획득점수 - 최소점수5) / (최대점수25 - 최소점수5) * 100
            percentage = ((score - 5) / 20) * 100
            return round(percentage)
        
        stats = {
            "sociability": get_stat(axis_scores["E"]),      # E축
            "sagacity": get_stat(axis_scores["S"]),         # S축
            "emotionality": get_stat(axis_scores["F"]),     # F축
            "obedience": get_stat(axis_scores["J"]),        # J축
        }
        stats["temperament"] = round((stats["sociability"] + stats["obedience"]) / 2)
        
        # 상세 디버깅: Stats 계산 과정 출력
        print(f"\n{'='*60}")
        print(f"📊 백분율 Stats 계산")
        print(f"{'='*60}")
        print(f"E축 점수: {axis_scores['E']:.2f}점 → Sociability: {stats['sociability']}%")
        print(f"S축 점수: {axis_scores['S']:.2f}점 → Sagacity: {stats['sagacity']}%")
        print(f"F축 점수: {axis_scores['F']:.2f}점 → Emotionality: {stats['emotionality']}%")
        print(f"J축 점수: {axis_scores['J']:.2f}점 → Obedience: {stats['obedience']}%")
        print(f"Temperament: {stats['temperament']}% (Sociability + Obedience 평균)")
        print(f"{'='*60}\n")
        
        # ---------------------------------------------------------
        # 5. MBTI 4축 판정 (백분율 50% 기준)
        # ---------------------------------------------------------
        e_i = "E" if stats["sociability"] >= 50 else "I"
        s_n = "S" if stats["sagacity"] >= 50 else "N"
        f_t = "F" if stats["emotionality"] >= 50 else "T"
        j_p = "J" if stats["obedience"] >= 50 else "P"
        
        mbti_code = e_i + s_n + f_t + j_p
        
        # 상세 디버깅: MBTI 판정 과정 출력
        print(f"{'='*60}")
        print(f"🎯 MBTI 판정 (50% 기준)")
        print(f"{'='*60}")
        print(f"E/I: Sociability {stats['sociability']}% → {e_i} ({'Extroverted' if e_i == 'E' else 'Introverted'})")
        print(f"S/N: Sagacity {stats['sagacity']}% → {s_n} ({'Sensing' if s_n == 'S' else 'Intuitive'})")
        print(f"F/T: Emotionality {stats['emotionality']}% → {f_t} ({'Feeling' if f_t == 'F' else 'Thinking'})")
        print(f"J/P: Obedience {stats['obedience']}% → {j_p} ({'Judging' if j_p == 'J' else 'Perceiving'})")
        print(f"\n✅ 최종 MBTI: {mbti_code}")
        print(f"{'='*60}\n")
        
        # ---------------------------------------------------------
        # 6. Archetype 데이터 조회
        # ---------------------------------------------------------
        archetype_ref = db.collection("archetypes").document(mbti_code)
        archetype_doc = archetype_ref.get()
        
        archetype_data = None
        if archetype_doc.exists:
            archetype_data = archetype_doc.to_dict()
            
            # {{pet_name}} 플레이스홀더 치환 함수
            def replace_placeholders(obj, pet_name: str, locale: str):
                if isinstance(obj, str):
                    return obj.replace("{{pet_name}}", pet_name)
                elif isinstance(obj, dict):
                    # 다국어 처리: locale 키가 있으면 해당 언어만 추출
                    if locale in obj and isinstance(obj[locale], str):
                        return obj[locale].replace("{{pet_name}}", pet_name)
                    return {k: replace_placeholders(v, pet_name, locale) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [replace_placeholders(item, pet_name, locale) for item in obj]
                return obj
            
            archetype_data = replace_placeholders(archetype_data, request.petName, request.locale)
        
        # ---------------------------------------------------------
        # 7. 결과 저장 (Firestore)
        # ---------------------------------------------------------
        result_id = str(uuid.uuid4())
        
        # 현재 시간과 30일 뒤 시간 계산
        now = datetime.utcnow()
        expire_at = now + timedelta(days=30)  # 30일 뒤 날짜 계산
        
        result_data = {
            "result_id": result_id,
            "pet_name": request.petName,
            "locale": request.locale,
            "mbti_code": mbti_code,
            "axis_scores": axis_scores,
            "stats": stats,
            "answers": all_answers,
            "archetype": archetype_data,
            "created_at": now,
            "expire_at": expire_at,  # 삭제될 시간을 저장
            "report_status": "not_generated",  # 리포트 생성 상태 초기화
            "report_pages": None,  # 리포트 페이지 데이터 초기화
        }
        
        db.collection("test_results").document(result_id).set(result_data)
        
        # ---------------------------------------------------------
        # 8. 응답 반환
        # ---------------------------------------------------------
        return {
            "resultId": result_id,
            "mbtiCode": mbti_code,
            "stats": stats,
            "archetype": archetype_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"계산 중 오류 발생: {str(e)}")


# [GET] 특정 결과 조회 API
@app.get("/api/results/{result_id}")
async def get_result(result_id: str):
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


# [GET] 데이터 셋업 API - 질문 업로드
@app.get("/api/setup")
async def setup_data():
    try:
        from upload_questions import upload_questions
        upload_questions()
        return {"status": "success", "message": "질문 데이터 업로드 완료!"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "message": str(e)}


# [GET] Archetype 셋업 API - 16개 유형 업로드
@app.get("/api/setup-archetypes")
async def setup_archetypes():
    try:
        from upload_archetypes import upload_archetypes
        upload_archetypes()
        return {"status": "success", "message": "16개 유형 데이터 업로드 완료!"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "message": str(e)}


# ============================================================
# [POST] AI 리포트 생성 API
# ============================================================
@app.post("/api/test/generate-report/{result_id}")
async def generate_report(result_id: str):
    """
    테스트용 리포트 생성 엔드포인트
    Firestore에서 결과 데이터를 가져와 OpenAI로 7개 페이지를 병렬 생성
    """
    try:
        # OpenAI 클라이언트 초기화
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        
        client = AsyncOpenAI(api_key=api_key)
        
        # 1. Firestore에서 결과 데이터 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")
        
        result_data = doc.to_dict()
        pet_name = result_data.get("pet_name", "Unknown")
        mbti_code = result_data.get("mbti_code", "")
        stats = result_data.get("stats", {})
        archetype = result_data.get("archetype", {})
        answers = result_data.get("answers", [])
        
        # report_status를 'generating'으로 업데이트
        doc_ref.update({
            "report_status": "generating"
        })
        
        # 2. Stats 데이터 해석 설명 생성
        stats_interpretation = {
            "sociability": f"사회성 {stats.get('sociability', 50)}% - {'외향적' if stats.get('sociability', 50) >= 50 else '내향적'} 성향",
            "sagacity": f"지능성 {stats.get('sagacity', 50)}% - {'직관적' if stats.get('sagacity', 50) >= 50 else '감각적'} 성향",
            "emotionality": f"감정성 {stats.get('emotionality', 50)}% - {'감정적' if stats.get('emotionality', 50) >= 50 else '이성적'} 성향",
            "obedience": f"순종성 {stats.get('obedience', 50)}% - {'계획적' if stats.get('obedience', 50) >= 50 else '자유로운'} 성향",
            "temperament": f"기질 {stats.get('temperament', 50)}% - {'안정적' if stats.get('temperament', 50) >= 50 else '활발한'} 성향"
        }
        
        # 3. 7개 페이지별 프롬프트 정의
        page_prompts = [
            {
                "page": "training_roadmap",
                "prompt": f"""반려견 {pet_name}의 성격 유형({mbti_code})과 다음 통계를 바탕으로 맞춤형 훈련 로드맵을 작성해주세요.

통계:
- {stats_interpretation['sociability']}
- {stats_interpretation['sagacity']}
- {stats_interpretation['emotionality']}
- {stats_interpretation['obedience']}
- {stats_interpretation['temperament']}

이 데이터를 바탕으로 {pet_name}에게 가장 효과적인 훈련 방법, 단계별 접근법, 예상 소요 시간, 주의사항을 포함한 상세한 훈련 로드맵을 작성해주세요. 한국어로 작성하며, 실용적이고 구체적인 조언을 제공해주세요."""
            },
            {
                "page": "behavior_analysis",
                "prompt": f"""반려견 {pet_name}의 성격 유형({mbti_code})과 통계 데이터를 바탕으로 행동 분석 리포트를 작성해주세요.

통계:
- {stats_interpretation['sociability']}
- {stats_interpretation['sagacity']}
- {stats_interpretation['emotionality']}
- {stats_interpretation['obedience']}
- {stats_interpretation['temperament']}

이 데이터를 바탕으로 {pet_name}의 예상 행동 패턴, 강점, 주의해야 할 행동, 일상 생활에서의 특징을 분석해주세요. 한국어로 작성하며, 구체적인 예시를 포함해주세요."""
            },
            {
                "page": "social_interaction",
                "prompt": f"""반려견 {pet_name}의 사회성 통계({stats_interpretation['sociability']})를 바탕으로 사회적 상호작용 가이드를 작성해주세요.

성격 유형: {mbti_code}
전체 통계:
- {stats_interpretation['sociability']}
- {stats_interpretation['sagacity']}
- {stats_interpretation['emotionality']}
- {stats_interpretation['obedience']}

이 데이터를 바탕으로 {pet_name}가 다른 강아지, 사람, 새로운 환경과 어떻게 상호작용할지 예측하고, 사회화 훈련 방법, 주의사항, 긍정적인 사회적 경험을 만드는 방법을 제시해주세요. 한국어로 작성해주세요."""
            },
            {
                "page": "health_wellness",
                "prompt": f"""반려견 {pet_name}의 성격 유형({mbti_code})과 통계를 바탕으로 건강 및 웰니스 가이드를 작성해주세요.

통계:
- {stats_interpretation['sociability']}
- {stats_interpretation['sagacity']}
- {stats_interpretation['emotionality']}
- {stats_interpretation['obedience']}
- {stats_interpretation['temperament']}

이 데이터를 바탕으로 {pet_name}의 성격에 맞는 운동량, 식습관, 정신 건강 관리, 스트레스 관리 방법을 제시해주세요. 한국어로 작성하며, 실용적인 조언을 포함해주세요."""
            },
            {
                "page": "cognitive_benchmarks",
                "prompt": f"""반려견 {pet_name}의 지능성 통계({stats_interpretation['sagacity']})를 바탕으로 인지 능력 벤치마크 리포트를 작성해주세요.

성격 유형: {mbti_code}
전체 통계:
- {stats_interpretation['sociability']}
- {stats_interpretation['sagacity']}
- {stats_interpretation['emotionality']}
- {stats_interpretation['obedience']}

이 데이터를 바탕으로 {pet_name}의 인지 능력 수준, 학습 스타일, 문제 해결 능력, 적합한 정신 자극 활동을 분석하고 제시해주세요. 한국어로 작성하며, 과학적 근거를 포함해주세요."""
            },
            {
                "page": "environment_setup",
                "prompt": f"""반려견 {pet_name}의 성격 유형({mbti_code})과 통계를 바탕으로 최적의 환경 설정 가이드를 작성해주세요.

통계:
- {stats_interpretation['sociability']}
- {stats_interpretation['sagacity']}
- {stats_interpretation['emotionality']}
- {stats_interpretation['obedience']}
- {stats_interpretation['temperament']}

이 데이터를 바탕으로 {pet_name}에게 가장 적합한 생활 환경, 공간 배치, 장난감 선택, 휴식 공간 설계를 제안해주세요. 한국어로 작성하며, 구체적인 예시를 포함해주세요."""
            },
            {
                "page": "owner_bonding",
                "prompt": f"""반려견 {pet_name}의 성격 유형({mbti_code})과 통계를 바탕으로 보호자와의 유대감 강화 가이드를 작성해주세요.

통계:
- {stats_interpretation['sociability']}
- {stats_interpretation['sagacity']}
- {stats_interpretation['emotionality']}
- {stats_interpretation['obedience']}
- {stats_interpretation['temperament']}

이 데이터를 바탕으로 {pet_name}와 보호자가 더 깊은 유대감을 형성하는 방법, 소통 방법, 함께 즐길 수 있는 활동, 신뢰 구축 방법을 제시해주세요. 한국어로 작성하며, 감성적이고 실용적인 조언을 포함해주세요."""
            }
        ]
        
        # 4. 7개 페이지를 병렬로 생성
        async def generate_page(page_info):
            try:
                response = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "당신은 반려견 행동 전문가이자 훈련사입니다. 반려견의 성격 데이터를 바탕으로 실용적이고 구체적인 조언을 제공합니다."
                        },
                        {
                            "role": "user",
                            "content": page_info["prompt"]
                        }
                    ],
                    temperature=0.7,
                    max_tokens=1500
                )
                return {
                    "page": page_info["page"],
                    "content": response.choices[0].message.content
                }
            except Exception as e:
                print(f"페이지 {page_info['page']} 생성 실패: {str(e)}")
                return {
                    "page": page_info["page"],
                    "content": f"생성 중 오류가 발생했습니다: {str(e)}"
                }
        
        # 병렬 실행
        tasks = [generate_page(page_info) for page_info in page_prompts]
        results = await asyncio.gather(*tasks)
        
        # 5. 결과를 하나의 객체로 묶기
        report_pages = {}
        for result in results:
            report_pages[result["page"]] = result["content"]
        
        # 6. Firestore에 업데이트
        doc_ref.update({
            "report_pages": report_pages,
            "report_status": "ready",
            "generated_at": firestore.SERVER_TIMESTAMP
        })
        
        return {
            "status": "success",
            "message": "리포트 생성이 완료되었습니다.",
            "result_id": result_id,
            "pages_generated": len(report_pages)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        
        # 오류 발생 시 상태 업데이트
        try:
            doc_ref = db.collection("test_results").document(result_id)
            doc_ref.update({
                "report_status": "failed"
            })
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"리포트 생성 중 오류 발생: {str(e)}")


# uvicorn.run은 항상 파일의 맨 마지막에 위치해야 합니다!
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
