export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to AggieX. By accessing or using our platform, you agree to be bound by these 
                Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our 
                services. We reserve the right to modify these Terms at any time, and your continued 
                use of the platform constitutes acceptance of any updated terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                AggieX is a platform designed to connect students, organizations, and projects within 
                the Texas A&M University community. Our services include but are not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>User profile creation and management</li>
                <li>Project discovery and collaboration tools</li>
                <li>Event creation and RSVP management</li>
                <li>Organization directories and information</li>
                <li>Social networking features for academic and professional purposes</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                To use AggieX, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Be at least 13 years of age</li>
                <li>Have a valid email address</li>
                <li>Be affiliated with Texas A&M University (as a student, faculty, staff, or alumni) 
                    or have legitimate interest in connecting with the Texas A&M community</li>
                <li>Comply with all applicable local, state, national, and international laws</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">User Accounts and Authentication</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may create an account using Google OAuth or other supported authentication methods. 
                You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and current information</li>
                <li>Notifying us immediately of any unauthorized access to your account</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to suspend or terminate accounts that violate these Terms or 
                engage in suspicious activity.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Acceptable Use Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to use AggieX responsibly and not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Post false, misleading, or fraudulent content</li>
                <li>Harass, abuse, threaten, or discriminate against other users</li>
                <li>Share inappropriate, offensive, or illegal content</li>
                <li>Violate intellectual property rights or applicable laws</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Use automated tools to scrape, harvest, or collect data from the platform</li>
                <li>Impersonate another person or organization</li>
                <li>Interfere with the proper functioning of the platform</li>
                <li>Use the platform for commercial solicitation without permission</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">User-Generated Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of content you post on AggieX (including project descriptions, 
                event details, comments, and profile information). However, by posting content, you 
                grant AggieX a non-exclusive, worldwide, royalty-free license to use, display, and 
                distribute your content as necessary to provide and promote our services.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You represent and warrant that you have all necessary rights to the content you post 
                and that such content does not violate any third-party rights or applicable laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Content Moderation</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right, but not the obligation, to monitor, review, and remove any 
                user-generated content that violates these Terms or that we deem inappropriate for 
                any reason. We may take action including warning users, suspending accounts, or 
                permanently banning users who repeatedly violate our policies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All intellectual property rights in the AggieX platform, including but not limited 
                to software, design, logos, trademarks, and documentation, are owned by AggieX or 
                our licensors. You may not copy, modify, distribute, or create derivative works 
                based on our platform without explicit permission.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of AggieX is also governed by our Privacy Policy, which describes how we 
                collect, use, and protect your personal information. Please review our{' '}
                <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a> for 
                more information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Third-Party Services and Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                AggieX may integrate with or link to third-party services (such as Google OAuth, 
                Supabase, or external websites). We are not responsible for the content, privacy 
                practices, or terms of service of any third-party services. Your use of third-party 
                services is at your own risk and subject to their respective terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Disclaimers and Limitations of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                AggieX is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any 
                kind, either express or implied. We do not guarantee that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>The platform will be uninterrupted, secure, or error-free</li>
                <li>The results obtained from using the platform will be accurate or reliable</li>
                <li>Any errors or defects will be corrected</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To the fullest extent permitted by law, AggieX shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising out of or related to 
                your use of the platform, even if we have been advised of the possibility of such damages.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless AggieX, its officers, directors, 
                employees, and agents from any claims, damages, losses, liabilities, and expenses 
                (including reasonable attorneys' fees) arising out of or related to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Your use of the platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Content you post on the platform</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Modification and Termination of Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any aspect of the AggieX 
                platform at any time, with or without notice. We may also terminate or suspend your 
                access to the platform immediately, without prior notice or liability, for any reason, 
                including if you breach these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Governing Law and Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the 
                State of Texas, without regard to its conflict of law provisions. Any disputes arising 
                out of or relating to these Terms or your use of AggieX shall be resolved through 
                binding arbitration in accordance with the rules of the American Arbitration Association, 
                or in the state or federal courts located in Brazos County, Texas.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be invalid or unenforceable by a court of 
                competent jurisdiction, the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Entire Agreement</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms, together with our Privacy Policy, constitute the entire agreement between 
                you and AggieX regarding your use of the platform and supersede any prior agreements 
                or understandings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions, concerns, or feedback regarding these Terms of Service, 
                please contact us at:
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Email: <a href="mailto:support@aggiex.org" className="text-primary hover:underline font-medium">support@aggiex.org</a>
              </p>
            </section>

            <section className="space-y-4 border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground italic">
                By using AggieX, you acknowledge that you have read, understood, and agree to be bound 
                by these Terms of Service. Thank you for being part of the AggieX community!
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

