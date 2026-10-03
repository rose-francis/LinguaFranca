import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios"; 

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/signup`,
        { name, email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      console.log(data);

      if (data.user_id) {
        alert("Signup successful! Please sign in.");
        navigate("/signin");   // Redirect to sign-in
      } else {
        alert(data.detail || "Signup failed");
      }

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-200 p-6">

      {/* Logo Top Left */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-12 h-12 drop-shadow-lg" />
        <h1 className="text-2xl font-bold text-gray-800">Lingua<span style={{color: "#6b46c1"}}>Franca</span></h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-md backdrop-blur-xl bg-white/70 shadow-2xl rounded-2xl p-10 animate-fadeIn border border-white/40">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          Create Your Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="text-sm font-semibold">Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
            Sign Up
          </button>
        </form>

        <p className="mt-5 text-center text-sm">
          Already have an account?{" "}
          <Link to="/signin" className="text-purple-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
