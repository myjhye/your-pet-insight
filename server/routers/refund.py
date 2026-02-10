"""
환불 처리 모듈
- auto_refund_if_needed(): 다른 라우터에서 호출하는 자동 환불 함수
- 관리자용 수동 환불 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import httpx
from datetime import datetime
from config import db

# Router 생성
router = APIRouter(prefix="/api", tags=["refund"])


# ============================================================
# 자동 환불 공통 함수 (다른 라우터에서 import하여 사용)
# ============================================================

async def auto_refund_if_needed(result_id: str, reason: str) -> dict:
    """
    결제는 성공했지만 리포트 전달에 실패한 경우 자동 환불을 시도합니다.
    
    Args:
        result_id: 테스트 결과 ID
        reason: 환불 사유 (로그용)
    
    Returns:
        {
            "refunded": bool,       # 환불 성공 여부
            "message": str,         # 결과 메시지
            "order_id": str | None  # 환불된 order_id
        }
    
    호출 예시:
        from routers.refund import auto_refund_if_needed
        result = await auto_refund_if_needed(result_id, "AI generation failed after 3 retries")
    """
    try:
        # 1. Firestore에서 결제 정보 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return {"refunded": False, "message": "Result not found", "order_id": None}
        
        result_data = doc.to_dict()
        
        # 2. 환불 가능한 상태인지 확인
        # 이미 환불됨
        if result_data.get("refund_status") == "refunded":
            return {"refunded": False, "message": "Already refunded", "order_id": None}
        
        # 결제가 안 된 상태 (환불 불필요)
        if not result_data.get("payment_verified"):
            return {"refunded": False, "message": "Payment not verified, no refund needed", "order_id": None}
        
        # 리포트가 이미 ready (환불 대상 아님)
        if result_data.get("report_status") == "ready" and result_data.get("report_pages"):
            return {"refunded": False, "message": "Report already delivered, no refund needed", "order_id": None}
        
        # 3. order_id 확인
        order_id = result_data.get("order_id")
        if not order_id:
            # order_id가 없으면 Polar API로 환불 불가 → 수동 처리 필요
            doc_ref.update({
                "refund_status": "manual_needed",
                "refund_reason": reason,
                "refund_requested_at": datetime.utcnow(),
            })
            print(f"⚠️ [AUTO_REFUND] {result_id}: order_id 없음. 수동 환불 필요. 사유: {reason}")
            return {"refunded": False, "message": "No order_id found. Manual refund needed.", "order_id": None}
        
        # 4. Polar API로 환불 요청
        polar_api_key = os.getenv("POLAR_ACCESS_TOKEN")
        if not polar_api_key:
            doc_ref.update({
                "refund_status": "manual_needed",
                "refund_reason": reason,
                "refund_requested_at": datetime.utcnow(),
            })
            print(f"⚠️ [AUTO_REFUND] {result_id}: Polar API key 없음. 수동 환불 필요.")
            return {"refunded": False, "message": "Polar API key not configured", "order_id": order_id}
        
        polar_api_url = "https://api.polar.sh/v1"
        headers = {
            "Authorization": f"Bearer {polar_api_key}",
            "Content-Type": "application/json"
        }
        
        # ★ Polar 환불 API 엔드포인트 확인 필요
        # 가이드에서는 /orders/{order_id}/refund를 사용하지만,
        # 실제 Polar API 문서를 확인하여 정확한 엔드포인트와 요청 형식으로 수정 필요
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{polar_api_url}/orders/{order_id}/refund",
                headers=headers,
                json={
                    "reason": "service_not_delivered",
                    "comment": f"Auto-refund: {reason}"
                }
            )
        
        if response.status_code in [200, 201, 204]:
            # 환불 성공 → Firestore 업데이트
            doc_ref.update({
                "refund_status": "refunded",
                "refund_reason": reason,
                "refund_at": datetime.utcnow(),
                "payment_verified": False,  # 결제 상태 되돌리기
                "payment_status": "refunded",
            })
            print(f"✅ [AUTO_REFUND] {result_id}: 환불 성공. 사유: {reason}")
            return {"refunded": True, "message": f"Refund successful: {reason}", "order_id": order_id}
        else:
            # Polar API 환불 실패 → 수동 처리 필요
            error_text = response.text
            doc_ref.update({
                "refund_status": "manual_needed",
                "refund_reason": reason,
                "refund_error": f"Polar API {response.status_code}: {error_text[:200]}",
                "refund_requested_at": datetime.utcnow(),
            })
            print(f"⚠️ [AUTO_REFUND] {result_id}: Polar 환불 API 실패 ({response.status_code}). 수동 처리 필요.")
            return {"refunded": False, "message": f"Polar refund API failed: {response.status_code}", "order_id": order_id}
    
    except Exception as e:
        # 환불 시도 자체가 실패해도 원래 플로우는 중단하지 않음
        print(f"❌ [AUTO_REFUND] {result_id}: 예외 발생 - {str(e)}")
        try:
            doc_ref.update({
                "refund_status": "error",
                "refund_reason": reason,
                "refund_error": str(e)[:200],
                "refund_requested_at": datetime.utcnow(),
            })
        except:
            pass
        return {"refunded": False, "message": f"Refund exception: {str(e)}", "order_id": None}


# ============================================================
# 기존 관리자용 수동 환불 API 엔드포인트 (아래에 유지)
# ============================================================


class RefundRequest(BaseModel):
    """환불 요청 모델"""
    order_id: str
    amount: Optional[int] = None  # 환불 금액 (cents 단위, None이면 전체 환불)
    reason: Optional[str] = None  # 환불 사유


@router.post("/refund")
async def create_refund(refund_request: RefundRequest):
    """
    수동 환불 생성
    
    Args:
        refund_request: 환불 요청 정보
            - order_id: 환불할 주문 ID (필수)
            - amount: 환불 금액 (cents 단위, 선택사항 - 없으면 전체 환불)
            - reason: 환불 사유 (선택사항)
            
    Returns:
        {
            "status": "success",
            "refund_id": "...",
            "order_id": "...",
            "amount": 1000,
            "status": "pending"
        }
    """
    try:
        # Polar API 설정
        polar_api_key = os.getenv("POLAR_ACCESS_TOKEN")
        if not polar_api_key:
            raise HTTPException(status_code=500, detail="Polar API key not configured")
        
        # 프로덕션 환경 설정
        polar_api_url = "https://api.polar.sh/v1"
        
        headers = {
            "Authorization": f"Bearer {polar_api_key}",
            "Content-Type": "application/json"
        }
        
        # 환불 요청 페이로드 구성
        payload = {
            "order_id": refund_request.order_id
        }
        
        # 부분 환불인 경우 amount 추가
        if refund_request.amount:
            payload["amount"] = refund_request.amount
        
        # 환불 사유가 있는 경우 추가
        if refund_request.reason:
            payload["reason"] = refund_request.reason
        
        # 환불 생성 요청
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{polar_api_url}/refunds/",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            refund_data = response.json()
        
        return {
            "status": "success",
            "refund_id": refund_data.get("id"),
            "order_id": refund_request.order_id,
            "amount": refund_data.get("amount"),
            "status": refund_data.get("status", "pending"),
            "reason": refund_data.get("reason")
        }
        
    except httpx.HTTPStatusError as e:
        print(f"⚠️ Polar API Error: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Order not found: {refund_request.order_id}"
            )
        elif e.response.status_code == 400:
            error_detail = e.response.text
            raise HTTPException(
                status_code=400,
                detail=f"Invalid refund request: {error_detail}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"Polar API error: {e.response.status_code}"
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Refund creation failed: {str(e)}")

