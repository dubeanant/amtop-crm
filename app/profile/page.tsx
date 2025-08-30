"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; isCurrent?: boolean }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Initialize local state from user
  useEffect(() => {
    setDisplayName(user?.displayName || "");
  }, [user?.displayName]);

  // Fetch organizations for user (for display only)
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user?.email) return;
      try {
        setLoadingOrgs(true);
        const res = await fetch(`/api/users/organizations?userEmail=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (data?.success) {
          setOrgs(
            (data.organizations || []).map((o: any) => ({ id: o.id, name: o.name, isCurrent: o.isCurrent }))
          );
        }
      } catch (e) {
        // no-op UI-friendly
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrganizations();
  }, [user?.email]);

  const currentOrgName = useMemo(() => {
    if (!orgs?.length) return user?.organizationId || "-";
    const current = orgs.find((o) => o.isCurrent);
    return current?.name || user?.organizationId || "-";
  }, [orgs, user?.organizationId]);

  const handleSave = async () => {
    if (!user?.uid) return;
    try {
      setIsSaving(true);
      setSaveMsg(null);
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName?.trim() || "" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to update profile");
      }
      await refreshUser();
      setSaveMsg("Profile updated successfully");
    } catch (err: any) {
      setSaveMsg(err?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal information</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar + Basic info */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-semibold shadow">
                {(user?.displayName?.charAt(0) || user?.email?.charAt(0) || "?")?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-gray-500">Signed in as</p>
                <p className="text-base font-medium text-gray-900 break-all">{user?.email}</p>
              </div>
            </div>

            {/* Role and Organization */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{user?.role}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">Current Organization</p>
                <p className="text-sm font-medium text-gray-900 truncate">{currentOrgName}</p>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your display name"
              />
              <p className="mt-1 text-xs text-gray-500">Shown in the app header and activity.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="text"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 text-white font-medium rounded-lg shadow-sm transition disabled:cursor-not-allowed ${
                isSaving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>

        {/* Organizations list */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizations</h2>
          {loadingOrgs ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : orgs?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {orgs.map((o) => (
                <div key={o.id} className={`p-4 rounded-lg border ${o.isCurrent ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{o.name}</p>
                      {o.isCurrent ? (
                        <p className="text-xs text-blue-700 mt-1">Current</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Member</p>
                      )}
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                      o.isCurrent ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}>
                      {o.name?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No organizations found.</p>
          )}
          <p className="text-xs text-gray-500 mt-3">To manage organizations, go to Settings.</p>
        </div>
      </div>
    </Layout>
  );
}