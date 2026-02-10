import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'

// **볼드** 텍스트를 처리하는 함수 (링크 자동 변환 방지)
function renderBoldText(text) {
  const parts = []
  const boldPattern = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match

  while ((match = boldPattern.exec(text)) !== null) {
    // 볼드 앞 텍스트
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
    }
    // 볼드 텍스트
    parts.push({ type: 'bold', content: match[1] })
    lastIndex = match.index + match[0].length
  }
  // 나머지 텍스트
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) })
  }

  if (parts.length === 0) {
    return <span>{text}</span>
  }

  return (
    <span>
      {parts.map((part, idx) => {
        if (part.type === 'bold') {
          return <strong key={idx} className="font-bold">{part.content}</strong>
        }
        return <span key={idx}>{part.content}</span>
      })}
    </span>
  )
}

const CONTENT = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: February 2026",
    sections: [
      {
        heading: "1. Overview",
        paragraphs: [
          "Your Pet Insight (\"we,\" \"our,\" or \"us\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our service at yourpetinsight.com.",
          "By using our service, you agree to the collection and use of information in accordance with this policy."
        ]
      },
      {
        heading: "2. Information We Collect",
        paragraphs: [
          "**Information You Provide:**",
          "• Pet name (required for personality analysis)",
          "• Test responses (pet personality questions and owner personality questions)",
          "• Email address (only when purchasing a Premium Report, collected through Polar payment processor)",
          "",
          "**Information Automatically Collected:**",
          "• Browser type and device information",
          "• IP address (anonymized)",
          "• Service usage patterns (page views, clicks, etc.)",
          "",
          "**Information We Do NOT Collect:**",
          "• Real name, address, or phone number",
          "• Pet medical records",
          "• Payment card information (processed directly by Polar, not stored on our servers)"
        ]
      },
      {
        heading: "3. How We Use Your Information",
        paragraphs: [
          "We use the information we collect to:",
          "• Generate AI-based personality analysis results",
          "• Create and deliver Premium Reports via email",
          "• Improve our service and conduct statistical analysis (using anonymized data)",
          "• Ensure service functionality and security"
        ]
      },
      {
        heading: "4. Data Retention Period",
        paragraphs: [
          "**Your test result data will be automatically deleted 30 days after creation.**",
          "Once deleted, your data cannot be recovered. We strongly recommend that you save your results if you wish to access them after the 30-day period.",
          "**To preserve your results:**",
          "• Use the image save functionality available on the results screen to download or screenshot your results",
          "• If you purchase a Premium Report, a copy will be sent to the email address you provide during checkout. We recommend keeping this email for your records.",
          "Payment records are retained for up to 5 years as required by tax laws."
        ]
      },
      {
        heading: "5. Third-Party Services",
        paragraphs: [
          "We use the following third-party services that may collect or process your information:",
          "• **Polar** (payment processing): Your payment information is handled according to Polar's privacy policy (polar.sh)",
          "• **OpenAI** (AI analysis): Your test responses are used to generate personality analysis reports",
          "• **Google Analytics** (usage statistics): Only anonymized data is collected",
          "• **Firebase/Firestore** (data storage): Google Cloud security policies apply"
        ]
      },
      {
        heading: "6. Cookies",
        paragraphs: [
          "We use cookies to enhance your experience:",
          "• **Essential cookies**: Language preferences and session maintenance",
          "• **Analytics cookies**: Google Analytics (you can opt out through your browser settings)"
        ]
      },
      {
        heading: "7. Your Rights",
        paragraphs: [
          "You have the right to:",
          "• Request deletion of your data (contact us via email)",
          "• Request early deletion before the 30-day automatic deletion period",
          "• If you are a resident of the EU/EEA, exercise your rights under GDPR",
          "• If you are a resident of Japan, exercise your rights under the Personal Information Protection Act"
        ]
      },
      {
        heading: "8. Children's Privacy",
        paragraphs: [
          "We do not knowingly collect personal information from children under the age of 14. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately."
        ]
      },
      {
        heading: "9. Policy Changes",
        paragraphs: [
          "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the \"Last updated\" date."
        ]
      },
      {
        heading: "10. Contact Information",
        paragraphs: [
          "If you have any questions about this Privacy Policy, please contact us at support@yourpetinsight.com."
        ]
      }
    ]
  },
  jp: {
    title: "プライバシーポリシー",
    lastUpdated: "最終更新日: 2026年2月",
    sections: [
      {
        heading: "1. 概要",
        paragraphs: [
          "Your Pet Insight（「当社」「私たち」または「弊社」）は、お客様のプライバシーを保護することに取り組んでいます。本プライバシーポリシーは、yourpetinsight.comで当サービスを使用する際に、当社が個人情報をどのように収集、使用、保護するかを説明します。",
          "当サービスを使用することにより、本ポリシーに従った情報の収集および使用に同意したものとみなされます。"
        ]
      },
      {
        heading: "2. 収集する情報",
        paragraphs: [
          "**お客様が提供する情報：**",
          "• ペットの名前（性格分析に必要）",
          "• テスト回答（ペットの性格に関する質問および飼い主の性格に関する質問）",
          "• メールアドレス（プレミアムレポート購入時のみ、Polar決済処理業者を通じて収集）",
          "",
          "**自動的に収集される情報：**",
          "• ブラウザタイプおよびデバイス情報",
          "• IPアドレス（匿名化）",
          "• サービス利用パターン（ページビュー、クリックなど）",
          "",
          "**収集しない情報：**",
          "• 実名、住所、または電話番号",
          "• ペットの医療記録",
          "• 決済カード情報（Polarが直接処理し、当社のサーバーに保存されません）"
        ]
      },
      {
        heading: "3. 情報の使用目的",
        paragraphs: [
          "収集した情報は、以下に使用されます：",
          "• AIベースの性格分析結果の生成",
          "• メールによるプレミアムレポートの作成および配信",
          "• サービスの改善および統計分析（匿名化データを使用）",
          "• サービスの機能性およびセキュリティの確保"
        ]
      },
      {
        heading: "4. データ保持期間",
        paragraphs: [
          "**テスト結果データは、作成日から30日後に自動的に削除されます。**",
          "削除後、データを復元することはできません。30日後も結果にアクセスしたい場合は、結果を保存することを強く推奨します。",
          "**結果を保存するには：**",
          "• 結果画面で利用可能な画像保存機能を使用して、結果をダウンロードまたはスクリーンショットする",
          "• プレミアムレポートを購入した場合、チェックアウト時に提供したメールアドレスにコピーが送信されます。記録のためにこのメールを保持することを推奨します。",
          "決済記録は、税法の要件に従って最大5年間保持されます。"
        ]
      },
      {
        heading: "5. 第三者サービス",
        paragraphs: [
          "お客様の情報を収集または処理する可能性がある以下の第三者サービスを使用しています：",
          "• **Polar**（決済処理）：お客様の決済情報は、Polarのプライバシーポリシー（polar.sh）に従って処理されます",
          "• **OpenAI**（AI分析）：お客様のテスト回答は、性格分析レポートの生成に使用されます",
          "• **Google Analytics**（利用統計）：匿名化されたデータのみが収集されます",
          "• **Firebase/Firestore**（データ保存）：Google Cloudセキュリティポリシーが適用されます"
        ]
      },
      {
        heading: "6. クッキー",
        paragraphs: [
          "お客様の体験を向上させるためにクッキーを使用しています：",
          "• **必須クッキー**：言語設定およびセッション維持",
          "• **分析クッキー**：Google Analytics（ブラウザ設定でオプトアウト可能）"
        ]
      },
      {
        heading: "7. お客様の権利",
        paragraphs: [
          "お客様には以下の権利があります：",
          "• データの削除を要求する（メールでお問い合わせ）",
          "• 30日の自動削除期間前に早期削除を要求する",
          "• EU/EEA居住者の場合、GDPRに基づく権利を行使する",
          "• 日本居住者の場合、個人情報保護法に基づく権利を行使する"
        ]
      },
      {
        heading: "8. 児童のプライバシー",
        paragraphs: [
          "当社は、14歳未満の児童から意図的に個人情報を収集しません。保護者または後見人で、お子様が当社に個人情報を提供したと信じる場合は、すぐにご連絡ください。"
        ]
      },
      {
        heading: "9. ポリシーの変更",
        paragraphs: [
          "当社は、本プライバシーポリシーを随時更新する場合があります。新しいポリシーをこのページに投稿し、「最終更新日」を更新することにより、変更を通知します。"
        ]
      },
      {
        heading: "10. 連絡先",
        paragraphs: [
          "本プライバシーポリシーに関するご質問がございましたら、support@yourpetinsight.comまでお問い合わせください。"
        ]
      }
    ]
  }
}

