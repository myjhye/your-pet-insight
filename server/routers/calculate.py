"""
MBTI 계산 및 결과 저장 관련 API 라우터
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
import uuid
from models import CalculateRequest
from config import db

router = APIRouter(prefix="/api", tags=["calculate"])

# 질문 메타데이터 (하드코딩)
DOG_QUESTIONS_META = [
    # Stage 1 (id 1-20)
    {"id": 1, "axis": "E", "is_reverse": False},
    {"id": 2, "axis": "E", "is_reverse": True},
    {"id": 3, "axis": "E", "is_reverse": False},
    {"id": 4, "axis": "E", "is_reverse": False},
    {"id": 5, "axis": "E", "is_reverse": False},
    {"id": 6, "axis": "S", "is_reverse": False},
    {"id": 7, "axis": "S", "is_reverse": True},
    {"id": 8, "axis": "S", "is_reverse": False},
    {"id": 9, "axis": "S", "is_reverse": False},
    {"id": 10, "axis": "S", "is_reverse": False},
    {"id": 11, "axis": "F", "is_reverse": False},
    {"id": 12, "axis": "F", "is_reverse": True},
    {"id": 13, "axis": "F", "is_reverse": True},
    {"id": 14, "axis": "F", "is_reverse": False},
    {"id": 15, "axis": "F", "is_reverse": True},
    {"id": 16, "axis": "J", "is_reverse": False},
    {"id": 17, "axis": "J", "is_reverse": True},
    {"id": 18, "axis": "J", "is_reverse": False},
    {"id": 19, "axis": "J", "is_reverse": True},
    {"id": 20, "axis": "J", "is_reverse": False},
    # Stage 2 - Owner Questions (id 21-25)
    {"id": 21, "axis": "Style", "is_reverse": False},
    {"id": 22, "axis": "Bond", "is_reverse": False},
    {"id": 23, "axis": "Logic", "is_reverse": False},
    {"id": 24, "axis": "Routine", "is_reverse": False},
    {"id": 25, "axis": "Goal", "is_reverse": False},
]


@router.post("/calculate")
async def calculate_mbti(request: CalculateRequest):
    """MBTI 계산 및 결과 저장 API"""
    try:
        # ---------------------------------------------------------
        # 1. 질문 메타데이터 조회 (axis, is_reverse 정보)
        # ---------------------------------------------------------
        # 하드코딩된 질문 메타데이터 사용
        all_questions = DOG_QUESTIONS_META
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
        # 4. 백분율 Stats 계산 (동적 계산 방식으로 변경)
        # ---------------------------------------------------------
        def get_stat(axis_name: str) -> int:
            """질문 개수에 상관없이 0~100%로 변환"""
            score = axis_scores.get(axis_name, 0)
            count = axis_question_counts.get(axis_name, 0)
            
            if count == 0:
                return 0
            
            # 최소점수: 모든 질문 1점 (count * 1)
            # 최대점수: 모든 질문 5점 (count * 5)
            min_score = count * 1
            max_score = count * 5
            
            if max_score == min_score:
                return 0
            
            percentage = ((score - min_score) / (max_score - min_score)) * 100
            return round(max(0, min(100, percentage)))  # 0~100 사이로 보정
        
        stats = {
            "sociability": get_stat("E"),      # E축
            "sagacity": get_stat("S"),         # S축
            "emotionality": get_stat("F"),     # F축
            "obedience": get_stat("J"),        # J축
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
        # timezone-aware datetime 사용 (Python 3.12+ 권장)
        now = datetime.now(timezone.utc)
        expire_at = now + timedelta(days=30)  # 30일 뒤 날짜 계산
        
        # 참고: Firestore TTL(Time To Live) 자동 삭제를 사용하려면
        # Google Cloud Console에서 test_results 컬렉션의 expire_at 필드에 대해
        # TTL 정책을 수동으로 활성화해야 합니다.
        
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

