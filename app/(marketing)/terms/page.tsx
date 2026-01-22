export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: January 22, 2026</p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using PlanSureAI ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service.
              </p>
              <p className="text-gray-700">
                These Terms apply to all users of the Service, including but not limited to property developers, planning consultants, and other professionals in the UK property development sector.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                PlanSureAI is an AI-powered planning intelligence platform that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Automated planning risk assessments for UK property development sites</li>
                <li>Analysis of local planning authority (LPA) policies</li>
                <li>Risk scoring and mitigation recommendations</li>
                <li>Policy citation and reference materials</li>
              </ul>
            </section>

            <section className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">⚠️ 3. CRITICAL AI AND PLANNING DISCLAIMER</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.1 Not Professional Planning Advice</h3>
              <p className="text-gray-700 mb-4">
                <strong>PlanSureAI provides automated guidance and analysis tools, NOT professional planning advice.</strong> Our AI-generated assessments:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Are for informational purposes only</li>
                <li>Do not constitute legal, planning, or professional advice</li>
                <li>Should not be relied upon as a substitute for consultation with qualified planning professionals</li>
                <li>May not reflect the most current planning policies or regulations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 AI Limitations and Accuracy</h3>
              <p className="text-gray-700 mb-4">
                Our Service uses artificial intelligence and machine learning technologies, which have inherent limitations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>No guarantee of accuracy:</strong> AI-generated assessments may contain errors, omissions, or outdated information</li>
                <li><strong>Policy database limitations:</strong> Our LPA policy database may not be 100% current or complete</li>
                <li><strong>Context limitations:</strong> AI may not fully understand unique site circumstances or local context</li>
                <li><strong>Interpretation variance:</strong> Planning policies are subject to interpretation by planning officers and committees</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.3 Professional Consultation Required</h3>
              <p className="text-gray-700 mb-4">
                <strong>You must always:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Consult with qualified planning consultants, architects, or solicitors before making planning decisions</li>
                <li>Verify all information with the relevant Local Planning Authority</li>
                <li>Conduct your own due diligence and site-specific research</li>
                <li>Obtain professional advice for planning applications</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.4 No Liability for Planning Decisions</h3>
              <p className="text-gray-700">
                <strong>We are not responsible for:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Planning application outcomes or rejections</li>
                <li>Financial losses from planning decisions based on our assessments</li>
                <li>Delays, costs, or complications in the planning process</li>
                <li>Inaccuracies in AI-generated content or policy interpretations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Accounts and Access</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                You must create an account to use our Service. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Eligibility</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years old and legally capable of entering into binding contracts to use this Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Subscription and Billing</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.1 Subscription Tiers</h3>
              <p className="text-gray-700 mb-4">
                We offer various subscription tiers (Explorer, Developer, Expert, Enterprise) with different usage limits and features. Current pricing is available on our website.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Payment Terms</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Billing cycle:</strong> Subscriptions are billed monthly or annually in advance</li>
                <li><strong>Payment method:</strong> We accept payment via credit card through Stripe</li>
                <li><strong>Auto-renewal:</strong> Subscriptions automatically renew unless cancelled</li>
                <li><strong>Price changes:</strong> We reserve the right to change prices with 30 days' notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.3 Cancellation and Refunds</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Cancellation:</strong> You may cancel your subscription at any time from your account settings</li>
                <li><strong>Effect of cancellation:</strong> Service access continues until the end of your current billing period</li>
                <li><strong>Refunds:</strong> We do not provide refunds for partial months or unused assessments, except where required by law</li>
                <li><strong>Trial periods:</strong> If offered, trial periods may be subject to separate terms</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.4 Usage Limits</h3>
              <p className="text-gray-700 mb-4">
                Each subscription tier includes specific usage limits (number of assessments, sites, etc.). Exceeding these limits may require an upgrade or additional charges.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use Policy</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.1 Permitted Use</h3>
              <p className="text-gray-700 mb-4">
                You may use the Service for legitimate planning research and development purposes in accordance with these Terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Prohibited Activities</h3>
              <p className="text-gray-700 mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Scrape, crawl, or use automated tools to extract data without permission</li>
                <li>Reverse engineer, decompile, or attempt to extract source code</li>
                <li>Resell, redistribute, or sublicense access to the Service</li>
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Impersonate others or provide false information</li>
                <li>Interfere with or disrupt the Service's operation</li>
                <li>Use the Service to generate content for competing planning assessment tools</li>
                <li>Exceed reasonable usage limits or attempt to circumvent usage restrictions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.3 Consequences of Violation</h3>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate your account immediately if you violate these terms, without refund.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property Rights</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.1 Our Intellectual Property</h3>
              <p className="text-gray-700 mb-4">
                The Service, including its software, design, content, and trademarks, is owned by PlanSureAI and protected by intellectual property laws. You do not acquire any ownership rights by using the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of content you upload (site plans, documents, etc.). By uploading content, you grant us a license to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Process and analyze your content to provide the Service</li>
                <li>Store your content on our servers</li>
                <li>Use anonymized, aggregated data to improve our AI models</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.3 Assessment Outputs</h3>
              <p className="text-gray-700 mb-4">
                AI-generated assessments are provided for your use, but we retain intellectual property rights in our methodology, algorithms, and platform. You may use assessment outputs for your business purposes but may not redistribute them as a competing service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>

              <p className="text-gray-700 mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.1 No Warranties</h3>
              <p className="text-gray-700 mb-4">
                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Accuracy, completeness, or reliability of assessments</li>
                <li>Fitness for a particular purpose</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Compatibility with planning authority requirements</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.2 Limitation of Damages</h3>
              <p className="text-gray-700 mb-4">
                We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Lost profits or business opportunities</li>
                <li>Planning application rejections or delays</li>
                <li>Property acquisition or development losses</li>
                <li>Costs of obtaining substitute services</li>
                <li>Data loss or corruption</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.3 Maximum Liability</h3>
              <p className="text-gray-700">
                Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim, or 100 pounds, whichever is greater.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless PlanSureAI and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Planning decisions made based on our assessments</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Data and Privacy</h2>
              <p className="text-gray-700">
                Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to our data practices as described in the Privacy Policy, including the processing of uploaded documents through third-party AI services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Service Modifications and Termination</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.1 Service Changes</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.2 Account Termination</h3>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>For violation of these Terms</li>
                <li>For fraudulent or illegal activity</li>
                <li>If required by law</li>
                <li>At our discretion with reasonable notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.3 Effect of Termination</h3>
              <p className="text-gray-700">
                Upon termination, your access to the Service will cease immediately. You may download your data within 30 days of termination, after which it will be deleted in accordance with our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">12.1 Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of England and Wales, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">12.2 Jurisdiction</h3>
              <p className="text-gray-700 mb-4">
                Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">12.3 Informal Resolution</h3>
              <p className="text-gray-700">
                Before filing any formal claim, you agree to first contact us at <a href="mailto:support@plansureai.com" className="text-blue-600 hover:underline">support@plansureai.com</a> to attempt to resolve the dispute informally.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. General Provisions</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">13.1 Entire Agreement</h3>
              <p className="text-gray-700 mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and PlanSureAI.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">13.2 Severability</h3>
              <p className="text-gray-700 mb-4">
                If any provision is found unenforceable, the remaining provisions will remain in full effect.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">13.3 Waiver</h3>
              <p className="text-gray-700 mb-4">
                Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">13.4 Assignment</h3>
              <p className="text-gray-700 mb-4">
                You may not assign or transfer these Terms. We may assign our rights and obligations without restriction.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">13.5 Changes to Terms</h3>
              <p className="text-gray-700">
                We may modify these Terms at any time. Material changes will be notified via email or Service notice. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms:
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> <a href="mailto:plansureai@gmail.com" className="text-blue-600 hover:underline">plansureai@gmail.com</a><br />
                <strong>Support:</strong> <a href="mailto:plansureai@gmail.com" className="text-blue-600 hover:underline">plansureai@gmail.com</a><br />
                <strong>Address:</strong> PlanSureAI<br />United Kingdom
              </p>
            </section>

            <div className="mt-12 p-6 bg-blue-50 border-l-4 border-blue-400">
              <p className="text-sm text-gray-700">
                <strong>By using PlanSureAI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
