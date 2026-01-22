export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-zinc-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-600">Last updated: January 22, 2026</p>

        <div className="mt-8 space-y-6 text-sm text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">1. Data We Collect</h2>
            <p className="mt-2">
              We collect account details, site information, and uploaded documents such as PDFs and
              site plans. We also collect usage analytics to improve the product.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">2. Document Handling</h2>
            <p className="mt-2">
              Uploaded documents are processed to generate assessments. Documents may be retained
              to allow you to revisit reports and improve results.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">3. Data Retention</h2>
            <p className="mt-2">
              We retain data while your account is active. You may request deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">4. AI Processing</h2>
            <p className="mt-2">
              Some content is processed by third-party AI providers (such as OpenAI) to generate
              summaries and assessments. We only send the data required for analysis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">5. Storage & Location</h2>
            <p className="mt-2">
              Data is stored in Supabase. Storage locations may vary depending on configuration and
              hosting region.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">6. Cookies & Analytics</h2>
            <p className="mt-2">
              We use cookies and analytics to understand usage and improve the service. You can
              disable cookies in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">7. Your Rights</h2>
            <p className="mt-2">
              You have rights to access, correct, or delete your data, and to request portability.
              Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">8. Contact</h2>
            <p className="mt-2">
              Questions about privacy? Contact us at{" "}
              <a className="text-zinc-900 underline" href="mailto:plansureai@gmail.com">
                plansureai@gmail.com
              </a>
              .
            </p>
            <p className="mt-2 text-zinc-700">
              <strong>Address:</strong> PlanSureAI<br />United Kingdom
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
