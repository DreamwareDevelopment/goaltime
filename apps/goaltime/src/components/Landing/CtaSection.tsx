import type React from "react"
import MailingListForm from "./MailingListForm"

const CtaSection: React.FC = () => {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 text-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-6 mb-1">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to achieve your goals?</h2>
            <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
              Join thousands of successful goal-setters and take control of your time today.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-4">
            <MailingListForm />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing up, you agree to our{" "}
              <a href="/terms" className="underline underline-offset-2">
                Terms & Conditions
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaSection

