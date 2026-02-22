import React, { useRef, useState } from "react";
import { OnboardingFormData } from "./types";
import { uploadDocument } from "@/lib/api/merchant.api";

interface Props {
  formData: OnboardingFormData;
  updateForm: (updates: Partial<OnboardingFormData>) => void;
}

export function KycStep({ formData, updateForm }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await uploadDocument(file);
      updateForm({ cacDocumentUrl: res.url });
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
      // Reset input so the same file could be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          Identity & KYC
        </h3>
        <p className="text-slate-500 font-bold text-sm leading-relaxed">
          Official business registration details for trust verification.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            CAC Registration Number
          </label>
          <input
            value={formData.cacNumber}
            onChange={(e) => updateForm({ cacNumber: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="RC-1234567"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Tax Identification Number (TIN)
          </label>
          <input
            value={formData.taxId}
            onChange={(e) => updateForm({ taxId: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="23145678-0001"
          />
        </div>

        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`p-8 border-2 border-dashed rounded-[2rem] transition-all cursor-pointer ${
            uploadError
              ? "border-red-300 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20"
              : formData.cacDocumentUrl
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-navy-dark"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className={`size-16 rounded-2xl border flex items-center justify-center shadow-sm ${
                formData.cacDocumentUrl
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
              }`}
            >
              {isUploading ? (
                <span className="material-symbols-outlined text-3xl text-navy-dark dark:text-white animate-spin">
                  progress_activity
                </span>
              ) : formData.cacDocumentUrl ? (
                <span className="material-symbols-outlined text-3xl text-white">
                  check_circle
                </span>
              ) : (
                <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-navy-dark transition-colors">
                  upload_file
                </span>
              )}
            </div>
            <div className="text-center">
              <p
                className={`text-[10px] font-black uppercase tracking-widest ${
                  uploadError
                    ? "text-red-500"
                    : formData.cacDocumentUrl
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-navy-dark dark:text-white"
                }`}
              >
                {isUploading
                  ? "Uploading..."
                  : formData.cacDocumentUrl
                    ? "Document Uploaded"
                    : "Upload CAC Document"}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                {uploadError
                  ? uploadError
                  : formData.cacDocumentUrl
                    ? "Click to replace file"
                    : "PDF, JPG or PNG (MAX. 5MB)"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
