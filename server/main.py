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
from dotenv import load_dotenv
from openai import AsyncOpenAI

# .env 파일의 내용을 로드합니다.
load_dotenv()

# 1. Firebase 인증 및 초기화 (안전한 초기화 - 중복 방지)
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
else:
    firebase_admin.get_app()

db = firestore.client()

# 인메모리 캐시 (서버 실행 중 유지)
cached_questions = {}

# OpenAI 클라이언트 초기화
# 이제 os.getenv가 .env 파일의 값을 가져올 수 있습니다.
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
            "report_pages": {},  # 리포트 페이지 데이터 초기화
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
# [POST] 프리미엄 리포트 생성 API
# ============================================================
@app.post("/api/test/generate-report/{result_id}")
async def generate_report(result_id: str, lang: str = "en"):
    try:
        # 1. Firestore에서 결과 데이터 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")
        
        result_data = doc.to_dict()
        pet_name = result_data.get("pet_name", "")
        mbti_code = result_data.get("mbti_code", "")
        stats = result_data.get("stats", {})
        answers = result_data.get("answers", [])
        
        # 보너스 답변 추출 (21-25번 질문) - 보호자 성향 데이터
        owner_answers = [a for a in answers if a.get("question_id", 0) > 20]
        
        # 보호자 성향 데이터 포맷팅
        owner_traits = {}
        if owner_answers:
            # 보호자 답변을 간단한 요약으로 변환
            owner_summary = []
            for ans in owner_answers:
                likert = ans.get("likert_value", 0)
                if likert > 0:
                    owner_summary.append("활발하고 적극적인 성향")
                elif likert < 0:
                    owner_summary.append("차분하고 신중한 성향")
                else:
                    owner_summary.append("균형잡힌 성향")
            owner_traits = {
                "summary": ", ".join(set(owner_summary[:3])),  # 중복 제거 후 최대 3개
                "answers": owner_answers
            }
        
        # Stats 데이터를 문자열로 포맷팅
        trait_stats = ", ".join([f"{key}: {value}%" for key, value in stats.items()])
        
        # 2. 리포트 상태를 'generating'으로 업데이트
        doc_ref.update({
            "report_status": "generating",
            "report_pages": {}
        })
        
        # 3. 공통 시스템 프롬프트 (언어 및 톤 지시 포함 - 대폭 강화)
        lang_names = {"ko": "한국어", "en": "English", "jp": "日本語"}
        lang_name = lang_names.get(lang, "English")
        
        system_prompt = f"""너는 반려동물의 마음을 읽어주는 따뜻한 스토리텔러이자 행동 전문가야. 
수치를 나열하지 말고 '보호자가 퇴근하고 집에 왔을 때 {pet_name}가 보여주는 구체적인 행동'이나 '산책 중 낯선 개를 만났을 때의 눈빛'처럼 일상적인 묘사를 듬뿍 담아서 써줘. 
전문적이면서도 감동적인 어투를 유지하고, 반드시 사용자가 요청한 '{lang_name}' 언어로 작성해.
마크다운 형식으로 작성하라."""
        
        # 4. 8개 페이지별 프롬프트 정의 (목차 + 7개 내용 페이지)
        page_prompts = [
            {
                "page": "table_of_contents",
                "prompt": f"""다음은 {pet_name}의 프리미엄 성격 분석 리포트 목차입니다.

리포트는 총 8페이지로 구성되며, 다음 내용을 포함합니다:
1. 목차 (현재 페이지)
2. 성격 지표 심층 해설
3. 인지적 강점과 본능적 천재성
4. 보호자와의 특별한 케미 분석
5. 맞춤형 긍정 강화 교육 로드맵
6. 사회성 및 환경 적응 가이드
7. 완벽한 하루를 위한 라이프스타일
8. 보호자에게 보내는 특별한 메시지

위 목차를 마크다운 형식으로 예쁘게 포맷팅하여 작성해주세요. 각 페이지에 대한 간단한 설명(1-2줄)도 포함해주세요."""
            },
            {
                "page": "deep_dive_traits",
                "prompt": f"""우리 {pet_name}의 마음속에는 어떤 지도가 그려져 있을까요?

반려견 {pet_name}의 5가지 성격 수치 데이터인 {trait_stats}를 분석해줘. 

중요: "지표가 몇 %라서 이렇다"는 설명 대신 "이 수치는 일상에서 이런 귀여운 모습으로 나타납니다"라는 스토리텔링 방식으로 써줘.

보호자가 일상에서 느낄 만한 구체적인 순간을 묘사해줘:
- 산책 중 낯선 사람을 만날 때 {pet_name}의 반응은? 꼬리는 어떻게 움직이나요?
- 밥 먹을 때의 표정과 행동은? 어떤 순간에 가장 행복해 보이나요?
- 장난감을 줄 때 어떤 표정을 짓나? 눈이 반짝이는 순간은 언제인가요?
- 가장 높은 수치와 가장 낮은 수치가 부딪힐 때 나타나는 독특한 개성은?

반려동물 잡지 기사처럼 세련되게, 전문 용어는 쉽게 풀어서 설명해줘. 한 페이지 분량의 심층 보고서를 작성해줘.

MBTI 유형: {mbti_code}"""
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""{pet_name}의 성격 유형인 {mbti_code}과 사가시티(Sagacity) 수치를 바탕으로, 이 친구가 세상을 어떻게 이해하고 문제를 해결하는지 분석해줘.

스토리텔링 방식으로 작성해줘:
- 새로운 장난감을 줬을 때 {pet_name}의 첫 반응은? 코로 냄새를 맡는가, 바로 물어보는가, 조심스럽게 관찰하는가?
- 낯선 길을 갈 때 어떤 인지적 프로세스를 거치는지 구체적인 순간을 묘사해줘
- 이 유형만이 가진 '천재적인 모먼트'는 무엇인지 일상 속 에피소드로 설명해줘

보호자가 실제로 목격할 수 있는 장면을 생생하게 그려줘. 반려동물 잡지 기사처럼 세련되게 작성해줘.

성격 통계: {trait_stats}"""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""당신과 {pet_name} 사이에는 어떤 특별한 케미가 있을까요?

가장 중요한 분석이야. 강아지 성향 데이터 {trait_stats}와 보호자의 성향 데이터 {owner_traits.get('summary', '보호자 성향 데이터 없음')}를 대조해줘. 

스토리텔링 방식으로 작성해줘:
1) 두 사람의 에너지가 가장 잘 맞는 부분 - 예를 들어 "당신이 피곤해 돌아왔을 때 {pet_name}는 어떻게 반응하나요?"
2) 서로의 성향 차이로 인해 발생할 수 있는 잠재적 오해 - "때로는 {pet_name}가 당신의 의도를 오해할 수 있는 순간은?"
3) 보호자가 {pet_name}의 마음을 얻기 위해 실천할 수 있는 '심리적 접근법' - 구체적인 일상 행동으로 설명해줘

데이터에 기반하여 아주 개인화된 내용을 담아줘.

{pet_name}의 MBTI 유형: {mbti_code}"""
            },
            {
                "page": "training_roadmap",
                "prompt": f"""{pet_name}의 순종도(Obedience)와 기질(Temperament) 수치를 고려한 최적의 교육 전략을 세워줘.

스토리텔링 방식으로 작성해줘:
- "앉아" 훈련을 할 때 {pet_name}의 반응은? 어떤 순간에 가장 잘 따라오는가?
- 강압적인 훈련 대신 이 친구의 동기부여를 자극할 수 있는 구체적인 방법(간식, 칭찬, 놀이 등)을 일상 속 장면으로 묘사해줘
- 이 성격 유형이 쉽게 지루해하거나 스트레스받을 수 있는 지점을 실제 상황으로 설명해줘
- 이를 극복하는 단계별 훈련 가이드를 "첫 주에는...", "두 번째 주에는..."처럼 구체적으로 작성해줘

보호자가 바로 실천할 수 있도록 명확하고 따뜻하게 작성해줘.

성격 통계: {trait_stats}
MBTI 유형: {mbti_code}"""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""{pet_name}의 사회성(Sociability)과 감정성(Emotionality) 수치를 바탕으로 사회생활 가이드를 작성해줘.

구체적인 일상 상황을 묘사하며 작성해줘:
1) 애견 카페나 공원에서 다른 강아지를 만날 때 {pet_name}의 반응은? 꼬리를 흔드는가, 조심스럽게 다가가는가? 이런 순간에 보호자가 어떻게 도와줄 수 있는지
2) 이사를 가거나 낯선 사람이 집에 왔을 때 {pet_name}의 적응 과정을 단계별로 생생하게 묘사해줘
3) 분리불안을 예방하기 위해 보호자가 제공해야 할 정서적 안전장치를 실제 행동으로 설명해줘 (예: "출근 전 10분은 꼭 함께 놀아주세요")

