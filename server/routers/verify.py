"""
결제 완료 검증 API
result_id로 Firestore에서 checkout_id를 찾고, Polar API로 결제 상태를 검증합니다.
검증 성공 시 Firestore에 payment_verified: true를 저장합니다.
"""
from fastapi import APIRouter, HTTPException
import os
import httpx
import asyncio
from config import db
from routers.refund import auto_refund_if_needed

router = APIRouter(prefix="/api", tags=["verify"])


@router.get("/verify-payment/{result_id}")
async def verify_payment(result_id: str):
    """
    결제 완료 검증 - result_id로 결제 상태를 확인하고 Firestore에 기록합니다.

    플로우:
    1. Firestore에서 result_id의 checkout_id 조회
    2. 이미 payment_verified=true면 Polar API 호출 없이 즉시 반환
    3. Polar API로 checkout session 상태 확인
    4. 결제 완료(succeeded) 확인 시 payment_verified: true 저장
    """
    try:
        # 1. Firestore에서 결과 문서 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Result not found")

        result_data = doc.to_dict()

        # ★ 이미 검증 완료된 경우 바로 반환 (Polar API 호출 불필요)
        if result_data.get("payment_verified") == True:
            return {
                "status": "success",
                "is_verified": True,
                "result_id": result_id,
                "message": "Payment already verified"
            }

        # 2. checkout_id 확인
        checkout_id = result_data.get("checkout_id")
        if not checkout_id:
            return {
                "status": "failed",
                "is_verified": False,
                "result_id": result_id,
                "message": "No checkout session found for this result"
            }

        # 3. Polar API로 결제 상태 확인 (재시도 포함)
        polar_api_key = os.getenv("POLAR_ACCESS_TOKEN")
        if not polar_api_key:
            raise HTTPException(status_code=500, detail="Polar API key not configured")

        polar_api_url = "https://api.polar.sh/v1"
        headers = {
            "Authorization": f"Bearer {polar_api_key}",
            "Content-Type": "application/json"
        }

        # ★ Polar 상태 반영 딜레이 대응: 최대 3회 재시도 (2초 간격)
        checkout_status = "unknown"
        checkout_data = {}
        max_retries = 3

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(
                        f"{polar_api_url}/checkouts/{checkout_id}",
                        headers=headers
                    )
                    response.raise_for_status()
                    checkout_data = response.json()

                checkout_status = checkout_data.get("status", "unknown")

                if checkout_status == "succeeded":
                    break  # 성공 확인됨

                if checkout_status == "open" and attempt < max_retries - 1:
                    print(f"⏳ [VERIFY] {result_id}: Polar status still 'open', retry {attempt + 1}/{max_retries}...")
                    await asyncio.sleep(2)
                else:
                    break  # open이 아닌 다른 상태이거나, 재시도 소진
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    return {
                        "status": "failed",
                        "is_verified": False,
                        "result_id": result_id,
                        "message": "Checkout session not found"
                    }
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                else:
                    raise

        # 4. 결제 성공 여부 판단
        if checkout_status == "succeeded":
            # Order ID 추출
            order_id = None
            if "order" in checkout_data and checkout_data["order"]:
                order_id = (
                    checkout_data["order"].get("id")
                    if isinstance(checkout_data["order"], dict)
                    else checkout_data["order"]
                )

            # ★ Firestore에 결제 검증 결과 저장
            update_data = {
                "payment_verified": True,
                "payment_status": "paid",
            }
            if order_id:
                update_data["order_id"] = order_id

            doc_ref.update(update_data)

            return {
                "status": "success",
                "is_verified": True,
                "result_id": result_id,
                "order_id": order_id,
                "message": "Payment verified successfully"
            }
        else:
            # ★ 재시도 후에도 실패 → 자동 환불 시도
            # Polar에서 실제로 돈이 빠져나갔을 수 있으므로 환불 시도
            refund_result = await auto_refund_if_needed(
                result_id,
                f"Verify failed after {max_retries} retries. Checkout status: {checkout_status}"
            )

            return {
                "status": "failed",
                "is_verified": False,
                "result_id": result_id,
                "checkout_status": checkout_status,
                "refund_initiated": refund_result.get("refunded", False),
                "message": f"Payment verification failed. Checkout status: {checkout_status}. "
                           f"{'Automatic refund initiated.' if refund_result.get('refunded') else 'Please contact support for a refund.'}"
            }

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        print(f"⚠️ Polar API Error: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 404:
            return {
                "status": "failed",
                "is_verified": False,
                "result_id": result_id,
                "message": "Checkout session not found"
            }
        raise HTTPException(status_code=500, detail=f"Polar API error: {e.response.status_code}")
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

