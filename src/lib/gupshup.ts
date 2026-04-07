import axios from "axios";
import qs from "qs";

interface WhatsAppMessage {
    name: string;
    phone?: string;
    email?: string;
    botName: string;
}

export const sendWhatsAppNotification = async (recipient: string, lead: WhatsAppMessage) => {
    const apiKey = process.env.GUPSHUP_API_KEY;
    const source = process.env.GUPSHUP_SOURCE_PHONE;
    const appName = process.env.GUPSHUP_APP_NAME;

    if (!apiKey || !source || !appName) {
        console.warn("Gupshup credentials missing. Skipping WhatsApp notification.");
        return;
    }

    const url = 'https://api.gupshup.io/wa/api/v1/msg';
    
    // Clean recipient phone (remove non-digits, ensure country code)
    let cleanedRecipient = recipient.replace(/\D/g, "");
    if (cleanedRecipient.length === 10) {
        cleanedRecipient = "91" + cleanedRecipient; // Default to India if no country code
    }

    const messageText = `🚀 *New Lead Captured!*

*Agent:* ${lead.botName}
*Name:* ${lead.name}
*Phone:* ${lead.phone || 'N/A'}
*Email:* ${lead.email || 'N/A'}

View all leads in your dashboard: ${process.env.NEXTAUTH_URL || 'https://hey-pixi.com'}/dashboard/leads`;

    const data = qs.stringify({
        'channel': 'whatsapp',
        'source': source,
        'destination': cleanedRecipient,
        'src.name': appName,
        'message': JSON.stringify({
            "type": "text",
            "text": messageText
        })
    });

    const config = {
        method: 'post',
        url: url,
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded', 
            'apikey': apiKey,
            'Cache-Control': 'no-cache'
        },
        data: data
    };

    try {
        const response = await axios(config);
        console.log('WhatsApp notification sent successfully:', response.data);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
        return { success: false, error: error.message };
    }
};

export const registerWhatsAppOptIn = async (phoneNumber: string) => {
    const apiKey = process.env.GUPSHUP_API_KEY;
    const appName = process.env.GUPSHUP_APP_NAME;

    if (!apiKey || !appName) {
        console.warn("Gupshup credentials missing. Skipping opt-in registration.");
        return;
    }

    // Clean phone number (remove all non-digits)
    const cleanedPhone = phoneNumber.replace(/\D/g, "");

    // Gupshup Opt-in API endpoint
    // Standard format: https://api.gupshup.io/wa/api/v1/user/optin
    const url = 'https://api.gupshup.io/wa/api/v1/user/optin';
    
    const data = qs.stringify({ 
        user: cleanedPhone,
        appName: appName // Some versions require appName in the body or URL
    });

    try {
        const response = await axios.post(url, data, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'apikey': apiKey 
            }
        });
        console.log('WhatsApp opt-in registered successfully:', response.data);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('Error registering WhatsApp opt-in:', error.response ? error.response.data : error.message);
        return { success: false, error: error.message };
    }
};
