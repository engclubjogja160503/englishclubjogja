"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, Save, UserRound, Camera, X, Check, Eye, EyeOff } from "lucide-react";
import {
  DOMICILE_OPTIONS,
  EXPECTATION_OPTIONS,
  INTEREST_OPTIONS,
  OCCUPATION_OPTIONS,
  AGE_RANGES,
  MBTI_OPTIONS,
} from "@/lib/constants";

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // the sign-in email as Supabase knows it, so saving only asks to change it when it really changed
  const [authEmail, setAuthEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Crop state
  const [showCrop, setShowCrop] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }
      setUserId(auth.user.id);
      setAuthEmail(auth.user.email || "");
      setFormData((current) => ({ ...current, email: auth.user.email || "" }));
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      if (profile) {
        setAvatarUrl(profile.avatar_url || "");
        setFormData({
          email: profile.email || auth.user.email || "",
          password: "",
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          occupation: profile.occupation || "Student",
          domicile: profile.domicile || "Kota Yogyakarta",
          instagram: profile.instagram || "",
          interests: profile.interests || [],
          expectations: profile.expectations || [],
          expectation_other: profile.expectation_other || "",
          age_range: profile.age_range || "",
          mbti: profile.mbti || "",
        });
      }
      setLoading(false);
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (field: "interests" | "expectations", value: string) =>
    setFormData((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImage(ev.target?.result as string);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setShowCrop(true);
      setError("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
    },
    [cropOffset]
  );

  const handleCropMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const maxOffset = (cropZoom - 1) * 100;
      const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStart.x));
      const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStart.y));
      setCropOffset({ x: newX, y: newY });
    },
    [isDragging, dragStart, cropZoom]
  );

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const cropAndUpload = async () => {
    const canvas = canvasRef.current;
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = cropImage;
    });

    const size = 400;
    if (canvas) {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW: number, drawH: number;
      if (imgAspect > 1) {
        drawH = size * cropZoom;
        drawW = drawH * imgAspect;
      } else {
        drawW = size * cropZoom;
        drawH = drawW / imgAspect;
      }

      const offsetX = (size - drawW) / 2 + cropOffset.x;
      const offsetY = (size - drawH) / 2 + cropOffset.y;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas?.toBlob(resolve, "image/jpeg", 0.85)
    );

    if (!blob) {
      setError("Failed to process image.");
      return;
    }

    setShowCrop(false);
    setUploadingAvatar(true);
    setError("");

    const supabase = createClient();
    const path = `${userId}/${Date.now()}-avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

    if (uploadError) {
      setError("Upload failed: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: signedData } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 31536000);

    if (signedData?.signedUrl) {
      setAvatarUrl(signedData.signedUrl);
      setAvatarPreview(signedData.signedUrl);
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      setAvatarPreview(data.publicUrl);
    }

    setUploadingAvatar(false);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const newPassword = formData.password;
    if (newPassword) {
      if (newPassword.length < 6) {
        setError("Your new password needs at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("The two new passwords don't match. Please type them again.");
        return;
      }
    }
    setSaving(true);
    const supabase = createClient();
    const email = formData.email.trim();
    const emailChanged = !!email && email.toLowerCase() !== authEmail.toLowerCase();
    const updates: { email?: string; password?: string } = {};
    if (emailChanged) updates.email = email;
    if (newPassword) updates.password = newPassword;
    if (Object.keys(updates).length) {
      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) {
        setError(
          /same.*password|different from the old/i.test(authError.message)
            ? "That's already your password. Choose a different one."
            : /reauthenticat|recent/i.test(authError.message)
            ? "For safety, please sign out and sign in again, then change your password."
            : authError.message
        );
        setSaving(false);
        return;
      }
    }
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        occupation: formData.occupation,
        domicile: formData.domicile,
        instagram: formData.instagram,
        interests: formData.interests,
        expectations: formData.expectations,
        expectation_other: formData.expectation_other,
        avatar_url: avatarUrl,
        age_range: formData.age_range,
        mbti: formData.mbti,
      })
      .eq("id", userId);
    if (profileError) setError(profileError.message);
    else
      setMessage(
        [
          newPassword ? "Password changed ✓ Use your new password next time you sign in." : "Profile saved successfully.",
          emailChanged ? `Check ${email} to confirm your new email address.` : "",
        ].filter(Boolean).join(" ")
      );
    setFormData((current) => ({ ...current, password: "" }));
    setConfirmPassword("");
    setSaving(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <Loader2 className="animate-spin text-[#F47B20]" />
      </div>
    );

  const displayUrl = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />

      {showCrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">
                Adjust your photo
              </h3>
              <button
                onClick={() => setShowCrop(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <div
              className="relative mx-auto w-48 h-48 rounded-full overflow-hidden border-4 border-[#F47B20] bg-gray-100 cursor-grab active:cursor-grabbing"
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
            >
              <img
                src={cropImage}
                alt="Crop preview"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                style={{
                  transform: `scale(${cropZoom}) translate(${cropOffset.x / cropZoom}px, ${cropOffset.y / cropZoom}px)`,
                }}
                draggable={false}
              />
            </div>

            <div className="mt-4 px-2">
              <label className="text-xs text-[#6B7280] font-medium">Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={(e) => {
                  const newZoom = parseFloat(e.target.value);
                  setCropZoom(newZoom);
                  const maxOffset = (newZoom - 1) * 100;
                  setCropOffset((prev) => ({
                    x: Math.max(-maxOffset, Math.min(maxOffset, prev.x)),
                    y: Math.max(-maxOffset, Math.min(maxOffset, prev.y)),
                  }));
                }}
                className="w-full accent-[#F47B20]"
              />
            </div>

            <p className="text-xs text-[#9CA3AF] text-center mt-2">
              Drag to reposition, use slider to zoom
            </p>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCrop(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={cropAndUpload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F47B20] text-white font-semibold hover:bg-[#D96A15] transition-colors"
              >
                <Check size={18} />
                Use Photo
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-[#EDE5D8]">
          <div className="text-center mb-8">
            <div className="relative mx-auto mb-4 w-24 h-24">
              <div className="w-24 h-24 rounded-full bg-[#FFF3EB] overflow-hidden flex items-center justify-center border-2 border-[#EDE5D8]">
                {displayUrl ? (
                  <img
                    src={displayUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserRound size={36} className="text-[#F47B20]" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#F47B20] text-white flex items-center justify-center shadow-lg hover:bg-[#D96A15] transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Your Profile</h1>
            <p className="text-[#6B7280] mt-1">
              Keep your member details up to date.
            </p>
          </div>

          <form onSubmit={saveProfile} className="space-y-5">
            {error && (
              <p className="p-3 rounded-xl bg-[#FEF2F2] text-[#DC2626] text-sm">
                {error}
              </p>
            )}
            {message && (
              <p className="p-3 rounded-xl bg-[#ECFDF5] text-[#059669] text-sm">
                {message}
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <label className="text-sm font-medium">
                Name
                <input
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal"
                />
              </label>
              <label className="text-sm font-medium">
                Phone
                <input
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal"
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal"
              />
            </label>

            <label className="block text-sm font-medium">
              New password{" "}
              <span className="text-[#9CA3AF] font-normal">
                (leave blank to keep current)
              </span>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className="mt-1.5 w-full px-4 py-3 pr-12 rounded-xl border border-[#E5E7EB] font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-[calc(50%+3px)] -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </span>
            </label>

            {formData.password && (
              <label className="block text-sm font-medium">
                Confirm new password
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type it again"
                  autoComplete="new-password"
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal"
                />
              </label>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <label className="text-sm font-medium">
                Occupation
                <select
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal bg-white"
                >
                  {OCCUPATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Domicile
                <select
                  value={formData.domicile}
                  onChange={(e) =>
                    setFormData({ ...formData, domicile: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal bg-white"
                >
                  {DOMICILE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <label className="text-sm font-medium">
                Age Range <span className="text-[#EF4444]">*</span>
                <select
                  required
                  value={formData.age_range}
                  onChange={(e) =>
                    setFormData({ ...formData, age_range: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal bg-white"
                >
                  <option value="">Select your age range</option>
                  {AGE_RANGES.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                MBTI <span className="text-[#EF4444]">*</span>
                <select
                  required
                  value={formData.mbti}
                  onChange={(e) =>
                    setFormData({ ...formData, mbti: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal bg-white"
                >
                  <option value="">Select your MBTI</option>
                  {MBTI_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium">
              Instagram
              <input
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                placeholder="@yourusername"
                className="mt-1.5 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal"
              />
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">
                Interests{" "}
                <span className="text-[#9CA3AF] font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggle("interests", i)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      formData.interests.includes(i)
                        ? "bg-[#F47B20] text-white shadow-sm"
                        : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Expectations{" "}
                <span className="text-[#9CA3AF] font-normal">(optional)</span>
              </label>
              <div className="space-y-2">
                {EXPECTATION_OPTIONS.map((exp) => (
                  <label
                    key={exp}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.expectations.includes(exp)}
                      onChange={() => toggle("expectations", exp)}
                      className="w-4 h-4 rounded border-[#D1D5DB] text-[#F47B20] focus:ring-[#F47B20]"
                    />
                    <span className="text-sm text-[#374151]">{exp}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                value={formData.expectation_other}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectation_other: e.target.value,
                  })
                }
                placeholder="Anything else?"
                className="mt-3 w-full px-4 py-3 rounded-xl border border-[#E5E7EB] font-normal text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F47B20] hover:bg-[#D96A15] disabled:bg-[#F47B20]/50 text-white font-semibold rounded-xl transition-all"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={20} /> Save Profile
                </>
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
