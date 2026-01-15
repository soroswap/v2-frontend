import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raffle Terms & Conditions | Soroswap",
  description:
    "Terms and Conditions for the Soroswap Stargate Raffle Contest",
};

export default function RaffleTermsPage() {
  return (
    <main className="mt-25 flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
      <div className="container mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-white/10 bg-black/60 px-8 py-10 text-white backdrop-blur-xl">
        <h1 className="text-center text-3xl font-bold">
          Soroswap Raffle Contest Terms and Conditions
        </h1>

        <div className="prose prose-lg flex max-w-none flex-col gap-4 space-y-2">
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">1. Eligibility</h2>
            <p>
              Open to legal residents who are 18 years or older. Employees,
              affiliates, and immediate family members of Palta Labs are not
              eligible to participate.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">2. Entry Period</h2>
            <p>
              The raffle runs from January 16 to January 31. Entries received
              outside this period will not be considered.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">3. How to Enter</h2>
            <p>
              An entry constitutes a submission of funds in the form of the USDC
              token to the Soroswap deposit contract{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">
                CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK
              </code>{" "}
              that meets the following criteria:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                The balance submitted is at a minimum fifty (50) USDC
              </li>
              <li>
                The deposit is maintained in full for at least seven (7) days
              </li>
            </ul>
            <p>
              Limit one entry per wallet. Multiple entry attempts from the same
              individual will be disqualified.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">4. Additional Entries</h2>
            <p>
              Participants may exclusively obtain additional entries by
              depositing additional USDC tokens accordingly:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-4 py-2 text-left font-semibold">
                      Deposit Amount
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Entries
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-2">50 USDC</td>
                    <td className="px-4 py-2">1 entry</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-2">100 USDC</td>
                    <td className="px-4 py-2">3 entries</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-2">200 USDC</td>
                    <td className="px-4 py-2">10 entries</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-2">500 USDC</td>
                    <td className="px-4 py-2">20 entries</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-2">1,000 USDC</td>
                    <td className="px-4 py-2">50 entries</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-2">2,000 USDC</td>
                    <td className="px-4 py-2">100 entries</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-2">5,000 USDC</td>
                    <td className="px-4 py-2">1,000 entries</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-4 py-2">10,000 USDC</td>
                    <td className="px-4 py-2">5,000 entries</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">5. Prize</h2>
            <p>
              Prizes will each amount to one hundred (100) USDC tokens, with
              three (3) delivered each week over four (4) weeks. Prizes will be
              delivered to the winning Stellar wallets via the Soroswap deposit
              contract{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">
                CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK
              </code>
              .
            </p>
            <p>
              Prizes are non-transferable and cannot be exchanged for cash. No
              substitutions allowed except by sponsor due to availability, in
              which case a prize of equal or greater value will be awarded.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">6. Winner Selection</h2>
            <p>
              Three (3) winners will be selected at random on or around each
              Friday over four (4) weeks. Odds of winning depend on the number
              of eligible entries received.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">7. Winner Notification</h2>
            <p>
              Winners will be notified via email or social media within 3 days
              of selection and must respond within 24 hours to claim the prize.
              Failure to respond will result in forfeiture and selection of an
              alternate winner.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">8. General Conditions</h2>
            <p>
              By entering, participants agree to be bound by these terms.
              Sponsor is not responsible for lost, late, incomplete, or
              misdirected entries. Sponsor reserves the right to cancel or
              modify the raffle if fraud or technical issues compromise its
              integrity.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">9. Publicity</h2>
            <p>
              Winner agrees to the use of their name and likeness for
              promotional purposes without additional compensation, except where
              prohibited by law.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">10. Limitation of Liability</h2>
            <p>
              Sponsor is not responsible for any injury, loss, or damage
              resulting from participation or prize acceptance.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
