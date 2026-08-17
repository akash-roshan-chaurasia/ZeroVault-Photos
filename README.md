# 🛡️ ZeroVault Photos

> **Zero-knowledge photo gallery & file vault powered by client-side RSA-4096 asymmetric encryption & AES-256-GCM.**

ZeroVault Photos bridges client-side zero-knowledge security with a Google Photos style interactive media viewing experience. Store encrypted payload files (`.encrypted.json`) anywhere—on cloud drives, local disks, or cold storage—and view them seamlessly in your browser memory without uploading your private keys or decrypted photos anywhere.

---

## ✨ Features

- 🔒 **Zero-Knowledge Architecture**: All cryptographic operations occur 100% inside your web browser using the native **Web Crypto API** (`window.crypto.subtle`). Private keys and unencrypted file contents **never** touch any cloud server.
- 🖼️ **Google Photos Style Gallery**: Includes full-screen Lightbox slideshows, high-resolution zoom/pan controls, mobile touch swipe gestures, dynamic grid column scaling (2–6 columns), file search, and filtering tabs (Photos vs. Documents).
- 🔐 **Military-Grade Hybrid Cryptography**:
  - **AES-256-GCM**: Fast symmetric encryption for file content and metadata.
  - **RSA-4096 (RSA-OAEP with SHA-256)**: Asymmetric key wrapping for secure key management.
- 📁 **Folder & Bulk Upload**: Scan local directories recursively (`webkitdirectory`) or drag-and-drop multiple `.encrypted.json` files at once.
- ⚡ **Asynchronous Concurrency Queue**: Decrypts multiple files smoothly using an asynchronous worker pool without locking up the browser UI.
- 🌐 **Static Web Export**: 100% static client-side bundle ready for GitHub Pages hosting.

---

## 🔒 Security & Threat Model

| Security Aspect | Implementation Detail |
| :--- | :--- |
| **Symmetric Encryption** | AES-256-GCM with a unique 12-byte random initialization vector (IV) generated per file. |
| **Asymmetric Key Exchange** | RSA-4096 with SHA-256 hashing. |
| **Key Storage** | Private keys reside exclusively in browser memory during decryption. Only public keys can optionally be saved to Supabase for keypair management. |
| **Network Privacy** | Decrypted blobs use local `blob:` URLs in memory and are revoked automatically when closed. |

> ⚠️ **Important Security Note**: Because ZeroVault Photos is strictly zero-knowledge, **losing your private key means your encrypted files cannot be recovered**. Always back up your private key (`private_key.pem`) in a safe location.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 13](https://nextjs.org/) (App Router, Client Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI / Shadcn UI components
- **Icons**: Lucide React
- **Authentication & Key Sync**: [Supabase JS](https://supabase.com/)
- **Deployment**: GitHub Pages (Static Export)

---

## 🚀 Quick Start & Development

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/zerovault-photos.git
   cd zerovault-photos
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Static Build & Local Preview

To build the static HTML/JS bundle for hosting on static servers or GitHub Pages:

```bash
# Generate static export bundle in /out
npm run build

# Preview the static build locally
npm run preview
```

---

## 🌐 Deploying to GitHub Pages

This repository includes an automated GitHub Actions deployment workflow at `.github/workflows/deploy.yml`.

### Instructions:

1. Push your repository to GitHub.
2. Go to repository **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
4. (Optional) Go to **Settings** -> **Secrets and variables** -> **Actions** and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Whenever you push to the `main` branch, GitHub Actions will automatically build and publish the app to your GitHub Pages domain.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.