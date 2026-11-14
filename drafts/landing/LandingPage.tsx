import React from "react";
import Navbar from "./loginNavbar";

const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
    <Navbar variant="transparent" />

    <header className="container mx-auto px-6 py-20 flex flex-col md:flex-row items-center">
      <div className="md:w-1/2">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          SnapFood — Instant nutrition insights from photos
        </h1>
        <p className="text-lg mb-6">
          Take a picture of your meal and get detailed nutrition analysis,
          health tips and tracking.
        </p>
        <div className="flex gap-4">
          <a
            href="#"
            className="bg-green-600 text-white px-6 py-3 rounded-md shadow hover:bg-green-700"
          >
            Get Started
          </a>
          <a
            href="#"
            className="border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-100"
          >
            Learn More
          </a>
        </div>
      </div>

      <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          <img
            src="https://via.placeholder.com/600x400?text=Meal+Preview"
            alt="meal"
            className="rounded-md"
          />
        </div>
      </div>
    </header>

    <section className="container mx-auto px-6 py-16">
      <h2 className="text-2xl font-bold mb-8 text-center">How it works</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-white rounded-lg shadow text-center">
          <h3 className="font-semibold mb-2">Snap a photo</h3>
          <p className="text-sm text-gray-600">
            Take a quick photo of your meal from your phone.
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow text-center">
          <h3 className="font-semibold mb-2">AI analyzes ingredients</h3>
          <p className="text-sm text-gray-600">
            Our model identifies food and estimates nutrition.
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow text-center">
          <h3 className="font-semibold mb-2">Get tailored advice</h3>
          <p className="text-sm text-gray-600">
            Receive health tips and tracking suggestions.
          </p>
        </div>
      </div>
    </section>

    <footer className="border-t py-8">
      <div className="container mx-auto px-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} SnapFood. All rights reserved.
      </div>
    </footer>
  </div>
);

export default LandingPage;
