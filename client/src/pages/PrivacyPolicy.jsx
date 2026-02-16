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
          "**Information You Directly Provide:**",
          "• Pet name (required to generate personality analysis)",
          "• Test responses (answers to pet personality and owner personality questions)",
          "",
          "These are stored in our database (Google Firestore) and automatically deleted 30 days after creation.",
          "",
          "**Information Collected by Third-Party Services:**",
          "• Email address: Collected by Polar (our payment processor) only when you purchase a Premium Report. This information is stored on Polar's servers, not ours.",
          "• Payment information (card details, billing): Processed and stored entirely by Polar. We never see or store your payment card information.",
          "• Anonymous usage data: Google Analytics collects anonymized browsing data (page views, general geographic region, device type) to help us improve our service. This data cannot identify you personally.",
          "",
          "**Information We Do NOT Collect or Store:**",
          "• Your real name, address, or phone number",
          "• Your pet's medical records",
          "• IP addresses (we do not log or store IP addresses)",
          "• Payment card details (handled entirely by Polar)"
        ]
      },
      {
        heading: "3. How We Use Your Information",
        paragraphs: [
          "• Pet name and test responses: Used solely to generate your AI-based personality analysis results. This data is sent to OpenAI's API for report generation and is automatically deleted from our database after 30 days.",
          "• Anonymous analytics data: Used to understand general usage patterns and improve our service. This data cannot be linked to individual users.",
          "",
          "We do not sell, rent, or share your personal data with third parties for marketing purposes."
        ]
      },
      {
        heading: "4. Data Retention",
        paragraphs: [
          "• Test result data (pet name, responses, analysis results, premium report): Automatically deleted 30 days after creation. This deletion is permanent and irreversible.",
          "• Payment references (checkout ID, order ID): Retained in our database as transaction references. These do not contain your personal payment details.",
          "• Payment and billing records: Retained by Polar according to their data retention policy and applicable tax laws.",
          "",
          "Once your data is deleted, it cannot be recovered. We strongly recommend saving your results within the 30-day period."
        ]
      },
      {
        heading: "5. Third-Party Services",
        paragraphs: [
          "Our service integrates with the following third-party providers:",
          "• **Polar** (polar.sh) — Payment processing. Polar collects your email address and payment information directly. We do not have access to your payment card details. See Polar's privacy policy for details.",
          "• **OpenAI** — AI analysis. Your pet name and test responses are sent to OpenAI's API to generate personality analysis reports. OpenAI's data usage policy applies to this processing.",
          "• **Google Analytics** — Anonymous usage statistics. GA collects anonymized browsing data using cookies. You can opt out via your browser settings or by using the Google Analytics Opt-out Browser Add-on.",
          "• **Google Firebase/Firestore** — Data storage. Your test data is stored in Google Cloud infrastructure. Google Cloud security and compliance policies apply."
        ]
      },
      {
        heading: "6. Cookies and Tracking",
        paragraphs: [
          "Our service uses minimal cookies:",
          "• Google Analytics cookies: Used for anonymous usage statistics. These cookies help us understand how visitors use our site. You can opt out through your browser settings or the Google Analytics Opt-out Add-on.",
          "",
          "We do NOT use:",
          "• Authentication or session cookies (no user accounts)",
          "• Language preference cookies (language is determined by URL path)",
          "• Advertising or tracking cookies",
          "• Third-party marketing cookies",
          "",
          "EU/EEA users: Google Analytics cookies are set only after you consent via our cookie notice."
        ]
      },
      {
        heading: "7. Your Rights",
        paragraphs: [
          "All users:",
          "• Your data is automatically deleted after 30 days without any action required",
          "• You may request early deletion of your data by contacting us via email",
          "• You may request information about what data we hold about you",
          "",
          "EU/EEA residents (GDPR):",
          "• Right of access, rectification, and erasure",
          "• Right to restrict or object to processing",
          "• Right to data portability",
          "• Right to withdraw consent at any time",
          "• Right to lodge a complaint with your local supervisory authority",
          "",
          "Japan residents (APPI):",
          "• Right to request disclosure of retained personal data",
          "• Right to request correction, addition, or deletion",
          "• Right to request cessation of use or provision to third parties",
          "",
          "California residents (CCPA):",
          "• Right to know what personal information is collected",
          "• Right to request deletion of personal information",
          "• Right to opt-out of the sale of personal information (we do not sell your data)"
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
          "**お客様が直接提供する情報:**",
          "• ペットの名前（性格分析の生成に必要）",
          "• テストの回答（ペット性格質問と飼い主性格質問への回答）",
          "",
          "これらはGoogle Firestoreに保存され、作成から30日後に自動的に削除されます。",
          "",
          "**第三者サービスが収集する情報:**",
          "• メールアドレス: プレミアムレポート購入時にPolar（決済処理業者）が収集。弊社のサーバーには保存されません。",
          "• 決済情報（カード情報等）: Polarが処理・保存。弊社はお客様の決済カード情報を閲覧・保存しません。",
          "• 匿名の利用データ: Google Analyticsがブラウジングデータを匿名で収集。このデータでお客様を個人的に特定することはできません。",
          "",
          "**収集・保存しない情報:**",
          "• お客様の実名、住所、電話番号",
          "• ペットの医療記録",
          "• IPアドレス（記録・保存しません）",
          "• 決済カード情報（Polarが管理）"
        ]
      },
      {
        heading: "3. 情報の使用目的",
        paragraphs: [
          "• ペットの名前とテスト回答: AIベースの性格分析結果を生成するためのみに使用されます。このデータはレポート生成のためにOpenAIのAPIに送信され、30日後に弊社のデータベースから自動的に削除されます。",
          "• 匿名の分析データ: 一般的な利用パターンを理解し、サービスを改善するために使用されます。このデータは個々のユーザーにリンクすることはできません。",
          "",
          "弊社は、マーケティング目的で第三者に個人データを販売、賃貸、または共有しません。"
        ]
      },
      {
        heading: "4. データ保持",
        paragraphs: [
          "• テスト結果データ（ペット名、回答、分析結果、プレミアムレポート）: 作成から30日後に自動的に削除されます。この削除は永続的で不可逆的です。",
          "• 決済参照（checkout ID、order ID）: 取引参照として弊社のデータベースに保持されます。これらにはお客様の個人決済詳細は含まれません。",
          "• 決済および請求記録: Polarのデータ保持ポリシーおよび適用される税法に従ってPolarが保持します。",
          "",
          "データが削除されると、復元することはできません。30日以内に結果を保存することを強く推奨します。"
        ]
      },
      {
        heading: "5. 第三者サービス",
        paragraphs: [
          "当サービスは、以下の第三者プロバイダーと統合しています：",
          "• **Polar**（polar.sh）— 決済処理。Polarがお客様のメールアドレスと決済情報を直接収集します。弊社はお客様の決済カード詳細にアクセスできません。詳細はPolarのプライバシーポリシーを参照してください。",
          "• **OpenAI** — AI分析。お客様のペット名とテスト回答は、性格分析レポートを生成するためにOpenAIのAPIに送信されます。OpenAIのデータ使用ポリシーがこの処理に適用されます。",
          "• **Google Analytics** — 匿名の利用統計。GAはクッキーを使用して匿名のブラウジングデータを収集します。ブラウザ設定またはGoogle Analyticsオプトアウトブラウザアドオンでオプトアウトできます。",
          "• **Google Firebase/Firestore** — データ保存。お客様のテストデータはGoogle Cloudインフラストラクチャに保存されます。Google Cloudセキュリティおよびコンプライアンスポリシーが適用されます。"
        ]
      },
      {
        heading: "6. クッキーとトラッキング",
        paragraphs: [
          "当サービスは最小限のクッキーを使用します：",
          "• Google Analyticsクッキー: 匿名の利用統計に使用。これらのクッキーは、訪問者がサイトをどのように使用するかを理解するのに役立ちます。ブラウザ設定またはGoogle Analyticsオプトアウトアドオンでオプトアウトできます。",
          "",
          "使用しないクッキー:",
          "• 認証・セッションクッキー（アカウント機能なし）",
          "• 言語設定クッキー（URLパスで言語を判定）",
          "• 広告・トラッキングクッキー",
          "• 第三者マーケティングクッキー",
          "",
          "EU/EEA在住のユーザー: クッキー同意を得た後にGoogle Analyticsクッキーが設定されます。"
        ]
      },
      {
        heading: "7. お客様の権利",
        paragraphs: [
          "すべてのユーザー:",
          "• お客様のデータは、何も操作しなくても30日後に自動的に削除されます",
          "• メールでお問い合わせいただくことで、データの早期削除を要求できます",
          "• 弊社が保持しているデータについて情報を要求できます",
          "",
          "EU/EEA在住者（GDPR）:",
          "• アクセス、訂正、削除の権利",
          "• 処理の制限または異議申し立ての権利",
          "• データポータビリティの権利",
          "• いつでも同意を撤回する権利",
          "• 地元の監督機関に苦情を申し立てる権利",
          "",
          "日本在住者（個人情報保護法）:",
          "• 保持されている個人データの開示を要求する権利",
          "• 訂正、追加、または削除を要求する権利",
          "• 使用または第三者への提供の停止を要求する権利",
          "",
          "カリフォルニア在住者（CCPA）:",
          "• 収集される個人情報を知る権利",
          "• 個人情報の削除を要求する権利",
          "• 個人情報の販売をオプトアウトする権利（弊社はお客様のデータを販売しません）"
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
          <Link to="/terms" className="hover:text-primary transition-colors">
            {lang === 'jp' ? '利用規約' : 'Terms of Service'}
          </Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">
            {lang === 'jp' ? 'プライバシーポリシー' : 'Privacy Policy'}
          </Link>
          <Link to="/refund" className="hover:text-primary transition-colors">
            {lang === 'jp' ? '返金ポリシー' : 'Refund Policy'}
          </Link>
        </div>
      </div>
    </main>
  )
}

export default PrivacyPolicy

