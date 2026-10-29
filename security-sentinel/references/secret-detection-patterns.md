# Secret Detection Patterns & Entropy Analysis Reference

This reference documents exact regular expression patterns, entropy calculation methods, and false-positive suppression rules utilized by Security Sentinel to detect exposed credentials in codebases.

---

## 1. Provider Pattern Catalog

| Provider / Secret Type | Pattern Name | Regular Expression | Notes |
| :--- | :--- | :--- | :--- |
| **AWS** | Access Key ID | `\bAKIA[0-9A-Z]{16}\b` | 20-character identifier starting with `AKIA` |
| **AWS** | Secret Access Key | `\b(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])\b` | Requires entropy or context check (`aws_secret_access_key`) |
| **GitHub** | Personal Access Token | `\bghp_[a-zA-Z0-9]{36}\b` | Classic personal access tokens |
| **GitHub** | Fine-Grained PAT | `\bgithub_pat_[a-zA-Z0-9_]{22,82}\b` | Fine-grained tokens starting with `github_pat_` |
| **GitHub** | OAuth Access Token | `\bgho_[a-zA-Z0-9]{36}\b` | OAuth tokens |
| **Anthropic** | API Key | `\bsk-ant-[a-zA-Z0-9_-]{20,}\b` | Anthropic Claude API keys |
| **OpenAI** | API Key | `\bsk-(?:proj-)?[a-zA-Z0-9_-]{20,}\b` | OpenAI project and legacy secret keys |
| **Google** | Cloud API Key | `\bAIzaSy[a-zA-Z0-9_-]{33}\b` | Gemini & Google Cloud API key pattern |
| **Stripe** | Standard Secret Key | `\bsk_live_[0-9a-zA-Z]{24}\b` | Live operational API secret key |
| **Stripe** | Restricted API Key | `\brk_live_[0-9a-zA-Z]{24}\b` | Restricted operational key |
| **Slack** | Bot / User Token | `\bxox[baprs]-[0-9a-zA-Z]{10,48}\b` | Slack bot and user OAuth tokens |
| **Twilio** | API Key / Auth Token | `\bSK[0-9a-fA-F]{32}\b` | Twilio API Key SID |
| **SendGrid** | API Key | `\bSG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}\b` | SendGrid Mail API token |
| **Private Keys** | PEM Private Key | `-----BEGIN (?:RSA \|EC \|DSA \|OPENSSH )?PRIVATE KEY-----` | Unencrypted private keys |
| **Database** | Postgres Connection | `postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@[^\s\/]+` | Contains embedded user:password credentials |
| **Database** | MongoDB Connection | `mongodb(?:\+srv)?:\/\/[^\s:]+:[^\s@]+@[^\s\/]+` | Contains embedded user:password credentials |
| **Database** | MySQL Connection | `mysql:\/\/[^\s:]+:[^\s@]+@[^\s\/]+` | Contains embedded user:password credentials |
| **JWT** | Hardcoded Bearer JWT | `\beyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b` | Common JWT token structure |

---

## 2. Shannon Entropy Analysis

For catching arbitrary high-entropy secrets (e.g. hex tokens, base64 strings) where explicit prefixes do not exist:

### Mathematical Formula:
$$H(X) = - \sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$

Where $P(x_i)$ is the frequency of character $x_i$ divided by total length.

### Implementation Example (Node.js):
```javascript
function calculateShannonEntropy(str) {
  const len = str.length;
  if (len === 0) return 0;

  const frequencies = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

// Typical Thresholds:
// Base64 secret (length >= 32): Entropy > 4.5
// Hex string (length >= 32): Entropy > 3.0
```

---

## 3. False Positive Suppression Rules

To avoid blocking legitimate developer activity, exclude patterns that meet these criteria:

1. **Known Documentation Placeholders**:
   - `AKIAIOSFODNN7EXAMPLE` (AWS official dummy key)
   - `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` (AWS official secret dummy)
   - Strings containing `${...}`, `<YOUR_API_KEY>`, `your_token_here`, `placeholder`, `fake_key`.

2. **Test Files and Fixtures**:
   - Files matching `**/*.test.ts`, `**/*.spec.js`, `**/test_*.py`, `**/__tests__/**`.
   - Files named `.env.example`, `.env.sample`, `.env.template`.

3. **Database Placeholders**:
   - `postgres://user:password@localhost:5432/dbname`
   - `mongodb://username:password@127.0.0.1:27017/app`

---

## 4. Git and Environment Configuration Best Practices

### Essential `.gitignore` Directives:
```gitignore
# Environment files
.env
.env.local
.env.*.local
*.env

# Secrets & Private Keys
*.pem
*.key
*.p12
*.pfx
id_rsa
id_ed25519

# Cloud Provider Credentials
.aws/
credentials.json
service-account*.json
```

### Pre-commit Integration:
Use standard tools alongside Sentinel in your local workflow:
- **Gitleaks**: `gitleaks protect --staged -v`
- **Trufflehog**: `trufflehog git file://. --since-commit HEAD`
