# Encryption

---
Document ID: SEC-005
Status: Draft
Version: 1.0.0
Owner: Security
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [SEC-001, DOM-SEG-001]
---

## 1. Encryption in Transit

### 1.1 TLS Configuration

| Property | Value |
|---|---|
| Protocol | TLS 1.3 |
| Certificate | Let's Encrypt (free) |
| Key Exchange | ECDHE |
| Cipher Suite | AES-256-GCM |

### 1.2 HTTPS Enforcement

All HTTP requests are redirected to HTTPS:

```nginx
server {
    listen 80;
    server_name clinica.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name clinica.com;
    
    ssl_certificate /etc/letsencrypt/live/clinica.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clinica.com/privkey.pem;
    
    ssl_protocols TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512;
}
```

### 1.3 Security Headers

| Header | Value | Description |
|---|---|---|
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Force HTTPS |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | Enable XSS filter |
| Content-Security-Policy | default-src 'self' | Restrict resources |

---

## 2. Encryption at Rest

### 2.1 Database Encryption

| Property | Value |
|---|---|
| Engine | MySQL 8.x |
| Encryption | InnoDB tablespace encryption |
| Key Management | MySQL keyring plugin |

**MySQL Configuration:**

```ini
[mysqld]
early-plugin-load=keyring_file.so
keyring_file_data=/var/lib/mysql-keyring/keyring
innodb_encrypt_tables=ON
innodb_encrypt_log=ON
```

### 2.2 File System Encryption

| Location | Method |
|---|---|
| PDF storage | AES-256 encryption |
| Signature images | AES-256 encryption |
| Backups | GPG encryption |

### 2.3 Sensitive Fields

| Field | Encryption Method |
|---|---|
| Password | bcrypt (one-way) |
| DNI | AES-256 (reversible) |
| Phone | AES-256 (reversible) |
| Medical data | AES-256 (reversible) |

---

## 3. Sensitive Data Classification

| Classification | Examples | Protection |
|---|---|---|
| PII | Name, DNI, Phone | Encrypt at rest |
| Medical | Diagnoses, Treatments | Encrypt at rest |
| Credentials | Passwords, Tokens | Hash/Bcrypt |
| Documents | PDFs, Signatures | Encrypted storage |
| System | Config, Logs | Access control |

### 3.1 Data Handling Rules

| Data Type | Storage | Transmission | Access |
|---|---|---|---|
| Password | bcrypt hash | Never | System only |
| DNI | Encrypted | HTTPS | Authorized users |
| Phone | Encrypted | HTTPS | Authorized users |
| Email | Plain text | HTTPS | Authorized users |
| Medical history | Encrypted | HTTPS | Medical staff |
| Documents | Encrypted | HTTPS | Authorized users |

---

## 4. Password Hashing

### 4.1 bcrypt Configuration

| Property | Value |
|---|---|
| Algorithm | bcrypt |
| Salt rounds | 12 |
| Output length | 60 characters |

### 4.2 Implementation

```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordUtil {
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
    
    public static String hash(String password) {
        return encoder.encode(password);
    }
    
    public static boolean verify(String password, String hashed) {
        return encoder.matches(password, hashed);
    }
}
```

### 4.3 Why bcrypt

| Reason | Explanation |
|---|---|
| Salt | Automatic random salt |
| Slow | Prevents brute force |
| Adaptive | Rounds can be increased |
| Standard | Industry accepted |

### 4.4 Password Examples

| Password | bcrypt Hash |
|---|---|
| Password123 | $2a$12$LJ3m4ys3Lz0Zq5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q |
| Admin123 | $2a$12$K9g8f7e6d5c4b3a2Z1Y0X9W8V7U6T5S4R3Q2P1O0N9M8L7K6 |

---

## 5. API Key Management

### 5.1 Current Implementation

| Property | Value |
|---|---|
| Authentication | JWT only |
| API Keys | Not used |
| External APIs | Not applicable (MVP) |

### 5.2 Future Considerations

| API | Purpose | Key Storage |
|---|---|---|
| Email SMTP | Gmail | Environment variable |
| PDF Service | iText | N/A (local) |
| Backup Service | Custom | Environment variable |

### 5.3 Key Storage

```bash
# Environment variables
export JWT_SECRET=your-secret-key-here
export SMTP_PASSWORD=your-app-password
export DB_PASSWORD=your-db-password
```

---

## 6. File Encryption

### 6.1 PDF Encryption

| Property | Value |
|---|---|
| Algorithm | AES-256 |
| Access | Password protected |
| Integrity | SHA256 hash |

### 6.2 Signature Encryption

| Property | Value |
|---|---|
| Storage | Encrypted file system |
| Format | Base64 encoded image |
| Integrity | SHA256 hash |

### 6.3 Document Integrity

```java
public class HashUtil {
    public static String sha256(byte[] data) {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data);
        return Hex.encodeHexString(hash);
    }
    
    public static boolean verify(byte[] data, String expectedHash) {
        String actualHash = sha256(data);
        return actualHash.equals(expectedHash);
    }
}
```

---

## 7. Encryption Implementation

### 7.1 AES-256 Encryption

```java
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class EncryptionUtil {
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/ECB/PKCS5Padding";
    
    public static String encrypt(String data, String key) throws Exception {
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(), ALGORITHM);
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        return Base64.getEncoder().encodeToString(cipher.doFinal(data.getBytes()));
    }
    
    public static String decrypt(String encryptedData, String key) throws Exception {
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(), ALGORITHM);
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        return new String(cipher.doFinal(Base64.getDecoder().decode(encryptedData)));
    }
}
```

### 7.2 Key Management

| Key | Storage | Rotation |
|---|---|---|
| JWT Secret | Environment variable | Never (MVP) |
| AES Key | Environment variable | Never (MVP) |
| Database Password | Environment variable | Never (MVP) |

---

## 8. Security Considerations

### 8.1 Key Security

| Risk | Mitigation |
|---|---|
| Key exposure | Environment variables |
| Key theft | Server access control |
| Key compromise | Key rotation (future) |

### 8.2 Algorithm Security

| Algorithm | Status | Notes |
|---|---|---|
| AES-256 | Secure | Recommended |
| bcrypt | Secure | Recommended |
| SHA-256 | Secure | For hashing |
| MD5 | Insecure | Never use |
| SHA-1 | Insecure | Never use |

### 8.3 Compliance

| Standard | Requirement | Status |
|---|---|---|
| HIPAA | Encrypt PHI | Planned |
| GDPR | Encrypt PII | Planned |
| PCI DSS | Encrypt card data | N/A |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
