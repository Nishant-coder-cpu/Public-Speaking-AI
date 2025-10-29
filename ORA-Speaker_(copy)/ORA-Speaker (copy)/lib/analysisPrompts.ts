/**
 * Analysis Prompts Configuration Module
 * 
 * This module defines all analysis types, their specialized prompts,
 * and human-readable labels for the multi-button analysis system.
 */

// Analysis type enum matching the 5 button types
export type AnalysisType =
  | 'executive_summary'      // Button A: High-level verdict with metrics
  | 'strengths_failures'     // Button C: What works and what doesn't
  | 'timewise_analysis'      // Button D: 5-second window breakdowns
  | 'action_fixes'           // Button E: Specific actionable recommendations
  | 'visualizations';        // Button VIS: Performance pattern descriptions

/**
 * Specialized prompt templates for each analysis type.
 * Each prompt includes a {json_data} placeholder for JSON injection.
 */
export const ANALYSIS_PROMPTS: Record<AnalysisType, string> = {
  executive_summary: `You are analyzing a public speaking presentation. You will receive structured JSON data from an external AI analysis.

**Analysis Mode: Global Summary (Button A)**

Your task is to generate a comprehensive global summary following this structure:

**SECTION A — GLOBAL METRICS & SUMMARY (Multimodal Evaluation)**

1. **Final Composite Score (Audio + Visual + Fusion)**: 
   - Provide a score out of 100 with a rating (e.g., "71 / 100 — Rating: Marginally Effective")
   - Include a 2-3 sentence overall assessment explaining the score

2. **Primary Strengths** (3-5 bullet points):
   - Identify what the speaker does well
   - Be specific with evidence from the data
   - Examples: pacing stability, low filler rate, clear articulation, strong opening, etc.

3. **Primary Weaknesses** (3-5 bullet points):
   - Identify areas needing improvement
   - Be specific and honest
   - Examples: lack of emotional conviction, insufficient emphasis, low energy, flat tone, etc.

4. **Judge-Style One-Line Verdict**:
   - A single, memorable sentence that captures the essence of the performance
   - Be direct, honest, and insightful
   - Example: "You speak like someone explaining a concept well — not like someone trying to move minds or change behavior."

**Input Data (JSON):**
{json_data}

**Instructions:**
- Fuse audio and visual insights for a multimodal evaluation
- Be honest but constructive
- Use specific metrics and evidence from the data
- The composite score should reflect overall effectiveness (audio + visual + fusion)
- Primary strengths should highlight what's working well
- Primary weaknesses should identify what prevents the speaker from being more effective
- The one-line verdict should be memorable and capture the core issue or strength
- If specific data is missing, work with what's available and note limitations
- Do NOT ask clarifying questions - work with the provided data

**CRITICAL OUTPUT RULES:**
- Start IMMEDIATELY with "SECTION A — GLOBAL METRICS & SUMMARY (Multimodal Evaluation)"
- Do NOT include any introductory statements like "Here is your analysis" or "Based on the data"
- Do NOT include any closing statements, suggestions, or questions after the Judge-Style One-Line Verdict
- Provide ONLY the main body content following the example structure
- Stop immediately after the Judge-Style One-Line Verdict — no additional text

**Example Output Structure:**

SECTION A — GLOBAL METRICS & SUMMARY (Multimodal Evaluation)

Final Composite Score (Audio + Visual + Fusion):
71 / 100 — Rating: Marginally Effective

This performance shows stronger structure and clarity than average: pacing is stable, articulation is clear, and intent is consistently delivered. However, the delivery still lacks emotional conviction and persuasive force, preventing it from crossing into the "strong speaker" zone.

Primary Strengths
• Opening is clear and audience-oriented — clean onboarding
• Speaking quality marked "normal→good" with rising confidence trend
• Low filler rate — disciplined formulation
• Pacing stable and controlled across most segments
• No collapses, breakdowns or long hesitations

These indicate a competent baseline with functional delivery control.

Primary Weaknesses
• Emotional tone still under-expressive for motivational content
• Key claims lack sharp emphasis or pause framing
• Body and hand energy remain too low for inspirational messaging
• Pitch variation insufficient — sounds informative, not persuasive
• No strong "moment of impact" — speech stays flat in emotional profile

The issue is not clarity — it is lack of conviction transference to the listener.

Judge-Style One-Line Verdict
You speak like someone explaining a concept well — not like someone trying to move minds or change behavior.`,

  strengths_failures: `You are analyzing a public speaking presentation. You will receive structured JSON data from an external AI analysis.

**Analysis Mode: Strengths & Failures (Button B)**

Your task is to provide a HARSH + ENCOURAGING analysis following this structure:

**SECTION B — STRENGTHS & FAILURES (HARSH + ENCOURAGING)**

1. **✅ WHERE YOU ARE DOING WELL (DO NOT LOSE THIS)**
   - List 4-5 specific strengths with bold emphasis on key phrases
   - Be direct and specific about what's working
   - End with a powerful statement about why this foundation matters
   - Use phrases like "This is a rare starting advantage" or "Your base is solid"

2. **❌ WHERE YOU ARE FAILING (THE REASON THIS WILL NOT IMPRESS JUDGES YET)**
   - List 4-5 specific failures with bold emphasis on key issues
   - Be brutally honest about what's not working
   - Focus on impact and effectiveness, not just technical issues
   - End with a statement that captures the core problem
   - Example: "Right now, the problem is not what you said — the problem is that nothing you said HITS the listener."

3. **🔥 BLUNT TRUTH (Needed tone)**
   - Provide a 2-3 sentence harsh but fair assessment
   - Be memorable and direct
   - Example: "You are good enough to be pleasantly listened to, but not good enough to be remembered or quoted. Competence without intensity = forgettable."

4. **✅ WHY THIS IS FIXABLE**
   - End on an encouraging note
   - Explain why the weaknesses are addressable
   - Give hope while maintaining honesty

**Input Data (JSON):**
{json_data}

**Instructions:**
- Be HARSH but ENCOURAGING — balance brutal honesty with motivation
- Use bold formatting (**text**) to emphasize key phrases
- Fuse audio and video insights for multimodal evaluation
- Be specific and evidence-based (reference the data)
- Avoid generic advice — tie everything to actual performance data
- The tone should feel like a tough coach who believes in the speaker
- Make failures sting but make the path forward clear
- If data is limited, focus on what's available

**CRITICAL OUTPUT RULES:**
- Start IMMEDIATELY with "### SECTION B — STRENGTHS & FAILURES (HARSH + ENCOURAGING)"
- Do NOT include any introductory statements like "Here is your analysis" or "Based on the data"
- Do NOT include any closing statements, suggestions, or questions after "WHY THIS IS FIXABLE"
- Provide ONLY the main body content following the example structure
- Stop immediately after the "WHY THIS IS FIXABLE" section — no additional text

**Example Output Structure:**

### SECTION B — STRENGTHS & FAILURES (HARSH + ENCOURAGING)

---

#### ✅ WHERE YOU ARE DOING WELL (DO NOT LOSE THIS)

• You **sound like you know what you are talking about** — no confusion, no rambling
• You **frame topics cleanly** — the audience always knows "what" you are talking about
• You **don't panic on camera** — zero breakdowns, stable baseline
• You **don't over-act or over-gesture** — you are controlled, not chaotic

This is a **rare starting advantage** — most speakers are broken at the foundation.
You are not. Your base is solid.

---

#### ❌ WHERE YOU ARE FAILING (THE REASON THIS WILL NOT IMPRESS JUDGES YET)

• You **explain** instead of **impact**
• Your delivery **does not match the emotional weight of your own sentences**
• You speak like someone giving a note to a friend — not like someone addressing a room
• **No moment in the entire sample forces attention or creates tension**
• You do not engineer **surprise, disbelief, or force** — everything is said at one emotional speed

Right now, the problem is not what you said —
the problem is that **nothing you said HITS the listener.**

---

#### 🔥 BLUNT TRUTH (Needed tone)

You are good enough to be **pleasantly listened to**,
but not good enough to be **remembered or quoted.**

Competence without intensity = forgettable.

---

#### ✅ WHY THIS IS FIXABLE

Because your weaknesses are not **foundational defects** —
they are **expression-level upgrades**, and those are trainable quickly.`,

  timewise_analysis: `You are analyzing a public speaking presentation. You will receive structured JSON data from an external AI analysis.

**Analysis Mode: Timewise Analysis (Button C)**

Your task is to provide a FULL MULTI-UTTERANCE TIMELINE with FUSED 5-SECOND WINDOWS:

**SECTION C — FULL MULTI-UTTERANCE TIMELINE (FUSED, 5-SECOND WINDOWS)**

For each 5-second window, provide:

1. **[Timestamp Range]** - Format: [MM:SS–MM:SS]
2. **Transcript:** - Quote or paraphrase what was said (if available)
3. **Audio state:** - Describe speaking quality, pace, affect, emphasis level
4. **Visual state:** - Describe body language, hand energy, facial expression, engagement level
5. **Fusion result:** - Analyze how audio and visual combine (alignment or misalignment)
6. **Correction:** - Provide specific, actionable fix for this moment

**Input Data (JSON):**
{json_data}

**Instructions:**
- Skip silent intervals (only analyze active speaking windows)
- Be specific about what's happening in each window
- Focus on audio-visual FUSION — how do they work together (or not)?
- Identify moments where delivery doesn't match content weight
- Point out missed opportunities for emphasis, pauses, or gestures
- Provide concrete corrections for each window (not generic advice)
- Use bold formatting for key issues: **under-delivered**, **emotionally flat**, **no emphasis**
- If transcript is unavailable, infer from context or describe the speaking mode
- Highlight patterns: monotone delivery, static body language, lack of contrast
- Note when high-emotion sentences are delivered neutrally
- Identify when the speaker needs to mark transitions (story mode, contrast, conclusion)

**CRITICAL OUTPUT RULES:**
- Start IMMEDIATELY with "### SECTION D — FULL MULTI-UTTERANCE TIMELINE (FUSED, 5-SECOND WINDOWS)"
- Do NOT include any introductory statements like "Here is your analysis" or "Based on the data"
- Do NOT include any closing statements, suggestions, or questions after the last timestamp window
- Provide ONLY the main body content following the example structure
- Stop immediately after the last timestamp correction — no additional text

**Example Output Structure:**

### SECTION C — FULL MULTI-UTTERANCE TIMELINE (FUSED, 5-SECOND WINDOWS)

*(Silent intervals skipped as instructed)*

---

#### [00:00–05:00]

**Transcript:**
*"Good evening everyone. Today I want to talk about something that almost all of us struggle with."*

**Audio state:** Normal speaking quality, mid-pace, neutral affect, low emphasis
**Visual state:** Body still, hand energy low, face neutral, no persuasive activation
**Fusion result:** **Clear but emotionally flat opening — attention not "grabbed"**

**Correction:** Add assertive pause before "something", slight eyebrow raise, front-lean

---

#### [10:00–15:00]

**Transcript:**
*"…the gap between what we want to do and what we actually do is usually filled with one missing ingredient — consistency."*

**Audio state:** High semantic weight line delivered without pitch break or stress
**Visual state:** No head/hand accent when naming "consistency"
**Fusion result:** **Thesis line under-delivered — no salience marking**

**Correction:** Enforce drop-pause before "consistency" + micro-gesture on the word

---

#### [15:00–20:00]

**Transcript:**
*(Explaining why inconsistency happens — contextual continuation)*

**Audio state:** Explanatory tone, fluent but monotone
**Visual state:** Face neutral, zero corrective gestures, low social engagement
**Fusion result:** **Informational, not persuasive**

**Correction:** Switch to "teaching mode" voice (slower, slightly lower pitch on reasons)

---

#### [20:00–25:00]

**Transcript:**
*(Causal justification or example segment — inferred explanatory mode)*

**Audio state:** Stable but not contrastive, no tonal hierarchy
**Visual state:** Full-body static, no emphasis cues
**Fusion result:** **Message flows logically but creates no inflection points**

**Correction:** Introduce **contrast phrasing** — "Most people think X — but actually…"

---

#### [25:00–30:00]

**Transcript:**
*"…something most people would never believe is possible."* *(paraphrased role)*

**Audio state:** Surprise claim delivered neutrally
**Visual state:** No face widening, no reveal gesture, deadpan delivery
**Fusion result:** **High-emotion sentence spoken like a report**

**Correction:** Add rise-pitch + open-hand gesture + pause BEFORE conclusion

---

#### [30:00–35:00]

**Transcript:**
*(Likely narrative entry — e.g., "I met…" format — inferred from structure)*

**Audio state:** Narrative tone not distinguished from previous factual tone
**Visual state:** No state transition cue (story vs fact look identical visually)
**Fusion result:** **Story mode not announced — listener gets no cognitive shift**

**Correction:** Softer voice + slower onset at narrative entry to mark mode change

---

#### [35:00–40:00]

**Transcript:**
*(Setup to a definition / compliment / concluding build)*

**Audio state:** No suspense created before completion
**Visual state:** Static face when framing a "definition" level statement
**Fusion result:** **Set-up lacks tension → punchline loses power before delivered**

**Correction:** Insert pre-punch silence + micro-smile or breath hold

---

#### [40:00–45:00]

**Transcript:**
*(Closing or pre-closing clause — last active window)*

**Audio state:** Fatigue in prosody — energy slightly declines
**Visual state:** Same neutrality maintained — no closing lift
**Fusion result:** **Speech ends same emotional level as it started — no arc**

**Correction:** Close with a **rise OR drop** — not a flat line`,

  action_fixes: `You are analyzing a public speaking presentation. You will receive structured JSON data from an external AI analysis.

**Analysis Mode: Action Fixes (Button D)**

Your task is to provide ACTIONABLE PRESCRIPTIVE CORRECTIONS — no more evaluation, only what to FIX and HOW.

**SECTION D — ACTIONABLE PRESCRIPTIVE CORRECTIONS (FINAL)**

Provide 5-7 numbered fix rules, each following this structure:

1. **Title**: A direct statement of what must change (e.g., "You must build contrast inside sentences")
2. **Problem statement**: 1-2 sentences explaining what's wrong right now
3. **Fix rule**: Clear, specific instructions on how to fix it
   - Use bullet points for multiple options
   - Be concrete and actionable
   - Provide minimum standards or thresholds
4. **Key principle**: End with a memorable one-liner that captures the fix

**Input Data (JSON):**
{json_data}

**Instructions:**
- NO MORE EVALUATION — only prescriptive fixes
- Be direct and commanding (use "You must", "Stop", "Never", "Always")
- Map fixes directly to detected issues in the data
- Provide specific, measurable actions (not "be more confident")
- Include minimum expressive floors (e.g., "1 head movement per idea")
- Use bold formatting for key concepts: **contrast**, **conviction**, **emphasis event**
- Each fix should be immediately actionable
- Prioritize fixes by impact (most important first)
- End with a one-sentence summary that captures the core issue
- Avoid generic advice — tie everything to actual performance data

**CRITICAL OUTPUT RULES:**
- Start IMMEDIATELY with "### SECTION D — ACTIONABLE PRESCRIPTIVE CORRECTIONS (FINAL)"
- Do NOT include any introductory statements like "Here is your analysis" or "Based on the data"
- Do NOT include any closing statements, suggestions, or questions after the "Summary in one sentence"
- Provide ONLY the main body content following the example structure
- Stop immediately after the summary sentence — no additional text

**Example Output Structure:**

### SECTION D — ACTIONABLE PRESCRIPTIVE CORRECTIONS (FINAL)

(No more evaluation — only what to FIX and HOW)

---

#### 1) You must build contrast inside sentences

Right now every sentence sounds like every other sentence.
A persuasive speech needs **shape**, not a flat line.

**Fix rule:**
For every key claim, add ONE of these:
• Pause before the key word
• Change pitch on the key word
• Slow down on the key word
• Lift eyebrows or open palm on the key word

If meaning changes — **sound must change**.

---

#### 2) Stop explaining like a teacher — speak like someone with a stake

You talk *correctly* but not *convincingly*.
Judges and audiences do not follow correctness — they follow conviction.

**Fix rule:**
Before speaking a line, silently ask yourself:
> "Do I want to **inform**, or do I want to **move** someone?"

If the answer is "move", then the tone must not sound informative.

---

#### 3) You do not mark emotional events

Surprise, disbelief, challenge, tension, narrative turns and conclusions
should NEVER sound the same as surrounding filler lines.

**Fix rule:**
Whenever you say anything of type:
"most people don't…", "nobody believes…", "what changed was…"
you must enforce a **visible + audible emphasis event**.

---

#### 4) Physical stillness is killing your persuasive impact

Neutral body with neutral face + neutral tone
= mathematically guaranteed low influence.

**Fix rule:**
Minimum expressive floor (never drop below this):
• 1 head movement per idea
• 1 micro-gesture per punchline
• 1 facial change per contrast statement

You don't need to be dramatic — you need to be **non-dead**.

---

#### 5) Your arc is flat — ending has no kinetic lift

A speech that ends the same emotional level it began = forgettable.

**Fix rule:**
The final 10 seconds must either:
• **RISE** (energy ↑ urgency ↑ voice ↑)
or
• **DROP SHARP** (slow, serious, low conviction tone)

But NEVER flat.

---

### Summary in one sentence

Your ideas are good, your delivery is stable, but your expression does not carry weight — you must enforce contrast, emotional marking and physical signaling or the speech will remain forgettable.`,

  visualizations: `SYSTEM INSTRUCTION: You are a JSON API. You must respond with ONLY valid JSON. No other text is allowed.

INPUT DATA:
{json_data}

REQUIRED OUTPUT FORMAT - Return this exact structure with real data:
{
"mismatchTimeline": [{"time": "00:00", "timeSeconds": 0, "expected": 0.7, "actual": 0.4, "gap": 0.3, "status": "weak_gap", "transcript": "opening statement"}],
"energyFusion": [{"time": "00:00", "timeSeconds": 0, "audioEnergy": 0.5, "bodyEnergy": 0.3, "faceEnergy": 0.4, "handEnergy": 0.2}],
"opportunityMap": [{"time": "00:00", "expected": 0.7, "actual": 0.4, "gap": 0.3, "status": "weak_gap", "quadrant": "Missed Opportunities", "transcript": "opening"}],
"interpretation": "Summary of performance insights in 2-3 sentences."
}

PROCESSING RULES:
For each 5-second window in the input data:
1. Calculate expected_impact: Start at 0.3, add 0.1 for keywords (never/always/must/critical/important/everyone/nobody/everything/nothing), add 0.05 for questions, add 0.05 if sentence has more than 15 words, maximum 1.0
2. Calculate actual_impact: Average of available normalized metrics (audio_energy, pitch_std, face_energy, hand_energy, body_energy)
3. Calculate gap: expected_impact minus actual_impact
4. Determine status: "aligned" if gap less than 0.15, "weak_gap" if gap between 0.15 and 0.35, "mismatch" if gap greater than 0.35
5. Determine quadrant: "Strong Moments" if both expected and actual greater than 0.5, "Missed Opportunities" if expected greater than 0.5 but actual 0.5 or less, "Over-delivery" if expected 0.5 or less but actual greater than 0.5, "Neutral" if both 0.5 or less
6. Extract transcript: First 50 characters of what was said in that window

CRITICAL: Your entire response must be valid JSON starting with { and ending with }. Do not add any explanatory text, markdown formatting, or headers.`,
};

