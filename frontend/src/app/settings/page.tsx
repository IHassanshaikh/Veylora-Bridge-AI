"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Mail, Lock, CreditCard, Camera, CheckCircle2, 
  AlertCircle, RefreshCw, ArrowRight, ShieldCheck, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, updateUser, refreshUser } = useAuth();

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status & Feedback State
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPaypalEmail(user.paypal_email || user.email || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  // Handle local image file upload for avatar photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Profile Information Changes to SQLite Database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError("Full Name cannot be empty.");
      return;
    }
    if (!email.trim()) {
      setProfileError("Email address cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        paypal_email: paypalEmail.trim().toLowerCase(),
        avatar_url: avatarUrl
      }, user?.id);

      updateUser(res.user);
      setProfileSuccess("Profile details updated and saved to database successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change to SQLite Database
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match. Please verify.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      }, user?.id);

      setPasswordSuccess("Password updated and hashed securely with bcrypt in database.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password. Verify your current password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const isVerified = user?.is_verified || user?.verification_status === "VERIFIED";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16 font-sans">
      {/* Page Title (Big, Black, Bold Typography) */}
      <div className="space-y-1.5 border-b-2 border-black pb-5">
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">
          User Settings &amp; Security
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm font-medium text-slate-700">
          Manage your personal profile, photo, PayPal credentials, and security settings.
        </p>
      </div>

      {/* Identity Verification Summary Box */}
      <div className="p-5 rounded-2xl bg-white border-2 border-black shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isVerified ? (
            <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <div className="text-base font-extrabold text-black">
              {isVerified ? "IDENTITY VERIFIED (KYC APPROVED)" : "IDENTITY VERIFICATION REQUIRED"}
            </div>
            <div className="text-xs font-semibold text-slate-600">
              {isVerified 
                ? "Your official government ID is on file and compliant with PayPal Payouts."
                : "Submit your government ID card and photo to unlock escrow releases."}
            </div>
          </div>
        </div>

        <Link
          href="/verification"
          className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-extrabold text-xs tracking-wide transition-all shadow-xs inline-flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>{isVerified ? "View Verification" : "Complete Verification →"}</span>
        </Link>
      </div>

      {/* Section 1: Profile Photo & Information */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border-2 border-black space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-extrabold text-black tracking-tight">
              Personal Profile &amp; Photo
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Updates your identity across all project contracts, escrow audit trails, and counterparties.
            </p>
          </div>

          {/* Profile Success / Error Alerts */}
          {profileSuccess && (
            <div className="p-4 rounded-xl bg-white border-2 border-black flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-black shrink-0 mt-0.5" />
              <div className="text-sm font-bold text-black">{profileSuccess}</div>
            </div>
          )}

          {profileError && (
            <div className="p-4 rounded-xl bg-white border-2 border-black flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-black shrink-0 mt-0.5" />
              <div className="text-sm font-bold text-black">{profileError}</div>
            </div>
          )}

          {/* Photo Upload Area */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "User Avatar"}
                  className="h-24 w-24 rounded-full object-cover border-2 border-black shadow-xs"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-black flex items-center justify-center text-white text-3xl font-extrabold">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="text-sm font-extrabold text-black">Profile Avatar Photo</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Upload a real JPG, PNG, or WEBP picture. This is saved to your account and shown in agreements.
              </p>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <label className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs">
                  <span>Upload New Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-black font-bold text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                Full Legal Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@acmestudio.io"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                PayPal Payouts &amp; Escrow Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="e.g. alex@acmestudio.io"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-black focus:outline-none focus:border-black"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                This is the email address used to authorize PayPal Orders v2 escrow deposits and receive automated PayPal Payouts.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-extrabold text-xs tracking-wide transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Saving Profile to Database...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Section 2: Security & Password Change */}
      <form onSubmit={handleSavePassword} className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border-2 border-black space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-extrabold text-black tracking-tight">
              Change Account Password
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Securely update your login credentials. Passwords are encrypted with bcrypt and stored in the database.
            </p>
          </div>

          {/* Password Success / Error Alerts */}
          {passwordSuccess && (
            <div className="p-4 rounded-xl bg-white border-2 border-black flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-black shrink-0 mt-0.5" />
              <div className="text-sm font-bold text-black">{passwordSuccess}</div>
            </div>
          )}

          {passwordError && (
            <div className="p-4 rounded-xl bg-white border-2 border-black flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-black shrink-0 mt-0.5" />
              <div className="text-sm font-bold text-black">{passwordError}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 chars"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-extrabold text-xs tracking-wide transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Updating Password in Database...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

