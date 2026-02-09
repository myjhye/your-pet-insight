"""
수동 환불 API
order_id로 환불을 생성합니다.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import httpx

# Router 생성
router = APIRouter(prefix="/api", tags=["refund"])


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