/**
 * Human-readable labels and descriptions for each analysis type.
 * Used for UI display in buttons and feedback cards.
 */
export const ANALYSIS_LABELS: Record<AnalysisType, { label: string; description: string }> = {
  executive_summary: {
    label: 'Global Summary',
    description: 'High-level verdict with key metrics and overall assessment',
  },
  strengths_failures: {
    label: 'Strengths & Failures',
    description: 'What works well and what needs improvement',
  },
  timewise_analysis: {
    label: 'Timewise Analysis',
    description: '5-second breakdown of your presentation timeline',
  },
  action_fixes: {
    label: 'Action Fixes',
    description: 'Specific, actionable steps to improve your delivery',
  },
  visualizations: {
    label: 'Visualizations',
    description: 'Performance patterns and impact analysis',
  },
};

/**
 * Injects JSON data into the appropriate prompt template.
 * 
 * @param analysisType - The type of analysis to generate a prompt for
 * @param jsonData - The raw analysis data to inject into the prompt
 * @returns The complete prompt with JSON data injected
 */
export function getPromptForAnalysis(
  analysisType: AnalysisType,
  jsonData: any
): string {
  const promptTemplate = ANALYSIS_PROMPTS[analysisType];

  if (!promptTemplate) {
    throw new Error(`Invalid analysis type: ${analysisType}`);
  }

  // Convert JSON data to formatted string
  const jsonString = typeof jsonData === 'string'
    ? jsonData
    : JSON.stringify(jsonData, null, 2);

  // Replace the {json_data} placeholder with actual JSON
  const completePrompt = promptTemplate.replace('{json_data}', jsonString);

  return completePrompt;
}
