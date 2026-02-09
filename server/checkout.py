from fastapi import APIRouter, HTTPException
import os
import httpx

# Router 생성
router = APIRouter(prefix="/api/polar", tags=["checkout"])


@router.post("/create-checkout")
async def create_polar_checkout(result_id: str, lang: str = "en"):
    """
    Polar Checkout Session을 생성하고 결제 URL을 반환합니다.
    """
    try:
        # Polar API 설정
        polar_api_key = os.getenv("POLAR_ACCESS_TOKEN")
        if not polar_api_key:
            raise HTTPException(status_code=500, detail="Polar API key not configured")
        
        # Product ID (환경 변수 또는 기본값)
        product_id = os.getenv("POLAR_PRODUCT_ID", "33971cec-204c-464b-8085-3823695fab01")
        
        # Polar API 엔드포인트 (Sandbox 또는 Production)
        polar_api_url = os.getenv("POLAR_API_URL", "https://api.polar.sh/v1")
        if os.getenv("POLAR_ENV") == "sandbox":
            polar_api_url = "https://sandbox-api.polar.sh/v1"
        
        # Success URL과 Cancel URL 설정
        base_url = os.getenv("FRONTEND_URL", "https://www.yourpetinsight.com")
        success_url = f"{base_url}/{lang}/dog-test/personality/result/{result_id}?payment=success"
        cancel_url = f"{base_url}/{lang}/dog-test/personality/result/{result_id}?payment=cancelled"
        
        # Checkout Session 생성 요청
        payload = {
            "product_id": product_id,
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {
                "result_id": result_id,
                "lang": lang
            }
        }
        
        headers = {
            "Authorization": f"Bearer {polar_api_key}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{polar_api_url}/checkouts/",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            result = response.json()
        
        # Checkout URL 반환
        checkout_url = result.get("url") or result.get("checkout_url")
        if not checkout_url:
            raise HTTPException(status_code=500, detail="Failed to get checkout URL from Polar")
        
        return {
            "status": "success",
            "checkout_url": checkout_url,
            "client_secret": result.get("client_secret")
        }
        
    except httpx.HTTPStatusError as e:
        print(f"⚠️ Polar API Error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=500,
            detail=f"Polar API error: {e.response.status_code}"
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Checkout creation failed: {str(e)}")

