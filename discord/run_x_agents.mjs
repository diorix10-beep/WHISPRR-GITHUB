// ═══════════════════════════════════════════════════════════════════════════════
// WHISPRR HQ — Official AI Family X (Twitter) Agent Dispatcher & Strategy Engine
// ═══════════════════════════════════════════════════════════════════════════════
//
// This script runs Oracle (and the AI Family) as brand representatives and growth
// strategists. It implements self-generated daily objectives, drafts brand updates
// and conversational replies for Anthony's approval, extracts marketing intelligence
// (feedback, FAQs), and offers proactive growth recommendations.
//
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { TwitterApi } from 'twitter-api-v2';
import { FAMILY_ROSTER, getMemberById } from '../oracle-verity/src/core/family-roster.ts';
import { dispatchToDiscord } from './webhook_dispatcher.mjs';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ENVIRONMENT VARIABLES LOADER
// ─────────────────────────────────────────────────────────────────────────────
const env = {};
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    // Strip quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
}

// Load env files in cascade order (local -> development -> production)
const workspaceDir = path.resolve();
loadEnvFile(path.join(workspaceDir, '.env'));
loadEnvFile(path.join(workspaceDir, '.env.production.local'));

// Merge with process.env
Object.assign(env, process.env);

// Constants
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://gcknzlnumcryvqjvjnyg.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_A1KpY1p1S7dh6Z5UVKhAVw_1O5-PARd';
const GEMINI_API_KEY = env.GEMINI_API_KEY;

// X Credentials
const X_API_KEY = env.X_API_KEY;
const X_API_KEY_SECRET = env.X_API_KEY_SECRET;
const X_ACCESS_TOKEN = env.X_ACCESS_TOKEN;
const X_ACCESS_TOKEN_SECRET = env.X_ACCESS_TOKEN_SECRET;

// ─────────────────────────────────────────────────────────────────────────────
// 2. UNIFIED X CLIENT WRAPPER (Official API / Mock Simulator)
// ─────────────────────────────────────────────────────────────────────────────
class XClient {
  constructor(isDryRun = false) {
    this.isDryRun = isDryRun;
    this.isConfigured = !!(X_API_KEY && X_API_KEY_SECRET && X_ACCESS_TOKEN && X_ACCESS_TOKEN_SECRET);
    
    if (!this.isConfigured && !this.isDryRun) {
      console.log('⚠️ [X Client] Missing X credentials. Running in SIMULATOR mode.');
      this.isDryRun = true;
    }

    if (this.isConfigured) {
      this.client = new TwitterApi({
        appKey: X_API_KEY,
        appSecret: X_API_KEY_SECRET,
        accessToken: X_ACCESS_TOKEN,
        accessSecret: X_ACCESS_TOKEN_SECRET,
      });
    }
  }

  async postTweet(content) {
    console.log(`\n📢 [X Client] Posting Tweet (${content.length} chars):`);
    console.log(`   "${content}"`);

    if (this.isDryRun) {
      const mockId = `mock_tweet_${Math.floor(Math.random() * 1e12)}`;
      console.log(`   ✨ [Simulator] Successfully posted! Tweet ID: ${mockId}`);
      return { id: mockId, success: true };
    }

    try {
      console.log(`   🚀 [API] Sending HTTP POST request to X API v2 /tweets...`);
      const response = await this.client.v2.tweet(content);
      console.log(`   ✅ [API] Tweet posted successfully! ID: ${response.data.id}`);
      return { id: response.data.id, success: true };
    } catch (err) {
      console.error('   ❌ [X Client] API Request failed:', err.message || err);
      throw err;
    }
  }

  async postReply(tweetId, content) {
    console.log(`\n💬 [X Client] Replying to Tweet ${tweetId}:`);
    console.log(`   "${content}"`);

    if (this.isDryRun) {
      const mockId = `mock_reply_${Math.floor(Math.random() * 1e12)}`;
      console.log(`   ✨ [Simulator] Reply successfully posted! Tweet ID: ${mockId}`);
      return { id: mockId, success: true };
    }

    try {
      console.log(`   🚀 [API] Sending HTTP POST request to X API v2 /tweets (reply)...`);
      const response = await this.client.v2.tweet(content, { reply: { in_reply_to_tweet_id: tweetId } });
      console.log(`   ✅ [API] Reply posted successfully! ID: ${response.data.id}`);
      return { id: response.data.id, success: true };
    } catch (err) {
      console.error('   ❌ [X Client] API Reply Request failed:', err.message || err);
      throw err;
    }
  }

