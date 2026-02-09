"""
MBTI 계산 및 결과 저장 관련 API 라우터
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import uuid
from models import CalculateRequest
from config import db

router = APIRouter(prefix="/api", tags=["calculate"])


@router.post("/calculate")
async def calculate_mbti(request: CalculateRequest):
    """MBTI 계산 및 결과 저장 API"""
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