반려동물 잡지 기사처럼 세련되고 실용적으로 작성해줘.

성격 통계: {trait_stats}
MBTI 유형: {mbti_code}"""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""{pet_name}의 에너지 레벨과 성향에 딱 맞는 '완벽한 하루 일과'를 설계해줘.

스토리텔링 방식으로 하루를 그려줘:
- 아침: {pet_name}이 일어나서 어떤 모습인가? 산책은 언제가 좋은가?
- 산책 코스의 스타일(냄새 위주 vs 활동량 위주)을 구체적인 경로로 설명해줘
- 점심: 이 유형의 지능을 자극할 수 있는 노즈워크나 장난감 종류를 실제 사용 장면으로 묘사해줘
- 저녁: 휴식 시간에 가장 편안함을 느낄 수 있는 환경 조성법을 구체적으로 제안해줘

실제 제품 카테고리를 언급해도 좋아. 반려동물 잡지 기사처럼 세련되게 작성해줘.

성격 통계: {trait_stats}
MBTI 유형: {mbti_code}"""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""지금까지의 모든 분석을 종합하여, {pet_name}이 보호자에게 온 것은 어떤 의미인지 감동적인 마무리 편지를 써줘. 이 친구의 성격 유형이 가진 '사랑스러운 단점'마저도 소중한 이유를 언급해줘. 마지막에는 '당신은 {pet_name}에게 세상에서 가장 완벽한 보호자입니다'라는 메시지를 포함해 한 페이지를 채워줘.