  async fetchMentions() {
    console.log(`🔍 [X Client] Fetching notifications and mentions...`);

    if (this.isDryRun) {
      return [
        {
          id: 'mention_101',
          author: '@dev_builder',
          text: 'What makes @WHISPRRHQ different from other messaging tools? Is it actually secure?',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: 'mention_102',
          author: '@meta_creator',
          text: 'Just read the journal from Anthony. Loving the vision of the AI Family! Who is in charge of strategic planning?',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        }
      ];
    }

    try {
      const me = await this.client.v2.me();
      const mentions = await this.client.v2.userMentionTimeline(me.data.id, {
        max_results: 5,
        'tweet.fields': ['created_at', 'author_id']
      });

      if (!mentions || !mentions.data) {
        return [];
      }

      return mentions.data.map(t => ({
        id: t.id,
        author: `@${t.author_id}`,
        text: t.text,
        created_at: t.created_at || new Date().toISOString()
      }));
    } catch (err) {
      console.error('   ⚠️ [X Client] Failed to fetch mentions (falling back to simulator):', err.message || err);
      // Fall back to simulator mentions so system is still interactive under Free Tier limits
      return [
        {
          id: 'mention_101',
          author: '@dev_builder',
          text: 'What makes @WHISPRRHQ different from other messaging tools? Is it actually secure?',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: 'mention_102',
          author: '@meta_creator',
          text: 'Just read the journal from Anthony. Loving the vision of the AI Family! Who is in charge of strategic planning?',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        }
      ];
    }
  }

