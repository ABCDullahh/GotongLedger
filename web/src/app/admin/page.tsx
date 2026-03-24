"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Receipt,
  Upload,
  Wallet,
  RefreshCw,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Shield,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  getCampaignCreatedLogs,
  CAMPAIGN_LEDGER_ADDRESS,
  CAMPAIGN_LEDGER_ABI,
  CHAIN_ID,
  type CampaignCreatedEvent,
} from "@/lib/blockchain";
import { formatAddress } from "@/lib/utils";

// Form schemas
const CAMPAIGN_CATEGORIES = [
  "Education",
  "Health",
  "Disaster Relief",
  "Environment",
  "Community",
  "Infrastructure",
  "Other",
] as const;

const createCampaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  treasury: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

const recordExpenseSchema = z.object({
  campaignId: z.string().min(1, "Please select a campaign"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  note: z.string().min(1, "Note is required"),
  cid: z.string().min(1, "Please upload a proof file first"),
});

type CreateCampaignForm = z.infer<typeof createCampaignSchema>;
type RecordExpenseForm = z.infer<typeof recordExpenseSchema>;

const EXPENSE_CATEGORIES = [
  "Logistics",
  "Food",
  "Medical",
  "Education",
  "Shelter",
  "Equipment",
  "Personnel",
  "Other",
];

export default function AdminPage() {
  const { address, isConnected, chain } = useAccount();
  const [campaigns, setCampaigns] = useState<CampaignCreatedEvent[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCid, setUploadedCid] = useState("");
  const [copiedCid, setCopiedCid] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "expense">("create");

  // Create Campaign
  const { data: createHash, isPending: createPending, writeContract: writeCreate } =
    useWriteContract();
  const { isLoading: createConfirming, isSuccess: createSuccess } =
    useWaitForTransactionReceipt({ hash: createHash });

  // Record Expense
  const { data: expenseHash, isPending: expensePending, writeContract: writeExpense } =
    useWriteContract();
  const { isLoading: expenseConfirming, isSuccess: expenseSuccess } =
    useWaitForTransactionReceipt({ hash: expenseHash });

  const createForm = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      treasury: address || "",
    },
  });

  const expenseForm = useForm<RecordExpenseForm>({
    resolver: zodResolver(recordExpenseSchema),
    defaultValues: {
      campaignId: "",
      amount: "",
      category: "",
      note: "",
      cid: "",
    },
  });

  // Update treasury when address changes
  useEffect(() => {
    if (address) {
      createForm.setValue("treasury", address);
    }
  }, [address, createForm]);

  // Update expense form CID when uploaded
  useEffect(() => {
    if (uploadedCid) {
      expenseForm.setValue("cid", uploadedCid);
    }
  }, [uploadedCid, expenseForm]);

  // Fetch campaigns
  const fetchCampaigns = async () => {
    const logs = await getCampaignCreatedLogs();
    setCampaigns(logs);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Handle create success
  useEffect(() => {
    if (createSuccess && createHash) {
      toast.success("Campaign created successfully!");
      const values = createForm.getValues();
      saveCampaignMetadata(values);
      createForm.reset();
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSuccess, createHash]);

  // Handle expense success
  useEffect(() => {
    if (expenseSuccess) {
      toast.success("Expense recorded successfully!");
      expenseForm.reset();
      setUploadedCid("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseSuccess]);

  const saveCampaignMetadata = async (values: CreateCampaignForm) => {
    try {
      const logs = await getCampaignCreatedLogs();
      const latestCampaign = logs[logs.length - 1];

      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: CHAIN_ID,
          contractAddress: CAMPAIGN_LEDGER_ADDRESS,
          campaignId: Number(latestCampaign.campaignId),
          title: values.title,
          description: values.description,
          category: values.category,
        }),
      });
    } catch (error) {
      console.error("Failed to save metadata:", error);
    }
  };

  const handleCreateCampaign = async (values: CreateCampaignForm) => {
    try {
      writeCreate({
        address: CAMPAIGN_LEDGER_ADDRESS,
        abi: CAMPAIGN_LEDGER_ABI,
        functionName: "createCampaign",
        args: [values.treasury as `0x${string}`],
      });
    } catch (error) {
      console.error("Create campaign failed:", error);
      toast.error("Failed to create campaign");
    }
  };

  const handleRecordExpense = async (values: RecordExpenseForm) => {
    try {
      const amountWei = parseEther(values.amount);

      writeExpense({
        address: CAMPAIGN_LEDGER_ADDRESS,
        abi: CAMPAIGN_LEDGER_ABI,
        functionName: "recordExpense",
        args: [
          BigInt(values.campaignId),
          amountWei,
          values.category,
          values.cid,
          values.note,
        ],
      });
    } catch (error) {
      console.error("Record expense failed:", error);
      toast.error("Failed to record expense");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setUploadedCid(data.cid);
        toast.success(`File uploaded! CID: ${data.cid.substring(0, 20)}...`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload file. Is IPFS running?");
    } finally {
      setUploading(false);
    }
  };

  const copyCid = () => {
    navigator.clipboard.writeText(uploadedCid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  const isWrongNetwork = isConnected && chain?.id !== 31337;

  return (
    <div className="min-h-screen bg-[#131314]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Admin" }]} />

        {/* Wrong Network Banner */}
        {isWrongNetwork && (
          <div className="mb-8 flex items-center gap-3 rounded-sm bg-[hsl(0_100%_29%/0.8)] px-5 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#FFB4AB]" />
            <p className="font-body text-sm text-[#FFB4AB]">
              Wrong Network — Please switch to Localhost (Chain ID: 31337) in MetaMask.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-[#E5E2E3] md:text-5xl">
              COMMAND CENTER
            </h1>
            <p className="mt-2 font-body text-[#E3BEBB]">
              Create campaigns and record expenses on the immutable ledger
            </p>
          </div>

          {/* Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#2A2A2B]">
              {isConnected ? (
                <Shield className="h-5 w-5 text-[#AED18D]" />
              ) : (
                <Wallet className="h-5 w-5 text-[#AA8986]" />
              )}
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                {isConnected ? "Verified Authorized Entity" : "Wallet Not Connected"}
              </p>
              {isConnected && address && (
                <p className="font-label text-xs text-[#FFB3AE]">
                  {formatAddress(address, 6)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Warning */}
        {!isConnected && (
          <div className="ghost-border mb-8 flex items-center gap-3 rounded-sm bg-[#1C1B1C] px-5 py-4">
            <Wallet className="h-5 w-5 text-[#AA8986]" />
            <div>
              <p className="font-headline text-sm font-bold text-[#E5E2E3]">Wallet Not Connected</p>
              <p className="font-body text-xs text-[#E3BEBB]">
                Please connect your wallet to access admin features.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-0 border-b border-[hsl(3_24%_30%/0.15)]">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-headline text-sm font-bold uppercase tracking-widest transition-colors ${
              activeTab === "create"
                ? "border-[#FFB3AE] text-[#FFB3AE]"
                : "border-transparent text-[#AA8986] hover:text-[#E3BEBB]"
            }`}
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </button>
          <button
            onClick={() => setActiveTab("expense")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-headline text-sm font-bold uppercase tracking-widest transition-colors ${
              activeTab === "expense"
                ? "border-[#FFB3AE] text-[#FFB3AE]"
                : "border-transparent text-[#AA8986] hover:text-[#E3BEBB]"
            }`}
          >
            <Receipt className="h-4 w-4" />
            Record Expense
          </button>
        </div>

        {/* CREATE CAMPAIGN TAB */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Left: Form */}
            <div className="lg:col-span-3">
              <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6 md:p-8">
                <h2 className="mb-1 font-headline text-lg font-bold text-[#E5E2E3]">
                  Create New Campaign
                </h2>
                <p className="mb-6 font-body text-sm text-[#E3BEBB]">
                  Deploy a new transparent donation campaign on-chain
                </p>

                <form
                  onSubmit={createForm.handleSubmit(handleCreateCampaign)}
                  className="space-y-5"
                >
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="title"
                      className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]"
                    >
                      Campaign Title
                    </label>
                    <input
                      id="title"
                      placeholder="Enter campaign title"
                      {...createForm.register("title")}
                      disabled={!isConnected || createPending || createConfirming}
                      className="w-full rounded-sm border-none bg-[#353436] px-4 py-3 font-body text-sm text-[#E5E2E3] placeholder:text-[#AA8986]/50 focus:outline-none focus:ring-1 focus:ring-[#FFB3AE] disabled:opacity-40"
                    />
                    {createForm.formState.errors.title && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {createForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="description"
                      className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      placeholder="Describe your campaign..."
                      rows={4}
                      {...createForm.register("description")}
                      disabled={!isConnected || createPending || createConfirming}
                      className="w-full resize-none rounded-sm border-none bg-[#353436] px-4 py-3 font-body text-sm text-[#E5E2E3] placeholder:text-[#AA8986]/50 focus:outline-none focus:ring-1 focus:ring-[#FFB3AE] disabled:opacity-40"
                    />
                    {createForm.formState.errors.description && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {createForm.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="category"
                      className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      {...createForm.register("category")}
                      disabled={!isConnected || createPending || createConfirming}
                      className="w-full rounded-sm border-none bg-[#353436] px-4 py-3 font-label text-sm text-[#E5E2E3] focus:outline-none focus:ring-1 focus:ring-[#FFB3AE] disabled:opacity-40"
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {CAMPAIGN_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {createForm.formState.errors.category && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {createForm.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  {/* Treasury Address */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="treasury"
                      className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]"
                    >
                      Treasury Address
                    </label>
                    <input
                      id="treasury"
                      placeholder="0x..."
                      {...createForm.register("treasury")}
                      disabled={!isConnected || createPending || createConfirming}
                      className="w-full rounded-sm border-none bg-[#353436] px-4 py-3 font-label text-sm text-[#E5E2E3] placeholder:text-[#AA8986]/50 focus:outline-none focus:ring-1 focus:ring-[#FFB3AE] disabled:opacity-40"
                    />
                    <p className="font-body text-xs text-[#AA8986]">
                      Donations will be forwarded to this address
                    </p>
                    {createForm.formState.errors.treasury && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {createForm.formState.errors.treasury.message}
                      </p>
                    )}
                  </div>

                  {/* Wallet Connection Status */}
                  <div className="flex items-center gap-2 rounded-sm bg-[#0E0E0F] px-4 py-2.5">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isConnected ? "bg-[#AED18D]" : "bg-[#AA8986]"
                      }`}
                    />
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                      {isConnected ? "Wallet Connected" : "Wallet Disconnected"}
                    </span>
                  </div>

                  {/* Deploy Button */}
                  <button
                    type="submit"
                    disabled={!isConnected || createPending || createConfirming || isWrongNetwork}
                    className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#FF5555] px-5 py-3.5 font-headline text-sm font-bold uppercase tracking-widest text-[#131314] transition-colors hover:bg-[#FFB3AE] disabled:opacity-40 disabled:hover:bg-[#FF5555]"
                  >
                    {createPending || createConfirming ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {createPending ? "Confirm in Wallet..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Deploy Campaign
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Immutable Governance Card */}
            <div className="lg:col-span-2">
              <div className="ghost-border rounded-sm bg-[#2A2A2B] p-6 md:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#FFB3AE]" />
                  <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-[#E5E2E3]">
                    Immutable Governance
                  </h3>
                </div>
                <div className="space-y-4 font-body text-sm leading-relaxed text-[#E3BEBB]">
                  <p>
                    Every campaign deployed through this interface is recorded as an
                    immutable smart contract event on the blockchain.
                  </p>
                  <p>
                    Once created, the campaign cannot be altered or deleted. The treasury
                    address is permanently bound to the campaign, ensuring all donations
                    flow to the designated recipient.
                  </p>
                  <p>
                    All metadata (title, description) is also saved off-chain for
                    display purposes, but the on-chain record is the authoritative
                    source of truth.
                  </p>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-[#AA8986]">
                    <ChevronRight className="h-3 w-3 text-[#FFB3AE]" />
                    <span className="font-label text-[10px] uppercase tracking-[0.2em]">
                      On-chain immutability
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#AA8986]">
                    <ChevronRight className="h-3 w-3 text-[#FFB3AE]" />
                    <span className="font-label text-[10px] uppercase tracking-[0.2em]">
                      Transparent audit trail
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#AA8986]">
                    <ChevronRight className="h-3 w-3 text-[#FFB3AE]" />
                    <span className="font-label text-[10px] uppercase tracking-[0.2em]">
                      Verifiable by anyone
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECORD EXPENSE TAB */}
        {activeTab === "expense" && (
          <div>
            <h2 className="mb-1 font-headline text-2xl font-bold tracking-tight text-[#E5E2E3]">
              Record On-Chain Expense
            </h2>
            <p className="mb-8 font-body text-sm text-[#E3BEBB]">
              Upload proof and commit the expense record to the blockchain
            </p>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left: IPFS Upload Zone */}
              <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6 md:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-[#FFB3AE]" />
                  <h3 className="font-headline text-sm font-bold text-[#E5E2E3]">
                    Upload Proof to IPFS
                  </h3>
                </div>
                <p className="mb-5 font-body text-xs text-[#E3BEBB]">
                  Upload PDF/JPG/PNG as expense proof (max 10MB)
                </p>

                {/* Drop Zone */}
                <div className="group relative rounded-sm border border-dashed border-[hsl(3_24%_30%/0.30)] p-10 text-center transition-colors hover:border-[hsl(0_100%_83%/0.40)]">
                  <input
                    type="file"
                    id="proof-file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="proof-file"
                    className="flex cursor-pointer flex-col items-center gap-3"
                  >
                    {uploading ? (
                      <RefreshCw className="h-10 w-10 animate-spin text-[#AA8986]" />
                    ) : (
                      <FileText className="h-10 w-10 text-[#AA8986] transition-colors group-hover:text-[#FFB3AE]" />
                    )}
                    <span className="font-body text-sm text-[#AA8986]">
                      {uploading ? "Uploading to IPFS..." : "Click to upload or drag file here"}
                    </span>
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#5A403E]">
                      PDF / JPG / PNG
                    </span>
                  </label>
                </div>

                {/* Uploaded CID */}
                {uploadedCid && (
                  <div className="mt-5 rounded-sm bg-[#0E0E0F] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                        IPFS CID
                      </span>
                      <button
                        onClick={copyCid}
                        className="rounded-sm p-1.5 transition-colors hover:bg-[#2A2A2B]"
                      >
                        {copiedCid ? (
                          <Check className="h-3.5 w-3.5 text-[#AED18D]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-[#AA8986]" />
                        )}
                      </button>
                    </div>
                    <code className="block break-all font-label text-xs text-[#E5E2E3]">
                      {uploadedCid}
                    </code>
                    <a
                      href={`http://127.0.0.1:8080/ipfs/${uploadedCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-label text-xs text-[#FFB3AE] transition-colors hover:text-[#FF5555]"
                    >
                      View on IPFS Gateway
                    </a>
                  </div>
                )}
              </div>

              {/* Right: Expense Form */}
              <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6 md:p-8">
                <h3 className="mb-1 font-headline text-sm font-bold text-[#E5E2E3]">
                  Expense Details
                </h3>
                <p className="mb-5 font-body text-xs text-[#E3BEBB]">
                  Record an expense with proof on the blockchain
                </p>

                <form
                  onSubmit={expenseForm.handleSubmit(handleRecordExpense)}
                  className="space-y-4"
                >
                  {/* Campaign */}
                  <div className="space-y-1.5">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                      Campaign
                    </label>
                    <Select
                      onValueChange={(value) => expenseForm.setValue("campaignId", value)}
                      disabled={!isConnected || expensePending || expenseConfirming}
                    >
                      <SelectTrigger className="w-full rounded-sm border-none bg-[#353436] px-4 py-3 font-body text-sm text-[#E5E2E3] focus:ring-1 focus:ring-[#FFB3AE]">
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm border-[hsl(3_24%_30%/0.15)] bg-[#2A2A2B]">
                        {campaigns.map((c) => (
                          <SelectItem
                            key={c.campaignId.toString()}
                            value={c.campaignId.toString()}
                            className="font-body text-sm text-[#E5E2E3] focus:bg-[#353436]"
                          >
                            Campaign #{c.campaignId.toString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {expenseForm.formState.errors.campaignId && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {expenseForm.formState.errors.campaignId.message}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="amount"
                      className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]"
                    >
                      Amount (ETH)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.005"
                      {...expenseForm.register("amount")}
                      disabled={!isConnected || expensePending || expenseConfirming}
                      className="w-full rounded-sm border-none bg-[#353436] px-4 py-3 font-label text-sm text-[#E5E2E3] placeholder:text-[#AA8986]/50 focus:outline-none focus:ring-1 focus:ring-[#FFB3AE] disabled:opacity-40"
                    />
                    {expenseForm.formState.errors.amount && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {expenseForm.formState.errors.amount.message}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                      Category
                    </label>
                    <Select
                      onValueChange={(value) => expenseForm.setValue("category", value)}
                      disabled={!isConnected || expensePending || expenseConfirming}
                    >
                      <SelectTrigger className="w-full rounded-sm border-none bg-[#353436] px-4 py-3 font-body text-sm text-[#E5E2E3] focus:ring-1 focus:ring-[#FFB3AE]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm border-[hsl(3_24%_30%/0.15)] bg-[#2A2A2B]">
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="font-body text-sm text-[#E5E2E3] focus:bg-[#353436]"
                          >
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {expenseForm.formState.errors.category && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {expenseForm.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="note"
                      className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]"
                    >
                      Note
                    </label>
                    <textarea
                      id="note"
                      placeholder="Describe this expense..."
                      rows={3}
                      {...expenseForm.register("note")}
                      disabled={!isConnected || expensePending || expenseConfirming}
                      className="w-full resize-none rounded-sm border-none bg-[#353436] px-4 py-3 font-body text-sm text-[#E5E2E3] placeholder:text-[#AA8986]/50 focus:outline-none focus:ring-1 focus:ring-[#FFB3AE] disabled:opacity-40"
                    />
                    {expenseForm.formState.errors.note && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {expenseForm.formState.errors.note.message}
                      </p>
                    )}
                  </div>

                  {/* CID */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="cid"
                      className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]"
                    >
                      Proof CID
                    </label>
                    <input
                      id="cid"
                      placeholder="Upload a file first"
                      value={uploadedCid}
                      readOnly
                      {...expenseForm.register("cid")}
                      className="w-full rounded-sm border-none bg-[#0E0E0F] px-4 py-3 font-label text-xs text-[#AA8986] focus:outline-none"
                    />
                    {expenseForm.formState.errors.cid && (
                      <p className="font-label text-xs text-[#FFB4AB]">
                        {expenseForm.formState.errors.cid.message}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={
                      !isConnected ||
                      expensePending ||
                      expenseConfirming ||
                      !uploadedCid ||
                      isWrongNetwork
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#FF5555] px-5 py-3.5 font-headline text-sm font-bold uppercase tracking-widest text-[#131314] transition-colors hover:bg-[#FFB3AE] disabled:opacity-40 disabled:hover:bg-[#FF5555]"
                  >
                    {expensePending || expenseConfirming ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {expensePending ? "Confirm in Wallet..." : "Recording..."}
                      </>
                    ) : (
                      <>
                        <Receipt className="h-4 w-4" />
                        Commit Record to Chain
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
