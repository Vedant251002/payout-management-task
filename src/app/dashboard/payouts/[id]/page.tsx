"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api-client";

interface PayoutDetail {
  _id: string;
  vendor_id: { _id: string; name: string; upi_id?: string; bank_account?: string; ifsc?: string } | null;
  amount: number;
  mode: string;
  note: string | null;
  status: string;
  decision_reason: string | null;
  created_by: { name: string; email: string } | null;
  created_at: string;
  updated_at: string;
}

interface AuditEntry {
  _id: string;
  action: string;
  performed_by: { name: string; email: string; role: string } | null;
  performed_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

export default function PayoutDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [payout, setPayout] = useState<PayoutDetail | null>(null);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchPayout = async () => {
    try {
      const data = await apiRequest(`/api/payouts/${id}`);
      if (data.success) {
        setPayout(data.data.payout);
        setAudits(data.data.audits);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load payout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayout();
  }, [id]);

  const handleAction = async (action: "submit" | "approve" | "reject") => {
    setError("");
    setActionLoading(true);

    try {
      const options: RequestInit = { method: "POST" };
      if (action === "reject") {
        if (!rejectReason.trim()) {
          setError("Rejection reason is required");
          setActionLoading(false);
          return;
        }
        options.body = JSON.stringify({ reason: rejectReason });
      }

      const data = await apiRequest(`/api/payouts/${id}/${action}`, options);

      if (data.success) {
        setShowRejectForm(false);
        setRejectReason("");
        fetchPayout();
      } else {
        setError(data.error || data.details?.reason || "Action failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading payout details...</div>;
  }

  if (!payout) {
    return <div className="text-center py-10 text-red-600">{error || "Payout not found"}</div>;
  }

  const canSubmit = user?.role === "OPS" && payout.status === "Draft";
  const canApprove = user?.role === "FINANCE" && payout.status === "Submitted";
  const canReject = user?.role === "FINANCE" && payout.status === "Submitted";

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        ← Back to Payouts
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Payout Details</h1>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[payout.status]}`}>
            {payout.status}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Vendor</dt>
            <dd className="font-medium text-gray-900">{payout.vendor_id?.name || "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Amount</dt>
            <dd className="font-medium text-gray-900">₹{payout.amount.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Mode</dt>
            <dd className="text-gray-900">{payout.mode}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Created By</dt>
            <dd className="text-gray-900">{payout.created_by?.name || "—"}</dd>
          </div>
          {payout.vendor_id?.upi_id && (
            <div>
              <dt className="text-gray-500">UPI ID</dt>
              <dd className="text-gray-900">{payout.vendor_id.upi_id}</dd>
            </div>
          )}
          {payout.vendor_id?.bank_account && (
            <div>
              <dt className="text-gray-500">Bank Account</dt>
              <dd className="text-gray-900">{payout.vendor_id.bank_account}</dd>
            </div>
          )}
          {payout.note && (
            <div className="md:col-span-2">
              <dt className="text-gray-500">Note</dt>
              <dd className="text-gray-900">{payout.note}</dd>
            </div>
          )}
          {payout.decision_reason && (
            <div className="md:col-span-2">
              <dt className="text-gray-500">Rejection Reason</dt>
              <dd className="text-red-700 font-medium">{payout.decision_reason}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd className="text-gray-900">{new Date(payout.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Last Updated</dt>
            <dd className="text-gray-900">{new Date(payout.updated_at).toLocaleString()}</dd>
          </div>
        </dl>

        {/* Action Buttons */}
        {(canSubmit || canApprove || canReject) && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex gap-3 flex-wrap">
              {canSubmit && (
                <button
                  onClick={() => handleAction("submit")}
                  disabled={actionLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? "Submitting..." : "Submit for Approval"}
                </button>
              )}
              {canApprove && (
                <button
                  onClick={() => handleAction("approve")}
                  disabled={actionLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? "Approving..." : "Approve"}
                </button>
              )}
              {canReject && !showRejectForm && (
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              )}
            </div>

            {showRejectForm && (
              <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200">
                <label className="block text-sm font-medium text-red-800 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  rows={3}
                  placeholder="Provide a reason for rejection..."
                  required
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={actionLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? "Rejecting..." : "Confirm Reject"}
                  </button>
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h2>
        {audits.length === 0 ? (
          <p className="text-gray-500 text-sm">No audit history available.</p>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => (
              <div key={audit._id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-900">
                    <span className="font-medium">{audit.performed_by?.name || "Unknown"}</span>
                    <span className="text-gray-500"> ({audit.performed_by?.role})</span>
                    {" — "}
                    <span className="font-medium">{audit.action}</span>
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(audit.performed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
