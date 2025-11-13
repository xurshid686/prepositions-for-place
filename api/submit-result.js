module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    console.log('Environment check:', {
      hasToken: !!TELEGRAM_BOT_TOKEN,
      hasChatId: !!TELEGRAM_CHAT_ID,
      tokenLength: TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.length : 0
    });

    // Check if Telegram credentials are set
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram credentials:', {
        token: TELEGRAM_BOT_TOKEN ? 'set' : 'missing',
        chatId: TELEGRAM_CHAT_ID ? 'set' : 'missing'
      });
      return res.status(500).json({ 
        success: false,
        error: 'Telegram credentials not configured'
      });
    }

    const { studentName, score, total, timeSpent, timestamp } = req.body;

    console.log('Received data:', { studentName, score, total, timeSpent, timestamp });

    // Validate required fields
    if (!studentName || score === undefined || !total || !timeSpent) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Create message for Telegram
    const percentage = ((score / total) * 100).toFixed(1);
    const message = `
📚 *Prepositions Test Result*
👤 *Student:* ${studentName}
📊 *Score:* ${score}/${total} (${percentage}%)
⏱️ *Time Spent:* ${timeSpent}
📅 *Completed:* ${new Date(timestamp).toLocaleString()}
    `.trim();

    console.log('Sending to Telegram:', message);

    // Send message to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const responseData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', responseData);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to send message to Telegram',
        details: responseData.description 
      });
    }

    console.log('Telegram message sent successfully:', responseData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Results sent to Telegram successfully' 
    });

  } catch (error) {
    console.error('Error in submit-result:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
};
