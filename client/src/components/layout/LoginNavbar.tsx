import React from "react";

type Props = { variant?: "transparent" | "solid" };

const LoginNavbar: React.FC<Props> = ({ variant = "solid" }) => (
  <nav
    className={`w-full ${variant === "transparent" ? "bg-transparent" : "bg-white"} py-4`}
  >
    <div className="container mx-auto px-6 flex items-center justify-between">
      <a className="flex items-center gap-3" href="#">
        <div className="w-10 h-10 bg-green-600 text-white font-bold rounded-full flex items-center justify-center">
          SF
        </div>
        <span className="font-semibold text-lg">SnapFood</span>
      </a>

      <div className="hidden md:flex items-center gap-6">
        <a href="#" className="text-gray-700 hover:text-gray-900">
          Features
        </a>
        <a href="#" className="text-gray-700 hover:text-gray-900">
          Pricing
        </a>
        <a href="#" className="text-gray-700 hover:text-gray-900">
          Docs
        </a>
        <a
          href="/login"
          className="bg-green-600 text-white px-4 py-2 rounded-md"
        >
          Login
        </a>
      </div>

      <button className="md:hidden text-gray-700">Menu</button>
    </div>
  </nav>
);

export default LoginNavbar;
