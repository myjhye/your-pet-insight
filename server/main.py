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
import random
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
            
            # {{pet_name}} 플레이스홀더 치환 함수 (첫 글자 대문자 변환)
            def capitalize_first_letter(s: str) -> str:
                """문자열의 첫 글자를 대문자로 변환"""
                if not s:
                    return s
                return s[0].upper() + s[1:] if len(s) > 1 else s.upper()
            
            def replace_placeholders(obj, pet_name: str, locale: str):
                # 펫 이름 첫 글자 대문자 변환
                display_pet_name = capitalize_first_letter(pet_name)
                
                if isinstance(obj, str):
                    return obj.replace("{{pet_name}}", display_pet_name)
                elif isinstance(obj, dict):
                    # 다국어 처리: locale 키가 있으면 해당 언어만 추출
                    if locale in obj and isinstance(obj[locale], str):
                        return obj[locale].replace("{{pet_name}}", display_pet_name)
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
        # 언어 검증: en 또는 jp만 허용
        if lang not in ["en", "jp"]:
            raise HTTPException(status_code=400, detail="Language must be 'en' or 'jp' only.")
        
        # 1. Firestore에서 결과 데이터 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Result not found.")
        
        result_data = doc.to_dict()
        pet_name = result_data.get("pet_name", "")
        mbti_code = result_data.get("mbti_code", "")
        stats = result_data.get("stats", {})
        answers = result_data.get("answers", [])
        
        # 보너스 답변 추출 (21-25번 질문) - 보호자 성향 데이터
        owner_answers = [a for a in answers if a.get("question_id", 0) > 20]
        
        # 보호자 성향 데이터 포맷팅 (언어별)
        owner_traits = {}
        if owner_answers:
            owner_summary = []
            for ans in owner_answers:
                likert = ans.get("likert_value", 0)
                if lang == "jp":
                    if likert > 0:
                        owner_summary.append("活発で積極的な傾向")
                    elif likert < 0:
                        owner_summary.append("落ち着いて慎重な傾向")
                    else:
                        owner_summary.append("バランスの取れた傾向")
                else:  # en
                    if likert > 0:
                        owner_summary.append("Active and proactive")
                    elif likert < 0:
                        owner_summary.append("Calm and cautious")
                    else:
                        owner_summary.append("Balanced")
            owner_traits = {
                "summary": ", ".join(set(owner_summary[:3])),
                "answers": owner_answers
            }
        
        # Stats 데이터를 문자열로 포맷팅
        trait_stats = ", ".join([f"{key}: {value}%" for key, value in stats.items()])
        
        # 1. 모든 페이지가 참고할 '개인화 컨텍스트' 생성
        owner_summary_text = owner_traits.get('summary', 'Balanced' if lang == 'en' else 'バランス型')
        personal_context = f"""
- Pet Name: {pet_name}
- Dog's Personality: {mbti_code} ({trait_stats})
- Owner's Personality: {owner_summary_text}
"""
        
        # 2. 리포트 상태를 'generating'으로 업데이트
        doc_ref.update({
            "report_status": "generating",
            "report_pages": {}
        })
        
        # 3. 공통 시스템 프롬프트 고도화 (블로그/잡지 스타일 + 개인화 강조)
        if lang == "jp":
            system_prompt = f"""あなたは世界的なペット心理学者です。以下の情報を基に、一冊の高級雑誌のようなリポートを書いてください。

{personal_context}

【重要：個人化の指針】
飼い主の傾向（{owner_summary_text}）に合わせて、アドバイスの内容や語調を調整してください。飼い主の性格を深く理解した上で、{pet_name}との関係性を分析してください。

【重要：構造化の指針】
- ページごとに必ず # 大見出し と ## 中見出し を使ってください
- 中見出しは「性格数値分析」のような硬い表現ではなく、「なぜ{pet_name}は玄関の音に特に敏感なのでしょうか？」のように読者の興味を引く質問や魅力的なフレーズを使用してください
- 箇条書き(- )と引用文(> )を積極的に使い、視覚的なリズムを作ってください
- 単なるデータの羅列ではなく、日常のシーンを映画のように描写してください（例：「朝7時に{pet_name}があなたを見つめるその目つき」）

【スタイル】
数値を列挙するのではなく、「飼い主が帰宅した時に{pet_name}が見せる具体的な行動」や「散歩中に知らない犬に会った時の目つき」のように日常的な描写をたっぷりと含めて書いてください。
専門的でありながら感動的な語調を保ち、必ず日本語で「です/ます」調を使用して丁寧に書いてください。
人気のあるペット雑誌のトーンを参考にしてください。

マークダウン形式で記述してください。"""
        else:  # en
            system_prompt = f"""You are a world-class pet psychologist and a gifted storyteller. 
Write a premium magazine-style report based on: {personal_context}

【PERSONALIZATION GUIDELINE】
Tailor all advice and the tone to match the owner's trait: {owner_summary_text}. Deeply understand the owner's personality and analyze their relationship with {pet_name} accordingly.

【STRUCTURAL GUIDELINE】
- Use # H1 for the page title and ## H2 for sub-points
- Subheadings should not be dry expressions like "Personality Score Analysis" but rather engaging questions or captivating phrases that spark the reader's curiosity, such as "Why is {pet_name} particularly sensitive to the sound of the front door?"
- Use bullet points(-) and blockquotes(>) to create a dynamic visual flow
- Describe daily life scenes vividly (e.g., "The way {pet_name} looks at you at 7 AM")
- NO dry data listing. Focus on storytelling and emotional connection

【STYLE】
Instead of listing numbers, write with plenty of everyday descriptions like 'the specific behavior {pet_name} shows when the owner comes home from work' or 'the look in their eyes when meeting a strange dog during a walk'.
Maintain a professional yet touching tone, and write everything in English with the sophisticated tone of a popular pet magazine editor.

Write in Markdown format."""
        
        # 4. 8개 페이지별 프롬프트 정의 (언어별 분기)
        if lang == "jp":
            page_prompts = [
                {
                    "page": "table_of_contents",
                    "prompt": f"""以下は{pet_name}のプレミアム性格分析レポートの目次です。

レポートは全8ページで構成され、以下の内容を含みます：
1. 目次（現在のページ）
2. 性格指標の深層解説
3. 認知的強みと本能的才能
4. 飼い主との特別な相性分析
5. カスタマイズされたポジティブ強化トレーニングロードマップ
6. 社会性および環境適応ガイド
7. 完璧な一日のためのライフスタイル
8. 飼い主への特別なメッセージ

【重要】この目次はレポート全体の雰囲気を決定する重要な第一印象です。GPT-5 miniが「簡単な作業」として軽視하지 않도록、非常に優雅で詳細に、そして魅力的に書いてください。上記の目次をマークダウン形式で美しくフォーマットして作成してください。各ページの簡単な説明（1-2行）も含めてください。"""
                },
                {
                    "page": "deep_dive_traits",
                    "prompt": f"""# {pet_name}の心の中に描かれた地図

{pet_name}の性格特性が日常の習慣にどう現れるか分析してください。飼い主の性格（{owner_summary_text}）を考慮して、なぜこの二人が素晴らしいチームなのか説明してください。

数値（{trait_stats}）を直接言及するのではなく、以下のような日常シーンを映画のように描写してください：
- 散歩中に知らない人に会った時の{pet_name}の反応としっぽの動き
- ご飯を食べる時の表情と最も幸せそうに見える瞬間
- おもちゃを与える時、目が輝く瞬間
- 飼い主（{owner_summary_text}）の性格と{pet_name}の性格がどう共鳴しているか

飼い主の性格を深く理解した上で、{pet_name}との関係性を分析してください。"""
                },
                {
                    "page": "cognitive_strengths",
                    "prompt": f"""# {pet_name}が世界を理解する方法

{pet_name}の性格タイプ（{mbti_code}）を基に、この子が世界をどう理解し、問題をどう解決するか分析してください。飼い主（{owner_summary_text}）の認知スタイルと{pet_name}の認知スタイルがどう補完し合っているか説明してください。

以下のような日常シーンをストーリーテリング方式で描写してください：
- 新しいおもちゃを前にした時、{pet_name}の脳内で何が起きているのか？
- 知らない道を歩く時、{pet_name}が辿る認知的プロセス
- このタイプだけが持つ「天才的な瞬間」を日常のエピソードで説明
- 飼い主の思考パターンと{pet_name}の認知パターンがどう共鳴しているか

飼い主が実際に目撃できる場面を生き生きと描いてください。"""
                },
                {
                    "page": "owner_chemistry",
                    "prompt": f"""# あなたと{pet_name}、異なるリズムが一つの旋律になる過程

最も重要な分析です。飼い主の性格（{owner_summary_text}）と{pet_name}の性格（{mbti_code}）を深く対照し、なぜこの二人が完璧なチームなのか説明してください。

ストーリーテリング方式で以下の点を描写してください：
1) 二人のエネルギーが最も合う瞬間 - 例えば「あなたが疲れて帰ってきた時、{pet_name}はどう反応しますか？」飼い主の性格（{owner_summary_text}）を考慮して説明してください
2) お互いの傾向の違いによって発生する可能性のある潜在的な誤解と、それをどう乗り越えるか
3) 飼い主の性格に合わせた{pet_name}の心を得るための「心理的アプローチ」 - 具体的な日常行動で説明してください

飼い主の性格を深く理解した上で、非常に個人的で実用的なアドバイスを含めてください。"""
                },
                {
                    "page": "training_roadmap",
                    "prompt": f"""# {pet_name}にぴったりのトレーニングロードマップ

{pet_name}の性格（{mbti_code}）と飼い主の性格（{owner_summary_text}）を考慮した最適な教育戦略を立ててください。飼い主の性格に合わせたトレーニングアプローチを提案してください。

ストーリーテリング方式で以下の点を描写してください：
- 「おすわり」のトレーニングをする時、{pet_name}が最もよく従う瞬間とは？飼い主の性格（{owner_summary_text}）を考慮して説明してください
- 強圧的なトレーニングではなく、この子の動機を刺激できる具体的な方法（おやつ、褒め言葉、遊びなど）を日常の場面で描写
- この性格タイプが簡単に退屈したりストレスを受けたりする可能性のある点と、飼い主の性格に合わせた克服法
- 飼い主の性格に最適化された段階的なトレーニングガイドを「最初の週には...」「2週目には...」のように具体的に作成

飼い主がすぐに実践できるように明確で温かく、個人的なアドバイスを含めてください。"""
                },
                {
                    "page": "social_adaptation",
                    "prompt": f"""# {pet_name}の社会性と環境適応ガイド

{pet_name}の社会性と感情性を基に、社会生活ガイドを作成してください。飼い主の性格（{owner_summary_text}）を考慮して、飼い主が{pet_name}をサポートする最適な方法を提案してください。

具体的な日常状況をストーリーテリング方式で描写してください：
1) ドッグカフェや公園で他の犬に会った時、{pet_name}の反応としっぽの動き。飼い主の性格（{owner_summary_text}）に合わせたサポート方法
2) 引っ越しや来客時、{pet_name}の適応過程を段階的に生き生きと描写。飼い主の性格を考慮した環境調整方法
3) 分離不安を予防するために飼い主が提供すべき情緒的安全装置を、飼い主の性格に合わせた実際の行動で説明

飼い主の性格を深く理解した上で、実用的で個人的なアドバイスを含めてください。"""
                },
                {
                    "page": "lifestyle_guide",
                    "prompt": f"""# {pet_name}のための完璧な一日

{pet_name}のエネルギーレベルと傾向、そして飼い主の性格（{owner_summary_text}）にぴったりの「完璧な一日のスケジュール」を設計してください。飼い主のライフスタイルと{pet_name}のニーズを調和させてください。

ストーリーテリング方式で一日を描いてください：
- 朝：{pet_name}が目覚める様子と、飼い主の性格（{owner_summary_text}）に合わせた最適な散歩のタイミング
- 散歩コースのスタイル（匂い中心 vs 活動量中心）を具体的なルートで説明。飼い主の性格を考慮した散歩スタイル
- 昼：このタイプの知能を刺激できるノーズワークやおもちゃを実際の使用場面で描写。飼い主の性格に合わせた遊び方
- 夜：休息時間に最も快適さを感じられる環境作りを、飼い主のライフスタイルに合わせて具体的に提案

飼い主の性格とライフスタイルを深く理解した上で、実用的で個人的なアドバイスを含めてください。"""
                },
                {
                    "page": "heartfelt_message",
                    "prompt": f"""# 世界のすべての犬が羨む、あなたという贈り物

これまでのすべての分析を総合して、{pet_name}が飼い主（{owner_summary_text}）の元に来たことはどんな意味があるか、感動的な締めくくりの手紙を書いてください。

飼い主の性格（{owner_summary_text}）を深く理解した上で、以下の点を含めてください：
- {pet_name}があなたの元に来た意味。飼い主の性格と{pet_name}の性格がどう共鳴しているか
- この子の性格タイプが持つ「愛らしい欠点」さえも大切な理由。飼い主の性格がそれをどう補完しているか
- 「あなたは{pet_name}にとって世界で最も完璧な飼い主です」というメッセージを含めて、飼い主の性格を考慮した個人的なメッセージ

飼い主の性格を深く理解した上で、非常に個人的で感動的な内容を含めてください。"""
                }
            ]
        else:  # en
            page_prompts = [
                {
                    "page": "table_of_contents",
                    "prompt": f"""The following is the table of contents for {pet_name}'s Premium Personality Analysis Report.

The report consists of 8 pages total, including the following content:
1. Table of Contents (current page)
2. Deep Dive into Personality Indicators
3. Cognitive Strengths and Instinctive Genius
4. Special Chemistry Analysis with Owner
5. Customized Positive Reinforcement Training Roadmap
6. Social Adaptation and Environment Guide
7. Lifestyle for a Perfect Day
8. Special Message to the Owner

【IMPORTANT】This table of contents is a crucial first impression that sets the tone for the entire report. Do not treat this as a simple task - write it with exceptional elegance, detail, and charm. Please format the above table of contents beautifully in Markdown format. Include a brief description (1-2 lines) for each page."""
                },
                {
                    "page": "deep_dive_traits",
                    "prompt": f"""# The Map Drawn in {pet_name}'s Heart

Analyze how {pet_name}'s personality traits manifest in daily habits. Use the context of the owner's personality ({owner_summary_text}) to explain why they make such a great team.

Instead of directly mentioning numbers ({trait_stats}), describe everyday scenes like a movie:
- When meeting a stranger during a walk, how does {pet_name} react and how does their tail move?
- Their expression and behavior when eating, and the moments they look happiest
- The moment their eyes sparkle when given a toy
- How the owner's personality ({owner_summary_text}) and {pet_name}'s personality resonate with each other

Deeply understand the owner's personality and analyze their relationship with {pet_name} accordingly."""
                },
                {
                    "page": "cognitive_strengths",
                    "prompt": f"""# How {pet_name} Understands the World

Based on {pet_name}'s personality type ({mbti_code}), analyze how this friend understands the world and solves problems. Explain how the owner's cognitive style ({owner_summary_text}) and {pet_name}'s cognitive style complement each other.

Describe the following everyday scenes in a storytelling style:
- What happens in {pet_name}'s mind when facing a new toy?
- The cognitive process {pet_name} follows when walking an unfamiliar path
- The genius moments unique to this type, through everyday episodes
- How the owner's thinking patterns and {pet_name}'s cognitive patterns resonate with each other

Vividly depict scenes the owner can actually witness."""
                },
                {
                    "page": "owner_chemistry",
                    "prompt": f"""# When Different Rhythms Meet to Create One Melody

This is the most important analysis. Deeply compare the owner's personality ({owner_summary_text}) with {pet_name}'s personality ({mbti_code}) and explain why they make a perfect team.

Write in a storytelling style covering:
1) Where the two energies match best - for example, "How does {pet_name} react when you come home tired?" Consider the owner's personality ({owner_summary_text}) in your explanation
2) Potential misunderstandings that can arise from differences in tendencies and how to overcome them
3) 'Psychological approaches' tailored to the owner's personality to win {pet_name}'s heart - explain through specific daily behaviors

Deeply understand the owner's personality and include highly personalized and practical advice."""
                },
                {
                    "page": "training_roadmap",
                    "prompt": f"""# The Perfect Training Roadmap for {pet_name}

Create an optimal training strategy considering {pet_name}'s personality ({mbti_code}) and the owner's personality ({owner_summary_text}). Propose a training approach tailored to the owner's personality.

Write in a storytelling style covering:
- When doing "sit" training, when does {pet_name} follow best? Consider the owner's personality ({owner_summary_text}) in your explanation
- Instead of forceful training, describe specific methods (treats, praise, play) that can motivate this friend, through everyday scenes
- Points where this personality type can easily get bored or stressed, and how to overcome them tailored to the owner's personality
- A step-by-step training guide optimized for the owner's personality, specifically like "In the first week...", "In the second week..."

Write clearly and warmly with personalized advice so the owner can practice immediately."""
                },
                {
                    "page": "social_adaptation",
                    "prompt": f"""# {pet_name}'s Social Adaptation Guide

Create a social life guide based on {pet_name}'s sociability and emotionality. Consider the owner's personality ({owner_summary_text}) and propose optimal ways for the owner to support {pet_name}.

Describe specific everyday situations in a storytelling style:
1) When meeting other dogs at a dog cafe or park, how does {pet_name} react and how does their tail move? Support methods tailored to the owner's personality ({owner_summary_text})
2) Vividly describe {pet_name}'s adaptation process step by step when moving or receiving visitors, with environment adjustments considering the owner's personality
3) Explain the emotional safety measures the owner should provide to prevent separation anxiety, through actual behaviors tailored to the owner's personality

Deeply understand the owner's personality and include practical and personalized advice."""
                },
                {
                    "page": "lifestyle_guide",
                    "prompt": f"""# A Perfect Day for {pet_name}

Design a 'perfect daily routine' perfectly suited to {pet_name}'s energy level and tendencies, and harmonized with the owner's lifestyle ({owner_summary_text}).

Draw a day in a storytelling style:
- Morning: How {pet_name} wakes up and the optimal walk timing tailored to the owner's personality ({owner_summary_text})
- Walk route style (scent-focused vs activity-focused) through specific paths, considering the owner's personality
- Afternoon: Nose work and toys that stimulate this type's intelligence, through actual usage scenes, with play styles tailored to the owner's personality
- Evening: How to create the most comfortable rest environment, specifically tailored to the owner's lifestyle

Deeply understand the owner's personality and lifestyle and include practical and personalized advice."""
                },
                {
                    "page": "heartfelt_message",
                    "prompt": f"""# The Gift That Every Dog in the World Would Envy

Synthesizing all the analysis so far, write a touching closing letter about what it means that {pet_name} came to the owner ({owner_summary_text}).

Deeply understand the owner's personality ({owner_summary_text}) and include:
- What it means that {pet_name} came to you. How the owner's personality and {pet_name}'s personality resonate with each other
- Why even the 'adorable flaws' of this personality type are precious, and how the owner's personality complements them
- Include the message 'You are the most perfect owner in the world for {pet_name}' with a personalized message considering the owner's personality

Deeply understand the owner's personality and include highly personal and touching content."""
                }
            ]
        
        # 5. 8개 페이지를 병렬로 생성 (최신 OpenAI API 사용)
        async def generate_page(page_info: Dict) -> Dict:
            """페이지 생성 (최대 3회 재시도 로직 포함)"""
            max_retries = 3
            retry_delay = 1.5  # 초기 대기 시간 (초)

            for attempt in range(max_retries):
                try:
                    print(f"🔄 [{page_info['page']}] 생성 시도 {attempt + 1}/{max_retries}...")
                    
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
                        max_output_tokens=1500
                    )
                    
                    content = response.output_text
                    
                    # 응답이 비어있는지 빡세게 검사
                    if not content or len(content.strip()) < 10:
                        raise ValueError("AI 응답 내용이 너무 짧거나 비어있습니다.")

                    return {
                        "page": page_info["page"],
                        "content": content,
                        "status": "success"
                    }

                except Exception as e:
                    print(f"⚠️ [{page_info['page']}] 시도 {attempt + 1} 실패: {str(e)}")
                    
                    if attempt < max_retries - 1:
                        # 지수 백오프 + 지터(Jitter) 적용: 1.5초, 3초, 6초 순으로 대기
                        wait_time = (retry_delay * (2 ** attempt)) + (random.random() * 0.5)
                        print(f"⏳ {wait_time:.1f}초 후 다시 시도합니다...")
                        await asyncio.sleep(wait_time)
                    else:
                        # 최종 실패 시 에러 반환
                        return {
                            "page": page_info["page"],
                            "content": f"페이지 생성 실패 (3회 시도): {str(e)}",
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
