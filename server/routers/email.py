"""
이메일 전송 모듈 (Resend API)
- send_premium_report_email(): 프리미엄 리포트를 이메일로 전송
"""
import os
import resend
from datetime import datetime


def _init_resend():
    """Resend API 키 초기화"""
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        raise ValueError("RESEND_API_KEY not configured")
    resend.api_key = api_key


def _render_report_html(pet_name: str, report_pages: dict, lang: str) -> str:
    """
    리포트 페이지들을 이메일용 HTML로 변환합니다.
    마크다운 → HTML 변환은 간단한 치환으로 처리합니다.
    """
    
    # 페이지 순서 (프론트엔드와 동일)
    page_order = [
        "table_of_contents",
        "deep_dive_traits",
        "cognitive_strengths",
        "owner_chemistry",
        "training_roadmap",
        "social_adaptation",
        "lifestyle_guide",
        "heartfelt_message",
    ]
    
    # 페이지 제목 매핑
    page_titles = {
        "en": {
            "table_of_contents": "📖 Table of Contents",
            "deep_dive_traits": "🐕 Personality Analysis",
            "cognitive_strengths": "🧠 Cognitive Strengths",
            "owner_chemistry": "💕 Chemistry Analysis",
            "training_roadmap": "🎓 Training Guide",
            "social_adaptation": "🐾 Social Adaptation",
            "lifestyle_guide": "☀️ Lifestyle Guide",
            "heartfelt_message": "💌 Special Message",
        },
        "jp": {
            "table_of_contents": "📖 目次",
            "deep_dive_traits": "🐕 性格分析",
            "cognitive_strengths": "🧠 認知的強み",
            "owner_chemistry": "💕 相性分析",
            "training_roadmap": "🎓 トレーニングガイド",
            "social_adaptation": "🐾 社会適応",
            "lifestyle_guide": "☀️ ライフスタイルガイド",
            "heartfelt_message": "💌 特別なメッセージ",
        },
    }
    
    titles = page_titles.get(lang, page_titles["en"])
    
    # 간단한 마크다운 → HTML 변환
    def md_to_html(text: str) -> str:
        """최소한의 마크다운 → HTML 변환"""
        import re
        
        lines = text.split("\n")
        html_lines = []
        in_list = False
        
        for line in lines:
            stripped = line.strip()
            
            if not stripped:
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                html_lines.append("<br>")
                continue
            
            # 제목
            if stripped.startswith("# "):
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                html_lines.append(f'<h1 style="color:#2D5A47;font-size:22px;margin:20px 0 10px;">{stripped[2:]}</h1>')
                continue
            if stripped.startswith("## "):
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                html_lines.append(f'<h2 style="color:#2D5A47;font-size:18px;margin:18px 0 8px;">{stripped[3:]}</h2>')
                continue
            if stripped.startswith("### "):
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                html_lines.append(f'<h3 style="color:#2D5A47;font-size:16px;margin:14px 0 6px;">{stripped[4:]}</h3>')
                continue
            
            # 인용
            if stripped.startswith("> "):
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                html_lines.append(
                    f'<blockquote style="border-left:3px solid #2D5A47;padding:8px 16px;'
                    f'margin:12px 0;color:#555;font-style:italic;background:#f9faf9;">'
                    f'{stripped[2:]}</blockquote>'
                )
                continue
            
            # 리스트
            if stripped.startswith("- ") or stripped.startswith("• "):
                if not in_list:
                    html_lines.append('<ul style="margin:8px 0;padding-left:20px;">')
                    in_list = True
                content = stripped[2:]
                html_lines.append(f'<li style="margin:4px 0;color:#333;">{content}</li>')
                continue
            
            # 구분선
            if stripped == "---":
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                html_lines.append('<hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;">')
                continue
            
            # 일반 텍스트
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            html_lines.append(f'<p style="margin:8px 0;color:#333;line-height:1.7;">{stripped}</p>')
        
        if in_list:
            html_lines.append("</ul>")
        
        result = "\n".join(html_lines)
        
        # 인라인 마크다운 처리
        result = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', result)
        result = re.sub(r'\*(.+?)\*', r'<em>\1</em>', result)
        
        return result
    
    # 각 페이지를 HTML 섹션으로 조합
    sections_html = ""
    
    for page_key in page_order:
        page_data = report_pages.get(page_key)
        if not page_data:
            continue
        
        content = page_data.get("content", "")
        status = page_data.get("status", "")
        
        if status != "success" or not content:
            continue
        
        title = titles.get(page_key, page_key)
        content_html = md_to_html(content)
        
        sections_html += f"""
        <div style="margin-bottom:32px;padding:24px;background:white;border-radius:12px;border:1px solid #e8ebe8;">
            <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #2D5A47;">
                <h2 style="color:#2D5A47;font-size:20px;margin:0;">{title}</h2>
            </div>
            <div style="font-size:15px;line-height:1.8;color:#2D3436;">
                {content_html}
            </div>
        </div>
        """
    
    # 전체 이메일 HTML 조합
    if lang == "jp":
        header_title = f"{pet_name}のプレミアムレポート"
        footer_text = "このレポートはYour Pet InsightのAI性格分析サービスにより生成されました。"
        retention_notice = "ご注意：ウェブサイト上の結果データは作成から30日後に自動削除されます。このメールを保管することをお勧めします。"
        disclaimer = "※ このレポートはエンターテインメントおよび参考目的です。専門的な獣医学的・行動学的アドバイスに代わるものではありません。"
    else:
        header_title = f"{pet_name}'s Premium Report"
        footer_text = "This report was generated by Your Pet Insight's AI personality analysis service."
        retention_notice = "Note: Result data on our website is automatically deleted after 30 days. We recommend keeping this email for your records."
        disclaimer = "Disclaimer: This report is for entertainment and reference purposes only. It does not replace professional veterinary or behavioral advice."
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:20px;">
            
            <!-- Header -->
            <div style="text-align:center;padding:32px 20px;background:linear-gradient(135deg,#2D5A47 0%,#3d7a62 100%);border-radius:16px 16px 0 0;">
                <div style="font-size:36px;margin-bottom:8px;">🐾</div>
                <h1 style="color:white;font-size:24px;margin:0 0 4px;">{header_title}</h1>
                <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Your Pet Insight</p>
            </div>
            
            <!-- Content -->
            <div style="background:#F8F7F4;padding:24px 0;">
                {sections_html}
            </div>
            
            <!-- Retention Notice -->
            <div style="padding:16px 20px;background:#FFF8E1;border-radius:8px;margin-bottom:16px;border:1px solid #FFE082;">
                <p style="margin:0;font-size:13px;color:#F57F17;line-height:1.5;">
                    ⚠️ {retention_notice}
                </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align:center;padding:24px 20px;border-top:1px solid #e0e0e0;">
                <p style="font-size:12px;color:#999;margin:0 0 8px;">{footer_text}</p>
                <p style="font-size:11px;color:#bbb;margin:0 0 8px;">{disclaimer}</p>
                <p style="font-size:12px;color:#999;margin:0;">
                    <a href="https://www.yourpetinsight.com" style="color:#2D5A47;text-decoration:none;">yourpetinsight.com</a>
                </p>
            </div>
            
        </div>
    </body>
    </html>
    """
    
    return html


async def send_premium_report_email(
    to_email: str,
    pet_name: str,
    report_pages: dict,
    lang: str = "en",
    result_id: str = ""
) -> dict:
    """
    프리미엄 리포트를 이메일로 전송합니다.
    
    Args:
        to_email: 수신자 이메일
        pet_name: 펫 이름
        report_pages: 리포트 페이지 데이터 (Firestore에서 가져온 것)
        lang: 언어 (en/jp)
        result_id: 결과 ID (태그용)
    
    Returns:
        {"sent": bool, "message": str, "email_id": str | None}
    """
    try:
        _init_resend()
        
        from_email = os.getenv("RESEND_FROM_EMAIL", "Your Pet Insight <reports@yourpetinsight.com>")
        
        # 이메일 제목
        if lang == "jp":
            subject = f"🐾 {pet_name}のプレミアム性格分析レポート"
        else:
            subject = f"🐾 {pet_name}'s Premium Personality Report"
        
        # HTML 본문 생성
        html_content = _render_report_html(pet_name, report_pages, lang)
        
        # Resend API로 전송
        params: resend.Emails.SendParams = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "reply_to": "support@yourpetinsight.com",
            "tags": [
                {"name": "type", "value": "premium-report"},
                {"name": "lang", "value": lang},
                {"name": "result_id", "value": result_id[:256] if result_id else "unknown"},
            ]
        }
        
        email_response = resend.Emails.send(params)
        
        email_id = email_response.get("id") if isinstance(email_response, dict) else str(email_response)
        
        print(f"✅ [EMAIL] Report sent to {to_email} for {pet_name}. Email ID: {email_id}")
        
        return {
            "sent": True,
            "message": "Email sent successfully",
            "email_id": email_id
        }
    
    except ValueError as e:
        # API 키 미설정
        print(f"⚠️ [EMAIL] Config error: {str(e)}")
        return {"sent": False, "message": str(e), "email_id": None}
    
    except Exception as e:
        print(f"❌ [EMAIL] Failed to send to {to_email}: {str(e)}")
        return {"sent": False, "message": f"Email send failed: {str(e)}", "email_id": None}

