import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios"; // <-- added

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/signin`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;

      if (data.access_token) {
        console.log("Login successful!", data);

        // Store token
        localStorage.setItem("token", data.access_token);

        // Navigate to home page
        navigate("/home");
      } else {
        alert(data.detail || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-200 p-6">

      {/* Logo Top Left */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-3 hover:opacity-80 transition">
        <img src="/logo.png" alt="Logo" className="w-12 h-12 drop-shadow-lg" />
        <h1 className="text-2xl font-bold text-gray-800">Lingua<span className="text-purple-700">Franca</span></h1>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md backdrop-blur-xl bg-white/70 shadow-2xl rounded-2xl p-10 animate-fadeIn border border-white/40">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Password</label>
            <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-3 border border-gray-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
                type="button"
              onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-purple-600 hover:text-purple-800"
            >
            {showPassword ? "Hide" : "Show"}
          </button>
          </div>
          </div>

          <button className="w-full bg-purple-700 text-white py-3 rounded-xl text-lg font-semibold hover:bg-purple-800 transition transform hover:-translate-y-1 shadow-lg">
            Sign In
          </button>
        </form>

        <p className="mt-5 text-center text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-purple-700 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
