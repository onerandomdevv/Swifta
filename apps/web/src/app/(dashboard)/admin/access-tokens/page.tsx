"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AccessToken {
  id: string;
  role: "OPERATOR" | "SUPPORT";
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: { firstName: string; lastName: string; email: string };
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const groups: string[] = [];
  for (let g = 0; g < 6; g++) {
    let group = "";
    for (let i = 0; i < 4; i++) {
      group += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    groups.push(group);
  }
  return groups.join("-");
}

export default function AccessTokensPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [createModal, setCreateModal] = useState<{
    role: "OPERATOR" | "SUPPORT";
  } | null>(null);
  const [generatedPlainToken, setGeneratedPlainToken] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const { data: tokens, isLoading } = useQuery<AccessToken[]>({
    queryKey: ["admin", "access-tokens"],
    queryFn: () => apiClient.get("/admin/access-tokens"),
  });

  const pendingTokenRef = React.useRef<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: { role: string; token: string }) =>
      apiClient.post("/admin/access-tokens", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "access-tokens"] });
      setGeneratedPlainToken(pendingTokenRef.current);
      toast.success("Access token created successfully.");
    },
    onError: (err: any) => {
      // Reset the pending token
      pendingTokenRef.current = null;
      toast.error(err?.message || "Failed to create token.");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (tokenId: string) =>
      apiClient.delete(`/admin/access-tokens/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "access-tokens"] });
      toast.success("Token revoked.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to revoke token.");
    },
  });

  const operatorToken = tokens?.find(
    (t) => t.role === "OPERATOR" && t.isActive,
  );
  const supportToken = tokens?.find((t) => t.role === "SUPPORT" && t.isActive);

  const handleCreate = () => {
    if (!createModal) return;
    const plainToken = generateToken();
    pendingTokenRef.current = plainToken;
    createMutation.mutate({
      role: createModal.role,
      token: plainToken,
    });
  };

  const closeModal = () => {
    setCreateModal(null);
    setGeneratedPlainToken(null);
    setCopied(false);
  };

  const TokenCard = ({
    role,
    token,
    color,
  }: {
    role: "OPERATOR" | "SUPPORT";
    token?: AccessToken;
    color: string;
  }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              role === "OPERATOR"
                ? "bg-orange-50 dark:bg-orange-900/20"
                : "bg-blue-50 dark:bg-blue-900/20"
            }`}
          >
            <span
              className={`material-symbols-outlined text-xl ${
                role === "OPERATOR" ? "text-orange-500" : "text-blue-500"
              }`}
            >
              {role === "OPERATOR" ? "engineering" : "support_agent"}
            </span>
          </div>
          <div>
            <h3 className="font-black text-navy-dark dark:text-white uppercase tracking-wider text-sm">
              {role} Token
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {token ? "Active" : "No token set"}
            </p>
          </div>
        </div>
        {token && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
            Active
          </span>
        )}
      </div>

      {token && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 space-y-1">
          <p className="text-xs text-slate-500">
            <strong>Label:</strong> {token.label}
          </p>
          <p className="text-xs text-slate-500">
            <strong>Created:</strong>{" "}
            {new Date(token.createdAt).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-slate-500">
            <strong>By:</strong>{" "}
            {token.creator.firstName || token.creator.lastName
              ? `${token.creator.firstName} ${token.creator.lastName}`
              : token.creator.email}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          size="sm"
          className="bg-brand hover:bg-neon-cyan text-navy-dark font-bold tracking-wider uppercase text-xs shadow-md"
          onClick={() => {
            setCreateModal({ role });
            setGeneratedPlainToken(null);
            setCopied(false);
          }}
        >
          <span className="material-symbols-outlined text-[16px] mr-1">
            refresh
          </span>
          {token ? "Rotate" : "Generate"}
        </Button>
        {token && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold tracking-wider uppercase text-xs"
            onClick={() => revokeMutation.mutate(token.id)}
            disabled={revokeMutation.isPending}
          >
            <span className="material-symbols-outlined text-[16px] mr-1">
              block
            </span>
            Revoke
          </Button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-brand">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white">
          Access Token Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Generate and manage shared access tokens for Operator and Support
          staff.
        </p>
      </div>

      {/* Info */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-500 mt-0.5">
          warning
        </span>
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            Security Notice
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
            Plaintext tokens are shown only once when created. Tokens are stored
            as bcrypt hashes. Share tokens securely with your team.
          </p>
        </div>
      </div>

      {/* Token Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <TokenCard role="OPERATOR" token={operatorToken} color="orange" />
        <TokenCard role="SUPPORT" token={supportToken} color="blue" />
      </div>

      {/* Token Activity Log */}
      {tokens && tokens.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
                Token History
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {tokens.length} token{tokens.length !== 1 ? "s" : ""} generated
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Created</div>
              <div className="col-span-3">Created By</div>
              <div className="col-span-2">Action</div>
            </div>

            {tokens.map((t) => (
              <div
                key={t.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center transition-colors ${
                  !t.isActive ? "opacity-50" : ""
                }`}
              >
                {/* Role */}
                <div className="md:col-span-2 flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-sm ${
                      t.role === "OPERATOR"
                        ? "text-orange-500"
                        : "text-blue-500"
                    }`}
                  >
                    {t.role === "OPERATOR" ? "engineering" : "support_agent"}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-navy-dark dark:text-white">
                    {t.role}
                  </span>
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  {t.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800">
                      Revoked
                    </span>
                  )}
                </div>

                {/* Created */}
                <div className="md:col-span-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {" · "}
                    {new Date(t.createdAt).toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Created By */}
                <div className="md:col-span-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {t.creator.firstName || t.creator.lastName
                      ? `${t.creator.firstName} ${t.creator.lastName}`
                      : t.creator.email}
                  </p>
                </div>

                {/* Action */}
                <div className="md:col-span-2">
                  {t.isActive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold tracking-wider uppercase text-[10px] h-7 px-2"
                      onClick={() => revokeMutation.mutate(t.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <span className="material-symbols-outlined text-[14px] mr-0.5">
                        block
                      </span>
                      Revoke
                    </Button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      —
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Rotate Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
                  {generatedPlainToken
                    ? "Token Generated"
                    : `Generate ${createModal.role} Token`}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {generatedPlainToken
                    ? "Copy and share securely"
                    : "This will replace any existing active token"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">
                  close
                </span>
              </button>
            </div>

            {!generatedPlainToken ? (
              <>
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Token format:{" "}
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      A7K2-XP9W-M3B6-QT5R-J8V4-L2N6
                    </span>
                  </p>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Are you sure you want to generate a new token? The old
                      token will be immediately revoked.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Button
                    variant="ghost"
                    onClick={closeModal}
                    className="font-bold tracking-widest uppercase text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    className="bg-brand hover:bg-neon-cyan text-navy-dark font-black tracking-widest uppercase shadow-lg px-6"
                  >
                    {createMutation.isPending
                      ? "Generating..."
                      : "Generate Token"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    This is the access token for your{" "}
                    <strong>{createModal.role}</strong> staff. It will{" "}
                    <strong>only be shown once</strong>.
                  </p>
                  <div className="relative">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-brand font-mono text-sm text-navy-dark dark:text-white break-all tracking-wider">
                      {generatedPlainToken}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPlainToken);
                        setCopied(true);
                        toast.success("Token copied to clipboard.");
                      }}
                      className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copied ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                </div>
                <Button
                  onClick={closeModal}
                  className="w-full bg-brand hover:bg-neon-cyan text-navy-dark font-black tracking-widest uppercase shadow-lg"
                >
                  {copied ? "Done" : "I've Copied the Token"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
