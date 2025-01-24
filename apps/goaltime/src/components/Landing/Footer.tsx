import type React from "react"

const Footer: React.FC = () => {
  return (
    <footer className="px-4 lg:px-6 h-14 flex items-center bg-black/50 backdrop-blur-lg w-full z-50">
      <p className="text-xs text-gray-400"><span>© 2023 GoalTime</span> <span>All rights reserved.</span></p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <a className="text-xs hover:underline underline-offset-4" href="#">
          Terms of Service
        </a>
        <a className="text-xs hover:underline underline-offset-4" href="#">
          Privacy Policy
        </a>
      </nav>
    </footer>
  )
}

export default Footer