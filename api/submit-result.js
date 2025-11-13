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
    const { studentName, score, total, timeSpent, timestamp } = req.body;

    // Validate required fields
    if (!studentName || score === undefined || !total || !timeSpent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get Telegram credentials from environment
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Only send to Telegram if credentials are available
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      // Create message for Telegram
      const percentage = ((score / total) * 100).toFixed(1);
      const message = `
📚 Prepositions Test Result
👤 Student: ${studentName}
📊 Score: ${score}/${total} (${percentage}%)
⏱️ Time Spent: ${timeSpent}
📅 Completed: ${new Date(timestamp).toLocaleString()}
      `.trim();

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
          }),
        }
      );

      if (!telegramResponse.ok) {
        console.error('Telegram API error');
      } else {
        console.log('Telegram message sent successfully');
      }
    }

    // Always return success to the frontend
    res.status(200).json({ 
      success: true
    });

  } catch (error) {
    console.error('Error:', error);
    // Still return success to frontend even if Telegram fails
    res.status(200).json({ 
      success: true
    });
  }
};
