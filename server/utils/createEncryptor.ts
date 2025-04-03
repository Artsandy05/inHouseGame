// utils/encryption.js

// Helper functions
function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function base64Encode(str: string) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16)); // Convert hex string to number first
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64Decode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return decodeURIComponent(Array.from(atob(str)).map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

// Main encryption function
export function createEncryptor(secretKey = 'defaultSecret123!') {
  const key = secretKey;
  const iv = '1234567890123456'; // 16 bytes for AES-256-CBC

  return {
    encryptParams(params) {
      try {
        const jsonStr = JSON.stringify(params);
        const xorEncrypted = xorEncrypt(jsonStr, key);
        const base64Encoded = base64Encode(xorEncrypted);
        return base64Encoded;
      } catch (error) {
        console.error('Encryption error:', error);
        return null;
      }
    },
    
    decryptParams(encryptedStr) {
      try {
        const base64Decoded = base64Decode(encryptedStr);
        const xorDecrypted = xorEncrypt(base64Decoded, key); // XOR is symmetric
        return JSON.parse(xorDecrypted);
      } catch (error) {
        console.error('Decryption error:', error);
        return null;
      }
    }
  };
}

// Default export
export default createEncryptor;