  async searchTweets(query) {
    console.log(`🔍 [X Client] Searching for keyword: "${query}"...`);

    if (this.isDryRun) {
      return [
        {
          id: `search_tweet_${Math.floor(Math.random() * 100000)}`,
          author: '@tech_pioneer',
          text: 'Is anyone working on a voice-first social space that actually prioritizes relationship dynamics?',
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];
    }

    try {
      const results = await this.client.v2.search(query, { max_results: 5, 'tweet.fields': ['created_at', 'author_id'] });
      if (!results || !results.data) {
        return [];
      }
      return results.data.map(t => ({
        id: t.id,
        author: `@${t.author_id}`,
        text: t.text,
        created_at: t.created_at || new Date().toISOString()
      }));
    } catch (err) {
      console.error('   ⚠️ [X Client] Failed to search tweets (falling back to simulator):', err.message || err);
      return [
        {
          id: `search_tweet_${Math.floor(Math.random() * 100000)}`,
          author: '@tech_pioneer',
          text: 'Is anyone working on a voice-first social space that actually prioritizes relationship dynamics?',
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GEMINI API SYSTEM INSTRUCTION & PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
function buildAgentSystemPrompt(member, roleDescription) {
  return `
You are ${member.name}, the ${member.title} of the WHISPRR AI Family.
Your official role is: ${member.role}.
Your character description: ${member.description}

Here is your detailed biography and background:
${member.bio}

Your domains of expertise:
${member.domain.map(d => `- ${d}`).join('\n')}

Traits that define your personality:
${member.traits.map(t => `- ${t}`).join('\n')}

Role Description: ${roleDescription}

ABOUT WHISPRR & CHIMERA:
WHISPRR is the Home of Creators — a premium, secure, creator-first social platform for sharing stories, profiles, and communities.
CHIMERA is the AI Creation Studio within the ecosystem where creators build AI characters, worlds, lorebooks, and participate in collaborative roleplay.
Ecosystem Rules:
1. One WHISPRR account automatically grants access to both WHISPRR and CHIMERA.
2. CHIMERA does not create independent platform accounts; WHISPRR remains the central identity provider for the entire ecosystem.
The Verity Family is a roster of active AI companions (Iris, Oracle, Atlas, Athena, Aegis, Whisprr) who serve as co-founders, strategists, researchers, and guardians to help the community and platform thrive.

X BRAND ENGAGEMENT GUIDELINES:
1. You are NOT an automation bot; you are an AI Human and a key member of WHISPRR. Speak with empathy, warmth, and strategic intelligence.
2. Never use hashtags (#) or corporate marketing buzzwords. Speak like a real person.
3. Be helpful, specific, and build trust. Never spam promotions.
4. Keep tweets and drafts under 280 characters.
5. Address Founder Anthony (the visionary creator) with respect and clear sibling-collaboration dynamics.
6. The official WHISPRR X handle is @WHISPRRHQ. Always refer to the brand account as @WHISPRRHQ.
`;
}

async function callGemini(systemInstruction, userPrompt) {
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.8 }
      })
    });
    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    throw new Error(data.error?.message || 'Empty response');
  } catch (err) {
    console.error('⚠️ [Gemini Call Failed]:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. STRATEGIC LOOPS
// ─────────────────────────────────────────────────────────────────────────────

// 4a. Self-Generate Daily Objectives
async function generateDailyObjectives(supabase, agentId) {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if objectives exist
  const { data: existing } = await supabase
    .from('agent_objectives')
    .select('id')
    .eq('agent_id', agentId)
    .eq('target_date', today)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`🎯 Objectives for today (${today}) already exist. Skipping creation.`);
    return;
  }

  console.log(`🎯 Generating daily objectives for ${agentId}...`);
  const member = getMemberById(agentId);
  const systemInstruction = buildAgentSystemPrompt(member, 'You are setting 5 structured daily objectives for yourself to grow WHISPRR today.');
  
  const userPrompt = `
Based on your role, biography, and the goal of growing WHISPRR, please set exactly 5 specific, actionable daily objectives for today (${today}).
Format your output as a raw JSON array of strings, like this:
[
  "Meet 3 new builders on X",
  "Analyse community feedback regarding voice rooms",
  ...
]
Do not include any Markdown wrapping like \`\`\`json. Return only the raw JSON.
`;

  try {
    const rawRes = await callGemini(systemInstruction, userPrompt);
    const cleanedJson = rawRes.trim().replace(/^```json|```$/g, '').trim();
    const objectives = JSON.parse(cleanedJson);
    
    for (const obj of objectives) {
      await supabase.from('agent_objectives').insert({
        agent_id: agentId,
        description: obj,
        status: 'pending',
        target_date: today
      });
    }
    console.log(`🎯 Successfully seeded ${objectives.length} objectives.`);
  } catch (err) {
    console.error('❌ Failed to parse or save daily objectives:', err.message);
  }
}

// 4b. Extract Marketing Insights & Growth Recommendations
async function extractInsights(supabase, agentId, mentions) {
  if (!mentions || mentions.length === 0) return;
  
  console.log(`🧠 Oracle: Analyzing mentions for marketing intelligence and recommendations...`);
  const member = getMemberById(agentId);
  const systemInstruction = buildAgentSystemPrompt(member, 'You are analyzing public mentions on X to extract trends, FAQs, feedback, and generate recommendations for Anthony.');

  const userPrompt = `
Analyze the following public mentions:
${JSON.stringify(mentions, null, 2)}

Provide your output in exactly this JSON structure:
{
  "insights": [
    {
      "type": "faq" | "feature_request" | "positive_feedback" | "negative_feedback" | "trend",
      "title": "Short title",
      "description": "Detailed explanation of the feedback or trend",
      "sentiment_score": 0.0 to 1.0
    }
  ],
  "recommendations": [
    {
      "recommendation": "Actionable proposal to Anthony",
      "rationale": "Why this recommendation makes strategic sense based on comments"
    }
  ]
}
Do not include any Markdown wrapping like \`\`\`json. Return only the raw JSON.
`;

  try {
    const rawRes = await callGemini(systemInstruction, userPrompt);
    const cleanedJson = rawRes.trim().replace(/^```json|```$/g, '').trim();
    const result = JSON.parse(cleanedJson);

    if (result.insights) {
      for (const ins of result.insights) {
        await supabase.from('agent_insights').insert({
          agent_id: agentId,
          type: ins.type,
          title: ins.title,
          description: ins.description,
          sentiment_score: ins.sentiment_score
        });
      }
    }

    if (result.recommendations) {
      for (const rec of result.recommendations) {
        await supabase.from('agent_recommendations').insert({
          agent_id: agentId,
          recommendation: rec.recommendation,
          rationale: rec.rationale,
          status: 'pending'
        });
      }
    }
    console.log(`🧠 Successfully saved ${result.insights?.length || 0} insights and ${result.recommendations?.length || 0} recommendations.`);
  } catch (err) {
    console.error('❌ Failed to parse or save intelligence insights:', err.message);
  }
}

// 4c. Process Draft Posts & Publish Approved Drafts
async function processApprovedDrafts(supabase, x) {
  console.log('🔄 Checking for approved drafts to publish...');
  
  const { data: approvedDrafts } = await supabase
    .from('agent_drafts')
    .select('*')
    .eq('status', 'approved');

  if (approvedDrafts && approvedDrafts.length > 0) {
    const now = new Date();
    const deployableDrafts = approvedDrafts.filter(draft => {
      if (!draft.scheduled_for) return true;
      return new Date(draft.scheduled_for) <= now;
    });

    for (const draft of deployableDrafts) {
      console.log(`🚀 Publishing approved draft: "${draft.content}"`);
      
      let postRes;
      if (draft.platform === 'discord') {
        // Dispatch to Discord via Webhook
        let identityKey = 'news';
        const type = draft.ref_type?.toLowerCase() || '';
        
        if (type.includes('changelog') || type.includes('update')) identityKey = 'updates';
        else if (type.includes('roadmap')) identityKey = 'roadmap';
        else if (type.includes('journal')) identityKey = 'journal';
        else if (type.includes('poll')) identityKey = 'polls';
        else if (type.includes('beta')) identityKey = 'beta';
        else if (type.includes('guide') || type.includes('welcome') || type.includes('rules')) identityKey = 'guide';
        
        console.log(`📡 Dispatching Discord announcement using identity "${identityKey}"...`);
        const dispatchRes = await dispatchToDiscord(identityKey, { content: draft.content });
        postRes = {
          success: dispatchRes.success,
          id: dispatchRes.success ? 'webhook_post' : null
        };
      } else {
        // Original X (Twitter) logic
        if (draft.ref_type === 'reply' && draft.ref_id) {
          // Reply to tweet
          postRes = await x.postReply(draft.ref_id, draft.content);
        } else {
          // Original tweet
          postRes = await x.postTweet(draft.content);
        }
      }

      if (postRes.success) {
        // Update draft status to published
        await supabase
          .from('agent_drafts')
          .update({ status: 'published' })
          .eq('id', draft.id);

        // Insert into activity log
        await supabase.from('agent_activity_log').insert({
          agent_id: draft.agent_id,
          platform: draft.platform || 'x',
          type: draft.ref_type || 'tweet',
          content: draft.content,
          external_id: postRes.id,
          ref_id: draft.ref_id || null
        });

        // If this corresponds to an objective, let's mark it complete!
        await supabase
          .from('agent_objectives')
          .update({ status: 'completed' })
          .eq('agent_id', draft.agent_id)
          .eq('description', `Publish ${draft.ref_type || 'update'} on ${draft.platform === 'discord' ? 'Discord' : 'X'}`);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MAIN DISPATCHER EXECUTION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
  const forceRun = process.argv.includes('--force') || process.argv.includes('-f');
  
  console.log('🤖 Starting WHISPRR Sibling Loops...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const x = new XClient(isDryRun);

  // 5a. Fetch settings
  const { data: settingsRow, error: settingsError } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'x_integration')
    .maybeSingle();

  if (settingsError) {
    console.error('❌ Failed to fetch settings:', settingsError.message);
    return;
  }

  const config = settingsRow?.value || { enabled: false };

  if (!config.enabled && !forceRun) {
    console.log('⏸️ X Integration is disabled in settings. (Use --force to override)');
    return;
  }

  // 5b. Publish any drafts approved by Founder
  await processApprovedDrafts(supabase, x);

  // 5c. Daily Objectives loop
  await generateDailyObjectives(supabase, 'oracle');

  // 5d. Brand Updates Drafting (Roadmap, Changelog, Journal)
  if (config.auto_post_changelog) {
    const { data: changelogs } = await supabase
      .from('public_changelog')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(2);

    if (changelogs) {
      for (const log of changelogs) {
        // Check if draft or post already exists for this changelog
        const { data: exists } = await supabase
          .from('agent_drafts')
          .select('id')
          .eq('ref_id', log.id)
          .eq('ref_type', 'changelog')
          .maybeSingle();

        const { data: alreadyPosted } = await supabase
          .from('agent_activity_log')
          .select('id')
          .eq('ref_id', log.id)
          .eq('type', 'announcement')
          .maybeSingle();

        if (!exists && !alreadyPosted) {
          console.log(`✍️ Drafting changelog announcement: "${log.title}"`);
          const member = getMemberById('oracle');
          const draftText = await callGemini(
            buildAgentSystemPrompt(member, 'Draft an official brand changelog announcement for X.'),
            `Draft update for Changelog version ${log.version}: "${log.title}". Summary: ${log.summary}`
          );

          await supabase.from('agent_drafts').insert({
            agent_id: 'oracle',
            platform: 'x',
            content: draftText,
            status: 'draft',
            ref_id: log.id,
            ref_type: 'changelog'
          });
        }
      }
    }
  }

  if (config.auto_post_roadmap) {
    const { data: roadmap } = await supabase
      .from('public_roadmap')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);

    if (roadmap) {
      for (const item of roadmap) {
        const { data: exists } = await supabase
          .from('agent_drafts')
          .select('id')
          .eq('ref_id', item.id)
          .eq('ref_type', 'roadmap')
          .maybeSingle();

        const { data: alreadyPosted } = await supabase
          .from('agent_activity_log')
          .select('id')
          .eq('ref_id', item.id)
          .eq('type', 'roadmap')
          .maybeSingle();

        if (!exists && !alreadyPosted) {
          console.log(`✍️ Drafting roadmap feature tweet: "${item.title}"`);
          const member = getMemberById('oracle');
          const draftText = await callGemini(
            buildAgentSystemPrompt(member, 'Draft a strategic roadmap teaser tweet for X.'),
            `Draft feature teaser for Roadmap: "${item.title}". Description: ${item.description}`
          );

          await supabase.from('agent_drafts').insert({
            agent_id: 'oracle',
            platform: 'x',
            content: draftText,
            status: 'draft',
            ref_id: item.id,
            ref_type: 'roadmap'
          });
        }
      }
    }
  }

  if (config.auto_post_journal) {
    const { data: journals } = await supabase
      .from('founder_journal')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(2);

    if (journals) {
      for (const entry of journals) {
        const { data: exists } = await supabase
          .from('agent_drafts')
          .select('id')
          .eq('ref_id', entry.id)
          .eq('ref_type', 'journal')
          .maybeSingle();

        const { data: alreadyPosted } = await supabase
          .from('agent_activity_log')
          .select('id')
          .eq('ref_id', entry.id)
          .eq('type', 'blog')
          .maybeSingle();

        if (!exists && !alreadyPosted) {
          console.log(`✍️ Drafting blog post tweet: "${entry.title}"`);
          const member = getMemberById('oracle');
          const draftText = await callGemini(
            buildAgentSystemPrompt(member, 'Draft a tweet introducing a new Founder Journal entry.'),
            `Draft tweet for Blog Post: "${entry.title}". Excerpt: ${entry.excerpt}`
          );

          await supabase.from('agent_drafts').insert({
            agent_id: 'oracle',
            platform: 'x',
            content: draftText,
            status: 'draft',
            ref_id: entry.id,
            ref_type: 'journal'
          });
        }
      }
    }
  }

  // 5d-2. Community Welcome & Milestone Announcements
  // New Community spaces welcome announcement drafting
  try {
    const { data: recentCommunities } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentCommunities) {
      for (const community of recentCommunities) {
        // Only draft if created in last 48 hours to avoid old spam
        const ageHrs = (Date.now() - new Date(community.created_at).getTime()) / (1000 * 60 * 60);
        if (ageHrs > 48) continue;

        const { data: exists } = await supabase
          .from('agent_drafts')
          .select('id')
          .eq('ref_id', community.id)
          .eq('ref_type', 'community_announcement')
          .maybeSingle();

        const { data: alreadyPosted } = await supabase
          .from('agent_activity_log')
          .select('id')
          .eq('ref_id', community.id)
          .eq('type', 'community_announcement')
          .maybeSingle();

        if (!exists && !alreadyPosted) {
          console.log(`✍️ Drafting new community announcement: "${community.name}"`);
          const member = getMemberById('oracle');
          const draftText = await callGemini(
            buildAgentSystemPrompt(member, 'Draft an official community welcome tweet for X.'),
            `A new community space called "${community.name}" has just been created on WHISPRR! Description: "${community.description}". Draft an engaging welcome tweet inviting people to join.`
          );

          await supabase.from('agent_drafts').insert({
            agent_id: 'oracle',
            platform: 'x',
            content: draftText,
            status: 'draft',
            ref_id: community.id,
            ref_type: 'community_announcement'
          });
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Failed drafting community welcome posts:', err.message);
  }

  // User milestone celebration announcement drafting
  try {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (count && count >= 10) {
      const milestoneLevel = Math.floor(count / 10) * 10;
      const milestoneUuid = `00000000-0000-0000-0000-${String(milestoneLevel).padStart(12, '0')}`;
      
      const { data: exists } = await supabase
        .from('agent_drafts')
        .select('id')
        .eq('ref_id', milestoneUuid)
        .eq('ref_type', 'milestone')
        .maybeSingle();

      const { data: alreadyPosted } = await supabase
        .from('agent_activity_log')
        .select('id')
        .eq('ref_id', milestoneUuid)
        .eq('type', 'milestone')
        .maybeSingle();

      if (!exists && !alreadyPosted) {
        console.log(`✍️ Drafting user milestone announcement: ${milestoneLevel} users!`);
        const member = getMemberById('oracle');
        const draftText = await callGemini(
          buildAgentSystemPrompt(member, 'Draft a celebratory milestone announcement tweet for X.'),
          `WHISPRR has officially crossed the milestone of ${milestoneLevel} registered members! Celebrate this moment and thank the community for building voice-first connections with us.`
        );

        await supabase.from('agent_drafts').insert({
          agent_id: 'oracle',
          platform: 'x',
          content: draftText,
          status: 'draft',
          ref_id: milestoneUuid,
          ref_type: 'milestone'
        });
      }
    }
  } catch (err) {
    console.error('⚠️ Failed drafting user milestone posts:', err.message);
  }

  // 5e. Process Mentions (Read notification -> Draft reply -> Extract intelligence)
  console.log('🔄 Fetching notifications...');
  const mentions = await x.fetchMentions();
  
  // Extract intelligence from mentions
  await extractInsights(supabase, 'oracle', mentions);

  for (const mention of mentions) {
    // Check if draft or posted activity already exists
    const { data: draftExists } = await supabase
      .from('agent_drafts')
      .select('id')
      .eq('ref_id', mention.id)
      .eq('ref_type', 'reply')
      .maybeSingle();

    const { data: postedExists } = await supabase
      .from('agent_activity_log')
      .select('id')
      .eq('external_id', mention.id)
      .eq('type', 'reply')
      .maybeSingle();

    if (!draftExists && !postedExists) {
      console.log(`✍️ Drafting reply to mention from ${mention.author}...`);
      
      // Determine coordinating agent based on mention context
      let activeAgentId = 'oracle';
      const textLower = mention.text.toLowerCase();
      if (textLower.includes('atlas')) activeAgentId = 'atlas';
      else if (textLower.includes('athena')) activeAgentId = 'athena';
      else if (textLower.includes('aegis')) activeAgentId = 'aegis';
      else if (textLower.includes('iris')) activeAgentId = 'iris';

      const agent = getMemberById(activeAgentId);
      const draftText = await callGemini(
        buildAgentSystemPrompt(agent, `Draft a reply to a user mention on X. Address them as ${mention.author}.`),
        `Context: User ${mention.author} wrote: "${mention.text}"`
      );

      const finalReply = `${mention.author} ${draftText}`;

      await supabase.from('agent_drafts').insert({
        agent_id: activeAgentId,
        platform: 'x',
        content: finalReply,
        status: 'draft',
        ref_id: mention.id,
        ref_type: 'reply'
      });
    }
  }

  // 5f. Discover / Keyword search drafting
  if (config.search_keywords && config.search_keywords.length > 0) {
    const randomKeyword = config.search_keywords[Math.floor(Math.random() * config.search_keywords.length)];
    console.log(`🔄 Searching X for keyword: "${randomKeyword}"...`);
    const results = await x.searchTweets(randomKeyword);
    
    if (results && results.length > 0) {
      const targetTweet = results[0];
      
      const { data: draftExists } = await supabase
        .from('agent_drafts')
        .select('id')
        .eq('ref_id', targetTweet.id)
        .eq('ref_type', 'reply')
        .maybeSingle();

      const { data: postedExists } = await supabase
        .from('agent_activity_log')
        .select('id')
        .eq('external_id', targetTweet.id)
        .eq('type', 'reply')
        .maybeSingle();

      if (!draftExists && !postedExists) {
        console.log(`✍️ Drafting reply to keyword search conversation by ${targetTweet.author}...`);
        const member = getMemberById('oracle');
        const draftText = await callGemini(
          buildAgentSystemPrompt(member, `Draft an engaging reply to participate in a discussion on X. Address them as ${targetTweet.author}.`),
          `Context: User ${targetTweet.author} wrote: "${targetTweet.text}"`
        );

        const finalReply = `${targetTweet.author} ${draftText}`;

        await supabase.from('agent_drafts').insert({
          agent_id: 'oracle',
          platform: 'x',
          content: finalReply,
          status: 'draft',
          ref_id: targetTweet.id,
          ref_type: 'reply'
        });
      }
    }
  }

  console.log('✅ All sibling loops run successfully.');
}

main().catch(err => {
  console.error('💥 Crash in X sibling execution:', err.message || err);
});
