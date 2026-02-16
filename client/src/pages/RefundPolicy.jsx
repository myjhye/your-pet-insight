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
    title: "Refund Policy",
    lastUpdated: "Last updated: February 2026",
    sections: [
      {
        heading: "1. Overview",
        paragraphs: [
          "This Refund Policy applies to Premium Reports ($5.99) purchased through Your Pet Insight. Due to the digital nature of our content, refund conditions are limited.",
          "By purchasing a Premium Report, you acknowledge that you have read and understood this policy."
        ]
      },
      {
        heading: "2. Eligible Refunds (Technical Issues)",
        paragraphs: [
          "**Automatic refunds are processed in the following cases:**",
          "• Payment succeeded but the report was not generated or delivered",
          "• Report content fails to load or displays errors",
          "• Duplicate payment occurred",
          "• System error resulted in incorrect or corrupted results",
          "",
          "In these technical failure cases, our system will automatically attempt to process a refund. If automatic refund fails, please contact our support team via email for manual processing."
        ]
      },
      {
        heading: "3. Non-Refundable Cases",
        paragraphs: [
          "**Refunds are NOT available in the following cases:**",
          "• **After the report has been successfully generated and delivered, refunds are not available due to dissatisfaction with the content**",
          "• \"I don't like the AI analysis results\" is not a valid reason for refund",
          "• \"The results are different from what I expected\" is not a valid reason for refund",
          "• The report has already been viewed or accessed",
          "• Due to the digital nature of our content, returns are not possible after viewing",
          "• Email delivery failure due to an incorrect email address entered during checkout. You are responsible for entering a valid email address at the time of purchase. We cannot verify or correct email addresses after checkout is complete."
        ]
      },
      {
        heading: "4. Automatic Refund System",
        paragraphs: [
          "If a technical issue prevents report delivery after successful payment, our system will automatically process a refund.",
          "Automatic refunds typically take 3-5 business days to process, depending on your payment method.",
          "If automatic refund fails, our customer support team will process the refund manually upon request."
        ]
      },
      {
        heading: "5. Data Retention Notice",
        paragraphs: [
          "**Your test result data will be automatically deleted 30 days after creation.**",
          "Refunds are not available after the 30-day deletion period due to inability to access results. This is a normal part of our data retention policy.",
          "**To preserve your results:**",
          "• Use the image save functionality available on the results screen to download or screenshot your results to your local device",
          "• A copy of your Premium Report is automatically sent to the email address you provide during checkout. Please ensure you enter a valid email address, as we cannot resend reports to a different address after purchase.",
          "We strongly recommend saving your results within the 30-day period if you wish to access them later."
        ]
      },
      {
        heading: "6. How to Request a Refund",
        paragraphs: [
          "If you believe you are eligible for a refund, please contact us at support@yourpetinsight.com with the following information:",
          "• Email address used during checkout",
          "• Date and time of payment",
          "• Description of the issue",
          "We will review your request and respond within 3 business days."
        ]
      },
      {
        heading: "7. Refund Processing Time",
        paragraphs: [
          "Once a refund is approved, it will be processed to your original payment method within 3-5 business days.",
          "Additional processing time may be required depending on your card issuer or payment provider."
        ]
      },
      {
        heading: "8. Contact Information",
        paragraphs: [
          "If you have any questions about this Refund Policy, please contact us at support@yourpetinsight.com."
        ]
      }
    ]
  },
  jp: {
    title: "返金ポリシー",
    lastUpdated: "最終更新日: 2026年2月",
    sections: [
      {
        heading: "1. 概要",
        paragraphs: [
          "本返金ポリシーは、Your Pet Insightを通じて購入されたプレミアムレポート（$5.99）に適用されます。コンテンツのデジタル性質により、返金条件は限られています。",
          "プレミアムレポートを購入することにより、本ポリシーを読み、理解したことを承認します。"
        ]
      },
      {
        heading: "2. 返金対象（技術的問題）",
        paragraphs: [
          "**以下の場合、自動返金が処理されます：**",
          "• 決済は成功したが、レポートが生成または配信されなかった",
          "• レポートコンテンツが読み込まれない、またはエラーが表示される",
          "• 重複決済が発生した",
          "• システムエラーにより、不正または破損した結果が生成された",
          "",
          "これらの技術的障害の場合、当社のシステムは自動的に返金を処理しようとします。自動返金が失敗した場合、手動処理のためにメールでサポートチームにお問い合わせください。"
        ]
      },
      {
        heading: "3. 返金不可の場合",
        paragraphs: [
          "**以下の場合、返金は利用できません：**",
          "• **レポートが正常に生成および配信された後、コンテンツへの不満を理由に返金は利用できません**",
          "• 「AI分析結果が気に入らない」は返金の有効な理由ではありません",
          "• 「結果が期待と異なる」は返金の有効な理由ではありません",
          "• レポートが既に閲覧またはアクセスされた",
          "• コンテンツのデジタル性質により、閲覧後の返品は不可能です",
          "• チェックアウト時に誤ったメールアドレスを入力したことによるメール配信の失敗。購入時に有効なメールアドレスを入力する責任はお客様にあります。チェックアウト完了後にメールアドレスを確認または修正することはできません。"
        ]
      },
      {
        heading: "4. 自動返金システム",
        paragraphs: [
          "決済成功後に技術的問題によりレポート配信が妨げられた場合、当社のシステムは自動的に返金を処理します。",
          "自動返金は、通常、決済方法に応じて3〜5営業日で処理されます。",
          "自動返金が失敗した場合、お客様サポートチームが要求に応じて手動で返金を処理します。"
        ]
      },
      {
        heading: "5. データ保持に関する注意",
        paragraphs: [
          "**テスト結果データは、作成日から30日後に自動的に削除されます。**",
          "結果にアクセスできないことを理由に、30日の削除期間後は返金は利用できません。これは、当社のデータ保持ポリシーの正常な部分です。",
          "**結果を保存するには：**",
          "• 結果画面で利用可能な画像保存機能を使用して、結果をローカルデバイスにダウンロードまたはスクリーンショットする",
          "• プレミアムレポートのコピーは、チェックアウト時に提供したメールアドレスに自動的に送信されます。有効なメールアドレスを入力してください。購入後に別のアドレスにレポートを再送信することはできません。",
          "後で結果にアクセスしたい場合は、30日以内に結果を保存することを強く推奨します。"
        ]
      },
      {
        heading: "6. 返金の請求方法",
        paragraphs: [
          "返金の対象であると信じる場合は、以下の情報を含めてsupport@yourpetinsight.comまでお問い合わせください：",
          "• チェックアウト時に使用したメールアドレス",
          "• 決済の日時",
          "• 問題の説明",
          "お客様のリクエストを確認し、3営業日以内に回答します。"
        ]
      },
      {
        heading: "7. 返金処理時間",
        paragraphs: [
          "返金が承認されると、元の決済方法に3〜5営業日以内に処理されます。",
          "カード発行会社または決済プロバイダーに応じて、追加の処理時間が必要な場合があります。"
        ]
      },
      {
        heading: "8. 連絡先",
        paragraphs: [
          "本返金ポリシーに関するご質問がございましたら、support@yourpetinsight.comまでお問い合わせください。"
        ]
      }
    ]
  }
}

function RefundPolicy() {
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

export default RefundPolicy

