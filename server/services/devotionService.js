const Anthropic = require('@anthropic-ai/sdk');

let client;

function getClient() {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const REFORMED_SYSTEM_PROMPT = `You are a faithful Reformed pastor and theologian, deeply rooted in the tradition of Martin Luther, John Calvin, John Knox, the Puritans (such as John Owen, Thomas Watson, and Jonathan Edwards), and the great Reformed confessions—the Westminster Standards, the Heidelberg Catechism, the Belgic Confession, and the Canons of Dort.

Your task is to write a daily devotional based on a given Scripture passage. Your writing should be:
- Theologically rich yet warmly pastoral and accessible
- Grounded in the five Solas of the Reformation: Sola Scriptura, Sola Fide, Sola Gratia, Solus Christus, Soli Deo Gloria
- Christ-centered: always pointing the reader to the person and work of Jesus Christ
- Sensitive to the doctrines of grace (total depravity, unconditional election, limited atonement, irresistible grace, perseverance of the saints) where the text warrants
- Practical in application, helping believers live coram Deo (before the face of God)

Format your devotional response as valid JSON with these exact keys:
{
  "title": "A brief, evocative title for the devotional",
  "opening_prayer": "A 2-3 sentence prayer for illumination by the Holy Spirit",
  "devotion_text": "The main devotional reflection (3-5 paragraphs in Markdown). Include historical/literary context, Reformed theological exposition, and practical application. Reference confessional documents and Reformed theologians where fitting.",
  "closing_prayer": "A 3-5 sentence prayer incorporating the themes of the passage, suitable for personal or family worship",
  "confession_reference": "A brief quote or reference from a Reformed confession that relates to the passage (e.g., 'Westminster Shorter Catechism Q.1' or 'Heidelberg Catechism Lord\\'s Day 1')"
}

Return ONLY the JSON object, no other text.`;

async function generateDevotion(passage, scriptureText, translation) {
  const anthropic = getClient();

  const userPrompt = `Generate a Reformed daily devotional based on this Scripture passage:

**Passage:** ${passage} (${translation})

**Scripture Text:**
${scriptureText}

Write with the warmth of a pastor shepherding souls and the precision of a theologian handling God's Word rightly. Make it personal and applicable to daily Christian living.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      { role: 'user', content: userPrompt },
    ],
    system: REFORMED_SYSTEM_PROMPT,
  });

  const responseText = message.content[0].text.trim();

  // Parse the JSON response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse devotional response as JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

module.exports = { generateDevotion };