{pet_name}의 MBTI 유형: {mbti_code}
성격 통계: {trait_stats}"""
            }
        ]
        
        # 5. 8개 페이지를 병렬로 생성 (최신 OpenAI API 사용)
        async def generate_page(page_info: Dict) -> Dict:
            """단일 페이지 생성"""
            try:
                response = await openai_client.responses.create(
                    model="gpt-5-mini",
                    input=[
                        {
                            "role": "system",
                            "content": system_prompt
                        },
                        {
                            "role": "user",
                            "content": page_info["prompt"]
                        }
                    ],
                    temperature=0.7,
                    max_output_tokens=1500
                )
                
                content = response.output_text
                
                if not content:
                    raise ValueError("응답 내용이 비어있습니다.")
                
                return {
                    "page": page_info["page"],
                    "content": content,
                    "status": "success"
                }
            except Exception as e:
                print(f"페이지 생성 실패 ({page_info['page']}): {str(e)}")
                return {
                    "page": page_info["page"],
                    "content": f"페이지 생성 중 오류: {str(e)}",
                    "status": "error"
                }
        
        # 세마포어로 동시성 제한 (레이트 리밋 방지)
        semaphore = asyncio.Semaphore(3)  # 최대 3개 동시 요청
        
        async def generate_page_limited(page_info: Dict) -> Dict:
            """세마포어로 제한된 페이지 생성"""
            async with semaphore:
                return await generate_page(page_info)
        
        # 병렬 실행 (8개 페이지, 최대 3개씩 동시 실행)
        print(f"\n{'='*60}")
        print(f"📝 리포트 생성 시작: {result_id}")
        print(f"📄 총 8페이지 생성 (목차 + 7개 내용 페이지)")
        print(f"⚡ 동시성 제한: 최대 3개씩 순차 처리")
        print(f"{'='*60}")
        
        page_results = await asyncio.gather(
            *[generate_page_limited(page) for page in page_prompts]
        )
        
        # 6. 결과를 하나의 객체로 묶기
        report_pages = {}
        for result in page_results:
            report_pages[result["page"]] = {
                "content": result["content"],
                "status": result["status"]
            }
        
        # 7. Firestore에 저장
        now = datetime.utcnow()
        doc_ref.update({
            "report_pages": report_pages,
            "report_status": "ready",
            "generated_at": now
        })
        
        print(f"✅ 리포트 생성 완료: {result_id}")
        print(f"{'='*60}\n")
        
        return {
            "status": "success",
            "result_id": result_id,
            "report_status": "ready",
            "pages": list(report_pages.keys())
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
