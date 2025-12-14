export const metadata = {
  title: "Terms of Service | tCredex",
  description: "Terms of Service for the tCredex tax credit marketplace platform.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

export default function TermsPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
              <p className="text-gray-400">Last updated: January 2025</p>
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-gray max-w-none">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
                <p className="text-gray-300 mb-4">
                  By accessing or using the tCredex platform (&quot;Platform&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). 
                  If you disagree with any part of the terms, you may not access the Platform.
                </p>
                <p className="text-gray-300">
                  tCredex is operated by American Impact Ventures LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). 
                  These Terms govern your use of our tax credit marketplace services.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">2. Platform Description</h2>
                <p className="text-gray-300 mb-4">
                  tCredex is a marketplace platform that connects project sponsors, Community Development Entities (CDEs), 
                  and investors for tax credit transactions, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>New Markets Tax Credits (NMTC)</li>
                  <li>Low-Income Housing Tax Credits (LIHTC)</li>
                  <li>Historic Tax Credits (HTC)</li>
                  <li>Opportunity Zone investments</li>
                  <li>Brownfield tax incentives</li>
                </ul>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-green-400 mb-4">3. Fee Structure &amp; No-Risk Policy</h2>
                <p className="text-gray-300 mb-4">
                  <strong className="text-green-400">tCredex operates on a success-based fee model.</strong> You don&apos;t close your 
                  financing, we don&apos;t get paid. Our interests are fully aligned with yours.
                </p>
                <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Transaction Fees</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li><strong>1.8%</strong> of transaction basis up to $10 million</li>
                    <li><strong>1.5%</strong> of transaction basis exceeding $10 million</li>
                  </ul>
                </div>
                <p className="text-gray-300">
                  Additional fee-for-service options are available for complex transactions requiring specialized support, 
                  including due diligence assistance, document preparation, and expedited processing.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">4. User Accounts</h2>
                <p className="text-gray-300 mb-4">
                  To access certain features of the Platform, you must register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">5. User Responsibilities</h2>
                <p className="text-gray-300 mb-4">As a user of tCredex, you agree to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Provide accurate and truthful information about your projects and qualifications</li>
                  <li>Comply with all applicable tax credit program rules and regulations</li>
                  <li>Maintain appropriate documentation for all transactions</li>
                  <li>Not misrepresent your status, qualifications, or project eligibility</li>
                  <li>Cooperate with due diligence and compliance requirements</li>
                  <li>Respect the confidentiality of other users&apos; information</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">6. Platform Services</h2>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">6.1 Deal Matching</h3>
                <p className="text-gray-300 mb-4">
                  Our AutoMatch AI system facilitates connections between project sponsors and potential funding sources. 
                  Matching suggestions are based on stated criteria and do not constitute endorsements or guarantees.
                </p>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">6.2 Eligibility Tools</h3>
                <p className="text-gray-300 mb-4">
                  Eligibility determinations provided by our platform are preliminary assessments only. 
                  Final eligibility is determined by the relevant government agencies and CDEs.
                </p>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">6.3 Document Management</h3>
                <p className="text-gray-300">
                  Our Closing Room feature provides document management tools. Users remain responsible for 
                  document accuracy, completeness, and compliance with applicable requirements.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">7. Disclaimers</h2>
                <p className="text-gray-300 mb-4">
                  <strong>THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND.</strong>
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>We do not guarantee the success of any transaction or match</li>
                  <li>We are not a law firm, accounting firm, or financial advisor</li>
                  <li>Platform information does not constitute tax, legal, or financial advice</li>
                  <li>Users should consult qualified professionals for specific guidance</li>
                  <li>We do not guarantee CDE allocation availability or investor participation</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-300 mb-4">
                  To the maximum extent permitted by law, tCredex and its affiliates shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Loss of profits or anticipated savings</li>
                  <li>Loss of tax credits or other benefits</li>
                  <li>Failed transactions or funding</li>
                  <li>Decisions made based on platform information</li>
                  <li>Third-party actions or omissions</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">9. Intellectual Property</h2>
                <p className="text-gray-300">
                  The Platform and its original content, features, and functionality are owned by American Impact Ventures LLC 
                  and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. 
                  Users retain ownership of their submitted content but grant us a license to use it for Platform operations.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">10. Confidentiality</h2>
                <p className="text-gray-300">
                  We maintain strict confidentiality regarding user information and deal details. 
                  Information is shared only as necessary to facilitate matches and transactions, 
                  and with explicit user consent. See our <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link> for details.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">11. Termination</h2>
                <p className="text-gray-300">
                  We may terminate or suspend your account and access to the Platform immediately, without prior notice, 
                  for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, 
                  or for any other reason at our sole discretion.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
                <p className="text-gray-300">
                  These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
                  without regard to its conflict of law provisions. Any disputes arising under these Terms shall be 
                  resolved in the state or federal courts located in Delaware.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">13. Changes to Terms</h2>
                <p className="text-gray-300">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes 
                  via email or Platform notification. Continued use of the Platform after changes constitutes acceptance 
                  of the modified Terms.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">14. Contact Us</h2>
                <p className="text-gray-300 mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="text-gray-300">
                  <p><strong>tCredex</strong></p>
                  <p>An affiliate of American Impact Ventures LLC</p>
                  <p>Email: <a href="mailto:legal@tcredex.com" className="text-indigo-400 hover:text-indigo-300">legal@tcredex.com</a></p>
                </div>
              </div>
            </div>

            {/* Back Link */}
            <div className="mt-12 text-center">
              <Link href="/" className="text-indigo-400 hover:text-indigo-300">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
