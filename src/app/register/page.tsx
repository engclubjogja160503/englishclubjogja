"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";
import {
  OCCUPATION_OPTIONS,
  DOMICILE_OPTIONS,
  INTEREST_OPTIONS,
  EXPECTATION_OPTIONS,
  AGE_RANGES,
  MBTI_OPTIONS,
} from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    occupation: "Student",
    domicile: "Kota Yogyakarta",
    instagram: "",
    interests: [] as string[],
    expectations: [] as string[],
    expectation_other: "",
    age_range: "",
    mbti: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleInterest = (interest: string) => {
    setFormData((previous) => ({
      ...previous,
      interests: previous.interests.includes(interest)
        ? previous.interests.filter((item) => item !== interest)
        : [...previous.interests, interest],
    }));
  };

  const toggleExpectation = (expectation: string) => {
    setFormData((previous) => ({
      ...previous,
      expectations: previous.expectations.includes(expectation)
        ? previous.expectations.filter((item) => item !== expectation)
        : [...previous.expectations, expectation],
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Usernames are unique; catch a clash before creating the auth account.
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", formData.username)
      .limit(1)
      .maybeSingle();
    if (taken) {
      setError("That username is already taken. Please choose another one.");
      setLoading(false);
      return;
    }

    // Sign up
    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name,
        phone: formData.phone,
        occupation: formData.occupation,
        domicile: formData.domicile,
        instagram: formData.instagram,
        interests: formData.interests,
        expectations: formData.expectations,
        expectation_other: formData.expectation_other,
        age_range: formData.age_range,
        mbti: formData.mbti,
        is_member: true,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        setError(
          `Your account was created, but we couldn't save your profile (${profileError.message}). Please log in and complete it on your Profile page.`
        );
        setLoading(false);
        return;
      }
    }

    router.push("/book");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F5F0E8]">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#3B7DD8]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#F47B20]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fadeIn">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[#6B7280] hover:text-[#F47B20] mb-8 transition-colors"
        >
          &larr; Back to home
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#EDE5D8]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo.png"
              alt="English Club Jogja"
              width={160}
              height={50}
              className="h-12 w-auto"
            />
          </div>

          <h1 className="text-2xl font-bold text-center text-[#1A1A1A] mb-2">
            Create your member account 🎉
          </h1>
          <p className="text-center text-[#6B7280] mb-8">
            Complete your profile once, then confirm future bookings in seconds
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="coolenglishuser"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
              />
            </div>

            {/* Profile details */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Age Range <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={formData.age_range}
                onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
              >
                <option value="">Select your age range</option>
                {AGE_RANGES.map((range) => <option key={range} value={range}>{range}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                MBTI Personality Type <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={formData.mbti}
                onChange={(e) => setFormData({ ...formData, mbti: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
              >
                <option value="">Select your MBTI</option>
                {MBTI_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                What do you do?
              </label>
              <select
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
              >
                {OCCUPATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Where are you based?
              </label>
              <select
                value={formData.domicile}
                onChange={(e) => setFormData({ ...formData, domicile: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] focus:border-[#3B7DD8]"
              >
                {DOMICILE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Instagram <span className="text-[#9CA3AF]">(optional)</span>
              </label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@yourusername"
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-3">
                Your Interests <span className="text-[#9CA3AF]">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${formData.interests.includes(interest) ? "bg-[#F47B20] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-3">
                What are you looking for? <span className="text-[#9CA3AF]">(optional)</span>
              </label>
              <div className="space-y-2">
                {EXPECTATION_OPTIONS.map((expectation) => (
                  <label key={expectation} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F3F4F6] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.expectations.includes(expectation)}
                      onChange={() => toggleExpectation(expectation)}
                      className="w-4 h-4 rounded border-[#D1D5DB] text-[#F47B20] focus:ring-[#F47B20]"
                    />
                    <span className="text-sm text-[#374151]">{expectation}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                value={formData.expectation_other}
                onChange={(e) => setFormData({ ...formData, expectation_other: e.target.value })}
                placeholder="Anything else? (optional)"
                className="w-full mt-3 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Type your password again"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#3B7DD8]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#3B7DD8] hover:bg-[#2D5FA8] disabled:bg-[#3B7DD8]/50 text-white font-semibold rounded-xl shadow-lg shadow-[#3B7DD8]/25 transition-all"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#3B7DD8] hover:text-[#2D5FA8]"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
