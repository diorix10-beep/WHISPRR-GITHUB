import { buildSystemPrompt, getOracleSignature } from '../src/core/persona';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const KV_REST_API_URL = process.env.KV_REST_API_URL;
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return new Response(JSON.stringify({ error: 'KV database credentials not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(req.url);
  const key = 'support_tickets:whisprr';

  try {
    if (req.method === 'GET') {
      const getRes = await fetch(`${KV_REST_API_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
      });
      const getData = await getRes.json();
      
      let tickets = [];
      if (getData.result) {
        let parsed = getData.result;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch (e) {}
        }
        if (Array.isArray(parsed)) {
          tickets = parsed;
        }
      }

      return new Response(JSON.stringify(tickets), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const payload = await req.json();
      
      let newTickets = [];
      if (Array.isArray(payload)) {
        newTickets = payload; // Overwrite state from UI
      } else {
        // Inbound Webhook
        const userEmail = payload.from || payload.sender || 'unknown@example.com';
        const userText = payload.text || payload.body || 'No content provided';
        const subject = payload.subject || 'New Support Request';

        const ticket = {
          id: `tkt-${Date.now()}`,
          subject,
          userEmail,
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: 'user',
              text: userText,
              timestamp: new Date().toISOString(),
            }
          ]
        };

        // Autonomous Worker Logic
        if (process.env.AUTONOMOUS_SUPPORT === 'true' && process.env.GEMINI_API_KEY_SERVER) {
          try {
            const systemPrompt = buildSystemPrompt('executive', 'en');
            const prompt = `You are replying to a support email for WHISPRR.
Subject: ${subject}
From: ${userEmail}

User Message:
${userText}

Draft a complete, helpful, and professional response. Do not include a signature block at the end, the system will append it.`;

            // Call Gemini API
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY_SERVER}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: { text: systemPrompt } },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
              })
            });

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              let generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
              
              if (generatedText) {
                const signature = getOracleSignature('executive', true);
                const finalReply = generatedText.trim() + signature;

                // Always append Oracle's reply to the ticket
                ticket.messages.push({
                  id: `msg-${Date.now() + 1}`,
                  sender: 'oracle',
                  text: finalReply,
                  timestamp: new Date().toISOString(),
                });

                // Send via Resend only if configured
                if (process.env.RESEND_API_KEY) {
                  const resendRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      from: 'Oracle Verity <help@whisprr.xyz>',
                      to: [userEmail],
                      subject: `Re: ${subject}`,
                      text: finalReply
                    })
                  });

                  if (resendRes.ok) {
                    ticket.status = 'resolved'; // Mark as resolved automatically since it was sent
                  } else {
                    console.error('Resend API failed', await resendRes.text());
                    ticket.status = 'pending'; // Leave as pending if send failed
                  }
                } else {
                  // If Resend is disabled, mark as pending so human can review the draft
                  ticket.status = 'pending';
                  console.log('Email drafted but NOT sent. Resend API Key is missing.');
                }
              }
            } else {
              console.error('Gemini API failed', await geminiRes.text());
            }
          } catch (err) {
            console.error('Autonomous processing error:', err);
          }
        }

        // Fetch current tickets
        const getRes = await fetch(`${KV_REST_API_URL}/get/${key}`, {
          headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
        });
        
        let existingTickets = [];
        if (getRes.ok) {
          const getData = await getRes.json();
          if (getData.result) {
            let parsed = getData.result;
            if (typeof parsed === 'string') {
              try { parsed = JSON.parse(parsed); } catch (e) {}
            }
            if (Array.isArray(parsed)) {
              existingTickets = parsed;
            }
          }
        }

        existingTickets.unshift(ticket);
        newTickets = existingTickets.slice(0, 100);
      }

      const setRes = await fetch(`${KV_REST_API_URL}/set/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
        body: JSON.stringify(JSON.stringify(newTickets)), 
      });

      if (!setRes.ok) {
        throw new Error('Failed to save tickets to KV');
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method Not Allowed', { status: 405 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
