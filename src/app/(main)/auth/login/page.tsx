"use client";
import React, { useState, ChangeEvent, FormEvent } from 'react';

const LoginForm: React.FC = () => {
  // Define the state type for the form fields
  interface LoginState {
    email: string;
    password: string;
  }

  const [formData, setFormData] = useState<LoginState>({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle input changes with TypeScript event typing
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate an API call
      console.log('Submitting data:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1500)); 
      
      alert('Login Successful!');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Please enter your details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Helpers */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-600 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded text-blue-600 focus:ring-blue-500" />
              Remember me
            </label>
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-600 mt-8">
          Don't have an account?{' '}
          <a href="#" className="text-blue-600 hover:underline font-medium">
            Create account
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
