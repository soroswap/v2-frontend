import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Soroswap",
  description: "Privacy Policy for Soroswap decentralized exchange platform",
};

export default function PrivacyPage() {
  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
      <div className="container mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 text-white">
        <h1 className="text-center text-3xl font-bold">
          Soroswap Privacy Policy
        </h1>

        <div className="prose prose-lg flex max-w-none flex-col gap-4 space-y-2">
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              1. Important Information and Who We Are
            </h2>
            <p>
              Welcome to Soroswap ("Soroswap", "we", "our", or "us"). This
              Privacy Policy explains how we collect, use, and disclose your
              personal data when you visit our website at{" "}
              <a
                href="https://v2.soroswap.finance"
                className="cursor-pointer text-white hover:text-white/80 hover:underline"
              >
                https://v2.soroswap.finance
              </a>{" "}
              (the "Site") and use our decentralized exchange services
              ("Services").
            </p>
            <p>
              For any questions regarding this Privacy Policy or our privacy
              practices, please contact our data privacy manager at
              privacy@soroswap.finance.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              2. Changes to the Privacy Policy and Your Duty to Inform Us of
              Changes
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the updated policy on the
              Services. Your continued use of the Services after any such
              changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              3. What Information Do We Collect?
            </h2>

            <h3 className="text-xl font-semibold">Personal Data</h3>
            <p>
              Soroswap does not store any personal data related to your
              interactions with the blockchain. We do not collect, track, or
              store your transaction data on the Stellar network or any other
              blockchain.
            </p>

            <h3 className="text-xl font-semibold">
              IP Address and Technical Data
            </h3>
            <p>
              We may automatically collect certain technical data when you visit
              the Site. This may include your IP address, browser type, and
              pages visited. We collect this information to improve the
              functionality of the Site and for security purposes.
            </p>

            <h3 className="text-xl font-semibold">Cookies</h3>
            <p>
              We use cookies to enhance your experience on the Site. You can
              manage your cookie preferences through your browser settings.
            </p>

            <h3 className="text-xl font-semibold">Aggregate Data</h3>
            <p>
              We collect statistical information about the usage of our Services
              in an aggregate form. This data cannot be linked back to
              individual users and is used to improve the performance of
              Soroswap.
            </p>

            <h3 className="text-xl font-semibold">
              Information Related to Social Networks
            </h3>
            <p>
              If you choose to share information from our Services on
              third-party social networks, such as Twitter or LinkedIn, this
              information will be subject to the privacy policies of those
              networks.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              4. How Do We Use Your Personal Data?
            </h2>
            <p>
              We use the data we collect to provide and improve our Services,
              communicate with you, prevent fraud, and comply with legal
              obligations. However, we do not store or track any personal data
              related to blockchain transactions.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              5. How Is Your Information Disclosed?
            </h2>
            <p>
              We do not disclose any personal data related to blockchain
              interactions, as we do not store such data. However, we may
              disclose technical data to third-party service providers or
              business partners for the purpose of improving the functionality
              of the Site or addressing legal requests.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">6. International Transfers</h2>
            <p>
              Since Soroswap operates on the Stellar network, we cannot control
              where transactions occur on the blockchain. However, if any
              personal data were to be collected, it may be transferred outside
              your jurisdiction. We ensure appropriate safeguards are in place
              for such transfers.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">7. Your Rights</h2>
            <p>
              You have rights regarding your personal data, including the right
              to access, correct, or delete your data. Please contact us at
              privacy@soroswap.finance to exercise your rights.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">8. Contact Us</h2>
            <p>
              If you have any questions or concerns about our Privacy Policy or
              practices, please contact our data privacy manager at
              privacy@soroswap.finance.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              9. Is Information About Me Secure?
            </h2>
            <p>
              We seek to protect personal data to ensure that it is kept
              private. However, because Soroswap is a decentralized platform, we
              cannot guarantee the security of any personal data you may choose
              to provide through third-party services. Unauthorized access,
              hardware or software failure, and other factors may compromise the
              security of information.
            </p>
            <p>
              We maintain technical, physical, and administrative security
              measures to protect your data against loss, misuse, unauthorized
              access, and alteration. While we make every effort to safeguard
              your information, we cannot guarantee complete security.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              10. How Long Will You Use My Personal Data For?
            </h2>
            <p>
              We will only retain your personal data for as long as reasonably
              necessary to fulfill the purposes we collected it for, including
              for the purposes of satisfying any legal, regulatory, tax,
              accounting, or reporting requirements.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              11. What Information of Mine Can I Access?
            </h2>
            <p>
              You can manage and delete cookies through your web browser
              settings.
            </p>
            <p>
              You may contact privacy@soroswap.finance at any time to obtain a
              copy of the information that we may have collected and retained
              about you.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">12. Children's Privacy</h2>
            <p>
              The Site is a general audience site and is not intended for anyone
              under the age of 18. We do not knowingly collect personal data via
              our websites, applications, services, or tools from users in this
              age group.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              13. What Choices Do I Have Regarding My Information?
            </h2>
            <p>
              You may choose not to access our Services if you do not consent to
              the collection and usage of your information as described in this
              policy.
            </p>
            <p>
              You can always opt not to disclose certain information to us, with
              the understanding that this may limit your ability to use some
              features.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">
              14. Legal Rights for EEA Residents
            </h2>
            <p>
              EEA residents have the following rights under data protection
              laws:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                Request access to your personal data (commonly known as a "data
                subject access request").
              </li>
              <li>
                Request correction of the personal data we hold about you.
              </li>
              <li>
                Request erasure of your personal data where there is no good
                reason for us to continue processing it.
              </li>
              <li>
                Object to processing of your personal data where we are relying
                on a legitimate interest.
              </li>
              <li>
                Request restriction of processing of your personal data in
                certain scenarios.
              </li>
              <li>
                Request the transfer of your personal data to you or a third
                party.
              </li>
              <li>
                Withdraw consent at any time where we are relying on consent to
                process your personal data.
              </li>
            </ul>
            <p>
              If you wish to exercise any of the rights set out above, please
              contact privacy@soroswap.finance.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
