export const metadata = {
  title: "Privacy Policy | tCredex",
  description: "Privacy Policy for the tCredex tax credit marketplace platform.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

export default function PrivacyPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
              <p className="text-gray-400">Last updated: January 2025</p>
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-gray max-w-none">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
                <p className="text-gray-300 mb-4">
                  tCredex, operated by American Impact Ventures LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), respects your privacy 
                  and is committed to protecting your personal information. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our platform.
                </p>
                <p className="text-gray-300">
                  Please read this privacy policy carefully. By using the Platform, you consent to the practices described herein.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
                
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Personal Information</h3>
                <p className="text-gray-300 mb-4">We may collect personal information that you voluntarily provide, including:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
                  <li>Name and contact information (email, phone, address)</li>
                  <li>Company/organization information</li>
                  <li>Professional credentials and certifications</li>
                  <li>Account credentials</li>
                  <li>Payment information</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-200 mb-2">Project Information</h3>
                <p className="text-gray-300 mb-4">For marketplace functionality, we collect:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
                  <li>Project details and descriptions</li>
                  <li>Property addresses and locations</li>
                  <li>Financial information (project costs, funding requests)</li>
                  <li>Census tract and eligibility data</li>
                  <li>Documents uploaded to the Closing Room</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-200 mb-2">Automatically Collected Information</h3>
                <p className="text-gray-300 mb-4">When you access the Platform, we automatically collect:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Device information (type, operating system, browser)</li>
                  <li>IP address and location data</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
                <p className="text-gray-300 mb-4">We use collected information to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Provide, maintain, and improve our Platform</li>
                  <li>Facilitate deal matching between project sponsors, CDEs, and investors</li>
                  <li>Process transactions and send related information</li>
                  <li>Verify eligibility for tax credit programs</li>
                  <li>Send administrative communications</li>
                  <li>Respond to inquiries and provide customer support</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Prevent fraud and ensure platform security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Information Sharing</h2>
                <p className="text-gray-300 mb-4">We may share your information with:</p>
                
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Other Platform Users</h3>
                <p className="text-gray-300 mb-4">
                  Project information may be shared with potential CDEs and investors for matching purposes. 
                  We only share information necessary to evaluate potential transactions.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-2">Service Providers</h3>
                <p className="text-gray-300 mb-4">
                  Third parties who perform services on our behalf (hosting, analytics, payment processing).
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-2">Legal Requirements</h3>
                <p className="text-gray-300 mb-4">
                  When required by law, court order, or governmental authority.
                </p>

                <h3 className="text-lg font-semibold text-gray-200 mb-2">Business Transfers</h3>
                <p className="text-gray-300">
                  In connection with any merger, acquisition, or sale of assets.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
                <p className="text-gray-300 mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information, including:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure access controls and authentication</li>
                  <li>Regular security assessments</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response procedures</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Data Retention</h2>
                <p className="text-gray-300">
                  We retain personal information for as long as necessary to fulfill the purposes for which it was collected, 
                  including to satisfy legal, accounting, or reporting requirements. Tax credit transactions may require 
                  extended retention periods to comply with IRS and program-specific requirements.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
                <p className="text-gray-300 mb-4">Depending on your location, you may have rights to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your personal information</li>
                  <li>Object to or restrict processing</li>
                  <li>Data portability</li>
                  <li>Withdraw consent</li>
                  <li>Opt out of marketing communications</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  To exercise these rights, contact us at <a href="mailto:privacy@tcredex.com" className="text-indigo-400 hover:text-indigo-300">privacy@tcredex.com</a>.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Cookies and Tracking</h2>
                <p className="text-gray-300 mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Understand how you use our Platform</li>
                  <li>Analyze and improve our services</li>
                  <li>Provide personalized content</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  You can control cookies through your browser settings. Note that disabling cookies may affect Platform functionality.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
                <p className="text-gray-300 mb-4">
                  Our Platform may integrate with third-party services including:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Google Places API (address autocomplete)</li>
                  <li>Census Bureau API (tract data)</li>
                  <li>Mapbox (mapping services)</li>
                  <li>Payment processors</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  These services have their own privacy policies. We encourage you to review them.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Children&apos;s Privacy</h2>
                <p className="text-gray-300">
                  Our Platform is not intended for children under 18. We do not knowingly collect information from children. 
                  If you believe we have collected information from a child, please contact us immediately.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
                <p className="text-gray-300">
                  We may update this Privacy Policy periodically. We will notify you of material changes via email 
                  or Platform notification. Your continued use after changes constitutes acceptance of the updated policy.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                <p className="text-gray-300 mb-4">
                  For privacy-related questions or to exercise your rights, contact us:
                </p>
                <div className="text-gray-300">
                  <p><strong>tCredex Privacy Team</strong></p>
                  <p>American Impact Ventures LLC</p>
                  <p>Email: <a href="mailto:privacy@tcredex.com" className="text-indigo-400 hover:text-indigo-300">privacy@tcredex.com</a></p>
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
