"use client";

import { useState } from "react";
import { useShareLink } from "@/app/hooks/useShareLink";

interface ShareLinkGeneratorProps {
  siteId: string;
}

export function ShareLinkGenerator({ siteId }: ShareLinkGeneratorProps) {
  const { share, loading, error, createShare, copyToClipboard } = useShareLink();
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateShare = async () => {
    try {
      await createShare(siteId, expiresInDays, recipientEmail || undefined);
    } catch (err) {
      console.error("Failed to create share:", err);
    }
  };

  const handleCopy = () => {
    if (copyToClipboard()) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold mb-4">Share This Analysis</h3>

      {!share ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Expires In (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={handleCreateShare}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Generate Link"}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Share Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={share.shareUrl || ""}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Link expires: {new Date(share.expiresAt).toLocaleDateString()}</p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Create Another Link
          </button>
        </div>
      )}
    </div>
  );
}
