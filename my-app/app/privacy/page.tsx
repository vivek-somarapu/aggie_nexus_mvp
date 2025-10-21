export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to AggieX ("we," "our," or "us"). We are committed to protecting your personal 
                information and your right to privacy. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Create an account or authenticate via Google OAuth</li>
                <li>Complete your user profile</li>
                <li>Create or join projects and events</li>
                <li>Communicate with other users through our platform</li>
                <li>Contact our support team</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This information may include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Name and email address (from Google OAuth)</li>
                <li>Profile information (photo, bio, academic details, skills)</li>
                <li>User-generated content (project descriptions, event details, comments)</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Authenticate your identity and manage your account</li>
                <li>Enable you to create and participate in projects and events</li>
                <li>Facilitate connections between students and organizations</li>
                <li>Send you important updates and notifications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor and analyze platform usage and trends</li>
                <li>Detect and prevent fraudulent or unauthorized activities</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is stored securely on Supabase servers with industry-standard encryption 
                and security measures. We implement appropriate technical and organizational safeguards 
                to protect your personal information against unauthorized access, alteration, disclosure, 
                or destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>With other users as part of the platform's social features (e.g., your profile on projects you join)</li>
                <li>With service providers who assist in operating our platform (e.g., Supabase for database hosting)</li>
                <li>When required by law or to protect our legal rights</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Access and review your personal information</li>
                <li>Update or correct your profile data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise any of these rights, please contact us at the email address below.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to maintain your session, remember 
                your preferences, and analyze platform usage. You can control cookies through your 
                browser settings, though some features may not function properly if cookies are disabled.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform uses Google OAuth for authentication. When you sign in with Google, you 
                are subject to Google's Privacy Policy in addition to ours. We only request access to 
                basic profile information necessary for account creation.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                AggieX is intended for use by college students and affiliated individuals. We do not 
                knowingly collect information from individuals under 13 years of age. If we become 
                aware that we have collected personal information from a child under 13, we will take 
                steps to delete such information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices 
                or legal requirements. We will notify you of any material changes by posting the updated 
                policy on this page and updating the "Last updated" date. Your continued use of the 
                platform after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our 
                data practices, please contact us at:
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Email: <a href="mailto:support@aggiex.org" className="text-primary hover:underline font-medium">support@aggiex.org</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

