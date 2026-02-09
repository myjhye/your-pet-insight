"""
결제 완료 검증 API
checkout_id로 checkout session을 조회하고 orderId를 확인합니다.
"""
from fastapi import APIRouter, HTTPException
import os
import httpx

# Router 생성
router = APIRouter(prefix="/api", tags=["verify"])


@router.get("/verify")
async def verify_payment(checkout_id: str):
    """
    결제 완료 검증 - checkout_id로 checkout session을 조회하고 orderId를 반환합니다.
    
    Args:
        checkout_id: Polar checkout session ID
        
    Returns:
        {
            "status": "success",
            "checkout_id": "...",
            "order_id": "...",
            "checkout_status": "succeeded",
            "order_status": "paid"
        }
    """
    try:
        # Polar API 설정
        polar_api_key = os.getenv("POLAR_ACCESS_TOKEN")
        if not polar_api_key:
            raise HTTPException(status_code=500, detail="Polar API key not configured")
        
        # 샌드박스 환경 설정 (하드코딩)
        polar_api_url = "https://sandbox-api.polar.sh/v1"
        
        headers = {
            "Authorization": f"Bearer {polar_api_key}",
            "Content-Type": "application/json"
        }
        
        # Checkout Session 조회 및 Order 정보 조회
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Checkout Session 조회
            response = await client.get(
                f"{polar_api_url}/checkouts/{checkout_id}",
                headers=headers
            )
            response.raise_for_status()
            checkout_data = response.json()
            
            # Checkout 상태 확인
            checkout_status = checkout_data.get("status", "unknown")
            
            # Order ID 추출
            order_id = None
            order_status = None
            
            # Checkout에서 order 정보 추출
            if "order" in checkout_data and checkout_data["order"]:
                order_id = checkout_data["order"].get("id") if isinstance(checkout_data["order"], dict) else checkout_data["order"]
            
            # Order 상세 정보 조회 (order_id가 있는 경우)
            if order_id:
                try:
                    order_response = await client.get(
                        f"{polar_api_url}/orders/{order_id}",
                        headers=headers
                    )
                    order_response.raise_for_status()
                    order_data = order_response.json()
                    order_status = order_data.get("status", "unknown")
                except Exception as e:
                    print(f"⚠️ Failed to fetch order details: {str(e)}")
        
        return {
            "status": "success",
            "checkout_id": checkout_id,
            "order_id": order_id,
            "checkout_status": checkout_status,
            "order_status": order_status,
            "is_paid": checkout_status == "succeeded" and (order_status == "paid" if order_status else False)
        }
        
    except httpx.HTTPStatusError as e:
        print(f"⚠️ Polar API Error: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Checkout session not found: {checkout_id}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"Polar API error: {e.response.status_code}"
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

