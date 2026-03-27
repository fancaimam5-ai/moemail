/**
 * WhatsApp Evolution API Client
 * Provides methods to send messages via Evolution API
 */

export interface WhatsAppConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Default config from environment
function getConfig(): WhatsAppConfig {
  return {
    baseUrl: process.env.WHATSAPP_API_URL || "http://84.247.131.64:8080",
    apiKey: process.env.WHATSAPP_API_KEY || "Evo4P1K3y$84247131Pr0d!x9zQmW2",
    instanceName: process.env.WHATSAPP_INSTANCE_NAME || "ifmail",
  };
}

/**
 * Format phone number to WhatsApp format (without + or leading 0)
 * Examples:
 * - 08123456789 → 628123456789
 * - +628123456789 → 628123456789
 * - 628123456789 → 628123456789
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // Handle Indonesian numbers
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Send a text message via WhatsApp
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  config?: Partial<WhatsAppConfig>
): Promise<SendMessageResult> {
  const cfg = { ...getConfig(), ...config };
  const formattedPhone = formatPhoneNumber(phone);

  try {
    const response = await fetch(
      `${cfg.baseUrl}/message/sendText/${cfg.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.apiKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string };
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json() as { key?: { id?: string }; messageId?: string };
    return {
      success: true,
      messageId: data.key?.id || data.messageId,
    };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send OTP code via WhatsApp
 */
export async function sendWhatsAppOTP(
  phone: string,
  otpCode: string,
  config?: Partial<WhatsAppConfig>
): Promise<SendMessageResult> {
  const message = `🔐 *Kode Verifikasi IfMail*

Kode OTP Anda: *${otpCode}*

Kode ini berlaku selama 5 menit.
Jangan bagikan kode ini kepada siapapun.

_Jika Anda tidak meminta kode ini, abaikan pesan ini._`;

  return sendWhatsAppMessage(phone, message, config);
}

/**
 * Check if WhatsApp instance is connected
 */
export async function checkWhatsAppConnection(
  config?: Partial<WhatsAppConfig>
): Promise<{ connected: boolean; error?: string }> {
  const cfg = { ...getConfig(), ...config };

  try {
    const response = await fetch(
      `${cfg.baseUrl}/instance/connectionState/${cfg.instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: cfg.apiKey,
        },
      }
    );

    if (!response.ok) {
      return { connected: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json() as { instance?: { state?: string } };
    return {
      connected: data.instance?.state === "open",
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate random OTP code
 */
export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}
