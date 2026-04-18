"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050608] flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black" />
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4 sm:p-6 md:p-8">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: "bg-transparent shadow-none border-none",
              rootBox: "w-full",
              headerTitle: "text-white",
              headerSubtitle: "text-white/65",
              socialButtonsBlockButton: "bg-white text-black hover:bg-white/90 border border-white/20 rounded-xl",
              dividerText: "text-white/40",
              dividerLine: "bg-white/10",
              formButtonPrimary: "bg-red-500 hover:bg-red-400 text-white rounded-xl",
              formFieldInput: "bg-black/40 border border-white/15 text-white rounded-xl",
              formFieldLabel: "text-white/70",
              footerActionText: "text-black font-medium",
              footerActionLink: "text-red-500 hover:text-red-600 font-semibold",
            },
          }}
        />
      </div>
    </div>
  )
}
