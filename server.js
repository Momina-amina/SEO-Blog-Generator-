const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const client = new Anthropic();

async function generateBlog(topic, audience, pointers, companyInfo, languageStyle, toneInstructions, wordCount) {
  
  const kwRes = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `You are an SEO specialist. Research keywords for this blog post.
Topic: ${topic}
Target audience: ${audience}

1. Identify the single best PRIMARY keyword with estimated monthly search volume and difficulty (Easy/Medium/Hard).
2. Identify 2-3 SECONDARY keywords only if genuinely relevant, with volume and difficulty.
3. Keywords to AVOID and why.
4. Recommended keyword density for the post.

Format clearly with headers.`
    }]
  });
  const keywordStrategy = kwRes.content[0].text;

  const resRes = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `You are a research assistant helping write a blog post.
Topic: ${topic}
Audience: ${audience}
Pointers: ${pointers}
${companyInfo ? `Company context: ${companyInfo}` : ""}

Find 4-5 supporting facts or statistics. Rules:
- Relevant to target audience
- Never from competitor websites
- Use industry reports, government data, academic studies
- Each stat must be unique
- Provide fact, source name, and direct URL

Format:
Stat: [fact]
Source: [name]
URL: [link]`
    }]
  });
  const research = resRes.content[0].text;

  const outRes = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Create a blog post outline.
Topic: ${topic}
Audience: ${audience}
Pointers: ${pointers}
Research: ${research}
Keyword strategy: ${keywordStrategy}

Create H1 title (with primary keyword) and 4 H2 headings with one sentence each.`
    }]
  });
  const outline = outRes.content[0].text;

  const writeRes = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `Write a complete original blog post.

Topic: ${topic}
Audience: ${audience}
Language: ${languageStyle || "American English"}
Tone: Engaging, explanatory, easy to understand. ${toneInstructions ? `Additional tone: ${toneInstructions}` : ""}
${companyInfo ? `Company context (weave in naturally): ${companyInfo}` : ""}
Target word count: ${wordCount || "800-1000 words"}

Pointers: ${pointers}
Research: ${research}
Outline: ${outline}
Keyword strategy: ${keywordStrategy}

Rules:
- Primary keyword in H1, first paragraph, at least one H2, throughout at recommended density
- Secondary keywords only where natural
- Never overstuff keywords
- Cite stats with source URL like: (Source: name - url)
- NEVER use em dashes
- No repetition
- Explain every concept clearly
- Original content, complete post

At the top include:
Meta Title: (50-60 chars, includes primary keyword)
Meta Description: (150-160 chars, includes primary keyword)
Suggested Tags: (5 tags)`
    }]
  });
  const blogPost = writeRes.content[0].text;

  return { keywordStrategy, blogPost };
}

app.post("/generate", async (req, res) => {
  try {
    const { topic, audience, pointers, companyInfo, languageStyle, toneInstructions, wordCount } = req.body;
    const result = await generateBlog(topic, audience, pointers, companyInfo, languageStyle, toneInstructions, wordCount);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error(error);
    res.json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log("Blogging agent running at http://localhost:3000"));