from fastapi import APIRouter, HTTPException
import os
import httpx
from config import db

router = APIRouter(prefix="/api/polar", tags=["checkout"])


@router.post("/create-checkout")
async def create_polar_checkout(result_id: str, lang: str = "en"):
    """
    Polar Checkout Session을 생성합니다.
    ★ Self-Healing: 기존 세션이 있다면 상태를 확인하여 '결제 후 리다이렉트 실패' 케이스를 자동 복구합니다.
    """
    try:
        # 1. Firestore 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Result not found")

        result_data = doc.to_dict()

        # 2. Polar 설정
        polar_api_key = os.getenv("POLAR_ACCESS_TOKEN")
        if not polar_api_key:
            raise HTTPException(status_code=500, detail="Polar API key not configured")

        polar_api_url = "https://api.polar.sh/v1"
        headers = {
            "Authorization": f"Bearer {polar_api_key}",
            "Content-Type": "application/json"
        }

        # === [Self-Healing 로직] ===
        # DB에서는 결제 안 됨(False)이지만, checkout_id가 있다면 Polar에 확인해본다.
        # → "결제 완료 후 브라우저 닫힘" 시나리오를 자동 복구
        stored_checkout_id = result_data.get("checkout_id")
        is_verified = result_data.get("payment_verified", False)

        if not is_verified and stored_checkout_id:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    check_resp = await client.get(
                        f"{polar_api_url}/checkouts/{stored_checkout_id}",
                        headers=headers
                    )
                    if check_resp.status_code == 200:
                        check_data = check_resp.json()
                        if check_data.get("status") == "succeeded":
                            # 결제는 성공했는데 DB 업데이트가 안 된 상황 → 자동 복구
                            order_id = None
                            if "order" in check_data and check_data["order"]:
                                order_id = (
                                    check_data["order"].get("id")
                                    if isinstance(check_data["order"], dict)
                                    else check_data["order"]
                                )

                            doc_ref.update({
                                "payment_verified": True,
                                "payment_status": "paid",
                                **({"order_id": order_id} if order_id else {})
                            })

                            is_verified = True
            except Exception as e:
                # Self-Healing 실패 시 무시하고 정상 플로우 진행
                print(f"⚠️ 기존 세션 확인 중 오류 (무시하고 진행): {e}")

        # 3. 최종 상태 확인 - 이미 결제 완료면 재결제 방지
        if is_verified:
            if result_data.get("report_status") == "ready":
                return {
                    "status": "already_paid",
                    "message": "Payment already completed. Report is ready.",
                    "checkout_url": None
                }
            return {
                "status": "already_paid",
                "message": "Payment already completed. Please generate report.",
                "checkout_url": None
            }

        # 4. 새 Checkout Session 생성
        product_id = os.getenv("POLAR_PRODUCT_ID", "33971cec-204c-464b-8085-3823695fab01")
        base_url = os.getenv("FRONTEND_URL", "https://www.yourpetinsight.com")
        success_url = f"{base_url}/{lang}/dog-test/personality/result/{result_id}?payment=success"
        cancel_url = f"{base_url}/{lang}/dog-test/personality/result/{result_id}?payment=cancelled"

        payload = {
            "product_id": product_id,
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {
                "result_id": result_id,
                "lang": lang
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{polar_api_url}/checkouts/",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            result = response.json()

        checkout_url = result.get("url") or result.get("checkout_url")
        checkout_id = result.get("id")

        if not checkout_url:
            raise HTTPException(status_code=500, detail="Failed to get checkout URL from Polar")

        # 5. Firestore에 checkout 정보 저장
        doc_ref.update({
            "checkout_id": checkout_id,
            "payment_status": "pending",
        })

        return {
            "status": "success",
            "checkout_url": checkout_url,
            "checkout_id": checkout_id,
        }

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        print(f"⚠️ Polar API Error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=500, detail=f"Polar API error: {e.response.status_code}")
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Checkout creation failed: {str(e)}")