function PrivacyPolicy() {
  const { lang } = useLang()
  const content = CONTENT[lang] || CONTENT.en

  return (
    <main className="min-h-screen bg-[#F9FBF9]">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        {/* 제목 */}
        <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
          {content.title}
        </h1>
        <p className="text-primary/50 text-sm mb-10">
          {content.lastUpdated}
        </p>

        {/* 본문 */}
        <div className="prose prose-lg prose-green max-w-none">
          {content.sections.map((section, i) => (
            <section key={i} className="mb-10">
              <h2 className="text-xl font-display font-bold text-primary mb-3">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, j) => {
                // 빈 문자열 처리
                if (!p || p.trim() === '') {
                  return null
                }
                return (
                  <p key={j} className="text-[#2D3436]/80 leading-relaxed mb-4 text-[15px]">
                    {renderBoldText(p)}
                  </p>
                )
              })}
            </section>
          ))}
        </div>

        {/* 하단 링크 */}
        <div className="border-t border-primary/10 pt-8 mt-12 flex flex-wrap gap-6 text-sm text-primary/50">
          <Link to={`/${lang}/terms`} className="hover:text-primary transition-colors">
            {lang === 'jp' ? '利用規約' : 'Terms of Service'}
          </Link>
          <Link to={`/${lang}/privacy`} className="hover:text-primary transition-colors">
            {lang === 'jp' ? 'プライバシーポリシー' : 'Privacy Policy'}
          </Link>
          <Link to={`/${lang}/refund`} className="hover:text-primary transition-colors">
            {lang === 'jp' ? '返金ポリシー' : 'Refund Policy'}
          </Link>
        </div>
      </div>
    </main>
  )
}

export default PrivacyPolicy

